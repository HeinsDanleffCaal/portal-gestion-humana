import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const api = axios.create({
  baseURL: API_URL,
})

// Adjunta el token JWT (si existe) a cada petición saliente.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('pgh_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Si el backend responde 401 (token vencido o inválido), se limpia la
// sesión local para forzar un nuevo inicio de sesión.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('pgh_token')
      localStorage.removeItem('pgh_usuario')
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export default api
