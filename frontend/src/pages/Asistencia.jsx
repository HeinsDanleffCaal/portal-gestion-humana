import { useEffect, useState } from 'react'
import api from '../api/client'
import { useAuth } from '../context/AuthContext'

function formatearHora(valorIso) {
  if (!valorIso) return '—'
  return new Date(valorIso).toLocaleTimeString('es-GT', { hour: '2-digit', minute: '2-digit' })
}

export default function Asistencia() {
  const { usuario } = useAuth()
  const esGestor = usuario.rol === 'Administrador' || usuario.rol === 'RRHH'

  const [historial, setHistorial] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [mensaje, setMensaje] = useState('')
  const [observaciones, setObservaciones] = useState('')
  const [procesando, setProcesando] = useState(false)

  // Consulta para RRHH/Administrador: historial de asistencia de otro empleado.
  const [empleados, setEmpleados] = useState([])
  const [empleadoConsultado, setEmpleadoConsultado] = useState('')
  const [historialConsultado, setHistorialConsultado] = useState(null)

  async function cargarMiHistorial() {
    setCargando(true)
    setError('')
    try {
      const { data } = await api.get('/api/asistencia/mias')
      setHistorial(data)
    } catch (err) {
      setError('No se pudo cargar el historial de asistencia.')
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    cargarMiHistorial()
    if (esGestor) {
      api.get('/api/empleados').then((resp) => setEmpleados(resp.data)).catch(() => {})
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const registroDeHoy = historial.find((r) => r.fecha === new Date().toISOString().slice(0, 10))

  async function marcarEntrada() {
    setError('')
    setMensaje('')
    setProcesando(true)
    try {
      await api.post('/api/asistencia/entrada')
      setMensaje('Entrada registrada correctamente.')
      await cargarMiHistorial()
    } catch (err) {
      setError(err.response?.data?.detail || 'No se pudo marcar la entrada.')
    } finally {
      setProcesando(false)
    }
  }

  async function marcarSalida() {
    setError('')
    setMensaje('')
    setProcesando(true)
    try {
      await api.post('/api/asistencia/salida', { observaciones: observaciones || undefined })
      setMensaje('Salida registrada correctamente.')
      setObservaciones('')
      await cargarMiHistorial()
    } catch (err) {
      setError(err.response?.data?.detail || 'No se pudo marcar la salida.')
    } finally {
      setProcesando(false)
    }
  }

  async function consultarHistorial(evento) {
    evento.preventDefault()
    if (!empleadoConsultado) return
    try {
      const { data } = await api.get(`/api/asistencia/empleado/${empleadoConsultado}`)
      setHistorialConsultado(data)
    } catch (err) {
      setError('No se pudo consultar el historial de ese empleado.')
    }
  }

  return (
    <div>
      <h1>Asistencia</h1>

      {error && <div className="alerta alerta--error">{error}</div>}
      {mensaje && <div className="alerta alerta--exito">{mensaje}</div>}

      <div className="tarjeta">
        <h2>Marcar hoy</h2>
        {!registroDeHoy || !registroDeHoy.hora_entrada ? (
          <button type="button" className="boton boton--primario" onClick={marcarEntrada} disabled={procesando}>
            Marcar entrada
          </button>
        ) : !registroDeHoy.hora_salida ? (
          <>
            <label>
              Observaciones (opcional)
              <input value={observaciones} onChange={(e) => setObservaciones(e.target.value)} />
            </label>
            <button type="button" className="boton boton--primario" onClick={marcarSalida} disabled={procesando}>
              Marcar salida
            </button>
          </>
        ) : (
          <p>
            Ya completaste tu registro de hoy: entrada {formatearHora(registroDeHoy.hora_entrada)}, salida{' '}
            {formatearHora(registroDeHoy.hora_salida)}.
          </p>
        )}
      </div>

      <h2>Mi historial</h2>
      {cargando ? (
        <p>Cargando…</p>
      ) : (
        <div className="tabla-contenedor">
          <table className="tabla">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Entrada</th>
                <th>Salida</th>
                <th>Observaciones</th>
              </tr>
            </thead>
            <tbody>
              {historial.map((r) => (
                <tr key={r.id}>
                  <td>{r.fecha}</td>
                  <td>{formatearHora(r.hora_entrada)}</td>
                  <td>{formatearHora(r.hora_salida)}</td>
                  <td>{r.observaciones || '—'}</td>
                </tr>
              ))}
              {historial.length === 0 && (
                <tr>
                  <td colSpan={4}>Aún no tienes registros.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {esGestor && (
        <>
          <h2>Consultar historial de un empleado</h2>
          <form className="formulario-linea" onSubmit={consultarHistorial}>
            <select value={empleadoConsultado} onChange={(e) => setEmpleadoConsultado(e.target.value)}>
              <option value="" disabled>
                Selecciona un empleado…
              </option>
              {empleados.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.nombre_completo}
                </option>
              ))}
            </select>
            <button type="submit" className="boton boton--secundario">
              Consultar
            </button>
          </form>

          {historialConsultado && (
            <div className="tabla-contenedor">
              <table className="tabla">
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Entrada</th>
                    <th>Salida</th>
                    <th>Observaciones</th>
                  </tr>
                </thead>
                <tbody>
                  {historialConsultado.map((r) => (
                    <tr key={r.id}>
                      <td>{r.fecha}</td>
                      <td>{formatearHora(r.hora_entrada)}</td>
                      <td>{formatearHora(r.hora_salida)}</td>
                      <td>{r.observaciones || '—'}</td>
                    </tr>
                  ))}
                  {historialConsultado.length === 0 && (
                    <tr>
                      <td colSpan={4}>Sin registros.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  )
}
