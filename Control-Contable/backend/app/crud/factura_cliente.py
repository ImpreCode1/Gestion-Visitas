from sqlalchemy.orm import Session
from app.models.factura_cliente import FacturaCliente
from app.schemas.factura_cliente import FacturaClienteCreate, FacturaClienteUpdate


def get(db: Session, factura_id: int):
    return db.query(FacturaCliente).filter(FacturaCliente.id == factura_id).first()


def get_multi(db: Session, skip: int = 0, limit: int = 100):
    return db.query(FacturaCliente).offset(skip).limit(limit).all()


def create(db: Session, obj_in: FacturaClienteCreate):
    db_obj = FacturaCliente(**obj_in.model_dump())
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj


def update(db: Session, db_obj: FacturaCliente, obj_in: FacturaClienteUpdate):
    update_data = obj_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_obj, field, value)
    db.commit()
    db.refresh(db_obj)
    return db_obj


def remove(db: Session, factura_id: int):
    obj = db.query(FacturaCliente).filter(FacturaCliente.id == factura_id).first()
    db.delete(obj)
    db.commit()
    return obj
