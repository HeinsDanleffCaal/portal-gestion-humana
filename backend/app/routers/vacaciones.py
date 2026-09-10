from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.auth.dependencies import obtener_usuario_actual, requerir_roles
from app.database import get_db
from app.models.empleado import Empleado, Rol
from app.models.vacaciones import EstadoSolicitud, SolicitudVacaciones
from app.schemas.vacaciones import (
    ResolverSolicitudIn,
    SaldoVacacionesOut,
    SolicitudVacacionesIn,
    SolicitudVacacionesOut,
)

router = APIRouter(prefix="/api/vacaciones", tags=["Vacaciones"])


def _calcular_saldo(db: Session, empleado: Empleado) -> SaldoVacacionesOut:
    solicitudes = (
        db.query(SolicitudVacaciones)
        .filter(SolicitudVacaciones.empleado_id == empleado.id)
        .all()
    )
    dias_tomados = sum(
        s.dias_solicitados for s in solicitudes if s.estado == EstadoSolicitud.APROBADA
    )
    dias_pendientes = sum(
        s.dias_solicitados for s in solicitudes if s.estado == EstadoSolicitud.PENDIENTE
    )
    return SaldoVacacionesOut(
        dias_asignados=empleado.dias_vacaciones_anuales,
        dias_tomados=dias_tomados,
        dias_pendientes_aprobacion=dias_pendientes,
        dias_disponibles=empleado.dias_vacaciones_anuales - dias_tomados - dias_pendientes,
    )


@router.get("/saldo", response_model=SaldoVacacionesOut)
def mi_saldo(
    db: Session = Depends(get_db),
    actual: Empleado = Depends(obtener_usuario_actual),
):
    return _calcular_saldo(db, actual)


@router.post("/solicitar", response_model=SolicitudVacacionesOut, status_code=status.HTTP_201_CREATED)
def solicitar_vacaciones(
    datos: SolicitudVacacionesIn,
    db: Session = Depends(get_db),
    actual: Empleado = Depends(obtener_usuario_actual),
):
    dias_solicitados = (datos.fecha_fin - datos.fecha_inicio).days + 1

    saldo = _calcular_saldo(db, actual)
    if dias_solicitados > saldo.dias_disponibles:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                f"Solicitas {dias_solicitados} día(s), pero solo tienes "
                f"{saldo.dias_disponibles} día(s) disponibles"
            ),
        )

    solicitud = SolicitudVacaciones(
        empleado_id=actual.id,
        fecha_inicio=datos.fecha_inicio,
        fecha_fin=datos.fecha_fin,
        dias_solicitados=dias_solicitados,
        comentario_empleado=datos.comentario_empleado,
        estado=EstadoSolicitud.PENDIENTE,
    )
    db.add(solicitud)
    db.commit()
    db.refresh(solicitud)
    return solicitud


@router.get("/mias", response_model=list[SolicitudVacacionesOut])
def mis_solicitudes(
    db: Session = Depends(get_db),
    actual: Empleado = Depends(obtener_usuario_actual),
):
    return (
        db.query(SolicitudVacaciones)
        .filter(SolicitudVacaciones.empleado_id == actual.id)
        .order_by(SolicitudVacaciones.fecha_solicitud.desc())
        .all()
    )


@router.get("/pendientes", response_model=list[SolicitudVacacionesOut])
def solicitudes_pendientes(
    db: Session = Depends(get_db),
    _actual: Empleado = Depends(requerir_roles(Rol.ADMINISTRADOR, Rol.RRHH)),
):
    """RRHH/Administrador consulta todas las solicitudes pendientes de aprobación."""
    return (
        db.query(SolicitudVacaciones)
        .filter(SolicitudVacaciones.estado == EstadoSolicitud.PENDIENTE)
        .order_by(SolicitudVacaciones.fecha_solicitud.asc())
        .all()
    )


@router.get("/empleado/{empleado_id}", response_model=list[SolicitudVacacionesOut])
def solicitudes_de_empleado(
    empleado_id: int,
    db: Session = Depends(get_db),
    _actual: Empleado = Depends(requerir_roles(Rol.ADMINISTRADOR, Rol.RRHH)),
):
    return (
        db.query(SolicitudVacaciones)
        .filter(SolicitudVacaciones.empleado_id == empleado_id)
        .order_by(SolicitudVacaciones.fecha_solicitud.desc())
        .all()
    )


@router.post("/{solicitud_id}/resolver", response_model=SolicitudVacacionesOut)
def resolver_solicitud(
    solicitud_id: int,
    datos: ResolverSolicitudIn,
    db: Session = Depends(get_db),
    actual: Empleado = Depends(requerir_roles(Rol.ADMINISTRADOR, Rol.RRHH)),
):
    """RRHH/Administrador aprueba o rechaza una solicitud de vacaciones pendiente."""
    solicitud = db.get(SolicitudVacaciones, solicitud_id)
    if solicitud is None:
        raise HTTPException(status_code=404, detail="Solicitud no encontrada")
    if solicitud.estado != EstadoSolicitud.PENDIENTE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Esta solicitud ya fue resuelta",
        )

    if datos.estado == EstadoSolicitud.APROBADA:
        empleado = db.get(Empleado, solicitud.empleado_id)
        saldo = _calcular_saldo(db, empleado)
        # El saldo ya descuenta esta solicitud como pendiente, así que sólo
        # validamos que siga siendo cubierta por lo disponible (>= 0 tras aprobar).
        if saldo.dias_disponibles < 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El empleado ya no tiene suficientes días disponibles para aprobar esta solicitud",
            )

    solicitud.estado = datos.estado
    solicitud.comentario_resolucion = datos.comentario_resolucion
    solicitud.resuelto_por_id = actual.id
    solicitud.fecha_resolucion = datetime.now(timezone.utc)
    db.commit()
    db.refresh(solicitud)
    return solicitud
