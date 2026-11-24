import { useEffect, useState } from 'react'
import api, { errorDe } from '../lib/api'

/* Equipo del establecimiento (bloque de entrega, T4): alta de usuarios con
   rol, baja lógica y cambio de contraseña. El owner conserva el control. */
interface Usuario {
  id: string
  email: string
  displayName: string
  role: string
  isActive?: boolean
}

const ROLES: { value: string; label: string; detalle: string }[] = [
  { value: 'owner', label: 'Dueño', detalle: 'Todo el establecimiento' },
  { value: 'manager', label: 'Encargado', detalle: 'Carga trabajo y supervisa' },
  { value: 'operator', label: 'Operario', detalle: 'Registra eventos en el campo' },
  { value: 'vet', label: 'Veterinario', detalle: 'Sanidad y tratamientos' },
]

const inputCls = 'mt-1 w-full rounded-xl border border-cream-200 bg-cream-100 px-3 py-3 text-sm text-ink-900 focus:outline-none focus:ring-2 focus:ring-gold-500'

export default function Equipo() {
  const [yo, setYo] = useState<Usuario | null>(null)
  const [usuarios, setUsuarios] = useState<Usuario[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)
  const [mostrarAlta, setMostrarAlta] = useState(false)
  const [cambiando, setCambiando] = useState(false)

  const cargar = () => {
    Promise.all([api.get('/auth/me'), api.get('/users')])
      .then(([me, list]) => {
        setYo(me.data.data)
        setUsuarios(list.data.data)
        setError(null)
      })
      .catch((err) => {
        const code = errorDe(err)?.code
        setError(code === 'FORBIDDEN'
          ? 'Solo el dueño o el encargado pueden ver el equipo.'
          : 'No se pudo cargar el equipo.')
      })
  }

  useEffect(cargar, [])

  const puedeAdministrar = yo?.role === 'owner' || yo?.role === 'manager'

  return (
    <div className="mx-auto max-w-md">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="font-display text-2xl font-extrabold text-brand-800">Equipo</h1>
        {puedeAdministrar && (
          <button onClick={() => setMostrarAlta((v) => !v)}
            className="rounded-full bg-brand-800 px-4 py-2 text-sm font-semibold text-cream-100">
            {mostrarAlta ? 'Cerrar' : 'Sumar persona'}
          </button>
        )}
      </div>

      {aviso && <p className="mb-3 rounded-xl bg-cream-200 p-3 text-sm text-ink-900" role="status">{aviso}</p>}
      {error && <p className="mb-3 text-sm font-medium text-alert-red" role="alert">{error}</p>}

      {mostrarAlta && puedeAdministrar && (
        <AltaUsuario onCreado={(msg) => { setMostrarAlta(false); setAviso(msg); cargar() }} />
      )}

      {usuarios === null && !error && <p className="mt-6 text-center text-sm text-ink-600">Cargando…</p>}

      {usuarios && usuarios.length > 0 && (
        <ul className="space-y-2">
          {usuarios.map((u) => (
            <li key={u.id} className="flex items-center justify-between rounded-xl border border-cream-200 bg-white px-4 py-3">
              <span>
                <span className="block font-semibold text-ink-900">
                  {u.displayName}{u.id === yo?.id ? ' (vos)' : ''}
                </span>
                <span className="block text-xs text-ink-600">
                  {ROLES.find((r) => r.value === u.role)?.label ?? u.role} · {u.email}
                </span>
              </span>
              {puedeAdministrar && u.id !== yo?.id && u.isActive !== false && (
                <button
                  onClick={async () => {
                    if (!window.confirm(`¿Dar de baja a ${u.displayName}? No podrá volver a entrar.`)) return
                    try {
                      await api.delete(`/users/${u.id}`)
                      setAviso(`${u.displayName} dado de baja.`)
                      cargar()
                    } catch (err) {
                      const reason = errorDe(err)?.details?.reason
                      setError(reason === 'LAST_OWNER'
                        ? 'No se puede dar de baja al último dueño del establecimiento.'
                        : 'No se pudo dar de baja al usuario.')
                    }
                  }}
                  className="rounded-full border border-alert-red px-3 py-2 text-xs font-semibold text-alert-red"
                >
                  Baja
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      <section className="mt-6 rounded-2xl border border-cream-200 bg-white p-4">
        <h2 className="text-sm font-bold uppercase tracking-wide text-ink-600">Mi contraseña</h2>
        {!cambiando ? (
          <button onClick={() => setCambiando(true)}
            className="mt-2 w-full rounded-full border border-cream-200 py-3 text-sm font-semibold text-brand-800">
            Cambiar mi contraseña
          </button>
        ) : (
          <CambioPassword yoId={yo?.id} onListo={() => { setCambiando(false); setAviso('Contraseña actualizada.') }} />
        )}
      </section>

      <p className="mt-6 text-xs text-ink-600">
        Para recuperar una contraseña olvidada, un dueño o encargado puede fijar una nueva
        desde la lista de personas.
      </p>
    </div>
  )
}

function AltaUsuario({ onCreado }: { onCreado: (msg: string) => void }) {
  const [form, setForm] = useState({ displayName: '', email: '', password: '', role: 'operator' })
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await api.post('/users', form)
      onCreado(`${form.displayName} ya puede entrar con su email y contraseña.`)
    } catch (err) {
      const reason = errorDe(err)?.details?.reason
      const mensajes: Record<string, string> = {
        EMAIL_ALREADY_EXISTS: 'Ese email ya está en uso en este establecimiento.',
        ROLE_NOT_ALLOWED: 'No puede asignar ese rol.',
      }
      setError(mensajes[reason ?? ''] ?? 'No se pudo crear el usuario. Revise los datos.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={submit} className="mb-4 space-y-3 rounded-2xl border border-cream-200 bg-white p-4">
      <label className="block">
        <span className="text-xs font-semibold text-ink-600">Nombre</span>
        <input required value={form.displayName} onChange={(e) => setForm({ ...form, displayName: e.target.value })}
          className={inputCls} placeholder="Ramón Ferreira" />
      </label>
      <label className="block">
        <span className="text-xs font-semibold text-ink-600">Email</span>
        <input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
          className={inputCls} placeholder="ramon@campo.com" />
      </label>
      <label className="block">
        <span className="text-xs font-semibold text-ink-600">Contraseña inicial</span>
        <input required type="password" minLength={8} value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })} className={inputCls} />
      </label>
      <fieldset>
        <legend className="text-xs font-semibold text-ink-600">Rol</legend>
        <div className="mt-1 space-y-2">
          {ROLES.map((r) => (
            <button key={r.value} type="button" onClick={() => setForm({ ...form, role: r.value })}
              className={`w-full rounded-xl px-3 py-3 text-left text-sm ${
                form.role === r.value ? 'bg-brand-800 text-cream-100' : 'border border-cream-200 bg-cream-100 text-ink-900'
              }`}>
              <span className="block font-semibold">{r.label}</span>
              <span className={`block text-xs ${form.role === r.value ? 'text-cream-100/80' : 'text-ink-600'}`}>
                {r.detalle}
              </span>
            </button>
          ))}
        </div>
      </fieldset>
      {error && <p className="text-sm font-medium text-alert-red" role="alert">{error}</p>}
      <button disabled={loading}
        className="w-full rounded-full bg-brand-800 py-3 font-semibold text-cream-100 disabled:opacity-50">
        {loading ? 'Creando…' : 'Sumar al equipo'}
      </button>
    </form>
  )
}

function CambioPassword({ yoId, onListo }: { yoId?: string; onListo: () => void }) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!yoId) return
    setError(null)
    setLoading(true)
    try {
      await api.post(`/users/${yoId}/password`, { password })
      onListo()
    } catch {
      setError('No se pudo cambiar la contraseña.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={submit} className="mt-2 space-y-3">
      <label className="block">
        <span className="text-xs font-semibold text-ink-600">Contraseña nueva</span>
        <input required type="password" minLength={8} value={password}
          onChange={(e) => setPassword(e.target.value)} className={inputCls} />
      </label>
      {error && <p className="text-sm font-medium text-alert-red" role="alert">{error}</p>}
      <button disabled={loading}
        className="w-full rounded-full bg-brand-800 py-3 text-sm font-semibold text-cream-100 disabled:opacity-50">
        {loading ? 'Guardando…' : 'Guardar contraseña'}
      </button>
    </form>
  )
}
