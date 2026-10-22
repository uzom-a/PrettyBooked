import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export default function LeaveReview() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { state } = useLocation()
  const { providerId, providerName, bookingId } = state || {}

  const [rating, setRating] = useState(0)
  const [hovered, setHovered] = useState(0)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    if (!rating) { setError('Please select a star rating.'); return }
    setSubmitting(true)
    const { error: err } = await supabase.from('reviews').insert({
      student_id: user.id,
      provider_id: providerId,
      booking_id: bookingId,
      rating,
      comment,
    })
    if (err) { setError(err.message); setSubmitting(false); return }
    navigate('/bookings')
  }

  return (
    <div className="min-h-screen bg-blush-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-3xl shadow-sm border border-blush-100 p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">⭐</div>
          <h1 className="font-heading text-2xl font-bold text-gray-900">Leave a Review</h1>
          <p className="text-gray-400 text-sm mt-1">How was your experience with <span className="font-semibold text-gray-600">{providerName}</span>?</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 text-sm p-3 rounded-xl mb-5 border border-red-100">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Star rating */}
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
                  className="text-4xl transition-transform hover:scale-110"
                >
                  {star <= (hovered || rating) ? '⭐' : '☆'}
                </button>
              ))}
            </div>
            {rating > 0 && (
              <p className="text-sm text-blush-500 mt-2 font-medium">
                {['', 'Poor', 'Fair', 'Good', 'Great', 'Amazing!'][rating]}
              </p>
            )}
          </div>

          {/* Comment */}
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
            {submitting ? 'Submitting…' : 'Submit Review'}
          </button>
        </form>
      </div>
    </div>
  )
}
