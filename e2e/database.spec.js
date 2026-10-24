import { test, expect } from '@playwright/test'

// These call the database the same way the pages do. A bad link between
// tables makes every one of these pages come back empty.
const url = process.env.VITE_SUPABASE_URL
const key = process.env.VITE_SUPABASE_ANON_KEY
const headers = { apikey: key, Authorization: `Bearer ${key}` }

const QUERIES = {
  'stylist list and profile': 'provider_profiles?select=*,profiles(full_name)&limit=1',
  'reviews with names': 'reviews?select=*,profiles(full_name)&limit=1',
  'stylist dashboard bookings': 'bookings?select=*,services(name,price),profiles(full_name)&limit=1',
  'student bookings': 'bookings?select=*,services(name,price),provider_profiles(id,user_id,profiles(id,full_name))&limit=1',
  'message inbox': 'messages?select=*,sender:profiles!messages_sender_id_fkey(id,full_name),receiver:profiles!messages_receiver_id_fkey(id,full_name)&limit=1',
}

test.describe('database links', () => {
  test.skip(({ isMobile }) => isMobile, 'Same check on every screen size, so run it once')
  test.skip(!url || !key, 'Needs VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env')

  for (const [name, query] of Object.entries(QUERIES)) {
    test(name, async ({ request }) => {
      const res = await request.get(`${url}/rest/v1/${query}`, { headers })
      expect(res.status(), await res.text()).toBe(200)
    })
  }

  test('booking page can see taken times', async ({ request }) => {
    const res = await request.post(`${url}/rest/v1/rpc/taken_times`, {
      headers,
      data: { p_provider_id: '00000000-0000-0000-0000-000000000000', p_date: '2030-01-01' },
    })
    expect(res.status(), await res.text()).toBe(200)
    expect(await res.json()).toEqual([])
  })

  test('saving opening hours is set up, and closed to visitors', async ({ request }) => {
    const res = await request.post(`${url}/rest/v1/rpc/save_availability`, {
      headers,
      data: { p_provider_id: '00000000-0000-0000-0000-000000000000', p_hours: [] },
    })
    // A missing function would be a 404. Visitors are refused instead.
    expect(res.status(), await res.text()).toBe(401)
  })
})
