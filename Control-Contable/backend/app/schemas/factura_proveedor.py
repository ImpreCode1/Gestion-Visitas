from datetime import date, datetime
from typing import Optional
from pydantic import BaseModel


class FacturaProveedorBase(BaseModel):
    proveedor_id: int
    numero_factura: str
    fecha_emision: date
    fecha_vencimiento: Optional[date] = None
    monto: float
    saldo_pendiente: Optional[float] = None
    estado: Optional[str] = "pendiente"


class FacturaProveedorCreate(FacturaProveedorBase):
    pass


class FacturaProveedorUpdate(BaseModel):
    numero_factura: Optional[str] = None
    fecha_emision: Optional[date] = None
    fecha_vencimiento: Optional[date] = None
    monto: Optional[float] = None
    saldo_pendiente: Optional[float] = None
    estado: Optional[str] = None


class FacturaProveedorResponse(FacturaProveedorBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
