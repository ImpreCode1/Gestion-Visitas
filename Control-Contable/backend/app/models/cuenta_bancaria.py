from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, func
from app.core.database import Base


class CuentaBancaria(Base):
    __tablename__ = "cuentas_bancarias"

    id = Column(Integer, primary_key=True, index=True)
    banco = Column(String(255), nullable=False)
    numero_cuenta = Column(String(100), nullable=False)
    tipo_cuenta = Column(String(50), nullable=False)
    saldo_inicial = Column(Float, default=0.0)
    activa = Column(Boolean, default=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
