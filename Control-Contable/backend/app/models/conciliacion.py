from sqlalchemy import Column, Integer, String, Float, Date, ForeignKey, Text, DateTime, func
from sqlalchemy.orm import relationship
from app.core.database import Base


class Conciliacion(Base):
    __tablename__ = "conciliaciones"

    id = Column(Integer, primary_key=True, index=True)
    extracto_id = Column(Integer, ForeignKey("extractos_bancarios.id"), nullable=False)
    fecha_conciliacion = Column(Date, nullable=False)
    saldo_libros = Column(Float, nullable=False)
    saldo_extracto = Column(Float, nullable=False)
    diferencia = Column(Float, nullable=False)
    notas = Column(Text, nullable=True)
    estado = Column(String(50), default="pendiente")
    created_at = Column(DateTime, server_default=func.now())

    extracto = relationship("ExtractoBancario")
