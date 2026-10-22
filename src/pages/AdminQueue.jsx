import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'

export default function AdminQueue() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [pending, setPending] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (profile && profile.role !== 'admin') navigate('/')
  }, [profile])

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('provider_profiles')
        .select('*, profiles(full_name, email)')
        .eq('is_approved', false)
        .order('created_at', { ascending: true })
      setPending(data || [])
      setLoading(false)
    }
    load()
  }, [])

  async function approve(id) {
    await supabase.from('provider_profiles').update({ is_approved: true }).eq('id', id)
    setPending((prev) => prev.filter((p) => p.id !== id))
  }

  async function reject(id) {
    await supabase.from('provider_profiles').delete().eq('id', id)
    setPending((prev) => prev.filter((p) => p.id !== id))
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-bold mb-2">Provider Approvals</h1>
      <p className="text-gray-500 mb-8">Review and approve new provider applications.</p>

      {loading && <p className="text-gray-500">Loading…</p>}

      {!loading && pending.length === 0 && (
        <div className="text-center py-20 text-gray-400">
          <p className="text-lg">All caught up!</p>
          <p className="text-sm mt-1">No pending applications.</p>
        </div>
      )}

      <div className="space-y-6">
        {pending.map((p) => (
          <div key={p.id} className="bg-white rounded-2xl shadow p-6">
            <div className="flex items-start gap-4">
              {p.avatar_url ? (
                <img src={p.avatar_url} alt={p.profiles?.full_name} className="w-16 h-16 rounded-full object-cover" />
              ) : (
                <div className="w-16 h-16 rounded-full bg-gold-400 flex items-center justify-center text-black font-bold text-xl">
                  {p.profiles?.full_name?.[0]}
                </div>
              )}
              <div className="flex-1">
                <p className="font-semibold text-gray-900">{p.profiles?.full_name}</p>
                <p className="text-sm text-gray-500">{p.profiles?.email}</p>
                <span className="inline-block mt-1 text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full capitalize">
                  {p.category.replace('-', ' ')}
                </span>
                <p className="text-sm text-gray-600 mt-3">{p.bio}</p>

                {p.portfolio_urls?.length > 0 && (
                  <div className="flex gap-2 mt-3 flex-wrap">
                    {p.portfolio_urls.map((url, i) => (
                      <img key={i} src={url} alt="portfolio" className="w-20 h-20 rounded-lg object-cover" />
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-3 mt-5">
              <button
                onClick={() => approve(p.id)}
                className="flex-1 bg-black text-white py-2 rounded-lg font-semibold hover:bg-gray-800"
              >
                Approve
              </button>
              <button
                onClick={() => reject(p.id)}
                className="flex-1 border border-red-300 text-red-600 py-2 rounded-lg font-semibold hover:bg-red-50"
              >
                Reject
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
