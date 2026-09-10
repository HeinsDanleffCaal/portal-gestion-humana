from sqlalchemy import Column, Date, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from app.database import Base


class Asistencia(Base):
    """Un registro de asistencia virtual: marca de entrada y, más tarde, de salida."""

    __tablename__ = "asistencias"

    id = Column(Integer, primary_key=True, index=True)
    empleado_id = Column(Integer, ForeignKey("empleados.id"), nullable=False, index=True)
    fecha = Column(Date, nullable=False, index=True)
    hora_entrada = Column(DateTime(timezone=True), nullable=True)
    hora_salida = Column(DateTime(timezone=True), nullable=True)
    observaciones = Column(String(300), nullable=True)

    empleado = relationship("Empleado", back_populates="asistencias")
