import os
import json
import logging
import re
import time
import random
from pathlib import Path
import pandas as pd
from concurrent.futures import ThreadPoolExecutor, ProcessPoolExecutor, as_completed
from yt_dlp import YoutubeDL
from urllib.parse import quote_plus
from dotenv import find_dotenv, load_dotenv

env_path = find_dotenv()
load_dotenv(env_path)
project_root = Path(env_path).parent

data_dir = (project_root / os.getenv("DATA_DIR")).resolve()
download_dir = data_dir / "downloads"
separated_dir = data_dir / "separated"
config_dir = (project_root / os.getenv("CONFIG_DIR")).resolve()
log_dir = (project_root / os.getenv("LOG_DIR")).resolve()

for d in [data_dir, download_dir, separated_dir, config_dir, log_dir]:
    d.mkdir(parents=True, exist_ok=True)

log_file = log_dir / "app.log"

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
    handlers=[logging.FileHandler(log_file), logging.StreamHandler()],
)
logger = logging.getLogger(__name__)

metadata_input = data_dir / "artist_songs.csv"
metadata_searched = data_dir / "artist_songs_searched.jsonl"
metadata_searched_failed = data_dir / "artist_songs_searched_failed.jsonl"


def slugify(record: str) -> str:
    slug = re.sub(
        r"\W+", "_", f"{record['artist_name']} {record['track_name']}".lower()
    )
    return slug


def search_youtube(query: str) -> str | None:
    search_query = quote_plus(query)
    ydl_opts = {
        "quiet": True,
        "skip_download": True,
        "extract_flat": "in_playlist",
        "force_generic_extractor": True,
        "default_search": "ytsearch",
    }
    cookiesfile = config_dir / "cookies.txt"
    if cookiesfile.exists():
        ydl_opts["cookiefile"] = str(cookiesfile)
    for attempt in range(1, 5):
        try:
            with YoutubeDL(ydl_opts) as ydl:
                info = ydl.extract_info(f"ytsearch1:{search_query}", download=False)
            entries = info.get("entries") or []
            for e in entries:
                url = e.get("webpage_url") or e.get("url")
                if url and "watch?v=" in url:
                    return url
            break
        except Exception as e:
            logger.warning(f"yt-dlp search failed: {query} -> {e}")
            if attempt < 3:
                time.sleep(attempt)
            else:
                return None
    return None


def get_youtube_url(record: dict) -> tuple[dict, str | None]:
    query = f"{record['artist_name']} {record['track_name']} official"
    url = search_youtube(query)
    if url is None:
        track_name = record["track_name"]
        track_name = re.sub(r"\(.*?\)", "", track_name)
        track_name = re.sub(r"[^A-Za-z0-9가-힣\s]", "", track_name)
        query = f"{record['artist_name']} {track_name} official"
        url = search_youtube(query)
    return record, url


def search(args):
    df = pd.read_csv(metadata_input)
    df = df[df["num_artists"] == 1].reset_index(drop=True)
    
    searched_set = set()
    if metadata_searched.exists():
        with metadata_searched.open(encoding="utf-8") as f:
            for line in f:
                r = json.loads(line)
                key = (r["artist_name"], r["track_name"])
                searched_set.add(key)
                
    records = [
        r for r in df.to_dict(orient="records")
        if (r["artist_name"], r["track_name"]) not in searched_set
    ]
    logger.info(f"{len(records)} new records to search (skipped {len(searched_set)} already searched)")

    failed = 0
    with (
        ProcessPoolExecutor(max_workers=args.jobs) as executor,
        metadata_searched.open("a", encoding="utf-8") as f,
        metadata_searched_failed.open("a", encoding="utf-8") as f_failed,
    ):
        for idx, (record, url) in enumerate(executor.map(get_youtube_url, records), 1):
            record["youtube_url"] = url

            if url:
                logger.info(
                    f"[{idx}/{len(records)}] {record['artist_name']} - {record['track_name']} → {url or 'Not found'}"
                )
                f.write(json.dumps(record, ensure_ascii=False) + "\n")
            else:
                failed += 1
                logger.warning(
                    f"[{idx}/{len(records)}] {record['artist_name']} - {record['track_name']} → Not found"
                )
                f_failed.write(json.dumps(record, ensure_ascii=False) + "\n")
    logger.info("Search complete.")
    if metadata_searched_failed.exists() and not failed:
        metadata_searched_failed.unlink()


def is_already_separated(record: dict) -> bool:
    slug = slugify(record)
    stem = (separated_dir / slug).stem
    vocals = separated_dir / f"{stem}_vocals.mp3"
    instrumentals = separated_dir / f"{stem}_instrumental.mp3"
    return vocals.exists() and instrumentals.exists()


def is_already_downloaded(record: dict) -> bool:
    slug = slugify(record)
    return (download_dir / f"{slug}.mp3").exists()


def download(args):
    batch_index = args.batch_index
    batch_size = args.batch_size
    all_records = [
        json.loads(line) for line in metadata_searched.open(encoding="utf-8")
    ]

    total = len(all_records)
    start = (batch_index - 1) * batch_size
    end = start + batch_size
    batch = all_records[start:end]

    metadata_out = data_dir / f"metadata_downloaded_batch_{batch_index}.jsonl"
    failures_out = data_dir / f"download_failures_batch_{batch_index}.jsonl"

    results, failures = [], []
    to_download = []

    for record in batch:
        slug = slugify(record)
        mp3_file = download_dir / f"{slug}.mp3"

        if is_already_separated(record):
            logger.info(
                f"Already separated: {record['artist_name']} - {record['track_name']}"
            )
            record["mp3_path"] = str(mp3_file.relative_to(data_dir))
            results.append(record)
            continue

        if mp3_file.exists():
            logger.info(
                f"Already downloaded: {record['artist_name']} - {record['track_name']}"
            )
            record["mp3_path"] = str(mp3_file.relative_to(data_dir))
            results.append(record)
            continue

        to_download.append(record)

    logger.info(
        f"Batch {batch_index}: {len(to_download)} to download, {len(results)} already downloaded."
    )
    with ThreadPoolExecutor(max_workers=args.jobs) as executor:
        # fmt: off
        futures = {}
        for record in to_download:
            slug = slugify(record)
            output_path = download_dir / slug
            logger.info(f"Downloading: {record['artist_name']} - {record['track_name']} ({record['youtube_url']})")
            futures[executor.submit(download_audio, record["youtube_url"], output_path)] = record
        for fut in as_completed(futures):
            record = futures[fut]
            mp3 = fut.result()
            if mp3:
                time.sleep(random.uniform(1, 3))
                record["mp3_path"] = str(Path(mp3).relative_to(data_dir))
                results.append(record)
            else:
                failures.append(
                    {
                        "artist_name": record["artist_name"],
                        "track_name": record["track_name"],
                        "youtube_url": record["youtube_url"],
                        "expected_mp3_path": str(download_dir / re.sub(r"\W+", "_", f"{record['artist_name']} {record['track_name']}".lower()))+".mp3",
                    }
                )
        # fmt: on

    with metadata_out.open("w", encoding="utf-8") as f:
        for record in results:
            f.write(json.dumps(record, ensure_ascii=False) + "\n")
    if failures:
        with failures_out.open("w", encoding="utf-8") as f:
            for record in failures:
                f.write(json.dumps(record, ensure_ascii=False) + "\n")
    else:
        failures_out.unlink(missing_ok=True)

    logger.info(
        f"Download batch {batch_index}/{(total+batch_size-1)//batch_size} complete: {len(results)} downloaded, {len(failures)} failures."
    )


def download_audio(youtube_url: str, output_base: Path) -> Path | None:
    ydl_opts = {
        "format": "bestaudio/best",
        "outtmpl": str(output_base) + ".%(ext)s",
        "quiet": True,
        "postprocessors": [
            {
                "key": "FFmpegExtractAudio",
                "preferredcodec": "mp3",
            }
        ],
    }
    cookiesfile = config_dir / "cookies.txt"
    if cookiesfile.exists():
        ydl_opts["cookiefile"] = str(cookiesfile)
    else:
        logger.info("No cookies.txt found. Some audios may not download.")
    with YoutubeDL(ydl_opts) as ydl:
        try:
            ydl.download([youtube_url])
            return output_base.with_suffix(".mp3")
        except Exception as e:
            logger.error(f"Download failed: {youtube_url} -> {e} output_path")
            return None


def list_to_separate(args):
    batch_index = args.batch_index
    in_file = data_dir / f"metadata_downloaded_batch_{batch_index}.jsonl"
    out_file = data_dir / f"metadata_to_separated_batch_{batch_index}.jsonl"

    records = [json.loads(line) for line in in_file.open(encoding="utf-8")]
    to_separate = []
    for record in records:
        slug = slugify(record)
        mp3_file = download_dir / f"{slug}.mp3"

        if mp3_file.exists() and not is_already_separated(record):
            record["mp3_path"] = str(mp3_file.relative_to(data_dir))
            to_separate.append(record)

    logger.info(f"Batch {batch_index}: {len(to_separate)} tracks to separate.")
    if to_separate:
        with out_file.open("w", encoding="utf-8") as f:
            for record in to_separate:
                f.write(json.dumps(record, ensure_ascii=False) + "\n")
    else:
        out_file.unlink(missing_ok=True)
    logger.info(f"Batch {batch_index}: Tracks list to separate saved to {out_file}")


def main():
    import argparse

    parser = argparse.ArgumentParser(description="Pipeline: search → download")
    subparsers = parser.add_subparsers(dest="command", required=True)

    sp_search = subparsers.add_parser("search", help="Search for YouTube URLs")
    sp_search.add_argument("--jobs", type=int, default=4, help="Number of parallel jobs")

    sp_download = subparsers.add_parser("download", help="Download audio files")
    sp_download.add_argument("--batch-indices", type=int, nargs="+", default=[1], help="Batch indices to process")
    sp_download.add_argument("--batch-size", type=int, default=500, help="Batch size")
    sp_download.add_argument("--jobs", type=int, default=4, help="Jobs")

    args = parser.parse_args()

    if args.command == "search":
        search(args)
    elif args.command == "download":
        for idx in args.batch_indices:
            args.batch_index = idx
            download(args)
            list_to_separate(args)


if __name__ == "__main__":
    main()
