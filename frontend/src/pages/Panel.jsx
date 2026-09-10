import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Panel() {
  const { usuario } = useAuth()
  const esGestor = usuario.rol === 'Administrador' || usuario.rol === 'RRHH'

  return (
    <div>
      <h1>Bienvenido, {usuario.nombre_completo.split(' ')[0]}</h1>
      <p className="texto-tenue">
        {usuario.puesto} · Rol: {usuario.rol}
      </p>

      <div className="cuadricula-tarjetas">
        <Link to="/asistencia" className="tarjeta tarjeta-enlace">
          <h2>Asistencia</h2>
          <p>Marca tu entrada y salida del día, y consulta tu historial.</p>
        </Link>

        <Link to="/boletas" className="tarjeta tarjeta-enlace">
          <h2>Boletas de pago</h2>
          <p>Consulta tus boletas de pago generadas por periodo.</p>
        </Link>

        <Link to="/vacaciones" className="tarjeta tarjeta-enlace">
          <h2>Vacaciones</h2>
          <p>Consulta tu saldo de días y solicita vacaciones.</p>
        </Link>

        {esGestor && (
          <Link to="/empleados" className="tarjeta tarjeta-enlace">
            <h2>Empleados</h2>
            <p>Administra el personal, sus datos y departamentos.</p>
          </Link>
        )}
      </div>
    </div>
  )
}
