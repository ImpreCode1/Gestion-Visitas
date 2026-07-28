from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.api import deps
from app.crud import conciliacion as crud
from app.schemas.conciliacion import ConciliacionCreate, ConciliacionUpdate, ConciliacionResponse

router = APIRouter(prefix="/conciliaciones", tags=["conciliaciones"])


@router.get("/", response_model=list[ConciliacionResponse])
def list_conciliaciones(skip: int = 0, limit: int = 100, db: Session = Depends(deps.get_db)):
    return crud.get_multi(db, skip=skip, limit=limit)


@router.get("/{conciliacion_id}", response_model=ConciliacionResponse)
def get_conciliacion(conciliacion_id: int, db: Session = Depends(deps.get_db)):
    obj = crud.get(db, conciliacion_id)
    if not obj:
        raise HTTPException(404, detail="Conciliación no encontrada")
    return obj


@router.post("/", response_model=ConciliacionResponse)
def create_conciliacion(obj_in: ConciliacionCreate, db: Session = Depends(deps.get_db)):
    return crud.create(db, obj_in)


@router.put("/{conciliacion_id}", response_model=ConciliacionResponse)
def update_conciliacion(conciliacion_id: int, obj_in: ConciliacionUpdate, db: Session = Depends(deps.get_db)):
    obj = crud.get(db, conciliacion_id)
    if not obj:
        raise HTTPException(404, detail="Conciliación no encontrada")
    return crud.update(db, obj, obj_in)


@router.delete("/{conciliacion_id}")
def delete_conciliacion(conciliacion_id: int, db: Session = Depends(deps.get_db)):
    obj = crud.get(db, conciliacion_id)
    if not obj:
        raise HTTPException(404, detail="Conciliación no encontrada")
    crud.remove(db, conciliacion_id)
    return {"ok": True}
