from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "Sattva API"
    environment: str = "development"
    database_url: str = "sqlite:///./hr_management.db"
    # Development fallback only. Set SECRET_KEY to a long random value in .env.
    secret_key: str = "DEV-ONLY-change-this-secret-key-before-use-please"
    frontend_origins: list[str] = ["http://localhost:5173"]
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    @model_validator(mode="after")
    def reject_unsafe_production_secret(self):
        if self.environment.lower() in {"production", "prod"}:
            weak_values = {
                "DEV-ONLY-change-this-secret-key-before-use-please",
                "replace-with-a-long-random-secret-before-use",
                "change-me",
                "secret",
            }
            if self.secret_key in weak_values or len(self.secret_key) < 32:
                raise ValueError(
                    "Production requires a unique SECRET_KEY of at least 32 characters."
                )
        return self


settings = Settings()
