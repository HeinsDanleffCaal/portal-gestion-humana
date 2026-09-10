from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, field_validator

from app.models.vacaciones import EstadoSolicitud


class SolicitudVacacionesIn(BaseModel):
    fecha_inicio: date
    fecha_fin: date
    comentario_empleado: Optional[str] = None

    @field_validator("fecha_fin")
    @classmethod
    def validar_rango(cls, fecha_fin: date, info):
        fecha_inicio = info.data.get("fecha_inicio")
        if fecha_inicio and fecha_fin < fecha_inicio:
            raise ValueError("La fecha de fin no puede ser anterior a la fecha de inicio")
        return fecha_fin


class ResolverSolicitudIn(BaseModel):
    estado: EstadoSolicitud
    comentario_resolucion: Optional[str] = None

    @field_validator("estado")
    @classmethod
    def validar_estado(cls, v: EstadoSolicitud) -> EstadoSolicitud:
        if v == EstadoSolicitud.PENDIENTE:
            raise ValueError("El estado de resolución debe ser Aprobada o Rechazada")
        return v


class SolicitudVacacionesOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    empleado_id: int
    fecha_inicio: date
    fecha_fin: date
    dias_solicitados: int
    estado: EstadoSolicitud
    comentario_empleado: Optional[str] = None
    comentario_resolucion: Optional[str] = None
    fecha_solicitud: Optional[datetime] = None
    fecha_resolucion: Optional[datetime] = None


class SaldoVacacionesOut(BaseModel):
    dias_asignados: int
    dias_tomados: int
    dias_pendientes_aprobacion: int
    dias_disponibles: int
