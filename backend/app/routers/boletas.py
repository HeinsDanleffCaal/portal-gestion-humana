from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app.auth.dependencies import obtener_usuario_actual, requerir_roles
from app.database import get_db
from app.models.boleta import BoletaPago, BoletaPagoDetalle, TipoConcepto
from app.models.empleado import Empleado, Rol
from app.schemas.boleta import BoletaGenerarIn, BoletaOut

router = APIRouter(prefix="/api/boletas", tags=["Boletas de pago"])


@router.post("/generar", response_model=BoletaOut, status_code=status.HTTP_201_CREATED)
def generar_boleta(
    datos: BoletaGenerarIn,
    db: Session = Depends(get_db),
    _actual: Empleado = Depends(requerir_roles(Rol.ADMINISTRADOR, Rol.RRHH)),
):
    """
    Genera la boleta de pago de un empleado para un periodo, calculando el
    salario líquido a partir del salario base más los conceptos de ingreso
    y descuento recibidos. Todo se guarda en una sola transacción: si algo
    falla, no queda ni la boleta ni el detalle a medias.
    """
    empleado = db.get(Empleado, datos.empleado_id)
    if empleado is None:
        raise HTTPException(status_code=404, detail="Empleado no encontrado")

    existente = (
        db.query(BoletaPago)
        .filter(BoletaPago.empleado_id == datos.empleado_id, BoletaPago.periodo == datos.periodo)
        .first()
    )
    if existente is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Ya existe una boleta de {empleado.nombre_completo} para el periodo {datos.periodo}",
        )

    total_ingresos = sum(
        (c.monto for c in datos.conceptos if c.tipo == TipoConcepto.INGRESO), Decimal("0")
    )
    total_descuentos = sum(
        (c.monto for c in datos.conceptos if c.tipo == TipoConcepto.DESCUENTO), Decimal("0")
    )
    salario_liquido = empleado.salario_base + total_ingresos - total_descuentos

    if salario_liquido < 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Los descuentos no pueden superar el salario base más los ingresos",
        )

    boleta = BoletaPago(
        empleado_id=empleado.id,
        periodo=datos.periodo,
        salario_base=empleado.salario_base,
        total_ingresos=total_ingresos,
        total_descuentos=total_descuentos,
        salario_liquido=salario_liquido,
    )
    boleta.detalle = [
        BoletaPagoDetalle(concepto=c.concepto, tipo=c.tipo, monto=c.monto) for c in datos.conceptos
    ]

    try:
        db.add(boleta)
        db.commit()
    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="No se pudo generar la boleta, se revirtió la operación",
        )

    db.refresh(boleta)
    return boleta


@router.get("/mias", response_model=list[BoletaOut])
def mis_boletas(
    db: Session = Depends(get_db),
    actual: Empleado = Depends(obtener_usuario_actual),
):
    return (
        db.query(BoletaPago)
        .options(joinedload(BoletaPago.detalle))
        .filter(BoletaPago.empleado_id == actual.id)
        .order_by(BoletaPago.periodo.desc())
        .all()
    )


@router.get("/empleado/{empleado_id}", response_model=list[BoletaOut])
def boletas_de_empleado(
    empleado_id: int,
    db: Session = Depends(get_db),
    _actual: Empleado = Depends(requerir_roles(Rol.ADMINISTRADOR, Rol.RRHH)),
):
    return (
        db.query(BoletaPago)
        .options(joinedload(BoletaPago.detalle))
        .filter(BoletaPago.empleado_id == empleado_id)
        .order_by(BoletaPago.periodo.desc())
        .all()
    )
