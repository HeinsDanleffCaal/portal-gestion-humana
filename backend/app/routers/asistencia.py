from datetime import date, datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.auth.dependencies import obtener_usuario_actual, requerir_roles
from app.database import get_db
from app.models.asistencia import Asistencia
from app.models.empleado import Empleado, Rol
from app.schemas.asistencia import AsistenciaOut, MarcarEntradaIn, MarcarSalidaIn

router = APIRouter(prefix="/api/asistencia", tags=["Asistencia"])


def _registro_de_hoy(db: Session, empleado_id: int) -> Asistencia | None:
    return (
        db.query(Asistencia)
        .filter(Asistencia.empleado_id == empleado_id, Asistencia.fecha == date.today())
        .first()
    )


@router.post("/entrada", response_model=AsistenciaOut, status_code=status.HTTP_201_CREATED)
def marcar_entrada(
    datos: MarcarEntradaIn,
    db: Session = Depends(get_db),
    actual: Empleado = Depends(obtener_usuario_actual),
):
    """El propio empleado marca su entrada del día (una sola vez por día), indicando modalidad."""
    if _registro_de_hoy(db, actual.id) is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ya marcaste tu entrada hoy",
        )

    registro = Asistencia(
        empleado_id=actual.id,
        fecha=date.today(),
        modalidad=datos.modalidad,
        hora_entrada=datetime.now(timezone.utc),
    )
    db.add(registro)
    db.commit()
    db.refresh(registro)
    return registro


@router.post("/almuerzo/inicio", response_model=AsistenciaOut)
def marcar_inicio_almuerzo(
    db: Session = Depends(get_db),
    actual: Empleado = Depends(obtener_usuario_actual),
):
    """El propio empleado marca el inicio de su almuerzo (requiere haber marcado entrada antes)."""
    registro = _registro_de_hoy(db, actual.id)
    if registro is None or registro.hora_entrada is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Primero debes marcar tu entrada",
        )
    if registro.hora_salida is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ya marcaste tu salida hoy",
        )
    if registro.hora_inicio_almuerzo is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ya marcaste el inicio de tu almuerzo hoy",
        )

    registro.hora_inicio_almuerzo = datetime.now(timezone.utc)
    db.commit()
    db.refresh(registro)
    return registro


@router.post("/almuerzo/fin", response_model=AsistenciaOut)
def marcar_fin_almuerzo(
    db: Session = Depends(get_db),
    actual: Empleado = Depends(obtener_usuario_actual),
):
    """El propio empleado marca el fin de su almuerzo (requiere haber marcado el inicio antes)."""
    registro = _registro_de_hoy(db, actual.id)
    if registro is None or registro.hora_inicio_almuerzo is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Primero debes marcar el inicio de tu almuerzo",
        )
    if registro.hora_fin_almuerzo is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ya marcaste el fin de tu almuerzo hoy",
        )

    registro.hora_fin_almuerzo = datetime.now(timezone.utc)
    db.commit()
    db.refresh(registro)
    return registro


@router.post("/salida", response_model=AsistenciaOut)
def marcar_salida(
    datos: MarcarSalidaIn,
    db: Session = Depends(get_db),
    actual: Empleado = Depends(obtener_usuario_actual),
):
    """El propio empleado marca su salida del día (requiere haber marcado entrada, y si inició
    su almuerzo, también haberlo finalizado)."""
    registro = _registro_de_hoy(db, actual.id)
    if registro is None or registro.hora_entrada is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Primero debes marcar tu entrada",
        )
    if registro.hora_salida is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ya marcaste tu salida hoy",
        )
    if registro.hora_inicio_almuerzo is not None and registro.hora_fin_almuerzo is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Primero debes marcar el fin de tu almuerzo",
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
