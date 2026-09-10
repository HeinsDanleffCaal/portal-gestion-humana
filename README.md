# Portal de Gestión Humana

Portal de RRHH con control de asistencia virtual y generación de boletas de pago.
Backend en **FastAPI** + **PostgreSQL**, frontend en **React 18**, autenticación con **JWT** y roles (Administrador, RRHH, Empleado).

## Funcionalidad

- Autenticación con usuario y contraseña, sesión basada en JWT.
- Tres roles: **Administrador**, **RRHH** y **Empleado**, cada uno con permisos distintos.
- Módulo de empleados: alta, edición, desactivación y listado (Administrador/RRHH).
- Departamentos: creación y listado.
- Asistencia virtual: cada empleado marca su propia entrada y salida del día; RRHH/Administrador puede consultar el historial de cualquier empleado.
- Boletas de pago: RRHH/Administrador genera boletas por periodo (formato `AAAA-MM`) con conceptos de ingreso y descuento; el sistema calcula el salario líquido automáticamente. Cada empleado consulta sus propias boletas.

## Estructura del proyecto

```
portal-gestion-humana/
├── backend/     # API FastAPI + SQLAlchemy + PostgreSQL
└── frontend/    # React 18 + Vite
```

## Requisitos

- Python 3.11+
- Node.js 18+
- PostgreSQL 14+

## Backend

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

cp .env.example .env
# Edita .env con los datos de tu base de datos y una clave JWT propia

# Crea la base de datos en PostgreSQL, por ejemplo:
#   createdb portal_gestion_humana

python seed.py        # crea el departamento y usuario Administrador inicial
uvicorn app.main:app --reload
```

La API queda disponible en `http://localhost:8000`. La documentación interactiva (Swagger) está en `http://localhost:8000/docs`.

Usuario administrador creado por `seed.py`:

- **Usuario:** `admin`
- **Contraseña:** `Admin123$`

> Cambia esta contraseña (o crea un nuevo usuario administrador y desactiva este) apenas entres por primera vez.

### Variables de entorno (`backend/.env`)

| Variable | Descripción |
|---|---|
| `DATABASE_URL` | Cadena de conexión a PostgreSQL, ej. `postgresql+psycopg2://usuario:clave@localhost:5432/portal_gestion_humana` |
| `JWT_SECRET_KEY` | Clave secreta para firmar los tokens JWT (usa una cadena larga y aleatoria en producción) |
| `JWT_ALGORITHM` | Algoritmo de firma, por defecto `HS256` |
| `JWT_EXPIRE_MINUTES` | Minutos de validez del token, por defecto `480` |

## Frontend

```bash
cd frontend
npm install

cp .env.example .env
# Edita VITE_API_URL si el backend no corre en http://localhost:8000

npm run dev
```

La aplicación queda disponible en `http://localhost:5173`.

Para generar la versión de producción:

```bash
npm run build
```

Los archivos listos para desplegar quedan en `frontend/dist/`.

### Variables de entorno (`frontend/.env`)

| Variable | Descripción |
|---|---|
| `VITE_API_URL` | URL base de la API del backend |

## Roles y permisos

| Acción | Administrador | RRHH | Empleado |
|---|:---:|:---:|:---:|
| Ver su propio historial de asistencia y boletas | ✅ | ✅ | ✅ |
| Marcar su propia entrada/salida | ✅ | ✅ | ✅ |
| Crear/editar empleados | ✅ | ✅ | ❌ |
| Desactivar empleados | ✅ | ❌ | ❌ |
| Consultar asistencia de cualquier empleado | ✅ | ✅ | ❌ |
| Generar boletas de pago | ✅ | ✅ | ❌ |

## Tecnologías

- **Backend:** FastAPI, SQLAlchemy 2.0, Pydantic v2, PostgreSQL, python-jose (JWT), passlib + bcrypt.
- **Frontend:** React 18, Vite, React Router, Axios.
