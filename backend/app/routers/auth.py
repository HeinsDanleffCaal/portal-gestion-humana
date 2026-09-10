from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.auth.security import crear_access_token, verificar_password
from app.database import get_db
from app.models.empleado import Empleado
from app.schemas.auth import LoginIn, TokenOut

router = APIRouter(prefix="/api/auth", tags=["Autenticación"])


@router.post("/login", response_model=TokenOut)
def login(datos: LoginIn, db: Session = Depends(get_db)):
    empleado = (
        db.query(Empleado)
        .filter(Empleado.nombre_usuario == datos.nombre_usuario)
        .first()
    )

    credenciales_incorrectas = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Usuario o contraseña incorrectos",
    )

    if empleado is None or not verificar_password(datos.password, empleado.password_hash):
        raise credenciales_incorrectas

    if not empleado.activo:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="El usuario está desactivado",
        )

    token = crear_access_token({"sub": str(empleado.id), "rol": empleado.rol.value})
    return TokenOut(access_token=token, empleado=empleado)
