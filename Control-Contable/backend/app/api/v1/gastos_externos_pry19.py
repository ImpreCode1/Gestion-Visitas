from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.api import deps
from app.crud import gasto_externo_pry19 as crud
from app.schemas.gasto_externo_pry19 import GastoExternoPry19Create, GastoExternoPry19Update, GastoExternoPry19Response

router = APIRouter(prefix="/gastos-externos-pry19", tags=["gastos externos pry19"])


@router.get("/", response_model=list[GastoExternoPry19Response])
def list_gastos(skip: int = 0, limit: int = 100, db: Session = Depends(deps.get_db)):
    return crud.get_multi(db, skip=skip, limit=limit)


@router.get("/{gasto_id}", response_model=GastoExternoPry19Response)
def get_gasto(gasto_id: int, db: Session = Depends(deps.get_db)):
    obj = crud.get(db, gasto_id)
    if not obj:
        raise HTTPException(404, detail="Gasto externo no encontrado")
    return obj


@router.post("/", response_model=GastoExternoPry19Response)
def create_gasto(obj_in: GastoExternoPry19Create, db: Session = Depends(deps.get_db)):
    return crud.create(db, obj_in)


@router.put("/{gasto_id}", response_model=GastoExternoPry19Response)
def update_gasto(gasto_id: int, obj_in: GastoExternoPry19Update, db: Session = Depends(deps.get_db)):
    obj = crud.get(db, gasto_id)
    if not obj:
        raise HTTPException(404, detail="Gasto externo no encontrado")
    return crud.update(db, obj, obj_in)


@router.delete("/{gasto_id}")
def delete_gasto(gasto_id: int, db: Session = Depends(deps.get_db)):
    obj = crud.get(db, gasto_id)
    if not obj:
        raise HTTPException(404, detail="Gasto externo no encontrado")
    crud.remove(db, gasto_id)
    return {"ok": True}
