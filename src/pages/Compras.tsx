import { useEffect, useState } from 'react'
import api, { errorDe } from '../lib/api'

/* Compras y cuentas por pagar (T4): listado con saldo y registro de pagos. */
interface Compra {
  id: string
  description: string
  totalAmount: number
  paidAmount: number
  status: 'pending' | 'partial' | 'paid'
  purchasedAt?: string
  dueDate?: string | null
  supplierId?: string | null
}

const ESTADOS: Record<string, { label: string; clase: string }> = {
  pending: { label: 'Pendiente', clase: 'text-alert-red' },
  partial: { label: 'Parcial', clase: 'text-gold-600' },
  paid: { label: 'Pagada', clase: 'text-brand-800' },
}

const dinero = (n: number) =>
  new Intl.NumberFormat('es-PY', { style: 'currency', currency: 'PYG', maximumFractionDigits: 0 }).format(n ?? 0)

export default function Compras() {
  const [compras, setCompras] = useState<Compra[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)
  const [pago, setPago] = useState<{ id: string; monto: number } | null>(null)

  const cargar = () => {
    api.get('/purchases')
      .then(({ data }) => { setCompras(data.data); setError(null) })
      .catch(() => setError('No se pudieron cargar las compras.'))
  }

  useEffect(cargar, [])

  const registrarPago = async () => {
    if (!pago) return
    setError(null)
    try {
      await api.post(`/purchases/${pago.id}/payments`, { amount: pago.monto })
      setAviso('Pago registrado.')
      setPago(null)
      cargar()
    } catch (err) {
      const reason = errorDe(err)?.details?.reason
      setError(reason === 'PAYMENT_EXCEEDS_TOTAL'
        ? 'El pago supera el saldo pendiente de la compra.'
        : 'No se pudo registrar el pago.')
    }
  }

  const saldo = (c: Compra) => Number(c.totalAmount) - Number(c.paidAmount)

  return (
    <div className="mx-auto max-w-md">
      <a href="/" className="text-sm font-semibold text-brand-800">← Inicio</a>
      <div className="mb-4 mt-2 flex items-center justify-between">
        <h1 className="font-display text-2xl font-extrabold text-brand-800">Compras</h1>
        <a href="/inventario" className="rounded-full bg-brand-800 px-4 py-2 text-sm font-semibold text-cream-100">
          Registrar
        </a>
      </div>

      {aviso && <p className="mb-3 rounded-xl bg-cream-200 p-3 text-sm text-ink-900" role="status">{aviso}</p>}
      {error && <p className="mb-3 text-sm font-medium text-alert-red" role="alert">{error}</p>}
      {compras === null && !error && <p className="mt-6 text-center text-sm text-ink-600">Cargando…</p>}
      {compras?.length === 0 && (
        <p className="mt-8 rounded-2xl border border-dashed border-cream-200 bg-white p-6 text-center text-sm text-ink-600">
          Sin compras registradas. Cargalas desde Stock → Compra.
        </p>
      )}

      <ul className="space-y-2">
        {compras?.map((c) => {
          const estado = ESTADOS[c.status] ?? ESTADOS.pending
          return (
            <li key={c.id} className="rounded-xl border border-cream-200 bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <span>
                  <span className="block font-semibold text-ink-900">{c.description}</span>
                  <span className="block text-xs text-ink-600">
                    {c.purchasedAt ? `Compra ${String(c.purchasedAt).slice(0, 10)}` : ''}
                    {c.dueDate ? ` · vence ${String(c.dueDate).slice(0, 10)}` : ''}
                  </span>
                </span>
                <span className={`text-sm font-bold ${estado.clase}`}>{estado.label}</span>
              </div>
              <div className="mt-2 flex items-end justify-between gap-3">
                <span className="text-sm text-ink-600">
                  Total {dinero(Number(c.totalAmount))} · pagado {dinero(Number(c.paidAmount))}
                  {c.status !== 'paid' && (
                    <span className="block text-sm font-semibold text-ink-900">
                      Saldo {dinero(saldo(c))}
                    </span>
                  )}
                </span>
                {c.status !== 'paid' && (
                  <button
                    onClick={() => setPago({ id: c.id, monto: saldo(c) })}
                    className="rounded-full border border-brand-800 px-3 py-2 text-xs font-semibold text-brand-800"
                  >
                    Registrar pago
                  </button>
                )}
              </div>
              {pago?.id === c.id && (
                <div className="mt-3 flex items-end gap-2 border-t border-cream-200 pt-3">
                  <label className="flex-1">
                    <span className="text-xs font-semibold text-ink-600">Monto</span>
                    <input type="number" min={0.01} step="0.01" value={pago.monto}
                      onChange={(e) => setPago({ ...pago, monto: Number(e.target.value) })}
                      className="mt-1 w-full rounded-xl border border-cream-200 bg-cream-100 px-3 py-2 text-sm" />
                  </label>
                  <button onClick={() => void registrarPago()}
                    className="rounded-full bg-brand-800 px-4 py-2 text-sm font-semibold text-cream-100">
                    Guardar
                  </button>
                  <button onClick={() => setPago(null)}
                    className="rounded-full border border-cream-200 px-3 py-2 text-sm text-ink-600">
                    Cancelar
                  </button>
                </div>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
