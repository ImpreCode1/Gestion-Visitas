from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.api import deps
from app.crud import factura_proveedor as crud
from app.schemas.factura_proveedor import FacturaProveedorCreate, FacturaProveedorUpdate, FacturaProveedorResponse

router = APIRouter(prefix="/facturas-proveedor", tags=["facturas proveedor"])


@router.get("/", response_model=list[FacturaProveedorResponse])
def list_facturas(skip: int = 0, limit: int = 100, db: Session = Depends(deps.get_db)):
    return crud.get_multi(db, skip=skip, limit=limit)


@router.get("/{factura_id}", response_model=FacturaProveedorResponse)
def get_factura(factura_id: int, db: Session = Depends(deps.get_db)):
    obj = crud.get(db, factura_id)
    if not obj:
        raise HTTPException(404, detail="Factura no encontrada")
    return obj


@router.post("/", response_model=FacturaProveedorResponse)
def create_factura(obj_in: FacturaProveedorCreate, db: Session = Depends(deps.get_db)):
    return crud.create(db, obj_in)


@router.put("/{factura_id}", response_model=FacturaProveedorResponse)
def update_factura(factura_id: int, obj_in: FacturaProveedorUpdate, db: Session = Depends(deps.get_db)):
    obj = crud.get(db, factura_id)
    if not obj:
        raise HTTPException(404, detail="Factura no encontrada")
    return crud.update(db, obj, obj_in)


@router.delete("/{factura_id}")
def delete_factura(factura_id: int, db: Session = Depends(deps.get_db)):
    obj = crud.get(db, factura_id)
    if not obj:
        raise HTTPException(404, detail="Factura no encontrada")
    crud.remove(db, factura_id)
    return {"ok": True}
