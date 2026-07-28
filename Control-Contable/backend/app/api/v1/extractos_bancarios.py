from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.api import deps
from app.crud import extracto_bancario as crud
from app.schemas.extracto_bancario import ExtractoBancarioCreate, ExtractoBancarioUpdate, ExtractoBancarioResponse

router = APIRouter(prefix="/extractos-bancarios", tags=["extractos bancarios"])


@router.get("/", response_model=list[ExtractoBancarioResponse])
def list_extractos(skip: int = 0, limit: int = 100, db: Session = Depends(deps.get_db)):
    return crud.get_multi(db, skip=skip, limit=limit)


@router.get("/{extracto_id}", response_model=ExtractoBancarioResponse)
def get_extracto(extracto_id: int, db: Session = Depends(deps.get_db)):
    obj = crud.get(db, extracto_id)
    if not obj:
        raise HTTPException(404, detail="Extracto no encontrado")
    return obj


@router.post("/", response_model=ExtractoBancarioResponse)
def create_extracto(obj_in: ExtractoBancarioCreate, db: Session = Depends(deps.get_db)):
    return crud.create(db, obj_in)


@router.put("/{extracto_id}", response_model=ExtractoBancarioResponse)
def update_extracto(extracto_id: int, obj_in: ExtractoBancarioUpdate, db: Session = Depends(deps.get_db)):
    obj = crud.get(db, extracto_id)
    if not obj:
        raise HTTPException(404, detail="Extracto no encontrado")
    return crud.update(db, obj, obj_in)


@router.delete("/{extracto_id}")
def delete_extracto(extracto_id: int, db: Session = Depends(deps.get_db)):
    obj = crud.get(db, extracto_id)
    if not obj:
        raise HTTPException(404, detail="Extracto no encontrado")
    crud.remove(db, extracto_id)
    return {"ok": True}
