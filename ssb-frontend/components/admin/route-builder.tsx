'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { 
  Plus, 
  Trash2, 
  MapPin, 
  Clock, 
  Save, 
  X, 
  GripVertical,
  Navigation,
  Route as RouteIcon,
  Search,
  Route,
  Timer,
  CheckCircle2,
  XCircle,
  Zap,
  Sparkles,
  Users
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import apiClient from '@/lib/api-client';
import { loadGoogleMaps } from '@/lib/maps/googleLoader';
import PlacePicker from '@/lib/maps/PlacePicker';
import { useQueryClient } from '@tanstack/react-query';
import { routeKeys } from '@/lib/hooks/useRoutes';

interface Stop {
  id: string;
  name: string;
  address: string;
  lat?: number;
  lng?: number;
  estimatedTime: string;
  sequence: number;
}

interface RouteBuilderProps {
  mode?: 'create' | 'edit';
  initialRoute?: {
    id?: string | number;
    name?: string;
    diemBatDau?: string;
    diemKetThuc?: string;
    stops?: any[];
  };
  onClose: () => void;
  onSaved?: (route?: any) => void;
}

export function RouteBuilder({ 
  mode = 'create', 
  initialRoute,
  onClose,
  onSaved 
}: RouteBuilderProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<Map<string, google.maps.Marker>>(new Map());
  const polylineRef = useRef<google.maps.Polyline | null>(null);
  const polylinesRef = useRef<google.maps.Polyline[]>([]);
  const clickListenerRef = useRef<google.maps.MapsEventListener | null>(null);
  
  const [routeName, setRouteName] = useState(initialRoute?.name || '');
  // Điểm bắt đầu và điểm kết thúc cũng là các điểm dừng
  const [originStop, setOriginStop] = useState<Stop | null>(() => {
    if (initialRoute?.stops && initialRoute.stops.length > 0) {
      const firstStop = initialRoute.stops[0];
      if (firstStop && (firstStop.viDo || firstStop.latitude)) {
        return {
          id: 'origin',
          name: initialRoute.diemBatDau || firstStop.tenDiem || firstStop.name || 'Điểm bắt đầu',
          address: firstStop.diaChi || firstStop.address || '',
          lat: firstStop.viDo || firstStop.latitude,
          lng: firstStop.kinhDo || firstStop.longitude,
          estimatedTime: '',
          sequence: 1,
        };
      }
    }
    return null;
  });
  const [destinationStop, setDestinationStop] = useState<Stop | null>(() => {
    if (initialRoute?.stops && initialRoute.stops.length > 0) {
      const lastStop = initialRoute.stops[initialRoute.stops.length - 1];
      if (lastStop && (lastStop.viDo || lastStop.latitude)) {
        return {
          id: 'destination',
          name: initialRoute.diemKetThuc || lastStop.tenDiem || lastStop.name || 'Điểm kết thúc',
          address: lastStop.diaChi || lastStop.address || '',
          lat: lastStop.viDo || lastStop.latitude,
          lng: lastStop.kinhDo || lastStop.longitude,
          estimatedTime: '',
          sequence: 999, // Sẽ được cập nhật khi lưu
        };
      }
    }
    return null;
  });
  // Các điểm dừng trung gian (không bao gồm điểm bắt đầu và điểm kết thúc)
  const [stops, setStops] = useState<Stop[]>(() => {
    if (initialRoute?.stops && initialRoute.stops.length > 2) {
      // Bỏ qua điểm đầu và điểm cuối
      return initialRoute.stops.slice(1, -1).map((s: any, idx: number) => ({
        id: String(s.maDiem || s.id || idx + 2),
        name: s.tenDiem || s.name || '',
        address: s.diaChi || s.address || '',
        lat: s.viDo || s.latitude,
        lng: s.kinhDo || s.longitude,
        estimatedTime: s.thoiGianDung || s.estimatedTime || '',
        sequence: s.thuTu || s.sequence || idx + 2,
      }));
    }
    return [];
  });
  const [selectedStopId, setSelectedStopId] = useState<string | null>(null);
  const [isMapReady, setIsMapReady] = useState(false);
  const [polyline, setPolyline] = useState<string | null>(null);
  const [routeSegments, setRouteSegments] = useState<Array<{ polyline: string; from: number; to: number }>>([]);
  const [routeInfo, setRouteInfo] = useState<{ distance?: string; duration?: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mapMode, setMapMode] = useState<'view' | 'add'>('view');
  const [draggedMarkerId, setDraggedMarkerId] = useState<string | null>(null);
  const [pendingStop, setPendingStop] = useState<Stop | null>(null);
  const pendingMarkerRef = useRef<google.maps.Marker | null>(null);
  const [allSuggestions, setAllSuggestions] = useState<Array<{
    id: string;
    name: string;
    address: string;
    lat?: number;
    lng?: number;
    studentCount: number;
    students: Array<{ maHocSinh: number; hoTen: string; diaChi: string }>;
    suggestedSequence: number;
  }>>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Tính thời gian dừng dựa trên số học sinh (1 phút/3 học sinh, tối đa 5 phút)
  const calculateEstimatedTime = (studentCount: number): string => {
    const minutes = Math.min(Math.ceil(studentCount / 3), 5);
    return String(minutes);
  };

  // Lọc suggestions để chỉ hiển thị những điểm chưa được thêm vào stops
  const filteredSuggestions = allSuggestions.filter((suggestion) => {
    if (!suggestion.lat || !suggestion.lng) return true; // Giữ lại những điểm chưa có tọa độ
    
    // Kiểm tra xem điểm này đã có trong stops chưa (so sánh theo lat/lng với tolerance 0.0001)
    const tolerance = 0.0001;
    return !stops.some((stop) => {
      if (!stop.lat || !stop.lng) return false;
      const latDiff = Math.abs(stop.lat - suggestion.lat!);
      const lngDiff = Math.abs(stop.lng - suggestion.lng!);
      return latDiff < tolerance && lngDiff < tolerance;
    });
  });

  // Clear pending stop when map mode changes to view
  useEffect(() => {
    if (mapMode === 'view' && pendingStop) {
      setPendingStop(null);
      // Remove pending marker from map
      if (pendingMarkerRef.current) {
        pendingMarkerRef.current.setMap(null);
        pendingMarkerRef.current = null;
      }
    }
  }, [mapMode, pendingStop]);

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Initialize map
  useEffect(() => {
    let mounted = true;

    const initMap = async () => {
      try {
        // Wait for Google Maps to load
        const google = await loadGoogleMaps();
        if (!mounted || !mapRef.current) return;

        // Wait a bit more to ensure all constructors are available
        await new Promise((resolve) => setTimeout(resolve, 100));

        // Double check that Map constructor is available
        if (!window.google?.maps?.Map) {
          // Try waiting a bit more
          await new Promise((resolve) => setTimeout(resolve, 500));
          if (!window.google?.maps?.Map) {
            throw new Error('Google Maps Map constructor is not available. Please check your API key and network connection.');
          }
        }

        const googleMaps = window.google.maps;
        if (!googleMaps || !googleMaps.Map) {
          throw new Error('Google Maps Map constructor is not available');
        }

        const map = new googleMaps.Map(mapRef.current, {
          center: { lat: 10.77653, lng: 106.700981 },
          zoom: 13,
          mapTypeControl: true,
          streetViewControl: false,
          fullscreenControl: true,
        });

        mapInstanceRef.current = map;
        setIsMapReady(true);
      } catch (error) {
        console.error('Failed to initialize map:', error);
        toast({
          title: 'Lỗi',
          description: error instanceof Error ? error.message : 'Không thể khởi tạo bản đồ',
          variant: 'destructive',
        });
      }
    };

    initMap();

    return () => {
      mounted = false;
      if (clickListenerRef.current && mapInstanceRef.current && window.google?.maps) {
        window.google.maps.event.removeListener(clickListenerRef.current);
      }
    };
  }, [toast]);

  // Update click listener when mapMode changes
  useEffect(() => {
    if (!isMapReady || !mapInstanceRef.current) return;

    // Remove old listener
    if (clickListenerRef.current && window.google?.maps) {
      window.google.maps.event.removeListener(clickListenerRef.current);
      clickListenerRef.current = null;
    }

    // Add new listener if in add mode
    if (mapMode === 'add' && window.google?.maps) {
      const listener = mapInstanceRef.current.addListener('click', (e: google.maps.MapMouseEvent) => {
        if (e.latLng) {
          handleMapClick(e.latLng.lat(), e.latLng.lng());
        }
      });
      clickListenerRef.current = listener;
    }

    return () => {
      if (clickListenerRef.current && mapInstanceRef.current && window.google?.maps) {
        window.google.maps.event.removeListener(clickListenerRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapMode, isMapReady]);

  // Update markers when stops, origin, or destination change
  useEffect(() => {
    if (!isMapReady || !mapInstanceRef.current) return;
    updateMarkers();
  }, [stops, originStop, destinationStop, isMapReady]);

  // Update route when stops, origin, or destination change (với debounce để tránh gọi quá nhiều)
  useEffect(() => {
    console.log('🔄 useEffect [stops, origin, destination] triggered', {
      stopsCount: stops.length,
      hasOrigin: !!originStop,
      hasDestination: !!destinationStop,
    });
    const timeoutId = setTimeout(() => {
      // Cần có ít nhất origin và destination để tính polyline
      if (originStop && destinationStop && originStop.lat && originStop.lng && destinationStop.lat && destinationStop.lng) {
        console.log('✅ Calling updateRoute from useEffect');
        updateRoute();
      } else {
        console.log('⚠️ Not enough valid points, clearing');
        setPolyline(null);
        setRouteSegments([]);
        // Remove polylines from map
        polylinesRef.current.forEach((polyline) => {
          polyline.setMap(null);
        });
        polylinesRef.current = [];
      }
    }, 300); // Debounce 300ms

    return () => {
      console.log('🧹 Cleaning up useEffect [stops, origin, destination] timeout');
      clearTimeout(timeoutId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stops, originStop, destinationStop]);

  // Update polyline on map when route segments change
  useEffect(() => {
    console.log('🔄 useEffect [routeSegments] triggered:', {
      routeSegmentsCount: routeSegments.length,
      isMapReady,
      hasMap: !!mapInstanceRef.current,
      selectedStopId
    });
    
    if (!isMapReady || !mapInstanceRef.current) {
      console.log('⚠️ Map not ready, skipping updatePolylinesOnMap');
      return;
    }
    
    console.log('✅ Calling updatePolylinesOnMap from useEffect');
    updatePolylinesOnMap();
  }, [routeSegments, selectedStopId, isMapReady]);

  const updateMarkers = () => {
    if (!mapInstanceRef.current || !isMapReady) return;

    if (!window.google?.maps) {
      console.warn('Google Maps not loaded yet');
      return;
    }
    const google: typeof window.google = window.google;
    
    // Remove old markers
    markersRef.current.forEach((marker) => {
      marker.setMap(null);
    });
    markersRef.current.clear();

    // Tạo danh sách tất cả các điểm (origin + stops + destination)
    const allPoints: Array<{ stop: Stop; type: 'origin' | 'stop' | 'destination'; index: number }> = [];
    
    if (originStop && originStop.lat && originStop.lng) {
      allPoints.push({ stop: originStop, type: 'origin', index: 0 });
    }
    stops.forEach((stop, idx) => {
      if (stop.lat && stop.lng) {
        allPoints.push({ stop, type: 'stop', index: idx + 1 });
      }
    });
    if (destinationStop && destinationStop.lat && destinationStop.lng) {
      allPoints.push({ stop: destinationStop, type: 'destination', index: allPoints.length });
    }

    // Add markers for all points
    allPoints.forEach(({ stop, type, index }) => {
      if (!stop.lat || !stop.lng) return;

      // Label: S (Start), 1, 2, 3... (stops), E (End)
      let label = '';
      if (type === 'origin') {
        label = 'S';
      } else if (type === 'destination') {
        label = 'E';
      } else {
        label = String(index);
      }
      
      const marker = new google.maps.Marker({
        position: { lat: stop.lat, lng: stop.lng },
        map: mapInstanceRef.current!,
        label: {
          text: label,
          color: 'white',
          fontWeight: 'bold',
          fontSize: '12px',
        },
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: type === 'origin' || type === 'destination' ? 10 : 8,
          fillColor: type === 'origin' ? '#4285F4' : type === 'destination' ? '#EA4335' : '#34A853',
          fillOpacity: 1,
          strokeColor: 'white',
          strokeWeight: 2,
        },
        title: stop.name || (type === 'origin' ? 'Điểm bắt đầu' : type === 'destination' ? 'Điểm kết thúc' : `Điểm dừng ${index}`),
        zIndex: type === 'origin' ? 1000 : type === 'destination' ? 999 : 100 + index,
      });

      marker.addListener('click', () => {
        setSelectedStopId(stop.id);
      });

      // Add drag listener for marker
      marker.setDraggable(true);
      marker.addListener('dragstart', () => {
        setDraggedMarkerId(stop.id);
      });
      marker.addListener('dragend', (e: google.maps.MapMouseEvent) => {
        if (e.latLng) {
          handleMarkerDrag(stop.id, e.latLng.lat(), e.latLng.lng());
        }
        setDraggedMarkerId(null);
      });

      markersRef.current.set(stop.id, marker);
    });

    if (allPoints.length > 0) {
      fitBounds();
    }
  };

  const fitBounds = () => {
    if (!mapInstanceRef.current) return;
    if (!window.google?.maps) return;

    const google: typeof window.google = window.google;
    const bounds = new google.maps.LatLngBounds();

    // Add origin
    if (originStop && originStop.lat && originStop.lng) {
      bounds.extend({ lat: originStop.lat, lng: originStop.lng });
    }
    
    // Add stops
    stops.forEach((stop) => {
      if (stop.lat && stop.lng) {
        bounds.extend({ lat: stop.lat, lng: stop.lng });
      }
    });
    
    // Add destination
    if (destinationStop && destinationStop.lat && destinationStop.lng) {
      bounds.extend({ lat: destinationStop.lat, lng: destinationStop.lng });
    }

    if (bounds.isEmpty()) return;

    mapInstanceRef.current.fitBounds(bounds);
    // Add padding
    const padding = 50;
    mapInstanceRef.current.setOptions({
      zoom: Math.min(mapInstanceRef.current.getZoom() || 13, 15),
    });
  };

  const updateRoute = async () => {
    // Cần có origin và destination để tính polyline
    if (!originStop || !destinationStop || !originStop.lat || !originStop.lng || !destinationStop.lat || !destinationStop.lng) {
      console.log('⚠️ Missing origin or destination, clearing polyline');
      setPolyline(null);
      setRouteSegments([]);
      setRouteInfo(null);
      return;
    }

    // Tạo danh sách tất cả các điểm: origin -> stops -> destination
    const allPoints: Stop[] = [originStop];
    const validStops = stops.filter((s) => s.lat && s.lng);
    allPoints.push(...validStops);
    allPoints.push(destinationStop);

    console.log('🔄 updateRoute called:', { 
      totalPoints: allPoints.length,
      origin: originStop.name,
      destination: destinationStop.name,
      intermediateStops: validStops.length,
    });
    
    if (allPoints.length < 2) {
      console.log('⚠️ Not enough valid points, clearing polyline');
      setPolyline(null);
      setRouteSegments([]);
      setRouteInfo(null);
      return;
    }

    try {
      console.log('📡 Fetching directions for', allPoints.length - 1, 'segments');
      // Lấy directions cho từng đoạn đường
      const segments: Array<{ polyline: string; from: number; to: number }> = [];
      let totalDistance = 0;
      let totalDuration = 0;

      for (let i = 0; i < allPoints.length - 1; i++) {
        const from = allPoints[i];
        const to = allPoints[i + 1];

        try {
          console.log(`📡 Fetching directions segment ${i + 1}/${allPoints.length - 1}: ${from.name} → ${to.name}`);
          const response = await apiClient.getDirections({
            origin: `${from.lat},${from.lng}`,
            destination: `${to.lat},${to.lng}`,
            mode: 'driving', // Mode driving phù hợp với xe buýt
            vehicleType: 'bus', // Chỉ định loại xe là buýt
          });

          console.log(`📥 Directions response for segment ${i + 1}:`, {
            success: response.success,
            hasPolyline: !!(response.data as any)?.polyline,
            data: response.data
          });

          if (response.success && (response.data as any)?.polyline) {
            const polyline = (response.data as any).polyline;
            segments.push({
              polyline,
              from: i,
              to: i + 1,
            });
            console.log(`✅ Added segment ${i + 1} with polyline length: ${polyline.length}`);

            // Cộng dồn distance và duration
            const data = response.data as any;
            if (data.distance) {
              // Parse distance (có thể là "5.2 km" hoặc "5200 m")
              const distanceStr = String(data.distance).toLowerCase();
              if (distanceStr.includes('km')) {
                totalDistance += parseFloat(distanceStr.replace('km', '').trim()) * 1000;
              } else if (distanceStr.includes('m')) {
                totalDistance += parseFloat(distanceStr.replace('m', '').trim());
              }
            }
            if (data.duration) {
              // Parse duration (có thể là "15 phút" hoặc "900 giây")
              const durationStr = String(data.duration).toLowerCase();
              if (durationStr.includes('phút') || durationStr.includes('minute')) {
                totalDuration += parseFloat(durationStr.replace(/phút|minute/g, '').trim()) * 60;
              } else if (durationStr.includes('giây') || durationStr.includes('second')) {
                totalDuration += parseFloat(durationStr.replace(/giây|second/g, '').trim());
              }
            }
          } else {
            console.warn(`⚠️ No polyline in response for segment ${i + 1}:`, response);
          }
        } catch (error) {
          console.error(`❌ Failed to get directions for segment ${i} to ${i + 1}:`, error);
        }
      }

      console.log(`📊 Total segments fetched: ${segments.length}/${allPoints.length - 1}`);
      console.log('📊 Segments data:', segments.map(s => ({ from: s.from, to: s.to, polylineLength: s.polyline.length })));
      
      setRouteSegments(segments);
      
      // Set route info
      if (totalDistance > 0 || totalDuration > 0) {
        const distanceText = totalDistance >= 1000 
          ? `${(totalDistance / 1000).toFixed(1)} km` 
          : `${Math.round(totalDistance)} m`;
        const durationText = totalDuration >= 60 
          ? `${Math.round(totalDuration / 60)} phút` 
          : `${Math.round(totalDuration)} giây`;
        
        setRouteInfo({
          distance: distanceText,
          duration: durationText,
        });
      }

      // Giữ polyline cũ để backward compatibility (nếu cần)
      if (segments.length > 0) {
        setPolyline(segments[0].polyline);
        console.log('✅ Set polyline and routeSegments');
      } else {
        console.warn('⚠️ No segments to set');
      }
    } catch (error) {
      console.error('❌ Failed to update route:', error);
    }
  };

  const updatePolylinesOnMap = async () => {
    console.log('🔄 updatePolylinesOnMap called:', {
      hasMap: !!mapInstanceRef.current,
      isMapReady,
      routeSegmentsCount: routeSegments.length,
      hasGoogleMaps: !!window.google?.maps,
      hasGeometry: !!window.google?.maps?.geometry,
      hasEncoding: !!window.google?.maps?.geometry?.encoding
    });

    if (!mapInstanceRef.current || !isMapReady) {
      console.log('⚠️ Map not ready:', { isMapReady, hasMap: !!mapInstanceRef.current });
      return;
    }
    if (!window.google?.maps) {
      console.warn('⚠️ Google Maps not loaded');
      return;
    }

    const google: typeof window.google = window.google;
    
    // Remove old polylines
    console.log(`🗑️ Removing ${polylinesRef.current.length} old polylines`);
    polylinesRef.current.forEach((polyline) => {
      polyline.setMap(null);
    });
    polylinesRef.current = [];

    if (routeSegments.length === 0) {
      console.log('⚠️ No route segments to display');
      return;
    }

    console.log(`🗺️ Rendering ${routeSegments.length} route segments`);

    try {
      // Check if geometry library is loaded - with retry
      let geometryReady = false;
      if (google.maps.geometry && google.maps.geometry.encoding && typeof google.maps.geometry.encoding.decodePath === 'function') {
        geometryReady = true;
      } else {
        // Try to import geometry library if available
        if (typeof (google.maps as any).importLibrary === 'function') {
          try {
            await (google.maps as any).importLibrary('geometry');
            if (google.maps.geometry && google.maps.geometry.encoding && typeof google.maps.geometry.encoding.decodePath === 'function') {
              geometryReady = true;
              console.log('✅ Geometry library imported successfully');
            }
          } catch (e) {
            console.warn('⚠️ Failed to import geometry library:', e);
          }
        }
      }

      if (!geometryReady) {
        console.error('❌ Google Maps Geometry library not loaded!', {
          hasGeometry: !!google.maps.geometry,
          hasEncoding: !!google.maps.geometry?.encoding,
          hasDecodePath: typeof google.maps.geometry?.encoding?.decodePath,
          googleMapsKeys: Object.keys(google.maps || {})
        });
        return;
      }

      // Tạo danh sách tất cả các điểm để tìm index
      const allPointsForHighlight: Stop[] = [];
      if (originStop) allPointsForHighlight.push(originStop);
      allPointsForHighlight.push(...stops);
      if (destinationStop) allPointsForHighlight.push(destinationStop);
      
      // Tìm index của điểm dừng được chọn
      const selectedIndex = selectedStopId 
        ? allPointsForHighlight.findIndex((s) => s.id === selectedStopId)
        : -1;

      // Tạo polyline cho từng đoạn đường
      routeSegments.forEach((segment, index) => {
        try {
          if (!segment.polyline) {
            console.warn(`⚠️ Segment ${index} has no polyline`);
            return;
          }

          console.log(`🔍 Decoding segment ${index} (${segment.from} → ${segment.to}), polyline length: ${segment.polyline.length}`);
          
          // Validate polyline string
          if (!segment.polyline || typeof segment.polyline !== 'string' || segment.polyline.trim().length === 0) {
            console.warn(`⚠️ Segment ${index} has invalid polyline string`);
            return;
          }
          
          // Decode polyline
          let path: google.maps.LatLng[];
          try {
            path = google.maps.geometry.encoding.decodePath(segment.polyline);
          } catch (decodeError) {
            console.error(`❌ Failed to decode polyline for segment ${index}:`, decodeError, {
              polylinePreview: segment.polyline.substring(0, 50)
            });
            return;
          }
          
          console.log(`📍 Decoded path for segment ${index}:`, {
            pathLength: path?.length,
            firstPoint: path?.[0] ? { lat: path[0].lat(), lng: path[0].lng() } : null,
            lastPoint: path?.[path.length - 1] ? { lat: path[path.length - 1].lat(), lng: path[path.length - 1].lng() } : null
          });
          
          if (!path || path.length === 0) {
            console.warn(`⚠️ Segment ${index} decoded to empty path`);
            return;
          }
          
          // Xác định màu và opacity dựa trên vị trí và điểm được chọn
          let strokeColor = '#4285F4'; // Màu xanh Google Maps
          let strokeOpacity = 1.0;
          let strokeWeight = 5;
          let zIndex = 100 - index;

          // Nếu có điểm được chọn, highlight đoạn đường liên quan
          if (selectedIndex >= 0) {
            const isHighlighted = 
              (segment.from === selectedIndex && segment.to === selectedIndex + 1) ||
              (segment.from === selectedIndex - 1 && segment.to === selectedIndex);
            
            if (isHighlighted) {
              // Đoạn được highlight: màu xanh đậm, đậm hơn
              strokeColor = '#1a73e8';
              strokeOpacity = 1.0;
              strokeWeight = 6;
              zIndex = 1000; // Đoạn được highlight ở trên cùng
            } else {
              // Đoạn không được highlight: màu xanh mờ hơn
              strokeOpacity = 0.4;
              strokeWeight = 4;
              zIndex = 100 - index;
            }
          } else {
            // Không có điểm được chọn: đoạn đầu màu đậm, các đoạn sau mờ hơn
            if (index === 0) {
              strokeColor = '#4285F4';
              strokeOpacity = 1.0;
              strokeWeight = 5;
              zIndex = 100;
            } else {
              strokeColor = '#4285F4';
              strokeOpacity = 0.5;
              strokeWeight = 4;
              zIndex = 100 - index;
            }
          }
          
          // Create new polyline with improved styling (like Google Maps/Grab)
          const newPolyline = new google.maps.Polyline({
            path,
            geodesic: true,
            strokeColor,
            strokeOpacity,
            strokeWeight,
            map: mapInstanceRef.current,
            zIndex,
            icons: [{
              icon: {
                path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
                scale: 4,
                strokeColor: strokeColor,
                fillColor: strokeColor,
                fillOpacity: strokeOpacity,
              },
              offset: '100%',
              repeat: '100px',
            }],
          });

          polylinesRef.current.push(newPolyline);
          console.log(`✅ Rendered polyline segment ${index} (${segment.from} → ${segment.to})`);
        } catch (error) {
          console.error(`❌ Failed to render polyline segment ${index}:`, error);
        }
      });
      
      console.log(`✅ Total polylines rendered: ${polylinesRef.current.length}`);
    } catch (error) {
      console.error('Failed to render polylines:', error);
    }
  };

  const handleMapClick = async (lat: number, lng: number) => {
    if (mapMode !== 'add') return;
    // Don't allow adding new pending stop if there's already one
    if (pendingStop) return;
    
    try {
      // Reverse geocode to get address
      const response = await apiClient.reverseGeocode({
        latlng: `${lat},${lng}`,
      });

      let address = '';
      if (response.success && response.data) {
        const results = (response.data as any)?.results;
        if (results && results.length > 0) {
          address = results[0].formatted_address || '';
        }
      }

      if (!address) {
        address = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
      }

      // Create pending stop instead of adding directly
      const newPendingStop: Stop = {
        id: `pending-${Date.now()}`,
        name: `Điểm ${stops.length + 1}`,
        address,
        lat,
        lng,
        estimatedTime: '',
        sequence: stops.length + 1,
      };

      setPendingStop(newPendingStop);
      
      // Show pending marker on map
      if (mapInstanceRef.current && window.google?.maps) {
        const google: typeof window.google = window.google;
        
        // Remove old pending marker
        if (pendingMarkerRef.current) {
          pendingMarkerRef.current.setMap(null);
        }
        
        // Create new pending marker (different style to indicate it's pending)
        const marker = new google.maps.Marker({
          position: { lat, lng },
          map: mapInstanceRef.current,
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 10,
            fillColor: '#FF9800', // Orange color for pending
            fillOpacity: 0.8,
            strokeColor: 'white',
            strokeWeight: 3,
          },
          title: 'Điểm dừng tạm thời - Chờ xác nhận',
          zIndex: 2000, // Higher z-index to show on top
          animation: google.maps.Animation.DROP,
        });
        
        pendingMarkerRef.current = marker;
      }
    } catch (error) {
      console.error('Failed to reverse geocode:', error);
      // Create pending stop with coordinates as address
      const newPendingStop: Stop = {
        id: `pending-${Date.now()}`,
        name: `Điểm ${stops.length + 1}`,
        address: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
        lat,
        lng,
        estimatedTime: '',
        sequence: stops.length + 1,
      };
      
      setPendingStop(newPendingStop);
      
      // Show pending marker on map
      if (mapInstanceRef.current && window.google?.maps) {
        const google: typeof window.google = window.google;
        
        if (pendingMarkerRef.current) {
          pendingMarkerRef.current.setMap(null);
        }
        
        const marker = new google.maps.Marker({
          position: { lat, lng },
          map: mapInstanceRef.current,
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 10,
            fillColor: '#FF9800',
            fillOpacity: 0.8,
            strokeColor: 'white',
            strokeWeight: 3,
          },
          title: 'Điểm dừng tạm thời - Chờ xác nhận',
          zIndex: 2000,
          animation: google.maps.Animation.DROP,
        });
        
        pendingMarkerRef.current = marker;
      }
    }
  };

  const addStopFromSearch = (place: { name: string; lat: number; lng: number; address: string }) => {
    if (mapMode !== 'add') return;
    // Don't allow adding new pending stop if there's already one
    if (pendingStop) return;
    
    // Create pending stop instead of adding directly
    const newPendingStop: Stop = {
      id: `pending-${Date.now()}`,
      name: place.name || `Điểm ${stops.length + 1}`,
      address: place.address || '',
      lat: place.lat,
      lng: place.lng,
      estimatedTime: '',
      sequence: stops.length + 1,
    };

    setPendingStop(newPendingStop);
    
    // Show pending marker on map
    if (mapInstanceRef.current && window.google?.maps) {
      const google: typeof window.google = window.google;
      
      // Remove old pending marker
      if (pendingMarkerRef.current) {
        pendingMarkerRef.current.setMap(null);
      }
      
      // Create new pending marker
      const marker = new google.maps.Marker({
        position: { lat: place.lat, lng: place.lng },
        map: mapInstanceRef.current,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: '#FF9800', // Orange color for pending
          fillOpacity: 0.8,
          strokeColor: 'white',
          strokeWeight: 3,
        },
        title: 'Điểm dừng tạm thời - Chờ xác nhận',
        zIndex: 2000,
        animation: google.maps.Animation.DROP,
      });
      
      pendingMarkerRef.current = marker;
    }
  };

  // Confirm pending stop - add it to stops
  const confirmPendingStop = () => {
    if (!pendingStop) return;
    
    // Generate new ID for the confirmed stop
    const confirmedStop: Stop = {
      ...pendingStop,
      id: Date.now().toString(),
      sequence: stops.length + 1,
    };
    
    const updatedStops = [...stops, confirmedStop];
    setStops(updatedStops);
    setSelectedStopId(confirmedStop.id);
    setPendingStop(null);
    
    // Remove pending marker
    if (pendingMarkerRef.current) {
      pendingMarkerRef.current.setMap(null);
      pendingMarkerRef.current = null;
    }
    
    // Update markers to show the new confirmed stop
    updateMarkers();
    
    // Trigger update route
    if (updatedStops.filter((s) => s.lat && s.lng && s.address).length >= 2) {
      setTimeout(() => {
        updateRoute();
      }, 100);
    }
    
    toast({
      title: 'Đã thêm điểm dừng',
      description: 'Điểm dừng đã được thêm vào danh sách',
    });
  };

  // Cancel pending stop - remove it but keep add mode
  const cancelPendingStop = () => {
    setPendingStop(null);
    
    // Remove pending marker
    if (pendingMarkerRef.current) {
      pendingMarkerRef.current.setMap(null);
      pendingMarkerRef.current = null;
    }
    
    toast({
      title: 'Đã hủy',
      description: 'Điểm dừng tạm thời đã được hủy',
    });
  };

  const removeStop = (id: string) => {
    if (stops.length <= 1) {
      toast({
        title: 'Không thể xóa',
        description: 'Tuyến đường cần ít nhất một điểm dừng',
        variant: 'destructive',
      });
      return;
    }

    // Tìm stop bị xóa để kiểm tra xem có trong suggestions không
    const removedStop = stops.find(s => s.id === id);
    
    const newStops = stops
      .filter((s) => s.id !== id)
      .map((s, idx) => ({ ...s, sequence: idx + 1 }));
    setStops(newStops);
    
    // Nếu stop bị xóa có trong allSuggestions (match theo lat/lng), hiển thị lại suggestions
    if (removedStop && removedStop.lat && removedStop.lng && allSuggestions.length > 0) {
      const tolerance = 0.0001;
      const hasMatch = allSuggestions.some((suggestion) => {
        if (!suggestion.lat || !suggestion.lng) return false;
        const latDiff = Math.abs(removedStop.lat! - suggestion.lat);
        const lngDiff = Math.abs(removedStop.lng! - suggestion.lng);
        return latDiff < tolerance && lngDiff < tolerance;
      });
      
      if (hasMatch && !showSuggestions) {
        setShowSuggestions(true);
      }
    }
    
    if (selectedStopId === id) {
      setSelectedStopId(null);
    }
  };

  const updateStop = (id: string, field: keyof Stop, value: string | number) => {
    setStops(
      stops.map((stop) =>
        stop.id === id ? { ...stop, [field]: value } : stop
      )
    );
  };

  const handleMarkerDrag = async (stopId: string, lat: number, lng: number) => {
    try {
      // Reverse geocode to get new address
      const response = await apiClient.reverseGeocode({
        latlng: `${lat},${lng}`,
      });

      let address = '';
      if (response.success && response.data) {
        const results = (response.data as any)?.results;
        if (results && results.length > 0) {
          address = results[0].formatted_address || '';
        }
      }

      if (!address) {
        address = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
      }

      // Update origin, destination, or stop coordinates and address
      if (stopId === 'origin' && originStop) {
        setOriginStop({ ...originStop, lat, lng, address });
      } else if (stopId === 'destination' && destinationStop) {
        setDestinationStop({ ...destinationStop, lat, lng, address });
      } else {
        // Update stop coordinates and address
        const updatedStops = stops.map((stop) =>
          stop.id === stopId
            ? { ...stop, lat, lng, address }
            : stop
        );
        setStops(updatedStops);
      }

      // Trigger update route để cập nhật polyline
      setTimeout(() => {
        updateRoute();
      }, 100);

      toast({
        title: 'Đã di chuyển điểm',
        description: 'Địa chỉ đã được cập nhật tự động',
      });
    } catch (error) {
      console.error('Failed to reverse geocode:', error);
      // Update coordinates anyway
      if (stopId === 'origin' && originStop) {
        setOriginStop({ ...originStop, lat, lng, address: `${lat.toFixed(6)}, ${lng.toFixed(6)}` });
      } else if (stopId === 'destination' && destinationStop) {
        setDestinationStop({ ...destinationStop, lat, lng, address: `${lat.toFixed(6)}, ${lng.toFixed(6)}` });
      } else {
        setStops(
          stops.map((stop) =>
            stop.id === stopId
              ? { ...stop, lat, lng, address: `${lat.toFixed(6)}, ${lng.toFixed(6)}` }
              : stop
          )
        );
      }
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = stops.findIndex((s) => s.id === active.id);
    const newIndex = stops.findIndex((s) => s.id === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    const newStops = arrayMove(stops, oldIndex, newIndex).map((stop, idx) => ({
      ...stop,
      sequence: idx + 1,
    }));

    setStops(newStops);
  };

  // Đề xuất điểm dừng dựa trên học sinh
  const handleSuggestStops = async () => {
    try {
      setLoadingSuggestions(true);
      setShowSuggestions(true);

      // Extract area từ route name hoặc để null để lấy tất cả
      const areaMatch = routeName.match(/Quận\s+(\d+)|Huyện\s+(\w+)/i);
      const area = areaMatch ? areaMatch[0] : null;

      // Lấy origin và destination từ originStop và destinationStop
      const originParam = originStop?.lat && originStop?.lng 
        ? `${originStop.lat},${originStop.lng}` 
        : undefined;
      const destinationParam = destinationStop?.lat && destinationStop?.lng
        ? `${destinationStop.lat},${destinationStop.lng}`
        : undefined;

      const response = await apiClient.suggestStops({
        area: area || undefined,
        maxDistanceKm: 2.0,
        minStudentsPerStop: 1, // Giảm xuống 1 để có thể đề xuất ngay cả khi chỉ có 1 học sinh
        maxStops: 20,
        origin: originParam,
        destination: destinationParam,
        optimizeRoute: true, // Tối ưu lộ trình
      });

      const data = (response as any).data || {};
      const suggestionsList = data.suggestions || [];

      if (suggestionsList.length === 0) {
        toast({
          title: "Không có đề xuất",
          description: "Không tìm thấy học sinh để đề xuất điểm dừng",
          variant: "default",
        });
        setShowSuggestions(false);
        return;
      }

      setAllSuggestions(suggestionsList);

      toast({
        title: "Đề xuất thành công",
        description: `Đã tìm thấy ${suggestionsList.length} điểm dừng đề xuất`,
      });
    } catch (error: any) {
      console.error("Failed to get stop suggestions:", error);
      toast({
        title: "Lỗi",
        description: error?.message || "Không thể lấy đề xuất điểm dừng",
        variant: "destructive",
      });
      setShowSuggestions(false);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  // Chọn một đề xuất và thêm vào stops
  const handleSelectSuggestion = (suggestion: typeof allSuggestions[0]) => {
    if (!suggestion.lat || !suggestion.lng) {
      toast({
        title: "Lỗi",
        description: "Điểm dừng này chưa có tọa độ. Vui lòng geocode địa chỉ trước.",
        variant: "destructive",
      });
      return;
    }

    // Tính thời gian dừng dựa trên số học sinh
    const estimatedTime = calculateEstimatedTime(suggestion.studentCount);

    const newStop: Stop = {
      id: Date.now().toString(),
      name: suggestion.name,
      address: suggestion.address,
      lat: suggestion.lat,
      lng: suggestion.lng,
      estimatedTime: estimatedTime,
      sequence: stops.length + 1,
    };

    setStops([...stops, newStop]);
    setSelectedStopId(newStop.id);
    setShowSuggestions(false);

    toast({
      title: "Đã thêm điểm dừng",
      description: `${suggestion.name} đã được thêm (${suggestion.studentCount} học sinh)`,
    });

    // Update map markers
    setTimeout(() => {
      updateMarkers();
      const updatedStops = [...stops, newStop];
      if (updatedStops.length >= 1) {
        updateRoute();
      }
    }, 100);
  };

  // Chọn tất cả đề xuất
  const handleSelectAllSuggestions = () => {
    const validSuggestions = filteredSuggestions.filter((s) => s.lat && s.lng);
    if (validSuggestions.length === 0) {
      toast({
        title: "Lỗi",
        description: "Không có đề xuất hợp lệ để thêm",
        variant: "destructive",
      });
      return;
    }

    const newStops: Stop[] = validSuggestions.map((suggestion, idx) => ({
      id: `suggestion_${Date.now()}_${idx}`,
      name: suggestion.name,
      address: suggestion.address,
      lat: suggestion.lat!,
      lng: suggestion.lng!,
      estimatedTime: calculateEstimatedTime(suggestion.studentCount),
      sequence: stops.length + idx + 1,
    }));

    setStops([...stops, ...newStops]);
    setShowSuggestions(false);

    toast({
      title: "Đã thêm tất cả",
      description: `Đã thêm ${newStops.length} điểm dừng từ đề xuất`,
    });

    // Update map markers
    setTimeout(() => {
      updateMarkers();
      if (stops.length + newStops.length >= 2) {
        updateRoute();
      }
    }, 100);
  };

  const handleSubmit = async () => {
    if (!routeName.trim()) {
      toast({
        title: 'Lỗi',
        description: 'Vui lòng nhập tên tuyến',
        variant: 'destructive',
      });
      return;
    }

    const validStops = stops.filter((s) => s.name.trim() && s.lat && s.lng);

    try {
      setIsSubmitting(true);

      // Đảm bảo tên tuyến hợp lệ (theo validation: min 2, max 255 ký tự)
      const trimmedRouteName = routeName.trim();
      if (trimmedRouteName.length < 2) {
        toast({
          title: 'Lỗi',
          description: 'Tên tuyến phải có ít nhất 2 ký tự',
          variant: 'destructive',
        });
        return;
      }
      if (trimmedRouteName.length > 255) {
        toast({
          title: 'Lỗi',
          description: 'Tên tuyến không được quá 255 ký tự',
          variant: 'destructive',
        });
        return;
      }

      // Validation: Cần có origin và destination
      if (!originStop || !originStop.lat || !originStop.lng) {
        toast({
          title: 'Lỗi',
          description: 'Vui lòng chọn điểm bắt đầu',
          variant: 'destructive',
        });
        return;
      }
      if (!destinationStop || !destinationStop.lat || !destinationStop.lng) {
        toast({
          title: 'Lỗi',
          description: 'Vui lòng chọn điểm kết thúc',
          variant: 'destructive',
        });
        return;
      }

      // Chuẩn bị diemBatDau và diemKetThuc từ origin và destination
      // Chuẩn bị danh sách stops để gửi cùng payload (bao gồm origin và destination)
      const allStops = [
        {
          stop_id: null,
          tenDiem: originStop.name.trim(),
          address: originStop.address.trim() || undefined,
          viDo: Number(originStop.lat),
          kinhDo: Number(originStop.lng),
          sequence: 1,
        },
        ...stops.map((stop, idx) => ({
          stop_id: null,
          tenDiem: stop.name.trim(),
          address: stop.address.trim() || undefined,
          viDo: Number(stop.lat),
          kinhDo: Number(stop.lng),
          sequence: idx + 2,
        })),
        {
          stop_id: null,
          tenDiem: destinationStop.name.trim(),
          address: destinationStop.address.trim() || undefined,
          viDo: Number(destinationStop.lat),
          kinhDo: Number(destinationStop.lng),
          sequence: stops.length + 2,
        },
      ];

      const routePayload: any = {
        tenTuyen: trimmedRouteName,
        diemBatDau: originStop.name.trim().substring(0, 255),
        diemKetThuc: destinationStop.name.trim().substring(0, 255),
        origin_lat: originStop.lat,
        origin_lng: originStop.lng,
        dest_lat: destinationStop.lat,
        dest_lng: destinationStop.lng,
        routeType: 'di', // Mặc định là tuyến đi
        createReturnRoute: true, // Tự động tạo tuyến về
        stops: allStops, // Gửi danh sách stops để backend tự động tạo tuyến về với stops đảo ngược
      };

      if (mode === 'edit' && initialRoute?.id) {
        const updateResult = await apiClient.updateRoute(initialRoute.id, routePayload);
        const updatedRouteData = (updateResult.data as any) || { ...routePayload, id: initialRoute.id, maTuyen: initialRoute.id };
        
        // Invalidate routes cache để refresh danh sách
        queryClient.invalidateQueries({ queryKey: routeKeys.all });
        queryClient.invalidateQueries({ queryKey: routeKeys.detail(initialRoute.id) });
        
        toast({
          title: 'Thành công',
          description: 'Đã cập nhật tuyến đường',
        });
        onSaved?.(updatedRouteData);
        onClose();
      } else {
        // Log payload trước khi gửi
        console.log('📤 Payload gửi đi:', routePayload);
        
        const result = await apiClient.createRoute(routePayload);
        
        // Log response để debug
        console.log('📥 Response từ createRoute:', result);
        
        // Kiểm tra response có success không
        if (!result.success) {
          // Hiển thị errors từ validation nếu có
          const errorMessages = (result as any).errors || [];
          const errorMessage = result.error?.message || 'Không thể tạo tuyến đường';
          const fullMessage = errorMessages.length > 0 
            ? `${errorMessage}\n${errorMessages.join('\n')}`
            : errorMessage;
          
          console.error('❌ Lỗi validation:', errorMessages);
          console.error('❌ Error object:', result.error);
          
          toast({
            title: 'Lỗi validation',
            description: fullMessage,
            variant: 'destructive',
          });
          
          throw new Error(fullMessage);
        }
        
        // Lấy ID từ nhiều vị trí có thể
        const routeData = (result.data as any) || {};
        const newRouteId = Number(
          routeData.maTuyen || 
          routeData.id || 
          (result as any).maTuyen || 
          (result as any).id ||
          (result as any).data?.maTuyen ||
          (result as any).data?.id
        );

        console.log('🔍 Tìm thấy route ID:', newRouteId, 'từ data:', routeData);

        if (!newRouteId || isNaN(newRouteId)) {
          console.error('❌ Không thể lấy ID tuyến đường. Response:', result);
          console.error('❌ Route data:', routeData);
          throw new Error(`Không thể lấy ID tuyến đường sau khi tạo. Response: ${JSON.stringify(result)}`);
        }

        // Nếu đã gửi stops trong payload, backend sẽ tự động thêm stops vào cả tuyến đi và tuyến về
        // Chỉ thêm stops thủ công nếu không có trong payload (fallback)
        if (!routePayload.stops || routePayload.stops.length === 0) {
          console.log('⚠️ Không có stops trong payload, thêm stops thủ công...');
          
          // Thêm origin và destination vào route_stops trước
          // Thêm origin (sequence = 1)
          try {
            const originPayload: any = {
              tenDiem: originStop.name.trim(),
              address: originStop.address.trim() || undefined,
              sequence: 1,
              dwell_seconds: 30,
              viDo: Number(originStop.lat),
              kinhDo: Number(originStop.lng),
            };
            await apiClient.addRouteStop(newRouteId, originPayload);
            console.log('✅ Đã thêm điểm bắt đầu');
          } catch (err: any) {
            console.error('❌ Lỗi khi thêm điểm bắt đầu:', err);
            toast({
              title: 'Lỗi',
              description: `Không thể thêm điểm bắt đầu. ${err?.message || 'Lỗi không xác định'}`,
              variant: 'destructive',
            });
          }

          // Thêm các điểm dừng trung gian
          const addedStops: any[] = [];
          if (validStops.length > 0) {
            for (let i = 0; i < validStops.length; i++) {
              const stop = validStops[i];
              try {
              const stopPayload: any = {
                tenDiem: stop.name.trim(),
                address: stop.address.trim() || undefined,
                sequence: i + 2, // +2 vì đã có origin ở sequence 1
                dwell_seconds: stop.estimatedTime ? parseInt(stop.estimatedTime) * 60 : 30, // Mặc định 30 giây
              };

              // Đảm bảo có coordinates trước khi thêm stop
              if (stop.lat && stop.lng) {
                stopPayload.viDo = Number(stop.lat);
                stopPayload.kinhDo = Number(stop.lng);
              } else if (stop.address.trim()) {
                // Geocode if no coordinates
                try {
                  const geocodeResponse = await apiClient.geocode({ address: stop.address.trim() });
                  if (geocodeResponse.success && geocodeResponse.data) {
                    const location = (geocodeResponse.data as any)?.results?.[0]?.geometry?.location;
                    if (location) {
                      stopPayload.viDo = Number(location.lat);
                      stopPayload.kinhDo = Number(location.lng);
                    } else {
                      console.warn('Geocode không trả về location cho:', stop.address);
                      toast({
                        title: 'Cảnh báo',
                        description: `Không thể lấy tọa độ cho "${stop.name || stop.address}". Điểm dừng này sẽ bị bỏ qua.`,
                        variant: 'default',
                      });
                      continue;
                    }
                  } else {
                    console.warn('Geocode thất bại cho:', stop.address);
                    toast({
                      title: 'Cảnh báo',
                      description: `Không thể lấy tọa độ cho "${stop.name || stop.address}". Điểm dừng này sẽ bị bỏ qua.`,
                      variant: 'default',
                    });
                    continue;
                  }
                } catch (geocodeErr) {
                  console.warn('Failed to geocode address:', geocodeErr);
                  toast({
                    title: 'Cảnh báo',
                    description: `Không thể lấy tọa độ cho "${stop.name || stop.address}". Điểm dừng này sẽ bị bỏ qua.`,
                    variant: 'default',
                  });
                  continue;
                }
              } else {
                // Skip stop nếu không có coordinates và address
                console.warn('Skipping stop without coordinates or address:', stop);
                toast({
                  title: 'Cảnh báo',
                  description: `Điểm dừng "${stop.name || 'chưa đặt tên'}" thiếu địa chỉ. Điểm dừng này sẽ bị bỏ qua.`,
                  variant: 'default',
                });
                continue;
              }

              // Đảm bảo viDo và kinhDo đã có và là số hợp lệ trước khi gửi request
              if (stopPayload.viDo === undefined || stopPayload.kinhDo === undefined || 
                  isNaN(stopPayload.viDo) || isNaN(stopPayload.kinhDo)) {
                console.warn('Skipping stop without valid coordinates:', stop, stopPayload);
                toast({
                  title: 'Cảnh báo',
                  description: `Điểm dừng "${stop.name || 'chưa đặt tên'}" không có tọa độ hợp lệ. Điểm dừng này sẽ bị bỏ qua.`,
                  variant: 'default',
                });
                continue;
              }

              // Validate tọa độ hợp lệ (latitude: -90 to 90, longitude: -180 to 180)
              if (stopPayload.viDo < -90 || stopPayload.viDo > 90) {
                console.warn('Invalid latitude:', stopPayload.viDo);
                toast({
                  title: 'Lỗi',
                  description: `Vĩ độ không hợp lệ cho điểm "${stop.name}". Vĩ độ phải từ -90 đến 90.`,
                  variant: 'destructive',
                });
                continue;
              }
              if (stopPayload.kinhDo < -180 || stopPayload.kinhDo > 180) {
                console.warn('Invalid longitude:', stopPayload.kinhDo);
                toast({
                  title: 'Lỗi',
                  description: `Kinh độ không hợp lệ cho điểm "${stop.name}". Kinh độ phải từ -180 đến 180.`,
                  variant: 'destructive',
                });
                continue;
              }

              // Log payload để debug
              console.log(`📤 Gửi điểm dừng ${i + 1}:`, {
                routeId: newRouteId,
                payload: stopPayload,
                viDo: stopPayload.viDo,
                kinhDo: stopPayload.kinhDo,
                viDoType: typeof stopPayload.viDo,
                kinhDoType: typeof stopPayload.kinhDo,
              });

              const addResult = await apiClient.addRouteStop(newRouteId, stopPayload);
              if (addResult.success) {
                addedStops.push(stop);
                console.log(`✅ Đã thêm điểm dừng ${i + 1}: ${stop.name}`);
              } else {
                console.error(`❌ Không thể thêm điểm dừng ${i + 1}:`, addResult);
                console.error(`Payload đã gửi:`, stopPayload);
                
                // Hiển thị error message chi tiết
                const errorMsg = addResult.error?.message || 
                                addResult.error?.code || 
                                (addResult as any).message ||
                                'Lỗi không xác định';
                
                toast({
                  title: 'Lỗi',
                  description: `Không thể thêm điểm dừng "${stop.name}". ${errorMsg}`,
                  variant: 'destructive',
                });
                
                // Không throw error, tiếp tục với điểm dừng tiếp theo
              }
            } catch (err: any) {
              console.error(`❌ Lỗi khi thêm điểm dừng ${i + 1}:`, err);
              
              // Hiển thị error message chi tiết
              const errorMsg = err?.message || 
                              err?.error?.message || 
                              err?.response?.data?.error?.message ||
                              err?.response?.data?.message ||
                              'Lỗi không xác định';
              
              toast({
                title: 'Lỗi',
                description: `Không thể thêm điểm dừng "${stop.name}". ${errorMsg}`,
                variant: 'destructive',
              });
              
              // Không throw error, tiếp tục với điểm dừng tiếp theo
            }
            }
            
            console.log(`📊 Tổng số điểm dừng trung gian đã thêm: ${addedStops.length}/${validStops.length}`);
          }

          // Thêm destination (sequence = cuối cùng, ngay cả khi không có điểm dừng trung gian)
          try {
            const destinationSequence = validStops.length > 0 ? (validStops.length + 2) : 2; // +2 vì đã có origin ở sequence 1
            const destinationPayload: any = {
              tenDiem: destinationStop.name.trim(),
              address: destinationStop.address.trim() || undefined,
              sequence: destinationSequence,
              dwell_seconds: 60, // Điểm kết thúc dừng lâu hơn
              viDo: Number(destinationStop.lat),
              kinhDo: Number(destinationStop.lng),
            };
            await apiClient.addRouteStop(newRouteId, destinationPayload);
            console.log('✅ Đã thêm điểm kết thúc');
          } catch (err: any) {
            console.error('❌ Lỗi khi thêm điểm kết thúc:', err);
            toast({
              title: 'Lỗi',
              description: `Không thể thêm điểm kết thúc. ${err?.message || 'Lỗi không xác định'}`,
              variant: 'destructive',
            });
          }

          // Chỉ rebuild polyline nếu có ít nhất origin và destination
          // Lưu ý: Rebuild polyline là optional, không bắt buộc
          if (originStop && destinationStop) {
            try {
              // Đợi một chút để đảm bảo tất cả stops đã được lưu vào DB
              await new Promise((resolve) => setTimeout(resolve, 1000));
              
              // Gọi rebuild polyline với timeout ngắn hơn
              const rebuildPromise = apiClient.rebuildPolyline(newRouteId);
              const timeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Timeout')), 10000) // 10 giây timeout
              );
              
              await Promise.race([rebuildPromise, timeoutPromise]);
              console.log('✅ Đã rebuild polyline cho route:', newRouteId);
            } catch (err: any) {
              console.warn('⚠️ Không thể rebuild polyline tự động:', err);
              // Không throw error, chỉ log warning - polyline có thể được rebuild sau
              // Frontend đã có polyline từ updateRoute() nên không cần thiết phải rebuild
              if (err?.error?.code !== 'MAPS_API_ERROR') {
                toast({
                  title: 'Cảnh báo',
                  description: 'Không thể tạo polyline tự động. Bạn có thể tạo lại sau từ trang chi tiết tuyến.',
                  variant: 'default',
                });
              }
            }
          }
        } else {
          // Nếu đã gửi stops trong payload, backend đã tự động thêm stops vào cả tuyến đi và tuyến về
          console.log('✅ Backend đã tự động thêm stops vào tuyến đi và tuyến về');
        }

        // Invalidate routes cache để refresh danh sách
        queryClient.invalidateQueries({ queryKey: routeKeys.all });
        
        toast({
          title: 'Thành công',
          description: routePayload.createReturnRoute ? 'Đã tạo tuyến đi và tuyến về' : 'Đã tạo tuyến đường mới',
        });
        onSaved?.(routeData);
        onClose();
      }
    } catch (err: any) {
      console.error('Lỗi:', err);
      toast({
        title: 'Không thành công',
        description: err?.message || 'Có lỗi xảy ra',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedStop = stops.find((s) => s.id === selectedStopId);

  // Sortable Stop Item Component
  const SortableStopItem = React.memo(({ 
    stop, 
    index, 
    onUpdateStop, 
    onRemoveStop, 
    isSelected,
    onSelect 
  }: { 
    stop: Stop; 
    index: number;
    onUpdateStop: (id: string, field: keyof Stop, value: string | number) => void;
    onRemoveStop: (id: string) => void;
    isSelected: boolean;
    onSelect: (id: string) => void;
  }) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
      id: stop.id,
    });

    // Local state for estimatedTime input to prevent auto-update while typing
    const [localEstimatedTime, setLocalEstimatedTime] = useState(stop.estimatedTime);
    
    // Update local state when stop.estimatedTime changes from outside
    useEffect(() => {
      setLocalEstimatedTime(stop.estimatedTime);
    }, [stop.estimatedTime]);

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.5 : 1,
    };

    const handleEstimatedTimeBlur = () => {
      onUpdateStop(stop.id, 'estimatedTime', localEstimatedTime);
    };

    const handleEstimatedTimeKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        e.currentTarget.blur();
      }
    };

    return (
      <Card
        ref={setNodeRef}
        style={style}
        className={`p-3 cursor-pointer transition-colors ${
          isSelected
            ? 'border-primary bg-primary/5'
            : 'hover:border-primary/50'
        } ${isDragging ? 'z-50' : ''}`}
        onClick={() => onSelect(stop.id)}
      >
        <div className="flex items-start gap-2 relative pr-9 pb-1">
          <div
            {...attributes}
            {...listeners}
            className="flex-shrink-0 cursor-grab active:cursor-grabbing pt-1"
          >
            <GripVertical className="w-4 h-4 text-muted-foreground" />
          </div>
          <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
            {index + 1}
          </div>
          <div className="flex-1 min-w-0 overflow-hidden">
            <div className="pr-8">
              <Input
                value={stop.name}
                onChange={(e) => onUpdateStop(stop.id, 'name', e.target.value)}
                placeholder="Tên điểm dừng"
                className="text-sm mb-1"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
            <p 
              className="text-xs text-muted-foreground mb-2 line-clamp-2 break-words leading-relaxed pr-8"
              title={stop.address}
            >
              {stop.address || 'Chưa có địa chỉ'}
            </p>
            <div className="flex items-center gap-2">
              <Clock className="w-3 h-3 text-muted-foreground flex-shrink-0" />
              <Input
                type="number"
                min="0"
                step="1"
                value={localEstimatedTime}
                onChange={(e) => setLocalEstimatedTime(e.target.value)}
                onBlur={handleEstimatedTimeBlur}
                onKeyDown={handleEstimatedTimeKeyDown}
                placeholder="Phút"
                className="text-xs w-20 h-7 flex-shrink-0"
                onClick={(e) => e.stopPropagation()}
              />
              <span className="text-xs text-muted-foreground flex-shrink-0 whitespace-nowrap">phút</span>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-1 right-1 h-7 w-7 flex-shrink-0 text-destructive hover:text-destructive hover:bg-destructive/10 z-20 bg-background/95 backdrop-blur-sm border border-destructive/20 shadow-sm hover:border-destructive/40 rounded-md"
            onClick={(e) => {
              e.stopPropagation();
              onRemoveStop(stop.id);
            }}
            title="Xóa điểm dừng"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </Card>
    );
  });

  return (
    <div className="flex h-[calc(100vh-4rem)] gap-4">
      {/* Sidebar */}
      <div className="w-96 flex-shrink-0 flex flex-col border-r bg-background">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">
              {mode === 'edit' ? 'Chỉnh sửa tuyến' : 'Tạo tuyến mới'}
            </h2>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>

          <div className="space-y-3">
            <div>
              <Label>Tên tuyến *</Label>
              <Input
                value={routeName}
                onChange={(e) => setRouteName(e.target.value)}
                placeholder="VD: Tuyến 1 - Quận 1 → Quận 7"
              />
            </div>

            <div className="space-y-3">
              <div>
                <Label className="text-xs flex items-center gap-1">
                  <Navigation className="w-3 h-3 text-primary" />
                  Điểm bắt đầu *
                </Label>
                <PlacePicker
                  onPlaceSelected={(place) => {
                    setOriginStop({
                      id: 'origin',
                      name: place.name || 'Điểm bắt đầu',
                      address: place.address || '',
                      lat: place.lat,
                      lng: place.lng,
                      estimatedTime: '',
                      sequence: 1,
                    });
                  }}
                  placeholder="Tìm kiếm điểm bắt đầu..."
                />
                {originStop && (
                  <div className="mt-1 p-2 bg-primary/5 rounded text-xs">
                    <p className="font-medium">{originStop.name}</p>
                    <p className="text-muted-foreground line-clamp-1">{originStop.address}</p>
                  </div>
                )}
              </div>
              <div>
                <Label className="text-xs flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-destructive" />
                  Điểm kết thúc *
                </Label>
                <PlacePicker
                  onPlaceSelected={(place) => {
                    setDestinationStop({
                      id: 'destination',
                      name: place.name || 'Điểm kết thúc',
                      address: place.address || '',
                      lat: place.lat,
                      lng: place.lng,
                      estimatedTime: '',
                      sequence: 999,
                    });
                  }}
                  placeholder="Tìm kiếm điểm kết thúc..."
                />
                {destinationStop && (
                  <div className="mt-1 p-2 bg-destructive/5 rounded text-xs">
                    <p className="font-medium">{destinationStop.name}</p>
                    <p className="text-muted-foreground line-clamp-1">{destinationStop.address}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary" />
              <Label className="text-sm font-semibold">Điểm dừng</Label>
              <Badge variant="outline" className="text-xs">
                {stops.length}
              </Badge>
            </div>
            <div className="flex gap-2">
              {mapMode === 'add' ? (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      // Cancel pending stop if exists
                      if (pendingStop) {
                        cancelPendingStop();
                      }
                      setMapMode('view');
                    }}
                  >
                    <X className="w-3 h-3 mr-1" />
                    Hủy
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSuggestStops}
                    disabled={loadingSuggestions}
                  >
                    {loadingSuggestions ? (
                      <>
                        <Sparkles className="w-3 h-3 mr-1 animate-spin" />
                        Đang tải...
                      </>
                    ) : (
                      <>
                        <Zap className="w-3 h-3 mr-1" />
                        Đề xuất
                      </>
                    )}
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => setMapMode('add')}
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    Thêm điểm dừng
                  </Button>
                </>
              )}
            </div>
          </div>

          {mapMode === 'add' && !pendingStop && (
            <div className="mb-3 p-3 bg-primary/5 rounded-lg border border-primary/20">
              <PlacePicker
                onPlaceSelected={(place) => {
                  addStopFromSearch(place);
                }}
                placeholder="Tìm kiếm địa điểm..."
              />
              <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                Hoặc click trên bản đồ để thêm điểm dừng
              </p>
            </div>
          )}
          
          {mapMode === 'add' && pendingStop && (
            <div className="mb-3 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-xs text-blue-900 dark:text-blue-100 flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                Xác nhận hoặc hủy điểm dừng hiện tại để thêm điểm mới
              </p>
            </div>
          )}

          {/* Pending Stop Preview */}
          {pendingStop && (
            <div className="mb-3 p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg border-2 border-amber-300 dark:border-amber-700">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 rounded-full bg-amber-500 flex items-center justify-center">
                  <MapPin className="w-3 h-3 text-white" />
                </div>
                <Label className="text-sm font-semibold text-amber-900 dark:text-amber-100">
                  Điểm dừng tạm thời
                </Label>
              </div>
              
              <div className="space-y-3">
                <div>
                  <Label className="text-xs text-amber-900 dark:text-amber-100">Tên điểm dừng</Label>
                  <Input
                    value={pendingStop.name}
                    onChange={(e) => setPendingStop({ ...pendingStop, name: e.target.value })}
                    placeholder="VD: Trường TH ABC"
                    className="text-sm mt-1"
                  />
                </div>
                
                <div>
                  <Label className="text-xs text-amber-900 dark:text-amber-100">Địa chỉ</Label>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2 break-words" title={pendingStop.address}>
                    {pendingStop.address || 'Chưa có địa chỉ'}
                  </p>
                </div>
                
                <div>
                  <Label className="text-xs text-amber-900 dark:text-amber-100">Thời gian dừng (phút)</Label>
                  <Input
                    type="number"
                    min="0"
                    step="1"
                    value={pendingStop.estimatedTime}
                    onChange={(e) => setPendingStop({ ...pendingStop, estimatedTime: e.target.value })}
                    placeholder="VD: 2"
                    className="text-sm mt-1 w-full"
                  />
                </div>
                
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="default"
                    size="sm"
                    onClick={confirmPendingStop}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                  >
                    <CheckCircle2 className="w-4 h-4 mr-1" />
                    Xác nhận
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={cancelPendingStop}
                    className="flex-1 border-amber-300 text-amber-900 hover:bg-amber-100 dark:border-amber-700 dark:text-amber-100 dark:hover:bg-amber-900/30"
                  >
                    <XCircle className="w-4 h-4 mr-1" />
                    Hủy
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Stop Suggestions */}
          {showSuggestions && filteredSuggestions.length > 0 && (
            <div className="mb-4 p-3 bg-purple-50 dark:bg-purple-950/20 rounded-lg border-2 border-purple-300 dark:border-purple-700 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  <Label className="text-sm font-semibold text-purple-900 dark:text-purple-100">
                    Đề xuất điểm dừng ({filteredSuggestions.length}/{allSuggestions.length})
                  </Label>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSelectAllSuggestions}
                    className="text-xs h-7"
                    disabled={filteredSuggestions.length === 0}
                  >
                    Chọn tất cả ({filteredSuggestions.length})
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => {
                      setShowSuggestions(false);
                    }}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              </div>
              <ScrollArea className="max-h-64">
                <div className="space-y-2">
                  {filteredSuggestions.map((suggestion) => (
                    <Card
                      key={suggestion.id}
                      className="p-2 border-purple-200 dark:border-purple-800 hover:border-purple-400 dark:hover:border-purple-600 cursor-pointer transition-colors"
                      onClick={() => handleSelectSuggestion(suggestion)}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-purple-900 dark:text-purple-100 line-clamp-1">
                            {suggestion.name}
                          </p>
                          <p className="text-xs text-muted-foreground line-clamp-1 mt-1" title={suggestion.address}>
                            {suggestion.address}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              <Users className="w-3 h-3 mr-1" />
                              {suggestion.studentCount} học sinh
                            </Badge>
                            {suggestion.lat && suggestion.lng ? (
                              <Badge variant="outline" className="text-xs text-green-600">
                                <MapPin className="w-3 h-3 mr-1" />
                                Có tọa độ
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-xs text-yellow-600">
                                <MapPin className="w-3 h-3 mr-1" />
                                Cần geocode
                              </Badge>
                            )}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectSuggestion(suggestion);
                          }}
                        >
                          <Plus className="w-3 h-3" />
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}

          {/* Separator nếu có cả suggestions và stops */}
          {showSuggestions && filteredSuggestions.length > 0 && stops.length > 0 && (
            <div className="my-3 border-t border-border"></div>
          )}

          <ScrollArea className="h-[calc(100vh-20rem)]">
            {stops.length === 0 ? (
              <div className="text-center text-sm text-muted-foreground p-8 border border-dashed rounded-lg">
                <MapPin className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>Chưa có điểm dừng</p>
                <p className="text-xs mt-1">
                  {mapMode === 'add'
                    ? 'Click trên bản đồ hoặc tìm kiếm để thêm'
                    : 'Bật chế độ thêm để bắt đầu'}
                </p>
              </div>
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={stops.map((s) => s.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-2">
                    {stops.map((stop, index) => (
                      <SortableStopItem 
                        key={stop.id} 
                        stop={stop} 
                        index={index}
                        onUpdateStop={updateStop}
                        onRemoveStop={removeStop}
                        isSelected={selectedStopId === stop.id}
                        onSelect={setSelectedStopId}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            )}
          </ScrollArea>
        </div>

        {/* Route Summary */}
        {routeInfo && stops.length >= 2 && (
          <div className="p-4 border-t bg-muted/30">
            <div className="space-y-2">
              <div className="flex items-center gap-2 mb-2">
                <RouteIcon className="w-4 h-4 text-primary" />
                <Label className="text-sm font-semibold">Thông tin lộ trình</Label>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {routeInfo.distance && (
                  <div className="flex items-center gap-2">
                    <Route className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Khoảng cách:</span>
                    <span className="font-medium">{routeInfo.distance}</span>
                  </div>
                )}
                {routeInfo.duration && (
                  <div className="flex items-center gap-2">
                    <Timer className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Thời gian:</span>
                    <span className="font-medium">{routeInfo.duration}</span>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground pt-1">
                <MapPin className="w-3 h-3" />
                <span>{stops.length + (originStop ? 1 : 0) + (destinationStop ? 1 : 0)} điểm dừng</span>
              </div>
            </div>
          </div>
        )}

        <div className="p-4 border-t mt-auto">
          <Button
            className="w-full"
            onClick={handleSubmit}
            disabled={isSubmitting || !routeName.trim() || !originStop || !destinationStop}
          >
            <Save className="w-4 h-4 mr-2" />
            {isSubmitting
              ? 'Đang lưu...'
              : mode === 'edit'
              ? 'Cập nhật tuyến'
              : 'Tạo tuyến đường'}
          </Button>
        </div>
      </div>

      {/* Map */}
      <div className="flex-1 relative">
        <div ref={mapRef} className="w-full h-full rounded-lg border" />
        {mapMode === 'add' && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10">
            <Card className="p-3 bg-primary/90 text-primary-foreground border-primary shadow-lg">
              <div className="flex items-center gap-2">
                <Navigation className="w-4 h-4" />
                <p className="text-sm font-medium">
                  Click trên bản đồ để thêm điểm dừng
                </p>
              </div>
            </Card>
          </div>
        )}
        {polyline && (
          <div className="absolute bottom-4 right-4 z-10">
            <Card className="p-2 bg-background/90 backdrop-blur-sm border shadow-lg">
              <div className="flex items-center gap-2 text-xs">
                <RouteIcon className="w-4 h-4 text-primary" />
                <span>Lộ trình đã được tính toán</span>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

