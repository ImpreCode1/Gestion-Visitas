from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class CategoriaGastoBase(BaseModel):
    codigo: str
    nombre: str
    descripcion: Optional[str] = None
    activo: Optional[bool] = True


class CategoriaGastoCreate(CategoriaGastoBase):
    pass


class CategoriaGastoUpdate(BaseModel):
    codigo: Optional[str] = None
    nombre: Optional[str] = None
    descripcion: Optional[str] = None
    activo: Optional[bool] = None


class CategoriaGastoResponse(CategoriaGastoBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
