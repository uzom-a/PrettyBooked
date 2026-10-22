import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

const STATUS_STYLES = {
  pending:   'bg-yellow-50 text-yellow-700 border-yellow-200',
  confirmed: 'bg-green-50 text-green-700 border-green-200',
  cancelled: 'bg-red-50 text-red-600 border-red-200',
  completed: 'bg-gray-50 text-gray-500 border-gray-200',
}

export default function MyBookings() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [reviewed, setReviewed] = useState(new Set())

  useEffect(() => {
    async function load() {
      const [{ data: b }, { data: r }] = await Promise.all([
        supabase
          .from('bookings')
          .select('*, services(name, price), provider_profiles(id, user_id, profiles(id, full_name))')
          .eq('student_id', user.id)
          .order('date', { ascending: false }),
        supabase.from('reviews').select('booking_id').eq('student_id', user.id),
      ])
      setBookings(b || [])
      setReviewed(new Set((r || []).map((rv) => rv.booking_id)))
      setLoading(false)
    }
    load()
  }, [user.id])

  return (
    <div className="max-w-2xl mx-auto px-6 py-12">
      <h1 className="font-heading text-3xl font-bold text-gray-900 mb-8">My Bookings</h1>

      {loading && <p className="text-gray-400">Loading…</p>}

      {!loading && bookings.length === 0 && (
        <div className="text-center py-20 text-gray-400">
          <p className="text-lg">No bookings yet!</p>
          <p className="text-sm mt-1">Browse providers and book your first appointment.</p>
        </div>
      )}

      <div className="space-y-4">
        {bookings.map((b) => {
          const providerName = b.provider_profiles?.profiles?.full_name
          const providerId = b.provider_profiles?.id
          const providerUserId = b.provider_profiles?.user_id

          return (
            <div key={b.id} className="bg-white rounded-2xl border border-blush-100 shadow-sm p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="font-semibold text-gray-900">{providerName}</p>
                <span className={`text-xs font-medium border px-3 py-0.5 rounded-full capitalize ${STATUS_STYLES[b.status]}`}>
                  {b.status}
                </span>
              </div>

              <p className="text-sm text-gray-600">{b.services?.name}</p>
              <p className="text-sm text-gray-400 mt-1">
                {new Date(b.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric' })}
                {' · '}
                {b.time?.slice(0, 5)}
              </p>
              <p className="text-sm font-semibold text-blush-600 mt-2">${b.services?.price}</p>

              <div className="flex gap-2 mt-4">
                {/* Message provider */}
                {providerUserId && (
                  <Link
                    to={`/messages/${providerUserId}`}
                    className="flex-1 text-center border border-blush-200 text-blush-600 py-1.5 rounded-full text-sm font-semibold hover:bg-blush-50 transition-colors"
                  >
                    Message
                  </Link>
                )}

                {/* Leave review on completed, unreviewd bookings */}
                {b.status === 'completed' && !reviewed.has(b.id) && (
                  <button
                    onClick={() => navigate('/leave-review', {
                      state: { providerId, providerName, bookingId: b.id }
                    })}
                    className="flex-1 bg-black text-white py-1.5 rounded-full text-sm font-semibold hover:bg-gray-800 transition-colors"
                  >
                    Leave Review
                  </button>
                )}

                {b.status === 'completed' && reviewed.has(b.id) && (
                  <span className="flex-1 text-center text-xs text-gray-400 py-1.5">✓ Reviewed</span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
