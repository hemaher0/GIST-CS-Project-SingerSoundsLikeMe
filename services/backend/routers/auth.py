from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel, EmailStr
from utils.db import get_user_by_email, create_user
from utils.login import verify_password, create_access_token


router = APIRouter(prefix="/auth", tags=["Auth"])


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    name: str


@router.post("/login/", summary="User login returns JWT token")
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    user = get_user_by_email(form_data.username)
    if not user or not verify_password(form_data.password, user["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )
    token = create_access_token(user["id"])
    return {"access_token": token, "token_type": "bearer"}


@router.post("/register/", summary="User registration")
async def register(request: RegisterRequest):
    if get_user_by_email(request.email):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered"
        )
    user_id = create_user(request.email, request.password, request.name)
    token = create_access_token(user_id)
    return {"access_token": token, "token_type": "bearer"}
