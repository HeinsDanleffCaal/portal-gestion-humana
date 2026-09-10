import enum

from sqlalchemy import Column, Date, DateTime, Enum, ForeignKey, Integer, Numeric, String, func
from sqlalchemy.orm import relationship

from app.database import Base


class TipoConcepto(str, enum.Enum):
    INGRESO = "Ingreso"
    DESCUENTO = "Descuento"


class BoletaPago(Base):
    """Boleta de pago de un empleado para un periodo (ej. '2026-09')."""

    __tablename__ = "boletas_pago"

    id = Column(Integer, primary_key=True, index=True)
    empleado_id = Column(Integer, ForeignKey("empleados.id"), nullable=False, index=True)
    periodo = Column(String(7), nullable=False, index=True)  # formato AAAA-MM
    fecha_pago = Column(Date, nullable=True)

    salario_base = Column(Numeric(10, 2), nullable=False)
    total_ingresos = Column(Numeric(10, 2), nullable=False, default=0)
    total_descuentos = Column(Numeric(10, 2), nullable=False, default=0)
    salario_liquido = Column(Numeric(10, 2), nullable=False, default=0)

    fecha_generacion = Column(DateTime(timezone=True), server_default=func.now())

    empleado = relationship("Empleado", back_populates="boletas")
    detalle = relationship("BoletaPagoDetalle", back_populates="boleta", cascade="all, delete-orphan")


class BoletaPagoDetalle(Base):
    """Cada línea (concepto) que compone una boleta: bonificaciones, IGSS, ISR, etc."""

    __tablename__ = "boletas_pago_detalle"

    id = Column(Integer, primary_key=True, index=True)
    boleta_id = Column(Integer, ForeignKey("boletas_pago.id"), nullable=False, index=True)
    concepto = Column(String(100), nullable=False)
    tipo = Column(Enum(TipoConcepto), nullable=False)
    monto = Column(Numeric(10, 2), nullable=False)

    boleta = relationship("BoletaPago", back_populates="detalle")
