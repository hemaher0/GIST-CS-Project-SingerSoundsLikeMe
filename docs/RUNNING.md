# Running Guide

Prepare the model files, audio data, and search database, align the paths for each service, then start the local environment with Docker Compose.

## 1. Prepare the environment and files

- **GPU runtime:** Set up Docker Compose and NVIDIA GPU container support. Model services use `runtime: nvidia`, and embedding search runs with CUDA and GPU FAISS.
- **Audio data:** Use recordings you have permission to use, together with singer and track CSV files, to prepare `datasets/metadata.jsonl`, separated vocals, and sampled segments. The repository's CSV files provide a starting point for organizing the recordings and preprocessing outputs.
- **Vocal separation model:** Place `MelBandRoformer.ckpt` in `CHECKPOINT_DIR`. The host path in the local Compose configuration is `services/vocal-separation/checkpoints/`.
- **Voice conversion model:** Prepare the [Seed-VC](https://github.com/Plachtaa/seed-vc) model files and an environment that can download them. The conversion Dockerfile clones the Seed-VC repository during the build.
- **Search database:** Prepare `segment_db_{gender}.npz`, `track_db_{gender}.npz`, and `artist_db_{gender}.npz`, where `gender` is `all`, `male`, or `female`. The search service reads these files from `DB_DIR` to build its indexes.

## 2. Configure data and paths

The [local Compose configuration](../docker-compose-local.yml) uses the host's `datasets/` directory by default. Setting `DATA_DIR` on the host changes the mounted data path.

| Item | Paths and preparation |
| --- | --- |
| Search database output and lookup | The database builder writes gender-split files to `DATA_DIR`, while search reads them from `DB_DIR`. With the default Compose setup, place the generated split databases in the host's `datasets/db/`, mounted at `/app/db` in the container, or otherwise align the output and lookup paths. |
| Database build entry point | Use the implementation at `services/voice-embedding/voice_embedding/build_db.py` rather than the path referenced by `scripts/build_all_db.sh`. Set both `DATA_DIR` and `DB_DIR` in the build environment. |
| Conversion metadata and vocals | The conversion worker reads `INPUT_DIR/metadata.jsonl` and `INPUT_DIR/separated/`. By default, Compose mounts the host's `datasets/` at `/app/input` in the container. |
| Conversion model version | The Dockerfile does not pin the Seed-VC clone to a specific version. Pin the repository version and model files when reproducing the environment. |

### Preprocessing and database build sequence

1. **Set up the data directory:** Add `DATA_DIR=./datasets` to `.env` in the repository root, then create `downloads/`, `separated/`, `sampled/`, and `db/` beneath that directory. To preprocess on the host, install each service's Python dependencies and FFmpeg.
2. **Link audio and metadata:** Place the original MP3 files in `downloads/` and associate `id`, `artist_name`, `track_name`, and `mp3_path` in `metadata_downloaded_batch_{number}.jsonl`. Set `mp3_path` relative to the data directory, such as `downloads/filename.mp3`, and follow the database builder's `slugify(artist_name, track_name)` filename convention. Prepare singer information in `artists.csv`.
3. **Separate vocals:** The batch entry point is [vocal_separation/core/process.py](../services/vocal-separation/vocal_separation/core/process.py). From `services/vocal-separation/`, run `python -m vocal_separation.core.process`, setting `--input_jsonl` to the batch JSONL, `--input_dir` to the data directory, and `--output_dir` to `separated/`. Select a GPU with an argument such as `--device_ids 0`. Set `INPUT_DIR`, `OUTPUT_DIR`, `CHECKPOINT_DIR`, and `CONFIG_DIR` in the execution environment, and place `MelBandRoformer.ckpt` and `config_kj.yaml` in their respective model and configuration directories. The output vocals are saved as `original_filename_vocals.mp3`.
4. **Extract vocal segments:** From the repository root, specify the batch numbers to process, for example with `python scripts/sampling_audio.py --batch-indices 1`. The script reads the batch JSONL and `separated/`, then writes WAV segments to `sampled/` and generates `metadata_processed_batch_{number}.jsonl`.
5. **Merge metadata:** Use [merge_metadata.py](../scripts/merge_metadata.py) to combine recording information and sample paths into `metadata.jsonl`. The current script reads batches 1–10 and deletes the source batch JSONL files after merging. Keep copies of the input files before running it, and check that the batch range in the code matches your prepared data.
6. **Build the search database:** In the embedding environment, set `DATA_DIR` to the prepared data directory and `DB_DIR` to its `db/` subdirectory. Run `python services/voice-embedding/voice_embedding/build_db.py` from the repository root. Place the generated gender-split NPZ files at the lookup path described in the table above, then start the search service.

See the [technical notes](TECHNICAL_NOTES.md) for representative vector aggregation rules.

## 3. Start the local services

After checking the files and paths, run this command from the repository root:

```bash
docker compose -f docker-compose-local.yml up --build
```

This configuration starts PostgreSQL, Kafka, the FastAPI backend, and all three model services. Nginx serves the frontend on host port 80.

## Using the service

1. Sign up or sign in through the web interface.
2. Upload or record audio, then select the recording to search.
3. Press Match and review the singer candidates.
4. On the conversion screen, choose the input recording and target singer.
5. Once conversion finishes, press Play to listen to the result.
