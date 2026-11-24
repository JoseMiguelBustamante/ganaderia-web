import { Navigate, Outlet } from 'react-router-dom'
import { leerToken } from '../lib/session'
import { useEffect, useState } from 'react'
import api from '../lib/api'
import type { AxiosError } from 'axios'
import { borrarToken } from '../lib/session'
import SyncBanner from '../components/SyncBanner'

/* Nav inferior: campo / animales / stock / alertas — targets ≥44px, etiqueta
   siempre visible (design/system.md). Verde activo, crema siempre. */
const TABS = [
  { to: '/', label: 'Inicio', icon: '🏠' },
  { to: '/animales', label: 'Animales', icon: '🐄' },
  { to: '/inventario', label: 'Stock', icon: '📦' },
  { to: '/alertas', label: 'Alertas', icon: '🔔' },
  { to: '/reportes', label: 'Reportes', icon: '📊' },
]

export default function AppLayout() {
  const [nombre, setNombre] = useState<string | null>(null)

  useEffect(() => {
    if (!leerToken()) return
    api.get('/auth/me')
      .then(({ data }) => setNombre(data.data.displayName ?? data.data.email))
      .catch((err: AxiosError) => {
        if (err.response?.status === 401) borrarToken()
      })
  }, [])

  if (!leerToken()) return <Navigate to="/login" replace />

  return (
    <div className="flex min-h-screen flex-col bg-cream-100">
      <header className="flex items-center justify-between bg-brand-800 px-4 py-3 text-cream-100">
        <div>
          <p className="font-display text-xl font-extrabold leading-tight">GanaderApp</p>
          {nombre && <p className="text-xs text-cream-100/80">{nombre}</p>}
        </div>
        <button
          onClick={() => { borrarToken(); window.location.assign('/login') }}
          className="rounded-full border border-cream-100/40 px-4 py-2 text-sm font-semibold hover:bg-brand-900 focus:outline-none focus:ring-2 focus:ring-gold-500"
        >
          Salir
        </button>
      </header>
      <SyncBanner />
      <main className="flex-1 p-4 pb-24">
        <Outlet />
      </main>
      <nav className="fixed inset-x-0 bottom-0 z-10 flex border-t border-cream-200 bg-white" aria-label="Navegación principal">
        {TABS.map(({ to, label, icon }) => (
          <NavItem key={to} to={to} label={label} icon={icon} />
        ))}
      </nav>
    </div>
  )
}

function NavItem({ to, label, icon }: { to: string; label: string; icon: string }) {
  const activo = window.location.pathname === to
  return (
    <a
      href={to}
      aria-current={activo ? 'page' : undefined}
      className={`flex min-h-[56px] flex-1 flex-col items-center justify-center gap-0.5 py-2 text-xs font-semibold ${
        activo ? 'text-brand-800' : 'text-ink-600'
      }`}
    >
      <span aria-hidden="true" className="text-lg">{icon}</span>
      {label}
    </a>
  )
}
