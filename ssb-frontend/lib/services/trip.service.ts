// Trip service: start and end trip actions
// Uses backend REST if NEXT_PUBLIC_API_URL is set; otherwise falls back to socket event

export type TripStatus = 'started' | 'completed'

// Default to backend dev URL if env not provided (align with api client)
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1'

async function postJSON(url: string, body: any) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  try {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('ssb_token')
      if (token) headers['Authorization'] = `Bearer ${token}`
    }
  } catch {}

  // Debug log to verify which endpoint FE is calling
  try { console.log('[trip.service] POST', url, body) } catch {}

  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body || {}),
  })
  // Debug log status
  try { console.log('[trip.service] status', res.status) } catch {}
  if (!res.ok) throw new Error(`Request failed ${res.status}`)
  return res.json().catch(() => ({}))
}

export async function startTrip(tripId: number | string) {
  if (API_BASE) {
    try {
      return await postJSON(`${API_BASE}/trips/${tripId}/start`, {})
    } catch (err: any) {
      // Fallback: many backends expose schedule status instead of trip start
      try {
        return await postJSON(`${API_BASE}/schedules/${tripId}/status`, { trangThai: 'dang_chay' })
      } catch (err2) {
        throw err
      }
    }
  }
  // Fallback: fire a DOM event so UI can react; in real app, socketService.updateTripStatus
  try {
    window.dispatchEvent(new CustomEvent('tripStarted', { detail: { tripId } }))
  } catch {}
  return { ok: true }
}

export async function endTrip(tripId: number | string) {
  if (API_BASE) {
    try {
      return await postJSON(`${API_BASE}/trips/${tripId}/end`, {})
    } catch (err: any) {
      // Fallback to schedules status endpoint
      try {
        return await postJSON(`${API_BASE}/schedules/${tripId}/status`, { trangThai: 'hoan_thanh' })
      } catch (err2) {
        throw err
      }
    }
  }
  try {
    window.dispatchEvent(new CustomEvent('tripCompleted', { detail: { tripId } }))
  } catch {}
  return { ok: true }
}
