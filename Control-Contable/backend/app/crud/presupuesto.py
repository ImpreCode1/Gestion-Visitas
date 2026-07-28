from sqlalchemy.orm import Session
from app.models.presupuesto import Presupuesto
from app.schemas.presupuesto import PresupuestoCreate, PresupuestoUpdate


def get(db: Session, presupuesto_id: int):
    return db.query(Presupuesto).filter(Presupuesto.id == presupuesto_id).first()


def get_multi(db: Session, skip: int = 0, limit: int = 100):
    return db.query(Presupuesto).offset(skip).limit(limit).all()


def create(db: Session, obj_in: PresupuestoCreate):
    db_obj = Presupuesto(**obj_in.model_dump())
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj


def update(db: Session, db_obj: Presupuesto, obj_in: PresupuestoUpdate):
    update_data = obj_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_obj, field, value)
    db.commit()
    db.refresh(db_obj)
    return db_obj


def remove(db: Session, presupuesto_id: int):
    obj = db.query(Presupuesto).filter(Presupuesto.id == presupuesto_id).first()
    db.delete(obj)
    db.commit()
    return obj
