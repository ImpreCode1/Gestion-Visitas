from sqlalchemy.orm import Session
from app.models.categoria_gasto import CategoriaGasto
from app.schemas.categoria_gasto import CategoriaGastoCreate, CategoriaGastoUpdate


def get(db: Session, categoria_id: int):
    return db.query(CategoriaGasto).filter(CategoriaGasto.id == categoria_id).first()


def get_multi(db: Session, skip: int = 0, limit: int = 100):
    return db.query(CategoriaGasto).offset(skip).limit(limit).all()


def create(db: Session, obj_in: CategoriaGastoCreate):
    db_obj = CategoriaGasto(**obj_in.model_dump())
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj


def update(db: Session, db_obj: CategoriaGasto, obj_in: CategoriaGastoUpdate):
    update_data = obj_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_obj, field, value)
    db.commit()
    db.refresh(db_obj)
    return db_obj


def remove(db: Session, categoria_id: int):
    obj = db.query(CategoriaGasto).filter(CategoriaGasto.id == categoria_id).first()
    db.delete(obj)
    db.commit()
    return obj
