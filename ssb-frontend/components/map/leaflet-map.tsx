"use client"

import React, { useEffect, useRef } from "react"
import L from "leaflet"
import { createBusIcon, createStopIcon, createStopPinIcon } from './icons'
import "leaflet/dist/leaflet.css"

type Marker = { id: string; lat: number; lng: number; label?: string; type?: 'bus' | 'stop'; status?: string }

type Props = {
  height?: string
  center?: { lat: number; lng: number }
  zoom?: number
  markers?: Marker[]
  // When true, pan the map to the first marker on every update (no zoom change)
  followFirstMarker?: boolean
  // When true, fit bounds to all markers on every update (useful when there are multiple points)
  autoFitOnUpdate?: boolean
  // Highlight specific bus marker (by id)
  selectedId?: string
  // Callback when a marker is clicked
  onMarkerClick?: (id: string) => void
}

export default function LeafletMap({
  height = "360px",
  center = { lat: 10.77653, lng: 106.700981 },
  zoom = 13,
  markers = [],
  followFirstMarker = true,
  autoFitOnUpdate = false,
  selectedId,
  onMarkerClick,
}: Props) {
  const mapRef = useRef<HTMLDivElement | null>(null)
  const leafletMapRef = useRef<L.Map | null>(null)
  const addedMarkersRef = useRef<L.Layer[]>([])
  // Keep a persistent dictionary of L.Marker keyed by id for smooth updates
  const markerMapRef = useRef<Map<string, L.Marker>>(new Map())
  // Track ongoing animations to avoid overlapping tweens
  const animatingRef = useRef<Map<string, number>>(new Map())
  const initialViewSetRef = useRef(false)

  useEffect(() => {
    if (!mapRef.current) return

    // init map once
    if (!leafletMapRef.current) {
      const map = L.map(mapRef.current, {
        center: [center.lat, center.lng],
        zoom,
        zoomControl: true,
      })

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors',
      }).addTo(map)

      leafletMapRef.current = map

    }

    // Remove any non-marker overlay layers we added previously (e.g., polylines)
    addedMarkersRef.current.forEach((m) => {
      try {
        leafletMapRef.current?.removeLayer(m)
      } catch {}
    })
    addedMarkersRef.current = []

    const map = leafletMapRef.current
    if (!map) return

    // Diff current markers map vs new marker props
    const nextIds = new Set(markers.map((m) => m.id + ""))

    // Remove markers that no longer exist
    markerMapRef.current.forEach((marker, id) => {
      if (!nextIds.has(id)) {
        try { marker.remove(); } catch {}
        markerMapRef.current.delete(id)
      }
    })

    // Helper: tween move for smooth animation
    function tweenMove(id: string, marker: L.Marker, toLat: number, toLng: number, duration = 300) {
      const from = marker.getLatLng()
      const start = performance.now()
      // Cancel previous animation if any
      const prev = animatingRef.current.get(id)
      if (prev) cancelAnimationFrame(prev)

      const step = (ts: number) => {
        const t = Math.min(1, (ts - start) / duration)
        const lat = from.lat + (toLat - from.lat) * t
        const lng = from.lng + (toLng - from.lng) * t
        marker.setLatLng([lat, lng])
        if (t < 1) {
          const handle = requestAnimationFrame(step)
          animatingRef.current.set(id, handle)
        } else {
          animatingRef.current.delete(id)
        }
      }
      const handle = requestAnimationFrame(step)
      animatingRef.current.set(id, handle)
    }

    // Add or update markers
    const latlngs: L.LatLngExpression[] = []
    markers.forEach((m) => {
      const id = m.id + ""
      const existing = markerMapRef.current.get(id)
      if (existing) {
        // Update icon if status/type changes for buses
        if (m.type === 'bus') {
          const status = (m as any).status || ''
          const isSelected = selectedId && (selectedId + '') === id
          const color = status === 'running'
            ? (isSelected ? '#2563eb' : '#10b981') // blue when selected, green when running
            : (status === 'idle' ? '#6b7280' : (status === 'late' ? '#f59e0b' : '#f97316'))
          existing.setIcon(createBusIcon(color, isSelected ? 34 : 28))
        }
        // Smoothly move to new position
        tweenMove(id, existing, m.lat, m.lng)
        if ((existing as any).bindPopup && m.label) (existing as any).bindPopup(m.label)
      } else {
        // Create a new marker
        let mk: L.Marker
        if (m.type === 'bus') {
          const status = (m as any).status || ''
          const isSelected = selectedId && (selectedId + '') === id
          const color = status === 'running'
            ? (isSelected ? '#2563eb' : '#10b981')
            : (status === 'idle' ? '#6b7280' : (status === 'late' ? '#f59e0b' : '#f97316'))
          mk = L.marker([m.lat, m.lng], { icon: createBusIcon(color, isSelected ? 34 : 28) })
        } else if (m.type === 'stop') {
          mk = L.marker([m.lat, m.lng], { icon: createStopPinIcon('#ef4444', 28, 36) })
        } else {
          mk = L.marker([m.lat, m.lng])
        }
        if ((mk as any).bindPopup && m.label) (mk as any).bindPopup(m.label)
        mk.addTo(map)
        if (onMarkerClick) {
          mk.on('click', () => onMarkerClick(id))
        }
        markerMapRef.current.set(id, mk)
      }
      latlngs.push([m.lat, m.lng])
    })

    // View management
    if (latlngs.length >= 2) {
      const bounds = L.latLngBounds(latlngs as L.LatLngExpression[])
      if (!initialViewSetRef.current || autoFitOnUpdate) {
        map.fitBounds(bounds, { padding: [40, 40] })
        initialViewSetRef.current = true
      }
    } else if (latlngs.length === 1) {
      if (!initialViewSetRef.current) {
        map.setView(latlngs[0], zoom)
        initialViewSetRef.current = true
      } else if (followFirstMarker) {
        map.panTo(latlngs[0], { animate: true })
      }
    } else {
      if (!initialViewSetRef.current) {
        map.setView([center.lat, center.lng] as any, zoom)
        initialViewSetRef.current = true
      }
    }

    return () => {
      // cleanup overlays and markers on unmount
      addedMarkersRef.current.forEach((m) => {
        try { leafletMapRef.current?.removeLayer(m) } catch {}
      })
      addedMarkersRef.current = []
      markerMapRef.current.forEach((mk) => {
        try { mk.remove() } catch {}
      })
      markerMapRef.current.clear()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [center.lat, center.lng, zoom, JSON.stringify(markers), followFirstMarker, autoFitOnUpdate])

  return <div ref={mapRef} style={{ height, width: "100%" }} className="rounded-md overflow-hidden" />
}
