from fastapi import APIRouter, Depends, HTTPException, status, Request, BackgroundTasks
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from utils.db import query, query_one, execute
from utils.login import decode_access_token
from utils.dependencies import oauth2_scheme
from utils.config import UPLOAD_DIR
import uuid, json, os, time
from typing import List

topic = os.getenv("KAFKA_VOICE_EMBEDDING_TOPIC", "voice-embedding")
BACKEND_URL = os.getenv("BACKEND_URL")

router = APIRouter(prefix="/match", tags=["Match"])


async def send_kafka(app, payload: dict):
    producer = app.state.producer
    producer.produce(
        topic,
        key=payload["request_id"].encode(),
        value=json.dumps(payload).encode("utf-8"),
    )
    producer.flush()


class MatchRequestModel(BaseModel):
    input_paths: List[str]
    gender: str = "all"
    category: str = "all"
    k: int = 5


class StoreMatchResultModel(BaseModel):
    request_id: str
    status: str
    results: list


@router.post("/", summary="Send voice embedding requests")
async def match_uploaded_files(
    body: MatchRequestModel,
    background: BackgroundTasks,
    request: Request,
    token: str = Depends(oauth2_scheme),
):
    user_id = decode_access_token(token)
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token"
        )

    if not body.input_paths:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="No input paths provided"
        )

    request_ids = []
    for url in body.input_paths:
        # resolve file path
        filename = url.split("/")[-1]
        path = UPLOAD_DIR / filename
        if not path.exists():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"File not found: {filename}",
            )
        rid = str(uuid.uuid4())
        payload = {
            "command": "search",
            "request_id": rid,
            "user_id": user_id,
            "input_path_url": f"{BACKEND_URL}/uploads/{filename}",
            "gender": body.gender,
            "category": body.category,
            "k": body.k,
            "timestamp": int(time.time() * 1000),
        }
        # queue Kafka send
        background.add_task(send_kafka, request.app, payload)
        # save to DB
        execute(
            """
            INSERT INTO match_requests (id, user_id, input_path, gender, category, k, status, created_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s, now())
            """,
            (
                rid,
                user_id,
                str(path.resolve()),
                body.gender,
                body.category,
                body.k,
                "pending",
            ),
        )
        request_ids.append(rid)

    return JSONResponse({"status": "ok", "data": {"request_ids": request_ids}})


@router.get("/status/{request_id}/", summary="Check match request status")
async def get_match_status(request_id: str, token: str = Depends(oauth2_scheme)):
    user_id = decode_access_token(token)
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token"
        )
    row = query_one(
        "SELECT status FROM match_requests WHERE id = %s AND user_id = %s",
        (request_id, user_id),
    )
    if not row:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Request not found"
        )
    return JSONResponse(
        {"status": "ok", "data": {"request_id": request_id, "status": row["status"]}}
    )


@router.get("/history/", summary="List match request history by current user")
async def list_match_history(token: str = Depends(oauth2_scheme)):
    user_id = decode_access_token(token)
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token"
        )
    rows = query(
        """
        SELECT id::text AS request_id, input_path, status, created_at, completed_at
        FROM match_requests
        WHERE user_id = %s
        ORDER BY created_at DESC
        """,
        (user_id,),
    )
    return JSONResponse({"status": "ok", "data": rows})


@router.get("/result/{request_id}/", summary="Get match result by request_id")
async def get_match_result(request_id: str, token: str = Depends(oauth2_scheme)):
    user_id = decode_access_token(token)
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token"
        )
    row = query_one(
        "SELECT results FROM match_requests WHERE id = %s AND user_id = %s",
        (request_id, user_id),
    )
    if not row:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Request not found"
        )
    if row.get("results") is None:
        raise HTTPException(
            status_code=status.HTTP_204_NO_CONTENT, detail="Result not ready"
        )
    return JSONResponse({"status": "ok", "data": row["results"]})


@router.post("/result/", summary="Receive match result from worker")
async def store_match_result(
    payload: StoreMatchResultModel,
    request: Request,
):
    if payload.status not in ("ok", "error"):
        raise HTTPException(status_code=400, detail="Invalid status")

    execute(
        """
        UPDATE match_requests
           SET status = %s,
               results = %s,
               completed_at = now()
         WHERE id = %s
        """,
        (payload.status, json.dumps(payload.results), payload.request_id),
    )
    manager = request.app.state.manager
    await manager.send(
        payload.request_id,
        {"status": payload.status, "results": payload.results},
    )

    return JSONResponse({"status": "ok"})
