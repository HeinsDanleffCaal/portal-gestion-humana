from datetime import date, datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.auth.dependencies import obtener_usuario_actual, requerir_roles
from app.database import get_db
from app.models.asistencia import Asistencia
from app.models.empleado import Empleado, Rol
from app.schemas.asistencia import AsistenciaOut, MarcarSalidaIn

router = APIRouter(prefix="/api/asistencia", tags=["Asistencia"])


@router.post("/entrada", response_model=AsistenciaOut, status_code=status.HTTP_201_CREATED)
def marcar_entrada(
    db: Session = Depends(get_db),
    actual: Empleado = Depends(obtener_usuario_actual),
):
    """El propio empleado marca su entrada del día (una sola vez por día)."""
    hoy = date.today()
    existente = (
        db.query(Asistencia)
        .filter(Asistencia.empleado_id == actual.id, Asistencia.fecha == hoy)
        .first()
    )
    if existente is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ya marcaste tu entrada hoy",
        )

    registro = Asistencia(
        empleado_id=actual.id,
        fecha=hoy,
        hora_entrada=datetime.now(timezone.utc),
    )
    db.add(registro)
    db.commit()
    db.refresh(registro)
    return registro


@router.post("/salida", response_model=AsistenciaOut)
def marcar_salida(
    datos: MarcarSalidaIn,
    db: Session = Depends(get_db),
    actual: Empleado = Depends(obtener_usuario_actual),
):
    """El propio empleado marca su salida del día (requiere haber marcado entrada antes)."""
    hoy = date.today()
    registro = (
        db.query(Asistencia)
        .filter(Asistencia.empleado_id == actual.id, Asistencia.fecha == hoy)
        .first()
    )
    if registro is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Primero debes marcar tu entrada",
        )
    if registro.hora_salida is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ya marcaste tu salida hoy",
        )

    registro.hora_salida = datetime.now(timezone.utc)
    if datos.observaciones:
        registro.observaciones = datos.observaciones
    db.commit()
    db.refresh(registro)
    return registro


@router.get("/mias", response_model=list[AsistenciaOut])
def mi_historial(
    db: Session = Depends(get_db),
    actual: Empleado = Depends(obtener_usuario_actual),
):
    return (
        db.query(Asistencia)
        .filter(Asistencia.empleado_id == actual.id)
        .order_by(Asistencia.fecha.desc())
        .all()
    )


@router.get("/empleado/{empleado_id}", response_model=list[AsistenciaOut])
def historial_de_empleado(
    empleado_id: int,
    db: Session = Depends(get_db),
    _actual: Empleado = Depends(requerir_roles(Rol.ADMINISTRADOR, Rol.RRHH)),
):
    """RRHH/Admin puede consultar el historial de asistencia de cualquier empleado."""
    return (
        db.query(Asistencia)
        .filter(Asistencia.empleado_id == empleado_id)
        .order_by(Asistencia.fecha.desc())
        .all()
    )
