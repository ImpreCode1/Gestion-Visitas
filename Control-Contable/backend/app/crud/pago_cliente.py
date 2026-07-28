from sqlalchemy.orm import Session
from app.models.pago_cliente import PagoCliente
from app.schemas.pago_cliente import PagoClienteCreate


def get(db: Session, pago_id: int):
    return db.query(PagoCliente).filter(PagoCliente.id == pago_id).first()


def get_multi(db: Session, skip: int = 0, limit: int = 100):
    return db.query(PagoCliente).offset(skip).limit(limit).all()


def create(db: Session, obj_in: PagoClienteCreate):
    db_obj = PagoCliente(**obj_in.model_dump())
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj


def remove(db: Session, pago_id: int):
    obj = db.query(PagoCliente).filter(PagoCliente.id == pago_id).first()
    db.delete(obj)
    db.commit()
    return obj
