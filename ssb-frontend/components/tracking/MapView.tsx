"use client"

import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { MapPin } from 'lucide-react'
import dynamic from 'next/dynamic'
import { useTripBusPosition } from '@/hooks/use-socket'

const LeafletMap = dynamic(() => import('@/components/map/leaflet-map'), { ssr: false })

interface Bus {
  id: string
  plateNumber: string
  route: string
  status: 'running' | 'late' | 'incident'
  lat: number
  lng: number
  speed: number
  students: number
}

interface MapViewProps {
  buses: Bus[]
  stops?: { id: string; lat: number; lng: number; label?: string }[]
  selectedBus?: Bus
  onSelectBus?: (bus: Bus) => void
  className?: string
  height?: string
  // When true, pan the map to the first marker as it moves
  followFirstMarker?: boolean
  // When true, auto fit bounds when markers update (useful if multiple points)
  autoFitOnUpdate?: boolean
}

export function MapView({
  buses,
  stops,
  selectedBus,
  onSelectBus,
  className = '',
  height = '600px',
  followFirstMarker = false,
  autoFitOnUpdate = false,
}: MapViewProps) {
  // local markers state so we can update positions in realtime when socket events arrive
  const [markers, setMarkers] = useState(() => {
    const busMarkers = buses.map((b) => ({ id: b.id, lat: b.lat, lng: b.lng, label: `${b.plateNumber} · ${b.route}`, type: 'bus' as const, status: b.status }))
    const stopMarkers = (stops || []).map((s) => ({ id: s.id, lat: s.lat, lng: s.lng, label: s.label, type: 'stop' as const }))
    return [...busMarkers, ...stopMarkers]
  })

  // update markers when buses or stops prop change (initial or external updates)
  useEffect(() => {
    const busMarkers = buses.map((b) => ({ id: b.id, lat: b.lat, lng: b.lng, label: `${b.plateNumber} · ${b.route}`, type: 'bus' as const, status: b.status }))
    const stopMarkers = (stops || []).map((s) => ({ id: s.id, lat: s.lat, lng: s.lng, label: s.label, type: 'stop' as const }))
    setMarkers([...busMarkers, ...stopMarkers])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(buses), JSON.stringify(stops || [])])

  useEffect(() => {
    function handleEvent(e: Event) {
      const payload = (e as CustomEvent).detail
      console.log('[MapView] Incoming bus update:', payload)

      if (!payload) return

      // try to find id and coords from payload
      const id = payload.id || payload.busId || payload.vehicleId || (payload.bus && payload.bus.id)
      const lat = payload.lat || payload.latitude || payload.latLng?.lat || payload.coords?.lat
      const lng = payload.lng || payload.longitude || payload.latLng?.lng || payload.coords?.lng || payload.lon
      const status = payload.status || payload.state || (payload.bus && payload.bus.status)
      console.log('[MapView] event', { id, lat, lng, raw: payload })
      if (!id || (typeof lat !== 'number' && typeof lng !== 'number')) return

      setMarkers((prev) => {
        const exist = prev.find((m) => m.id + '' === id + '')
        if (exist) {
          // update position and status if it's a bus
          return prev.map((m) => (m.id + '' === id + '' ? { ...m, lat, lng, ...(m.type === 'bus' ? { status } : {}) } : m))
        }
        // if not exist, add new marker (assume bus)
        return [...prev, { id: id + '', lat, lng, label: payload.label || payload.title || '', type: 'bus', status }]
      })
    }

    window.addEventListener('busLocationUpdate', handleEvent as EventListener)
    window.addEventListener('busPositionUpdate', handleEvent as EventListener)

    return () => {
      window.removeEventListener('busLocationUpdate', handleEvent as EventListener)
      window.removeEventListener('busPositionUpdate', handleEvent as EventListener)
    }
  }, [])
  useEffect(() => {
  console.log('[MapView] Markers updated:', markers)
}, [markers])

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary" />
            Bản đồ theo dõi
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {buses.length} xe
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="relative">
          <LeafletMap
            height={height}
            markers={markers}
            followFirstMarker={followFirstMarker}
            autoFitOnUpdate={autoFitOnUpdate}
            selectedId={selectedBus ? String(selectedBus.id) : undefined}
            onMarkerClick={(id) => {
              if (!onSelectBus) return
              const b = buses.find((x) => String(x.id) === String(id))
              if (b) onSelectBus(b as any)
            }}
          />
          <div className="absolute bottom-4 left-4 bg-card/90 backdrop-blur-sm border border-border rounded-lg p-3 shadow-lg pointer-events-none"
               style={{ zIndex: 99999 }}>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span className="text-xs text-foreground">Đang chạy</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-gray-500" />
                <span className="text-xs text-foreground">Đứng yên</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <span className="text-xs text-foreground">Trễ</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <span className="text-xs text-foreground">Sự cố</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default MapView
