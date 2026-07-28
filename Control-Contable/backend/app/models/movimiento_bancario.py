from sqlalchemy import Column, Integer, String, Float, Date, ForeignKey, Text, DateTime, func
from sqlalchemy.orm import relationship
from app.core.database import Base


class MovimientoBancario(Base):
    __tablename__ = "movimientos_bancarios"

    id = Column(Integer, primary_key=True, index=True)
    extracto_id = Column(Integer, ForeignKey("extractos_bancarios.id"), nullable=False)
    fecha = Column(Date, nullable=False)
    descripcion = Column(Text, nullable=True)
    monto_debito = Column(Float, default=0.0)
    monto_credito = Column(Float, default=0.0)
    saldo = Column(Float, nullable=True)
    conciliado = Column(Integer, default=0)
    created_at = Column(DateTime, server_default=func.now())

    extracto = relationship("ExtractoBancario")
