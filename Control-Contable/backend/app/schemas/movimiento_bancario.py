from datetime import date, datetime
from typing import Optional
from pydantic import BaseModel


class MovimientoBancarioBase(BaseModel):
    extracto_id: int
    fecha: date
    descripcion: Optional[str] = None
    monto_debito: Optional[float] = 0.0
    monto_credito: Optional[float] = 0.0
    saldo: Optional[float] = None


class MovimientoBancarioCreate(MovimientoBancarioBase):
    pass


class MovimientoBancarioResponse(MovimientoBancarioBase):
    id: int
    conciliado: int
    created_at: datetime

    class Config:
        from_attributes = True
