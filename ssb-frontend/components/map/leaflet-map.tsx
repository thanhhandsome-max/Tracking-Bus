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
}

export default function LeafletMap({
  height = "360px",
  center = { lat: 10.77653, lng: 106.700981 },
  zoom = 13,
  markers = [],
}: Props) {
  const mapRef = useRef<HTMLDivElement | null>(null)
  const leafletMapRef = useRef<L.Map | null>(null)
  const addedMarkersRef = useRef<L.Layer[]>([])
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

    // cleanup previous markers/polylines
    addedMarkersRef.current.forEach((m) => {
      try {
        leafletMapRef.current?.removeLayer(m)
      } catch (e) {
        /* ignore */
      }
    })
    addedMarkersRef.current = []

    // add markers
    if (leafletMapRef.current && markers.length > 0) {
      const latlngs: L.LatLngExpression[] = []
      markers.forEach((m) => {
        // use icon markers for bus/stop types, fallback to circleMarker for unknown
        let mk: L.Layer
        if (m.type === 'bus') {
          // choose color by status: running -> green, otherwise orange
          const status = (m as any).status || ''
          const color = status === 'running' ? '#10b981' : '#f97316'
          mk = L.marker([m.lat, m.lng], { icon: createBusIcon(color, 28) })
        } else if (m.type === 'stop') {
          mk = L.marker([m.lat, m.lng], { icon: createStopPinIcon('#ef4444', 28, 36) })
        } else {
          mk = L.circleMarker([m.lat, m.lng], { radius: 6, color: "#2563eb", fillColor: "#2563eb", fillOpacity: 1 })
        }

        mk.addTo(leafletMapRef.current as L.Map)
        if ((mk as any).bindPopup && m.label) (mk as any).bindPopup(m.label)
        addedMarkersRef.current.push(mk)
        latlngs.push([m.lat, m.lng])
      })

      if (latlngs.length >= 2) {
        const poly = L.polyline(latlngs, { color: "#2563eb", weight: 5, opacity: 0.9 }).addTo(leafletMapRef.current)
        addedMarkersRef.current.push(poly)
        // Only auto-fit bounds on the first render (avoid resetting user zoom/pan)
        if (!initialViewSetRef.current) {
          ;(leafletMapRef.current as L.Map).fitBounds(poly.getBounds(), { padding: [40, 40] })
          initialViewSetRef.current = true
        }
      } else if (latlngs.length === 1) {
        // Only set view on first render
        if (!initialViewSetRef.current) {
          ;(leafletMapRef.current as L.Map).setView(latlngs[0], zoom)
          initialViewSetRef.current = true
        }
      }
    } else if (leafletMapRef.current) {
      // no markers — ensure center/zoom only on first render to avoid resetting user interactions
      if (!initialViewSetRef.current) {
        leafletMapRef.current.setView([center.lat, center.lng], zoom)
        initialViewSetRef.current = true
      }
    }

    return () => {
      // cleanup markers on unmount
      addedMarkersRef.current.forEach((m) => {
        try {
          leafletMapRef.current?.removeLayer(m)
        } catch (e) {
          /* ignore */
        }
      })
      addedMarkersRef.current = []
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [center.lat, center.lng, zoom, JSON.stringify(markers)])

  return <div ref={mapRef} style={{ height, width: "100%" }} className="rounded-md overflow-hidden" />
}
