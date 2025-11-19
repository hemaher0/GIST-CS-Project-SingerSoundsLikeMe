import os
import pandas as pd
from spotipy import Spotify
from spotipy.oauth2 import SpotifyClientCredentials
from pathlib import Path
from dotenv import find_dotenv, load_dotenv
import numpy as np
import time

env_path = find_dotenv()
load_dotenv(env_path)

project_root = Path(env_path).parent

data_dir = (project_root / os.getenv("DATA_DIR")).resolve()
data_dir.mkdir(parents=True, exist_ok=True)

# Load environment variables
client_id = os.getenv("SPOTIPY_CLIENT_ID")
client_secret = os.getenv("SPOTIPY_CLIENT_SECRET")

# Spotify API authentication
auth_manager = SpotifyClientCredentials(
    client_id=client_id, client_secret=client_secret
)
sp = Spotify(auth_manager=auth_manager, requests_timeout=10)


def fix_release_date(date_str):
    if pd.isna(date_str) or date_str == "":
        return np.nan

    parts = date_str.split("-")

    if len(parts) == 3:
        year, month, day = parts
        month = month if month else "01"
        day = day if day else "01"
        return f"{year}-{month}-{day}"

    elif len(parts) == 2:
        year, month = parts
        return f"{year}-{month}-01"

    elif len(parts) == 1:
        year = parts[0]
        return f"{year}-01-01"

    return date_str


# Function to crawl top songs
def crawl_songs(df, limit_per_artist=10):
    result = []
    total = len(df)

    for i, (_, row) in enumerate(df.iterrows()):
        artist_id = row["id"]
        try:
            artist_info = sp.artist(artist_id)
            top_tracks = sp.artist_top_tracks(artist_id, country="US")

            print(f"[{i + 1}/{total}] Collecting from: {artist_info['name']}")

            for track in top_tracks["tracks"][:limit_per_artist]:
                print(f"[COLLECTED] {artist_info['name']} - {track['name']}")
                release_date = track["album"]["release_date"]
                release_date = fix_release_date(release_date)
                result.append(
                    {
                        "artist_name": artist_info["name"],
                        "id": artist_id,
                        "track_name": track["name"],
                        "track_url": track["external_urls"]["spotify"],
                        "popularity": track["popularity"],
                        "album_name": track["album"]["name"],
                        "num_artists": len(track["artists"]),
                        "release_date": release_date,
                    }
                )
                time.sleep(0.2)
        except Exception as e:
            print(f"[ERROR] {artist_id}: {e}")
        time.sleep(1)

    return pd.DataFrame(result)


def main():
    # Load artist list
    song_limit = 5000
    artists_path = data_dir / "artists.csv"
    songs_path = data_dir / "artist_songs.csv"
    artists_df = pd.read_csv(artists_path)

    if songs_path.exists():
        existing_songs_df = pd.read_csv(songs_path)
        collected_ids = set(existing_songs_df["id"].unique())

        target_df = artists_df[~artists_df["id"].isin(collected_ids)]
        print(f"Skipped {len(collected_ids)} already collected artists.")
    else:
        existing_songs_df = pd.DataFrame()
        target_df = artists_df

    if target_df.empty:
        print("No new artists to collect.")
        return

    new_songs_df = crawl_songs(target_df)
    new_songs_df = new_songs_df[new_songs_df["num_artists"] == 1]
    new_songs_df = new_songs_df.drop_duplicates(subset=["track_name", "artist_name"])

    all_songs_df = pd.concat([existing_songs_df, new_songs_df], ignore_index=True)
    all_songs_df.sort_values(by="popularity", ascending=False, inplace=True)
    all_songs_df = all_songs_df.drop_duplicates(subset=["track_name", "artist_name"])
    all_songs_df = all_songs_df.head(song_limit)

    # Save results
    all_songs_df.to_csv(songs_path, index=False, encoding="utf-8")
    print(f"Collection completed: saved to → {str(data_dir)}/artist_songs.csv")


if __name__ == "__main__":
    main()
