from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.auth.security import decodificar_token
from app.database import get_db
from app.models.empleado import Empleado, Rol

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


def obtener_usuario_actual(
    token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)
) -> Empleado:
    credenciales_invalidas = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="No se pudo validar la credencial",
        headers={"WWW-Authenticate": "Bearer"},
    )

    payload = decodificar_token(token)
    if payload is None:
        raise credenciales_invalidas

    empleado_id = payload.get("sub")
    if empleado_id is None:
        raise credenciales_invalidas

    empleado = db.get(Empleado, int(empleado_id))
    if empleado is None or not empleado.activo:
        raise credenciales_invalidas

    return empleado


def requerir_roles(*roles_permitidos: Rol):
    """Dependencia parametrizada: exige que el usuario autenticado tenga uno de los roles dados."""

    def verificador(empleado: Empleado = Depends(obtener_usuario_actual)) -> Empleado:
        if empleado.rol not in roles_permitidos:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tienes permisos para realizar esta acción",
            )
        return empleado

    return verificador
