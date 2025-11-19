import os
import json
import uuid
import tempfile
import logging
import requests
import shutil
import random
from pathlib import Path

from concurrent.futures import ThreadPoolExecutor
from argparse import Namespace
from kafka_client import get_consumer
from inference import main as inference_main

topLevelTopic = os.getenv("KAFKA_VOICE_CONVERSION_TOPIC", "voice-conversion")
groupId = os.getenv("KAFKA_VOICE_CONVERSION_GROUP", "voice-conversion-group")
maxWorkers = int(os.getenv("MAX_WORKERS", "2"))
INPUT_DIR = os.getenv("INPUT_DIR", "/app/datasets/")
BACKEND_URL = os.getenv("BACKEND_URL", "http://backend:8000")
SEPARATED_DIR = Path(INPUT_DIR) / "separated"
METADATA_PATH = Path(INPUT_DIR) / "metadata.jsonl"

consumer = get_consumer(topLevelTopic, groupId)
executor = ThreadPoolExecutor(max_workers=maxWorkers)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s: %(message)s",
)
logger = logging.getLogger("voice-conversion")


def download_source(src_url: str) -> str:
    resp = requests.get(src_url, stream=True, timeout=(5, 30))
    resp.raise_for_status()
    suffix = os.path.splitext(src_url)[1] or ".wav"
    fd, tmp_path = tempfile.mkstemp(suffix=suffix)
    with os.fdopen(fd, "wb") as f:
        for chunk in resp.iter_content(64 * 1024):
            f.write(chunk)
    return tmp_path


def pick_target_from_artist(artist_name: str) -> str:
    try:
        with open(METADATA_PATH, "r") as f:
            records = [
                json.loads(line)
                for line in f
                if artist_name.lower() in json.loads(line).get("artist_name", "").lower()
            ]
    except Exception as e:
        logger.error(f"Failed to load metadata or parse JSONL: {e}")
        return None
    
    if not records:
        logger.warning(f"No tracks found for artist: {artist_name}")
        return None
    
    chosen = random.choice(records)
    mp3_path = chosen["mp3_path"]
    base = os.path.splitext(os.path.basename(mp3_path))[0]
    return SEPARATED_DIR/f"{base}_vocals.mp3"

def run_conversion(data: dict) -> (str, str, str):
    temp_out_dir = tempfile.mkdtemp()
    defaults = {
        "diffusion_steps": 30,
        "length_adjust": 1.0,
        "inference_cfg_rate": 0.7,
        "f0_condition": False,
        "auto_f0_adjust": False,
        "semi_tone_shift": 0,
        "checkpoint": None,
        "config": None,
        "fp16": True,
        "output": temp_out_dir,
    }
    for k, v in defaults.items():
        data.setdefault(k, v)

    args = Namespace(**data)
    inference_main(args)

    src_base = os.path.splitext(os.path.basename(args.source))[0]
    tgt_base = os.path.splitext(os.path.basename(args.target))[0]
    fname = f"vc_{src_base}_{tgt_base}_{args.length_adjust}_{args.diffusion_steps}_{args.inference_cfg_rate}.wav"
    temp_result_path = os.path.join(temp_out_dir, fname)
    if not os.path.exists(temp_result_path):
        raise RuntimeError(f"Conversion output not found: {temp_result_path}")
    return fname, temp_result_path, temp_out_dir


def process_message(data: dict):
    request_id = data.get("request_id") or str(uuid.uuid4())
    logger.info(f"[{request_id}] Start processing")
    tmp_src = None
    temp_out_dir = None
    temp_result_path = None 
    try:
        src_url = data.pop("source_url", None)
        if src_url:
            tmp_src = download_source(src_url)
            data["source"] = tmp_src
            
        target_artist = data.pop("target_artist", None)
        if target_artist:
            selected_target_path = pick_target_from_artist(target_artist)
            if selected_target_path:
                data["target"] = selected_target_path
            else:
                logger.error(f"[{request_id}] No valid track found for singer '{target_artist}'")
                raise RuntimeError("No valid target found.")
        else:
            logger.warning(f"[{request_id}] No target_singer provided.")
            raise RuntimeError("Missing target_singer")
        fname, temp_result_path, temp_out_dir = run_conversion(data)
        status = "ok"
    except Exception as e:
        logger.exception(f"[{request_id}] Conversion failed")
        status = "error"
        fname = ""
        temp_result_path = None

    url = f"{BACKEND_URL}/api/convert/result/"
    
    try:
        if status == "ok" and temp_result_path and os.path.exists(temp_result_path):
            with open(temp_result_path, "rb") as f:
                files = {
                    "file": (fname, f, "audio/wav")
                }
                data_form = {
                    "request_id": request_id,
                    "status": status
                }
                resp = requests.post(url, data=data_form, files=files, timeout=(5, 30))
                resp.raise_for_status()
                logger.info(f"[{request_id}] Callback POST {resp.status_code}")
        else:
            resp = requests.post(
                url,
                data={"request_id": request_id, "status": status},
                files={"file": ("error.wav", b"", "application/octet-stream")},
                timeout=(5, 30),
            )
            logger.info(f"[{request_id}] Error callback POST {resp.status_code}")
    except Exception as e:
        logger.error(f"[{request_id}] Callback error: {e}")

    if tmp_src and os.path.exists(tmp_src):
        os.remove(tmp_src)
    if temp_out_dir and os.path.exists(temp_out_dir):
        shutil.rmtree(temp_out_dir)


if __name__ == "__main__":
    while True:
        msg = consumer.poll(1.0)
        if msg is None or msg.error():
            continue
        raw = msg.value().decode("utf-8")
        try:
            data = json.loads(raw)
        except json.JSONDecodeError:
            consumer.commit(msg)
            continue
        if data.get("status") is not None:
            consumer.commit(msg)
            continue
        consumer.commit(msg)
        logger.info(f"[{data.get('request_id','?')}] Delegated to worker")
        executor.submit(process_message, data)
