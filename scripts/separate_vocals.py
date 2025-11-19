import os
import argparse
import subprocess
from pathlib import Path
from dotenv import find_dotenv, load_dotenv

env_path = find_dotenv()
load_dotenv(env_path)
project_root = Path(env_path).parent
data_dir = (project_root / os.getenv("DATA_DIR")).resolve()
script_dir = Path(project_root / "services/vocal-separation").resolve()
main_script = script_dir / "main.py"

parser = argparse.ArgumentParser(description="Separate vocals from audio files.")
parser.add_argument("--batch-index", type=int, help="Batch index to process")
args = parser.parse_args()


input_jsonl = data_dir / f"metadata_to_separated_batch_{args.batch_index}.jsonl"
if not input_jsonl.exists():
    raise FileNotFoundError(f"Input JSONL file not found: {input_jsonl}")
print(f"Processing batch {args.batch_index} → {input_jsonl}")

command = [
    "python3",
    str(main_script),
    "--input_jsonl",
    str(input_jsonl),
    "--input_dir",
    str(data_dir),
    "--output_dir",
    str(data_dir / "separated"),
    "--device_ids",
    "0",
]

subprocess.run(command, check=True)
input_jsonl.unlink()
