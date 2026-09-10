import enum

from sqlalchemy import Boolean, Column, Date, DateTime, Enum, ForeignKey, Integer, Numeric, String, func
from sqlalchemy.orm import relationship

from app.database import Base


class Rol(str, enum.Enum):
    ADMINISTRADOR = "Administrador"
    RRHH = "RRHH"
    EMPLEADO = "Empleado"


class Empleado(Base):
    """
    Representa tanto al empleado (ficha de RRHH) como a su cuenta de acceso
    al portal: un empleado puede iniciar sesión con su propio usuario.
    """

    __tablename__ = "empleados"

    id = Column(Integer, primary_key=True, index=True)

    # Credenciales de acceso
    nombre_usuario = Column(String(50), nullable=False, unique=True, index=True)
    password_hash = Column(String(255), nullable=False)
    rol = Column(Enum(Rol), nullable=False, default=Rol.EMPLEADO)

    # Datos de la ficha de empleado
    nombre_completo = Column(String(150), nullable=False)
    email = Column(String(150), nullable=False, unique=True)
    puesto = Column(String(100), nullable=False)
    salario_base = Column(Numeric(10, 2), nullable=False, default=0)
    fecha_ingreso = Column(Date, nullable=False)
    activo = Column(Boolean, nullable=False, default=True)
    fecha_creacion = Column(DateTime(timezone=True), server_default=func.now())
    dias_vacaciones_anuales = Column(Integer, nullable=False, default=15)

    departamento_id = Column(Integer, ForeignKey("departamentos.id"), nullable=False)
    departamento = relationship("Departamento", back_populates="empleados")

    asistencias = relationship("Asistencia", back_populates="empleado", cascade="all, delete-orphan")
    boletas = relationship("BoletaPago", back_populates="empleado", cascade="all, delete-orphan")
    solicitudes_vacaciones = relationship(
        "SolicitudVacaciones",
        back_populates="empleado",
        cascade="all, delete-orphan",
        foreign_keys="SolicitudVacaciones.empleado_id",
    )
