from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict


class AsistenciaOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    empleado_id: int
    fecha: date
    hora_entrada: Optional[datetime] = None
    hora_salida: Optional[datetime] = None
    observaciones: Optional[str] = None


class MarcarSalidaIn(BaseModel):
    observaciones: Optional[str] = None
