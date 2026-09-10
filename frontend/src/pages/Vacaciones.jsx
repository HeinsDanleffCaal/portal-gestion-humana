import { useEffect, useState } from 'react'
import api from '../api/client'
import { useAuth } from '../context/AuthContext'

const ETIQUETAS_ESTADO = {
  Pendiente: 'etiqueta--pendiente',
  Aprobada: 'etiqueta--activo',
  Rechazada: 'etiqueta--inactivo',
}

function formatearFecha(valorIso) {
  if (!valorIso) return '—'
  return new Date(valorIso + 'T00:00:00').toLocaleDateString('es-GT', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export default function Vacaciones() {
  const { usuario } = useAuth()
  const esGestor = usuario.rol === 'Administrador' || usuario.rol === 'RRHH'

  const [saldo, setSaldo] = useState(null)
  const [misSolicitudes, setMisSolicitudes] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [mensaje, setMensaje] = useState('')

  const [fechaInicio, setFechaInicio] = useState('')
  const [fechaFin, setFechaFin] = useState('')
  const [comentario, setComentario] = useState('')
  const [enviando, setEnviando] = useState(false)

  const [pendientes, setPendientes] = useState([])
  const [empleados, setEmpleados] = useState([])

  async function cargarTodo() {
    setCargando(true)
    setError('')
    try {
      const [respSaldo, respMias] = await Promise.all([
        api.get('/api/vacaciones/saldo'),
        api.get('/api/vacaciones/mias'),
      ])
      setSaldo(respSaldo.data)
      setMisSolicitudes(respMias.data)
    } catch (err) {
      setError('No se pudo cargar tu información de vacaciones.')
    } finally {
      setCargando(false)
    }
  }

  async function cargarPendientes() {
    try {
      const { data } = await api.get('/api/vacaciones/pendientes')
      setPendientes(data)
    } catch (err) {
      // silencioso: no bloquea el resto de la página
    }
  }

  useEffect(() => {
    cargarTodo()
    if (esGestor) {
      cargarPendientes()
      api.get('/api/empleados').then((resp) => setEmpleados(resp.data)).catch(() => {})
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function nombreDeEmpleado(id) {
    return empleados.find((e) => e.id === id)?.nombre_completo || `#${id}`
  }

  const diasCalculados =
    fechaInicio && fechaFin
      ? Math.max(
          0,
          Math.round((new Date(fechaFin) - new Date(fechaInicio)) / (1000 * 60 * 60 * 24)) + 1
        )
      : 0

  async function solicitar(evento) {
    evento.preventDefault()
    setError('')
    setMensaje('')
    setEnviando(true)
    try {
      await api.post('/api/vacaciones/solicitar', {
        fecha_inicio: fechaInicio,
        fecha_fin: fechaFin,
        comentario_empleado: comentario || undefined,
      })
      setMensaje('Solicitud de vacaciones enviada. Queda pendiente de aprobación.')
      setFechaInicio('')
      setFechaFin('')
      setComentario('')
      await cargarTodo()
    } catch (err) {
      const detalle = err.response?.data?.detail
      setError(typeof detalle === 'string' ? detalle : 'No se pudo enviar la solicitud.')
    } finally {
      setEnviando(false)
    }
  }

  async function resolver(id, estado) {
    setError('')
    setMensaje('')
    try {
      await api.post(`/api/vacaciones/${id}/resolver`, { estado })
      setMensaje(estado === 'Aprobada' ? 'Solicitud aprobada.' : 'Solicitud rechazada.')
      await cargarPendientes()
    } catch (err) {
      const detalle = err.response?.data?.detail
      setError(typeof detalle === 'string' ? detalle : 'No se pudo resolver la solicitud.')
    }
  }

  return (
    <div>
      <h1>Vacaciones</h1>

      {error && <div className="alerta alerta--error">{error}</div>}
      {mensaje && <div className="alerta alerta--exito">{mensaje}</div>}

      {cargando ? (
        <p>Cargando…</p>
      ) : (
        <>
          {saldo && (
            <div className="tarjeta cuadricula-saldo">
              <div>
                <span className="texto-tenue">Días asignados</span>
                <strong>{saldo.dias_asignados}</strong>
              </div>
              <div>
                <span className="texto-tenue">Tomados</span>
                <strong>{saldo.dias_tomados}</strong>
              </div>
              <div>
                <span className="texto-tenue">Pendientes de aprobación</span>
                <strong>{saldo.dias_pendientes_aprobacion}</strong>
              </div>
              <div>
                <span className="texto-tenue">Disponibles</span>
                <strong className="cuadricula-saldo__disponible">{saldo.dias_disponibles}</strong>
              </div>
            </div>
          )}

          <form className="tarjeta formulario" onSubmit={solicitar}>
            <h2>Solicitar vacaciones</h2>
            <div className="formulario__fila">
              <label>
                Fecha de inicio
                <input
                  type="date"
                  value={fechaInicio}
                  onChange={(e) => setFechaInicio(e.target.value)}
                  required
                />
              </label>
              <label>
                Fecha de fin
                <input type="date" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} required />
              </label>
            </div>
            <label>
              Comentario (opcional)
              <input value={comentario} onChange={(e) => setComentario(e.target.value)} />
            </label>
            {diasCalculados > 0 && (
              <p className="texto-tenue">
                Estás solicitando <strong>{diasCalculados}</strong> día(s).
              </p>
            )}
            <button type="submit" className="boton boton--primario" disabled={enviando}>
              {enviando ? 'Enviando…' : 'Enviar solicitud'}
            </button>
          </form>

          <h2>Mis solicitudes</h2>
          <div className="tabla-contenedor">
            <table className="tabla">
              <thead>
                <tr>
                  <th>Inicio</th>
                  <th>Fin</th>
                  <th>Días</th>
                  <th>Estado</th>
                  <th>Comentario RRHH</th>
                </tr>
              </thead>
              <tbody>
                {misSolicitudes.map((s) => (
                  <tr key={s.id}>
                    <td>{formatearFecha(s.fecha_inicio)}</td>
                    <td>{formatearFecha(s.fecha_fin)}</td>
                    <td>{s.dias_solicitados}</td>
                    <td>
                      <span className={`etiqueta ${ETIQUETAS_ESTADO[s.estado] || ''}`}>{s.estado}</span>
                    </td>
                    <td>{s.comentario_resolucion || '—'}</td>
                  </tr>
                ))}
                {misSolicitudes.length === 0 && (
                  <tr>
                    <td colSpan={5}>Aún no tienes solicitudes.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {esGestor && (
            <>
              <h2>Solicitudes pendientes de aprobación</h2>
              <div className="tabla-contenedor">
                <table className="tabla">
                  <thead>
                    <tr>
                      <th>Empleado</th>
                      <th>Inicio</th>
                      <th>Fin</th>
                      <th>Días</th>
                      <th>Comentario</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendientes.map((s) => (
                      <tr key={s.id}>
                        <td>{nombreDeEmpleado(s.empleado_id)}</td>
                        <td>{formatearFecha(s.fecha_inicio)}</td>
                        <td>{formatearFecha(s.fecha_fin)}</td>
                        <td>{s.dias_solicitados}</td>
                        <td>{s.comentario_empleado || '—'}</td>
                        <td className="acciones-linea">
                          <button
                            type="button"
                            className="boton boton--secundario"
                            onClick={() => resolver(s.id, 'Aprobada')}
                          >
                            Aprobar
                          </button>
                          <button type="button" className="boton boton--enlace" onClick={() => resolver(s.id, 'Rechazada')}>
                            Rechazar
                          </button>
                        </td>
                      </tr>
                    ))}
                    {pendientes.length === 0 && (
                      <tr>
                        <td colSpan={6}>No hay solicitudes pendientes.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </>
      )}
    </div>
  )
}
