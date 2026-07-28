from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.api import deps
from app.crud import categoria_gasto as crud
from app.schemas.categoria_gasto import CategoriaGastoCreate, CategoriaGastoUpdate, CategoriaGastoResponse

router = APIRouter(prefix="/categorias-gasto", tags=["categorias gasto"])


@router.get("/", response_model=list[CategoriaGastoResponse])
def list_categorias(skip: int = 0, limit: int = 100, db: Session = Depends(deps.get_db)):
    return crud.get_multi(db, skip=skip, limit=limit)


@router.get("/{categoria_id}", response_model=CategoriaGastoResponse)
def get_categoria(categoria_id: int, db: Session = Depends(deps.get_db)):
    obj = crud.get(db, categoria_id)
    if not obj:
        raise HTTPException(404, detail="Categoría no encontrada")
    return obj


@router.post("/", response_model=CategoriaGastoResponse)
def create_categoria(obj_in: CategoriaGastoCreate, db: Session = Depends(deps.get_db)):
    return crud.create(db, obj_in)


@router.put("/{categoria_id}", response_model=CategoriaGastoResponse)
def update_categoria(categoria_id: int, obj_in: CategoriaGastoUpdate, db: Session = Depends(deps.get_db)):
    obj = crud.get(db, categoria_id)
    if not obj:
        raise HTTPException(404, detail="Categoría no encontrada")
    return crud.update(db, obj, obj_in)


@router.delete("/{categoria_id}")
def delete_categoria(categoria_id: int, db: Session = Depends(deps.get_db)):
    obj = crud.get(db, categoria_id)
    if not obj:
        raise HTTPException(404, detail="Categoría no encontrada")
    crud.remove(db, categoria_id)
    return {"ok": True}
