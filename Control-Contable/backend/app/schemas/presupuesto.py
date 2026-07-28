from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class PresupuestoBase(BaseModel):
    centro_costo_id: int
    categoria_gasto_id: int
    anio: int
    mes: int
    monto_asignado: float
    descripcion: Optional[str] = None


class PresupuestoCreate(PresupuestoBase):
    pass


class PresupuestoUpdate(BaseModel):
    centro_costo_id: Optional[int] = None
    categoria_gasto_id: Optional[int] = None
    anio: Optional[int] = None
    mes: Optional[int] = None
    monto_asignado: Optional[float] = None
    descripcion: Optional[str] = None


class PresupuestoResponse(PresupuestoBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
