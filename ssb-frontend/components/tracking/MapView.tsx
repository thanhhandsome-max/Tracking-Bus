"use client"

import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { MapPin } from 'lucide-react'
import dynamic from 'next/dynamic'

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
  selectedBus?: Bus
  onSelectBus?: (bus: Bus) => void
  className?: string
  height?: string
}

export function MapView({
  buses,
  selectedBus,
  onSelectBus,
  className = '',
  height = '600px',
}: MapViewProps) {
  // local markers state so we can update positions in realtime when socket events arrive
  const [markers, setMarkers] = useState(
    buses.map((b) => ({ id: b.id, lat: b.lat, lng: b.lng, label: `${b.plateNumber} · ${b.route}` }))
  )

  // update markers when buses prop changes (initial or external updates)
  useEffect(() => {
    setMarkers(buses.map((b) => ({ id: b.id, lat: b.lat, lng: b.lng, label: `${b.plateNumber} · ${b.route}` })))
  }, [JSON.stringify(buses)])

  useEffect(() => {
    function handleEvent(e: Event) {
      const payload = (e as CustomEvent).detail
      if (!payload) return

      // try to find id and coords from payload
      const id = payload.id || payload.busId || payload.vehicleId || (payload.bus && payload.bus.id)
      const lat = payload.lat || payload.latitude || payload.latLng?.lat || payload.coords?.lat
      const lng = payload.lng || payload.longitude || payload.latLng?.lng || payload.coords?.lng || payload.lon
      if (!id || (typeof lat !== 'number' && typeof lng !== 'number')) return

      setMarkers((prev) => {
        const exist = prev.find((m) => m.id + '' === id + '')
        if (exist) {
          return prev.map((m) => (m.id + '' === id + '' ? { ...m, lat, lng } : m))
        }
        // if not exist, add new marker
        return [...prev, { id: id + '', lat, lng, label: payload.label || payload.title || '' }]
      })
    }

    window.addEventListener('busLocationUpdate', handleEvent as EventListener)
    window.addEventListener('busPositionUpdate', handleEvent as EventListener)

    return () => {
      window.removeEventListener('busLocationUpdate', handleEvent as EventListener)
      window.removeEventListener('busPositionUpdate', handleEvent as EventListener)
    }
  }, [])

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
          <LeafletMap height={height} markers={markers} />
          <div className="absolute bottom-4 left-4 bg-card/90 backdrop-blur-sm border border-border rounded-lg p-3 shadow-lg">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span className="text-xs text-foreground">Đang chạy</span>
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
