from sqlalchemy.orm import Session
from app.models.conciliacion import Conciliacion
from app.schemas.conciliacion import ConciliacionCreate, ConciliacionUpdate


def get(db: Session, conciliacion_id: int):
    return db.query(Conciliacion).filter(Conciliacion.id == conciliacion_id).first()


def get_multi(db: Session, skip: int = 0, limit: int = 100):
    return db.query(Conciliacion).offset(skip).limit(limit).all()


def create(db: Session, obj_in: ConciliacionCreate):
    diferencia = obj_in.saldo_libros - obj_in.saldo_extracto
    db_obj = Conciliacion(**obj_in.model_dump(), diferencia=diferencia)
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj


def update(db: Session, db_obj: Conciliacion, obj_in: ConciliacionUpdate):
    update_data = obj_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_obj, field, value)
    if "saldo_libros" in update_data or "saldo_extracto" in update_data:
        db_obj.diferencia = db_obj.saldo_libros - db_obj.saldo_extracto
    db.commit()
    db.refresh(db_obj)
    return db_obj


def remove(db: Session, conciliacion_id: int):
    obj = db.query(Conciliacion).filter(Conciliacion.id == conciliacion_id).first()
    db.delete(obj)
    db.commit()
    return obj
