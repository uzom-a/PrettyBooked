import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

const DAYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']

function generateSlots(openTime, closeTime, durationMins) {
  const slots = []
  const [openH, openM] = openTime.split(':').map(Number)
  const [closeH, closeM] = closeTime.split(':').map(Number)
  let current = openH * 60 + openM
  const end = closeH * 60 + closeM

  while (current + durationMins <= end) {
    const h = Math.floor(current / 60)
    const m = current % 60
    const label = `${h % 12 || 12}:${m.toString().padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`
    const value = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`
    slots.push({ label, value })
    current += durationMins
  }
  return slots
}

export default function Book() {
  const { providerId } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [step, setStep] = useState(1)
  const [provider, setProvider] = useState(null)
  const [services, setServices] = useState([])
  const [availability, setAvailability] = useState([])
  const [bookedSlots, setBookedSlots] = useState([])

  const [selectedService, setSelectedService] = useState(null)
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedTime, setSelectedTime] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    async function load() {
      const [{ data: p }, { data: s }, { data: a }] = await Promise.all([
        supabase.from('provider_profiles').select('*, profiles(full_name)').eq('id', providerId).single(),
        supabase.from('services').select('*').eq('provider_id', providerId),
        supabase.from('availability').select('*').eq('provider_id', providerId),
      ])
      setProvider(p)
      setServices(s || [])
      setAvailability(a || [])
      setLoading(false)
    }
    load()
  }, [providerId])

  useEffect(() => {
    if (!selectedDate) return
    async function loadBooked() {
      const { data } = await supabase
        .from('bookings')
        .select('time')
        .eq('provider_id', providerId)
        .eq('date', selectedDate)
        .in('status', ['pending', 'confirmed'])
      setBookedSlots((data || []).map((b) => b.time.slice(0, 5)))
    }
    loadBooked()
  }, [selectedDate])

  const availableSlots = () => {
    if (!selectedDate || !selectedService) return []
    const dayName = DAYS[new Date(selectedDate + 'T00:00:00').getDay()]
    const dayAvail = availability.find((a) => a.day_of_week === dayName)
    if (!dayAvail) return []
    const slots = generateSlots(dayAvail.open_time, dayAvail.close_time, selectedService.duration_minutes)
    return slots.filter((s) => !bookedSlots.includes(s.value))
  }

  const minDate = new Date().toISOString().split('T')[0]

  async function handleConfirm() {
    setSubmitting(true)
    await supabase.from('bookings').insert({
      student_id: user.id,
      provider_id: providerId,
      service_id: selectedService.id,
      date: selectedDate,
      time: selectedTime,
      status: 'pending',
    })
    navigate('/bookings')
  }

  if (loading) return <div className="text-center py-20 text-gray-400">Loading…</div>

  return (
    <div className="max-w-lg mx-auto px-6 py-12">
      {/* Progress */}
      <div className="flex items-center gap-2 mb-8">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
              step >= s ? 'bg-blush-500 text-white' : 'bg-blush-100 text-blush-400'
            }`}>
              {s}
            </div>
            {s < 3 && <div className={`h-0.5 w-12 ${step > s ? 'bg-blush-500' : 'bg-blush-100'}`} />}
          </div>
        ))}
        <span className="ml-2 text-sm text-gray-400">
          {step === 1 ? 'Pick a service' : step === 2 ? 'Pick a date & time' : 'Confirm'}
        </span>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-blush-100 p-8">

        {/* Step 1 — Service */}
        {step === 1 && (
          <>
            <h2 className="font-heading text-2xl font-bold text-gray-900 mb-6">Choose a service</h2>
            <div className="space-y-3">
              {services.map((s) => (
                <button
                  key={s.id}
                  onClick={() => { setSelectedService(s); setStep(2) }}
                  className="w-full flex items-center justify-between border-2 rounded-2xl px-5 py-4 hover:border-blush-400 transition-colors text-left border-blush-100"
                >
                  <div>
                    <p className="font-medium text-gray-800">{s.name}</p>
                    <p className="text-sm text-gray-400">{s.duration_minutes} min</p>
                  </div>
                  <p className="font-semibold text-blush-600">${s.price}</p>
                </button>
              ))}
            </div>
          </>
        )}

        {/* Step 2 — Date & Time */}
        {step === 2 && (
          <>
            <h2 className="font-heading text-2xl font-bold text-gray-900 mb-6">Pick a date & time</h2>

            <div className="mb-5">
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <input
                type="date"
                min={minDate}
                value={selectedDate}
                onChange={(e) => { setSelectedDate(e.target.value); setSelectedTime('') }}
                className="w-full border border-blush-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blush-300"
              />
            </div>

            {selectedDate && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Available times</label>
                {availableSlots().length === 0 ? (
                  <p className="text-sm text-gray-400">No available slots on this date. Try another day.</p>
                ) : (
                  <div className="grid grid-cols-3 gap-2">
                    {availableSlots().map((slot) => (
                      <button
                        key={slot.value}
                        onClick={() => setSelectedTime(slot.value)}
                        className={`py-2 rounded-xl text-sm font-medium border-2 transition-colors ${
                          selectedTime === slot.value
                            ? 'bg-blush-500 text-white border-blush-500'
                            : 'border-blush-100 text-gray-700 hover:border-blush-400'
                        }`}
                      >
                        {slot.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-3 mt-8">
              <button onClick={() => setStep(1)} className="flex-1 border-2 border-gray-200 text-gray-600 py-2.5 rounded-full font-semibold hover:border-gray-300 transition-colors">
                Back
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={!selectedDate || !selectedTime}
                className="flex-1 bg-black text-white py-2.5 rounded-full font-semibold hover:bg-gray-800 disabled:opacity-40 transition-colors"
              >
                Next
              </button>
            </div>
          </>
        )}

        {/* Step 3 — Confirm */}
        {step === 3 && (
          <>
            <h2 className="font-heading text-2xl font-bold text-gray-900 mb-6">Confirm your booking</h2>

            <div className="bg-blush-50 rounded-2xl border border-blush-100 p-5 space-y-3 mb-8">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Provider</span>
                <span className="font-medium text-gray-800">{provider?.profiles?.full_name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Service</span>
                <span className="font-medium text-gray-800">{selectedService?.name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Duration</span>
                <span className="font-medium text-gray-800">{selectedService?.duration_minutes} min</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Date</span>
                <span className="font-medium text-gray-800">{new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric' })}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Time</span>
                <span className="font-medium text-gray-800">{availableSlots().find(s => s.value === selectedTime)?.label}</span>
              </div>
              <div className="flex justify-between text-sm border-t border-blush-200 pt-3 mt-1">
                <span className="text-gray-500">Price</span>
                <span className="font-bold text-blush-600 text-base">${selectedService?.price}</span>
              </div>
            </div>

            <p className="text-xs text-gray-400 text-center mb-6">Payment is handled in person at the time of your appointment.</p>

            <div className="flex gap-3">
              <button onClick={() => setStep(2)} className="flex-1 border-2 border-gray-200 text-gray-600 py-2.5 rounded-full font-semibold hover:border-gray-300 transition-colors">
                Back
              </button>
              <button
                onClick={handleConfirm}
                disabled={submitting}
                className="flex-1 bg-black text-white py-2.5 rounded-full font-semibold hover:bg-gray-800 disabled:opacity-40 transition-colors"
              >
                {submitting ? 'Booking…' : 'Confirm Booking'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
