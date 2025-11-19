import os
import json
import re
import logging
from dotenv import find_dotenv, load_dotenv
from pathlib import Path

logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
logger = logging.getLogger(__name__)

env_path = find_dotenv()
load_dotenv(env_path)
project_root = Path(env_path).parent

data_dir = (project_root / os.getenv("DATA_DIR")).resolve()
data_dir.mkdir(parents=True, exist_ok=True)

meta_downloaded = []
for i in range(1, 11):
    batch_file = data_dir / f"metadata_downloaded_batch_{i}.jsonl"
    with open(batch_file, "r", encoding="utf-8") as f:
        for line in f:
            meta_downloaded.append(json.loads(line))
    batch_file.unlink()

downloaded_all_path = data_dir / "metadata_downloaded.jsonl"
with open(downloaded_all_path, "w", encoding="utf-8") as f:
    for rec in meta_downloaded:
        f.write(json.dumps(rec, ensure_ascii=False) + "\n")
logger.info(f"Saved combined downloaded metadata to {downloaded_all_path}")

meta_processed = []
for i in range(1, 11):
    batch_file = data_dir / f"metadata_processed_batch_{i}.jsonl"
    with open(batch_file, "r", encoding="utf-8") as f:
        for line in f:
            meta_processed.append(json.loads(line))
    batch_file.unlink()

processed_all_path = data_dir / "metadata_processed.jsonl"
with open(processed_all_path, "w", encoding="utf-8") as f:
    for rec in meta_processed:
        f.write(json.dumps(rec, ensure_ascii=False) + "\n")
logger.info(f"Saved combined processed metadata to {processed_all_path}")

pattern = re.compile(r"^(.*)_vocals_(\d{5})s\.wav$")
processed_by_slug = {}
for pr in meta_processed:
    m = pattern.match(pr["clip_path"])
    if not m:
        continue
    pr_slug = m.group(1)
    processed_by_slug.setdefault(pr_slug, []).append(pr["clip_path"])

for record in meta_downloaded:
    slug = re.sub(
        r"\W+", "_", f"{record['artist_name']} {record['track_name']}".lower()
    )

    clip_paths = processed_by_slug.get(slug, [])
    record["sampled_mp3_path"] = clip_paths
    record["num_clip_path"] = len(clip_paths)

with open(data_dir / "metadata.jsonl", "w") as f:
    for record in meta_downloaded:
        f.write(json.dumps(record, ensure_ascii=False) + "\n")
    logging.info(f"Saved combined metadata to {data_dir/'metadata.jsonl'}")
