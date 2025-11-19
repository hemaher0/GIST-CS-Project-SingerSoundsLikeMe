import os
import uuid
import json
import logging
from kafka_client import get_producer

# Configure logging
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger("voice-conversion-test")

# Get Kafka producer
topic = os.getenv("KAFKA_VOICE_CONVERSION_TOPIC", "voice-conversion")
producer = get_producer()


# Construct test message payload
def create_test_payload():
    return {
        "id": str(uuid.uuid4()),
        "source": "./examples/source/source_s1.wav",
        "target": "./examples/reference/s1p1.wav",
        "output": "./test_output",
        "diffusion_steps": 30,
        "length_adjust": 1.0,
        "inference_cfg_rate": 0.7,
        "f0_condition": False,
        "auto_f0_adjust": False,
        "semi_tone_shift": 0,
        "checkpoint": None,
        "config": None,
        "fp16": True,
    }


if __name__ == "__main__":
    payload = create_test_payload()
    key = payload["id"].encode("utf-8")
    value = json.dumps(payload).encode("utf-8")

    # Send to Kafka topic
    producer.produce(topic, key=key, value=value)
    producer.flush()
    logger.info(f"Sent test payload to topic '{topic}': {payload}")
    print(f"Test message sent to Kafka topic '{topic}'. ID: {payload['id']}")
