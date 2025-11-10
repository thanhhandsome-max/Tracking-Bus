'use client';

import React, { useEffect, useRef, useMemo, useCallback } from 'react';
import { loadGoogleMaps, getGoogle } from '@/lib/maps/googleLoader';

export interface StopDTO {
  maDiem: number;
  tenDiem: string;
  viDo: number;
  kinhDo: number;
  address?: string | null;
  sequence: number;
  dwell_seconds?: number;
}

export interface BusMarker {
  id: string;
  lat: number;
  lng: number;
  label?: string;
  status?: 'running' | 'idle' | 'late';
}

interface SSBMapProps {
  center?: { lat: number; lng: number };
  zoom?: number;
  polyline?: string | null; // Encoded polyline string from backend
  stops?: StopDTO[];
  buses?: BusMarker[];
  height?: string;
  onStopClick?: (stop: StopDTO) => void;
  onBusClick?: (bus: BusMarker) => void;
  className?: string;
  autoFitOnUpdate?: boolean; // Auto fit bounds when markers update
  followFirstMarker?: boolean; // Pan to first marker when it moves
}

function SSBMap({
  center = { lat: 10.77653, lng: 106.700981 },
  zoom = 13,
  polyline,
  stops = [],
  buses = [],
  height = '400px',
  onStopClick,
  onBusClick,
  className = '',
  autoFitOnUpdate = false,
  followFirstMarker = false,
}: SSBMapProps) {
  // Validate and normalize center coordinates
  const validCenter = useMemo(() => {
    const lat = Number(center?.lat);
    const lng = Number(center?.lng);
    
    // Check if coordinates are valid numbers
    if (isNaN(lat) || isNaN(lng) || !isFinite(lat) || !isFinite(lng)) {
      console.warn('[SSBMap] Invalid center coordinates, using default:', center);
      return { lat: 10.77653, lng: 106.700981 };
    }
    
    // Check if coordinates are within valid range
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      console.warn('[SSBMap] Center coordinates out of range, using default:', center);
      return { lat: 10.77653, lng: 106.700981 };
    }
    
    return { lat, lng };
  }, [center?.lat, center?.lng]);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const polylineInstanceRef = useRef<google.maps.Polyline | null>(null);
  const markersRef = useRef<Map<string, google.maps.Marker>>(new Map());
  const userMarkerRef = useRef<google.maps.Marker | null>(null);
  const accuracyCircleRef = useRef<google.maps.Circle | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Decode polyline using Google Maps Geometry library
  const decodePolyline = useCallback((encoded: string): google.maps.LatLng[] => {
    if (!encoded) return [];
    try {
      const g = getGoogle();
      return g.maps.geometry.encoding.decodePath(encoded);
    } catch (err) {
      console.error('Failed to decode polyline:', err);
      return [];
    }
  }, []);

  // Memoized polyline path
  const polylinePath = useMemo(() => {
    if (!polyline) return null;
    return decodePolyline(polyline);
  }, [polyline, decodePolyline]);

  // Initialize map
  useEffect(() => {
    let mounted = true;

    let attempts = 0;
    const maxAttempts = 180; // ~3s with rAF

    const init = () => {
      // Debug breadcrumbs to verify rendering lifecycle
      // eslint-disable-next-line no-console
      console.log('[SSBMap] init called. hasRef=', !!mapRef.current);
      if (!mounted) return;
      if (!mapRef.current) {
        // Wait until the DOM node is attached, then retry next frame
        attempts += 1;
        if (attempts > maxAttempts) {
          console.error('[SSBMap] Map container ref not attached after retries. Aborting.');
          setError('Không khởi tạo được vùng hiển thị bản đồ.');
          setIsLoading(false);
          return;
        }
        requestAnimationFrame(init);
        return;
      }

      // eslint-disable-next-line no-console
      console.log('[SSBMap] loading Google Maps... key prefix=', (process.env.NEXT_PUBLIC_GMAPS_API_KEY || '').slice(0, 4));
      loadGoogleMaps()
        .then(async () => {
          if (!mounted || !mapRef.current) return;

          const g = getGoogle();
          // eslint-disable-next-line no-console
          console.log('[SSBMap] Google Maps loaded, creating map instance');

          // Ensure core 'maps' library is initialized (required on newer versions)
          try {
            if (typeof (g.maps as any).importLibrary === 'function') {
              // eslint-disable-next-line no-console
              console.log('[SSBMap] importing maps library...');
              await (g.maps as any).importLibrary('maps');
            }
          } catch (e) {
            console.warn('[SSBMap] importLibrary(maps) failed or unavailable:', e);
          }

          // Warn if container has zero size (map may not render visibly)
          try {
            const el = mapRef.current as HTMLDivElement;
            const rect = el.getBoundingClientRect();
            if (rect.width === 0 || rect.height === 0) {
              console.warn('[SSBMap] Map container has zero size. width=', rect.width, 'height=', rect.height);
            }
          } catch {}

          const gm = (window as any).google?.maps;
          // eslint-disable-next-line no-console
          console.log('[SSBMap] typeof maps.Map =', typeof gm?.Map, 'version=', gm?.version);
          if (!gm || typeof gm.Map !== 'function') {
            throw new Error('Google Maps API loaded but Map constructor is unavailable.');
          }

          const map = new gm.Map(mapRef.current, {
            center: validCenter,
            zoom,
            mapTypeControl: true,
            streetViewControl: false,
            fullscreenControl: true,
          });

          mapInstanceRef.current = map;

          // Add "Locate me" control (current location)
          try {
            const controlDiv = document.createElement('div');
            controlDiv.style.margin = '8px';
            controlDiv.style.display = 'flex';
            controlDiv.style.flexDirection = 'column';
            controlDiv.style.alignItems = 'center';

            const btn = document.createElement('button');
            btn.type = 'button';
            btn.title = 'Vị trí của tôi';
            btn.style.background = '#fff';
            btn.style.border = '1px solid #e5e7eb';
            btn.style.borderRadius = '9999px';
            btn.style.width = '40px';
            btn.style.height = '40px';
            btn.style.boxShadow = '0 1px 2px rgba(0,0,0,0.1)';
            btn.style.cursor = 'pointer';
            btn.style.display = 'flex';
            btn.style.alignItems = 'center';
            btn.style.justifyContent = 'center';
            btn.style.padding = '0';

            // SVG target icon
            btn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#111827" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M12 2v2"></path><path d="M12 20v2"></path><path d="M2 12h2"></path><path d="M20 12h2"></path><path d="m19 19-1.5-1.5"></path><path d="M6.5 6.5 5 5"></path><path d="m19 5-1.5 1.5"></path><path d="M6.5 17.5 5 19"></path></svg>';

            const loadingSpan = document.createElement('span');
            loadingSpan.style.fontSize = '10px';
            loadingSpan.style.color = '#6b7280';
            loadingSpan.style.marginTop = '4px';
            loadingSpan.style.display = 'none';
            loadingSpan.textContent = 'Đang định vị...';

            controlDiv.appendChild(btn);
            controlDiv.appendChild(loadingSpan);

            map.controls[g.maps.ControlPosition.RIGHT_BOTTOM].push(controlDiv);

            const locate = () => {
              if (!navigator.geolocation) {
                console.warn('Geolocation is not supported by this browser.');
                setError('Trình duyệt không hỗ trợ định vị.');
                return;
              }
              loadingSpan.style.display = 'block';
              btn.style.opacity = '0.7';

              navigator.geolocation.getCurrentPosition(
                (pos) => {
                  const { latitude, longitude, accuracy } = pos.coords;
                  // eslint-disable-next-line no-console
                  console.log('[SSBMap] Current position:', { latitude, longitude, accuracy });

                  const position = new g.maps.LatLng(latitude, longitude);

                  // Update or create user marker
                  if (!userMarkerRef.current) {
                    userMarkerRef.current = new g.maps.Marker({
                      position,
                      map,
                      title: 'Vị trí của tôi',
                      icon: {
                        path: g.maps.SymbolPath.CIRCLE,
                        scale: 8,
                        fillColor: '#2563EB',
                        fillOpacity: 1,
                        strokeColor: '#ffffff',
                        strokeWeight: 2,
                      },
                    });
                  } else {
                    userMarkerRef.current.setPosition(position);
                    userMarkerRef.current.setMap(map);
                  }

                  // Update or create accuracy circle
                  if (!accuracyCircleRef.current) {
                    accuracyCircleRef.current = new g.maps.Circle({
                      strokeColor: '#3B82F6',
                      strokeOpacity: 0.6,
                      strokeWeight: 1,
                      fillColor: '#93C5FD',
                      fillOpacity: 0.25,
                      map,
                      center: position,
                      radius: Math.max(accuracy || 0, 15),
                    });
                  } else {
                    accuracyCircleRef.current.setCenter(position);
                    accuracyCircleRef.current.setRadius(Math.max(accuracy || 0, 15));
                    accuracyCircleRef.current.setMap(map);
                  }

                  map.panTo(position);
                  if (map.getZoom()! < 15) {
                    map.setZoom(15);
                  }

                  loadingSpan.style.display = 'none';
                  btn.style.opacity = '1';
                },
                (err) => {
                  console.warn('Geolocation error:', err);
                  setError('Không thể lấy vị trí hiện tại. Vui lòng kiểm tra quyền truy cập định vị.');
                  loadingSpan.style.display = 'none';
                  btn.style.opacity = '1';
                },
                { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 }
              );
            };

            btn.addEventListener('click', locate);
          } catch {}

          setIsLoading(false);
        })
        .catch((err) => {
          console.error('Failed to load Google Maps:', err);
          setError(err.message || 'Failed to load Google Maps');
          setIsLoading(false);
        });
    };

    // eslint-disable-next-line no-console
    console.log('[SSBMap] effect mounted');
    init();

    return () => {
      mounted = false;
    };
  }, []);

  // Update map center/zoom
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    mapInstanceRef.current.setCenter(validCenter);
    mapInstanceRef.current.setZoom(zoom);
  }, [validCenter.lat, validCenter.lng, zoom]);

  // Draw polyline
  useEffect(() => {
    if (!mapInstanceRef.current || !polylinePath || polylinePath.length === 0) {
      // Remove existing polyline
      if (polylineInstanceRef.current) {
        polylineInstanceRef.current.setMap(null);
        polylineInstanceRef.current = null;
      }
      return;
    }

    const g = getGoogle();

    // Remove old polyline
    if (polylineInstanceRef.current) {
      polylineInstanceRef.current.setMap(null);
    }

    // Create new polyline
    const polyline = new g.maps.Polyline({
      path: polylinePath,
      geodesic: true,
      strokeColor: '#3B82F6',
      strokeOpacity: 1.0,
      strokeWeight: 4,
    });

    polyline.setMap(mapInstanceRef.current);
    polylineInstanceRef.current = polyline;

    // Fit bounds to polyline
    if (polylinePath.length > 0) {
      const bounds = new g.maps.LatLngBounds();
      polylinePath.forEach((latlng) => bounds.extend(latlng));
      mapInstanceRef.current.fitBounds(bounds, 50);
    }
  }, [polylinePath]);

  // Render stop markers
  useEffect(() => {
    if (!mapInstanceRef.current || stops.length === 0) {
      // Remove stop markers
      markersRef.current.forEach((marker, key) => {
        if (key.startsWith('stop-')) {
          marker.setMap(null);
          markersRef.current.delete(key);
        }
      });
      return;
    }

    const g = getGoogle();

    // Sort stops by sequence
    const sortedStops = [...stops].sort((a, b) => (a.sequence || 0) - (b.sequence || 0));

    sortedStops.forEach((stop) => {
      const lat = Number(stop.viDo);
      const lng = Number(stop.kinhDo);
      
      if (!stop.viDo || !stop.kinhDo || isNaN(lat) || isNaN(lng) || !isFinite(lat) || !isFinite(lng)) {
        console.warn('[SSBMap] Invalid stop coordinates, skipping:', stop);
        return;
      }

      const key = `stop-${stop.maDiem}`;
      let marker = markersRef.current.get(key);

      if (!marker) {
        // Create new marker
        marker = new g.maps.Marker({
          position: { lat, lng },
          map: mapInstanceRef.current,
          icon: {
            path: g.maps.SymbolPath.CIRCLE,
            scale: 8,
            fillColor: '#EF4444',
            fillOpacity: 1,
            strokeColor: '#FFFFFF',
            strokeWeight: 2,
          },
          label: {
            text: String(stop.sequence || ''),
            color: '#FFFFFF',
            fontSize: '12px',
            fontWeight: 'bold',
          },
          title: `${stop.sequence}. ${stop.tenDiem}`,
        });

        if (onStopClick) {
          marker.addListener('click', () => onStopClick(stop));
        }

        // Info window
        const infoWindow = new g.maps.InfoWindow({
          content: `
            <div style="padding: 8px; min-width: 200px;">
              <h3 style="margin: 0 0 4px 0; font-size: 14px; font-weight: bold;">${stop.sequence}. ${stop.tenDiem}</h3>
              ${stop.address ? `<p style="margin: 0; font-size: 12px; color: #666;">${stop.address}</p>` : ''}
              ${stop.dwell_seconds ? `<p style="margin: 4px 0 0 0; font-size: 12px; color: #666;">Dừng: ${stop.dwell_seconds}s</p>` : ''}
            </div>
          `,
        });

        marker.addListener('click', () => {
          infoWindow.open(mapInstanceRef.current!, marker);
        });

        markersRef.current.set(key, marker);
      } else {
        // Update existing marker position
        const lat = Number(stop.viDo);
        const lng = Number(stop.kinhDo);
        if (!isNaN(lat) && !isNaN(lng) && isFinite(lat) && isFinite(lng)) {
          marker.setPosition({ lat, lng });
        }
        marker.setTitle(`${stop.sequence}. ${stop.tenDiem}`);
      }
    });

    // Remove markers that are no longer in stops
    markersRef.current.forEach((marker, key) => {
      if (key.startsWith('stop-')) {
        const stopId = parseInt(key.replace('stop-', ''));
        if (!stops.find((s) => s.maDiem === stopId)) {
          marker.setMap(null);
          markersRef.current.delete(key);
        }
      }
    });
  }, [stops, onStopClick]);

  // Render bus markers
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    const g = getGoogle();

    buses.forEach((bus) => {
      const lat = Number(bus.lat);
      const lng = Number(bus.lng);
      
      if (isNaN(lat) || isNaN(lng) || !isFinite(lat) || !isFinite(lng)) {
        console.warn('[SSBMap] Invalid bus coordinates, skipping:', bus);
        return;
      }

      const key = `bus-${bus.id}`;
      let marker = markersRef.current.get(key);

      if (!marker) {
        // Create new bus marker
        const statusColors: Record<string, string> = {
          running: '#10B981',
          idle: '#6B7280',
          late: '#F59E0B',
        };

        marker = new g.maps.Marker({
          position: { lat, lng },
          map: mapInstanceRef.current,
          icon: {
            path: g.maps.SymbolPath.FORWARD_CLOSED_ARROW,
            scale: 6,
            fillColor: statusColors[bus.status || 'idle'] || '#6B7280',
            fillOpacity: 1,
            strokeColor: '#FFFFFF',
            strokeWeight: 2,
            rotation: 0,
          },
          title: bus.label || bus.id,
        });

        if (onBusClick) {
          marker.addListener('click', () => onBusClick(bus));
        }

        markersRef.current.set(key, marker);
      } else {
        // Update existing marker position
        const lat = Number(bus.lat);
        const lng = Number(bus.lng);
        if (!isNaN(lat) && !isNaN(lng) && isFinite(lat) && isFinite(lng)) {
          marker.setPosition({ lat, lng });
        }
      }
    });

    // Remove bus markers that are no longer in buses
    markersRef.current.forEach((marker, key) => {
      if (key.startsWith('bus-')) {
        const busId = key.replace('bus-', '');
        if (!buses.find((b) => b.id === busId)) {
          marker.setMap(null);
          markersRef.current.delete(key);
        }
      }
    });

    // Auto fit bounds or follow first marker
    if (mapInstanceRef.current) {
      const g = getGoogle();
      const allPoints: google.maps.LatLng[] = [];
      
      buses.forEach((bus) => {
        const lat = Number(bus.lat);
        const lng = Number(bus.lng);
        if (!isNaN(lat) && !isNaN(lng) && isFinite(lat) && isFinite(lng)) {
          allPoints.push(new g.maps.LatLng(lat, lng));
        }
      });
      stops.forEach((stop) => {
        const lat = Number(stop.viDo);
        const lng = Number(stop.kinhDo);
        if (!isNaN(lat) && !isNaN(lng) && isFinite(lat) && isFinite(lng)) {
          allPoints.push(new g.maps.LatLng(lat, lng));
        }
      });

      if (allPoints.length > 0) {
        if (autoFitOnUpdate && allPoints.length > 1) {
          const bounds = new g.maps.LatLngBounds();
          allPoints.forEach((p) => bounds.extend(p));
          mapInstanceRef.current.fitBounds(bounds, 50);
        } else if (followFirstMarker && buses.length > 0) {
          const firstBusLat = Number(buses[0].lat);
          const firstBusLng = Number(buses[0].lng);
          if (!isNaN(firstBusLat) && !isNaN(firstBusLng) && isFinite(firstBusLat) && isFinite(firstBusLng)) {
            mapInstanceRef.current.panTo({ lat: firstBusLat, lng: firstBusLng });
          }
        }
      }
    }
  }, [buses, onBusClick, autoFitOnUpdate, followFirstMarker]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (polylineInstanceRef.current) {
        polylineInstanceRef.current.setMap(null);
      }
      if (userMarkerRef.current) {
        userMarkerRef.current.setMap(null);
      }
      if (accuracyCircleRef.current) {
        accuracyCircleRef.current.setMap(null);
      }
      markersRef.current.forEach((marker) => {
        marker.setMap(null);
      });
      markersRef.current.clear();
    };
  }, []);

  return (
    <div className={`relative rounded-md overflow-hidden ${className}`} style={{ height, width: '100%' }}>
      <div ref={mapRef} style={{ height: '100%', width: '100%' }} />
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted/60">
          <p className="text-muted-foreground">Đang tải bản đồ...</p>
        </div>
      )}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted/60">
          <p className="text-destructive">{error}</p>
        </div>
      )}
    </div>
  );
}

/**
 * Memoize SSBMap to avoid unnecessary re-renders
 * Only re-render if polyline, stops array length, or buses array length changes
 * 
 * Why memoize?
 * - Map component is expensive (Google Maps API initialization, markers, polylines)
 * - Parent components often re-render frequently (e.g. trip updates, notifications)
 * - Without memo, map would re-render on every parent update even if props didn't change
 * 
 * Comparison strategy:
 * - polyline: shallow equality (string)
 * - stops: check array length (markers are managed internally via refs)
 * - buses: check array length + first item position (for smooth animation)
 * - other props: shallow equality
 */
export default React.memo(SSBMap, (prevProps, nextProps) => {
  // Check polyline
  if (prevProps.polyline !== nextProps.polyline) {
    return false; // Props changed, re-render
  }

  // Check stops array length
  if (prevProps.stops?.length !== nextProps.stops?.length) {
    return false;
  }

  // Check buses array length
  if (prevProps.buses?.length !== nextProps.buses?.length) {
    return false;
  }

  // Check first bus position (for animation)
  const prevFirstBus = prevProps.buses?.[0];
  const nextFirstBus = nextProps.buses?.[0];
  if (prevFirstBus && nextFirstBus) {
    if (prevFirstBus.lat !== nextFirstBus.lat || prevFirstBus.lng !== nextFirstBus.lng) {
      return false;
    }
  }

  // Check other critical props
  if (prevProps.center?.lat !== nextProps.center?.lat || prevProps.center?.lng !== nextProps.center?.lng) {
    return false;
  }
  if (prevProps.zoom !== nextProps.zoom) {
    return false;
  }
  if (prevProps.height !== nextProps.height) {
    return false;
  }

  // All checked props are equal, skip re-render
  return true;
});
