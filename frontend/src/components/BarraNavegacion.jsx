import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function BarraNavegacion() {
  const { usuario, cerrarSesion } = useAuth()
  const navigate = useNavigate()

  if (!usuario) return null

  const esGestor = usuario.rol === 'Administrador' || usuario.rol === 'RRHH'

  function salir() {
    cerrarSesion()
    navigate('/login')
  }

  return (
    <header className="barra-nav">
      <div className="barra-nav__marca">Portal de Gestión Humana</div>
      <nav className="barra-nav__enlaces">
        <NavLink to="/" end>
          Panel
        </NavLink>
        {esGestor && <NavLink to="/empleados">Empleados</NavLink>}
        <NavLink to="/asistencia">Asistencia</NavLink>
        <NavLink to="/boletas">Boletas</NavLink>
      </nav>
      <div className="barra-nav__usuario">
        <span>
          {usuario.nombre_completo} <small>({usuario.rol})</small>
        </span>
        <button type="button" onClick={salir} className="boton boton--secundario">
          Cerrar sesión
        </button>
      </div>
    </header>
  )
}
