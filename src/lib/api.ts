import axios, { isAxiosError } from 'axios'
import { leerToken, borrarToken } from './session'
import { enqueue, sincronizar, type QueuedOp } from './offlineQueue'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
})

api.interceptors.request.use((config) => {
  const token = leerToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

const esRed = (error: unknown) =>
  isAxiosError(error) && !error.response && error.code !== 'ERR_CANCELED'

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (isAxiosError(error) && error.response?.status === 401 && leerToken()) {
      borrarToken()
      if (!window.location.pathname.startsWith('/login')) {
        window.location.assign('/login')
      }
    }
    // Offline: a mutation is queued instead of lost. The caller receives a
    // synthetic success so the field worker keeps working; the sync banner
    // tells the truth about what is still pending.
    const config = isAxiosError(error) ? error.config : undefined
    const method = config?.method?.toLowerCase()
    if (esRed(error) && config && ['post', 'put', 'delete'].includes(method ?? '')) {
      enqueue({
        method: method as QueuedOp['method'],
        url: (config.url ?? '').replace(/^\/api/, ''),
        body: config.data ? JSON.parse(String(config.data)) : undefined,
        label: etiquetaDe(config.url ?? ''),
      })
      return Promise.resolve({ data: { data: { queued: true } } } as never)
    }
    return Promise.reject(error)
  },
)

const etiquetaDe = (url: string) => {
  if (url.includes('/execute')) return 'Completar fase'
  if (url.includes('/animals')) return 'Alta de animal'
  if (url.includes('/inventory')) return 'Movimiento de stock'
  if (url.includes('/semen-lots')) return 'Lote de semen'
  return 'Registro de campo'
}

export const sincronizarCola = () =>
  sincronizar(async (op) => {
    try {
      await api.request({ method: op.method, url: op.url, data: op.body })
    } catch (error) {
      const detail = isAxiosError(error)
        ? ((error.response?.data as { error?: { details?: { reason?: string } } })?.error?.details?.reason
          ?? error.response?.data?.error?.code
          ?? 'ERROR')
        : 'SIN_CONEXION'
      throw Object.assign(new Error(String(detail)), { reason: String(detail) })
    }
  })

export interface ApiError {
  code: string
  message: string
  details?: { reason?: string }
}

export const errorDe = (err: unknown): ApiError | null =>
  isAxiosError(err) ? (err.response?.data?.error ?? null) : null

export default api
