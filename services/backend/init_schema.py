import psycopg2
import pandas as pd
import json
from pathlib import Path
import os

DB_NAME = os.getenv("DB_NAME", "yourdb")
DB_USER = os.getenv("DB_USER", "user")
DB_PASSWORD = os.getenv("DB_PASSWORD", "password")
DB_HOST = os.getenv("DB_HOST", "db")
DB_PORT = os.getenv("DB_PORT", "5432")
DATA_DIR = Path(os.getenv("DATA_DIR")).resolve()

conn = psycopg2.connect(
    dbname=DB_NAME,
    user=DB_USER,
    password=DB_PASSWORD,
    host=DB_HOST,
    port=DB_PORT,
)
cur = conn.cursor()

cur.execute("""CREATE EXTENSION IF NOT EXISTS "uuid-ossp";""")

cur.execute(
    """
CREATE TABLE IF NOT EXISTS artists (
    id TEXT PRIMARY KEY,
    artist_name TEXT,
    popularity INTEGER,
    image_url TEXT
);
"""
)

cur.execute(
    """
CREATE TABLE IF NOT EXISTS artist_songs (
    artist_name TEXT,
    id TEXT PRIMARY KEY,
    track_name TEXT,
    track_url TEXT,
    popularity INTEGER,
    album_name TEXT,
    num_artists INTEGER,
    release_date DATE,
    youtube_url TEXT,
    mp3_path TEXT,
    sampled_mp3_path TEXT[]
);
"""
)

cur.execute(
    """
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(100) NOT NULL,
  image_url TEXT,
  followers INTEGER DEFAULT 0,
  following INTEGER DEFAULT 0
);
"""
)

cur.execute(
    """
CREATE TABLE IF NOT EXISTS uploads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id),
  filename TEXT NOT NULL,
  original_name TEXT NOT NULL,
  upload_date TIMESTAMPTZ NOT NULL DEFAULT now()
);
"""
)

cur.execute(
    """
CREATE TABLE IF NOT EXISTS covers (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  artist_id TEXT NOT NULL,
  track_id TEXT NOT NULL,
  likes INTEGER DEFAULT 0,
  upload_date DATE NOT NULL,
  audio_path TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
"""
)

cur.execute(
    """
CREATE TABLE IF NOT EXISTS user_likes (
  user_id UUID REFERENCES users(id),
  cover_id INTEGER REFERENCES covers(id),
  liked_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (user_id, cover_id)
);
"""
)

cur.execute(
    """
CREATE TABLE IF NOT EXISTS match_requests (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  input_path TEXT NOT NULL,
  gender TEXT NOT NULL,
  category TEXT NOT NULL,
  k INTEGER NOT NULL,
  status TEXT NOT NULL,
  results JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);
"""
)

cur.execute(
    """
CREATE TABLE IF NOT EXISTS convert_requests (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  source_path TEXT NOT NULL,
  target_path TEXT NOT NULL,
  result_path TEXT,
  status TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);
"""
)

df = pd.read_csv(DATA_DIR / "artist_songs.csv", encoding="utf-8")
for _, row in df.iterrows():
    cur.execute(
        """
        INSERT INTO artist_songs (
            artist_name, id, track_name, track_url, popularity,
            album_name, num_artists, release_date, youtube_url,
            mp3_path, sampled_mp3_path
        )
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        ON CONFLICT (id) DO NOTHING;
        """,
        (
            row.get("artist_name"),
            row.get("id"),
            row.get("track_name"),
            row.get("track_url"),
            row.get("popularity"),
            row.get("album_name"),
            row.get("num_artists"),
            row.get("release_date"),
            None,
            None,
            None,
        ),
    )

with open(DATA_DIR / "metadata.jsonl", encoding="utf-8") as f:
    for line in f:
        r = json.loads(line)
        cur.execute(
            """
            INSERT INTO artist_songs (
                artist_name, id, track_name, track_url, popularity,
                album_name, num_artists, release_date, youtube_url,
                mp3_path, sampled_mp3_path
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT (id) DO UPDATE SET
                youtube_url = EXCLUDED.youtube_url,
                mp3_path = EXCLUDED.mp3_path,
                sampled_mp3_path = EXCLUDED.sampled_mp3_path;
            """,
            (
                r.get("artist_name"),
                r.get("id"),
                r.get("track_name"),
                r.get("track_url"),
                r.get("popularity"),
                r.get("album_name"),
                r.get("num_artists"),
                r.get("release_date"),
                r.get("youtube_url"),
                r.get("mp3_path"),
                r.get("sampled_mp3_path"),
            ),
        )

df2 = pd.read_csv(DATA_DIR / "artists.csv", encoding="utf-8")
for _, row in df2.iterrows():
    cur.execute(
        """
        INSERT INTO artists (
            id, artist_name, popularity, image_url
        )
        VALUES (%s, %s, %s, %s)
        ON CONFLICT (id) DO NOTHING;
        """,
        (
            row["id"],
            row["artist_name"],
            row["popularity"],
            row["image_url"],
        ),
    )

conn.commit()
cur.close()
conn.close()
