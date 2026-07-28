from sqlalchemy.orm import Session
from app.core.database import get_db


def get_current_user():
    return {"id": 1, "username": "stub", "role": "admin"}
