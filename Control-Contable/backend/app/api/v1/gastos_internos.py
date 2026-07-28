from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.api import deps
from app.crud import gasto_interno as crud
from app.schemas.gasto_interno import GastoInternoCreate, GastoInternoUpdate, GastoInternoResponse

router = APIRouter(prefix="/gastos-internos", tags=["gastos internos"])


@router.get("/", response_model=list[GastoInternoResponse])
def list_gastos(skip: int = 0, limit: int = 100, db: Session = Depends(deps.get_db)):
    return crud.get_multi(db, skip=skip, limit=limit)


@router.get("/{gasto_id}", response_model=GastoInternoResponse)
def get_gasto(gasto_id: int, db: Session = Depends(deps.get_db)):
    obj = crud.get(db, gasto_id)
    if not obj:
        raise HTTPException(404, detail="Gasto no encontrado")
    return obj


@router.post("/", response_model=GastoInternoResponse)
def create_gasto(obj_in: GastoInternoCreate, db: Session = Depends(deps.get_db)):
    return crud.create(db, obj_in)


@router.put("/{gasto_id}", response_model=GastoInternoResponse)
def update_gasto(gasto_id: int, obj_in: GastoInternoUpdate, db: Session = Depends(deps.get_db)):
    obj = crud.get(db, gasto_id)
    if not obj:
        raise HTTPException(404, detail="Gasto no encontrado")
    return crud.update(db, obj, obj_in)


@router.delete("/{gasto_id}")
def delete_gasto(gasto_id: int, db: Session = Depends(deps.get_db)):
    obj = crud.get(db, gasto_id)
    if not obj:
        raise HTTPException(404, detail="Gasto no encontrado")
    crud.remove(db, gasto_id)
    return {"ok": True}
