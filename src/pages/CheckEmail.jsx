import { useLocation, Link } from 'react-router-dom'
import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function CheckEmail() {
  const { state } = useLocation()
  const email = state?.email || 'your email'
  const [resent, setResent] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleResend() {
    setLoading(true)
    await supabase.auth.resend({ type: 'signup', email: state?.email })
    setResent(true)
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-blush-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-3xl shadow-sm border border-blush-100 p-10 w-full max-w-md text-center">
        <div className="text-6xl mb-6">💌</div>
        <h1 className="font-heading text-2xl font-bold text-gray-900 mb-2">Check your email</h1>
        <p className="text-gray-500 text-sm mb-6">
          We sent a confirmation link to <span className="font-semibold text-gray-700">{email}</span>.
          Click it to activate your account.
        </p>

        <div className="bg-blush-50 border border-blush-100 rounded-2xl p-4 text-sm text-gray-500 mb-6">
          Can't find it? Check your spam folder.
        </div>

        {resent ? (
          <p className="text-green-600 text-sm font-medium">Email resent! Check your inbox.</p>
        ) : (
          <button
            onClick={handleResend}
            disabled={loading}
            className="text-blush-600 text-sm font-semibold hover:underline disabled:opacity-50"
          >
            {loading ? 'Resending…' : 'Resend confirmation email'}
          </button>
        )}

        <p className="text-gray-400 text-xs mt-8">
          Already confirmed?{' '}
          <Link to="/login" className="text-blush-600 font-semibold hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  )
}
