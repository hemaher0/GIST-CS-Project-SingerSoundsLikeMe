from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import JSONResponse
from datetime import date
from utils.db import query, query_one

router = APIRouter(prefix="/list", tags=["List"])


@router.get("/tracks/", summary="List all tracks")
async def list_tracks(offset: int = 0, limit: int = 20):
    rows = query(
        """
        SELECT
          s.id,
          s.track_name,
          s.artist_name,
          s.popularity,
          s.album_name,
          s.release_date,
          s.youtube_url,
          a.image_url
        FROM artist_songs s
        JOIN artists a
          ON s.artist_name = a.artist_name
        ORDER BY s.popularity DESC
        OFFSET %s LIMIT %s
        """,
        (offset, limit),
    )
    for r in rows:
        rd = r.get("release_date")
        if isinstance(rd, date):
            r["release_date"] = rd.isoformat()
    return JSONResponse({"status": "ok", "data": rows})


@router.get("/artists/", summary="List all artists")
async def list_artists(offset: int = 0, limit: int = 20):
    rows = query(
        """
        SELECT id, artist_name, popularity, image_url
        FROM artists
        ORDER BY popularity DESC
        OFFSET %s LIMIT %s
        """,
        (offset, limit),
    )
    return JSONResponse({"status": "ok", "data": rows})


@router.get("/artists/search/", summary="Search artists by name")
async def search_artists(
    q: str = Query(..., description="Keyword to search in artist_name"),
    limit: int = Query(20, le=100),
    offset: int = Query(0),
):
    rows = query(
        """
        SELECT id, artist_name, popularity, image_url
        FROM artists
        WHERE artist_name ILIKE %s
        ORDER BY popularity DESC
        LIMIT %s OFFSET %s
        """,
        (f"%{q}%", limit, offset),
    )
    return JSONResponse({"status": "ok", "data": rows})


@router.get("/artists/{artist_id}/tracks/", summary="List tracks by artist")
async def list_tracks_by_artist(artist_id: str):
    artist = query_one("SELECT artist_name FROM artists WHERE id = %s", (artist_id,))
    if not artist:
        raise HTTPException(status_code=404, detail="Artist not found")
    rows = query(
        """
        SELECT id, track_name, artist_name, popularity, album_name, release_date
        FROM artist_songs
        WHERE artist_name = %s
        """,
        (artist["artist_name"],),
    )
    for r in rows:
        rd = r.get("release_date")
        if isinstance(rd, date):
            r["release_date"] = rd.isoformat()
    return JSONResponse({"status": "ok", "data": rows})


@router.get("/artists/{artist_id}/covers/", summary="List covers by artist")
async def covers_by_artist(artist_id: str):
    return await list_covers(user_id=artist_id)


@router.get("/covers/", summary="List covers with pagination and filtering")
async def list_covers(
    user_id: str = None,
    artist_id: str = None,
    limit: int = Query(20, le=100),
    offset: int = Query(0),
    order_by: str = Query("upload_date"),
    desc: bool = Query(True),
):
    sql = """
        SELECT
            c.id, c.likes, c.upload_date, c.audio_path,
            u.id AS user_id, u.name AS user_name, u.image_url AS user_image,
            a.artist_name, s.track_name
        FROM covers c
        JOIN users u ON c.user_id = u.id
        JOIN artists a ON c.artist_id = a.id
        JOIN artist_songs s ON c.track_id = s.id
        WHERE 1=1
    """
    params = []

    if user_id:
        sql += " AND c.user_id = %s"
        params.append(user_id)
    if artist_id:
        sql += " AND c.artist_id = %s"
        params.append(artist_id)

    valid_order_fields = {"upload_date", "likes"}
    if order_by not in valid_order_fields:
        raise HTTPException(status_code=400, detail="Invalid order_by field")

    sql += f" ORDER BY {order_by} {'DESC' if desc else 'ASC'}"
    sql += " LIMIT %s OFFSET %s"
    params += [limit, offset]

    covers = query(sql, tuple(params))
    for c in covers:
        c["covered_by"] = {
            "id": c.pop("user_id"),
            "name": c.pop("user_name"),
            "image": c.pop("user_image"),
        }
        c["covered_artist"] = c.pop("artist_name")
        c["covered_track"] = c.pop("track_name")

    return JSONResponse({"status": "ok", "data": covers})


@router.get("/covers/popular/", summary="List popular covered tracks")
async def list_popular_covers():
    rows = query(
        """
        SELECT c.id, c.likes, c.audio_path,
               u.name AS user_name, a.artist_name, s.track_name
        FROM covers c
        JOIN users u ON c.user_id = u.id
        JOIN artist_songs s ON c.track_id = s.id
        JOIN artists a ON a.artist_name = s.artist_name
        ORDER BY c.likes DESC
        LIMIT 20
        """
    )
    return JSONResponse({"status": "ok", "data": rows})


@router.get("/covers/search/", summary="Search covers by keyword")
async def search_covers(
    q: str = Query(..., description="Keyword to search in artist or track")
):
    rows = query(
        """
        SELECT c.id, c.likes, c.audio_path,
               u.name AS user_name, a.artist_name, s.track_name
        FROM covers c
        JOIN users u ON c.user_id = u.id
        JOIN artist_songs s ON c.track_id = s.id
        JOIN artists a ON a.artist_name = s.artist_name
        WHERE a.artist_name ILIKE %s OR s.track_name ILIKE %s
        """,
        (f"%{q}%", f"%{q}%"),
    )
    return JSONResponse({"status": "ok", "data": rows})


@router.get("/covers/{cover_id}/", summary="Get cover detail by ID")
async def get_cover_detail(cover_id: str):
    row = query_one(
        """
        SELECT c.id, c.audio_path, c.likes, c.upload_date,
               u.id AS user_id, u.name AS user_name, u.image_url AS user_image,
               a.artist_name, s.track_name
        FROM covers c
        JOIN users u ON c.user_id = u.id
        JOIN artist_songs s ON c.track_id = s.id
        JOIN artists a ON a.artist_name = s.artist_name
        WHERE c.id = %s
        """,
        (cover_id,),
    )
    if not row:
        raise HTTPException(status_code=404, detail="Cover not found")

    data = {
        "id": row["id"],
        "audio_path": row["audio_path"],
        "likes": row["likes"],
        "upload_date": row["upload_date"],
        "covered_by": {
            "id": row["user_id"],
            "name": row["user_name"],
            "image": row["user_image"],
        },
        "covered_artist": row["artist_name"],
        "covered_track": row["track_name"],
    }
    return JSONResponse({"status": "ok", "data": data})


@router.get("/users/", summary="List all users")
async def list_users():
    users = query(
        """
        SELECT id::text AS id,
               name,
               image_url AS image,
               followers,
               following
          FROM users;
        """
    )
    return JSONResponse({"status": "ok", "data": users})


@router.get("/users/{user_id}/likes/", summary="List covers liked by a user")
async def list_liked_covers(user_id: str):
    rows = query(
        """
        SELECT c.id, c.audio_path, c.likes,
               a.artist_name, s.track_name,
               u.name AS user_name
        FROM covers c
        JOIN artist_songs s ON c.track_id = s.id
        JOIN artists a ON a.artist_name = s.artist_name
        JOIN users u ON c.user_id = u.id
        JOIN user_likes ul ON ul.cover_id = c.id
        WHERE ul.user_id = %s
        """,
        (user_id,),
    )
    return JSONResponse({"status": "ok", "data": rows})
