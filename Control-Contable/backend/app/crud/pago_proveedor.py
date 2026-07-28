from sqlalchemy.orm import Session
from app.models.pago_proveedor import PagoProveedor
from app.schemas.pago_proveedor import PagoProveedorCreate


def get(db: Session, pago_id: int):
    return db.query(PagoProveedor).filter(PagoProveedor.id == pago_id).first()


def get_multi(db: Session, skip: int = 0, limit: int = 100):
    return db.query(PagoProveedor).offset(skip).limit(limit).all()


def create(db: Session, obj_in: PagoProveedorCreate):
    db_obj = PagoProveedor(**obj_in.model_dump())
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj


def remove(db: Session, pago_id: int):
    obj = db.query(PagoProveedor).filter(PagoProveedor.id == pago_id).first()
    db.delete(obj)
    db.commit()
    return obj
