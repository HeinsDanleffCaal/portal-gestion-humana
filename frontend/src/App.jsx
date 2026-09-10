import { Route, Routes } from 'react-router-dom'
import BarraNavegacion from './components/BarraNavegacion'
import RutaProtegida from './components/RutaProtegida'
import { useAuth } from './context/AuthContext'
import Asistencia from './pages/Asistencia'
import Boletas from './pages/Boletas'
import Empleados from './pages/Empleados'
import Login from './pages/Login'
import Panel from './pages/Panel'
import Vacaciones from './pages/Vacaciones'

export default function App() {
  const { cargando } = useAuth()

  if (cargando) {
    return <div className="contenedor-carga">Cargando…</div>
  }

  return (
    <div className="app">
      <BarraNavegacion />
      <main className="app__contenido">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <RutaProtegida>
                <Panel />
              </RutaProtegida>
            }
          />
          <Route
            path="/empleados"
            element={
              <RutaProtegida rolesPermitidos={['Administrador', 'RRHH']}>
                <Empleados />
              </RutaProtegida>
            }
          />
          <Route
            path="/asistencia"
            element={
              <RutaProtegida>
                <Asistencia />
              </RutaProtegida>
            }
          />
          <Route
            path="/boletas"
            element={
              <RutaProtegida>
                <Boletas />
              </RutaProtegida>
            }
          />
          <Route
            path="/vacaciones"
            element={
              <RutaProtegida>
                <Vacaciones />
              </RutaProtegida>
            }
          />
        </Routes>
      </main>
    </div>
  )
}
