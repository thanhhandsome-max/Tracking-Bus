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
  Timer
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
  onSaved?: () => void;
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
  const [diemBatDau, setDiemBatDau] = useState(initialRoute?.diemBatDau || '');
  const [diemKetThuc, setDiemKetThuc] = useState(initialRoute?.diemKetThuc || '');
  const [stops, setStops] = useState<Stop[]>(() => {
    if (initialRoute?.stops && initialRoute.stops.length > 0) {
      return initialRoute.stops.map((s: any, idx: number) => ({
        id: String(s.maDiem || s.id || idx + 1),
        name: s.tenDiem || s.name || '',
        address: s.diaChi || s.address || '',
        lat: s.viDo || s.latitude,
        lng: s.kinhDo || s.longitude,
        estimatedTime: s.thoiGianDung || s.estimatedTime || '',
        sequence: s.thuTu || s.sequence || idx + 1,
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

  // Update markers when stops change
  useEffect(() => {
    if (!isMapReady || !mapInstanceRef.current) return;
    updateMarkers();
  }, [stops, isMapReady]);

  // Update route when stops change (với debounce để tránh gọi quá nhiều)
  useEffect(() => {
    console.log('🔄 useEffect [stops] triggered, stops count:', stops.length);
    const timeoutId = setTimeout(() => {
      const validStops = stops.filter((s) => s.lat && s.lng && s.address);
      console.log('🔄 Debounced update, valid stops:', validStops.length);
      if (validStops.length >= 2) {
        console.log('✅ Calling updateRoute from useEffect');
        updateRoute();
      } else {
        console.log('⚠️ Not enough valid stops, clearing');
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
      console.log('🧹 Cleaning up useEffect [stops] timeout');
      clearTimeout(timeoutId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stops]);

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

    // Add new markers
    stops.forEach((stop, index) => {
      if (!stop.lat || !stop.lng) return;

      // Label: A, B, C... cho các điểm dừng
      const label = String.fromCharCode(65 + index); // A=65, B=66, C=67...
      
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
          scale: index === 0 ? 10 : 8, // Điểm đầu lớn hơn
          fillColor: index === 0 ? '#4285F4' : index === stops.length - 1 ? '#EA4335' : '#34A853',
          fillOpacity: 1,
          strokeColor: 'white',
          strokeWeight: 2,
        },
        title: stop.name || `Điểm ${label}`,
        zIndex: index === 0 ? 1000 : 100 + index, // Điểm đầu ở trên cùng
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

    if (stops.length > 0) {
      fitBounds();
    }
  };

  const fitBounds = () => {
    if (!mapInstanceRef.current || stops.length === 0) return;
    if (!window.google?.maps) return;

    const google: typeof window.google = window.google;
    const bounds = new google.maps.LatLngBounds();

    stops.forEach((stop) => {
      if (stop.lat && stop.lng) {
        bounds.extend({ lat: stop.lat, lng: stop.lng });
      }
    });

    mapInstanceRef.current.fitBounds(bounds);
    // Add padding
    const padding = 50;
    mapInstanceRef.current.setOptions({
      zoom: Math.min(mapInstanceRef.current.getZoom() || 13, 15),
    });
  };

  const updateRoute = async () => {
    const validStops = stops.filter((s) => s.lat && s.lng && s.address);
    console.log('🔄 updateRoute called:', { 
      totalStops: stops.length, 
      validStops: validStops.length,
      validStopsData: validStops.map(s => ({ name: s.name, lat: s.lat, lng: s.lng, address: s.address }))
    });
    
    if (validStops.length < 2) {
      console.log('⚠️ Not enough valid stops, clearing polyline');
      setPolyline(null);
      setRouteSegments([]);
      setRouteInfo(null);
      return;
    }

    try {
      console.log('📡 Fetching directions for', validStops.length - 1, 'segments');
      // Lấy directions cho từng đoạn đường
      const segments: Array<{ polyline: string; from: number; to: number }> = [];
      let totalDistance = 0;
      let totalDuration = 0;

      for (let i = 0; i < validStops.length - 1; i++) {
        const from = validStops[i];
        const to = validStops[i + 1];

        try {
          console.log(`📡 Fetching directions segment ${i + 1}/${validStops.length - 1}: ${from.name} → ${to.name}`);
          const response = await apiClient.getDirections({
            origin: `${from.lat},${from.lng}`,
            destination: `${to.lat},${to.lng}`,
            mode: 'driving',
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

      console.log(`📊 Total segments fetched: ${segments.length}/${validStops.length - 1}`);
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

  const updatePolylinesOnMap = () => {
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
      // Check if geometry library is loaded
      if (!google.maps.geometry || !google.maps.geometry.encoding) {
        console.error('❌ Google Maps Geometry library not loaded!', {
          hasGeometry: !!google.maps.geometry,
          hasEncoding: !!google.maps.geometry?.encoding,
          googleMapsKeys: Object.keys(google.maps || {})
        });
        return;
      }

      // Tìm index của điểm dừng được chọn
      const selectedIndex = selectedStopId 
        ? stops.findIndex((s) => s.id === selectedStopId)
        : -1;

      // Tạo polyline cho từng đoạn đường
      routeSegments.forEach((segment, index) => {
        try {
          if (!segment.polyline) {
            console.warn(`⚠️ Segment ${index} has no polyline`);
            return;
          }

          console.log(`🔍 Decoding segment ${index} (${segment.from} → ${segment.to}), polyline length: ${segment.polyline.length}`);
          
          // Decode polyline
          const path = google.maps.geometry.encoding.decodePath(segment.polyline);
          
          console.log(`📍 Decoded path for segment ${index}:`, {
            pathLength: path?.length,
            firstPoint: path?.[0],
            lastPoint: path?.[path.length - 1]
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
          
          // Create new polyline
          const newPolyline = new google.maps.Polyline({
            path,
            geodesic: true,
            strokeColor,
            strokeOpacity,
            strokeWeight,
            map: mapInstanceRef.current,
            zIndex,
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

      const newStop: Stop = {
        id: Date.now().toString(),
        name: `Điểm ${stops.length + 1}`,
        address,
        lat,
        lng,
        estimatedTime: '',
        sequence: stops.length + 1,
      };

      const updatedStops = [...stops, newStop];
      setStops(updatedStops);
      setSelectedStopId(newStop.id);
      
      // Trigger update route ngay lập tức để hiển thị polyline
      if (updatedStops.filter((s) => s.lat && s.lng && s.address).length >= 2) {
        setTimeout(() => {
          updateRoute();
        }, 100);
      }
      
      // Không tự tắt mode "add" - giữ để thêm nhiều điểm
      toast({
        title: 'Đã thêm điểm dừng',
        description: 'Vui lòng nhập tên và thời gian dừng cho điểm này',
      });
    } catch (error) {
      console.error('Failed to reverse geocode:', error);
      // Add stop anyway with coordinates as address
      const newStop: Stop = {
        id: Date.now().toString(),
        name: `Điểm ${stops.length + 1}`,
        address: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
        lat,
        lng,
        estimatedTime: '',
        sequence: stops.length + 1,
      };
      
      const updatedStops = [...stops, newStop];
      setStops(updatedStops);
      setSelectedStopId(newStop.id);
      
      // Trigger update route ngay lập tức để hiển thị polyline
      if (updatedStops.filter((s) => s.lat && s.lng && s.address).length >= 2) {
        setTimeout(() => {
          updateRoute();
        }, 100);
      }
      
      // Không tự tắt mode "add"
    }
  };

  const addStopFromSearch = (place: { name: string; lat: number; lng: number; address: string }) => {
    const newStop: Stop = {
      id: Date.now().toString(),
      name: place.name || `Điểm ${stops.length + 1}`,
      address: place.address || '',
      lat: place.lat,
      lng: place.lng,
      estimatedTime: '',
      sequence: stops.length + 1,
    };

    const updatedStops = [...stops, newStop];
    setStops(updatedStops);
    setSelectedStopId(newStop.id);
    
    // Trigger update route ngay lập tức để hiển thị polyline
    // updateRoute sẽ được gọi tự động qua useEffect, nhưng có thể gọi thủ công để nhanh hơn
    if (updatedStops.filter((s) => s.lat && s.lng && s.address).length >= 2) {
      // Gọi updateRoute sau một chút để đảm bảo state đã được cập nhật
      setTimeout(() => {
        updateRoute();
      }, 100);
    }
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

    const newStops = stops
      .filter((s) => s.id !== id)
      .map((s, idx) => ({ ...s, sequence: idx + 1 }));
    setStops(newStops);
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

      // Update stop coordinates and address
      const updatedStops = stops.map((stop) =>
        stop.id === stopId
          ? { ...stop, lat, lng, address }
          : stop
      );
      setStops(updatedStops);

      // Trigger update route để cập nhật polyline
      if (updatedStops.filter((s) => s.lat && s.lng && s.address).length >= 2) {
        setTimeout(() => {
          updateRoute();
        }, 100);
      }

      toast({
        title: 'Đã di chuyển điểm dừng',
        description: 'Địa chỉ đã được cập nhật tự động',
      });
    } catch (error) {
      console.error('Failed to reverse geocode:', error);
      // Update coordinates anyway
      setStops(
        stops.map((stop) =>
          stop.id === stopId
            ? { ...stop, lat, lng, address: `${lat.toFixed(6)}, ${lng.toFixed(6)}` }
            : stop
        )
      );
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

  const handleSubmit = async () => {
    if (!routeName.trim()) {
      toast({
        title: 'Lỗi',
        description: 'Vui lòng nhập tên tuyến',
        variant: 'destructive',
      });
      return;
    }

    const validStops = stops.filter((s) => s.name.trim() && s.address.trim());
    if (validStops.length === 0) {
      toast({
        title: 'Lỗi',
        description: 'Vui lòng thêm ít nhất một điểm dừng',
        variant: 'destructive',
      });
      return;
    }

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

      // Chuẩn bị diemBatDau và diemKetThuc
      const startPoint = diemBatDau.trim() || stops[0]?.name || 'Điểm bắt đầu';
      const endPoint = diemKetThuc.trim() || stops[stops.length - 1]?.name || 'Điểm kết thúc';
      
      const routePayload: any = {
        tenTuyen: trimmedRouteName,
      };
      
      // Chỉ thêm diemBatDau và diemKetThuc nếu có giá trị (optional theo validation)
      if (startPoint && startPoint.trim().length > 0) {
        routePayload.diemBatDau = startPoint.trim().substring(0, 255);
      }
      if (endPoint && endPoint.trim().length > 0) {
        routePayload.diemKetThuc = endPoint.trim().substring(0, 255);
      }

      if (mode === 'edit' && initialRoute?.id) {
        await apiClient.updateRoute(initialRoute.id, routePayload);
        
        // Invalidate routes cache để refresh danh sách
        queryClient.invalidateQueries({ queryKey: routeKeys.all });
        queryClient.invalidateQueries({ queryKey: routeKeys.detail(initialRoute.id) });
        
        toast({
          title: 'Thành công',
          description: 'Đã cập nhật tuyến đường',
        });
        onSaved?.();
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

        if (validStops.length > 0) {
          // Thêm tất cả stops trước
          const addedStops: any[] = [];
          for (let i = 0; i < validStops.length; i++) {
            const stop = validStops[i];
            try {
              const stopPayload: any = {
                tenDiem: stop.name.trim(),
                address: stop.address.trim() || undefined,
                sequence: i + 1, // Sử dụng index từ vòng lặp thay vì indexOf
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
          
          console.log(`📊 Tổng số điểm dừng đã thêm: ${addedStops.length}/${validStops.length}`);

          // Chỉ rebuild polyline nếu có ít nhất 2 stops đã được thêm thành công
          // Lưu ý: Rebuild polyline là optional, không bắt buộc
          if (addedStops.length >= 2) {
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
        }

        // Invalidate routes cache để refresh danh sách
        queryClient.invalidateQueries({ queryKey: routeKeys.all });
        
        toast({
          title: 'Thành công',
          description: 'Đã tạo tuyến đường mới',
        });
        onSaved?.();
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
  const SortableStopItem = React.memo(({ stop, index }: { stop: Stop; index: number }) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
      id: stop.id,
    });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.5 : 1,
    };

    return (
      <Card
        ref={setNodeRef}
        style={style}
        className={`p-3 cursor-pointer transition-colors ${
          selectedStopId === stop.id
            ? 'border-primary bg-primary/5'
            : 'hover:border-primary/50'
        } ${isDragging ? 'z-50' : ''}`}
        onClick={() => setSelectedStopId(stop.id)}
      >
        <div className="flex items-start gap-2">
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
          <div className="flex-1 min-w-0">
            <Input
              value={stop.name}
              onChange={(e) => updateStop(stop.id, 'name', e.target.value)}
              placeholder="Tên điểm dừng"
              className="text-sm mb-1"
              onClick={(e) => e.stopPropagation()}
            />
            <p className="text-xs text-muted-foreground truncate mb-1">
              {stop.address}
            </p>
            <div className="flex items-center gap-2">
              <Clock className="w-3 h-3 text-muted-foreground" />
              <Input
                type="number"
                value={stop.estimatedTime}
                onChange={(e) => updateStop(stop.id, 'estimatedTime', e.target.value)}
                placeholder="Phút"
                className="text-xs w-16 h-6"
                onClick={(e) => e.stopPropagation()}
              />
              <span className="text-xs text-muted-foreground">phút</span>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-destructive hover:text-destructive"
            onClick={(e) => {
              e.stopPropagation();
              removeStop(stop.id);
            }}
          >
            <Trash2 className="w-3 h-3" />
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

            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Điểm bắt đầu</Label>
                <Input
                  value={diemBatDau}
                  onChange={(e) => setDiemBatDau(e.target.value)}
                  placeholder="VD: Trường TH ABC"
                  className="text-sm"
                />
              </div>
              <div>
                <Label className="text-xs">Điểm kết thúc</Label>
                <Input
                  value={diemKetThuc}
                  onChange={(e) => setDiemKetThuc(e.target.value)}
                  placeholder="VD: Khu dân cư XYZ"
                  className="text-sm"
                />
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
              <Button
                variant={mapMode === 'add' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setMapMode(mapMode === 'add' ? 'view' : 'add')}
              >
                <Plus className="w-3 h-3 mr-1" />
                {mapMode === 'add' ? 'Hủy' : 'Thêm'}
              </Button>
            </div>
          </div>

          {mapMode === 'add' && (
            <div className="mb-3">
              <PlacePicker
                onPlaceSelected={addStopFromSearch}
                placeholder="Tìm kiếm địa điểm..."
              />
              <p className="text-xs text-muted-foreground mt-1">
                Hoặc click trên bản đồ để thêm điểm
              </p>
            </div>
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
                      <SortableStopItem key={stop.id} stop={stop} index={index} />
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
                <span>{stops.length} điểm dừng</span>
              </div>
            </div>
          </div>
        )}

        <div className="p-4 border-t mt-auto">
          <Button
            className="w-full"
            onClick={handleSubmit}
            disabled={isSubmitting || !routeName.trim() || stops.length === 0}
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

