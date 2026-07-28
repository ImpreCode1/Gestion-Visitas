from datetime import date, datetime
from typing import Optional
from pydantic import BaseModel


class GastoInternoBase(BaseModel):
    centro_costo_id: int
    categoria_gasto_id: int
    monto: float
    fecha: date
    descripcion: Optional[str] = None
    comprobante: Optional[str] = None


class GastoInternoCreate(GastoInternoBase):
    pass


class GastoInternoUpdate(BaseModel):
    centro_costo_id: Optional[int] = None
    categoria_gasto_id: Optional[int] = None
    monto: Optional[float] = None
    fecha: Optional[date] = None
    descripcion: Optional[str] = None
    comprobante: Optional[str] = None


class GastoInternoResponse(GastoInternoBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True
