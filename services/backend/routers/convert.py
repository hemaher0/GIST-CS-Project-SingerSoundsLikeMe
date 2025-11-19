import os
import uuid
import json
import time
from fastapi import (
    APIRouter,
    File,
    UploadFile,
    Form,
    Depends,
    BackgroundTasks,
    Request,
    HTTPException,
    status,
)
import requests
from fastapi.responses import JSONResponse
from utils.db import execute, query_one
from utils.login import decode_access_token
from utils.dependencies import oauth2_scheme
from utils.config import UPLOAD_DIR, CONVERTED_DIR
from utils.kafka_client import get_producer
from pydub import AudioSegment
import logging
from pydantic import BaseModel


logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s: %(message)s",
)
logger = logging.getLogger("backend")

router = APIRouter(prefix="/convert", tags=["Convert"])
TOPIC = os.getenv("KAFKA_VOICE_CONVERSION_TOPIC", "voice-conversion")
BACKEND_URL = os.getenv("BACKEND_URL")


class StoreConvertResultModel(BaseModel):
    request_id: str
    status: str
    result_file: str


async def send_kafka(app, payload: dict):
    producer = app.state.producer
    producer.produce(
        TOPIC,
        key=payload["request_id"].encode("utf-8"),
        value=json.dumps(payload).encode("utf-8"),
    )
    producer.flush()


@router.post("/", summary="Send voice conversion request")
async def convert(
    request: Request,
    background_tasks: BackgroundTasks,
    token: str = Depends(oauth2_scheme),
    file: UploadFile = File(...),
    target_artist: str = Form(...),
):
    user_id = decode_access_token(token)
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token"
        )

    ext = os.path.splitext(file.filename)[1].lower() or ".wav"
    tmp_id = str(uuid.uuid4())
    raw_f = f"{tmp_id}_raw{ext}"
    wav_f = f"{tmp_id}.wav"
    raw_p = os.path.join(UPLOAD_DIR, raw_f)
    wav_p = os.path.join(UPLOAD_DIR, wav_f)

    with open(raw_p, "wb") as f:
        f.write(await file.read())

    if ext != ".wav":
        try:
            audio = AudioSegment.from_file(raw_p)
            audio.export(wav_p, format="wav")
            os.remove(raw_p)
        except Exception as e:
            logger.exception("Audio conversion error")
            raise HTTPException(status_code=500, detail=f"Audio conversion error: {e}")
    else:
        os.rename(raw_p, wav_p)

    # DB 등록
    request_id = str(uuid.uuid4())
    execute(
        """
        INSERT INTO convert_requests
           (id, user_id, source_path, target_path, status, created_at)
        VALUES (%s, %s, %s, %s, %s, now())
        """,
        (request_id, user_id, wav_f, target_artist, "pending"),
    )

    payload = {
        "request_id": request_id,
        "user_id": user_id,
        "source_url": f"{BACKEND_URL}/uploads/{wav_f}",
        "target_artist": target_artist,
        "timestamp": int(time.time() * 1000),
    }
    background_tasks.add_task(send_kafka, request.app, payload)

    return JSONResponse({"status": "ok", "data": {"request_id": request_id}})


@router.post("/result/", summary="Receive conversion result from worker")
async def store_convert_result(
    request: Request,
    request_id: str = Form(...),
    status: str     = Form(...),
    file: UploadFile = File(...)
):
    if status != "ok":
        raise HTTPException(400, "Conversion failed")
    os.makedirs(CONVERTED_DIR, exist_ok=True)
    dest_path = os.path.join(CONVERTED_DIR, file.filename)
    with open(dest_path, "wb") as out:
        out.write(await file.read())
    execute(
        """
        UPDATE convert_requests
           SET status       = %s,
               result_path  = %s,
               completed_at = now()
         WHERE id = %s
        """,
        (status, file.filename, request_id),
    )
    url = f"/converted/{file.filename}"
    await request.app.state.manager.send(request_id, {"status": status, "audioUrl": url})
    return JSONResponse({"status": "ok"})


@router.get("/status/{request_id}/", summary="Check conversion status")
async def get_status(request_id: str, token: str = Depends(oauth2_scheme)):
    user_id = decode_access_token(token)
    row = query_one(
        "SELECT status FROM convert_requests WHERE id = %s AND user_id = %s",
        (request_id, user_id),
    )
    if not row:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Request not found"
        )
    return JSONResponse(
        {"status": "ok", "data": {"request_id": request_id, "status": row["status"]}}
    )


@router.get("/result/{request_id}/", summary="Get conversion result URL")
async def get_result(request_id: str, token: str = Depends(oauth2_scheme)):
    user_id = decode_access_token(token)
    row = query_one(
        "SELECT status, result_path FROM convert_requests WHERE id = %s AND user_id = %s",
        (request_id, user_id),
    )
    if not row:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Request not found"
        )
    if row["status"] != "ok":
        raise HTTPException(
            status_code=status.HTTP_204_NO_CONTENT, detail="Result not ready"
        )
    return JSONResponse(
        {
            "status": "ok",
            "data": {
                "request_id": request_id,
                "audioUrl": f"/converted/{row['result_path']}",
            },
        }
    )
