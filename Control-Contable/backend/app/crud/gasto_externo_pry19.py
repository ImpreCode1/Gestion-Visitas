from sqlalchemy.orm import Session
from app.models.gasto_externo_pry19 import GastoExternoPry19
from app.schemas.gasto_externo_pry19 import GastoExternoPry19Create, GastoExternoPry19Update


def get(db: Session, gasto_id: int):
    return db.query(GastoExternoPry19).filter(GastoExternoPry19.id == gasto_id).first()


def get_multi(db: Session, skip: int = 0, limit: int = 100):
    return db.query(GastoExternoPry19).offset(skip).limit(limit).all()


def create(db: Session, obj_in: GastoExternoPry19Create):
    db_obj = GastoExternoPry19(**obj_in.model_dump())
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj


def update(db: Session, db_obj: GastoExternoPry19, obj_in: GastoExternoPry19Update):
    update_data = obj_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_obj, field, value)
    db.commit()
    db.refresh(db_obj)
    return db_obj


def remove(db: Session, gasto_id: int):
    obj = db.query(GastoExternoPry19).filter(GastoExternoPry19.id == gasto_id).first()
    db.delete(obj)
    db.commit()
    return obj
