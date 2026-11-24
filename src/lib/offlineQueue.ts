/* Offline queue: mutations that fail for lack of connectivity are stored in
   localStorage and replayed when the browser reports connectivity again.
   The server stays authoritative — a replayed mutation that the server
   rejects (e.g. PHASE_ALREADY_COMPLETED) is dropped from the queue and the
   reason is kept for the UI. */

export interface QueuedOp {
  id: string
  method: 'post' | 'put' | 'delete'
  url: string
  body: unknown
  createdAt: string
  label: string
}

const KEY = 'ganaderia.queue'
const FAILED_KEY = 'ganaderia.queue.failed'

const listeners = new Set<() => void>()

export const leerCola = (): QueuedOp[] => {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '[]') as QueuedOp[]
  } catch {
    return []
  }
}

const escribirCola = (ops: QueuedOp[]) => {
  localStorage.setItem(KEY, JSON.stringify(ops))
  listeners.forEach((fn) => fn())
}

export const leerFallidos = (): { label: string; reason: string }[] => {
  try {
    return JSON.parse(localStorage.getItem(FAILED_KEY) ?? '[]')
  } catch {
    return []
  }
}

const agregarFallido = (label: string, reason: string) => {
  const fallidos = [...leerFallidos(), { label, reason }].slice(-20)
  localStorage.setItem(FAILED_KEY, JSON.stringify(fallidos))
  listeners.forEach((fn) => fn())
}

export const limpiarFallidos = () => {
  localStorage.removeItem(FAILED_KEY)
  listeners.forEach((fn) => fn())
}

export const enqueue = (op: Omit<QueuedOp, 'id' | 'createdAt'>) => {
  const queued: QueuedOp = {
    ...op,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
  }
  escribirCola([...leerCola(), queued])
  return queued
}

export const subscribeCola = (fn: () => void) => {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

/* Replays the queue in order. `send` performs one real request and throws
   when the server rejects it; a rejection removes the operation (retrying
   the same mutation would just fail again) and records the reason. */
export const sincronizar = async (
  send: (op: QueuedOp) => Promise<void>,
): Promise<{ enviados: number; fallidos: number }> => {
  let enviados = 0
  let fallidos = 0
  for (const op of leerCola()) {
    try {
      await send(op)
      enviados += 1
    } catch (error) {
      fallidos += 1
      const reason = (error as { reason?: string }).reason ?? 'ERROR'
      agregarFallido(op.label, reason)
    } finally {
      escribirCola(leerCola().filter((queued) => queued.id !== op.id))
    }
  }
  return { enviados, fallidos }
}
