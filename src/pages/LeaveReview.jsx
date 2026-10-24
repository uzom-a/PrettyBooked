import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { friendlyError } from '../lib/errors'
import { useAuth } from '../context/AuthContext'

export default function LeaveReview() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const bookingId = params.get('booking')
  const [booking, setBooking] = useState(null)
  const [loading, setLoading] = useState(true)

  const [rating, setRating] = useState(0)
  const [hovered, setHovered] = useState(0)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  // The booking id is in the address, so refreshing the page still works.
  useEffect(() => {
    async function load() {
      if (bookingId) {
        const { data } = await supabase
          .from('bookings')
          .select('id, status, provider_id, provider_profiles(profiles(full_name))')
          .eq('id', bookingId)
          .eq('student_id', user.id)
          .maybeSingle()
        setBooking(data)
      }
      setLoading(false)
    }
    load()
  }, [bookingId, user.id])

  async function handleSubmit(e) {
    e.preventDefault()
    if (!rating) { setError('Please select a star rating.'); return }
    setSubmitting(true)
    const { error: err } = await supabase.from('reviews').insert({
      student_id: user.id,
      provider_id: booking.provider_id,
      booking_id: booking.id,
      rating,
      comment,
    })
    if (err) {
      setError(err.code === '23505' ? 'You already reviewed this booking.' : friendlyError(err))
      setSubmitting(false)
      return
    }
    navigate('/bookings')
  }

  if (loading) return <div className="text-center py-20 text-gray-400">Loading…</div>

  if (!booking || booking.status !== 'completed') {
    return (
      <div className="text-center py-20 px-6">
        <p className="text-gray-600">
          {booking ? 'You can leave a review once the appointment is completed.' : 'Booking not found.'}
        </p>
        <Link to="/bookings" className="inline-block mt-4 text-blush-600 font-semibold hover:underline">Back to my bookings</Link>
      </div>
    )
  }

  const providerName = booking.provider_profiles?.profiles?.full_name

  return (
    <div className="min-h-screen bg-blush-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-3xl shadow-sm border border-blush-100 p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="font-heading text-2xl font-bold text-gray-900">Leave a review</h1>
          <p className="text-gray-400 text-sm mt-1">How was your experience with <span className="font-semibold text-gray-600">{providerName}</span>?</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 text-sm p-3 rounded-xl mb-5 border border-red-100">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="text-center">
            <label className="block text-sm font-medium text-gray-700 mb-3">Your rating</label>
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHovered(star)}
                  onMouseLeave={() => setHovered(0)}
                  aria-label={`${star} star${star > 1 ? 's' : ''}`}
                  className={`text-4xl transition-transform hover:scale-110 ${star <= (hovered || rating) ? 'text-yellow-400' : 'text-gray-300'}`}
                >
                  ★
                </button>
              ))}
            </div>
            {rating > 0 && (
              <p className="text-sm text-blush-500 mt-2 font-medium">
                {['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent'][rating]}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Comment <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
              placeholder="Share your experience…"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blush-300 resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-black text-white py-3 rounded-full font-semibold hover:bg-gray-800 disabled:opacity-50 transition-colors"
          >
            {submitting ? 'Submitting…' : 'Submit review'}
          </button>
        </form>
      </div>
    </div>
  )
}
