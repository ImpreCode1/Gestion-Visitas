from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.api import deps
from app.crud import proveedor as crud
from app.schemas.proveedor import ProveedorCreate, ProveedorUpdate, ProveedorResponse

router = APIRouter(prefix="/proveedores", tags=["proveedores"])


@router.get("/", response_model=list[ProveedorResponse])
def list_proveedores(skip: int = 0, limit: int = 100, db: Session = Depends(deps.get_db)):
    return crud.get_multi(db, skip=skip, limit=limit)


@router.get("/{proveedor_id}", response_model=ProveedorResponse)
def get_proveedor(proveedor_id: int, db: Session = Depends(deps.get_db)):
    obj = crud.get(db, proveedor_id)
    if not obj:
        raise HTTPException(404, detail="Proveedor no encontrado")
    return obj


@router.post("/", response_model=ProveedorResponse)
def create_proveedor(obj_in: ProveedorCreate, db: Session = Depends(deps.get_db)):
    return crud.create(db, obj_in)


@router.put("/{proveedor_id}", response_model=ProveedorResponse)
def update_proveedor(proveedor_id: int, obj_in: ProveedorUpdate, db: Session = Depends(deps.get_db)):
    obj = crud.get(db, proveedor_id)
    if not obj:
        raise HTTPException(404, detail="Proveedor no encontrado")
    return crud.update(db, obj, obj_in)


@router.delete("/{proveedor_id}")
def delete_proveedor(proveedor_id: int, db: Session = Depends(deps.get_db)):
    obj = crud.get(db, proveedor_id)
    if not obj:
        raise HTTPException(404, detail="Proveedor no encontrado")
    crud.remove(db, proveedor_id)
    return {"ok": True}
