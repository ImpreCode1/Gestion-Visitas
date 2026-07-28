from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.api import deps

router = APIRouter(prefix="/sync-pry19", tags=["sync pry19"])


@router.get("/estado")
def sync_estado():
    return {"sincronizado": False, "ultima_sync": None, "mensaje": "Cliente PRY-19 no configurado (stub)"}


@router.post("/importar")
def sync_importar():
    return {"importados": 0, "errores": 0, "mensaje": "Cliente PRY-19 no disponible (stub)"}


@router.get("/gastos")
def list_gastos_pry19(db: Session = Depends(deps.get_db)):
    return {"gastos": [], "mensaje": "Cliente PRY-19 no disponible (stub)"}
