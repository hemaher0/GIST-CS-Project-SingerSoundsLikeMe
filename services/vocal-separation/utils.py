import os
from pathlib import Path

ckpt_path = Path(os.getenv("CHECKPOINT_DIR", "./checkpoints")).resolve()
ckpt_path.mkdir(parents=True, exist_ok=True)
CKPT_FILE = ckpt_path / "MelBandRoformer.ckpt"

input_dir = Path(os.getenv("INPUT_DIR", "./input")).resolve()
input_dir.mkdir(parents=True, exist_ok=True)

output_dir = Path(os.getenv("OUTPUT_DIR", "./output")).resolve()
output_dir.mkdir(parents=True, exist_ok=True)

log_dir = Path(os.getenv("LOG_DIR", "./logs")).resolve()
log_dir.mkdir(parents=True, exist_ok=True)
log_file = log_dir / "vocal_separation.log"


def download_model():
    url = "https://huggingface.co/KimberleyJSN/melbandroformer/resolve/main/MelBandRoformer.ckpt"
    if not CKPT_FILE.exists():
        print(f"Downloading model...")
        os.system(f"wget {url} -O {CKPT_FILE}")
        print("Download complete.")
    else:
        print("Model already exists.")
