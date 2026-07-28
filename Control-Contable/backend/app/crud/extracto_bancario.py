from sqlalchemy.orm import Session
from app.models.extracto_bancario import ExtractoBancario
from app.schemas.extracto_bancario import ExtractoBancarioCreate, ExtractoBancarioUpdate


def get(db: Session, extracto_id: int):
    return db.query(ExtractoBancario).filter(ExtractoBancario.id == extracto_id).first()


def get_multi(db: Session, skip: int = 0, limit: int = 100):
    return db.query(ExtractoBancario).offset(skip).limit(limit).all()


def create(db: Session, obj_in: ExtractoBancarioCreate):
    db_obj = ExtractoBancario(**obj_in.model_dump())
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj


def update(db: Session, db_obj: ExtractoBancario, obj_in: ExtractoBancarioUpdate):
    update_data = obj_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_obj, field, value)
    db.commit()
    db.refresh(db_obj)
    return db_obj


def remove(db: Session, extracto_id: int):
    obj = db.query(ExtractoBancario).filter(ExtractoBancario.id == extracto_id).first()
    db.delete(obj)
    db.commit()
    return obj
