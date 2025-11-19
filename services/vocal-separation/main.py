from message import start_consumer
from utils import download_model, CKPT_FILE

if __name__ == "__main__":
    if not CKPT_FILE.exists():
        download_model()

    start_consumer()
