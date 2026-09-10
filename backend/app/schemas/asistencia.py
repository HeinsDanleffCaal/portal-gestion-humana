from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict

from app.models.asistencia import ModalidadTrabajo


class AsistenciaOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    empleado_id: int
    fecha: date
    modalidad: Optional[ModalidadTrabajo] = None
    hora_entrada: Optional[datetime] = None
    hora_inicio_almuerzo: Optional[datetime] = None
    hora_fin_almuerzo: Optional[datetime] = None
    hora_salida: Optional[datetime] = None
    observaciones: Optional[str] = None


class MarcarEntradaIn(BaseModel):
    modalidad: ModalidadTrabajo


class MarcarSalidaIn(BaseModel):
    observaciones: Optional[str] = None
