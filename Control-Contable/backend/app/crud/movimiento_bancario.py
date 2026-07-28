from sqlalchemy.orm import Session
from app.models.movimiento_bancario import MovimientoBancario
from app.schemas.movimiento_bancario import MovimientoBancarioCreate


def get(db: Session, movimiento_id: int):
    return db.query(MovimientoBancario).filter(MovimientoBancario.id == movimiento_id).first()


def get_multi(db: Session, skip: int = 0, limit: int = 100):
    return db.query(MovimientoBancario).offset(skip).limit(limit).all()


def create(db: Session, obj_in: MovimientoBancarioCreate):
    db_obj = MovimientoBancario(**obj_in.model_dump())
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj


def remove(db: Session, movimiento_id: int):
    obj = db.query(MovimientoBancario).filter(MovimientoBancario.id == movimiento_id).first()
    db.delete(obj)
    db.commit()
    return obj
