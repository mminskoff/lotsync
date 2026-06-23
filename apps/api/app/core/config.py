from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    environment: str = "development"
    supabase_url: str = ""
    supabase_anon_key: str = ""
    supabase_service_role_key: str = ""
    supabase_jwt_secret: str = ""
    database_url: str = ""
    renderer_adapter: str = "stub"
    transport_adapter: str = "stub"
    stub_transport_fail: bool = False
    sync_worker_poll_interval_seconds: float = 5.0


settings = Settings()
