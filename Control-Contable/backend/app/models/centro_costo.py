from sqlalchemy import Column, Integer, String, Boolean, DateTime, func
from app.core.database import Base


class CentroCosto(Base):
    __tablename__ = "centros_costo"

    id = Column(Integer, primary_key=True, index=True)
    codigo = Column(String(50), unique=True, nullable=False)
    nombre = Column(String(255), nullable=False)
    descripcion = Column(String(500), nullable=True)
    activo = Column(Boolean, default=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
