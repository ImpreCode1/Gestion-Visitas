from datetime import date, datetime
from typing import Optional
from pydantic import BaseModel


class ConciliacionBase(BaseModel):
    extracto_id: int
    fecha_conciliacion: date
    saldo_libros: float
    saldo_extracto: float
    notas: Optional[str] = None


class ConciliacionCreate(ConciliacionBase):
    pass


class ConciliacionUpdate(BaseModel):
    fecha_conciliacion: Optional[date] = None
    saldo_libros: Optional[float] = None
    saldo_extracto: Optional[float] = None
    notas: Optional[str] = None
    estado: Optional[str] = None


class ConciliacionResponse(ConciliacionBase):
    id: int
    diferencia: float
    estado: str
    created_at: datetime

    class Config:
        from_attributes = True
