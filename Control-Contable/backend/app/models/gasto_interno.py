from sqlalchemy import Column, Integer, String, Float, Date, ForeignKey, Text, DateTime, func
from sqlalchemy.orm import relationship
from app.core.database import Base


class GastoInterno(Base):
    __tablename__ = "gastos_internos"

    id = Column(Integer, primary_key=True, index=True)
    centro_costo_id = Column(Integer, ForeignKey("centros_costo.id"), nullable=False)
    categoria_gasto_id = Column(Integer, ForeignKey("categorias_gasto.id"), nullable=False)
    monto = Column(Float, nullable=False)
    fecha = Column(Date, nullable=False)
    descripcion = Column(Text, nullable=True)
    comprobante = Column(String(255), nullable=True)
    created_at = Column(DateTime, server_default=func.now())

    centro_costo = relationship("CentroCosto")
    categoria_gasto = relationship("CategoriaGasto")
