from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.auth.dependencies import obtener_usuario_actual, requerir_roles
from app.auth.security import hash_password
from app.database import get_db
from app.models.empleado import Empleado, Rol
from app.schemas.empleado import EmpleadoActualizar, EmpleadoCrear, EmpleadoOut

router = APIRouter(prefix="/api/empleados", tags=["Empleados"])


@router.get("", response_model=list[EmpleadoOut])
def listar_empleados(
    db: Session = Depends(get_db),
    _actual: Empleado = Depends(obtener_usuario_actual),
):
    return db.query(Empleado).order_by(Empleado.nombre_completo).all()


@router.get("/{empleado_id}", response_model=EmpleadoOut)
def obtener_empleado(
    empleado_id: int,
    db: Session = Depends(get_db),
    _actual: Empleado = Depends(obtener_usuario_actual),
):
    empleado = db.get(Empleado, empleado_id)
    if empleado is None:
        raise HTTPException(status_code=404, detail="Empleado no encontrado")
    return empleado


@router.post("", response_model=EmpleadoOut, status_code=status.HTTP_201_CREATED)
def crear_empleado(
    datos: EmpleadoCrear,
    db: Session = Depends(get_db),
    _actual: Empleado = Depends(requerir_roles(Rol.ADMINISTRADOR, Rol.RRHH)),
):
    nuevo = Empleado(
        nombre_usuario=datos.nombre_usuario,
        password_hash=hash_password(datos.password),
        nombre_completo=datos.nombre_completo,
        email=datos.email,
        puesto=datos.puesto,
        salario_base=datos.salario_base,
        fecha_ingreso=datos.fecha_ingreso,
        departamento_id=datos.departamento_id,
        rol=datos.rol,
        dias_vacaciones_anuales=datos.dias_vacaciones_anuales,
    )
    db.add(nuevo)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El nombre de usuario o el email ya están registrados",
        )
    db.refresh(nuevo)
    return nuevo


@router.put("/{empleado_id}", response_model=EmpleadoOut)
def actualizar_empleado(
    empleado_id: int,
    datos: EmpleadoActualizar,
    db: Session = Depends(get_db),
    _actual: Empleado = Depends(requerir_roles(Rol.ADMINISTRADOR, Rol.RRHH)),
):
    empleado = db.get(Empleado, empleado_id)
    if empleado is None:
        raise HTTPException(status_code=404, detail="Empleado no encontrado")

    for campo, valor in datos.model_dump(exclude_unset=True).items():
        setattr(empleado, campo, valor)

    db.commit()
    db.refresh(empleado)
    return empleado


@router.delete("/{empleado_id}", status_code=status.HTTP_204_NO_CONTENT)
def desactivar_empleado(
    empleado_id: int,
    db: Session = Depends(get_db),
    _actual: Empleado = Depends(requerir_roles(Rol.ADMINISTRADOR)),
):
    empleado = db.get(Empleado, empleado_id)
    if empleado is None:
        raise HTTPException(status_code=404, detail="Empleado no encontrado")
    empleado.activo = False
    db.commit()
