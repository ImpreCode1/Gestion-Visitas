from datetime import date, datetime
from typing import Optional
from pydantic import BaseModel


class ProveedorBase(BaseModel):
    nombre: str
    nit: str
    contacto: Optional[str] = None
    telefono: Optional[str] = None
    email: Optional[str] = None
    activo: Optional[bool] = True


class ProveedorCreate(ProveedorBase):
    pass


class ProveedorUpdate(BaseModel):
    nombre: Optional[str] = None
    nit: Optional[str] = None
    contacto: Optional[str] = None
    telefono: Optional[str] = None
    email: Optional[str] = None
    activo: Optional[bool] = None


class ProveedorResponse(ProveedorBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
