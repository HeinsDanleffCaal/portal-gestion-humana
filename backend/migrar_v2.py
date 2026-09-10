"""
Script de migración manual: agrega a una base de datos EXISTENTE (creada con
la versión anterior del proyecto) los campos y tablas nuevos de esta versión:

- asistencias: modalidad, hora_inicio_almuerzo, hora_fin_almuerzo
- boletas_pago: fecha_pago
- empleados: dias_vacaciones_anuales (con valor por defecto 15 para los
  empleados que ya existían)
- solicitudes_vacaciones (tabla nueva del módulo de Vacaciones)

Es seguro ejecutarlo más de una vez: usa "IF NOT EXISTS" en cada columna, así
que si una columna ya fue agregada, simplemente la salta.

Uso (una sola vez, después de desplegar el código nuevo del backend):
    python migrar_v2.py
"""

from sqlalchemy import text

from app.database import Base, engine
from app.models import *  # noqa: F401,F403  (registra todos los modelos, incluido SolicitudVacaciones)

ALTERACIONES = [
    "ALTER TABLE asistencias ADD COLUMN IF NOT EXISTS modalidad VARCHAR(20)",
    "ALTER TABLE asistencias ADD COLUMN IF NOT EXISTS hora_inicio_almuerzo TIMESTAMPTZ",
    "ALTER TABLE asistencias ADD COLUMN IF NOT EXISTS hora_fin_almuerzo TIMESTAMPTZ",
    "ALTER TABLE boletas_pago ADD COLUMN IF NOT EXISTS fecha_pago DATE",
    "ALTER TABLE empleados ADD COLUMN IF NOT EXISTS dias_vacaciones_anuales INTEGER NOT NULL DEFAULT 15",
]

with engine.begin() as conn:
    for sentencia in ALTERACIONES:
        print(f"Ejecutando: {sentencia}")
        conn.execute(text(sentencia))

# Crea las tablas que aún no existan (por ejemplo, solicitudes_vacaciones).
# Las tablas que ya existen no se tocan.
Base.metadata.create_all(bind=engine)

print("Migración completada correctamente.")
