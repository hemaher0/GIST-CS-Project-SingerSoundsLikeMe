import os
from passlib.context import CryptContext
import tempfile
from pathlib import Path

# Temporary directories for uploads and converted files
UPLOAD_DIR = Path("/usr/share/nginx/html/uploads")
CONVERTED_DIR = Path("/usr/share/nginx/html/converted")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
CONVERTED_DIR.mkdir(parents=True, exist_ok=True)

# CORS origins
ALLOWED_ORIGINS = ["*"]

SECRET_KEY = os.getenv("SECRET_KEY", "CHANGE_ME_TO_A_STRONG_KEY")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60
pwd_ctx = CryptContext(schemes=["bcrypt"], deprecated="auto")

DB_DSN = f"dbname={os.getenv('DB_NAME', 'fastapi_db')} user={os.getenv('DB_USER', 'fastapi_user')} password={os.getenv('DB_PASSWORD', 'password')} host={os.getenv('DB_HOST', 'localhost')} port={os.getenv('DB_PORT', 5432)}"
