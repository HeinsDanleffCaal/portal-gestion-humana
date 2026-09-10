from datetime import date, datetime
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, ConfigDict, EmailStr

from app.models.empleado import Rol


class EmpleadoBase(BaseModel):
    nombre_usuario: str
    nombre_completo: str
    email: EmailStr
    puesto: str
    salario_base: Decimal
    fecha_ingreso: date
    departamento_id: int
    rol: Rol = Rol.EMPLEADO
    dias_vacaciones_anuales: int = 15


class EmpleadoCrear(EmpleadoBase):
    password: str


class EmpleadoActualizar(BaseModel):
    nombre_completo: Optional[str] = None
    email: Optional[EmailStr] = None
    puesto: Optional[str] = None
    salario_base: Optional[Decimal] = None
    departamento_id: Optional[int] = None
    rol: Optional[Rol] = None
    activo: Optional[bool] = None
    dias_vacaciones_anuales: Optional[int] = None


class EmpleadoOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    nombre_usuario: str
    nombre_completo: str
    email: str
    puesto: str
    salario_base: Decimal
    fecha_ingreso: date
    activo: bool
    rol: Rol
    departamento_id: int
    dias_vacaciones_anuales: int
    fecha_creacion: Optional[datetime] = None
