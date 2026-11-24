import { useEffect, useState } from 'react'
import api from '../lib/api'

/* Primeros pasos: guía que aparece mientras el establecimiento está vacío y
   desaparece sola cuando el trabajo real ya está en marcha. El estado se
   deduce de la API, nunca de una bandera local que pueda mentir. */
interface Estado {
  animales: number
  insumos: number
  lotes: number
  fases: number
}

const PASOS = [
  {
    id: 'insumo',
    titulo: 'Cargá tu primer insumo',
    detalle: 'Vacunas, semen o insumos generales. Con el mínimo definido, las alertas funcionan solas.',
    accion: 'Ir a Stock',
    to: '/inventario',
  },
  {
    id: 'animal',
    titulo: 'Registrá tu primer animal',
    detalle: 'Con la caravana alcanza. Después podés completar raza, nombre y fecha de nacimiento.',
    accion: 'Ir a Animales',
    to: '/animales',
  },
  {
    id: 'fase',
    titulo: 'Completá la primera fase',
    detalle: 'Abrí la ficha del animal y tocá "Completar fase 1". Queda registrada con fecha y responsable.',
    accion: 'Ver animales',
    to: '/animales',
  },
  {
    id: 'equipo',
    titulo: 'Sumá a tu gente',
    detalle: 'Cada persona entra con su propio usuario: vos ves quién hizo qué y cuándo.',
    accion: 'Ir a Equipo',
    to: '/equipo',
  },
] as const

export default function PrimerosPasos() {
  const [estado, setEstado] = useState<Estado | null>(null)
  const [oculto, setOculto] = useState(() => localStorage.getItem('ganaderia.onboarding') === 'oculto')

  useEffect(() => {
    Promise.all([
      api.get('/animals'),
      api.get('/inventory'),
      api.get('/semen-lots'),
      api.get('/protocols').catch(() => ({ data: { data: [] } })),
    ]).then(([a, i, l]) => {
      setEstado({ animales: a.data.data.length, insumos: i.data.data.length, lotes: l.data.data.length, fases: 0 })
    }).catch(() => setEstado(null))
  }, [])

  if (oculto || !estado) return null
  // Con animales ya cargados el establecimiento está en marcha: no molestar.
  if (estado.animales > 0 && estado.insumos > 0) return null

  const hechos = new Set<string>()
  if (estado.insumos > 0) hechos.add('insumo')
  if (estado.animales > 0) hechos.add('animal')
  const pendientes = PASOS.filter((p) => !hechos.has(p.id))
  const progreso = Math.round((hechos.size / PASOS.length) * 100)

  return (
    <section className="mt-5 rounded-2xl border border-gold-500/40 bg-white p-4" aria-label="Primeros pasos">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-extrabold text-brand-800">Primeros pasos</h2>
          <p className="text-xs text-ink-600">
            {hechos.size} de {PASOS.length} listos · 2 minutos y el campo queda registrado
          </p>
        </div>
        <button
          onClick={() => { localStorage.setItem('ganaderia.onboarding', 'oculto'); setOculto(true) }}
          className="rounded-full px-2 py-1 text-xs font-semibold text-ink-600"
        >
          Ocultar
        </button>
      </div>

      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-cream-200">
        <div className="h-full rounded-full bg-brand-800" style={{ width: `${progreso}%` }} />
      </div>

      <ol className="mt-4 space-y-2">
        {PASOS.map((paso, indice) => {
          const hecho = hechos.has(paso.id)
          const esSiguiente = !hecho && pendientes[0]?.id === paso.id
          return (
            <li
              key={paso.id}
              className={`rounded-xl border px-3 py-3 ${
                hecho ? 'border-cream-200 bg-cream-100' : esSiguiente ? 'border-brand-800' : 'border-cream-200'
              }`}
            >
              <div className="flex items-start gap-3">
                <span
                  aria-hidden="true"
                  className={`mt-0.5 flex h-6 w-6 flex-none items-center justify-center rounded-full text-xs font-bold ${
                    hecho ? 'bg-brand-800 text-cream-100' : 'bg-cream-200 text-ink-600'
                  }`}
                >
                  {hecho ? '✓' : indice + 1}
                </span>
                <div className="min-w-0">
                  <p className={`text-sm font-semibold ${hecho ? 'text-ink-600 line-through' : 'text-ink-900'}`}>
                    {paso.titulo}
                  </p>
                  {!hecho && <p className="mt-0.5 text-xs text-ink-600">{paso.detalle}</p>}
                  {!hecho && (
                    <a
                      href={paso.to}
                      className="mt-2 inline-block rounded-full bg-brand-800 px-3 py-1.5 text-xs font-semibold text-cream-100"
                    >
                      {paso.accion}
                    </a>
                  )}
                </div>
              </div>
            </li>
          )
        })}
      </ol>
    </section>
  )
}
