import enum

from sqlalchemy import Column, Date, DateTime, Enum, ForeignKey, Integer, String, func
from sqlalchemy.orm import relationship

from app.database import Base


class EstadoSolicitud(str, enum.Enum):
    PENDIENTE = "Pendiente"
    APROBADA = "Aprobada"
    RECHAZADA = "Rechazada"


class SolicitudVacaciones(Base):
    """Solicitud de vacaciones de un empleado para un rango de fechas."""

    __tablename__ = "solicitudes_vacaciones"

    id = Column(Integer, primary_key=True, index=True)
    empleado_id = Column(Integer, ForeignKey("empleados.id"), nullable=False, index=True)

    fecha_inicio = Column(Date, nullable=False)
    fecha_fin = Column(Date, nullable=False)
    dias_solicitados = Column(Integer, nullable=False)

    estado = Column(Enum(EstadoSolicitud), nullable=False, default=EstadoSolicitud.PENDIENTE)
    comentario_empleado = Column(String(300), nullable=True)
    comentario_resolucion = Column(String(300), nullable=True)

    resuelto_por_id = Column(Integer, ForeignKey("empleados.id"), nullable=True)

    fecha_solicitud = Column(DateTime(timezone=True), server_default=func.now())
    fecha_resolucion = Column(DateTime(timezone=True), nullable=True)

    empleado = relationship(
        "Empleado", back_populates="solicitudes_vacaciones", foreign_keys=[empleado_id]
    )
