import os
import json
import shutil
import tempfile
import subprocess
from pathlib import Path
import argparse
from vocal_separation.third_party.zfturbo_music_sep.inference import proc_folder
from typing import Dict

input_dir = Path(os.getenv("INPUT_DIR")).resolve()
input_dir.mkdir(parents=True, exist_ok=True)
output_dir = Path(os.getenv("OUTPUT_DIR")).resolve()
output_dir.mkdir(parents=True, exist_ok=True)
CKPT_FILE = Path(os.getenv("CHECKPOINT_DIR")) / "MelBandRoformer.ckpt"
CONFIG_FILE = Path(os.getenv("CONFIG_DIR")) / "config_kj.yaml"


def convert_wav_to_mp3(wav_path: Path, mp3_path: Path):
    # fmt: off
    subprocess.run([
        "ffmpeg", "-y",
        "-i", str(wav_path),
        "-codec:a", "libmp3lame", "-qscale:a", "2",
        str(mp3_path)
    ], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
    )
    # fmt: on


def process_track(
    tracks,
    input_dir: Path,
    output_dir: Path,
    device_ids: list[int],
    use_cpu: bool = False,
):
    with tempfile.TemporaryDirectory(
        prefix="sep_in_"
    ) as tmp_in, tempfile.TemporaryDirectory(prefix="sep_out_") as tmp_out:
        in_dir = Path(tmp_in)
        out_dir = Path(tmp_out)

        for track in tracks:
            src_mp3 = input_dir / Path(track["mp3_path"])
            dst_mp3 = in_dir / src_mp3.name
            shutil.copy2(src_mp3, dst_mp3)

        proc_folder(
            {
                "input_folder": str(in_dir),
                "config_path": str(CONFIG_FILE),
                "store_dir": str(out_dir),
                "model_type": "mel_band_roformer",
                "start_check_point": str(CKPT_FILE),
                "extract_instrumental": True,
                "use_tta": True,
                "device_ids": device_ids,
                "force_cpu": use_cpu,
            }
        )
        for sub in out_dir.iterdir():
            if not sub.is_dir():
                continue
            base = sub.name

            for kind in ("instrumental", "vocals"):
                wav = sub / f"{kind}.wav"
                if not wav.exists():
                    continue

                mp3 = output_dir / f"{base}_{kind}.mp3"
                convert_wav_to_mp3(wav, mp3)
                wav.unlink()


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--input_jsonl",
        type=str,
        required=True,
    )
    parser.add_argument(
        "--input_dir",
        type=str,
        default=input_dir,
    )
    parser.add_argument(
        "--output_dir",
        type=str,
        default=output_dir,
    )
    parser.add_argument(
        "--chunk_size",
        type=int,
        default=20,
    )
    parser.add_argument(
        "--device_ids", nargs="+", type=int, default=0, help="list of gpu ids"
    )
    args = parser.parse_args()

    jsonl_path = Path(args.input_jsonl)
    input_dir = Path(args.input_dir)
    output_dir = Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    lines = jsonl_path.read_text().splitlines()
    total = len(lines)

    tracks = [json.loads(line) for line in lines]

    for i in range(0, total, args.chunk_size):
        chunk = tracks[i : i + args.chunk_size]
        print(
            f"Processing chunk {i // args.chunk_size + 1} of {total // args.chunk_size + 1}"
        )
        process_track(chunk, input_dir, output_dir, args.device_ids)


if __name__ == "__main__":
    main()
