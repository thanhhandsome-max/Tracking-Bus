// Lightweight Socket client stub
// This file provides a simple interface for a socket client but does NOT open any real connection.
// Use this as a placeholder until you wire a real WebSocket or Socket.IO client.

type Handler = (...args: any[]) => void

export interface SocketClient {
  connect: () => Promise<void>
  disconnect: () => void
  on: (event: string, handler: Handler) => void
  off: (event: string, handler?: Handler) => void
  emit: (event: string, ...args: any[]) => void
  isConnected: () => boolean
}

export function createSocketClient(): SocketClient {
  const listeners: Record<string, Set<Handler>> = {}
  let connected = false

  return {
    async connect() {
      // Intentionally do not open a network connection in this stub.
      // Consumers can call this to simulate connecting; returns resolved promise.
      connected = true
      return Promise.resolve()
    },
    disconnect() {
      connected = false
    },
    on(event: string, handler: Handler) {
      if (!listeners[event]) listeners[event] = new Set()
      listeners[event].add(handler)
    },
    off(event: string, handler?: Handler) {
      if (!listeners[event]) return
      if (handler) listeners[event].delete(handler)
      else listeners[event].clear()
    },
    emit(event: string, ...args: any[]) {
      const set = listeners[event]
      if (!set) return
      set.forEach((h) => {
        try {
          h(...args)
        } catch (e) {
          // swallow handler errors in stub
          // console.error(e)
        }
      })
    },
    isConnected() {
      return connected
    }
  }
}
