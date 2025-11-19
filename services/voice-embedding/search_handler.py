import os
import requests
import tempfile
from pathlib import Path
import voice_embedding.search as vs

BACKEND_URL = os.getenv("BACKEND_URL")


def handle_message(data: dict):
    try:
        import json

        raw_input = data.get("input_path_url") or data.get("input_path")
        raw_input = raw_input.replace("http://backend-service", BACKEND_URL)

        if raw_input and raw_input.startswith(("http://", "https://")):
            filename = os.path.basename(raw_input)
            tmp_dir = tempfile.gettempdir()
            local_fp = Path(tmp_dir) / f"{data.get('request_id')}_{filename}"
            resp = requests.get(raw_input, timeout=30)
            resp.raise_for_status()
            with local_fp.open("wb") as f:
                f.write(resp.content)
            input_path = str(local_fp)
        else:
            input_path = raw_input

        category = data.get("category", "all")
        gender = data.get("gender", "all")
        k = int(data.get("k", 5))
        request_id = data.get("request_id", "unknown")

        if not input_path:
            return {
                "status": "error",
                "message": "Missing required field: input_path",
                "data": {"request_id": request_id},
            }

        results = vs.search(input_path, category, gender, k)

        payload = {
            "status": "ok",
            "message": "Search completed successfully",
            "data": {
                "request_id": request_id,
                "results": results,
            },
        }
        return payload

    except Exception as e:
        return {
            "status": "error",
            "message": f"Exception during search: {str(e)}",
            "data": {"request_id": data.get("request_id", "unknown")},
        }
