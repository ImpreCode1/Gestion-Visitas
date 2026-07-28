from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class ExtractoBancarioBase(BaseModel):
    cuenta_bancaria_id: int
    periodo: str
    saldo_inicial: float
    saldo_final: float
    archivo: Optional[str] = None


class ExtractoBancarioCreate(ExtractoBancarioBase):
    pass


class ExtractoBancarioUpdate(BaseModel):
    cuenta_bancaria_id: Optional[int] = None
    periodo: Optional[str] = None
    saldo_inicial: Optional[float] = None
    saldo_final: Optional[float] = None
    archivo: Optional[str] = None


class ExtractoBancarioResponse(ExtractoBancarioBase):
    id: int
    procesado: int
    created_at: datetime

    class Config:
        from_attributes = True
