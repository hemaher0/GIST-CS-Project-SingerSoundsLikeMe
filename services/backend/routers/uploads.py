import shutil
import uuid
from pathlib import Path

from fastapi import APIRouter, File, UploadFile, HTTPException, Depends, Query, status
from fastapi.responses import JSONResponse

from utils.config import UPLOAD_DIR, CONVERTED_DIR
from utils.db import get_user_by_id, query_one, query, execute
from utils.login import decode_access_token
from utils.dependencies import oauth2_scheme

router = APIRouter(prefix="/uploads", tags=["Uploads"])


@router.post("/upload_file/", summary="Upload audio file")
async def upload_file(
    file: UploadFile = File(...),
    token: str = Depends(oauth2_scheme),
):
    user_id = decode_access_token(token)
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token"
        )
    user = get_user_by_id(user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
        )

    ext = Path(file.filename).suffix
    safe_filename = f"{uuid.uuid4().hex}{ext}"
    dest = UPLOAD_DIR / safe_filename
    try:
        with dest.open("wb") as f:
            shutil.copyfileobj(file.file, f)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e)
        )

    rec = query_one(
        """
        INSERT INTO uploads (user_id, filename, original_name)
        VALUES (%s, %s, %s)
        RETURNING id::text AS id, filename, original_name, upload_date;
        """,
        (user_id, safe_filename, file.filename),
    )

    return JSONResponse(
        {
            "status": "ok",
            "message": "File saved",
            "data": {
                "id": rec["id"],
                "filename": rec["filename"],
                "original_name": rec["original_name"],
                "upload_date": rec["upload_date"].isoformat(),
                "audioUrl": f"/uploads/{rec['filename']}",
            },
        }
    )


@router.get("/uploads/{upload_id}/", summary="Get uploaded file info by ID")
async def get_uploaded_file(
    upload_id: str,
    token: str = Depends(oauth2_scheme),
):
    user_id = decode_access_token(token)
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token"
        )

    row = query_one(
        """
        SELECT id::text AS id, filename, original_name,
               EXTRACT(EPOCH FROM upload_date) AS upload_date
          FROM uploads
         WHERE id = %s AND user_id = %s
        """,
        (upload_id, user_id),
    )
    if not row:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Upload not found"
        )

    return JSONResponse(
        {
            "status": "ok",
            "data": {
                "id": row["id"],
                "filename": row["filename"],
                "original_name": row["original_name"],
                "upload_date": float(row["upload_date"]),
                "audioUrl": f"/uploads/{row['filename']}",
            },
        }
    )


@router.get("/uploads/", summary="List uploaded files by current user")
async def list_my_uploads(
    token: str = Depends(oauth2_scheme),
):
    user_id = decode_access_token(token)
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token"
        )

    rows = query(
        """
        SELECT id::text AS id, filename, original_name,
               EXTRACT(EPOCH FROM upload_date) AS upload_date
          FROM uploads
         WHERE user_id = %s
         ORDER BY upload_date DESC
        """,
        (user_id,),
    )

    items = [
        {
            "id": r["id"],
            "filename": r["filename"],
            "original_name": r["original_name"],
            "upload_date": float(r["upload_date"]),
            "audioUrl": f"/uploads/{r['filename']}",
        }
        for r in rows
    ]

    return JSONResponse({"status": "ok", "data": items})


@router.delete("/uploads/{upload_id}/", summary="Delete uploaded file")
async def delete_upload(
    upload_id: str,
    token: str = Depends(oauth2_scheme),
):
    user_id = decode_access_token(token)
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token"
        )

    row = query_one(
        "SELECT filename FROM uploads WHERE id = %s AND user_id = %s",
        (upload_id, user_id),
    )
    if not row:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Upload not found"
        )

    file_path = UPLOAD_DIR / row["filename"]
    if file_path.exists():
        file_path.unlink()

    execute("DELETE FROM uploads WHERE id = %s", (upload_id,))

    return JSONResponse({"status": "ok", "message": "Upload deleted"})


@router.put("/uploads/{upload_id}/", summary="Rename uploaded file")
async def rename_upload(
    upload_id: str,
    new_name: str = Query(..., description="New display name"),
    token: str = Depends(oauth2_scheme),
):
    user_id = decode_access_token(token)
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token"
        )

    rec = query_one(
        "UPDATE uploads SET original_name = %s WHERE id = %s AND user_id = %s RETURNING id::text AS id, filename, original_name",
        (new_name, upload_id, user_id),
    )
    if not rec:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Upload not found"
        )

    return JSONResponse(
        {
            "status": "ok",
            "data": {
                "id": rec["id"],
                "filename": rec["filename"],
                "original_name": rec["original_name"],
            },
        }
    )


@router.patch("/uploads/{upload_id}/status/", summary="Update upload status")
async def update_upload_status(
    upload_id: str,
    status: str = Query(..., description="New status"),
):
    # TODO: Implement status update logic
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED, detail="Not implemented"
    )


@router.get(
    "/uploads/{upload_id}/converted/", summary="Get converted result for uploaded file"
)
async def get_converted_result(
    upload_id: str,
    token: str = Depends(oauth2_scheme),
):
    user_id = decode_access_token(token)
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token"
        )

    row = query_one(
        "SELECT filename FROM uploads WHERE id = %s AND user_id = %s",
        (upload_id, user_id),
    )
    if not row:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Upload not found"
        )

    conv_path = CONVERTED_DIR / row["filename"]
    if not conv_path.exists():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Converted file not ready"
        )

    return JSONResponse(
        {
            "status": "ok",
            "data": {
                "id": upload_id,
                "audioUrl": f"/converted/{row['filename']}",
            },
        }
    )
