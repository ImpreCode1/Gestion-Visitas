from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class CuentaBancariaBase(BaseModel):
    banco: str
    numero_cuenta: str
    tipo_cuenta: str
    saldo_inicial: Optional[float] = 0.0
    activa: Optional[bool] = True


class CuentaBancariaCreate(CuentaBancariaBase):
    pass


class CuentaBancariaUpdate(BaseModel):
    banco: Optional[str] = None
    numero_cuenta: Optional[str] = None
    tipo_cuenta: Optional[str] = None
    saldo_inicial: Optional[float] = None
    activa: Optional[bool] = None


class CuentaBancariaResponse(CuentaBancariaBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
