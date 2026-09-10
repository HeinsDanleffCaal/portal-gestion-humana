import { createContext, useContext, useEffect, useState } from 'react'
import api from '../api/client'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null)
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('pgh_token')
    const usuarioGuardado = localStorage.getItem('pgh_usuario')
    if (token && usuarioGuardado) {
      try {
        setUsuario(JSON.parse(usuarioGuardado))
      } catch {
        localStorage.removeItem('pgh_token')
        localStorage.removeItem('pgh_usuario')
      }
    }
    setCargando(false)
  }, [])

  async function iniciarSesion(nombre_usuario, password) {
    const { data } = await api.post('/api/auth/login', { nombre_usuario, password })
    localStorage.setItem('pgh_token', data.access_token)
    localStorage.setItem('pgh_usuario', JSON.stringify(data.empleado))
    setUsuario(data.empleado)
    return data.empleado
  }

  function cerrarSesion() {
    localStorage.removeItem('pgh_token')
    localStorage.removeItem('pgh_usuario')
    setUsuario(null)
  }

  const valor = {
    usuario,
    cargando,
    autenticado: !!usuario,
    iniciarSesion,
    cerrarSesion,
  }

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const contexto = useContext(AuthContext)
  if (!contexto) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider')
  }
  return contexto
}
