// src/components/MultiTripMapView.tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import styles from './MapView.module.css';

mapboxgl.accessToken = 'pk.eyJ1IjoidGhhbmhoYW5kc29tZTA1MTIiLCJhIjoiY21oYzE1ajJlMTB4aDJpcHp4bGJqY2praiJ9.uxt5rLnd30BuQxh_9kEaqQ';

interface Student {
  _id: string;
  name: string;
  avatar?: string;
  status: 'waiting' | 'on-bus' | 'arrived';
}

interface Stop {
  stopId: string;
  name: string;
  order: number;
  location: {
    coordinates: [number, number];
  };
  estimatedTime?: string;
}

interface BusPosition {
  tripId: string;
  bus: {
    plateNumber: string;
    capacity: number;
  };
  route: {
    name: string;
  };
  position: {
    latitude: number;
    longitude: number;
    heading: number;
  };
  progress: number;
  nextStop?: {
    name: string;
    distance: number;
  };
  stops?: Stop[];
  students?: Student[];
}

interface MultiTripMapViewProps {
  trips: BusPosition[];
  selectedTripId?: string | null;
  onTripSelect?: (tripId: string) => void;
  height?: string;
  showRoutes?: boolean;
  userRole?: 'driver' | 'parent';
}

const MultiTripMapView: React.FC<MultiTripMapViewProps> = ({
  trips,
  selectedTripId,
  onTripSelect,
  height = '600px',
  showRoutes = true,
  userRole = 'parent',
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<Map<string, mapboxgl.Marker>>(new Map());
  const [mapError, setMapError] = useState<string | null>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);

  const busColors = [
    '#4299e1',
    '#48bb78',
    '#ed8936',
    '#9f7aea',
    '#f56565',
    '#38b2ac',
  ];

  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;

    try {
      const map = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: [106.660172, 10.762622],
        zoom: 12,
      });

      map.on('load', () => {
        console.log('✅ Mapbox loaded successfully');
        setIsMapLoaded(true);
      });

      map.on('error', (e) => {
        console.error('❌ Map error:', e.error);
        setMapError(`Lỗi tải bản đồ: ${e.error?.message || 'Unknown error'}`);
      });

      map.addControl(new mapboxgl.NavigationControl(), 'top-right');
      mapRef.current = map;

      return () => {
        if (mapRef.current) {
          mapRef.current.remove();
          mapRef.current = null;
        }
      };
    } catch (error: any) {
      console.error('❌ Init error:', error);
      setMapError(`Không thể khởi tạo bản đồ: ${error.message}`);
    }
  }, []);

  // Fetch and draw route using Mapbox Directions API
  const drawRouteForTrip = async (map: mapboxgl.Map, trip: BusPosition, color: string, index: number) => {
    console.log(`🗺️  Drawing route for trip ${index}:`, {
      tripId: trip.tripId,
      stops: trip.stops?.length,
      plateNumber: trip.bus?.plateNumber
    });

    if (!trip.stops || trip.stops.length < 2) {
      console.warn(`⚠️  Trip ${index} has insufficient stops:`, trip.stops?.length);
      return;
    }

    const coordinates = trip.stops
      .sort((a, b) => a.order - b.order)
      .map(stop => {
        console.log(`  📍 Stop ${stop.order}: ${stop.name}`, stop.location?.coordinates);
        if (!stop.location || !stop.location.coordinates) {
          console.error(`  ❌ Stop ${stop.name} has no coordinates!`);
          return null;
        }
        return stop.location.coordinates;
      })
      .filter(coord => coord !== null); // Remove nulls

    if (coordinates.length < 2) {
      console.error(`  ❌ Not enough valid coordinates:`, coordinates.length);
      return;
    }

    // Build Mapbox Directions API URL
    const coordinatesString = coordinates.map(coord => `${coord[0]},${coord[1]}`).join(';');
    const directionsUrl = `https://api.mapbox.com/directions/v5/mapbox/driving/${coordinatesString}?geometries=geojson&access_token=${mapboxgl.accessToken}`;

    console.log(`  🌐 Calling Mapbox Directions API...`);
    console.log(`  📍 Coordinates:`, coordinatesString);

    try {
      const response = await fetch(directionsUrl);
      const data = await response.json();

      console.log(`  ✅ Mapbox API response:`, {
        code: data.code,
        routesCount: data.routes?.length,
        waypoints: data.waypoints?.length
      });

      if (data.code !== 'Ok') {
        console.error(`  ❌ Mapbox API error:`, data.message || data.code);
        return;
      }

      if (data.routes && data.routes.length > 0) {
        const route = data.routes[0].geometry;

        const routeId = `route-${index}`;
        const stopsId = `stops-${index}`;
        const stopsLabelsId = `${stopsId}-labels`;

        // Remove old layers FIRST (before sources) - order matters!
        if (map.getLayer(stopsLabelsId)) map.removeLayer(stopsLabelsId);
        if (map.getLayer(stopsId)) map.removeLayer(stopsId);
        if (map.getLayer(routeId)) map.removeLayer(routeId);
        
        // Then remove sources
        if (map.getSource(stopsId)) map.removeSource(stopsId);
        if (map.getSource(routeId)) map.removeSource(routeId);

        // Add route line
        map.addSource(routeId, {
          type: 'geojson',
          data: {
            type: 'Feature',
            properties: {},
            geometry: route,
          },
        });

        map.addLayer({
          id: routeId,
          type: 'line',
          source: routeId,
          layout: {
            'line-join': 'round',
            'line-cap': 'round',
          },
          paint: {
            'line-color': color,
            'line-width': 5,
            'line-opacity': 0.8,
          },
        });

        // Add stop markers
        const stopsFeatures = trip.stops.map(stop => ({
          type: 'Feature' as const,
          properties: {
            name: stop.name,
            order: stop.order,
            time: stop.estimatedTime || '',
          },
          geometry: {
            type: 'Point' as const,
            coordinates: stop.location.coordinates,
          },
        }));

        map.addSource(stopsId, {
          type: 'geojson',
          data: {
            type: 'FeatureCollection',
            features: stopsFeatures,
          },
        });

        map.addLayer({
          id: stopsId,
          type: 'circle',
          source: stopsId,
          paint: {
            'circle-radius': 8,
            'circle-color': color,
            'circle-stroke-width': 3,
            'circle-stroke-color': '#ffffff',
          },
        });

        // Add stop labels
        map.addLayer({
          id: `${stopsId}-labels`,
          type: 'symbol',
          source: stopsId,
          layout: {
            'text-field': ['get', 'order'],
            'text-size': 12,
            'text-offset': [0, 0],
          },
          paint: {
            'text-color': '#ffffff',
          },
        });

        console.log(`  ✅ Route drawn successfully for trip ${index}`);
      } else {
        console.warn(`  ⚠️  No routes returned from Mapbox for trip ${index}`);
      }
    } catch (error: any) {
      console.error(`  ❌ Error fetching route for trip ${index}:`, error.message);
    }
  };

  // VẼ ROUTES 1 LẦN duy nhất khi map load xong
  const routesDrawnRef = useRef(false);
  
  useEffect(() => {
    if (!mapRef.current || !isMapLoaded || trips.length === 0) return;
    if (routesDrawnRef.current) return; // Đã vẽ rồi, không vẽ lại

    const map = mapRef.current;

    // Chỉ vẽ routes cho driver mode
    if (userRole === 'driver' && showRoutes) {
      console.log('🎨 VẼ ROUTES 1 LẦN cho', trips.length, 'trips');
      trips.forEach((trip, index) => {
        const color = busColors[index % busColors.length];
        drawRouteForTrip(map, trip, color, index);
      });
      routesDrawnRef.current = true;
    }
  }, [isMapLoaded, trips.length, userRole, showRoutes, busColors]);

  // CHỈ CÂP NHẬT VỊ TRÍ XE - không vẽ lại route
  useEffect(() => {
    if (!mapRef.current || !isMapLoaded || trips.length === 0) return;

    const map = mapRef.current;

    console.log('🚌 Updating bus positions only...', trips.length, 'buses');

    // Update or create bus markers
    const currentTripIds = new Set(trips.map(t => t.tripId));
    
    // Remove markers for trips that no longer exist
    markersRef.current.forEach((marker, tripId) => {
      if (!currentTripIds.has(tripId)) {
        marker.remove();
        markersRef.current.delete(tripId);
      }
    });

    // Update or create markers for current trips
    trips.forEach((trip, index) => {
      const color = busColors[index % busColors.length];
      const isSelected = selectedTripId === trip.tripId;
      const existingMarker = markersRef.current.get(trip.tripId);

      if (existingMarker) {
        // SMOOTH UPDATE: Just update position, không tạo mới
        const newLngLat: [number, number] = [trip.position.longitude, trip.position.latitude];
        existingMarker.setLngLat(newLngLat);
        
        // Update popup content
        const popup = existingMarker.getPopup();
        if (popup) {
          popup.setHTML(`
            <div style="padding: 12px;">
              <h3 style="margin: 0 0 8px 0; color: ${color};">🚌 ${trip.bus.plateNumber}</h3>
              <p style="margin: 4px 0; font-size: 13px;">${trip.route.name}</p>
              <div style="margin-top: 8px; padding: 8px; background: #f7fafc; border-radius: 6px;">
                <p style="margin: 0; font-size: 12px;">Tiến độ: ${(trip.progress || 0).toFixed(0)}%</p>
                ${trip.nextStop ? `<p style="margin: 4px 0 0 0; font-size: 12px;">Trạm tiếp theo: ${trip.nextStop.name}</p>` : ''}
              </div>
            </div>
          `);
        }
      } else {
        // Create NEW marker (first time only)
        const el = document.createElement('div');
        el.innerHTML = `
          <div class="bus-marker" style="
            background: ${color};
            width: ${isSelected ? '48px' : '40px'};
            height: ${isSelected ? '48px' : '40px'};
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: ${isSelected ? '20px' : '16px'};
            cursor: pointer;
            box-shadow: 0 4px 8px rgba(0,0,0,0.3);
            border: 3px solid white;
            transition: all 0.3s ease-out;
          ">🚌</div>
        `;

        el.addEventListener('click', () => {
          if (onTripSelect) onTripSelect(trip.tripId);
        });

        const popup = new mapboxgl.Popup({ offset: 25, maxWidth: '300px' })
          .setHTML(`
            <div style="padding: 12px;">
              <h3 style="margin: 0 0 8px 0; color: ${color};">🚌 ${trip.bus.plateNumber}</h3>
              <p style="margin: 4px 0; font-size: 13px;">${trip.route.name}</p>
              <div style="margin-top: 8px; padding: 8px; background: #f7fafc; border-radius: 6px;">
                <p style="margin: 0; font-size: 12px;">Tiến độ: ${(trip.progress || 0).toFixed(0)}%</p>
                ${trip.nextStop ? `<p style="margin: 4px 0 0 0; font-size: 12px;">Trạm tiếp theo: ${trip.nextStop.name}</p>` : ''}
              </div>
            </div>
          `);

        const marker = new mapboxgl.Marker({ element: el })
          .setLngLat([trip.position.longitude, trip.position.latitude])
          .setPopup(popup)
          .addTo(map);

        markersRef.current.set(trip.tripId, marker);
      }
    });

    // FIT BOUNDS chỉ 1 LẦN khi lần đầu có data
    if (!routesDrawnRef.current && trips.length > 0) {
      const bounds = new mapboxgl.LngLatBounds();
      trips.forEach((trip) => {
        bounds.extend([trip.position.longitude, trip.position.latitude]);
      });
      map.fitBounds(bounds, {
        padding: { top: 50, bottom: 50, left: 50, right: 50 },
        maxZoom: 14,
      });
    }
  }, [trips, isMapLoaded, selectedTripId, onTripSelect, busColors]);

  if (mapError) {
    return <div className={styles.error}>⚠️ {mapError}</div>;
  }

  return (
    <div className={styles.mapWrapper} style={{ height }}>
      <div ref={mapContainer} className={styles.mapContainer} />
      {!isMapLoaded && (
        <div className={styles.loading}>
          <div className={styles.spinner} />
          <p>Đang tải bản đồ...</p>
        </div>
      )}
      {isMapLoaded && trips.length === 0 && (
        <div className={styles.noData}>
          <p>Không có chuyến xe</p>
        </div>
      )}
    </div>
  );
};

export default MultiTripMapView;
