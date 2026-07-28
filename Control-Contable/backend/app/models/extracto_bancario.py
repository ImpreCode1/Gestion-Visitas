from sqlalchemy import Column, Integer, String, Float, Date, ForeignKey, Text, DateTime, func
from sqlalchemy.orm import relationship
from app.core.database import Base


class ExtractoBancario(Base):
    __tablename__ = "extractos_bancarios"

    id = Column(Integer, primary_key=True, index=True)
    cuenta_bancaria_id = Column(Integer, ForeignKey("cuentas_bancarias.id"), nullable=False)
    periodo = Column(String(7), nullable=False)
    saldo_inicial = Column(Float, nullable=False)
    saldo_final = Column(Float, nullable=False)
    archivo = Column(String(255), nullable=True)
    procesado = Column(Integer, default=0)
    created_at = Column(DateTime, server_default=func.now())

    cuenta_bancaria = relationship("CuentaBancaria")
