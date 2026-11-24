import { useEffect, useState } from 'react'
import api, { errorDe } from '../lib/api'

/* Home "Resumen de hoy" (S5): datos reales de la API. */
interface Alertas {
  lowStockItems: unknown[]
  lowDoseLots: unknown[]
  expiredLots: unknown[]
}

export default function Home() {
  const [alertas, setAlertas] = useState<Alertas | null>(null)
  const [animales, setAnimales] = useState<number | null>(null)
  const [offline, setOffline] = useState(false)

  useEffect(() => {
    Promise.all([
      api.get('/inventory/alerts').then(({ data }) => setAlertas(data.data)),
      api.get('/animals').then(({ data }) => setAnimales(data.data.length)),
    ]).catch(() => setOffline(true))
  }, [])

  const criticas = alertas ? alertas.lowStockItems.length + alertas.expiredLots.length : null
  const avisos = alertas ? alertas.lowDoseLots.length : null

  return (
    <div className="mx-auto max-w-md">
      <h1 className="font-display text-2xl font-extrabold text-brand-800">Resumen de hoy</h1>
      {offline && (
        <p className="mt-3 rounded-xl bg-cream-200 p-3 text-sm text-ink-900" role="status">
          Sin conexión — mostramos lo último guardado. Los registros pendientes se envían al volver la señal.
        </p>
      )}

      <dl className="mt-5 grid grid-cols-3 gap-3 text-center">
        <div className="rounded-2xl border border-cream-200 bg-white p-4">
          <dt className="order-2 text-xs text-ink-600">animales</dt>
          <dd className="font-display text-3xl font-extrabold text-brand-800">{animales ?? '·'}</dd>
        </div>
        <div className="rounded-2xl border border-cream-200 bg-white p-4">
          <dt className="order-2 text-xs text-ink-600">alertas rojas</dt>
          <dd className={`font-display text-3xl font-extrabold ${criticas ? 'text-alert-red' : 'text-brand-800'}`}>
            {criticas ?? '·'}
          </dd>
        </div>
        <div className="rounded-2xl border border-cream-200 bg-white p-4">
          <dt className="order-2 text-xs text-ink-600">avisos dorados</dt>
          <dd className="font-display text-3xl font-extrabold text-gold-600">{avisos ?? '·'}</dd>
        </div>
      </dl>

      <nav className="mt-6 space-y-3" aria-label="Accesos rápidos">
        <Acceso to="/animales" titulo="Registrar evento" detalle="Chequeo, inseminación, parto, vacuna" />
        <Acceso to="/animales" titulo="Buscar animal" detalle="Por caravana o nombre" />
        <Acceso to="/inventario" titulo="Consumir insumo" detalle="Dosis de semen o vacuna aplicada" />
        <Acceso to="/compras" titulo="Compras y pagos" detalle="Cuentas por pagar y saldos" />
        <Acceso to="/proveedores" titulo="Proveedores" detalle="Contactos para pedidos" />
        <Acceso to="/reportes" titulo="Reportes" detalle="Números del período y descargas" />
      </nav>

      {alertas && criticas === 0 && avisos === 0 && (
        <p className="mt-6 rounded-2xl border border-dashed border-cream-200 bg-white p-4 text-center text-sm text-ink-600">
          Todo al día ✓ — sin alertas de stock ni lotes vencidos.
        </p>
      )}
    </div>
  )
}

function Acceso({ to, titulo, detalle }: { to: string; titulo: string; detalle: string }) {
  return (
    <a href={to} className="flex min-h-[72px] items-center justify-between rounded-2xl border border-cream-200 bg-white px-5 py-4 hover:border-gold-500">
      <span>
        <span className="block font-semibold text-ink-900">{titulo}</span>
        <span className="block text-sm text-ink-600">{detalle}</span>
      </span>
      <span aria-hidden="true" className="text-xl text-ink-600">›</span>
    </a>
  )
}
