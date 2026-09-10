import { useEffect, useState } from 'react'
import api from '../api/client'
import { useAuth } from '../context/AuthContext'

const MODALIDADES = ['Presencial', 'Home Office']

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
  const [modalidad, setModalidad] = useState(MODALIDADES[0])
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

  async function ejecutarAccion(peticion, mensajeExito) {
    setError('')
    setMensaje('')
    setProcesando(true)
    try {
      await peticion()
      setMensaje(mensajeExito)
      await cargarMiHistorial()
    } catch (err) {
      setError(err.response?.data?.detail || 'No se pudo registrar la marca.')
    } finally {
      setProcesando(false)
    }
  }

  const marcarEntrada = () =>
    ejecutarAccion(
      () => api.post('/api/asistencia/entrada', { modalidad }),
      'Entrada registrada correctamente.'
    )

  const marcarInicioAlmuerzo = () =>
    ejecutarAccion(
      () => api.post('/api/asistencia/almuerzo/inicio'),
      'Inicio de almuerzo registrado.'
    )

  const marcarFinAlmuerzo = () =>
    ejecutarAccion(() => api.post('/api/asistencia/almuerzo/fin'), 'Fin de almuerzo registrado.')

  const marcarSalida = () =>
    ejecutarAccion(async () => {
      await api.post('/api/asistencia/salida', { observaciones: observaciones || undefined })
      setObservaciones('')
    }, 'Salida registrada correctamente.')

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

  function renderizarMarcarHoy() {
    if (!registroDeHoy || !registroDeHoy.hora_entrada) {
      return (
        <>
          <label>
            Modalidad
            <select value={modalidad} onChange={(e) => setModalidad(e.target.value)}>
              {MODALIDADES.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </label>
          <button type="button" className="boton boton--primario" onClick={marcarEntrada} disabled={procesando}>
            Marcar entrada
          </button>
        </>
      )
    }

    if (!registroDeHoy.hora_inicio_almuerzo) {
      return (
        <>
          <p className="texto-tenue">
            Entrada: {formatearHora(registroDeHoy.hora_entrada)} · Modalidad: {registroDeHoy.modalidad || '—'}
          </p>
          <div className="acciones-linea">
            <button
              type="button"
              className="boton boton--secundario"
              onClick={marcarInicioAlmuerzo}
              disabled={procesando}
            >
              Marcar inicio de almuerzo
            </button>
            <button type="button" className="boton boton--primario" onClick={marcarSalida} disabled={procesando}>
              Marcar salida
            </button>
          </div>
        </>
      )
    }

    if (!registroDeHoy.hora_fin_almuerzo) {
      return (
        <>
          <p className="texto-tenue">
            Entrada: {formatearHora(registroDeHoy.hora_entrada)} · Inicio de almuerzo:{' '}
            {formatearHora(registroDeHoy.hora_inicio_almuerzo)}
          </p>
          <button type="button" className="boton boton--primario" onClick={marcarFinAlmuerzo} disabled={procesando}>
            Marcar fin de almuerzo
          </button>
        </>
      )
    }

    if (!registroDeHoy.hora_salida) {
      return (
        <>
          <p className="texto-tenue">
            Entrada: {formatearHora(registroDeHoy.hora_entrada)} · Almuerzo:{' '}
            {formatearHora(registroDeHoy.hora_inicio_almuerzo)} – {formatearHora(registroDeHoy.hora_fin_almuerzo)}
          </p>
          <label>
            Observaciones (opcional)
            <input value={observaciones} onChange={(e) => setObservaciones(e.target.value)} />
          </label>
          <button type="button" className="boton boton--primario" onClick={marcarSalida} disabled={procesando}>
            Marcar salida
          </button>
        </>
      )
    }

    return (
      <p>
        Ya completaste tu registro de hoy ({registroDeHoy.modalidad || '—'}): entrada{' '}
        {formatearHora(registroDeHoy.hora_entrada)}, almuerzo {formatearHora(registroDeHoy.hora_inicio_almuerzo)}–
        {formatearHora(registroDeHoy.hora_fin_almuerzo)}, salida {formatearHora(registroDeHoy.hora_salida)}.
      </p>
    )
  }

  return (
    <div>
      <h1>Asistencia Virtual</h1>
      <p className="texto-tenue">La hora de cada marca se toma automáticamente del sistema.</p>

      {error && <div className="alerta alerta--error">{error}</div>}
      {mensaje && <div className="alerta alerta--exito">{mensaje}</div>}

      <div className="tarjeta">
        <h2>Marcar hoy</h2>
        {renderizarMarcarHoy()}
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
                <th>Modalidad</th>
                <th>Entrada</th>
                <th>Inicio almuerzo</th>
                <th>Fin almuerzo</th>
                <th>Salida</th>
                <th>Observaciones</th>
              </tr>
            </thead>
            <tbody>
              {historial.map((r) => (
                <tr key={r.id}>
                  <td>{r.fecha}</td>
                  <td>{r.modalidad || '—'}</td>
                  <td>{formatearHora(r.hora_entrada)}</td>
                  <td>{formatearHora(r.hora_inicio_almuerzo)}</td>
                  <td>{formatearHora(r.hora_fin_almuerzo)}</td>
                  <td>{formatearHora(r.hora_salida)}</td>
                  <td>{r.observaciones || '—'}</td>
                </tr>
              ))}
              {historial.length === 0 && (
                <tr>
                  <td colSpan={7}>Aún no tienes registros.</td>
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
                    <th>Modalidad</th>
                    <th>Entrada</th>
                    <th>Inicio almuerzo</th>
                    <th>Fin almuerzo</th>
                    <th>Salida</th>
                    <th>Observaciones</th>
                  </tr>
                </thead>
                <tbody>
                  {historialConsultado.map((r) => (
                    <tr key={r.id}>
                      <td>{r.fecha}</td>
                      <td>{r.modalidad || '—'}</td>
                      <td>{formatearHora(r.hora_entrada)}</td>
                      <td>{formatearHora(r.hora_inicio_almuerzo)}</td>
                      <td>{formatearHora(r.hora_fin_almuerzo)}</td>
                      <td>{formatearHora(r.hora_salida)}</td>
                      <td>{r.observaciones || '—'}</td>
                    </tr>
                  ))}
                  {historialConsultado.length === 0 && (
                    <tr>
                      <td colSpan={7}>Sin registros.</td>
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
