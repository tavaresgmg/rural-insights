from pydantic_settings import BaseSettings
import os


class Settings(BaseSettings):
    # API Settings
    api_title: str = "Rural Insights API"
    api_version: str = "1.0.0"
    environment: str = "development"
    
    # CORS
    cors_origins: str = "http://localhost:5173,http://localhost:3000"
    
    # File Upload
    max_file_size_mb: int = 10
    
    # OpenAI
    openai_api_key: str = "sk-dummy-key-for-testing"
    
    # Cache
    cache_ttl_hours: int = 24
    
    @property
    def cors_origins_list(self):
        return self.cors_origins.split(",")
    
    class Config:
        env_file = ".env"
        case_sensitive = False
        extra = "allow"


settings = Settings()