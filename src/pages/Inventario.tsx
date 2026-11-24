import { useEffect, useState } from 'react'
import api, { errorDe } from '../lib/api'

/* Inventario (S4): items con stock, alta, entrada de stock, edición, baja,
   lotes de semen y registro de compras. */
interface Item {
  id: string
  name: string
  category: string
  unit: string
  stockQty: number
  minStock: number
  stage?: string | null
}

interface Lote {
  id: string
  lotCode: string
  availableDoses: number
  totalDoses: number
  status: string
  expiresAt?: string | null
}

interface Proveedor { id: string; name: string }

const CATEGORIAS: Record<string, string> = { vaccine: 'Vacuna', semen: 'Semen', supply: 'Insumo' }

export default function Inventario() {
  const [items, setItems] = useState<Item[] | null>(null)
  const [lotes, setLotes] = useState<Lote[] | null>(null)
  const [proveedores, setProveedores] = useState<Proveedor[]>([])
  const [error, setError] = useState<string | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)
  const [mostrarAlta, setMostrarAlta] = useState(false)
  const [mostrarCompra, setMostrarCompra] = useState(false)
  const [mostrarLote, setMostrarLote] = useState(false)
  const [abierto, setAbierto] = useState<string | null>(null)

  const cargar = () => {
    Promise.all([api.get('/inventory'), api.get('/semen-lots'), api.get('/suppliers')])
      .then(([i, l, s]) => {
        setItems(i.data.data); setLotes(l.data.data); setProveedores(s.data.data); setError(null)
      })
      .catch(() => setError('Sin conexión. Reintentá cuando vuelva la señal.'))
  }

  useEffect(cargar, [])

  return (
    <div className="mx-auto max-w-md">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="font-display text-2xl font-extrabold text-brand-800">Stock</h1>
        <div className="flex gap-2">
          <button onClick={() => { setMostrarCompra((v) => !v); setMostrarAlta(false) }}
            className="rounded-full border border-cream-200 bg-white px-3 py-2 text-xs font-semibold text-brand-800">
            Compra
          </button>
          <button onClick={() => { setMostrarLote((v) => !v); setMostrarAlta(false); setMostrarCompra(false) }}
            className="rounded-full border border-cream-200 bg-white px-3 py-2 text-xs font-semibold text-brand-800">
            Lote
          </button>
          <button onClick={() => { setMostrarAlta((v) => !v); setMostrarCompra(false); setMostrarLote(false) }}
            className="rounded-full bg-brand-800 px-4 py-2 text-sm font-semibold text-cream-100">
            {mostrarAlta ? 'Cerrar' : 'Producto'}
          </button>
        </div>
      </div>

      {aviso && <p className="mb-3 rounded-xl bg-cream-200 p-3 text-sm text-ink-900" role="status">{aviso}</p>}
      {mostrarAlta && <AltaItem onCreado={() => { setMostrarAlta(false); setAviso('Producto agregado.'); cargar() }} />}
      {mostrarLote && (
        <AltaLote items={(items ?? []).filter((i) => i.category === 'semen')} proveedores={proveedores}
          onCreado={() => { setMostrarLote(false); setAviso('Lote de semen cargado.'); cargar() }} />
      )}
      {mostrarCompra && (
        <AltaCompra items={items ?? []} proveedores={proveedores}
          onCreado={() => { setMostrarCompra(false); setAviso('Compra registrada.'); cargar() }} />
      )}

      {error && <p className="text-sm font-medium text-alert-red" role="alert">{error}</p>}

      {items === null ? (
        <p className="mt-6 text-center text-sm text-ink-600">Cargando…</p>
      ) : items.length === 0 ? (
        <p className="mt-8 rounded-2xl border border-dashed border-cream-200 bg-white p-6 text-center text-sm text-ink-600">
          Sin productos todavía. Registre vacunas, semen o insumos.
        </p>
      ) : (
        <ul className="space-y-2">
          {items.map((i) => (
            <li key={i.id} className="rounded-xl border border-cream-200 bg-white">
              <button
                onClick={() => setAbierto((v) => (v === i.id ? null : i.id))}
                className="flex w-full items-center justify-between px-4 py-3 text-left"
                aria-expanded={abierto === i.id}
              >
                <span>
                  <span className="block font-semibold text-ink-900">{i.name}</span>
                  <span className="block text-xs text-ink-600">
                    {CATEGORIAS[i.category] ?? i.category}{i.stage ? ` · ${i.stage}` : ''} · mínimo {Number(i.minStock)}
                  </span>
                </span>
                <span className={`text-sm font-bold ${Number(i.stockQty) <= Number(i.minStock) ? 'text-alert-red' : 'text-ink-900'}`}>
                  {Number(i.stockQty)} {i.unit}
                </span>
              </button>
              {abierto === i.id && (
                <EditorItem item={i} onCambio={(msg) => { setAviso(msg); cargar(); setAbierto(null) }} />
              )}
            </li>
          ))}
        </ul>
      )}

      {lotes && lotes.length > 0 && (
        <>
          <h2 className="mt-8 text-sm font-bold uppercase tracking-wide text-ink-600">Lotes de semen</h2>
          <ul className="mt-2 space-y-2">
            {lotes.map((l) => (
              <li key={l.id} className="flex items-center justify-between rounded-xl border border-cream-200 bg-white px-4 py-3">
                <span>
                  <span className="block font-semibold text-ink-900">{l.lotCode}</span>
                  <span className="block text-xs text-ink-600">
                    {l.availableDoses}/{l.totalDoses} dosis{l.expiresAt ? ` · vence ${l.expiresAt}` : ''}
                  </span>
                </span>
                {l.availableDoses <= 3 && (
                  <span className="rounded-full bg-cream-200 px-3 py-1 text-xs font-bold text-gold-600">
                    {l.status === 'available' ? 'Bajo' : 'Agotado'}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  )
}

const inputCls = 'mt-1 w-full rounded-xl border border-cream-200 bg-cream-100 px-3 py-3 text-sm text-ink-900 focus:outline-none focus:ring-2 focus:ring-gold-500'

/* Editor inline: entrada de stock, ajuste de datos y baja del producto. */
function EditorItem({ item, onCambio }: { item: Item; onCambio: (msg: string) => void }) {
  const [qty, setQty] = useState(1)
  const [minStock, setMinStock] = useState(Number(item.minStock))
  const [unit, setUnit] = useState(item.unit)
  const [error, setError] = useState<string | null>(null)
  const [ocupado, setOcupado] = useState(false)

  const ejecutar = async (fn: () => Promise<unknown>, mensaje: string) => {
    setOcupado(true)
    setError(null)
    try {
      await fn()
      onCambio(mensaje)
    } catch (err) {
      const reason = errorDe(err)?.details?.reason
      setError(reason === 'ITEM_NAME_ALREADY_EXISTS' ? 'Ya existe otro producto con ese nombre.' : 'No se pudo completar la operación.')
    } finally {
      setOcupado(false)
    }
  }

  return (
    <div className="border-t border-cream-200 p-4 space-y-3">
      <div className="flex items-end gap-2">
        <label className="flex-1">
          <span className="text-xs font-semibold text-ink-600">Entrada de stock ({item.unit})</span>
          <input type="number" min={0.001} step="0.001" value={qty}
            onChange={(e) => setQty(Number(e.target.value))} className={inputCls} />
        </label>
        <button
          disabled={ocupado || qty <= 0}
          onClick={() => ejecutar(
            () => api.post(`/inventory/${item.id}/stock`, { qty }),
            `Entrada de ${qty} ${item.unit} registrada en ${item.name}.`,
          )}
          className="rounded-full bg-brand-800 px-4 py-3 text-sm font-semibold text-cream-100 disabled:opacity-50"
        >
          Sumar
        </button>
      </div>

      <div className="flex items-end gap-2">
        <label className="flex-1">
          <span className="text-xs font-semibold text-ink-600">Mínimo de stock</span>
          <input type="number" min={0} value={minStock}
            onChange={(e) => setMinStock(Number(e.target.value))} className={inputCls} />
        </label>
        <label className="w-24">
          <span className="text-xs font-semibold text-ink-600">Unidad</span>
          <input value={unit} onChange={(e) => setUnit(e.target.value)} className={inputCls} />
        </label>
        <button
          disabled={ocupado}
          onClick={() => ejecutar(
            () => api.put(`/inventory/${item.id}`, { minStock, unit }),
            `Datos de ${item.name} actualizados.`,
          )}
          className="rounded-full border border-cream-200 px-4 py-3 text-sm font-semibold text-brand-800 disabled:opacity-50"
        >
          Guardar
        </button>
      </div>

      <button
        disabled={ocupado}
        onClick={() => {
          if (!window.confirm(`¿Dar de baja ${item.name}? Deja de aparecer en el stock, el historial se conserva.`)) return
          void ejecutar(() => api.delete(`/inventory/${item.id}`), `${item.name} dado de baja.`)
        }}
        className="w-full rounded-full border border-alert-red py-2 text-xs font-semibold text-alert-red disabled:opacity-50"
      >
        Dar de baja el producto
      </button>

      {error && <p className="text-sm font-medium text-alert-red" role="alert">{error}</p>}
    </div>
  )
}

function AltaItem({ onCreado }: { onCreado: () => void }) {
  const [form, setForm] = useState({ name: '', category: 'vaccine', unit: 'dosis', minStock: 0 })
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await api.post('/inventory', form)
      onCreado()
    } catch (err) {
      const reason = errorDe(err)?.details?.reason
      setError(reason === 'ITEM_NAME_ALREADY_EXISTS' ? 'Ya existe un producto con ese nombre.' : 'No se pudo crear. Revise los datos.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={submit} className="mb-4 space-y-3 rounded-2xl border border-cream-200 bg-white p-4">
      <label className="block">
        <span className="text-xs font-semibold text-ink-600">Nombre</span>
        <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
          className={inputCls} placeholder="Vacuna Aftosa" />
      </label>
      <div className="flex gap-2">
        <label className="flex-1">
          <span className="text-xs font-semibold text-ink-600">Unidad</span>
          <input value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} className={inputCls} />
        </label>
        <label className="flex-1">
          <span className="text-xs font-semibold text-ink-600">Mínimo</span>
          <input type="number" min={0} value={form.minStock}
            onChange={(e) => setForm({ ...form, minStock: Number(e.target.value) })} className={inputCls} />
        </label>
      </div>
      <fieldset>
        <legend className="text-xs font-semibold text-ink-600">Categoría</legend>
        <div className="mt-1 flex gap-2">
          {[['vaccine', 'Vacuna'], ['semen', 'Semen'], ['supply', 'Insumo']].map(([v, l]) => (
            <button key={v} type="button" onClick={() => setForm({ ...form, category: v })}
              className={`flex-1 rounded-xl px-3 py-3 text-sm font-semibold ${
                form.category === v ? 'bg-brand-800 text-cream-100' : 'border border-cream-200 bg-cream-100 text-ink-900'
              }`}>
              {l}
            </button>
          ))}
        </div>
      </fieldset>
      {error && <p className="text-sm font-medium text-alert-red" role="alert">{error}</p>}
      <button disabled={loading}
        className="w-full rounded-full bg-brand-800 py-3 font-semibold text-cream-100 disabled:opacity-50">
        {loading ? 'Creando…' : 'Agregar producto'}
      </button>
    </form>
  )
}

/* Compra: alimenta cuentas por pagar y el precio de valorización. El insumo
   y la cantidad van juntos (el DTO lo exige) y habilitan el costo unitario. */
function AltaCompra({ items, proveedores, onCreado }:
  { items: Item[]; proveedores: Proveedor[]; onCreado: () => void }) {
  const hoy = new Date().toISOString().slice(0, 10)
  const [form, setForm] = useState({
    description: '', totalAmount: 0, supplierId: '', itemId: '', quantity: 0, dueDate: '',
  })
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await api.post('/purchases', {
        description: form.description,
        totalAmount: form.totalAmount,
        purchasedAt: hoy,
        ...(form.supplierId ? { supplierId: form.supplierId } : {}),
        ...(form.itemId && form.quantity > 0 ? { itemId: form.itemId, quantity: form.quantity } : {}),
        ...(form.dueDate ? { dueDate: form.dueDate } : {}),
      })
      onCreado()
    } catch {
      setError('No se pudo registrar la compra. Revise los datos.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={submit} className="mb-4 space-y-3 rounded-2xl border border-cream-200 bg-white p-4">
      <label className="block">
        <span className="text-xs font-semibold text-ink-600">Descripción</span>
        <input required value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          className={inputCls} placeholder="Vacuna Aftosa — 20 dosis" />
      </label>
      <div className="flex gap-2">
        <label className="flex-1">
          <span className="text-xs font-semibold text-ink-600">Monto total</span>
          <input required type="number" min={0.01} step="0.01" value={form.totalAmount}
            onChange={(e) => setForm({ ...form, totalAmount: Number(e.target.value) })} className={inputCls} />
        </label>
        <label className="flex-1">
          <span className="text-xs font-semibold text-ink-600">Vence</span>
          <input type="date" value={form.dueDate}
            onChange={(e) => setForm({ ...form, dueDate: e.target.value })} className={inputCls} />
        </label>
      </div>
      {proveedores.length > 0 && (
        <label className="block">
          <span className="text-xs font-semibold text-ink-600">Proveedor</span>
          <select value={form.supplierId} onChange={(e) => setForm({ ...form, supplierId: e.target.value })} className={inputCls}>
            <option value="">Sin proveedor</option>
            {proveedores.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </label>
      )}
      {items.length > 0 && (
        <div className="flex gap-2">
          <label className="flex-1">
            <span className="text-xs font-semibold text-ink-600">Insumo (para costos)</span>
            <select value={form.itemId} onChange={(e) => setForm({ ...form, itemId: e.target.value })} className={inputCls}>
              <option value="">Sin insumo</option>
              {items.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}
            </select>
          </label>
          <label className="w-24">
            <span className="text-xs font-semibold text-ink-600">Cantidad</span>
            <input type="number" min={0} step="0.001" value={form.quantity}
              onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })} className={inputCls} />
          </label>
        </div>
      )}
      {error && <p className="text-sm font-medium text-alert-red" role="alert">{error}</p>}
      <button disabled={loading}
        className="w-full rounded-full bg-brand-800 py-3 font-semibold text-cream-100 disabled:opacity-50">
        {loading ? 'Registrando…' : 'Registrar compra'}
      </button>
      <p className="text-xs text-ink-600">
        Con insumo y cantidad, el sistema calcula el costo unitario para la valorización del rodeo.
      </p>
    </form>
  )
}

/* Alta de lote de semen: el lote es lo que consume la inseminación y lo que
   alimenta las alertas de dosis bajas y vencimientos. */
function AltaLote({ items, proveedores, onCreado }:
  { items: Item[]; proveedores: Proveedor[]; onCreado: () => void }) {
  const [form, setForm] = useState({ itemId: items[0]?.id ?? '', supplierId: '', lotCode: '', totalDoses: 0, expiresAt: '' })
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await api.post('/semen-lots', {
        itemId: form.itemId,
        lotCode: form.lotCode,
        totalDoses: form.totalDoses,
        ...(form.supplierId ? { supplierId: form.supplierId } : {}),
        ...(form.expiresAt ? { expiresAt: form.expiresAt } : {}),
      })
      onCreado()
    } catch (err) {
      const reason = errorDe(err)?.details?.reason
      const mensajes: Record<string, string> = {
        ITEM_NOT_SEMEN: 'Solo se pueden cargar lotes de insumos de categoría semen.',
        LOT_CODE_ALREADY_EXISTS: 'Ya existe un lote con ese código.',
      }
      setError(mensajes[reason ?? ''] ?? 'No se pudo crear el lote. Revise los datos.')
    } finally {
      setLoading(false)
    }
  }

  if (items.length === 0) {
    return (
      <p className="mb-4 rounded-2xl border border-dashed border-cream-200 bg-white p-4 text-sm text-ink-600">
        Primero cargá un producto de categoría <strong>Semen</strong> para poder crear lotes.
      </p>
    )
  }

  return (
    <form onSubmit={submit} className="mb-4 space-y-3 rounded-2xl border border-cream-200 bg-white p-4">
      <label className="block">
        <span className="text-xs font-semibold text-ink-600">Insumo de semen</span>
        <select value={form.itemId} onChange={(e) => setForm({ ...form, itemId: e.target.value })} className={inputCls}>
          {items.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}
        </select>
      </label>
      <div className="flex gap-2">
        <label className="flex-1">
          <span className="text-xs font-semibold text-ink-600">Código de lote</span>
          <input required value={form.lotCode} onChange={(e) => setForm({ ...form, lotCode: e.target.value })}
            className={inputCls} placeholder="AJ-2026-C" />
        </label>
        <label className="w-28">
          <span className="text-xs font-semibold text-ink-600">Dosis</span>
          <input required type="number" min={1} value={form.totalDoses}
            onChange={(e) => setForm({ ...form, totalDoses: Number(e.target.value) })} className={inputCls} />
        </label>
      </div>
      <div className="flex gap-2">
        <label className="flex-1">
          <span className="text-xs font-semibold text-ink-600">Vence</span>
          <input type="date" value={form.expiresAt}
            onChange={(e) => setForm({ ...form, expiresAt: e.target.value })} className={inputCls} />
        </label>
        {proveedores.length > 0 && (
          <label className="flex-1">
            <span className="text-xs font-semibold text-ink-600">Proveedor</span>
            <select value={form.supplierId} onChange={(e) => setForm({ ...form, supplierId: e.target.value })} className={inputCls}>
              <option value="">Sin proveedor</option>
              {proveedores.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </label>
        )}
      </div>
      {error && <p className="text-sm font-medium text-alert-red" role="alert">{error}</p>}
      <button disabled={loading}
        className="w-full rounded-full bg-brand-800 py-3 font-semibold text-cream-100 disabled:opacity-50">
        {loading ? 'Guardando…' : 'Cargar lote'}
      </button>
    </form>
  )
}
