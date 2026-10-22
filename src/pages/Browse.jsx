import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const CATEGORY_LABELS = {
  braider: 'Braider',
  'nail-tech': 'Nail Tech',
  'lash-tech': 'Lash Tech',
  seamstress: 'Seamstress',
}

export default function Browse() {
  const { category } = useParams()
  const [providers, setProviders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('provider_profiles')
        .select('*, profiles(full_name)')
        .eq('category', category)
        .eq('is_approved', true)
      setProviders(data || [])
      setLoading(false)
    }
    load()
  }, [category])

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-bold mb-8">{CATEGORY_LABELS[category] ?? category}</h1>

      {loading && <p className="text-gray-500">Loading…</p>}

      {!loading && providers.length === 0 && (
        <div className="text-center py-20 text-gray-400">
          <p className="text-lg">No providers yet in this category.</p>
          <p className="text-sm mt-2">Check back soon!</p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {providers.map((p) => (
          <Link
            key={p.id}
            to={`/provider/${p.id}`}
            className="bg-white rounded-2xl shadow p-6 hover:shadow-md hover:-translate-y-1 transition-all"
          >
            <div className="flex items-center gap-4 mb-3">
              {p.avatar_url ? (
                <img src={p.avatar_url} alt={p.profiles?.full_name} className="w-14 h-14 rounded-full object-cover" />
              ) : (
                <div className="w-14 h-14 rounded-full bg-gold-400 flex items-center justify-center text-black font-bold text-xl">
                  {p.profiles?.full_name?.[0]}
                </div>
              )}
              <div>
                <p className="font-semibold text-gray-900">{p.profiles?.full_name}</p>
                <p className="text-sm text-gray-500 capitalize">{p.category.replace('-', ' ')}</p>
              </div>
            </div>
            <p className="text-sm text-gray-600 line-clamp-2">{p.bio}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
