import { useEffect, useState } from 'react'
import { leerCola, leerFallidos, limpiarFallidos, subscribeCola } from '../lib/offlineQueue'
import { sincronizarCola } from '../lib/api'

/* Honest sync state: what is still on the phone, what already went out and
   what the server rejected. Replays automatically when connectivity returns. */
export default function SyncBanner() {
  const [pendientes, setPendientes] = useState(leerCola().length)
  const [fallidos, setFallidos] = useState(leerFallidos())
  const [estado, setEstado] = useState<'idle' | 'enviando' | 'listo'>('idle')

  useEffect(() => {
    const unsubscribe = subscribeCola(() => {
      setPendientes(leerCola().length)
      setFallidos(leerFallidos())
    })
    return () => { unsubscribe() }
  }, [])

  const enviar = async () => {
    setEstado('enviando')
    await sincronizarCola()
    setEstado('listo')
    setPendientes(leerCola().length)
    setFallidos(leerFallidos())
  }

  useEffect(() => {
    const auto = () => { if (leerCola().length > 0) void enviar() }
    window.addEventListener('online', auto)
    return () => window.removeEventListener('online', auto)
  }, [])

  if (pendientes === 0 && fallidos.length === 0) return null

  return (
    <div className="mx-4 mt-3 rounded-xl border border-cream-200 bg-white p-3 text-sm" role="status">
      {pendientes > 0 && (
        <div className="flex items-center justify-between gap-3">
          <span className="font-semibold text-ink-900">
            {pendientes} registro{pendientes === 1 ? '' : 's'} en el teléfono
            <span className="block text-xs font-normal text-ink-600">
              {estado === 'enviando' ? 'Enviando…' : 'Se envían solos cuando vuelve la señal'}
            </span>
          </span>
          <button
            onClick={() => void enviar()}
            disabled={estado === 'enviando'}
            className="rounded-full bg-brand-800 px-4 py-2 text-xs font-semibold text-cream-100 disabled:opacity-50"
          >
            Enviar ahora
          </button>
        </div>
      )}
      {fallidos.length > 0 && (
        <div className="mt-2 border-t border-cream-200 pt-2">
          <p className="text-xs font-semibold text-alert-red">
            {fallidos.length} rechazado{fallidos.length === 1 ? '' : 's'} por el servidor
          </p>
          <ul className="mt-1 space-y-0.5 text-xs text-ink-600">
            {fallidos.slice(-3).map((f, i) => (
              <li key={i}>{f.label}: {f.reason}</li>
            ))}
          </ul>
          <button onClick={limpiarFallidos} className="mt-1 text-xs font-semibold text-gold-600">
            Entendido
          </button>
        </div>
      )}
    </div>
  )
}
