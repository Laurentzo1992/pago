from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = Path(__file__).resolve().parent.parent


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    database_url: str = "postgresql+psycopg://pago:pago@db:5432/pago"

    secret_key: str = "change-me"
    admin_username: str = "admin"
    # bcrypt hash of the admin password, generate with:
    #   python -c "import bcrypt; print(bcrypt.hashpw(b'yourpassword', bcrypt.gensalt()).decode())"
    admin_password_hash: str = ""

    media_root: Path = BASE_DIR / "media"
    media_url: str = "/media"

    cors_origins: list[str] = ["http://localhost:5173", "http://localhost:80", "http://localhost"]


settings = Settings()
settings.media_root.mkdir(parents=True, exist_ok=True)
(settings.media_root / "legend_images").mkdir(parents=True, exist_ok=True)
(settings.media_root / "uploads_files").mkdir(parents=True, exist_ok=True)
