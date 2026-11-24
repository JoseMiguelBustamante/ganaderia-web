import { useEffect, useState } from 'react'
import api, { errorDe } from '../lib/api'

/* Proveedores (T4): alta, edición de contacto y baja lógica. */
interface Proveedor {
  id: string
  name: string
  contactName?: string | null
  phone?: string | null
  email?: string | null
  isActive: boolean
}

const inputCls = 'mt-1 w-full rounded-xl border border-cream-200 bg-cream-100 px-3 py-3 text-sm text-ink-900 focus:outline-none focus:ring-2 focus:ring-gold-500'

export default function Proveedores() {
  const [proveedores, setProveedores] = useState<Proveedor[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)
  const [mostrarAlta, setMostrarAlta] = useState(false)

  const cargar = () => {
    api.get('/suppliers')
      .then(({ data }) => { setProveedores(data.data); setError(null) })
      .catch(() => setError('No se pudieron cargar los proveedores.'))
  }

  useEffect(cargar, [])

  return (
    <div className="mx-auto max-w-md">
      <a href="/" className="text-sm font-semibold text-brand-800">← Inicio</a>
      <div className="mb-4 mt-2 flex items-center justify-between">
        <h1 className="font-display text-2xl font-extrabold text-brand-800">Proveedores</h1>
        <button onClick={() => setMostrarAlta((v) => !v)}
          className="rounded-full bg-brand-800 px-4 py-2 text-sm font-semibold text-cream-100">
          {mostrarAlta ? 'Cerrar' : 'Sumar'}
        </button>
      </div>

      {aviso && <p className="mb-3 rounded-xl bg-cream-200 p-3 text-sm text-ink-900" role="status">{aviso}</p>}
      {error && <p className="mb-3 text-sm font-medium text-alert-red" role="alert">{error}</p>}
      {mostrarAlta && <AltaProveedor onCreado={(msg) => { setMostrarAlta(false); setAviso(msg); cargar() }} />}

      {proveedores === null && !error && <p className="mt-6 text-center text-sm text-ink-600">Cargando…</p>}
      {proveedores?.length === 0 && (
        <p className="mt-8 rounded-2xl border border-dashed border-cream-200 bg-white p-6 text-center text-sm text-ink-600">
          Sin proveedores todavía. Sumá el primero para vincular compras.
        </p>
      )}

      <ul className="space-y-2">
        {proveedores?.map((p) => (
          <li key={p.id} className="rounded-xl border border-cream-200 bg-white px-4 py-3">
            <div className="flex items-start justify-between gap-3">
              <span>
                <span className="block font-semibold text-ink-900">{p.name}</span>
                <span className="block text-xs text-ink-600">
                  {[p.contactName, p.phone, p.email].filter(Boolean).join(' · ') || 'Sin datos de contacto'}
                </span>
              </span>
              <button
                onClick={async () => {
                  if (!window.confirm(`¿Dar de baja a ${p.name}?`)) return
                  try {
                    await api.delete(`/suppliers/${p.id}`)
                    setAviso(`${p.name} dado de baja.`)
                    cargar()
                  } catch {
                    setError('No se pudo dar de baja al proveedor.')
                  }
                }}
                className="rounded-full border border-alert-red px-3 py-2 text-xs font-semibold text-alert-red"
              >
                Baja
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

function AltaProveedor({ onCreado }: { onCreado: (msg: string) => void }) {
  const [form, setForm] = useState({ name: '', contactName: '', phone: '', email: '' })
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await api.post('/suppliers', {
        name: form.name,
        ...(form.contactName ? { contactName: form.contactName } : {}),
        ...(form.phone ? { phone: form.phone } : {}),
        ...(form.email ? { email: form.email } : {}),
      })
      onCreado(`${form.name} agregado a proveedores.`)
    } catch (err) {
      const reason = errorDe(err)?.details?.reason
      setError(reason === 'SUPPLIER_NAME_ALREADY_EXISTS'
        ? 'Ya existe un proveedor con ese nombre.'
        : 'No se pudo crear el proveedor. Revise los datos.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={submit} className="mb-4 space-y-3 rounded-2xl border border-cream-200 bg-white p-4">
      <label className="block">
        <span className="text-xs font-semibold text-ink-600">Nombre</span>
        <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
          className={inputCls} placeholder="Genética Sur" />
      </label>
      <label className="block">
        <span className="text-xs font-semibold text-ink-600">Contacto</span>
        <input value={form.contactName} onChange={(e) => setForm({ ...form, contactName: e.target.value })}
          className={inputCls} placeholder="Marcela Duarte" />
      </label>
      <div className="flex gap-2">
        <label className="flex-1">
          <span className="text-xs font-semibold text-ink-600">Teléfono</span>
          <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
            className={inputCls} placeholder="+595 981 000000" />
        </label>
        <label className="flex-1">
          <span className="text-xs font-semibold text-ink-600">Email</span>
          <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
            className={inputCls} placeholder="ventas@proveedor.com" />
        </label>
      </div>
      {error && <p className="text-sm font-medium text-alert-red" role="alert">{error}</p>}
      <button disabled={loading}
        className="w-full rounded-full bg-brand-800 py-3 font-semibold text-cream-100 disabled:opacity-50">
        {loading ? 'Guardando…' : 'Agregar proveedor'}
      </button>
    </form>
  )
}
