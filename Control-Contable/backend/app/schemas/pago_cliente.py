from datetime import date, datetime
from typing import Optional
from pydantic import BaseModel


class PagoClienteBase(BaseModel):
    factura_id: int
    monto: float
    fecha_pago: date
    metodo_pago: Optional[str] = None
    referencia: Optional[str] = None


class PagoClienteCreate(PagoClienteBase):
    pass


class PagoClienteResponse(PagoClienteBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True
