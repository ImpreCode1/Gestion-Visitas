from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.api import deps
from app.crud import pago_proveedor as crud
from app.schemas.pago_proveedor import PagoProveedorCreate, PagoProveedorResponse

router = APIRouter(prefix="/pagos-proveedor", tags=["pagos proveedor"])


@router.get("/", response_model=list[PagoProveedorResponse])
def list_pagos(skip: int = 0, limit: int = 100, db: Session = Depends(deps.get_db)):
    return crud.get_multi(db, skip=skip, limit=limit)


@router.get("/{pago_id}", response_model=PagoProveedorResponse)
def get_pago(pago_id: int, db: Session = Depends(deps.get_db)):
    obj = crud.get(db, pago_id)
    if not obj:
        raise HTTPException(404, detail="Pago no encontrado")
    return obj


@router.post("/", response_model=PagoProveedorResponse)
def create_pago(obj_in: PagoProveedorCreate, db: Session = Depends(deps.get_db)):
    return crud.create(db, obj_in)


@router.delete("/{pago_id}")
def delete_pago(pago_id: int, db: Session = Depends(deps.get_db)):
    obj = crud.get(db, pago_id)
    if not obj:
        raise HTTPException(404, detail="Pago no encontrado")
    crud.remove(db, pago_id)
    return {"ok": True}
