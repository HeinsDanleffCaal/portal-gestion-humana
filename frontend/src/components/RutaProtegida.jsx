import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

/**
 * Envuelve una página que requiere sesión iniciada. Si además se pasa
 * `rolesPermitidos`, sólo esos roles pueden ver la página; el resto es
 * redirigido al panel principal.
 */
export default function RutaProtegida({ children, rolesPermitidos }) {
  const { usuario, cargando } = useAuth()

  if (cargando) {
    return <div className="contenedor-carga">Cargando…</div>
  }

  if (!usuario) {
    return <Navigate to="/login" replace />
  }

  if (rolesPermitidos && !rolesPermitidos.includes(usuario.rol)) {
    return <Navigate to="/" replace />
  }

  return children
}
