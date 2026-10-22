import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'

const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']
const DAY_LABELS = { mon: 'Monday', tue: 'Tuesday', wed: 'Wednesday', thu: 'Thursday', fri: 'Friday', sat: 'Saturday', sun: 'Sunday' }

const STATUS_STYLES = {
  pending:   'bg-yellow-50 text-yellow-700 border-yellow-200',
  confirmed: 'bg-green-50 text-green-700 border-green-200',
  cancelled: 'bg-red-50 text-red-500 border-red-200',
  completed: 'bg-gray-50 text-gray-500 border-gray-200',
}

export default function Dashboard() {
  const { user, profile } = useAuth()
  const [tab, setTab] = useState('bookings')
  const [providerProfile, setProviderProfile] = useState(null)

  // Bookings
  const [bookings, setBookings] = useState([])

  // Services
  const [services, setServices] = useState([])
  const [newService, setNewService] = useState({ name: '', price: '', duration_minutes: '' })
  const [addingService, setAddingService] = useState(false)

  // Availability
  const [availability, setAvailability] = useState({})
  const [savingAvail, setSavingAvail] = useState(false)

  useEffect(() => {
    async function load() {
      const { data: pp } = await supabase
        .from('provider_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single()
      setProviderProfile(pp)
      if (!pp) return

      const [{ data: b }, { data: s }, { data: a }] = await Promise.all([
        supabase.from('bookings')
          .select('*, services(name, price), profiles(full_name)')
          .eq('provider_id', pp.id)
          .order('date', { ascending: false }),
        supabase.from('services').select('*').eq('provider_id', pp.id),
        supabase.from('availability').select('*').eq('provider_id', pp.id),
      ])
      setBookings(b || [])
      setServices(s || [])

      const avMap = {}
      ;(a || []).forEach((row) => {
        avMap[row.day_of_week] = { open: row.open_time.slice(0, 5), close: row.close_time.slice(0, 5), id: row.id }
      })
      setAvailability(avMap)
    }
    load()
  }, [user.id])

  async function updateBookingStatus(id, status) {
    await supabase.from('bookings').update({ status }).eq('id', id)
    setBookings((prev) => prev.map((b) => b.id === id ? { ...b, status } : b))
  }

  async function addService(e) {
    e.preventDefault()
    setAddingService(true)
    const { data } = await supabase.from('services').insert({
      provider_id: providerProfile.id,
      name: newService.name,
      price: parseFloat(newService.price),
      duration_minutes: parseInt(newService.duration_minutes),
    }).select().single()
    setServices((prev) => [...prev, data])
    setNewService({ name: '', price: '', duration_minutes: '' })
    setAddingService(false)
  }

  async function deleteService(id) {
    await supabase.from('services').delete().eq('id', id)
    setServices((prev) => prev.filter((s) => s.id !== id))
  }

  function toggleDay(day) {
    if (availability[day]) {
      const next = { ...availability }
      delete next[day]
      setAvailability(next)
    } else {
      setAvailability({ ...availability, [day]: { open: '09:00', close: '18:00' } })
    }
  }

  function updateDayTime(day, field, value) {
    setAvailability({ ...availability, [day]: { ...availability[day], [field]: value } })
  }

  async function saveAvailability() {
    setSavingAvail(true)
    await supabase.from('availability').delete().eq('provider_id', providerProfile.id)
    const rows = Object.entries(availability).map(([day, times]) => ({
      provider_id: providerProfile.id,
      day_of_week: day,
      open_time: times.open,
      close_time: times.close,
    }))
    if (rows.length > 0) await supabase.from('availability').insert(rows)
    setSavingAvail(false)
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <h1 className="font-heading text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
      <p className="text-gray-400 text-sm mb-6">Welcome back, {profile?.full_name} 💗</p>

      {!providerProfile?.is_approved && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-2xl p-4 mb-6 text-sm">
          Your profile is pending approval. Bookings will be enabled once you're approved.
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-blush-50 rounded-2xl p-1 mb-8 border border-blush-100">
        {['bookings', 'services', 'availability'].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2 rounded-xl text-sm font-semibold capitalize transition-all ${
              tab === t ? 'bg-white text-blush-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Bookings tab */}
      {tab === 'bookings' && (
        <div className="space-y-4">
          {bookings.length === 0 && <p className="text-gray-400 text-sm">No bookings yet.</p>}
          {bookings.map((b) => (
            <div key={b.id} className="bg-white rounded-2xl border border-blush-100 shadow-sm p-5">
              <div className="flex items-center justify-between mb-2">
                <p className="font-semibold text-gray-900">{b.profiles?.full_name}</p>
                <span className={`text-xs font-medium border px-3 py-0.5 rounded-full capitalize ${STATUS_STYLES[b.status]}`}>
                  {b.status}
                </span>
              </div>
              <p className="text-sm text-gray-600">{b.services?.name} · ${b.services?.price}</p>
              <p className="text-sm text-gray-400 mt-1">
                {new Date(b.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric' })} · {b.time?.slice(0, 5)}
              </p>
              {b.status === 'pending' && (
                <div className="flex gap-2 mt-4">
                  <button onClick={() => updateBookingStatus(b.id, 'confirmed')} className="flex-1 bg-black text-white py-1.5 rounded-full text-sm font-semibold hover:bg-gray-800 transition-colors">
                    Confirm
                  </button>
                  <button onClick={() => updateBookingStatus(b.id, 'cancelled')} className="flex-1 border border-red-200 text-red-500 py-1.5 rounded-full text-sm font-semibold hover:bg-red-50 transition-colors">
                    Cancel
                  </button>
                </div>
              )}
              {b.status === 'confirmed' && (
                <button onClick={() => updateBookingStatus(b.id, 'completed')} className="mt-4 w-full border border-gray-200 text-gray-600 py-1.5 rounded-full text-sm font-semibold hover:bg-gray-50 transition-colors">
                  Mark as Completed
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Services tab */}
      {tab === 'services' && (
        <div>
          <div className="space-y-3 mb-6">
            {services.length === 0 && <p className="text-gray-400 text-sm">No services yet. Add one below.</p>}
            {services.map((s) => (
              <div key={s.id} className="bg-white rounded-2xl border border-blush-100 shadow-sm px-5 py-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-800">{s.name}</p>
                  <p className="text-sm text-gray-400">{s.duration_minutes} min</p>
                </div>
                <div className="flex items-center gap-4">
                  <p className="font-semibold text-blush-600">${s.price}</p>
                  <button onClick={() => deleteService(s.id)} className="text-red-400 hover:text-red-600 text-sm">
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>

          <form onSubmit={addService} className="bg-white rounded-2xl border border-blush-100 shadow-sm p-5">
            <p className="font-semibold text-gray-800 mb-4">Add a service</p>
            <div className="grid grid-cols-3 gap-3 mb-3">
              <input
                placeholder="Service name"
                value={newService.name}
                onChange={(e) => setNewService({ ...newService, name: e.target.value })}
                required
                className="col-span-3 border border-blush-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blush-300"
              />
              <input
                placeholder="Price ($)"
                type="number"
                value={newService.price}
                onChange={(e) => setNewService({ ...newService, price: e.target.value })}
                required
                className="border border-blush-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blush-300"
              />
              <input
                placeholder="Duration (min)"
                type="number"
                value={newService.duration_minutes}
                onChange={(e) => setNewService({ ...newService, duration_minutes: e.target.value })}
                required
                className="col-span-2 border border-blush-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blush-300"
              />
            </div>
            <button
              type="submit"
              disabled={addingService}
              className="w-full bg-black text-white py-2 rounded-full text-sm font-semibold hover:bg-gray-800 disabled:opacity-40 transition-colors"
            >
              {addingService ? 'Adding…' : 'Add Service'}
            </button>
          </form>
        </div>
      )}

      {/* Availability tab */}
      {tab === 'availability' && (
        <div>
          <p className="text-sm text-gray-400 mb-5">Toggle the days you're available and set your hours.</p>
          <div className="space-y-3 mb-6">
            {DAYS.map((day) => {
              const active = !!availability[day]
              return (
                <div key={day} className={`bg-white rounded-2xl border shadow-sm px-5 py-4 transition-colors ${active ? 'border-blush-200' : 'border-gray-100 opacity-60'}`}>
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={active}
                        onChange={() => toggleDay(day)}
                        className="w-4 h-4 accent-blush-500"
                      />
                      <span className="font-medium text-gray-800">{DAY_LABELS[day]}</span>
                    </label>

                    {active && (
                      <div className="flex items-center gap-2 text-sm">
                        <input
                          type="time"
                          value={availability[day].open}
                          onChange={(e) => updateDayTime(day, 'open', e.target.value)}
                          className="border border-blush-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blush-300"
                        />
                        <span className="text-gray-400">to</span>
                        <input
                          type="time"
                          value={availability[day].close}
                          onChange={(e) => updateDayTime(day, 'close', e.target.value)}
                          className="border border-blush-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blush-300"
                        />
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          <button
            onClick={saveAvailability}
            disabled={savingAvail}
            className="w-full bg-black text-white py-3 rounded-full font-semibold hover:bg-gray-800 disabled:opacity-40 transition-colors"
          >
            {savingAvail ? 'Saving…' : 'Save Availability'}
          </button>
        </div>
      )}
    </div>
  )
}
