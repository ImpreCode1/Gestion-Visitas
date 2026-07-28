from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.api import deps
from app.crud import cliente as crud
from app.schemas.cliente import ClienteCreate, ClienteUpdate, ClienteResponse

router = APIRouter(prefix="/clientes", tags=["clientes"])


@router.get("/", response_model=list[ClienteResponse])
def list_clientes(skip: int = 0, limit: int = 100, db: Session = Depends(deps.get_db)):
    return crud.get_multi(db, skip=skip, limit=limit)


@router.get("/{cliente_id}", response_model=ClienteResponse)
def get_cliente(cliente_id: int, db: Session = Depends(deps.get_db)):
    obj = crud.get(db, cliente_id)
    if not obj:
        raise HTTPException(404, detail="Cliente no encontrado")
    return obj


@router.post("/", response_model=ClienteResponse)
def create_cliente(obj_in: ClienteCreate, db: Session = Depends(deps.get_db)):
    return crud.create(db, obj_in)


@router.put("/{cliente_id}", response_model=ClienteResponse)
def update_cliente(cliente_id: int, obj_in: ClienteUpdate, db: Session = Depends(deps.get_db)):
    obj = crud.get(db, cliente_id)
    if not obj:
        raise HTTPException(404, detail="Cliente no encontrado")
    return crud.update(db, obj, obj_in)


@router.delete("/{cliente_id}")
def delete_cliente(cliente_id: int, db: Session = Depends(deps.get_db)):
    obj = crud.get(db, cliente_id)
    if not obj:
        raise HTTPException(404, detail="Cliente no encontrado")
    crud.remove(db, cliente_id)
    return {"ok": True}
