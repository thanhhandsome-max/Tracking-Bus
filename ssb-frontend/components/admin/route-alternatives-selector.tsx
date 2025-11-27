'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import apiClient from '@/lib/api-client';
import { loadGoogleMaps } from '@/lib/maps/googleLoader';
import { 
  Route, 
  Users, 
  MapPin, 
  Timer, 
  CheckCircle2,
  Loader2,
  TrendingUp
} from 'lucide-react';

interface Student {
  maHocSinh: number;
  hoTen: string;
  lop: string;
  diaChi: string;
  viDo: number;
  kinhDo: number;
  anhDaiDien?: string;
}

export interface RouteAlternative {
  id: number;
  polyline: string;
  distance: number; // meters
  duration: number; // seconds
  studentCount: number;
  students: Student[];
  segments: Array<{ polyline: string; from: number; to: number }>;
  waypoints?: Array<{ lat: number; lng: number; name?: string }>;
}

interface RouteAlternativesSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  origin: { lat: number; lng: number; name: string };
  destination: { lat: number; lng: number; name: string };
  onRouteSelected: (route: RouteAlternative) => void;
}

export function RouteAlternativesSelector({
  open,
  onOpenChange,
  origin,
  destination,
  onRouteSelected,
}: RouteAlternativesSelectorProps) {
  const { toast } = useToast();
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const polylinesRef = useRef<Map<number, google.maps.Polyline>>(new Map());
  const markersRef = useRef<Map<string, google.maps.Marker>>(new Map());
  const studentMarkersRef = useRef<Map<number, google.maps.Marker>>(new Map());
  
  const [isMapReady, setIsMapReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [alternatives, setAlternatives] = useState<RouteAlternative[]>([]);
  const [selectedRouteId, setSelectedRouteId] = useState<number | null>(null);
  const [studentsByRoute, setStudentsByRoute] = useState<Map<number, Array<{
    maHocSinh: number;
    hoTen: string;
    lop: string;
    diaChi: string;
    viDo: number;
    kinhDo: number;
  }>>>(new Map());

  // Initialize map
  useEffect(() => {
    if (!open || !mapRef.current) return;

    const initMap = async () => {
      try {
        const google = await loadGoogleMaps();
        if (!mapRef.current) return;

        await new Promise((resolve) => setTimeout(resolve, 100));

        if (!window.google?.maps?.Map) {
          await new Promise((resolve) => setTimeout(resolve, 500));
          if (!window.google?.maps?.Map) {
            throw new Error('Google Maps Map constructor is not available');
          }
        }

        const googleMaps = window.google.maps;
        const map = new googleMaps.Map(mapRef.current, {
          center: { 
            lat: (origin.lat + destination.lat) / 2, 
            lng: (origin.lng + destination.lng) / 2 
          },
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
          description: 'Không thể khởi tạo bản đồ',
          variant: 'destructive',
        });
      }
    };

    initMap();
  }, [open, origin, destination, toast]);

  // Quét học sinh dọc theo mỗi tuyến đường - Định nghĩa trước để generateAlternatives có thể sử dụng
  const scanStudentsForAllRoutes = useCallback(async (routes: RouteAlternative[]) => {
    if (!window.google?.maps?.geometry?.encoding) {
      console.error('❌ Google Maps Geometry library not loaded');
      return;
    }

    const google = window.google.maps;
    const corridorRadiusKm = 3.0; // 3km mỗi bên
    const corridorRadiusMeters = corridorRadiusKm * 1000;

    console.log('🔄 Starting to scan students for all routes...');

    // Load tất cả học sinh
    let allStudentsData: any[] = [];
    let currentPage = 1;
    let hasMore = true;
    const pageSize = 200;

    while (hasMore) {
      try {
        const response: any = await apiClient.request({
          method: 'get',
          url: '/students',
          params: { limit: pageSize, page: currentPage },
        });

        let pageStudents: any[] = [];
        if (response && typeof response === 'object') {
          const resp = response as any;
          if (Array.isArray(resp.data)) {
            pageStudents = resp.data;
          } else if (Array.isArray(resp)) {
            pageStudents = resp;
          }
        } else if (Array.isArray(response)) {
          pageStudents = response;
        }

        if (pageStudents.length > 0) {
          allStudentsData = [...allStudentsData, ...pageStudents];
        }

        const resp = response as any;
        const meta = resp?.meta || resp?.pagination || {};
        const totalPages = meta.totalPages || 1;
        const total = meta.total || meta.totalItems || 0;

        if (pageStudents.length === 0 || currentPage >= totalPages || (total > 0 && allStudentsData.length >= total)) {
          hasMore = false;
        } else {
          currentPage++;
        }
      } catch (error: any) {
        console.error(`❌ Page ${currentPage} failed:`, error);
        hasMore = false;
      }
    }

    console.log(`👥 Loaded ${allStudentsData.length} total students from database`);

    // Đếm học sinh có tọa độ hợp lệ
    let validCoordsCount = 0;
    let invalidCoordsCount = 0;
    const sampleInvalidStudents: any[] = [];

    allStudentsData.forEach((s: any) => {
      let viDo: number | null = null;
      let kinhDo: number | null = null;
      
      if (s.viDo != null && s.viDo !== '') {
        viDo = typeof s.viDo === 'string' ? parseFloat(s.viDo) : Number(s.viDo);
      }
      if (s.kinhDo != null && s.kinhDo !== '') {
        kinhDo = typeof s.kinhDo === 'string' ? parseFloat(s.kinhDo) : Number(s.kinhDo);
      }

      if (!viDo || !kinhDo || 
          isNaN(viDo) || isNaN(kinhDo) || 
          !isFinite(viDo) || !isFinite(kinhDo) ||
          viDo === 0 || kinhDo === 0 ||
          Math.abs(viDo) > 90 || Math.abs(kinhDo) > 180) {
        invalidCoordsCount++;
        if (sampleInvalidStudents.length < 3) {
          sampleInvalidStudents.push({ maHocSinh: s.maHocSinh, hoTen: s.hoTen, viDo: s.viDo, kinhDo: s.kinhDo });
        }
      } else {
        validCoordsCount++;
      }
    });

    console.log(`📍 Students with valid coordinates: ${validCoordsCount}`);
    console.log(`⚠️ Students with invalid coordinates: ${invalidCoordsCount}`);
    if (sampleInvalidStudents.length > 0) {
      console.log('📋 Sample invalid students:', sampleInvalidStudents);
    }

    // Helper function: Tính khoảng cách từ điểm đến đoạn thẳng
    const distancePointToSegment = (
      pointLat: number,
      pointLng: number,
      segStartLat: number,
      segStartLng: number,
      segEndLat: number,
      segEndLng: number
    ): number => {
      const point = new google.LatLng(pointLat, pointLng);
      const segStart = new google.LatLng(segStartLat, segStartLng);
      const segEnd = new google.LatLng(segEndLat, segEndLng);
      
      const distToStart = google.geometry.spherical.computeDistanceBetween(point, segStart);
      const distToEnd = google.geometry.spherical.computeDistanceBetween(point, segEnd);
      const segLength = google.geometry.spherical.computeDistanceBetween(segStart, segEnd);
      
      if (segLength === 0) return distToStart;
      
      // Tính góc giữa vector từ start đến point và từ start đến end
      const bearing1 = google.geometry.spherical.computeHeading(segStart, point);
      const bearing2 = google.geometry.spherical.computeHeading(segStart, segEnd);
      
      // Tính khoảng cách vuông góc từ point đến đoạn thẳng
      const angle = Math.abs(bearing1 - bearing2) * Math.PI / 180;
      const perpendicularDist = distToStart * Math.sin(angle);
      
      // Kiểm tra xem điểm có nằm trong đoạn không (projection)
      const projectionDist = distToStart * Math.cos(angle);
      if (projectionDist < 0 || projectionDist > segLength) {
        // Nếu không, trả về khoảng cách đến điểm gần nhất
        return Math.min(distToStart, distToEnd);
      }
      
      return perpendicularDist;
    };

    // Tính khoảng cách tối thiểu từ điểm đến polyline
    const minDistancePointToPolyline = (pointLat: number, pointLng: number, polylinePoints: Array<{ lat: number; lng: number }>): number => {
      if (polylinePoints.length < 2) return Infinity;
      
      let minDist = Infinity;
      for (let i = 0; i < polylinePoints.length - 1; i++) {
        const segStart = polylinePoints[i];
        const segEnd = polylinePoints[i + 1];
        const dist = distancePointToSegment(pointLat, pointLng, segStart.lat, segStart.lng, segEnd.lat, segEnd.lng);
        minDist = Math.min(minDist, dist);
      }
      
      return minDist;
    };

    // Quét học sinh cho mỗi tuyến đường
    const studentsByRouteMap = new Map<number, Student[]>();

    for (const route of routes) {
      console.log(`\n🔄 Scanning Route ${route.id}...`);
      console.log(`   Route polyline: ${route.polyline ? route.polyline.substring(0, 50) + '...' : 'MISSING'}`);
      console.log(`   Route segments: ${route.segments?.length || 0}`);
      
      // Decode polyline - thử cả route.polyline và route.segments
      const allPolylinePoints: Array<{ lat: number; lng: number }> = [];
      
      // Ưu tiên decode từ route.polyline (polyline chính)
      if (route.polyline) {
        try {
          const decodedPath = google.geometry.encoding.decodePath(route.polyline);
          decodedPath.forEach(point => {
            allPolylinePoints.push({ lat: point.lat(), lng: point.lng() });
          });
          console.log(`   ✅ Decoded ${decodedPath.length} points from route.polyline`);
        } catch (error) {
          console.error(`   ❌ Failed to decode route.polyline for route ${route.id}:`, error);
        }
      }
      
      // Nếu chưa có điểm, thử decode từ segments
      if (allPolylinePoints.length === 0 && route.segments && route.segments.length > 0) {
        for (const segment of route.segments) {
          try {
            if (segment.polyline) {
              const decodedPath = google.geometry.encoding.decodePath(segment.polyline);
              decodedPath.forEach(point => {
                allPolylinePoints.push({ lat: point.lat(), lng: point.lng() });
              });
              console.log(`   ✅ Decoded ${decodedPath.length} points from segment`);
            }
          } catch (error) {
            console.error(`   ❌ Failed to decode polyline segment for route ${route.id}:`, error);
          }
        }
      }

      if (allPolylinePoints.length < 2) {
        console.warn(`⚠️ Route ${route.id}: Not enough polyline points (${allPolylinePoints.length})`);
        console.warn(`   Route data:`, { 
          hasPolyline: !!route.polyline, 
          segmentsCount: route.segments?.length || 0,
          polylineLength: route.polyline?.length || 0
        });
        studentsByRouteMap.set(route.id, []);
        route.studentCount = 0;
        continue;
      }

      console.log(`📍 Route ${route.id}: Decoded ${allPolylinePoints.length} polyline points`);
      console.log(`   First point: (${allPolylinePoints[0].lat.toFixed(6)}, ${allPolylinePoints[0].lng.toFixed(6)})`);
      console.log(`   Last point: (${allPolylinePoints[allPolylinePoints.length - 1].lat.toFixed(6)}, ${allPolylinePoints[allPolylinePoints.length - 1].lng.toFixed(6)})`);

      // Filter học sinh trong phạm vi 3km mỗi bên
      let studentsInRange = 0;
      let studentsOutOfRange = 0;
      const sampleDistances: Array<{ name: string; distance: number; coords: string }> = [];
      let checkedCount = 0;

      const studentsInRoute = allStudentsData
        .filter((s: any) => {
          checkedCount++;
          let viDo: number | null = null;
          let kinhDo: number | null = null;
          
          if (s.viDo != null && s.viDo !== '') {
            viDo = typeof s.viDo === 'string' ? parseFloat(s.viDo) : Number(s.viDo);
          }
          if (s.kinhDo != null && s.kinhDo !== '') {
            kinhDo = typeof s.kinhDo === 'string' ? parseFloat(s.kinhDo) : Number(s.kinhDo);
          }

          if (!viDo || !kinhDo || 
              isNaN(viDo) || isNaN(kinhDo) || 
              !isFinite(viDo) || !isFinite(kinhDo) ||
              viDo === 0 || kinhDo === 0 ||
              Math.abs(viDo) > 90 || Math.abs(kinhDo) > 180) {
            return false;
          }

          const distToCorridor = minDistancePointToPolyline(viDo, kinhDo, allPolylinePoints);
          
          // Log một vài ví dụ về khoảng cách (bao gồm cả học sinh gần và xa)
          if (sampleDistances.length < 10) {
            sampleDistances.push({ 
              name: s.hoTen || 'Unknown', 
              distance: distToCorridor,
              coords: `(${viDo.toFixed(6)}, ${kinhDo.toFixed(6)})`
            });
          } else if (distToCorridor <= corridorRadiusMeters && sampleDistances.length < 15) {
            // Thêm thêm một vài học sinh trong phạm vi
            sampleDistances.push({ 
              name: s.hoTen || 'Unknown', 
              distance: distToCorridor,
              coords: `(${viDo.toFixed(6)}, ${kinhDo.toFixed(6)})`
            });
          }

          if (distToCorridor <= corridorRadiusMeters) {
            studentsInRange++;
            return true;
          } else {
            studentsOutOfRange++;
            return false;
          }
        })
        .map((s: any) => {
          let viDo = typeof s.viDo === 'string' ? parseFloat(s.viDo) : Number(s.viDo);
          let kinhDo = typeof s.kinhDo === 'string' ? parseFloat(s.kinhDo) : Number(s.kinhDo);
          
          return {
            maHocSinh: s.maHocSinh,
            hoTen: s.hoTen,
            lop: s.lop,
            diaChi: s.diaChi,
            viDo: Number(viDo),
            kinhDo: Number(kinhDo),
            anhDaiDien: s.anhDaiDien,
          };
        });

      console.log(`✅ Route ${route.id}: Found ${studentsInRoute.length} students in ${corridorRadiusKm}km corridor`);
      console.log(`   📊 Checked ${checkedCount} students: In range: ${studentsInRange}, Out of range: ${studentsOutOfRange}`);
      if (sampleDistances.length > 0) {
        console.log(`   📏 Sample distances (first 10 students):`);
        sampleDistances.slice(0, 10).forEach((d, idx) => {
          console.log(`      ${idx + 1}. ${d.name}: ${d.distance.toFixed(0)}m ${d.distance <= corridorRadiusMeters ? '✅ IN RANGE' : '❌ OUT'} - ${d.coords}`);
        });
        // Log học sinh gần nhất và xa nhất
        const sortedDistances = [...sampleDistances].sort((a, b) => a.distance - b.distance);
        if (sortedDistances.length > 0) {
          console.log(`   🎯 Closest student: ${sortedDistances[0].name} at ${sortedDistances[0].distance.toFixed(0)}m`);
          console.log(`   🎯 Farthest student (in sample): ${sortedDistances[sortedDistances.length - 1].name} at ${sortedDistances[sortedDistances.length - 1].distance.toFixed(0)}m`);
        }
      }

      studentsByRouteMap.set(route.id, studentsInRoute);
      route.studentCount = studentsInRoute.length;
      route.students = studentsInRoute;
    }

    console.log(`\n✅ Completed scanning all routes. Total routes: ${routes.length}`);
    console.log(`📊 Students by route:`, Array.from(studentsByRouteMap.entries()).map(([id, students]) => ({
      routeId: id,
      studentCount: students.length
    })));

    // Cập nhật routes với studentCount và students
    const updatedRoutes = routes.map(route => ({
      ...route,
      studentCount: studentsByRouteMap.get(route.id)?.length || 0,
      students: studentsByRouteMap.get(route.id) || []
    }));

    setStudentsByRoute(studentsByRouteMap);
    setAlternatives(updatedRoutes); // Update với studentCount và students

    // Tự động chọn tuyến có nhiều học sinh nhất
    if (updatedRoutes.length > 0) {
      const bestRoute = updatedRoutes.reduce((prev, current) =>
        (prev.studentCount > current.studentCount) ? prev : current
      );
      console.log(`🎯 Auto-selecting route ${bestRoute.id} with ${bestRoute.studentCount} students`);
      setSelectedRouteId(bestRoute.id);
    }

    toast({
      title: 'Đã quét học sinh',
      description: `Đã quét ${validCoordsCount} học sinh có tọa độ hợp lệ cho ${routes.length} tuyến đường`,
      variant: 'default',
    });
  }, [toast]);

  // Generate route alternatives - Định nghĩa sau scanStudentsForAllRoutes
  const generateAlternatives = useCallback(async () => {
    if (!origin || !destination) return;

    setLoading(true);
    try {
      console.log('🔄 Generating route alternatives...');

      // Tạo nhiều tuyến đường bằng cách thêm waypoints khác nhau
      const alternativesList: RouteAlternative[] = [];

      // Tuyến 1: Direct route (không có waypoint)
      try {
        const directResponse = await apiClient.getDirections({
          origin: `${origin.lat},${origin.lng}`,
          destination: `${destination.lat},${destination.lng}`,
          mode: 'driving',
          vehicleType: 'bus',
        });

        if (directResponse.success && (directResponse.data as any)?.polyline) {
          const data = directResponse.data as any;
          alternativesList.push({
            id: 1,
            polyline: data.polyline,
            distance: data.distance || 0,
            duration: data.duration || 0,
            studentCount: 0,
            students: [],
            segments: [{ polyline: data.polyline, from: 0, to: 1 }],
          });
        }
      } catch (error) {
        console.error('Failed to get direct route:', error);
      }

      // Tuyến 2-5: Tạo các tuyến với waypoints khác nhau
      const midLat = (origin.lat + destination.lat) / 2;
      const midLng = (origin.lng + destination.lng) / 2;
      const deltaLat = destination.lat - origin.lat;
      const deltaLng = destination.lng - origin.lng;

      const waypointVariations = [
        { lat: midLat + Math.abs(deltaLat) * 0.3, lng: midLng },
        { lat: midLat - Math.abs(deltaLat) * 0.3, lng: midLng },
        { lat: midLat, lng: midLng + Math.abs(deltaLng) * 0.3 },
        { lat: midLat, lng: midLng - Math.abs(deltaLng) * 0.3 },
      ];

      for (let i = 0; i < waypointVariations.length && alternativesList.length < 5; i++) {
        try {
          const waypoint = waypointVariations[i];
          const response = await apiClient.getDirections({
            origin: `${origin.lat},${origin.lng}`,
            destination: `${destination.lat},${destination.lng}`,
            waypoints: [{ location: `${waypoint.lat},${waypoint.lng}` }],
            mode: 'driving',
            vehicleType: 'bus',
          });

          if (response.success && (response.data as any)?.polyline) {
            const data = response.data as any;
            alternativesList.push({
              id: alternativesList.length + 1,
              polyline: data.polyline,
              distance: data.distance || 0,
              duration: data.duration || 0,
              studentCount: 0,
              students: [],
              segments: [{ polyline: data.polyline, from: 0, to: 1 }],
              waypoints: [{ lat: waypoint.lat, lng: waypoint.lng }],
            });
          }
        } catch (error) {
          console.error(`Failed to get route with waypoint ${i + 1}:`, error);
        }
      }

      console.log(`✅ Generated ${alternativesList.length} route alternatives`);
      setAlternatives(alternativesList);

      // Quét học sinh dọc theo mỗi tuyến
      await scanStudentsForAllRoutes(alternativesList);

    } catch (error: any) {
      console.error('Failed to generate alternatives:', error);
      toast({
        title: 'Lỗi',
        description: error?.message || 'Không thể tạo các tuyến đường đề xuất',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [origin, destination, toast, scanStudentsForAllRoutes]);

  // Render routes on map
  useEffect(() => {
    if (!isMapReady || !mapInstanceRef.current || alternatives.length === 0) return;
    if (!window.google?.maps) return;

    const google = window.google.maps;

    // Clear old polylines
    polylinesRef.current.forEach((polyline) => {
      polyline.setMap(null);
    });
    polylinesRef.current.clear();

    // Render each route
    alternatives.forEach((route) => {
      try {
        if (!route.polyline) return;

        const decodedPath = google.geometry.encoding.decodePath(route.polyline);
        const isSelected = route.id === selectedRouteId;

        const polyline = new google.Polyline({
          path: decodedPath,
          geodesic: true,
          strokeColor: isSelected ? '#1a73e8' : '#4285F4',
          strokeOpacity: isSelected ? 1.0 : 0.5,
          strokeWeight: isSelected ? 6 : 4,
          map: mapInstanceRef.current,
          zIndex: isSelected ? 1000 : 100 - route.id,
        });

        polylinesRef.current.set(route.id, polyline);
      } catch (error) {
        console.error(`Failed to render route ${route.id}:`, error);
      }
    });

    // Fit bounds to show all routes
    if (alternatives.length > 0) {
      const bounds = new google.LatLngBounds();
      alternatives.forEach((route) => {
        if (route.polyline) {
          try {
            const decodedPath = google.geometry.encoding.decodePath(route.polyline);
            decodedPath.forEach(point => bounds.extend(point));
          } catch (error) {
            console.error(`Failed to decode route ${route.id} for bounds:`, error);
          }
        }
      });
      
      if (!bounds.isEmpty()) {
        mapInstanceRef.current?.fitBounds(bounds);
      }
    }
  }, [alternatives, selectedRouteId, isMapReady]);

  // Render student markers for selected route
  useEffect(() => {
    if (!isMapReady || !mapInstanceRef.current || selectedRouteId === null) {
      // Clear student markers if no route selected
      studentMarkersRef.current.forEach((marker) => {
        marker.setMap(null);
      });
      studentMarkersRef.current.clear();
      return;
    }

    if (!window.google?.maps) return;
    const google = window.google.maps;

    // Clear old student markers
    studentMarkersRef.current.forEach((marker) => {
      marker.setMap(null);
    });
    studentMarkersRef.current.clear();

    // Lấy học sinh từ studentsByRoute hoặc từ alternatives
    let students = studentsByRoute.get(selectedRouteId) || [];
    
    // Nếu không có trong studentsByRoute, thử lấy từ alternatives
    if (students.length === 0) {
      const selectedRoute = alternatives.find(r => r.id === selectedRouteId);
      if (selectedRoute?.students) {
        students = selectedRoute.students;
        console.log(`📍 Found ${students.length} students in route.students`);
      }
    }
    
    console.log(`📍 Rendering ${students.length} students for route ${selectedRouteId}`);
    console.log(`   studentsByRoute keys:`, Array.from(studentsByRoute.keys()));
    console.log(`   alternatives route IDs:`, alternatives.map(r => r.id));
    
    if (students.length === 0) {
      console.warn(`⚠️ No students found for route ${selectedRouteId}`);
      console.log('Available routes in studentsByRoute:', Array.from(studentsByRoute.keys()));
      console.log('Alternatives:', alternatives.map(r => ({ id: r.id, studentCount: r.studentCount, hasStudents: !!r.students?.length })));
    }
    
    students.forEach((student, index) => {
      if (!student.viDo || !student.kinhDo || isNaN(student.viDo) || isNaN(student.kinhDo)) {
        console.warn(`⚠️ Student ${student.hoTen} (${student.maHocSinh}) has invalid coordinates:`, {
          viDo: student.viDo,
          kinhDo: student.kinhDo,
        });
        return;
      }
      const studentLat = Number(student.viDo);
      const studentLng = Number(student.kinhDo);
      
      const marker = new google.Marker({
        position: { lat: studentLat, lng: studentLng },
        map: mapInstanceRef.current!,
        icon: {
          path: google.SymbolPath.CIRCLE,
          scale: 12,
          fillColor: '#10B981',
          fillOpacity: 1.0,
          strokeColor: 'white',
          strokeWeight: 2,
        },
        title: `${student.hoTen} - ${student.lop}\n${student.diaChi || 'Chưa có địa chỉ'}`,
        zIndex: 500 + index,
        optimized: false, // Quan trọng: tắt tối ưu hóa để không bị cluster
        label: {
          text: student.hoTen?.charAt(0) || 'H',
          color: 'white',
          fontSize: '12px',
          fontWeight: 'bold',
        },
      });

      // Đảm bảo marker hiển thị đúng vị trí
      marker.setPosition({ lat: studentLat, lng: studentLng });
      
      console.log(`   ✅ Created marker for ${student.hoTen} at (${studentLat.toFixed(6)}, ${studentLng.toFixed(6)})`);

      studentMarkersRef.current.set(student.maHocSinh, marker);
    });
  }, [selectedRouteId, studentsByRoute, isMapReady]);

  // Track if we've already generated alternatives for this dialog session
  const hasGeneratedRef = useRef(false);

  // Generate alternatives when dialog opens
  useEffect(() => {
    // Reset flag when dialog closes
    if (!open) {
      hasGeneratedRef.current = false;
      setAlternatives([]);
      setSelectedRouteId(null);
      setStudentsByRoute(new Map());
      return;
    }

    // Only generate once when dialog opens and all conditions are met
    if (open && origin && destination && isMapReady && !hasGeneratedRef.current) {
      console.log('🚀 Dialog opened, starting to generate alternatives...', {
        origin: { lat: origin.lat, lng: origin.lng, name: origin.name },
        destination: { lat: destination.lat, lng: destination.lng, name: destination.name },
        isMapReady
      });
      hasGeneratedRef.current = true;
      generateAlternatives();
    } else {
      if (open && (!origin || !destination)) {
        console.warn('⚠️ Dialog opened but missing origin or destination:', { origin, destination });
      }
      if (open && origin && destination && !isMapReady) {
        console.log('⏳ Waiting for map to be ready...');
      }
      if (open && hasGeneratedRef.current) {
        console.log('⏸️ Already generated alternatives for this session');
      }
    }
  }, [open, origin, destination, isMapReady, generateAlternatives]);

  const handleSelectRoute = (route: RouteAlternative) => {
    setSelectedRouteId(route.id);
  };

  const handleConfirm = () => {
    if (selectedRouteId === null) {
      toast({
        title: 'Chưa chọn tuyến',
        description: 'Vui lòng chọn một tuyến đường trước khi xác nhận',
        variant: 'default',
      });
      return;
    }

    const selectedRoute = alternatives.find(r => r.id === selectedRouteId);
    if (selectedRoute) {
      onRouteSelected(selectedRoute);
      onOpenChange(false);
    }
  };

  // Sort routes by student count (descending)
  const sortedAlternatives = [...alternatives].sort((a, b) => b.studentCount - a.studentCount);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] w-full max-h-[90vh] overflow-hidden flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <DialogTitle className="flex items-center gap-2">
            <Route className="w-5 h-5" />
            Đề xuất tuyến đường
          </DialogTitle>
          <DialogDescription>
            Chọn tuyến đường tốt nhất dựa trên số lượng học sinh trong phạm vi 3km mỗi bên
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 flex gap-4 min-h-0 overflow-hidden px-6">
          {/* Left: Route list */}
          <div className="w-96 flex-shrink-0 flex flex-col border-r">
            <div className="p-4 border-b">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold">Các tuyến đường đề xuất</h3>
                {loading && (
                  <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                {alternatives.length > 0 
                  ? `${alternatives.length} tuyến đường đã được tạo`
                  : 'Đang tạo các tuyến đường...'}
              </p>
            </div>

            <ScrollArea className="flex-1">
              <div className="p-4 space-y-3">
                {sortedAlternatives.map((route) => {
                  const isSelected = route.id === selectedRouteId;
                  const distanceKm = (route.distance / 1000).toFixed(1);
                  const durationMin = Math.round(route.duration / 60);

                  return (
                    <Card
                      key={route.id}
                      className={`cursor-pointer transition-all ${
                        isSelected
                          ? 'border-primary bg-primary/5 shadow-md'
                          : 'hover:border-primary/50'
                      }`}
                      onClick={() => handleSelectRoute(route)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                              isSelected 
                                ? 'bg-primary text-primary-foreground' 
                                : 'bg-muted'
                            }`}>
                              {route.id}
                            </div>
                            <div>
                              <h4 className="font-semibold">Tuyến {route.id}</h4>
                              {route.studentCount > 0 && (
                                <Badge variant="outline" className="mt-1">
                                  <Users className="w-3 h-3 mr-1" />
                                  {route.studentCount} học sinh
                                </Badge>
                              )}
                            </div>
                          </div>
                          {isSelected && (
                            <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
                          )}
                        </div>

                        <div className="space-y-1 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <Route className="w-4 h-4" />
                            <span>{distanceKm} km</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Timer className="w-4 h-4" />
                            <span>{durationMin} phút</span>
                          </div>
                        </div>

                        {route.studentCount === 0 && (
                          <div className="mt-2 text-xs text-yellow-600">
                            ⚠️ Không có học sinh trong phạm vi 3km
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}

                {alternatives.length === 0 && !loading && (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>Chưa có tuyến đường nào</p>
                    <p className="text-xs mt-2">Vui lòng đợi hệ thống tạo tuyến đường...</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Right: Map */}
          <div className="flex-1 relative min-w-0">
            <div ref={mapRef} className="w-full h-full rounded-lg border" />
            {!isMapReady && (
              <div className="absolute inset-0 flex items-center justify-center bg-muted/50">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="px-6 pb-6 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Hủy
          </Button>
          <Button 
            onClick={handleConfirm}
            disabled={selectedRouteId === null || loading}
          >
            <CheckCircle2 className="w-4 h-4 mr-2" />
            Chọn tuyến này
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

