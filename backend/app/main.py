from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import Base, engine
from app.routers import asistencia, auth, boletas, departamentos, empleados

# Crea las tablas si no existen (para un MVP; en un proyecto más grande esto
# se manejaría con migraciones de Alembic).
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Portal de Gestión Humana",
    description="API de RRHH: empleados, asistencia virtual y boletas de pago",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # en producción, restringir al dominio real del frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(empleados.router)
app.include_router(departamentos.router)
app.include_router(asistencia.router)
app.include_router(boletas.router)


@app.get("/api/salud", tags=["Sistema"])
def salud():
    return {"estado": "ok"}
