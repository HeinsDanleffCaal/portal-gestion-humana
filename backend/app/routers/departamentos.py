from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.auth.dependencies import obtener_usuario_actual, requerir_roles
from app.database import get_db
from app.models.departamento import Departamento
from app.models.empleado import Empleado, Rol
from app.schemas.departamento import DepartamentoCrear, DepartamentoOut

router = APIRouter(prefix="/api/departamentos", tags=["Departamentos"])


@router.get("", response_model=list[DepartamentoOut])
def listar_departamentos(
    db: Session = Depends(get_db),
    _actual: Empleado = Depends(obtener_usuario_actual),
):
    return db.query(Departamento).order_by(Departamento.nombre).all()


@router.post("", response_model=DepartamentoOut, status_code=status.HTTP_201_CREATED)
def crear_departamento(
    datos: DepartamentoCrear,
    db: Session = Depends(get_db),
    _actual: Empleado = Depends(requerir_roles(Rol.ADMINISTRADOR, Rol.RRHH)),
):
    nuevo = Departamento(nombre=datos.nombre)
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)
    return nuevo
