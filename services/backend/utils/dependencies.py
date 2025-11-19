from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer

from utils.login import decode_access_token
from utils.db import query_one

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/login/")


def get_current_user(token: str = Depends(oauth2_scheme)):
    user_id = decode_access_token(token)
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )
    row = query_one("SELECT id, email, name FROM users WHERE id = %s", (user_id,))
    if not row:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )
    return {"id": row[0], "email": row[1], "name": row[2]}
