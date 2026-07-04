from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    GEMINI_API_KEY: str = ""
    UPLOAD_FOLDER: str = "uploads"
    CHROMA_DB_PATH: str = "./chroma_db"
    SQLITE_PATH: str = "./db.sqlite3"
    ALLOWED_ORIGINS: str = "*"  # comma-separated or '*' for all

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"

    @property
    def allowed_origins_list(self) -> List[str]:
        raw = self.ALLOWED_ORIGINS or ""
        if raw.strip() == "*" or raw.strip() == "":
            return ["*"]
        return [o.strip() for o in raw.split(",") if o.strip()]


settings = Settings()
