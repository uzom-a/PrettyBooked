import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { friendlyError } from '../lib/errors'
import { useAuth } from '../context/AuthContext'

const CATEGORIES = ['braider', 'nail-tech', 'lash-tech', 'seamstress']

export default function CreateProfile() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ bio: '', category: 'braider' })
  const [photoFile, setPhotoFile] = useState(null)
  const [portfolioFiles, setPortfolioFiles] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      let avatarUrl = null
      if (photoFile) {
        const ext = photoFile.name.split('.').pop()
        const path = `avatars/${user.id}.${ext}`
        const { error: uploadErr } = await supabase.storage.from('avatars').upload(path, photoFile, { upsert: true })
        if (uploadErr) throw new Error('Photo upload failed. Use a JPG, PNG or WebP under 5 MB.')
        const { data } = supabase.storage.from('avatars').getPublicUrl(path)
        avatarUrl = data.publicUrl
      }

      const portfolioUrls = []
      for (const file of portfolioFiles) {
        const path = `portfolio/${user.id}/${Date.now()}-${file.name}`
        const { error: uploadErr } = await supabase.storage.from('portfolio').upload(path, file)
        if (uploadErr) throw new Error('Photo upload failed. Use a JPG, PNG or WebP under 5 MB.')
        const { data } = supabase.storage.from('portfolio').getPublicUrl(path)
        portfolioUrls.push(data.publicUrl)
      }

      const { error: insertErr } = await supabase.from('provider_profiles').insert({
        user_id: user.id,
        bio: form.bio,
        category: form.category,
        avatar_url: avatarUrl,
        portfolio_urls: portfolioUrls,
        is_approved: true,
      })
      if (insertErr?.code === '23505') throw new Error('You already have a stylist profile.')
      if (insertErr?.code === '42501') throw new Error('Only stylist accounts can create a stylist profile.')
      if (insertErr) throw new Error(friendlyError(insertErr))

      navigate('/dashboard')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="bg-white rounded-2xl shadow p-8 w-full max-w-lg">
        <h1 className="text-2xl font-bold mb-2">Set up your profile</h1>
        <p className="text-gray-500 text-sm mb-6">
          Your profile goes live as soon as you create it.
        </p>

        {error && (
          <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg mb-4">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select
              name="category"
              value={form.category}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gold-400"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c.replace('-', ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
            <textarea
              name="bio"
              value={form.bio}
              onChange={handleChange}
              required
              rows={4}
              placeholder="Tell students about yourself, your experience, and what you offer…"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gold-400 resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Profile photo</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setPhotoFile(e.target.files[0])}
              className="text-sm text-gray-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Portfolio photos <span className="text-gray-400 font-normal">(optional, up to 6)</span>
            </label>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => setPortfolioFiles(Array.from(e.target.files).slice(0, 6))}
              className="text-sm text-gray-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black text-white py-2.5 rounded-lg font-semibold hover:bg-gray-800 disabled:opacity-50"
          >
            {loading ? 'Creating…' : 'Create profile'}
          </button>
        </form>
      </div>
    </div>
  )
}
