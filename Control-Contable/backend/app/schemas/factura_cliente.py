from datetime import date, datetime
from typing import Optional
from pydantic import BaseModel


class FacturaClienteBase(BaseModel):
    cliente_id: int
    numero_factura: str
    fecha_emision: date
    fecha_vencimiento: Optional[date] = None
    monto: float
    saldo_pendiente: Optional[float] = None
    estado: Optional[str] = "pendiente"


class FacturaClienteCreate(FacturaClienteBase):
    pass


class FacturaClienteUpdate(BaseModel):
    numero_factura: Optional[str] = None
    fecha_emision: Optional[date] = None
    fecha_vencimiento: Optional[date] = None
    monto: Optional[float] = None
    saldo_pendiente: Optional[float] = None
    estado: Optional[str] = None


class FacturaClienteResponse(FacturaClienteBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
