from sqlalchemy.orm import Session
from app.models.factura_proveedor import FacturaProveedor
from app.schemas.factura_proveedor import FacturaProveedorCreate, FacturaProveedorUpdate


def get(db: Session, factura_id: int):
    return db.query(FacturaProveedor).filter(FacturaProveedor.id == factura_id).first()


def get_multi(db: Session, skip: int = 0, limit: int = 100):
    return db.query(FacturaProveedor).offset(skip).limit(limit).all()


def create(db: Session, obj_in: FacturaProveedorCreate):
    db_obj = FacturaProveedor(**obj_in.model_dump())
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj


def update(db: Session, db_obj: FacturaProveedor, obj_in: FacturaProveedorUpdate):
    update_data = obj_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_obj, field, value)
    db.commit()
    db.refresh(db_obj)
    return db_obj


def remove(db: Session, factura_id: int):
    obj = db.query(FacturaProveedor).filter(FacturaProveedor.id == factura_id).first()
    db.delete(obj)
    db.commit()
    return obj
