import os
import psycopg2
from psycopg2.extras import RealDictCursor
from utils.config import DB_DSN

DEFAULT_PROFILE_IMAGE = (
    "https://cdn.pixabay.com/photo/2023/02/18/11/00/icon-7797704_640.png",
)

db = psycopg2.connect(DB_DSN, cursor_factory=RealDictCursor)
db.autocommit = True


def query(sql: str, params: tuple = ()):
    with db.cursor() as cur:
        cur.execute(sql, params)
        return cur.fetchall()


def query_one(sql: str, params: tuple = ()):
    with db.cursor() as cur:
        cur.execute(sql, params)
        return cur.fetchone()


def execute(sql: str, params: tuple = ()):
    with db.cursor() as cur:
        cur.execute(sql, params)
        db.commit()


def get_user_by_email(email: str):
    sql = """
    SELECT
      id::text AS id,
      email,
      password_hash,
      name,
      image_url AS image,
      followers,
      following
    FROM users
    WHERE email = %s;
    """
    return query_one(sql, (email,))


def get_user_by_id(user_id: str):
    sql = """
    SELECT
      id::text AS id,
      email,
      name,
      image_url AS image,
      followers,
      following
    FROM users
    WHERE id = %s;
    """
    return query_one(sql, (user_id,))


def create_user(email: str, password: str, name: str) -> str:
    from utils.login import get_password_hash

    hashed = get_password_hash(password)
    image_url = DEFAULT_PROFILE_IMAGE
    sql = """
    INSERT INTO users (email, password_hash, name, image_url)
    VALUES (%s, %s, %s, %s)
    RETURNING id::text AS id;
    """
    row = query_one(sql, (email, hashed, name, image_url))
    return row["id"]
