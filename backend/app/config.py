from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Base de datos
    database_url: str = "postgresql+psycopg2://postgres:postgres@localhost:5432/portal_gestion_humana"

    # JWT
    jwt_secret_key: str = "cambia-esta-clave-en-produccion"
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 480  # 8 horas

    class Config:
        env_file = ".env"


settings = Settings()
