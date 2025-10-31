'use client';

import { useEffect, useRef, useState, useMemo } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import styles from './MapView.module.css';

mapboxgl.accessToken = 'pk.eyJ1IjoidGhhbmhoYW5kc29tZTA1MTIiLCJhIjoiY21oYzE1ajJlMTB4aDJpcHp4bGJqY2praiJ9.uxt5rLnd30BuQxh_9kEaqQ';

export interface Stop {
  name: string;
  lat: number;
  lng: number;
  time?: string;
  type?: 'pickup' | 'dropoff' | 'stop';
}

interface BusLocation {
  lat: number;
  lng: number;
  speed?: number;
  timestamp?: Date;
}

interface MapViewProps {
  stops: Stop[];
  height?: string;
  showRoute?: boolean;
  useRealRouting?: boolean;
  busLocation?: BusLocation;
  showBus?: boolean;
  graphHopperKey?: string;
  routingProvider?: 'graphhopper' | 'osrm'; // Add routing provider option
}

const DEFAULT_CENTER: [number, number] = [106.660172, 10.762622]; // TP.HCM [lng, lat]
const DEFAULT_ZOOM = 12;

export default function MapView({
  stops = [],
  height = '500px',
  showRoute = true,
  useRealRouting = true,
  busLocation,
  showBus = false,
  graphHopperKey = '644e34bf-5fb2-4c91-b25c-ebb00d9bb557',
  routingProvider = 'osrm' // Default to OSRM (more reliable)
}: MapViewProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const routeSourceId = 'route';
  const [mapError, setMapError] = useState<string | null>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);

  // Memoize stops để tránh effect chạy lại liên tục
  const stopsKey = useMemo(() => {
    return JSON.stringify(stops.map(s => ({ lat: s.lat, lng: s.lng, name: s.name })));
  }, [stops]);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    console.log('🗺️ Initializing Mapbox map...');
    console.log('Container:', mapContainer.current);

    try {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: stops.length > 0 ? [stops[0].lng, stops[0].lat] : DEFAULT_CENTER,
        zoom: DEFAULT_ZOOM
      });

      console.log('✅ Map created successfully');

      map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

      map.current.on('load', () => {
        console.log('✅ Map loaded successfully');
        setIsMapLoaded(true);
        setMapError(null);
      });

      map.current.on('error', (e) => {
        console.error('❌ Map error:', e);
        console.error('Error detail:', JSON.stringify(e, null, 2));
        if (e.error) {
          console.error('Error object:', e.error);
          console.error('Error message:', e.error.message);
          console.error('Error status:', (e.error as any).status);
        }
        setMapError(`Lỗi tải bản đồ: ${e.error?.message || 'Unknown error'}`);
      });

    } catch (error) {
      console.error('❌ Error creating map:', error);
      setMapError('Không thể khởi tạo bản đồ. Trình duyệt có thể không hỗ trợ WebGL.');
    }

    return () => {
      console.log('🗑️ Cleaning up map...');
      map.current?.remove();
      map.current = null;
    };
  }, []);

  // Add markers
  useEffect(() => {
    if (!map.current || stops.length === 0) return;

    // Remove old markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Add new markers
    stops.forEach((stop, index) => {
      const el = document.createElement('div');
      el.className = styles.marker;
      
      let color = '#3b82f6'; // blue - stop
      if (stop.type === 'pickup') color = '#22c55e'; // green
      if (stop.type === 'dropoff') color = '#ef4444'; // red

      el.style.backgroundColor = color;
      el.style.width = '20px';
      el.style.height = '20px';
      el.style.borderRadius = '50%';
      el.style.border = '3px solid white';
      el.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';
      el.style.cursor = 'pointer';

      const marker = new mapboxgl.Marker(el)
        .setLngLat([stop.lng, stop.lat])
        .setPopup(
          new mapboxgl.Popup({ offset: 25 })
            .setHTML(`
              <div style="padding: 8px;">
                <strong>${stop.name}</strong>
                ${stop.time ? `<div style="font-size: 12px; color: #666; margin-top: 4px;">${stop.time}</div>` : ''}
              </div>
            `)
        )
        .addTo(map.current!);

      markersRef.current.push(marker);
    });

    // Fit bounds to show all markers
    if (stops.length > 0) {
      const bounds = new mapboxgl.LngLatBounds();
      stops.forEach(stop => bounds.extend([stop.lng, stop.lat]));
      map.current.fitBounds(bounds, { padding: 50 });
    }
  }, [stops]);

  // Add route with GraphHopper
  useEffect(() => {
    if (!map.current || !showRoute || stops.length < 2) {
      console.log('⏭️ Skipping route drawing:', { 
        hasMap: !!map.current, 
        showRoute, 
        stopsCount: stops.length 
      });
      return;
    }

    console.log('🎬 Route effect triggered');

    let isMounted = true;

    const drawRoute = async () => {
      if (!isMounted) {
        console.log('⏸️ Component unmounted, skipping route draw');
        return;
      }
      
      console.log('🎨 Starting drawRoute function...');
      console.log('🗺️ Map loaded?', map.current?.loaded());
      console.log('🗺️ Map style loaded?', map.current?.isStyleLoaded());
      
      if (!map.current || !map.current.loaded()) {
        console.warn('⏸️ Map not ready yet, waiting...');
        return;
      }
      
      try {
        if (useRealRouting) {
          console.log(`🚗 Fetching route from ${routingProvider.toUpperCase()} API...`);
          console.log('📍 Number of stops:', stops.length);
          console.log('📍 Stops:', stops.map((s: Stop) => `${s.name}: ${s.lat},${s.lng}`));
          
          if (routingProvider === 'osrm') {
            // Use OSRM API (free, unlimited waypoints)
            const coords = stops.map((s: Stop) => `${s.lng},${s.lat}`).join(';');
            const url = `https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson`;
            
            console.log('🌐 OSRM URL:', url);

            const response = await fetch(url);
            
            if (!response.ok) {
              const errorText = await response.text();
              console.error('❌ OSRM HTTP Error:', response.status, errorText);
              throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            console.log('✅ OSRM Response:', data);

            if (data.code === 'Ok' && data.routes && data.routes[0]) {
              const route = data.routes[0];
              
              console.log('📏 Route details:', {
                distance: (route.distance / 1000).toFixed(2) + ' km',
                duration: Math.round(route.duration / 60) + ' minutes',
                geometry_points: route.geometry.coordinates.length
              });

              // Convert GeoJSON coordinates [lng, lat] to Leaflet format [lat, lng]
              const routeCoordinates = route.geometry.coordinates;

              console.log('🎨 Drawing route with', routeCoordinates.length, 'points');

              // Convert coordinates to GeoJSON
              const geojson: GeoJSON.Feature<GeoJSON.LineString> = {
                type: 'Feature',
                properties: {},
                geometry: {
                  type: 'LineString',
                  coordinates: routeCoordinates // Already in [lng, lat] format
                }
              };

              console.log('📦 GeoJSON created:', geojson);

              // Remove old route if exists
              if (map.current!.getSource(routeSourceId)) {
                console.log('🗑️ Removing old route layer and source');
                map.current!.removeLayer('route-layer');
                map.current!.removeSource(routeSourceId);
              }

              console.log('➕ Adding new route source...');
              
              // Add route to map
              map.current!.addSource(routeSourceId, {
                type: 'geojson',
                data: geojson
              });

              console.log('➕ Adding new route layer...');

              map.current!.addLayer({
                id: 'route-layer',
                type: 'line',
                source: routeSourceId,
                layout: {
                  'line-join': 'round',
                  'line-cap': 'round'
                },
                paint: {
                  'line-color': '#2563eb',
                  'line-width': 5,
                  'line-opacity': 0.8
                }
              });

              console.log('✅ Route drawn successfully!');
              console.log('🔍 Layer info:', map.current!.getLayer('route-layer'));
              console.log('🔍 Source info:', map.current!.getSource(routeSourceId));
            } else {
              throw new Error(`OSRM Error: ${data.code || 'Unknown error'}`);
            }
          } else {
            // Use GraphHopper API
            // Use GraphHopper API
            const points = stops.map((s: Stop) => `point=${s.lat},${s.lng}`).join('&');
            const url = `https://graphhopper.com/api/1/route?${points}&vehicle=car&locale=vi&key=${graphHopperKey}&points_encoded=false&type=json`;
            
            console.log('🌐 GraphHopper URL:', url);
            console.log('🔑 Using API Key:', graphHopperKey.substring(0, 10) + '...');

            const response = await fetch(url);
            
            if (!response.ok) {
              const errorText = await response.text();
              console.error('❌ GraphHopper HTTP Error:', response.status, errorText);
              throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            console.log('✅ GraphHopper Response:', data);

            // Check for GraphHopper errors
            if (data.message) {
              console.error('❌ GraphHopper API Error:', data.message);
              throw new Error(data.message);
            }

            if (data.paths && data.paths[0]) {
              const path = data.paths[0];
              
              console.log('📏 Route details:', {
                distance: (path.distance / 1000).toFixed(2) + ' km',
                time: Math.round(path.time / 60000) + ' minutes',
                points: path.points.coordinates.length
              });

              // Convert coordinates to GeoJSON
              const geojson: GeoJSON.Feature<GeoJSON.LineString> = {
                type: 'Feature',
                properties: {},
                geometry: {
                  type: 'LineString',
                  coordinates: path.points.coordinates // Already in [lng, lat] format
                }
              };

              // Remove old route if exists
              if (map.current!.getSource(routeSourceId)) {
                map.current!.removeLayer('route-layer');
                map.current!.removeSource(routeSourceId);
              }

              // Add route to map
              map.current!.addSource(routeSourceId, {
                type: 'geojson',
                data: geojson
              });

              map.current!.addLayer({
                id: 'route-layer',
                type: 'line',
                source: routeSourceId,
                layout: {
                  'line-join': 'round',
                  'line-cap': 'round'
                },
                paint: {
                  'line-color': '#2563eb',
                  'line-width': 5,
                  'line-opacity': 0.8
                }
              });

              console.log('✅ Route drawn successfully!');
            } else {
              throw new Error('No route found in response');
            }
          }
        } else {
          // Simple straight line
          console.log('📏 Drawing straight line...');
          
          const coordinates = stops.map((s: Stop) => [s.lng, s.lat]);
          const geojson: GeoJSON.Feature<GeoJSON.LineString> = {
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'LineString',
              coordinates
            }
          };

          if (map.current!.getSource(routeSourceId)) {
            map.current!.removeLayer('route-layer');
            map.current!.removeSource(routeSourceId);
          }

          map.current!.addSource(routeSourceId, {
            type: 'geojson',
            data: geojson
          });

          map.current!.addLayer({
            id: 'route-layer',
            type: 'line',
            source: routeSourceId,
            layout: {
              'line-join': 'round',
              'line-cap': 'round'
            },
            paint: {
              'line-color': '#94a3b8',
              'line-width': 3,
              'line-opacity': 0.6,
              'line-dasharray': [2, 2]
            }
          });
        }
      } catch (error) {
        console.error('❌ Routing error:', error);
        
        // Fallback to straight line
        const coordinates = stops.map((s: Stop) => [s.lng, s.lat]);
        const geojson: GeoJSON.Feature<GeoJSON.LineString> = {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates
          }
        };

        if (map.current!.getSource(routeSourceId)) {
          map.current!.removeLayer('route-layer');
          map.current!.removeSource(routeSourceId);
        }

        map.current!.addSource(routeSourceId, {
          type: 'geojson',
          data: geojson
        });

        map.current!.addLayer({
          id: 'route-layer',
          type: 'line',
          source: routeSourceId,
          paint: {
            'line-color': '#94a3b8',
            'line-width': 3,
            'line-opacity': 0.6,
            'line-dasharray': [2, 2]
          }
        });
      }
    };

    // Wait for map to load
    if (map.current && map.current.loaded() && map.current.isStyleLoaded()) {
      console.log('🚀 Map ready, drawing route immediately');
      drawRoute();
    } else if (map.current) {
      console.log('⏳ Waiting for map to load...');
      const onLoad = () => {
        console.log('✅ Map loaded event fired');
        if (isMounted) {
          drawRoute();
        }
      };
      map.current.once('load', onLoad);
      
      // Cleanup event listener
      return () => {
        isMounted = false;
        console.log('🧹 Cleaning up route effect');
      };
    }

    return () => {
      isMounted = false;
    };
  }, [stopsKey, showRoute, useRealRouting, routingProvider]); // Use stopsKey instead of stops!

  // Add bus marker
  useEffect(() => {
    if (!map.current || !showBus || !busLocation) return;

    const el = document.createElement('div');
    el.className = styles.busMarker;
    el.innerHTML = '🚌';
    el.style.fontSize = '24px';
    el.style.cursor = 'pointer';

    const busMarker = new mapboxgl.Marker(el)
      .setLngLat([busLocation.lng, busLocation.lat])
      .setPopup(
        new mapboxgl.Popup({ offset: 25 })
          .setHTML(`
            <div style="padding: 8px;">
              <strong>🚌 Xe buýt</strong>
              ${busLocation.speed ? `<div style="font-size: 12px; color: #666; margin-top: 4px;">Tốc độ: ${busLocation.speed} km/h</div>` : ''}
            </div>
          `)
      )
      .addTo(map.current);

    return () => {
      busMarker.remove();
    };
  }, [busLocation, showBus]);

  return (
    <div className={styles['map-container']}>
      {/* Map container */}
      <div 
        ref={mapContainer} 
        className={styles['map-wrapper']}
        style={{ height }}
      />
      
      {/* Loading overlay */}
      {!isMapLoaded && !mapError && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          zIndex: 1000,
          borderRadius: '8px'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: '40px',
              height: '40px',
              border: '4px solid #e5e7eb',
              borderTop: '4px solid #3b82f6',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 12px'
            }}></div>
            <div style={{ color: '#6b7280', fontSize: '14px' }}>Đang tải bản đồ...</div>
          </div>
        </div>
      )}
      
      {/* Error message */}
      {mapError && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          zIndex: 1000,
          borderRadius: '8px',
          padding: '20px'
        }}>
          <div style={{
            textAlign: 'center',
            maxWidth: '400px',
            padding: '20px',
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '8px'
          }}>
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>⚠️</div>
            <div style={{ color: '#991b1b', fontSize: '16px', fontWeight: '600', marginBottom: '8px' }}>
              Lỗi tải bản đồ
            </div>
            <div style={{ color: '#7f1d1d', fontSize: '14px' }}>
              {mapError}
            </div>
          </div>
        </div>
      )}
      
      {/* Legend */}
      <div className={styles['map-legend']}>
        <div className={styles['map-legend-items']}>
          <div className={styles['map-legend-item']}>
            <div className={styles['map-legend-icon']} style={{ backgroundColor: '#22c55e' }}></div>
            <span className={styles['map-legend-label']}>Điểm đón</span>
          </div>
          <div className={styles['map-legend-item']}>
            <div className={styles['map-legend-icon']} style={{ backgroundColor: '#ef4444' }}></div>
            <span className={styles['map-legend-label']}>Điểm trả</span>
          </div>
          <div className={styles['map-legend-item']}>
            <div className={styles['map-legend-icon']} style={{ backgroundColor: '#3b82f6' }}></div>
            <span className={styles['map-legend-label']}>Điểm dừng</span>
          </div>
          {showBus && (
            <div className={styles['map-legend-item']}>
              <span style={{ fontSize: '18px' }}>🚌</span>
              <span className={styles['map-legend-label']}>Xe buýt</span>
            </div>
          )}
        </div>
        {useRealRouting && (
          <div className={styles['map-legend-footer']}>
            <div className={styles['map-legend-footer-text']}>
              Đường đi thực tế (GraphHopper)
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
