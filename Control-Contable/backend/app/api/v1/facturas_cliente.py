from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.api import deps
from app.crud import factura_cliente as crud
from app.schemas.factura_cliente import FacturaClienteCreate, FacturaClienteUpdate, FacturaClienteResponse

router = APIRouter(prefix="/facturas-cliente", tags=["facturas cliente"])


@router.get("/", response_model=list[FacturaClienteResponse])
def list_facturas(skip: int = 0, limit: int = 100, db: Session = Depends(deps.get_db)):
    return crud.get_multi(db, skip=skip, limit=limit)


@router.get("/{factura_id}", response_model=FacturaClienteResponse)
def get_factura(factura_id: int, db: Session = Depends(deps.get_db)):
    obj = crud.get(db, factura_id)
    if not obj:
        raise HTTPException(404, detail="Factura no encontrada")
    return obj


@router.post("/", response_model=FacturaClienteResponse)
def create_factura(obj_in: FacturaClienteCreate, db: Session = Depends(deps.get_db)):
    return crud.create(db, obj_in)


@router.put("/{factura_id}", response_model=FacturaClienteResponse)
def update_factura(factura_id: int, obj_in: FacturaClienteUpdate, db: Session = Depends(deps.get_db)):
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
