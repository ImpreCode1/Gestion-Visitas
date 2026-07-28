from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.api import deps
from app.crud import movimiento_bancario as crud
from app.schemas.movimiento_bancario import MovimientoBancarioCreate, MovimientoBancarioResponse

router = APIRouter(prefix="/movimientos-bancarios", tags=["movimientos bancarios"])


@router.get("/", response_model=list[MovimientoBancarioResponse])
def list_movimientos(skip: int = 0, limit: int = 100, db: Session = Depends(deps.get_db)):
    return crud.get_multi(db, skip=skip, limit=limit)


@router.get("/{movimiento_id}", response_model=MovimientoBancarioResponse)
def get_movimiento(movimiento_id: int, db: Session = Depends(deps.get_db)):
    obj = crud.get(db, movimiento_id)
    if not obj:
        raise HTTPException(404, detail="Movimiento no encontrado")
    return obj


@router.post("/", response_model=MovimientoBancarioResponse)
def create_movimiento(obj_in: MovimientoBancarioCreate, db: Session = Depends(deps.get_db)):
    return crud.create(db, obj_in)


@router.delete("/{movimiento_id}")
def delete_movimiento(movimiento_id: int, db: Session = Depends(deps.get_db)):
    obj = crud.get(db, movimiento_id)
    if not obj:
        raise HTTPException(404, detail="Movimiento no encontrado")
    crud.remove(db, movimiento_id)
    return {"ok": True}
