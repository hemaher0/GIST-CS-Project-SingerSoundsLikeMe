import os
import json
import re
import subprocess
from concurrent.futures import ThreadPoolExecutor, as_completed
import argparse
import logging
from dotenv import find_dotenv, load_dotenv
from pathlib import Path
import soundfile as sf
import librosa

logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
logger = logging.getLogger(__name__)

env_path = find_dotenv()
load_dotenv(env_path)
project_root = Path(env_path).parent

data_dir = (project_root / os.getenv("DATA_DIR")).resolve()
data_dir.mkdir(parents=True, exist_ok=True)

separated_dir = data_dir / "separated"
separated_dir.mkdir(parents=True, exist_ok=True)

sampled_dir = data_dir / "sampled"
sampled_dir.mkdir(parents=True, exist_ok=True)


def already_failed(record, failure_list):
    for r in failure_list:
        if r == record:
            return True
    return False


def convert_mp3_to_wav(mp3_path, wav_path):
    subprocess.run(
        ["ffmpeg", "-y", "-i", str(mp3_path), str(wav_path)],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
        stdin=subprocess.DEVNULL,  # 이 줄이 핵심!
    )


def sample_vocals(
    vocals_rel: Path,
    input_dir: Path,
    output_dir: Path,
    min_duration: float = 3.0,
    max_duration: float = 5.0,
    num_samples: int = 10,
    top_db: int = 40,
):
    wav_path = None

    try:
        # mp3 → wav
        mp3_path = input_dir / vocals_rel
        if not mp3_path.exists():
            logger.warning(f"File {mp3_path} not found.")
            return []
        wav_path = mp3_path.with_suffix(".wav")
        convert_mp3_to_wav(mp3_path, wav_path)

        y, sr = librosa.load(wav_path, sr=None)

        selected_clips = []
        clip_min = int(sr * min_duration)
        clip_max = int(sr * max_duration)
        top_db_current = top_db

        while True:
            intervals = librosa.effects.split(y, top_db=top_db_current)
            intervals = [(s, e) for s, e in intervals if (e - s) >= clip_min]
            if not intervals:
                break

            remaining = num_samples - len(selected_clips)
            chosen = sorted(
                intervals, key=lambda seg: (seg[1], -(seg[1] - seg[0])), reverse=True
            )[:remaining]

            for start, end in chosen:
                if len(selected_clips) >= num_samples:
                    break
                actual_len = min(end - start, clip_max)
                if actual_len < clip_min:
                    continue

                clip = y[start : start + actual_len]
                clip_path = (
                    output_dir / f"{vocals_rel.stem}_{str(start // sr).zfill(5)}s.wav"
                )
                if clip_path.exists():
                    continue
                sf.write(clip_path, clip, sr)
                selected_clips.append((clip_path, start / sr))

            if len(selected_clips) >= num_samples or top_db <= 10:
                break
            top_db_current -= 10
        if len(selected_clips) == 0:
            logger.warning(f"{vocals_rel}: no segment ≥{min_duration}s, skip.")
        elif len(selected_clips) < num_samples:
            logger.warning(
                f"{vocals_rel}: only {len(selected_clips)} out of {num_samples} clips were extracted. "
                f"Try increasing lowering --num-samples."
            )
        else:
            logger.info(
                f"{vocals_rel}: successfully extracted {len(selected_clips)} clips."
            )

        return selected_clips

    except Exception as e:
        logger.error(f"Error processing {vocals_rel}: {e}")
        return []
    finally:
        if wav_path and wav_path.exists():
            wav_path.unlink()


def process(args):
    batch_index = args.batch_index
    min_duration = args.min_duration
    max_duration = args.max_duration
    num_samples = args.num_samples
    top_db = args.top_db

    dl_file = data_dir / f"metadata_downloaded_batch_{batch_index}.jsonl"
    meta_out = data_dir / f"metadata_processed_batch_{batch_index}.jsonl"
    failures_out = data_dir / f"processing_failures_batch_{batch_index}.jsonl"

    logger.info(f"Processing batch {batch_index}...")

    downloaded_batch = [json.loads(line) for line in dl_file.open(encoding="utf-8")]
    logger.info(f"Batch {batch_index}: {len(downloaded_batch)} downloaded records.")

    batch_stems = set()
    for record in downloaded_batch:
        rel = record["mp3_path"].removeprefix("downloads/")
        vocals_rel = Path(rel).with_name(Path(rel).stem + "_vocals.mp3")
        batch_stems.add(vocals_rel.stem)

    pattern = re.compile(r"^(.*)_\d{5}s\.wav$")
    sampled_stems = set()
    for f in sampled_dir.iterdir():
        if not f.is_file() or f.suffix != ".wav":
            continue
        m = pattern.match(f.name)
        if m:
            sampled_stems.add(m.group(1))

    to_sample = []
    for record in downloaded_batch:
        rel = record["mp3_path"].removeprefix("downloads/")
        vocals_rel = Path(rel).with_name(Path(rel).stem + "_vocals.mp3")
        stem = vocals_rel.stem
        if stem in batch_stems and stem not in sampled_stems:
            to_sample.append((vocals_rel, record))
    unique = {}
    for vocals_rel, record in to_sample:
        key = vocals_rel.as_posix()
        if key not in unique:
            unique[key] = record
    to_sample = [(Path(k), v) for k, v in unique.items()]

    logger.info(f"Batch {batch_index}: {len(to_sample)} files to sample.")

    mf = meta_out.open("w", encoding="utf-8")
    failures = []
    try:
        for f in sampled_dir.iterdir():
            if not f.is_file() or f.suffix != ".wav":
                continue
            m = pattern.match(f.name)
            if not m:
                continue
            stem = m.group(1)
            if stem not in batch_stems:
                continue
            t = int(f.stem.rsplit("_", 1)[-1].replace("s", ""))
            mf.write(
                json.dumps(
                    {"clip_path": str(f.relative_to(sampled_dir)), "start_time": t},
                    ensure_ascii=False,
                )
                + "\n"
            )

        executor = ThreadPoolExecutor()
        futures = {}
        for rel, record in to_sample:
            if (separated_dir / rel).exists():
                fut = executor.submit(
                    sample_vocals,
                    rel,
                    separated_dir,
                    sampled_dir,
                    min_duration=min_duration,
                    max_duration=max_duration,
                    num_samples=num_samples,
                    top_db=top_db,
                )
                futures[fut] = record
            else:
                logger.warning(f"File {rel} not found in {separated_dir}.")
                if not already_failed(record, failures):
                    failures.append(record)

        for future in as_completed(futures):
            record = futures[future]
            try:
                clips = future.result()
                if clips:
                    for clip_path, start_time in clips:
                        entry = {
                            "clip_path": str(clip_path.relative_to(sampled_dir)),
                            "start_time": start_time,
                        }
                        mf.write(json.dumps(entry, ensure_ascii=False) + "\n")
                else:
                    if not already_failed(record, failures):
                        failures.append(record)
            except Exception as e:
                logger.error(f"Error processing {record}: {e}")
                if not already_failed(record, failures):
                    failures.append(record)

    finally:
        executor.shutdown(wait=True)
        mf.close()
        if failures:
            with failures_out.open("w", encoding="utf-8") as ff:
                for item in failures:
                    ff.write(json.dumps(item, ensure_ascii=False) + "\n")
        else:
            if failures_out.exists():
                failures_out.unlink()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Process audio files in batches.")
    parser.add_argument(
        "--batch-indices",
        type=int,
        nargs="+",
        default=[1],
        help="Batch indices to process",
    )
    parser.add_argument(
        "--min-duration",
        type=int,
        default=3,
        help="Duration of each sample in seconds.",
    )
    parser.add_argument(
        "--max-duration",
        type=int,
        default=5,
        help="Duration of each sample in seconds.",
    )
    parser.add_argument(
        "--num-samples", type=int, default=10, help="Number of samples to extract."
    )
    parser.add_argument(
        "--top-db", type=int, default=40, help="Top dB for silence detection."
    )
    args = parser.parse_args()
    for idx in args.batch_indices:
        args.batch_index = idx
        logger.info(f"Processing batch {idx}...")
        process(args)
