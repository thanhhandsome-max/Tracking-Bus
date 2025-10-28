"use client"

import React from 'react'
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
  // convert buses -> simple marker shape used by LeafletMap
  const markers = buses.map((b) => ({ id: b.id, lat: b.lat, lng: b.lng, label: `${b.plateNumber} · ${b.route}` }))

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
