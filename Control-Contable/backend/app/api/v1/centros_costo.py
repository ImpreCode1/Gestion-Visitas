from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.api import deps
from app.crud import centro_costo as crud
from app.schemas.centro_costo import CentroCostoCreate, CentroCostoUpdate, CentroCostoResponse

router = APIRouter(prefix="/centros-costo", tags=["centros costo"])


@router.get("/", response_model=list[CentroCostoResponse])
def list_centros(skip: int = 0, limit: int = 100, db: Session = Depends(deps.get_db)):
    return crud.get_multi(db, skip=skip, limit=limit)


@router.get("/{centro_id}", response_model=CentroCostoResponse)
def get_centro(centro_id: int, db: Session = Depends(deps.get_db)):
    obj = crud.get(db, centro_id)
    if not obj:
        raise HTTPException(404, detail="Centro de costo no encontrado")
    return obj


@router.post("/", response_model=CentroCostoResponse)
def create_centro(obj_in: CentroCostoCreate, db: Session = Depends(deps.get_db)):
    return crud.create(db, obj_in)


@router.put("/{centro_id}", response_model=CentroCostoResponse)
def update_centro(centro_id: int, obj_in: CentroCostoUpdate, db: Session = Depends(deps.get_db)):
    obj = crud.get(db, centro_id)
    if not obj:
        raise HTTPException(404, detail="Centro de costo no encontrado")
    return crud.update(db, obj, obj_in)


@router.delete("/{centro_id}")
def delete_centro(centro_id: int, db: Session = Depends(deps.get_db)):
    obj = crud.get(db, centro_id)
    if not obj:
        raise HTTPException(404, detail="Centro de costo no encontrado")
    crud.remove(db, centro_id)
    return {"ok": True}
