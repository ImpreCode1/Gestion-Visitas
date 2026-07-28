from sqlalchemy.orm import Session
from app.models.gasto_interno import GastoInterno
from app.schemas.gasto_interno import GastoInternoCreate, GastoInternoUpdate


def get(db: Session, gasto_id: int):
    return db.query(GastoInterno).filter(GastoInterno.id == gasto_id).first()


def get_multi(db: Session, skip: int = 0, limit: int = 100):
    return db.query(GastoInterno).offset(skip).limit(limit).all()


def create(db: Session, obj_in: GastoInternoCreate):
    db_obj = GastoInterno(**obj_in.model_dump())
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj


def update(db: Session, db_obj: GastoInterno, obj_in: GastoInternoUpdate):
    update_data = obj_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_obj, field, value)
    db.commit()
    db.refresh(db_obj)
    return db_obj


def remove(db: Session, gasto_id: int):
    obj = db.query(GastoInterno).filter(GastoInterno.id == gasto_id).first()
    db.delete(obj)
    db.commit()
    return obj
