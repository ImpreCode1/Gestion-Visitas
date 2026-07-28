from sqlalchemy import Column, Integer, String, Float, Date, ForeignKey, Text, DateTime, func
from sqlalchemy.orm import relationship
from app.core.database import Base


class GastoExternoPry19(Base):
    __tablename__ = "gastos_externos_pry19"

    id = Column(Integer, primary_key=True, index=True)
    pry19_id = Column(String(100), unique=True, nullable=True)
    pry19_ticket = Column(String(255), nullable=True)
    centro_costo_id = Column(Integer, ForeignKey("centros_costo.id"), nullable=False)
    categoria_gasto_id = Column(Integer, ForeignKey("categorias_gasto.id"), nullable=False)
    monto = Column(Float, nullable=False)
    fecha = Column(Date, nullable=False)
    descripcion = Column(Text, nullable=True)
    sincronizado = Column(DateTime, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    centro_costo = relationship("CentroCosto")
    categoria_gasto = relationship("CategoriaGasto")
