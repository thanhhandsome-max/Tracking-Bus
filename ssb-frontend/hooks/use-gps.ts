"use client"

import { useEffect, useRef, useState } from 'react'
import { socketService } from '@/lib/socket'
const API_ORIGIN = process.env.NEXT_PUBLIC_API_ORIGIN || 'http://localhost:4000'

export type GpsPoint = { lat: number; lng: number; speed?: number; heading?: number; timestamp?: number }

/**
 * useGPS
 * - Starts browser geolocation watch and streams GPS to backend for a given trip
 * - Prefers Socket.IO emit('driver_gps'), falls back to REST POST /api/trips/:id/telemetry
 */
export function useGPS(tripId?: number) {
  const watchIdRef = useRef<number | null>(null)
  const [lastPoint, setLastPoint] = useState<GpsPoint | null>(null)
  const [running, setRunning] = useState(false)

  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null && typeof navigator !== 'undefined') {
        try { navigator.geolocation.clearWatch(watchIdRef.current) } catch {}
      }
    }
  }, [])

  async function send(point: GpsPoint) {
    if (!tripId) return
    // try socket first
    try {
      if (socketService.isConnected()) {
        socketService.sendDriverGPS({ tripId, lat: point.lat, lng: point.lng, speed: point.speed, heading: point.heading })
        return
      }
    } catch {}
    // fallback to REST (use non-v1 route mounted under /api)
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('ssb_token') : null
        if (token) headers['Authorization'] = `Bearer ${token}`
      } catch {}
      await fetch(`${API_ORIGIN}/api/trips/${tripId}/telemetry`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ lat: point.lat, lng: point.lng, speed: point.speed, heading: point.heading })
      })
    } catch (e) {
      console.warn('[useGPS] Telemetry send failed', e)
    }
  }

  function start() {
    if (!tripId) return
    if (typeof navigator === 'undefined' || !navigator.geolocation) return
    if (watchIdRef.current !== null) return
    setRunning(true)

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const coords = pos.coords
        const point: GpsPoint = {
          lat: coords.latitude,
          lng: coords.longitude,
          speed: typeof coords.speed === 'number' ? coords.speed * 3.6 : undefined, // m/s -> km/h
          heading: typeof coords.heading === 'number' ? coords.heading : undefined,
          timestamp: Date.now(),
        }
        setLastPoint(point)
        send(point)
      },
      (err) => {
        console.warn('[useGPS] geolocation error', err)
      },
      { enableHighAccuracy: true, maximumAge: 2000, timeout: 10000 }
    )
  }

  function stop() {
    if (watchIdRef.current !== null && typeof navigator !== 'undefined') {
      try { navigator.geolocation.clearWatch(watchIdRef.current) } catch {}
      watchIdRef.current = null
      setRunning(false)
    }
  }

  return { start, stop, running, lastPoint }
}
