import { io, Socket } from "socket.io-client";

const SOCKET_URL =
  process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3001";

class SocketService {
  private socket: Socket | null = null;
  private token: string | null = null;

  connect(token: string) {
    this.token = token;

    if (this.socket?.connected) {
      this.disconnect();
    }

    this.socket = io(SOCKET_URL, {
      auth: {
        token: token,
      },
      transports: ["websocket", "polling"],
    });

    this.setupEventListeners();

    return new Promise<void>((resolve, reject) => {
      this.socket!.on("connect", () => {
        console.log("Connected to Socket.IO server");
        resolve();
      });

      this.socket!.on("connect_error", (error) => {
        console.error("Socket.IO connection error:", error);
        reject(error);
      });
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  private setupEventListeners() {
    if (!this.socket) return;

    // Connection events
    this.socket.on("connect", () => {
      console.log("Socket.IO connected");
    });

    this.socket.on("disconnect", (reason) => {
      console.log("Socket.IO disconnected:", reason);
    });

    this.socket.on("connect_error", (error) => {
      console.error("Socket.IO connection error:", error);
    });

    // Authentication events
    this.socket.on("error", (error) => {
      console.error("Socket.IO error:", error);
    });

    // Bus tracking events
    this.socket.on("joined_bus_tracking", (data) => {
      console.log("Joined bus tracking:", data);
    });

    this.socket.on("left_bus_tracking", (data) => {
      console.log("Left bus tracking:", data);
    });

    this.socket.on("bus_location_update", (data) => {
      console.log("Bus location updated:", data);
      // Emit custom event for components to listen
      window.dispatchEvent(
        new CustomEvent("busLocationUpdate", { detail: data })
      );
    });

    // also support alternate event name 'bus_position_update' (server may emit this)
    this.socket.on("bus_position_update", (data) => {
      console.log("Bus position update (alias):", data);
      window.dispatchEvent(new CustomEvent("busPositionUpdate", { detail: data }));
    });

    this.socket.on("bus_location_response", (data) => {
      console.log("Bus location response:", data);
      window.dispatchEvent(
        new CustomEvent("busLocationResponse", { detail: data })
      );
    });

    // Trip events
    this.socket.on("trip_status_update", (data) => {
      console.log("Trip status updated:", data);
      window.dispatchEvent(
        new CustomEvent("tripStatusUpdate", { detail: data })
      );
    });

    this.socket.on("trip_update_success", (data) => {
      console.log("Trip update success:", data);
      window.dispatchEvent(
        new CustomEvent("tripUpdateSuccess", { detail: data })
      );
    });

    // Student events
    this.socket.on("student_status_update", (data) => {
      console.log("Student status updated:", data);
      window.dispatchEvent(
        new CustomEvent("studentStatusUpdate", { detail: data })
      );
    });

    this.socket.on("student_update_success", (data) => {
      console.log("Student update success:", data);
      window.dispatchEvent(
        new CustomEvent("studentUpdateSuccess", { detail: data })
      );
    });

    // Location update success
    this.socket.on("location_update_success", (data) => {
      console.log("Location update success:", data);
      window.dispatchEvent(
        new CustomEvent("locationUpdateSuccess", { detail: data })
      );
    });

    // Admin notifications
    this.socket.on("admin_notification", (data) => {
      console.log("Admin notification:", data);
      window.dispatchEvent(
        new CustomEvent("adminNotification", { detail: data })
      );
    });

    // Parent notifications
    this.socket.on("parent_notification", (data) => {
      console.log("Parent notification:", data);
      window.dispatchEvent(
        new CustomEvent("parentNotification", { detail: data })
      );
    });
  }

  // Bus tracking methods
  joinBusTracking(busId: number) {
    if (this.socket?.connected) {
      this.socket.emit("join_bus_tracking", { busId });
    }
  }

  leaveBusTracking(busId: number) {
    if (this.socket?.connected) {
      this.socket.emit("leave_bus_tracking", { busId });
    }
  }

  getBusLocation(busId: number) {
    if (this.socket?.connected) {
      this.socket.emit("get_bus_location", { busId });
    }
  }

  updateBusLocation(data: {
    busId: number;
    latitude: number;
    longitude: number;
    speed?: number;
    direction?: number;
    timestamp?: string;
  }) {
    if (this.socket?.connected) {
      this.socket.emit("update_bus_location", data);
    }
  }

  // Trip management methods
  updateTripStatus(data: {
    tripId: number;
    status: string;
    note?: string;
    timestamp?: string;
  }) {
    if (this.socket?.connected) {
      this.socket.emit("update_trip_status", data);
    }
  }

  updateStudentStatus(data: {
    tripId: number;
    studentId: number;
    status: string;
    note?: string;
    timestamp?: string;
  }) {
    if (this.socket?.connected) {
      this.socket.emit("update_student_status", data);
    }
  }

  // Utility methods
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  getSocket(): Socket | null {
    return this.socket;
  }
}

// Create singleton instance
export const socketService = new SocketService();
// expose for debugging in browser console
if (typeof window !== "undefined") {
  ;(window as any).__socketService = socketService;
}
export default socketService;
