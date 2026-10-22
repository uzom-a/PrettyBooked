import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Signup() {
  const { signUp } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ fullName: '', email: '', password: '', role: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.role) { setError('Please select if you are a student or provider.'); return }
    setError('')
    setLoading(true)
    try {
      await signUp(form)
      navigate('/check-email', { state: { email: form.email } })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-blush-50 flex items-center justify-center px-4 py-12">
      <div className="bg-white rounded-3xl shadow-sm border border-blush-100 p-8 w-full max-w-md">

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="font-heading text-3xl font-bold text-gray-900">Create account</h1>
          <p className="text-gray-400 text-sm mt-1">Join PrettyBooked 💗</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 text-sm p-3 rounded-xl mb-5 border border-red-100">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Role selector — shown first so it's obvious */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">I am a…</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setForm({ ...form, role: 'student' })}
                className={`py-4 rounded-2xl border-2 font-semibold text-sm transition-all flex flex-col items-center gap-1 ${
                  form.role === 'student'
                    ? 'border-blush-500 bg-blush-50 text-blush-600'
                    : 'border-gray-200 text-gray-500 hover:border-blush-200 bg-white'
                }`}
              >
                <span className="text-2xl">🎓</span>
                Student
              </button>
              <button
                type="button"
                onClick={() => setForm({ ...form, role: 'provider' })}
                className={`py-4 rounded-2xl border-2 font-semibold text-sm transition-all flex flex-col items-center gap-1 ${
                  form.role === 'provider'
                    ? 'border-blush-500 bg-blush-50 text-blush-600'
                    : 'border-gray-200 text-gray-500 hover:border-blush-200 bg-white'
                }`}
              >
                <span className="text-2xl">💅🏾</span>
                Provider
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full name</label>
            <input
              name="fullName"
              value={form.fullName}
              onChange={handleChange}
              placeholder="Your full name"
              required
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blush-300"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="you@email.com"
              required
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blush-300"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="At least 6 characters"
              required
              minLength={6}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blush-300"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black text-white py-3 rounded-full font-semibold hover:bg-gray-800 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-400 mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-blush-600 font-semibold hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  )
}
