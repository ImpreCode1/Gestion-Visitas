from sqlalchemy import Column, Integer, String, Float, Date, ForeignKey, DateTime, func
from sqlalchemy.orm import relationship
from app.core.database import Base


class Presupuesto(Base):
    __tablename__ = "presupuestos"

    id = Column(Integer, primary_key=True, index=True)
    centro_costo_id = Column(Integer, ForeignKey("centros_costo.id"), nullable=False)
    categoria_gasto_id = Column(Integer, ForeignKey("categorias_gasto.id"), nullable=False)
    anio = Column(Integer, nullable=False)
    mes = Column(Integer, nullable=False)
    monto_asignado = Column(Float, nullable=False)
    descripcion = Column(String(500), nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    centro_costo = relationship("CentroCosto")
    categoria_gasto = relationship("CategoriaGasto")
