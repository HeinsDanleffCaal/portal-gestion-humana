from app.models.departamento import Departamento
from app.models.empleado import Empleado, Rol
from app.models.asistencia import Asistencia, ModalidadTrabajo
from app.models.boleta import BoletaPago, BoletaPagoDetalle
from app.models.vacaciones import EstadoSolicitud, SolicitudVacaciones

__all__ = [
    "Departamento",
    "Empleado",
    "Rol",
    "Asistencia",
    "ModalidadTrabajo",
    "BoletaPago",
    "BoletaPagoDetalle",
    "EstadoSolicitud",
    "SolicitudVacaciones",
]
