import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { autenticado, iniciarSesion } = useAuth()
  const navigate = useNavigate()
  const [nombreUsuario, setNombreUsuario] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)

  if (autenticado) {
    return <Navigate to="/" replace />
  }

  async function manejarEnvio(evento) {
    evento.preventDefault()
    setError('')
    setEnviando(true)
    try {
      await iniciarSesion(nombreUsuario, password)
      navigate('/')
    } catch (err) {
      const detalle = err.response?.data?.detail
      setError(detalle || 'No se pudo iniciar sesión. Verifica tus credenciales.')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="pagina-login">
      <form className="tarjeta tarjeta-login" onSubmit={manejarEnvio}>
        <h1>Portal de Gestión Humana</h1>
        <p className="texto-tenue">Inicia sesión para continuar</p>

        {error && <div className="alerta alerta--error">{error}</div>}

        <label>
          Usuario
          <input
            type="text"
            value={nombreUsuario}
            onChange={(e) => setNombreUsuario(e.target.value)}
            required
            autoFocus
          />
        </label>

        <label>
          Contraseña
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>

        <button type="submit" className="boton boton--primario" disabled={enviando}>
          {enviando ? 'Ingresando…' : 'Ingresar'}
        </button>
      </form>
    </div>
  )
}
