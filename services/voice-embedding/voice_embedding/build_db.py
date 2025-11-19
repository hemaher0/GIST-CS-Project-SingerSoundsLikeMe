import os
import json
import librosa
import numpy as np
from pathlib import Path
from resemblyzer import VoiceEncoder
from collections import defaultdict
from concurrent.futures import ProcessPoolExecutor, as_completed
from sklearn.cluster import KMeans
import re
import pandas as pd

data_dir = Path(os.getenv("DATA_DIR")).resolve()
data_dir.mkdir(parents=True, exist_ok=True)
db_dir = Path(os.getenv("DB_DIR")).resolve()
db_dir.mkdir(parents=True, exist_ok=True)
segment_db_path = db_dir / "segment_db.npz"
track_db_path = db_dir / "track_db.npz"
artist_db_path = db_dir / "artist_db.npz"

sampled_dir = data_dir / "sampled"
artist_csv = data_dir / "artists.csv"
metadata_jsonl = data_dir / "metadata.jsonl"

gender_cats = ["all", "male", "female"]

encoder = None


def init_worker():
    global encoder
    encoder = VoiceEncoder()


def slugify(artist: str, track: str) -> str:
    return re.sub(r"\W+", "_", f"{artist} {track}".lower()).strip("_")


def load_gender_map():
    slug_to_id = {}
    with open(metadata_jsonl, "r", encoding="utf-8") as f:
        for line in f:
            rec = json.loads(line)
            slug = slugify(rec["artist_name"], rec["track_name"])
            slug_to_id[slug] = rec.get("id")

    df = pd.read_csv(artist_csv)
    id_gender = dict(zip(df["id"], df["gender"].str.lower()))
    slug_gender = {
        slug: id_gender.get(track_id, "unknown")
        for slug, track_id in slug_to_id.items()
    }

    df["artist_lower"] = df["artist_name"].str.lower()
    artist_gender = dict(zip(df["artist_lower"], df["gender"].str.lower()))
    return slug_gender, artist_gender


def process_file(wav_path):
    wav, sr = librosa.load(wav_path, sr=None)
    wav = librosa.resample(wav, orig_sr=sr, target_sr=16_000)
    emb = encoder.embed_utterance(wav).astype(np.float32)
    return wav_path.stem, emb


def build_segment_db(save_path: Path) -> None:
    paths = sorted(sampled_dir.glob("*_vocals_*.wav"))
    print(f"Embedding {len(paths)} segemnts...")
    with ProcessPoolExecutor(initializer=init_worker) as executor:
        futures = {executor.submit(process_file, p): p for p in paths}
        embs_by_segment = []
        for fut in as_completed(futures):
            embs_by_segment.append(fut.result())
    tracks, embs = zip(*embs_by_segment)
    np.savez_compressed(save_path, tracks=tracks, embs=np.stack(embs))
    print(f"Saved {len(tracks)} segment embeddings to {save_path}")


def split_segment_db(input_path: Path):
    data = np.load(input_path, allow_pickle=True)
    tracks, embs = data["tracks"], data["embs"]
    slug_gender, _ = load_gender_map()
    slugs = [t.split("_vocals_")[0] for t in tracks]
    categories = {
        "all": list(range(len(tracks))),
        "male": [i for i, s in enumerate(slugs) if slug_gender.get(s) == "male"],
        "female": [i for i, s in enumerate(slugs) if slug_gender.get(s) == "female"],
    }
    for cat, idxs in categories.items():
        out_tracks = tracks[idxs]
        out_embs = embs[idxs]
        output_path = data_dir / f"segment_db_{cat}.npz"
        np.savez_compressed(output_path, tracks=out_tracks, embs=out_embs)

        print(f"Saved segment_db_{cat} ({len(tracks)}) to {output_path}")


def build_track_db(input_path: Path, save_path: Path, reps_per_track: int = 10) -> None:
    data = np.load(input_path, allow_pickle=True)
    agg = defaultdict(list)
    for track, emb in zip(data["tracks"], data["embs"]):
        slug = track.split("_vocals_")[0]
        agg[slug].append(emb)

    rep = {}
    for slug, vecs in agg.items():
        arr = np.stack(vecs)
        if arr.shape[0] <= reps_per_track:
            rep[slug] = arr.astype(np.float32)
        else:
            centers = KMeans(n_clusters=reps_per_track, random_state=42).fit(arr)
            rep[slug] = centers.cluster_centers_.astype(np.float32)
    np.savez_compressed(save_path, **rep)
    print(f"Saved {len(rep)} track embeddings to {save_path}")


def split_track_db(input_path: Path):
    data = np.load(input_path, allow_pickle=True)
    slug_gender, _ = load_gender_map()
    categories = {
        "all": list(data.files),
        "male": [s for s in data.files if slug_gender.get(s) == "male"],
        "female": [s for s in data.files if slug_gender.get(s) == "female"],
    }
    for cat, slugs in categories.items():
        out = {s: data[s] for s in slugs}
        out_path = data_dir / f"track_db_{cat}.npz"
        np.savez_compressed(out_path, **out)
        print(f"Saved track_db_{cat} ({len(slugs)}) to {out_path}")


def build_artist_db(
    input_path: Path, save_path: Path, reps_per_artist: int = 10
) -> None:
    data = np.load(input_path, allow_pickle=True)
    slug_to_artist = {}
    with open(metadata_jsonl, "r", encoding="utf-8") as f:
        for line in f:
            rec = json.loads(line)
            slug = slugify(rec["artist_name"], rec["track_name"])
            slug_to_artist[slug] = rec["artist_name"]
    agg = defaultdict(list)
    for slug in data.files:
        artist = slug_to_artist.get(slug)
        if not artist:
            continue
        emb = data[slug].astype(np.float32)
        norms = np.linalg.norm(emb, axis=1, keepdims=True)
        emb = emb / np.clip(norms, a_min=1e-6, a_max=None)
        agg[artist].append(emb)
    rep = {}
    for artist, vecs in agg.items():
        arr = np.vstack(vecs)
        if arr.shape[0] < reps_per_artist:
            emb = arr.mean(axis=0)
            rep[artist] = emb.astype(np.float32)
        else:
            kemans = KMeans(n_clusters=reps_per_artist, random_state=42).fit(arr)
            centers = kemans.cluster_centers_
            norms = np.linalg.norm(centers, axis=1, keepdims=True)
            centers = centers / np.clip(norms, a_min=1e-6, a_max=None)
            rep[artist] = centers.astype(np.float32)
    np.savez_compressed(save_path, **rep)
    print(f"Saved artist_db_all ({len(rep)}) to {save_path}")


def split_artist_db(input_path: Path):
    data = np.load(input_path, allow_pickle=True)
    _, artist_gender = load_gender_map()
    artists = list(data.files)
    categories = {
        "all": artists,
        "male": [a for a in artists if artist_gender.get(a.lower()) == "male"],
        "female": [a for a in artists if artist_gender.get(a.lower()) == "female"],
    }
    for cat, arts in categories.items():
        out = {a: data[a] for a in arts}
        out_path = data_dir / f"artist_db_{cat}.npz"
        np.savez_compressed(out_path, **out)
        print(f"Saved artist_db_{cat} ({len(arts)}) to {out_path}")


if __name__ == "__main__":
    build_segment_db(segment_db_path)
    split_segment_db(segment_db_path)
    build_track_db(segment_db_path, track_db_path)
    split_track_db(track_db_path)
    build_artist_db(track_db_path, artist_db_path)
    split_artist_db(artist_db_path)
