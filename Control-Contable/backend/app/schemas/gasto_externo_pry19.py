from datetime import date, datetime
from typing import Optional
from pydantic import BaseModel


class GastoExternoPry19Base(BaseModel):
    pry19_id: Optional[str] = None
    pry19_ticket: Optional[str] = None
    centro_costo_id: int
    categoria_gasto_id: int
    monto: float
    fecha: date
    descripcion: Optional[str] = None


class GastoExternoPry19Create(GastoExternoPry19Base):
    pass


class GastoExternoPry19Update(BaseModel):
    pry19_id: Optional[str] = None
    pry19_ticket: Optional[str] = None
    centro_costo_id: Optional[int] = None
    categoria_gasto_id: Optional[int] = None
    monto: Optional[float] = None
    fecha: Optional[date] = None
    descripcion: Optional[str] = None


class GastoExternoPry19Response(GastoExternoPry19Base):
    id: int
    sincronizado: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
