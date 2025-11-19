import json, uuid, time
from kafka_client import get_producer, get_consumer

producer = get_producer()
consumer = get_consumer("voice-embedding", "test-db-group")

request_id = str(uuid.uuid4())
msg = {
    "command": "db-build",
    "request_id": request_id,
    "target": "all",
    "reps_per_track": 10,
    "reps_per_artist": 10,
}
producer.produce("voice-embedding", value=json.dumps(msg).encode("utf-8"))
producer.flush()
print(f"Sent db-build request {request_id}")

while True:
    m = consumer.poll(1.0)
    if m and m.key() == request_id.encode():
        resp = json.loads(m.value().decode())
        print("DB Build response:", resp)
        break
