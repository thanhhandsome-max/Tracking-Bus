/**
 * MapView Component for Real-time Bus Tracking
 * Supports both Google Maps and Leaflet
 */

"use client"

import React, { useEffect, useRef, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { MapPin, Navigation, Clock, Users } from 'lucide-react'

interface Bus {
  id: string
  plateNumber: string
  route: string
  status: 'running' | 'late' | 'incident'
  lat: number
  lng: number
  speed: number
  students: number
  driver?: {
    name: string
    phone: string
  }
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
  height = '600px'
}: MapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const [mapInstance, setMapInstance] = useState<any>(null)
  const [markers, setMarkers] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Initialize map
  useEffect(() => {
    const initMap = async () => {
      try {
        setIsLoading(true)
        setError(null)

        // Check if Google Maps API key is available
        const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
        if (!apiKey) {
          throw new Error('Google Maps API key not found')
        }

        // Load Google Maps API
        await loadGoogleMaps(apiKey)

        if (mapRef.current) {
          const map = new (window as any).google.maps.Map(mapRef.current, {
            center: { lat: 10.762622, lng: 106.660172 }, // Ho Chi Minh City
            zoom: 13,
            mapTypeId: (window as any).google.maps.MapTypeId.ROADMAP,
            styles: [
              {
                featureType: 'poi',
                elementType: 'labels',
                stylers: [{ visibility: 'off' }]
              }
            ]
          })

          setMapInstance(map)
          setIsLoading(false)
        }
      } catch (error) {
        console.error('Failed to initialize map:', error)
        setError(error instanceof Error ? error.message : 'Failed to load map')
        setIsLoading(false)
      }
    }

    initMap()
  }, [])

  // Add bus markers
  useEffect(() => {
    if (!mapInstance || !buses.length) return

    // Clear existing markers
    markers.forEach(marker => marker.setMap(null))
    const newMarkers: any[] = []

    buses.forEach(bus => {
      const marker = new (window as any).google.maps.Marker({
        position: { lat: bus.lat, lng: bus.lng },
        map: mapInstance,
        title: bus.plateNumber,
        icon: getBusIcon(bus.status),
        animation: bus.status === 'running' ? (window as any).google.maps.Animation.BOUNCE : null
      })

      // Add click listener
      marker.addListener('click', () => {
        onSelectBus?.(bus)
      })

      // Add info window
      const infoWindow = new (window as any).google.maps.InfoWindow({
        content: createInfoWindowContent(bus)
      })

      marker.addListener('click', () => {
        infoWindow.open(mapInstance, marker)
      })

      newMarkers.push(marker)
    })

    setMarkers(newMarkers)

    // Fit map to show all buses
    if (newMarkers.length > 0) {
      const bounds = new (window as any).google.maps.LatLngBounds()
      newMarkers.forEach(marker => bounds.extend(marker.getPosition()))
      mapInstance.fitBounds(bounds)
    }
  }, [mapInstance, buses, onSelectBus])

  // Update selected bus
  useEffect(() => {
    if (selectedBus && mapInstance) {
      const marker = markers.find(m => m.title === selectedBus.plateNumber)
      if (marker) {
        mapInstance.setCenter(marker.getPosition())
        mapInstance.setZoom(15)
      }
    }
  }, [selectedBus, mapInstance, markers])

  // Get bus icon based on status
  const getBusIcon = (status: string) => {
    const colors = {
      running: '#10b981', // green
      late: '#f59e0b',    // yellow
      incident: '#ef4444' // red
    }

    return {
      path: (window as any).google.maps.SymbolPath.CIRCLE,
      scale: 12,
      fillColor: colors[status as keyof typeof colors],
      fillOpacity: 1,
      strokeColor: '#ffffff',
      strokeWeight: 2
    }
  }

  // Create info window content
  const createInfoWindowContent = (bus: Bus) => {
    return `
      <div class="p-2">
        <h3 class="font-semibold text-sm">${bus.plateNumber}</h3>
        <p class="text-xs text-gray-600">${bus.route}</p>
        <div class="flex items-center gap-2 mt-1">
          <span class="text-xs ${bus.status === 'running' ? 'text-green-600' : bus.status === 'late' ? 'text-yellow-600' : 'text-red-600'}">
            ${bus.status === 'running' ? 'Đang chạy' : bus.status === 'late' ? 'Trễ' : 'Sự cố'}
          </span>
          <span class="text-xs text-gray-500">${bus.speed} km/h</span>
        </div>
        <div class="flex items-center gap-1 mt-1">
          <span class="text-xs text-gray-500">👥 ${bus.students} HS</span>
        </div>
      </div>
    `
  }

  // Fallback component for when map fails to load
  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary" />
            Bản đồ theo dõi
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[400px] bg-muted/30 rounded-lg">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto">
                <MapPin className="w-8 h-8 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium text-foreground">Không thể tải bản đồ</p>
                <p className="text-sm text-muted-foreground">{error}</p>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => window.location.reload()}
              >
                Thử lại
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

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
            {isLoading && (
              <Badge variant="secondary" className="text-xs">
                Đang tải...
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="relative">
          <div 
            ref={mapRef} 
            className="w-full rounded-lg"
            style={{ height }}
          />
          
          {/* Loading overlay */}
          {isLoading && (
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center rounded-lg">
              <div className="text-center space-y-2">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-sm text-muted-foreground">Đang tải bản đồ...</p>
              </div>
            </div>
          )}

          {/* Legend */}
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

// Load Google Maps API
function loadGoogleMaps(apiKey: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('Not in browser environment'))
      return
    }

    if ((window as any).google?.maps) {
      resolve()
      return
    }

    const existing = document.querySelector(`script[data-google-maps]`)
    if (existing) {
      existing.addEventListener('load', () => resolve())
      existing.addEventListener('error', () => reject(new Error('Failed to load Google Maps')))
      return
    }

    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=geometry,places`
    script.async = true
    script.defer = true
    script.setAttribute('data-google-maps', 'true')
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Failed to load Google Maps'))
    document.head.appendChild(script)
  })
}

export default MapView
