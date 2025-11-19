import os
import uuid
import json
import torch
import logging
import requests
import tempfile
import shutil
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor

from kafka_client import get_consumer, get_producer
from vocal_separation.core.process import process_track
from utils import input_dir, output_dir, log_file

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
    handlers=[logging.FileHandler(log_file), logging.StreamHandler()],
)
logger = logging.getLogger("vocal-separation")

consumer = get_consumer("vocal-separation", "vocal-separation-group")
producer = get_producer()
executor = ThreadPoolExecutor(max_workers=2)
USE_TMP = os.getenv("USE_TMP_WORKFLOW", "1") == "1"


def process_task(data: dict):
    request_id = data.get("id") or str(uuid.uuid4())
    key = request_id.encode("utf-8")

    if USE_TMP:
        tmp_in = Path(tempfile.mkdtemp(prefix=f"sep_in_{request_id}_"))
        tmp_out = Path(tempfile.mkdtemp(prefix=f"sep_out_{request_id}_"))
        in_dir, out_dir = tmp_in, tmp_out
    else:
        in_dir, out_dir = input_dir, output_dir
        in_dir.mkdir(parents=True, exist_ok=True)
        out_dir.mkdir(parents=True, exist_ok=True)

    result_status = "ok"
    outputs = []
    error_msg = None

    try:
        local_paths = []
        for p in data["mp3_path"]:
            if isinstance(p, str) and p.lower().startswith(("http://", "https://")):
                resp = requests.get(p, timeout=30)
                resp.raise_for_status()
                fname = os.path.basename(p)
                dst = in_dir / fname
                with dst.open("wb") as f:
                    f.write(resp.content)
                local_paths.append(str(dst))
            else:
                src = Path(p)
                if not src.is_file():
                    src = Path(os.getenv("INPUT_DIR", input_dir)) / p
                dst = in_dir / src.name
                shutil.copy(src, dst)
                local_paths.append(str(dst))

        device_ids = list(range(torch.cuda.device_count()))
        use_cpu = len(device_ids) == 0

        tracks = [{"mp3_path": p} for p in local_paths]
        process_track(tracks, in_dir, out_dir, device_ids, use_cpu=use_cpu)
        logger.info(f"[{request_id}] Processed tracks: {local_paths}")

        for p in local_paths:
            stem = Path(p).stem
            wav_file = out_dir / f"{stem}.wav"
            if wav_file.exists():
                outputs.append(str(wav_file))

    except Exception as e:
        logger.exception(f"[{request_id}] Error processing")
        result_status = "error"
        error_msg = str(e)
    finally:
        shutil.rmtree(in_dir, ignore_errors=True)

    payload = {"id": request_id, "status": result_status}
    if outputs:
        payload["output_paths"] = outputs
    if error_msg:
        payload["error"] = error_msg

    producer.produce(
        "vocal-separation", key=key, value=json.dumps(payload).encode("utf-8")
    )
    producer.flush()
    logger.info(f"[{request_id}] (bg) Response sent: {result_status}")


def start_consumer():
    logger.info("Vocal Separation Consumer started. Waiting for messages…")
    try:
        while True:
            msg = consumer.poll(1.0)
            if msg is None or msg.error():
                continue

            raw = msg.value().decode("utf-8")
            try:
                data = json.loads(raw)
            except json.JSONDecodeError:
                logger.error(f"Invalid payload: {raw!r}")
                consumer.commit(msg)
                continue

            if data.get("status") is not None or "mp3_path" not in data:
                consumer.commit(msg)
                continue

            consumer.commit(msg)
            logger.info(f"Offset committed, delegating to bg worker: {data}")
            executor.submit(process_task, data)

    except KeyboardInterrupt:
        logger.info("Shutting down…")
    finally:
        consumer.close()
        executor.shutdown(wait=True)
        producer.flush()
        logger.info("Consumer closed.")


if __name__ == "__main__":
    start_consumer()
