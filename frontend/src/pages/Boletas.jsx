import { useEffect, useState } from 'react'
import api from '../api/client'
import { useAuth } from '../context/AuthContext'

function formatearMoneda(valor) {
  return `Q${Number(valor).toLocaleString('es-GT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

const CONCEPTO_VACIO = { concepto: '', tipo: 'Ingreso', monto: '' }

export default function Boletas() {
  const { usuario } = useAuth()
  const esGestor = usuario.rol === 'Administrador' || usuario.rol === 'RRHH'

  const [misBoletas, setMisBoletas] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [mensaje, setMensaje] = useState('')

  // Generación de boletas (sólo RRHH/Administrador).
  const [empleados, setEmpleados] = useState([])
  const [empleadoId, setEmpleadoId] = useState('')
  const [periodo, setPeriodo] = useState('')
  const [conceptos, setConceptos] = useState([{ ...CONCEPTO_VACIO }])
  const [generando, setGenerando] = useState(false)
  const [boletasEmpleado, setBoletasEmpleado] = useState(null)

  async function cargarMisBoletas() {
    setCargando(true)
    setError('')
    try {
      const { data } = await api.get('/api/boletas/mias')
      setMisBoletas(data)
    } catch (err) {
      setError('No se pudieron cargar tus boletas.')
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    cargarMisBoletas()
    if (esGestor) {
      api.get('/api/empleados').then((resp) => setEmpleados(resp.data)).catch(() => {})
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function actualizarConcepto(indice, campo, valor) {
    setConceptos((prev) => prev.map((c, i) => (i === indice ? { ...c, [campo]: valor } : c)))
  }

  function agregarConcepto() {
    setConceptos((prev) => [...prev, { ...CONCEPTO_VACIO }])
  }

  function quitarConcepto(indice) {
    setConceptos((prev) => prev.filter((_, i) => i !== indice))
  }

  async function generarBoleta(evento) {
    evento.preventDefault()
    setError('')
    setMensaje('')
    setGenerando(true)
    try {
      const conceptosValidos = conceptos
        .filter((c) => c.concepto.trim() && c.monto !== '')
        .map((c) => ({ ...c, monto: Number(c.monto) }))

      await api.post('/api/boletas/generar', {
        empleado_id: Number(empleadoId),
        periodo,
        conceptos: conceptosValidos,
      })
      setMensaje('Boleta generada correctamente.')
      setPeriodo('')
      setConceptos([{ ...CONCEPTO_VACIO }])
      if (String(empleadoId) === String(usuario.id)) {
        await cargarMisBoletas()
      }
    } catch (err) {
      const detalle = err.response?.data?.detail
      setError(typeof detalle === 'string' ? detalle : 'No se pudo generar la boleta.')
    } finally {
      setGenerando(false)
    }
  }

  async function consultarBoletasEmpleado(idEmpleado) {
    setEmpleadoId(idEmpleado)
    if (!idEmpleado) {
      setBoletasEmpleado(null)
      return
    }
    try {
      const { data } = await api.get(`/api/boletas/empleado/${idEmpleado}`)
      setBoletasEmpleado(data)
    } catch (err) {
      setBoletasEmpleado(null)
    }
  }

  return (
    <div>
      <h1>Boletas de pago</h1>

      {error && <div className="alerta alerta--error">{error}</div>}
      {mensaje && <div className="alerta alerta--exito">{mensaje}</div>}

      {esGestor && (
        <form className="tarjeta formulario" onSubmit={generarBoleta}>
          <h2>Generar boleta</h2>
          <div className="formulario__fila">
            <label>
              Empleado
              <select
                value={empleadoId}
                onChange={(e) => consultarBoletasEmpleado(e.target.value)}
                required
              >
                <option value="" disabled>
                  Selecciona…
                </option>
                {empleados.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.nombre_completo}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Periodo (AAAA-MM)
              <input
                placeholder="2026-09"
                value={periodo}
                onChange={(e) => setPeriodo(e.target.value)}
                required
              />
            </label>
          </div>

          <h3>Conceptos (ingresos y descuentos)</h3>
          {conceptos.map((c, i) => (
            <div className="formulario__fila formulario__fila--concepto" key={i}>
              <input
                placeholder="Concepto (ej. Bono, ISR)"
                value={c.concepto}
                onChange={(e) => actualizarConcepto(i, 'concepto', e.target.value)}
              />
              <select value={c.tipo} onChange={(e) => actualizarConcepto(i, 'tipo', e.target.value)}>
                <option value="Ingreso">Ingreso</option>
                <option value="Descuento">Descuento</option>
              </select>
              <input
                type="number"
                step="0.01"
                placeholder="Monto"
                value={c.monto}
                onChange={(e) => actualizarConcepto(i, 'monto', e.target.value)}
              />
              {conceptos.length > 1 && (
                <button type="button" className="boton boton--enlace" onClick={() => quitarConcepto(i)}>
                  Quitar
                </button>
              )}
            </div>
          ))}
          <button type="button" className="boton boton--secundario" onClick={agregarConcepto}>
            + Agregar concepto
          </button>

          <button type="submit" className="boton boton--primario" disabled={generando}>
            {generando ? 'Generando…' : 'Generar boleta'}
          </button>
        </form>
      )}

      {esGestor && boletasEmpleado && (
        <>
          <h2>Boletas del empleado seleccionado</h2>
          <TablaBoletas boletas={boletasEmpleado} />
        </>
      )}

      <h2>Mis boletas</h2>
      {cargando ? <p>Cargando…</p> : <TablaBoletas boletas={misBoletas} />}
    </div>
  )
}

function TablaBoletas({ boletas }) {
  if (boletas.length === 0) {
    return <p>No hay boletas registradas.</p>
  }

  return (
    <div className="lista-boletas">
      {boletas.map((b) => (
        <div className="tarjeta tarjeta-boleta" key={b.id}>
          <div className="tarjeta-boleta__encabezado">
            <h3>Periodo {b.periodo}</h3>
            <span className="etiqueta etiqueta--activo">{formatearMoneda(b.salario_liquido)}</span>
          </div>
          <table className="tabla tabla--compacta">
            <tbody>
              <tr>
                <td>Salario base</td>
                <td>{formatearMoneda(b.salario_base)}</td>
              </tr>
              {b.detalle.map((d) => (
                <tr key={d.id}>
                  <td>
                    {d.concepto} ({d.tipo === 'Ingreso' ? '+' : '-'})
                  </td>
                  <td>{formatearMoneda(d.monto)}</td>
                </tr>
              ))}
              <tr className="tabla__fila-total">
                <td>Salario líquido</td>
                <td>{formatearMoneda(b.salario_liquido)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      ))}
    </div>
  )
}
