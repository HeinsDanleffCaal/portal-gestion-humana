from pydantic import BaseModel

from app.schemas.empleado import EmpleadoOut


class LoginIn(BaseModel):
    nombre_usuario: str
    password: str


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    empleado: EmpleadoOut
