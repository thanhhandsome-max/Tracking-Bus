import { useEffect, useState, useCallback } from "react";
import { socketService } from "@/lib/socket";

export function useSocket() {
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    setIsConnected(socketService.isConnected());

    // Listen for connection changes
    const socket = socketService.getSocket();
    if (socket) {
      const handleConnect = () => setIsConnected(true);
      const handleDisconnect = () => setIsConnected(false);

      socket.on("connect", handleConnect);
      socket.on("disconnect", handleDisconnect);

      return () => {
        socket.off("connect", handleConnect);
        socket.off("disconnect", handleDisconnect);
      };
    }
  }, []);

  return {
    isConnected,
    socketService,
  };
}

export function useBusTracking(busId?: number) {
  const [busLocation, setBusLocation] = useState<any>(null);
  const { isConnected } = useSocket();

  useEffect(() => {
    if (!busId || !isConnected) return;

    // Join bus tracking room
    socketService.joinBusTracking(busId);

    // Listen for bus location updates
    const handleBusLocationUpdate = (event: any) => {
      const data = event.detail;
      if (data.busId === busId) {
        setBusLocation(data.location);
      }
    };

    window.addEventListener("busLocationUpdate", handleBusLocationUpdate);

    // Get initial location
    socketService.getBusLocation(busId);

    return () => {
      socketService.leaveBusTracking(busId);
      window.removeEventListener("busLocationUpdate", handleBusLocationUpdate);
    };
  }, [busId, isConnected]);

  const updateBusLocation = useCallback(
    (locationData: {
      latitude: number;
      longitude: number;
      speed?: number;
      direction?: number;
      timestamp?: string;
    }) => {
      if (busId) {
        socketService.updateBusLocation({
          busId,
          ...locationData,
        });
      }
    },
    [busId]
  );

  return {
    busLocation,
    updateBusLocation,
  };
}

export function useTripUpdates(tripId?: number) {
  const [tripStatus, setTripStatus] = useState<any>(null);
  const { isConnected } = useSocket();

  useEffect(() => {
    if (!tripId || !isConnected) return;

    // Listen for trip status updates
    const handleTripStatusUpdate = (event: any) => {
      const data = event.detail;
      if (data.tripId === tripId) {
        setTripStatus(data);
      }
    };

    window.addEventListener("tripStatusUpdate", handleTripStatusUpdate);

    return () => {
      window.removeEventListener("tripStatusUpdate", handleTripStatusUpdate);
    };
  }, [tripId, isConnected]);

  const updateTripStatus = useCallback(
    (statusData: { status: string; note?: string; timestamp?: string }) => {
      if (tripId) {
        socketService.updateTripStatus({
          tripId,
          ...statusData,
        });
      }
    },
    [tripId]
  );

  return {
    tripStatus,
    updateTripStatus,
  };
}

export function useStudentUpdates(tripId?: number, studentId?: number) {
  const [studentStatus, setStudentStatus] = useState<any>(null);
  const { isConnected } = useSocket();

  useEffect(() => {
    if (!tripId || !isConnected) return;

    // Listen for student status updates
    const handleStudentStatusUpdate = (event: any) => {
      const data = event.detail;
      if (
        data.tripId === tripId &&
        (!studentId || data.studentId === studentId)
      ) {
        setStudentStatus(data);
      }
    };

    window.addEventListener("studentStatusUpdate", handleStudentStatusUpdate);

    return () => {
      window.removeEventListener(
        "studentStatusUpdate",
        handleStudentStatusUpdate
      );
    };
  }, [tripId, studentId, isConnected]);

  const updateStudentStatus = useCallback(
    (statusData: { status: string; note?: string; timestamp?: string }) => {
      if (tripId && studentId) {
        socketService.updateStudentStatus({
          tripId,
          studentId,
          ...statusData,
        });
      }
    },
    [tripId, studentId]
  );

  return {
    studentStatus,
    updateStudentStatus,
  };
}

export function useNotifications() {
  const [adminNotifications, setAdminNotifications] = useState<any[]>([]);
  const [parentNotifications, setParentNotifications] = useState<any[]>([]);
  const { isConnected } = useSocket();

  useEffect(() => {
    if (!isConnected) return;

    // Listen for admin notifications
    const handleAdminNotification = (event: any) => {
      setAdminNotifications((prev) => [event.detail, ...prev]);
    };

    // Listen for parent notifications
    const handleParentNotification = (event: any) => {
      setParentNotifications((prev) => [event.detail, ...prev]);
    };

    window.addEventListener("adminNotification", handleAdminNotification);
    window.addEventListener("parentNotification", handleParentNotification);

    return () => {
      window.removeEventListener("adminNotification", handleAdminNotification);
      window.removeEventListener(
        "parentNotification",
        handleParentNotification
      );
    };
  }, [isConnected]);

  const clearAdminNotifications = useCallback(() => {
    setAdminNotifications([]);
  }, []);

  const clearParentNotifications = useCallback(() => {
    setParentNotifications([]);
  }, []);

  return {
    adminNotifications,
    parentNotifications,
    clearAdminNotifications,
    clearParentNotifications,
  };
}
