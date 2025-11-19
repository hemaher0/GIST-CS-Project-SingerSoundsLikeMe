import json
import uuid
import time
from kafka_client import get_producer, get_consumer

# Create producer and consumer
producer = get_producer()
consumer = get_consumer("voice-embedding", "test-search-group")

# Create and send search request
request_id = str(uuid.uuid4())
search_request = {
    "command": "search",
    "request_id": request_id,
    "input_path": "./input/test.mp3",
    "gender": "male",
    "k": 5,
    "category": "all",
}


producer.produce("voice-embedding", json.dumps(search_request).encode("utf-8"))
producer.flush()
print(f"Sending search request with ID: {request_id}")

while True:
    m = consumer.poll(1.0)
    if m and m.key() == request_id.encode():
        resp = json.loads(m.value().decode())
        print("Search response:", json.dumps(resp, indent=2))
        break
