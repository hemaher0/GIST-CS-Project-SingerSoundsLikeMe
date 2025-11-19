import os
from pydantic import BaseModel
from confluent_kafka import Consumer, Producer

KAFKA_BROKER = os.getenv("KAFKA_BOOTSTRAP_SERVERS", "kafka:29092")


class SeparateRequest(BaseModel):
    mp3_path: list[str]


class MatchRequest(BaseModel):
    input_path: str
    gender: str = "all"
    k: int = 5
    category: str = "all"


def get_consumer(topic: str, group_id: str) -> Consumer:
    consumer_conf = {
        "bootstrap.servers": KAFKA_BROKER,
        "group.id": group_id,
        "auto.offset.reset": "latest",
        "reconnect.backoff.ms": 500,
        "reconnect.backoff.max.ms": 10000,
        "retry.backoff.ms": 500,
    }
    consumer = Consumer(consumer_conf)
    consumer.subscribe([topic])
    return consumer


def get_producer() -> Producer:
    producer_conf = {
        "bootstrap.servers": KAFKA_BROKER,
        "message.send.max.retries": 1000000,
        "retry.backoff.ms": 500,
    }
    return Producer(producer_conf)
