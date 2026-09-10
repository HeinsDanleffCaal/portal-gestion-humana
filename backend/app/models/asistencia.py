import enum

from sqlalchemy import Column, Date, DateTime, Enum, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from app.database import Base


class ModalidadTrabajo(str, enum.Enum):
    PRESENCIAL = "Presencial"
    HOME_OFFICE = "Home Office"


class Asistencia(Base):
    """Un registro de asistencia virtual del día: entrada, almuerzo (inicio/fin) y salida."""

    __tablename__ = "asistencias"

    id = Column(Integer, primary_key=True, index=True)
    empleado_id = Column(Integer, ForeignKey("empleados.id"), nullable=False, index=True)
    fecha = Column(Date, nullable=False, index=True)
    modalidad = Column(Enum(ModalidadTrabajo), nullable=True)
    hora_entrada = Column(DateTime(timezone=True), nullable=True)
    hora_inicio_almuerzo = Column(DateTime(timezone=True), nullable=True)
    hora_fin_almuerzo = Column(DateTime(timezone=True), nullable=True)
    hora_salida = Column(DateTime(timezone=True), nullable=True)
    observaciones = Column(String(300), nullable=True)

    empleado = relationship("Empleado", back_populates="asistencias")
