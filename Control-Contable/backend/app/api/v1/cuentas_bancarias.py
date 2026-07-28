from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.api import deps
from app.crud import cuenta_bancaria as crud
from app.schemas.cuenta_bancaria import CuentaBancariaCreate, CuentaBancariaUpdate, CuentaBancariaResponse

router = APIRouter(prefix="/cuentas-bancarias", tags=["cuentas bancarias"])


@router.get("/", response_model=list[CuentaBancariaResponse])
def list_cuentas(skip: int = 0, limit: int = 100, db: Session = Depends(deps.get_db)):
    return crud.get_multi(db, skip=skip, limit=limit)


@router.get("/{cuenta_id}", response_model=CuentaBancariaResponse)
def get_cuenta(cuenta_id: int, db: Session = Depends(deps.get_db)):
    obj = crud.get(db, cuenta_id)
    if not obj:
        raise HTTPException(404, detail="Cuenta no encontrada")
    return obj


@router.post("/", response_model=CuentaBancariaResponse)
def create_cuenta(obj_in: CuentaBancariaCreate, db: Session = Depends(deps.get_db)):
    return crud.create(db, obj_in)


@router.put("/{cuenta_id}", response_model=CuentaBancariaResponse)
def update_cuenta(cuenta_id: int, obj_in: CuentaBancariaUpdate, db: Session = Depends(deps.get_db)):
    obj = crud.get(db, cuenta_id)
    if not obj:
        raise HTTPException(404, detail="Cuenta no encontrada")
    return crud.update(db, obj, obj_in)


@router.delete("/{cuenta_id}")
def delete_cuenta(cuenta_id: int, db: Session = Depends(deps.get_db)):
    obj = crud.get(db, cuenta_id)
    if not obj:
        raise HTTPException(404, detail="Cuenta no encontrada")
    crud.remove(db, cuenta_id)
    return {"ok": True}
