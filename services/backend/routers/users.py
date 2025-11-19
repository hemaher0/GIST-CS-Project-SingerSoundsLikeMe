from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import JSONResponse
from fastapi.security import OAuth2PasswordBearer
from utils.db import query, query_one
from utils.login import decode_access_token
from utils.dependencies import oauth2_scheme

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("/me/", summary="Get current user profile")
async def read_current_user(token: str = Depends(oauth2_scheme)):
    user_id = decode_access_token(token)

    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token"
        )

    user = query_one(
        """
        SELECT id::text AS id, email, name, image_url AS image, followers, following
        FROM users WHERE id = %s
        """,
        (user_id,),
    )
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
        )
    return JSONResponse({"status": "ok", "data": user})


@router.get("/me/covers/", summary="List covers uploaded by current user")
async def list_my_covers(token: str = Depends(oauth2_scheme)):
    user_id = decode_access_token(token)
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token"
        )
    rows = query(
        """
        SELECT c.id, c.likes, c.upload_date, c.audio_path,
               a.artist_name, s.track_name
        FROM covers c
        JOIN artist_songs s ON c.track_id = s.id
        JOIN artists a ON a.artist_name = s.artist_name
        WHERE c.user_id = %s
        ORDER BY c.upload_date DESC
        """,
        (user_id,),
    )
    for r in rows:
        r["covered_artist"] = r.pop("artist_name")
        r["covered_track"] = r.pop("track_name")
    return JSONResponse({"status": "ok", "data": rows})


@router.get("/me/liked/", summary="List covers liked by current user")
async def list_liked_covers_me(token: str = Depends(oauth2_scheme)):
    user_id = decode_access_token(token)
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token"
        )
    rows = query(
        """
        SELECT c.id, c.likes, c.audio_path,
               a.artist_name, s.track_name
        FROM user_likes ul
        JOIN covers c ON ul.cover_id = c.id
        JOIN artist_songs s ON c.track_id = s.id
        JOIN artists a ON a.artist_name = s.artist_name
        WHERE ul.user_id = %s
        ORDER BY ul.liked_at DESC
        """,
        (user_id,),
    )
    for r in rows:
        r["covered_artist"] = r.pop("artist_name")
        r["covered_track"] = r.pop("track_name")
    return JSONResponse({"status": "ok", "data": rows})


@router.get("/me/activity/", summary="List recent user activities")
async def list_user_activity(token: str = Depends(oauth2_scheme)):
    user_id = decode_access_token(token)
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token"
        )
    uploads = query(
        """
        SELECT id::text AS id, upload_date AS timestamp, filename AS detail, 'upload' AS type
        FROM uploads WHERE user_id = %s
        """,
        (user_id,),
    )
    covers = query(
        """
        SELECT id::text AS id, created_at AS timestamp, audio_path AS detail, 'cover' AS type
        FROM covers WHERE user_id = %s
        """,
        (user_id,),
    )
    activities = uploads + covers
    activities.sort(key=lambda x: x["timestamp"], reverse=True)
    return JSONResponse({"status": "ok", "data": activities})


@router.get("/me/following/", summary="List users I follow")
async def list_following_me(token: str = Depends(oauth2_scheme)):
    # TODO: Implement once follow relationships table is defined
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Not implemented - follow relationships not defined",
    )


@router.get("/me/followers/", summary="List users who follow me")
async def list_followers_me(token: str = Depends(oauth2_scheme)):
    # TODO: Implement once follow relationships table is defined
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Not implemented - follow relationships not defined",
    )


@router.get("/{user_id}/", summary="Get profile of a specific user")
async def get_user_profile(user_id: str):
    user = query_one(
        """
        SELECT id::text AS id, email, name, image_url AS image, followers, following
        FROM users WHERE id = %s
        """,
        (user_id,),
    )
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
        )
    return JSONResponse({"status": "ok", "data": user})


@router.get("/me/files/", summary="List uploaded files by current user")
async def list_my_uploaded_files(token: str = Depends(oauth2_scheme)):
    user_id = decode_access_token(token)
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token"
        )

    rows = query(
        """
        SELECT
          u.id::text        AS id,
          u.filename,
          u.original_name,
          EXTRACT(EPOCH FROM u.upload_date) AS upload_date,
          usr.id::text AS user_id,
          usr.name    AS user_name,
          usr.image_url AS user_image
        FROM uploads u
        JOIN users usr ON u.user_id = usr.id
        WHERE u.user_id = %s
        ORDER BY u.upload_date DESC;
        """,
        (user_id,),
    )

    items = [
        {
            "id": r["id"],
            "filename": r["filename"],
            "original_name": r["original_name"],
            "audioUrl": f"/uploads/{r['filename']}",
            "upload_date": float(r["upload_date"]),
            "type": "uploaded",
            "user": {  # ← user 정보 추가
                "id": r["user_id"],
                "name": r["user_name"],
                "image": r["user_image"],
            },
        }
        for r in rows
    ]

    return JSONResponse({"status": "ok", "data": items})
