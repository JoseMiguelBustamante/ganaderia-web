import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api, { errorDe } from '../lib/api'
import { guardarToken } from '../lib/session'

const MENSAJES: Record<string, string> = {
  INVALID_CREDENTIALS: 'Email o contraseña incorrectos.',
  VALIDATION_ERROR: 'Revise el email y la contraseña.',
}

export default function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const { data } = await api.post('/auth/login', { email, password })
      guardarToken(data.data.token)
      navigate('/', { replace: true })
    } catch (err) {
      const apiError = errorDe(err)
      setError(
        apiError?.code
          ? (MENSAJES[apiError.code] ?? 'No se pudo iniciar sesión. Intentá de nuevo.')
          : 'No se pudo conectar con el servidor. Verificá tu señal e intentá de nuevo.',
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-cream-100 p-6">
      <div className="w-full max-w-md">
        <h1 className="font-display mb-2 text-center text-4xl font-extrabold text-brand-800">
          GanaderApp
        </h1>
        <p className="mb-8 text-center text-ink-600">Tu rodeo, siempre bajo control.</p>
        <form onSubmit={submit} className="space-y-4 rounded-2xl border border-cream-200 bg-white p-6 shadow-sm">
          <label className="block">
            <span className="text-sm font-semibold text-ink-900">Email</span>
            <input
              type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-xl border border-cream-200 bg-cream-100 px-4 py-3 text-ink-900 placeholder:text-ink-600/60 focus:outline-none focus:ring-2 focus:ring-gold-500"
              placeholder="tu@email.com"
            />
          </label>
          <label className="block">
            <span className="text-sm font-semibold text-ink-900">Contraseña</span>
            <input
              type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-xl border border-cream-200 bg-cream-100 px-4 py-3 text-ink-900 focus:outline-none focus:ring-2 focus:ring-gold-500"
            />
          </label>
          {error && <p className="text-sm font-medium text-alert-red" role="alert">{error}</p>}
          <button
            type="submit" disabled={loading}
            className="w-full rounded-full bg-brand-800 py-3 font-semibold text-cream-100 hover:bg-brand-900 focus:outline-none focus:ring-2 focus:ring-gold-500 disabled:opacity-50"
          >
            {loading ? 'Ingresando…' : 'Ingresar'}
          </button>
          <p className="text-center text-sm text-ink-600">
            ¿Sin cuenta? <Link to="/registro" className="font-semibold text-gold-600">Registra tu establecimiento</Link>
          </p>
        </form>
      </div>
    </div>
  )
}
