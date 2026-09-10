import { useEffect, useState } from 'react'
import api from '../api/client'
import { useAuth } from '../context/AuthContext'

const ROLES = ['Empleado', 'RRHH', 'Administrador']

const FORMULARIO_VACIO = {
  nombre_usuario: '',
  password: '',
  nombre_completo: '',
  email: '',
  puesto: '',
  salario_base: '',
  fecha_ingreso: '',
  departamento_id: '',
  rol: 'Empleado',
  dias_vacaciones_anuales: '15',
}

export default function Empleados() {
  const { usuario } = useAuth()
  const [empleados, setEmpleados] = useState([])
  const [departamentos, setDepartamentos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [mostrarFormulario, setMostrarFormulario] = useState(false)
  const [formulario, setFormulario] = useState(FORMULARIO_VACIO)
  const [nuevoDepartamento, setNuevoDepartamento] = useState('')
  const [enviando, setEnviando] = useState(false)

  async function cargarDatos() {
    setCargando(true)
    setError('')
    try {
      const [respEmpleados, respDepartamentos] = await Promise.all([
        api.get('/api/empleados'),
        api.get('/api/departamentos'),
      ])
      setEmpleados(respEmpleados.data)
      setDepartamentos(respDepartamentos.data)
    } catch (err) {
      setError('No se pudieron cargar los empleados.')
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    cargarDatos()
  }, [])

  function actualizarCampo(campo, valor) {
    setFormulario((prev) => ({ ...prev, [campo]: valor }))
  }

  async function crearDepartamento(evento) {
    evento.preventDefault()
    if (!nuevoDepartamento.trim()) return
    try {
      const { data } = await api.post('/api/departamentos', { nombre: nuevoDepartamento.trim() })
      setDepartamentos((prev) => [...prev, data])
      setNuevoDepartamento('')
      actualizarCampo('departamento_id', String(data.id))
    } catch (err) {
      setError('No se pudo crear el departamento.')
    }
  }

  async function manejarEnvio(evento) {
    evento.preventDefault()
    setError('')
    setEnviando(true)
    try {
      await api.post('/api/empleados', {
        ...formulario,
        salario_base: Number(formulario.salario_base),
        departamento_id: Number(formulario.departamento_id),
        dias_vacaciones_anuales: Number(formulario.dias_vacaciones_anuales) || 15,
      })
      setFormulario(FORMULARIO_VACIO)
      setMostrarFormulario(false)
      await cargarDatos()
    } catch (err) {
      const detalle = err.response?.data?.detail
      setError(typeof detalle === 'string' ? detalle : 'No se pudo crear el empleado.')
    } finally {
      setEnviando(false)
    }
  }

  async function desactivar(id) {
    if (!window.confirm('¿Desactivar este empleado?')) return
    try {
      await api.delete(`/api/empleados/${id}`)
      await cargarDatos()
    } catch (err) {
      setError('No se pudo desactivar al empleado.')
    }
  }

  return (
    <div>
      <div className="encabezado-seccion">
        <h1>Empleados</h1>
        <button
          type="button"
          className="boton boton--primario"
          onClick={() => setMostrarFormulario((v) => !v)}
        >
          {mostrarFormulario ? 'Cancelar' : 'Nuevo empleado'}
        </button>
      </div>

      {error && <div className="alerta alerta--error">{error}</div>}

      {mostrarFormulario && (
        <form className="tarjeta formulario" onSubmit={manejarEnvio}>
          <h2>Nuevo empleado</h2>
          <div className="formulario__fila">
            <label>
              Usuario
              <input
                value={formulario.nombre_usuario}
                onChange={(e) => actualizarCampo('nombre_usuario', e.target.value)}
                required
              />
            </label>
            <label>
              Contraseña
              <input
                type="password"
                value={formulario.password}
                onChange={(e) => actualizarCampo('password', e.target.value)}
                required
              />
            </label>
          </div>

          <label>
            Nombre completo
            <input
              value={formulario.nombre_completo}
              onChange={(e) => actualizarCampo('nombre_completo', e.target.value)}
              required
            />
          </label>

          <div className="formulario__fila">
            <label>
              Email
              <input
                type="email"
                value={formulario.email}
                onChange={(e) => actualizarCampo('email', e.target.value)}
                required
              />
            </label>
            <label>
              Puesto
              <input
                value={formulario.puesto}
                onChange={(e) => actualizarCampo('puesto', e.target.value)}
                required
              />
            </label>
          </div>

          <div className="formulario__fila">
            <label>
              Salario base
              <input
                type="number"
                step="0.01"
                min="0"
                value={formulario.salario_base}
                onChange={(e) => actualizarCampo('salario_base', e.target.value)}
                required
              />
            </label>
            <label>
              Fecha de ingreso
              <input
                type="date"
                value={formulario.fecha_ingreso}
                onChange={(e) => actualizarCampo('fecha_ingreso', e.target.value)}
                required
              />
            </label>
          </div>

          <div className="formulario__fila">
            <label>
              Departamento
              <select
                value={formulario.departamento_id}
                onChange={(e) => actualizarCampo('departamento_id', e.target.value)}
                required
              >
                <option value="" disabled>
                  Selecciona…
                </option>
                {departamentos.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.nombre}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Rol
              <select value={formulario.rol} onChange={(e) => actualizarCampo('rol', e.target.value)}>
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label>
            Días de vacaciones anuales
            <input
              type="number"
              min="0"
              value={formulario.dias_vacaciones_anuales}
              onChange={(e) => actualizarCampo('dias_vacaciones_anuales', e.target.value)}
            />
          </label>

          <div className="formulario__departamento-nuevo">
            <input
              placeholder="Crear nuevo departamento…"
              value={nuevoDepartamento}
              onChange={(e) => setNuevoDepartamento(e.target.value)}
            />
            <button type="button" className="boton boton--secundario" onClick={crearDepartamento}>
              Agregar
            </button>
          </div>

          <button type="submit" className="boton boton--primario" disabled={enviando}>
            {enviando ? 'Guardando…' : 'Guardar empleado'}
          </button>
        </form>
      )}

      {cargando ? (
        <p>Cargando…</p>
      ) : (
        <div className="tabla-contenedor">
          <table className="tabla">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Usuario</th>
                <th>Puesto</th>
                <th>Rol</th>
                <th>Estado</th>
                {usuario.rol === 'Administrador' && <th></th>}
              </tr>
            </thead>
            <tbody>
              {empleados.map((emp) => (
                <tr key={emp.id}>
                  <td>{emp.nombre_completo}</td>
                  <td>{emp.nombre_usuario}</td>
                  <td>{emp.puesto}</td>
                  <td>{emp.rol}</td>
                  <td>
                    <span className={`etiqueta ${emp.activo ? 'etiqueta--activo' : 'etiqueta--inactivo'}`}>
                      {emp.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  {usuario.rol === 'Administrador' && (
                    <td>
                      {emp.activo && emp.id !== usuario.id && (
                        <button
                          type="button"
                          className="boton boton--enlace"
                          onClick={() => desactivar(emp.id)}
                        >
                          Desactivar
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
