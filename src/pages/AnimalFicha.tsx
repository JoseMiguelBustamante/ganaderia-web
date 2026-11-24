import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import api, { errorDe } from '../lib/api'

/* Ficha del animal (S2/S3): estado del protocolo, completar fase con lote
   opcional, y edición / baja del animal (bloque de entrega). */
interface FaseEstado {
  phaseNumber: number
  name: string
  state: 'completed' | 'current' | 'pending'
  executedAt?: string | null
  teamId?: string | null
  notes?: string | null
}

interface ProtocoloStatus {
  protocol: { id: string; name: string }
  animal: {
    id: string; earTag: string; name: string | null; sex: string; status: string
    breed?: string | null; notes?: string | null
  }
  phases: FaseEstado[]
}

interface Lote {
  id: string
  lotCode: string
  availableDoses: number
  status: string
}

export default function AnimalFicha() {
  const { id } = useParams<{ id: string }>()
  const [status, setStatus] = useState<ProtocoloStatus | null>(null)
  const [protocoloId, setProtocoloId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)
  const [ejecutando, setEjecutando] = useState(false)
  const [lotes, setLotes] = useState<Lote[]>([])
  const [usarLote, setUsarLote] = useState(false)
  const [loteElegido, setLoteElegido] = useState('')
  const [dosis, setDosis] = useState(1)

  // Edición / baja
  const [editando, setEditando] = useState(false)
  const [form, setForm] = useState({ earTag: '', name: '', breed: '', notes: '' })
  const [guardando, setGuardando] = useState(false)

  useEffect(() => {
    if (!id) return
    api.get('/protocols')
      .then(({ data }) => {
        const protocolos = data.data as { id: string; name: string }[]
        const cria = protocolos.find((p) => p.name === 'Cría') ?? protocolos[0]
        if (!cria) {
          return api.post('/protocols/breeding').then(({ data: d2 }) => {
            setProtocoloId(d2.data.id)
            return cargar(d2.data.id)
          })
        }
        setProtocoloId(cria.id)
        return cargar(cria.id)
      })
      .catch(() => setError('No se pudo cargar el protocolo.'))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  useEffect(() => {
    api.get('/semen-lots')
      .then(({ data }) => {
        const disponibles = (data.data as Lote[]).filter((l) => l.status === 'available' && l.availableDoses > 0)
        setLotes(disponibles)
        if (disponibles[0]) setLoteElegido(disponibles[0].id)
      })
      .catch(() => setLotes([]))
  }, [])

  const cargar = (pid: string) =>
    api.get(`/protocols/animals/${id}/status`, { params: { protocolId: pid } })
      .then(({ data }) => {
        setStatus(data.data)
        setForm({
          earTag: data.data.animal.earTag ?? '',
          name: data.data.animal.name ?? '',
          breed: data.data.animal.breed ?? '',
          notes: data.data.animal.notes ?? '',
        })
        setError(null)
      })

  const completarFase = async (fase: FaseEstado) => {
    if (!id || !protocoloId) return
    setEjecutando(true)
    setError(null)
    setAviso(null)
    try {
      await api.post(`/protocols/animals/${id}/execute`, {
        protocolId: protocoloId,
        phaseNumber: fase.phaseNumber,
        ...(usarLote && loteElegido ? { semenLotId: loteElegido, doses: dosis } : {}),
      })
      await cargar(protocoloId)
      setAviso(`Fase ${fase.phaseNumber} registrada.`)
    } catch (err) {
      const reason = errorDe(err)?.details?.reason
      const mensajes: Record<string, string> = {
        INSUFFICIENT_STOCK: 'La fase pide un insumo sin stock suficiente. Revise el inventario.',
        NOT_ENOUGH_DOSES: 'El lote no tiene esas dosis disponibles.',
        LOT_DEPLETED: 'Ese lote ya está agotado. Elija otro.',
        ITEM_NOT_SEMEN: 'La fase actual no consume semen; desactive la opción de lote.',
        PHASE_HAS_NO_REQUIRED_ITEM: 'La fase actual no lleva insumo. Desactive la opción de lote.',
        LOT_ITEM_MISMATCH: 'El lote elegido no corresponde al insumo de esta fase.',
      }
      setError(mensajes[reason ?? ''] ?? 'No se pudo completar la fase. Reintentá.')
    } finally {
      setEjecutando(false)
    }
  }

  const guardar = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!id || !protocoloId) return
    setGuardando(true)
    setError(null)
    try {
      await api.put(`/animals/${id}`, {
        earTag: form.earTag,
        name: form.name || null,
        breed: form.breed || null,
        notes: form.notes || null,
      })
      await cargar(protocoloId)
      setEditando(false)
      setAviso('Datos del animal actualizados.')
    } catch (err) {
      const reason = errorDe(err)?.details?.reason
      setError(
        reason === 'EAR_TAG_ALREADY_EXISTS'
          ? 'Esa caravana ya la usa otro animal activo.'
          : 'No se pudo guardar. Revise los datos.',
      )
    } finally {
      setGuardando(false)
    }
  }

  const darDeBaja = async () => {
    if (!id) return
    if (!window.confirm('¿Dar de baja este animal? Dejará de aparecer en la lista, pero su historial se conserva.')) return
    setError(null)
    try {
      await api.delete(`/animals/${id}`)
      window.location.replace('/animales')
    } catch {
      setError('No se pudo dar de baja el animal. Reintentá.')
    }
  }

  if (!status) {
    return <p className="mt-8 text-center text-sm text-ink-600">{error ?? 'Cargando ficha…'}</p>
  }

  const actual = status.phases.find((p) => p.state === 'current')
  const inputCls = 'mt-1 w-full rounded-xl border border-cream-200 bg-cream-100 px-3 py-3 text-sm text-ink-900 focus:outline-none focus:ring-2 focus:ring-gold-500'

  return (
    <div className="mx-auto max-w-md">
      <a href="/animales" className="text-sm font-semibold text-brand-800">← Volver</a>
      <div className="mt-2 flex items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-extrabold text-brand-800">
            {status.animal.earTag}{status.animal.name ? ` «${status.animal.name}»` : ''}
          </h1>
          <p className="mt-1 text-sm text-ink-600">
            {status.animal.sex === 'female' ? 'Hembra' : 'Macho'} · {status.protocol.name}
          </p>
        </div>
        <button
          onClick={() => setEditando((v) => !v)}
          className="rounded-full border border-cream-200 bg-white px-4 py-2 text-xs font-semibold text-brand-800"
        >
          {editando ? 'Cerrar' : 'Editar'}
        </button>
      </div>

      {editando && (
        <form onSubmit={guardar} className="mt-4 space-y-3 rounded-2xl border border-cream-200 bg-white p-4">
          <label className="block">
            <span className="text-xs font-semibold text-ink-600">Caravana</span>
            <input required value={form.earTag} onChange={(e) => setForm({ ...form, earTag: e.target.value })} className={inputCls} />
          </label>
          <label className="block">
            <span className="text-xs font-semibold text-ink-600">Nombre</span>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputCls} />
          </label>
          <label className="block">
            <span className="text-xs font-semibold text-ink-600">Raza</span>
            <input value={form.breed} onChange={(e) => setForm({ ...form, breed: e.target.value })} className={inputCls} />
          </label>
          <label className="block">
            <span className="text-xs font-semibold text-ink-600">Notas</span>
            <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={2} className={inputCls} />
          </label>
          <button disabled={guardando}
            className="w-full rounded-full bg-brand-800 py-3 text-sm font-semibold text-cream-100 disabled:opacity-50">
            {guardando ? 'Guardando…' : 'Guardar cambios'}
          </button>
          <button type="button" onClick={darDeBaja}
            className="w-full rounded-full border border-alert-red py-3 text-sm font-semibold text-alert-red">
            Dar de baja el animal
          </button>
        </form>
      )}

      <ol className="mt-5 flex gap-1.5">
        {status.phases.map((f) => (
          <li key={f.phaseNumber} className="flex-1">
            <span className="sr-only">{f.name}: {f.state}</span>
            <span aria-hidden="true" className={`block h-2 rounded-full ${
              f.state === 'completed' ? 'bg-brand-800'
              : f.state === 'current' ? 'bg-gold-500'
              : 'bg-cream-200'
            }`} />
            <span className={`mt-1 block text-[10px] font-semibold ${
              f.state === 'current' ? 'text-gold-600' : 'text-ink-600'
            }`}>{f.name}</span>
          </li>
        ))}
      </ol>

      {actual && (
        <div className="mt-6">
          <button
            disabled={ejecutando}
            onClick={() => completarFase(actual)}
            className="flex min-h-[64px] w-full items-center justify-between rounded-2xl bg-brand-800 px-5 py-4 text-left font-semibold text-cream-100 hover:bg-brand-900 disabled:opacity-50"
          >
            <span>
              Completar fase {actual.phaseNumber}: {actual.name}
              <span className="block text-xs font-normal text-cream-100/80">
                {ejecutando ? 'Registrando…' : 'Queda registrada con fecha y responsable'}
              </span>
            </span>
            <span aria-hidden="true">→</span>
          </button>
        </div>
      )}

      {lotes.length > 0 && actual && (
        <div className="mt-3 rounded-2xl border border-cream-200 bg-white p-4">
          <label className="flex items-center gap-3">
            <input type="checkbox" checked={usarLote} onChange={(e) => setUsarLote(e.target.checked)}
              className="h-5 w-5 accent-[#1C3A2D]" />
            <span className="text-sm font-semibold text-ink-900">Consumir dosis de un lote</span>
          </label>
          {usarLote && (
            <div className="mt-3 space-y-3">
              <label className="block">
                <span className="text-xs font-semibold text-ink-600">Lote de semen</span>
                <select value={loteElegido} onChange={(e) => setLoteElegido(e.target.value)} className={inputCls}>
                  {lotes.map((l) => (
                    <option key={l.id} value={l.id}>{l.lotCode} — {l.availableDoses} dosis</option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="text-xs font-semibold text-ink-600">Dosis a consumir</span>
                <input type="number" min={1} value={dosis}
                  onChange={(e) => setDosis(Math.max(1, Number(e.target.value)))} className={inputCls} />
              </label>
              <p className="text-xs text-ink-600">Se descuenta del lote y del stock en la misma operación.</p>
            </div>
          )}
        </div>
      )}

      {aviso && <p className="mt-4 rounded-xl bg-cream-200 p-3 text-sm text-ink-900" role="status">{aviso}</p>}
      {error && <p className="mt-4 text-sm font-medium text-alert-red" role="alert">{error}</p>}

      <section className="mt-6">
        <h2 className="text-sm font-bold uppercase tracking-wide text-ink-600">Historial</h2>
        <ul className="mt-2 space-y-2">
          {status.phases.filter((f) => f.state === 'completed').length === 0 && (
            <li className="rounded-xl border border-dashed border-cream-200 bg-white p-4 text-sm text-ink-600">
              Aún no hay fases completadas.
            </li>
          )}
          {status.phases.filter((f) => f.state === 'completed').map((f) => (
            <li key={f.phaseNumber} className="rounded-xl border border-cream-200 bg-white p-4 text-sm">
              <span className="font-semibold text-ink-900">Fase {f.phaseNumber}: {f.name}</span>
              {f.executedAt && (
                <span className="block text-xs text-ink-600">
                  {new Date(f.executedAt).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
                  {f.notes ? ` — ${f.notes}` : ''}
                </span>
              )}
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
