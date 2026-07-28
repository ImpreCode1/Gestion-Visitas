from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.api import deps
from app.crud import presupuesto as crud
from app.schemas.presupuesto import PresupuestoCreate, PresupuestoUpdate, PresupuestoResponse

router = APIRouter(prefix="/presupuestos", tags=["presupuestos"])


@router.get("/", response_model=list[PresupuestoResponse])
def list_presupuestos(skip: int = 0, limit: int = 100, db: Session = Depends(deps.get_db)):
    return crud.get_multi(db, skip=skip, limit=limit)


@router.get("/{presupuesto_id}", response_model=PresupuestoResponse)
def get_presupuesto(presupuesto_id: int, db: Session = Depends(deps.get_db)):
    obj = crud.get(db, presupuesto_id)
    if not obj:
        raise HTTPException(404, detail="Presupuesto no encontrado")
    return obj


@router.post("/", response_model=PresupuestoResponse)
def create_presupuesto(obj_in: PresupuestoCreate, db: Session = Depends(deps.get_db)):
    return crud.create(db, obj_in)


@router.put("/{presupuesto_id}", response_model=PresupuestoResponse)
def update_presupuesto(presupuesto_id: int, obj_in: PresupuestoUpdate, db: Session = Depends(deps.get_db)):
    obj = crud.get(db, presupuesto_id)
    if not obj:
        raise HTTPException(404, detail="Presupuesto no encontrado")
    return crud.update(db, obj, obj_in)


@router.delete("/{presupuesto_id}")
def delete_presupuesto(presupuesto_id: int, db: Session = Depends(deps.get_db)):
    obj = crud.get(db, presupuesto_id)
    if not obj:
        raise HTTPException(404, detail="Presupuesto no encontrado")
    crud.remove(db, presupuesto_id)
    return {"ok": True}
