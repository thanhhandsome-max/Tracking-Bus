// src/hooks/useRealtimeBusTracking.ts
import { useState, useEffect, useCallback, useRef } from 'react';

export interface BusLocationData {
  busId: string;
  bus: {
    plateNumber: string;
    capacity: number;
    status: 'active' | 'maintenance';
  };
  location: {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
  };
  speed: number;
  timestamp: Date;
}

interface RealtimeUpdate {
  timestamp: string;
  buses: BusLocationData[];
}

interface UseRealtimeBusTrackingOptions {
  busId?: string; // Nếu có thì chỉ theo dõi 1 xe, không thì theo dõi tất cả
  interval?: number; // Khoảng thời gian update (ms), mặc định 3000
  autoConnect?: boolean; // Tự động kết nối khi mount, mặc định true
}

interface UseRealtimeBusTrackingReturn {
  buses: BusLocationData[];
  isConnected: boolean;
  error: string | null;
  connect: () => void;
  disconnect: () => void;
  reconnect: () => void;
}

/**
 * Custom hook để theo dõi vị trí xe bus real-time qua Server-Sent Events (SSE)
 * 
 * @example
 * // Theo dõi tất cả xe bus
 * const { buses, isConnected } = useRealtimeBusTracking();
 * 
 * @example
 * // Theo dõi một xe cụ thể
 * const { buses, isConnected, error } = useRealtimeBusTracking({ busId: '123' });
 */
export function useRealtimeBusTracking(
  options: UseRealtimeBusTrackingOptions = {}
): UseRealtimeBusTrackingReturn {
  const { busId, interval = 3000, autoConnect = true } = options;

  const [buses, setBuses] = useState<BusLocationData[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);

  const MAX_RECONNECT_ATTEMPTS = 5;
  const RECONNECT_DELAY = 2000;

  // Hàm tạo URL cho SSE endpoint
  const getUrl = useCallback(() => {
    const params = new URLSearchParams();
    if (busId) params.append('busId', busId);
    params.append('interval', interval.toString());
    return `/api/buses/realtime?${params.toString()}`;
  }, [busId, interval]);

  // Hàm kết nối SSE
  const connect = useCallback(() => {
    // Ngắt kết nối cũ nếu có
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const url = getUrl();
    console.log('[useRealtimeBusTracking] Connecting to SSE:', url);

    const eventSource = new EventSource(url);

    eventSource.onopen = () => {
      console.log('[useRealtimeBusTracking] SSE connection opened');
      setIsConnected(true);
      setError(null);
      reconnectAttemptsRef.current = 0; // Reset reconnect counter
    };

    eventSource.onmessage = (event) => {
      try {
        const data: RealtimeUpdate = JSON.parse(event.data);
        console.log('[useRealtimeBusTracking] Received update:', data);
        setBuses(data.buses);
      } catch (err) {
        console.error('[useRealtimeBusTracking] Error parsing SSE data:', err);
        setError('Error parsing location data');
      }
    };

    eventSource.onerror = (err) => {
      console.error('[useRealtimeBusTracking] SSE error:', err);
      setIsConnected(false);
      eventSource.close();

      // Tự động reconnect với exponential backoff
      if (reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS) {
        const delay = RECONNECT_DELAY * Math.pow(2, reconnectAttemptsRef.current);
        console.log(
          `[useRealtimeBusTracking] Reconnecting in ${delay}ms (attempt ${reconnectAttemptsRef.current + 1}/${MAX_RECONNECT_ATTEMPTS})`
        );
        
        reconnectTimeoutRef.current = setTimeout(() => {
          reconnectAttemptsRef.current += 1;
          connect();
        }, delay);
      } else {
        setError('Failed to connect after multiple attempts');
        console.error('[useRealtimeBusTracking] Max reconnect attempts reached');
      }
    };

    eventSourceRef.current = eventSource;
  }, [getUrl]);

  // Hàm ngắt kết nối
  const disconnect = useCallback(() => {
    console.log('[useRealtimeBusTracking] Disconnecting SSE');
    
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    setIsConnected(false);
    reconnectAttemptsRef.current = 0;
  }, []);

  // Hàm reconnect thủ công
  const reconnect = useCallback(() => {
    console.log('[useRealtimeBusTracking] Manual reconnect');
    reconnectAttemptsRef.current = 0;
    disconnect();
    connect();
  }, [connect, disconnect]);

  // Auto-connect khi mount
  useEffect(() => {
    if (autoConnect) {
      connect();
    }

    // Cleanup khi unmount
    return () => {
      disconnect();
    };
  }, [autoConnect, connect, disconnect]);

  return {
    buses,
    isConnected,
    error,
    connect,
    disconnect,
    reconnect,
  };
}
