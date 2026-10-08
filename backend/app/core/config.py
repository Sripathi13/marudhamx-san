from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    PROJECT_NAME: str = "AgriRoute"
    API_V1_STR: str = "/api"
    OSRM_BASE_URL: str = "https://router.project-osrm.org"
    DATABASE_URL: str = "sqlite:///./agriroute.db"
    NOMINATIM_USER_AGENT: str = "agriroute-hackathon-agent/1.0"

    class Config:
        env_file = ".env"

settings = Settings()
