import os
from confluent_kafka import Consumer, Producer

KAFKA_BROKER = os.getenv("KAFKA_BOOTSTRAP_SERVERS", "localhost:9092")


def get_consumer(topic: str, group_id: str) -> Consumer:
    conf = {
        "bootstrap.servers": KAFKA_BROKER,
        "group.id": group_id,
        "auto.offset.reset": "latest",
        "enable.auto.commit": False,
    }
    consumer = Consumer(conf)
    consumer.subscribe([topic])
    return consumer


def get_producer() -> Producer:
    conf = {"bootstrap.servers": KAFKA_BROKER}
    return Producer(conf)
