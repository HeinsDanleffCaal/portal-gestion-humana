from datetime import datetime
from decimal import Decimal
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, field_validator

from app.models.boleta import TipoConcepto


class ConceptoIn(BaseModel):
    concepto: str
    tipo: TipoConcepto
    monto: Decimal


class BoletaGenerarIn(BaseModel):
    empleado_id: int
    periodo: str  # AAAA-MM
    conceptos: List[ConceptoIn] = []

    @field_validator("periodo")
    @classmethod
    def validar_periodo(cls, v: str) -> str:
        partes = v.split("-")
        if len(partes) != 2 or len(partes[0]) != 4 or len(partes[1]) != 2:
            raise ValueError("El periodo debe tener formato AAAA-MM, ej. 2026-09")
        return v


class ConceptoOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    concepto: str
    tipo: TipoConcepto
    monto: Decimal


class BoletaOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    empleado_id: int
    periodo: str
    salario_base: Decimal
    total_ingresos: Decimal
    total_descuentos: Decimal
    salario_liquido: Decimal
    fecha_generacion: Optional[datetime] = None
    detalle: List[ConceptoOut] = []
