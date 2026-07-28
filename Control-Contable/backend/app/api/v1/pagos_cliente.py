from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.api import deps
from app.crud import pago_cliente as crud
from app.schemas.pago_cliente import PagoClienteCreate, PagoClienteResponse

router = APIRouter(prefix="/pagos-cliente", tags=["pagos cliente"])


@router.get("/", response_model=list[PagoClienteResponse])
def list_pagos(skip: int = 0, limit: int = 100, db: Session = Depends(deps.get_db)):
    return crud.get_multi(db, skip=skip, limit=limit)


@router.get("/{pago_id}", response_model=PagoClienteResponse)
def get_pago(pago_id: int, db: Session = Depends(deps.get_db)):
    obj = crud.get(db, pago_id)
    if not obj:
        raise HTTPException(404, detail="Pago no encontrado")
    return obj


@router.post("/", response_model=PagoClienteResponse)
def create_pago(obj_in: PagoClienteCreate, db: Session = Depends(deps.get_db)):
    return crud.create(db, obj_in)


@router.delete("/{pago_id}")
def delete_pago(pago_id: int, db: Session = Depends(deps.get_db)):
    obj = crud.get(db, pago_id)
    if not obj:
        raise HTTPException(404, detail="Pago no encontrado")
    crud.remove(db, pago_id)
    return {"ok": True}
