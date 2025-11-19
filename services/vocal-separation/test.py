import os
import json
import uuid
import time
from kafka_client import get_producer, get_consumer


producer = get_producer()
consumer = get_consumer("vocal-separation", "vocal-separation-test-group")

request_id = str(uuid.uuid4())
msg = {
    "id": request_id,
    "mp3_path": ["test.mp3"],
}
producer.produce(
    "vocal-separation",
    key=request_id.encode("utf-8"),
    value=json.dumps(msg).encode("utf-8"),
)
producer.flush()
print(f"Sent request id={request_id}")

while True:
    m = consumer.poll(1.0)
    if m and m.key() == request_id.encode("utf-8"):
        resp = json.loads(m.value().decode("utf-8"))
        if resp.get("status") in ("ok", "error"):
            print("Received response:", json.dumps(resp, indent=2))
            break
    time.sleep(0.1)
