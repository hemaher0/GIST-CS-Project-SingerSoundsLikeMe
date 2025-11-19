import os
import time
import json
import uuid
from fastapi import FastAPI, HTTPException, Request, WebSocket, WebSocketDisconnect
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager

from utils.config import UPLOAD_DIR, CONVERTED_DIR, ALLOWED_ORIGINS
from utils.kafka_client import get_producer, get_consumer, SeparateRequest, MatchRequest
from routers.auth import router as auth_router
from routers.list import router as list_router
from routers.match import router as match_router
from routers.uploads import router as uploads_router
from routers.users import router as user_router
from routers.convert import router as convert_router


class ConnectionManager:
    def __init__(self):
        self.active: dict[str, list[WebSocket]] = {}

    async def connect(self, request_id: str, ws: WebSocket):
        await ws.accept()
        self.active.setdefault(request_id, []).append(ws)

    def disconnect(self, request_id: str, ws: WebSocket):
        self.active[request_id].remove(ws)
        if not self.active[request_id]:
            del self.active[request_id]

    async def send(self, request_id: str, message: dict):
        for ws in self.active.get(request_id, []):
            await ws.send_json(message)


manager = ConnectionManager()


@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.producer = get_producer()
    app.state.manager = manager
    yield


app = FastAPI(lifespan=lifespan)

SEP_TOPIC = os.getenv("KAFKA_VOCAL_SEPARATION_TOPIC", "vocal-separation")
MATCH_TOPIC = os.getenv("KAFKA_VOICE_EMBEDDING_TOPIC", "voice-embedding")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers with prefixes and tags
app.include_router(auth_router, prefix="/api", tags=["Auth"])
app.include_router(uploads_router, prefix="/api", tags=["Uploads"])
app.include_router(match_router, prefix="/api", tags=["Match"])
app.include_router(user_router, prefix="/api", tags=["Users"])
app.include_router(list_router, prefix="/api", tags=["Lists"])
app.include_router(convert_router, prefix="/api", tags=["Convert"])

# @app.post("/api/separate/")
# async def separate(req: SeparateRequest):
#     request_id = str(uuid.uuid4())
#     payload = {"id": request_id, "mp3_path": req.mp3_path}
#     try:
#         producer.produce(
#             SEP_TOPIC,
#             key=request_id.encode(),
#             value=json.dumps(payload).encode()
#         )
#         producer.flush()
#     except Exception as e:
#         raise HTTPException(500, f"Failed to send to Kafka: {e}")

#     consumer = get_consumer(SEP_TOPIC, group_id=f"sync-sep-{request_id}")
#     deadline = time.time() + 300

#     while time.time() < deadline:
#         msg = consumer.poll(1.0)
#         if msg and msg.key() == request_id.encode():
#             resp = json.loads(msg.value().decode())
#             consumer.close()
#             return resp

#     consumer.close()
#     raise HTTPException(504, "Timeout waiting for separation response")



@app.websocket("/ws/match/{request_id}")
async def websocket_match(request_id: str, ws: WebSocket):
    await app.state.manager.connect(request_id, ws)
    try:
        while True:
            await ws.receive_text()
    except WebSocketDisconnect:
        app.state.manager.disconnect(request_id, ws)


@app.websocket("/ws/convert/{request_id}")
async def websocket_convert(request_id: str, ws: WebSocket):
    await app.state.manager.connect(request_id, ws)
    try:
        while True:
            await ws.receive_text()
    except WebSocketDisconnect:
        app.state.manager.disconnect(request_id, ws)


__all__ = ["app", "manager"]

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="127.0.0.1", port=8000)
