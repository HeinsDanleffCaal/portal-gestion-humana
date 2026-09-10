"""
Script de datos semilla: crea un departamento y un usuario Administrador
para poder entrar al portal por primera vez.

Uso:
    python seed.py
"""

from datetime import date

from app.auth.security import hash_password
from app.database import Base, SessionLocal, engine
from app.models.departamento import Departamento
from app.models.empleado import Empleado, Rol

Base.metadata.create_all(bind=engine)

db = SessionLocal()
try:
    depto = db.query(Departamento).filter(Departamento.nombre == "Administración").first()
    if depto is None:
        depto = Departamento(nombre="Administración")
        db.add(depto)
        db.commit()
        db.refresh(depto)
        print(f"Departamento creado: {depto.nombre}")

    admin = db.query(Empleado).filter(Empleado.nombre_usuario == "admin").first()
    if admin is None:
        admin = Empleado(
            nombre_usuario="admin",
            password_hash=hash_password("Admin123$"),
            nombre_completo="Administrador del Sistema",
            email="admin@portalgestionhumana.local",
            puesto="Administrador del Sistema",
            salario_base=0,
            fecha_ingreso=date.today(),
            departamento_id=depto.id,
            rol=Rol.ADMINISTRADOR,
        )
        db.add(admin)
        db.commit()
        print("Usuario admin creado. Usuario: admin / Contraseña: Admin123$")
        print("IMPORTANTE: cambia esta contraseña apenas entres por primera vez.")
    else:
        print("El usuario admin ya existe, no se creó de nuevo.")
finally:
    db.close()
