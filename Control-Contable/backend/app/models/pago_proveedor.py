from sqlalchemy import Column, Integer, String, Float, Date, ForeignKey, DateTime, func
from sqlalchemy.orm import relationship
from app.core.database import Base


class PagoProveedor(Base):
    __tablename__ = "pagos_proveedor"

    id = Column(Integer, primary_key=True, index=True)
    factura_id = Column(Integer, ForeignKey("facturas_proveedor.id"), nullable=False)
    monto = Column(Float, nullable=False)
    fecha_pago = Column(Date, nullable=False)
    metodo_pago = Column(String(100), nullable=True)
    referencia = Column(String(255), nullable=True)
    created_at = Column(DateTime, server_default=func.now())

    factura = relationship("FacturaProveedor")
