import os
import torchaudio
import numpy as np
from pathlib import Path
from resemblyzer import VoiceEncoder
import faiss

db_path = Path(os.getenv("DB_DIR")).resolve()

db_map = {
    "segment": "segment_db_{gender}.npz",
    "track": "track_db_{gender}.npz",
    "artist": "artist_db_{gender}.npz",
}

encoder = VoiceEncoder(device="cuda")
gpu_res = faiss.StandardGpuResources()

_db_indices: dict[str, tuple[list[str], faiss.Index]] = {}
for category in ("segment", "track", "artist"):
    for gender in ("all", "male", "female"):
        fname = db_map[category].format(gender=gender)
        db_file = db_path / fname
        if not db_file.exists():
            continue

        data = np.load(db_file, allow_pickle=True)
        if "tracks" in data and "embs" in data:
            names = list(data["tracks"])
            embs = np.stack(data["embs"]).astype(np.float32)
        else:
            names, tmp = [], []
            for name in data.files:
                arr = data[name]
                if arr.ndim == 1:
                    names.append(name)
                    tmp.append(arr)
                else:
                    for v in arr:
                        names.append(name)
                        tmp.append(v)
            embs = np.stack(tmp).astype(np.float32)
        embs /= np.linalg.norm(embs, axis=1, keepdims=True)
        index_cpu = faiss.IndexFlatIP(embs.shape[1])
        index = faiss.index_cpu_to_gpu(gpu_res, 0, index_cpu)
        index.add(embs)

        _db_indices[f"{category}:{gender}"] = (names, index)


def search(input_path: Path, category: str, gender: str, k: int):
    waveform, sr = torchaudio.load(input_path)
    resampler = torchaudio.transforms.Resample(orig_freq=sr, new_freq=16000)
    waveform = resampler(waveform)
    wav = waveform.squeeze().to("cuda").cpu().numpy()
    emb = encoder.embed_utterance(wav).astype(np.float32)
    emb /= np.linalg.norm(emb)

    def _search_one(cat):
        key = f"{cat}:{gender}"
        if key not in _db_indices:
            raise FileNotFoundError(f"No DB for {key}")
        names, index = _db_indices[key]
        dists, idxs = index.search(emb.reshape(1, -1), k * 2)
        seen, results = set(), []
        for idx, score in zip(idxs[0], dists[0]):
            name = names[idx]
            if name in seen:
                continue
            results.append({"name": name, "cosine": float(score)})
            seen.add(name)
            if len(results) >= k:
                break
        return results

    if category == "all":
        return {
            "segments": _search_one("segment"),
            "tracks": _search_one("track"),
            "artists": _search_one("artist"),
        }
    elif category in db_map:
        return _search_one(category)
    else:
        raise ValueError(f"Unsupported category: {category}")
