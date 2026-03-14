from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )

    # Base de datos — Railway/Neon proveen DATABASE_URL automáticamente
    DATABASE_URL: str = "postgresql://erp_user:erp_pass@localhost:5432/erp_db"

    # Seguridad — sobreescribir en producción con: openssl rand -hex 32
    SECRET_KEY: str = "dev-secret-key-cambiar-en-produccion-usar-openssl-rand-hex-32"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 480
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # App
    APP_NAME: str = "ERP Financiero API"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False

    # CORS — incluye Vercel (frontend en producción) y localhost (desarrollo)
    ALLOWED_ORIGINS: list[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "https://novaerp-cuck6c0ur-josecanihuantes-projects.vercel.app",
        "https://*.vercel.app",
    ]


settings = Settings()
