import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export default function ProviderProfile() {
  const { id } = useParams()
  const { profile } = useAuth()
  const [provider, setProvider] = useState(null)
  const [services, setServices] = useState([])
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [{ data: p }, { data: s }, { data: r }] = await Promise.all([
        supabase.from('provider_profiles').select('*, profiles(full_name)').eq('id', id).single(),
        supabase.from('services').select('*').eq('provider_id', id),
        supabase.from('reviews').select('*, profiles(full_name)').eq('provider_id', id).order('created_at', { ascending: false }),
      ])
      setProvider(p)
      setServices(s || [])
      setReviews(r || [])
      setLoading(false)
    }
    load()
  }, [id])

  if (loading) return <div className="text-center py-20 text-gray-400">Loading…</div>
  if (!provider) return <div className="text-center py-20 text-gray-400">Provider not found.</div>

  const avgRating = reviews.length
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : null

  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      {/* Header */}
      <div className="bg-white rounded-3xl shadow-sm border border-blush-100 p-8 mb-6 flex gap-6 items-start">
        {provider.avatar_url ? (
          <img src={provider.avatar_url} alt={provider.profiles?.full_name} className="w-24 h-24 rounded-full object-cover flex-shrink-0" />
        ) : (
          <div className="w-24 h-24 rounded-full bg-blush-200 flex items-center justify-center text-blush-600 font-heading font-bold text-3xl flex-shrink-0">
            {provider.profiles?.full_name?.[0]}
          </div>
        )}
        <div className="flex-1">
          <h1 className="font-heading text-2xl font-bold text-gray-900">{provider.profiles?.full_name}</h1>
          <span className="inline-block mt-1 text-sm bg-blush-50 text-blush-600 border border-blush-200 px-3 py-0.5 rounded-full capitalize">
            {provider.category.replace('-', ' ')}
          </span>
          {avgRating && (
            <p className="text-sm text-gray-500 mt-2">⭐ {avgRating} · {reviews.length} review{reviews.length !== 1 ? 's' : ''}</p>
          )}
          <p className="text-gray-600 mt-3 text-sm leading-relaxed">{provider.bio}</p>
        </div>
      </div>

      {/* Portfolio */}
      {provider.portfolio_urls?.length > 0 && (
        <div className="mb-6">
          <h2 className="font-heading text-xl font-semibold text-gray-800 mb-3">Portfolio</h2>
          <div className="grid grid-cols-3 gap-3">
            {provider.portfolio_urls.map((url, i) => (
              <img key={i} src={url} alt="portfolio" className="w-full h-32 object-cover rounded-2xl" />
            ))}
          </div>
        </div>
      )}

      {/* Services */}
      <div className="mb-6">
        <h2 className="font-heading text-xl font-semibold text-gray-800 mb-3">Services</h2>
        {services.length === 0 ? (
          <p className="text-gray-400 text-sm">No services listed yet.</p>
        ) : (
          <div className="space-y-3">
            {services.map((s) => (
              <div key={s.id} className="bg-white rounded-2xl border border-blush-100 px-5 py-4 flex items-center justify-between shadow-sm">
                <div>
                  <p className="font-medium text-gray-800">{s.name}</p>
                  <p className="text-sm text-gray-400">{s.duration_minutes} min</p>
                </div>
                <p className="font-semibold text-blush-600">${s.price}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Book button */}
      {profile?.role === 'student' && services.length > 0 && (
        <Link
          to={`/book/${id}`}
          className="block w-full text-center bg-black text-white py-3.5 rounded-full font-semibold text-lg hover:bg-gray-800 transition-colors shadow-md mb-8"
        >
          Book an Appointment
        </Link>
      )}

      {/* Reviews */}
      <div>
        <h2 className="font-heading text-xl font-semibold text-gray-800 mb-3">Reviews</h2>
        {reviews.length === 0 ? (
          <p className="text-gray-400 text-sm">No reviews yet.</p>
        ) : (
          <div className="space-y-4">
            {reviews.map((r) => (
              <div key={r.id} className="bg-white rounded-2xl border border-blush-100 p-5 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-medium text-gray-800">{r.profiles?.full_name}</p>
                  <p className="text-yellow-400">{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</p>
                </div>
                <p className="text-sm text-gray-600">{r.comment}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
