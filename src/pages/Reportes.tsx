import { useEffect, useState } from 'react'
import api from '../lib/api'
import { descargarCsv } from '../lib/descargas'

/* Reportes y KPI (S3): consumo del período, gasto, animales por fase y
   alertas tempranas. El rango por defecto son los últimos 30 días. */
interface Resumen {
  animals: { total: number; active: number; byPhase: { phaseNumber: number; phaseName: string; count: number }[] }
  inventory: { lowStockItems: number; expiredLots: number; lowDoseLots: number }
  consumption: { movements: number; totalUnits: number }
  purchases: { total: number; paid: number; pending: number }
  executions: { total: number }
}

const dinero = (n: number) =>
  new Intl.NumberFormat('es-PY', { style: 'currency', currency: 'PYG', maximumFractionDigits: 0 }).format(n ?? 0)

export default function Reportes() {
  const [resumen, setResumen] = useState<Resumen | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [desde, setDesde] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() - 30); return d.toISOString().slice(0, 10)
  })
  const [hasta, setHasta] = useState(() => new Date().toISOString().slice(0, 10))

  useEffect(() => {
    setError(null)
    api.get('/reports/summary', { params: { from: desde, to: hasta } })
      .then(({ data }) => setResumen(data.data))
      .catch(() => setError('Sin conexión — los reportes se actualizan al volver la señal.'))
  }, [desde, hasta])

  return (
    <div className="mx-auto max-w-md">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-extrabold text-brand-800">Reportes</h1>
      </div>

      <div className="mt-3 flex gap-2">
        <button
          onClick={() => void descargarCsv('/reports/export/purchases.csv', `compras-${desde}-a-${hasta}.csv`, { from: desde, to: hasta })}
          className="flex-1 rounded-full border border-cream-200 bg-white px-3 py-2 text-xs font-semibold text-brand-800"
        >
          Descargar compras
        </button>
        <button
          onClick={() => void descargarCsv('/reports/export/consumption.csv', `consumos-${desde}-a-${hasta}.csv`, { from: desde, to: hasta })}
          className="flex-1 rounded-full border border-cream-200 bg-white px-3 py-2 text-xs font-semibold text-brand-800"
        >
          Descargar consumos
        </button>
      </div>
      <p className="mt-1 text-xs text-ink-600">Se descarga un archivo CSV con el rango elegido (abre en Excel).</p>

      <div className="mt-4 flex gap-2">
        <label className="flex-1">
          <span className="text-xs font-semibold text-ink-600">Desde</span>
          <input type="date" value={desde} onChange={(e) => setDesde(e.target.value)}
            className="mt-1 w-full rounded-xl border border-cream-200 bg-white px-3 py-2 text-sm" />
        </label>
        <label className="flex-1">
          <span className="text-xs font-semibold text-ink-600">Hasta</span>
          <input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)}
            className="mt-1 w-full rounded-xl border border-cream-200 bg-white px-3 py-2 text-sm" />
        </label>
      </div>

      {error && <p className="mt-4 text-sm font-medium text-alert-red" role="alert">{error}</p>}
      {!resumen && !error && <p className="mt-6 text-center text-sm text-ink-600">Cargando…</p>}

      {resumen && (
        <>
          <section className="mt-5" aria-label="Producción del período">
            <h2 className="text-sm font-bold uppercase tracking-wide text-ink-600">Período</h2>
            <dl className="mt-2 grid grid-cols-2 gap-3">
              <Tarjeta etiqueta="fases completadas" valor={resumen.executions.total} />
              <Tarjeta etiqueta="movimientos de stock" valor={resumen.consumption.movements} />
              <Tarjeta etiqueta="unidades consumidas" valor={resumen.consumption.totalUnits} />
              <Tarjeta etiqueta="animales activos" valor={resumen.animals.active} />
            </dl>
          </section>

          <section className="mt-5" aria-label="Compras del período">
            <h2 className="text-sm font-bold uppercase tracking-wide text-ink-600">Compras</h2>
            <dl className="mt-2 grid grid-cols-1 gap-2">
              <div className="flex justify-between rounded-xl border border-cream-200 bg-white px-4 py-3">
                <dt className="text-sm text-ink-600">Total comprado</dt>
                <dd className="font-semibold text-ink-900">{dinero(resumen.purchases.total)}</dd>
              </div>
              <div className="flex justify-between rounded-xl border border-cream-200 bg-white px-4 py-3">
                <dt className="text-sm text-ink-600">Pagado</dt>
                <dd className="font-semibold text-ink-900">{dinero(resumen.purchases.paid)}</dd>
              </div>
              <div className="flex justify-between rounded-xl border border-cream-200 bg-white px-4 py-3">
                <dt className="text-sm text-ink-600">Pendiente de pago</dt>
                <dd className="font-semibold text-alert-red">{dinero(resumen.purchases.pending)}</dd>
              </div>
            </dl>
          </section>

          {resumen.animals.byPhase.length > 0 && (
            <section className="mt-5" aria-label="Animales por fase">
              <h2 className="text-sm font-bold uppercase tracking-wide text-ink-600">Animales por fase</h2>
              <ul className="mt-2 space-y-2">
                {resumen.animals.byPhase.map((f) => (
                  <li key={f.phaseNumber} className="flex items-center gap-3">
                    <span className="w-28 text-sm text-ink-600">{f.phaseName}</span>
                    <span className="h-2 flex-1 rounded-full bg-cream-200">
                      <span
                        className="block h-2 rounded-full bg-brand-800"
                        style={{ width: `${Math.min(100, (f.count / Math.max(1, resumen.animals.total)) * 100)}%` }}
                      />
                    </span>
                    <span className="w-6 text-right text-sm font-semibold text-ink-900">{f.count}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className="mt-5" aria-label="Alertas tempranas">
            <h2 className="text-sm font-bold uppercase tracking-wide text-ink-600">Alertas tempranas</h2>
            <ul className="mt-2 space-y-2">
              <Aviso texto="Insumos bajo el mínimo" valor={resumen.inventory.lowStockItems} critico />
              <Aviso texto="Lotes vencidos" valor={resumen.inventory.expiredLots} critico />
              <Aviso texto="Lotes con pocas dosis" valor={resumen.inventory.lowDoseLots} />
            </ul>
          </section>
        </>
      )}
    </div>
  )
}

function Tarjeta({ etiqueta, valor }: { etiqueta: string; valor: number }) {
  return (
    <div className="rounded-2xl border border-cream-200 bg-white p-4">
      <dd className="font-display text-2xl font-extrabold text-brand-800">{valor ?? 0}</dd>
      <dt className="text-xs text-ink-600">{etiqueta}</dt>
    </div>
  )
}

function Aviso({ texto, valor, critico = false }: { texto: string; valor: number; critico?: boolean }) {
  const activo = valor > 0
  return (
    <li className={`flex justify-between rounded-xl border px-4 py-3 text-sm ${
      activo && critico ? 'border-alert-red/40 bg-[#FCEBE7]' : 'border-cream-200 bg-white'
    }`}>
      <span className="text-ink-900">{texto}</span>
      <span className={`font-semibold ${activo && critico ? 'text-alert-red' : 'text-ink-600'}`}>
        {valor ?? 0}
      </span>
    </li>
  )
}
