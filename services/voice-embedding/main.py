import traceback
import os
import requests
import json
import uuid
import logging
from concurrent.futures import ThreadPoolExecutor
from kafka_client import get_consumer, get_producer
from search_handler import handle_message
from voice_embedding.build_db import (
    build_segment_db,
    split_segment_db,
    build_track_db,
    split_track_db,
    build_artist_db,
    split_artist_db,
    segment_db_path,
    track_db_path,
    artist_db_path,
)

BACKEND_URL = os.getenv("BACKEND_URL")
# Configure logging
logger = logging.getLogger("voice-embedding")
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s"
)

consumer = get_consumer("voice-embedding", "voice-embedding-group")
producer = get_producer()
executor = ThreadPoolExecutor(max_workers=4)


def process_task(data: dict):
    request_id = data.get("request_id") or str(uuid.uuid4())
    command = data.get("command", "")
    key = request_id.encode()

    result = {"command": command, "request_id": request_id}
    try:
        if command == "search":
            logger.info(f"[{request_id}] (bg) Search: {data}")
            res = handle_message(data)
            logger.info(f"[{request_id}] Search result: {res}")

            if res["status"] == "ok":
                results = res["data"]["results"]
                result.update(status="ok", results=results)
                post_body = {
                    "request_id": request_id,
                    "status": "ok",
                    "results": results,
                }
            else:
                err_msg = res.get("message", "Unknown error")
                result.update(status="error", message=err_msg)
                post_body = {
                    "request_id": request_id,
                    "status": "error",
                    "message": res.get("message", "Unknown error"),
                }

            try:
                r = requests.post(
                    f"{BACKEND_URL}/api/match/result/",
                    json=post_body,
                    timeout=10,
                )
                logger.info(f"[{request_id}] POST result => {r.status_code}")
            except Exception as e:
                logger.error(f"[{request_id}] Failed to POST result: {e}")

        elif command == "db-build":
            logger.info(f"[{request_id}] (bg) DB-build: {data}")
            steps = []
            target = data.get("target", "all")
            if target in ("all", "segment"):
                build_segment_db(segment_db_path)
                split_segment_db(segment_db_path)
                steps.append("segment")
            if target in ("all", "track"):
                build_track_db(
                    segment_db_path, track_db_path, data.get("reps_per_track", 10)
                )
                split_track_db(track_db_path)
                steps.append("track")
            if target in ("all", "artist"):
                build_artist_db(
                    track_db_path, artist_db_path, data.get("reps_per_artist", 10)
                )
                split_artist_db(artist_db_path)
                steps.append("artist")
            result.update(status="ok", steps=steps)

        else:
            logger.warning(f"[{request_id}] Unknown command: {command}")
            result.update(status="error", message=f"Unknown command: {command}")

    except Exception as e:
        logger.exception(f"[{request_id}] Exception in {command}")
        result.update(status="error", message=str(e))

    producer.produce(
        "voice-embedding", key=key, value=json.dumps(result).encode("utf-8")
    )
    producer.flush()
    logger.info(f"[{request_id}] Response sent")


def main():
    logger.info("Voice Search Consumer started. Waiting for messages...")
    try:
        while True:
            msg = consumer.poll(1.0)
            if msg is None or msg.error():
                continue

            raw = msg.value().decode("utf-8")
            try:
                data = json.loads(raw)
            except json.JSONDecodeError:
                logger.error(f"Invalid JSON: {raw!r}")
                consumer.commit(msg)
                continue

            if data.get("status") is not None:
                consumer.commit(msg)
                continue

            consumer.commit(msg)
            logger.info(f"Offset committed, delegating to bg worker: {data}")

            executor.submit(process_task, data)

    except KeyboardInterrupt:
        logger.info("Interrupted, shutting down…")
    finally:
        consumer.close()
        executor.shutdown(wait=True)
        producer.flush()
        logger.info("Shutdown complete.")


if __name__ == "__main__":
    main()
