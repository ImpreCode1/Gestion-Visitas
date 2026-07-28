from sqlalchemy.orm import Session
from app.models.proveedor import Proveedor
from app.schemas.proveedor import ProveedorCreate, ProveedorUpdate


def get(db: Session, proveedor_id: int):
    return db.query(Proveedor).filter(Proveedor.id == proveedor_id).first()


def get_multi(db: Session, skip: int = 0, limit: int = 100):
    return db.query(Proveedor).offset(skip).limit(limit).all()


def create(db: Session, obj_in: ProveedorCreate):
    db_obj = Proveedor(**obj_in.model_dump())
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj


def update(db: Session, db_obj: Proveedor, obj_in: ProveedorUpdate):
    update_data = obj_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_obj, field, value)
    db.commit()
    db.refresh(db_obj)
    return db_obj


def remove(db: Session, proveedor_id: int):
    obj = db.query(Proveedor).filter(Proveedor.id == proveedor_id).first()
    db.delete(obj)
    db.commit()
    return obj
