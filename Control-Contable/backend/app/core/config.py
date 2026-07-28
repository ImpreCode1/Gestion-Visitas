from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DB_URL: str = "postgresql://cc_user:cc_pass@localhost:5432/control_contable"
    HYDRA_ADMIN_URL: str = ""
    HYDRA_PUBLIC_URL: str = ""
    HYDRA_CLIENT_ID: str = ""
    HYDRA_CLIENT_SECRET: str = ""

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False


settings = Settings()
