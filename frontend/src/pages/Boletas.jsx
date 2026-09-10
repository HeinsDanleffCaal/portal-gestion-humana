import { useEffect, useState } from 'react'
import api from '../api/client'
import { useAuth } from '../context/AuthContext'

function formatearMoneda(valor) {
  return `Q${Number(valor).toLocaleString('es-GT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function formatearFecha(valorIso) {
  if (!valorIso) return '—'
  return new Date(valorIso + 'T00:00:00').toLocaleDateString('es-GT', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

const CONCEPTO_VACIO = { concepto: '', tipo: 'Ingreso', monto: '' }

// Conceptos comunes en una planilla guatemalteca, para agregarlos con un clic
// en vez de escribirlos cada vez. El sueldo ordinario ya se calcula aparte
// (salario_base del empleado), así que aquí sólo van conceptos adicionales.
const CONCEPTOS_SUGERIDOS = [
  { concepto: 'Bonificación Incentivo', tipo: 'Ingreso' },
  { concepto: 'Horas extra', tipo: 'Ingreso' },
  { concepto: 'Comisiones', tipo: 'Ingreso' },
  { concepto: 'IGSS laboral (4.83%)', tipo: 'Descuento' },
  { concepto: 'ISR (retención)', tipo: 'Descuento' },
  { concepto: 'Préstamo interno', tipo: 'Descuento' },
]

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
  const [fechaPago, setFechaPago] = useState('')
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

  function agregarConcepto(base = {}) {
    setConceptos((prev) => {
      const sinVacios = prev.filter((c) => c.concepto.trim() || c.monto !== '')
      return [...sinVacios, { ...CONCEPTO_VACIO, ...base }]
    })
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
        fecha_pago: fechaPago || undefined,
        conceptos: conceptosValidos,
      })
      setMensaje('Boleta generada correctamente.')
      setPeriodo('')
      setFechaPago('')
      setConceptos([{ ...CONCEPTO_VACIO }])
      if (String(empleadoId) === String(usuario.id)) {
        await cargarMisBoletas()
      }
      const { data } = await api.get(`/api/boletas/empleado/${empleadoId}`)
      setBoletasEmpleado(data)
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

  const empleadoSeleccionado = empleados.find((e) => String(e.id) === String(empleadoId))

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
            <label>
              Fecha de pago (opcional)
              <input type="date" value={fechaPago} onChange={(e) => setFechaPago(e.target.value)} />
            </label>
          </div>

          {empleadoSeleccionado && (
            <p className="texto-tenue">
              Sueldo ordinario (salario base): <strong>{formatearMoneda(empleadoSeleccionado.salario_base)}</strong>
              , se agrega automáticamente a la boleta.
            </p>
          )}

          <h3>Conceptos adicionales (ingresos y descuentos)</h3>
          <div className="chips-conceptos">
            {CONCEPTOS_SUGERIDOS.map((sugerido) => (
              <button
                key={sugerido.concepto}
                type="button"
                className="chip"
                onClick={() => agregarConcepto(sugerido)}
              >
                + {sugerido.concepto}
              </button>
            ))}
          </div>

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
          <button type="button" className="boton boton--secundario" onClick={() => agregarConcepto()}>
            + Agregar concepto en blanco
          </button>

          <button type="submit" className="boton boton--primario" disabled={generando}>
            {generando ? 'Generando…' : 'Generar boleta'}
          </button>
        </form>
      )}

      {esGestor && boletasEmpleado && (
        <>
          <h2>Boletas del empleado seleccionado</h2>
          <TablaBoletas boletas={boletasEmpleado} empleado={empleadoSeleccionado} />
        </>
      )}

      <h2>Mis boletas</h2>
      {cargando ? <p>Cargando…</p> : <TablaBoletas boletas={misBoletas} empleado={usuario} />}
    </div>
  )
}

function TablaBoletas({ boletas, empleado }) {
  if (boletas.length === 0) {
    return <p>No hay boletas registradas.</p>
  }

  return (
    <div className="lista-boletas">
      {boletas.map((b) => (
        <BoletaRecibo key={b.id} boleta={b} empleado={empleado} />
      ))}
    </div>
  )
}

function BoletaRecibo({ boleta, empleado }) {
  const ingresos = boleta.detalle.filter((d) => d.tipo === 'Ingreso')
  const descuentos = boleta.detalle.filter((d) => d.tipo === 'Descuento')

  return (
    <div className="tarjeta tarjeta-boleta" id={`boleta-${boleta.id}`}>
      <div className="tarjeta-boleta__encabezado">
        <div>
          <h3>Boleta de pago · Periodo {boleta.periodo}</h3>
          {empleado && (
            <p className="texto-tenue">
              {empleado.nombre_completo} {empleado.puesto ? `· ${empleado.puesto}` : ''}
            </p>
          )}
          {boleta.fecha_pago && <p className="texto-tenue">Fecha de pago: {formatearFecha(boleta.fecha_pago)}</p>}
        </div>
        <span className="etiqueta etiqueta--activo">{formatearMoneda(boleta.salario_liquido)}</span>
      </div>

      <div className="recibo-columnas">
        <div>
          <h4 className="recibo-columnas__titulo recibo-columnas__titulo--ingreso">Ingresos</h4>
          <table className="tabla tabla--compacta">
            <tbody>
              <tr>
                <td>Sueldo ordinario</td>
                <td>{formatearMoneda(boleta.salario_base)}</td>
              </tr>
              {ingresos.map((d) => (
                <tr key={d.id}>
                  <td>{d.concepto}</td>
                  <td>{formatearMoneda(d.monto)}</td>
                </tr>
              ))}
              <tr className="tabla__fila-total">
                <td>Total ingresos</td>
                <td>{formatearMoneda(Number(boleta.salario_base) + Number(boleta.total_ingresos))}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div>
          <h4 className="recibo-columnas__titulo recibo-columnas__titulo--descuento">Descuentos</h4>
          <table className="tabla tabla--compacta">
            <tbody>
              {descuentos.map((d) => (
                <tr key={d.id}>
                  <td>{d.concepto}</td>
                  <td>{formatearMoneda(d.monto)}</td>
                </tr>
              ))}
              {descuentos.length === 0 && (
                <tr>
                  <td colSpan={2}>Sin descuentos</td>
                </tr>
              )}
              <tr className="tabla__fila-total">
                <td>Total descuentos</td>
                <td>{formatearMoneda(boleta.total_descuentos)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="recibo-liquido">
        <span>Salario líquido a recibir</span>
        <strong>{formatearMoneda(boleta.salario_liquido)}</strong>
      </div>

      <button type="button" className="boton boton--secundario boton--imprimir" onClick={() => window.print()}>
        Imprimir / Descargar PDF
      </button>
    </div>
  )
}
