"use client"

import React, { useEffect, useRef } from "react"
import L from "leaflet"
import "leaflet/dist/leaflet.css"

type Marker = { id: string; lat: number; lng: number; label?: string }

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
        const mk = L.circleMarker([m.lat, m.lng], { radius: 6, color: "#2563eb", fillColor: "#2563eb", fillOpacity: 1 })
        mk.addTo(leafletMapRef.current as L.Map)
        if (m.label) mk.bindPopup(m.label)
        addedMarkersRef.current.push(mk)
        latlngs.push([m.lat, m.lng])
      })

      if (latlngs.length >= 2) {
        const poly = L.polyline(latlngs, { color: "#2563eb", weight: 5, opacity: 0.9 }).addTo(leafletMapRef.current)
        addedMarkersRef.current.push(poly)
        ;(leafletMapRef.current as L.Map).fitBounds(poly.getBounds(), { padding: [40, 40] })
      } else if (latlngs.length === 1) {
        ;(leafletMapRef.current as L.Map).setView(latlngs[0], zoom)
      }
    } else if (leafletMapRef.current) {
      // no markers — ensure center/zoom
      leafletMapRef.current.setView([center.lat, center.lng], zoom)
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
