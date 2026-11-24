import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import './index.css'
import Login from './pages/Login'
import Registro from './pages/Registro'
import Home from './pages/Home'
import Animales from './pages/Animales'
import AnimalFicha from './pages/AnimalFicha'
import Inventario from './pages/Inventario'
import Alertas from './pages/Alertas'
import Reportes from './pages/Reportes'
import AppLayout from './layouts/AppLayout'

// Rutas públicas y rutas de app (con nav inferior)
// Offline shell: the service worker caches the app so it opens without signal.
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    void navigator.serviceWorker.register('/sw.js')
  })
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/registro" element={<Registro />} />
        <Route element={<AppLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/animales" element={<Animales />} />
          <Route path="/animales/:id" element={<AnimalFicha />} />
          <Route path="/inventario" element={<Inventario />} />
          <Route path="/alertas" element={<Alertas />} />
          <Route path="/reportes" element={<Reportes />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
