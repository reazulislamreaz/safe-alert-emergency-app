import { io, Socket } from 'socket.io-client';
import { ActiveAlert, TelemetryPoint } from '../types';

class SocketService {
  private socket: Socket | null = null;
  private isConnected: boolean = false;
  private listeners: Map<string, Set<Function>> = new Map();
  private asAdmin = true;

  connect(options?: { token?: string | null; asAdmin?: boolean }) {
    const asAdmin = options?.asAdmin !== false;
    const token = options?.token;

    if (this.socket) {
      if (token || asAdmin === false) {
        this.disconnect();
      } else {
        return;
      }
    }

    this.asAdmin = asAdmin;
    const socketUrl =
      (import.meta as any).env?.VITE_SOCKET_URL ||
      (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5000');

    this.socket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
      auth: token ? { token } : undefined,
    });

    this.socket.on('connect', () => {
      this.isConnected = true;
      if (this.asAdmin) {
        this.socket?.emit('admin:subscribe');
      }
      this.notifyListeners('connection:change', true);
    });

    this.socket.on('disconnect', () => {
      this.isConnected = false;
      this.notifyListeners('connection:change', false);
    });

    this.socket.on('admin:alert:new', (alert: ActiveAlert) => {
      this.notifyListeners('alert:new', alert);
    });

    this.socket.on('admin:alert:resolved', (alert: ActiveAlert) => {
      this.notifyListeners('alert:resolved', alert);
    });

    this.socket.on('admin:alert:telemetry', (data: { alertId: string; location: any }) => {
      this.notifyListeners('alert:telemetry', data);
    });

    this.socket.on('alert:telemetry:update', (data: {
      alertId: string;
      location: any;
      latestPoint: TelemetryPoint;
    }) => {
      this.notifyListeners('alert:telemetry:update', data);
    });

    this.socket.on('alert:messages:update', (messages: any[]) => {
      this.notifyListeners('alert:messages:update', messages);
    });

    this.socket.on('alert:state', (alert: ActiveAlert) => {
      this.notifyListeners('alert:state', alert);
    });

    this.socket.on('presence:changed', (payload: {
      userId: string;
      phoneDigits: string;
      online: boolean;
    }) => {
      this.notifyListeners('presence:changed', payload);
    });
  }

  disconnect() {
    if (!this.socket) return;
    this.socket.removeAllListeners();
    this.socket.disconnect();
    this.socket = null;
    this.isConnected = false;
  }

  joinAlertRoom(alertId: string) {
    this.socket?.emit('alert:join', alertId);
  }

  sendTelemetryUpdate(alertId: string, telemetry: {
    latitude: number;
    longitude: number;
    speed: number;
    heading: number;
    accuracy: number;
    batteryLevel: number;
  }) {
    this.socket?.emit('alert:telemetry', {
      alertId,
      ...telemetry,
    });
  }

  sendMessage(alertId: string, sender: string, text: string) {
    this.socket?.emit('alert:message:send', { alertId, sender, text });
  }

  sendQuickResponse(alertId: string, sender: string, action: 'need_help' | 'send_location' | 'im_safe') {
    this.socket?.emit('alert:quick_response', { alertId, sender, action });
  }

  on(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);

    return () => {
      this.listeners.get(event)?.delete(callback);
    };
  }

  private notifyListeners(event: string, data: any) {
    this.listeners.get(event)?.forEach((cb) => {
      try {
        cb(data);
      } catch (err) {
        console.error('Error in socket event listener:', err);
      }
    });
  }

  get connected(): boolean {
    return this.isConnected;
  }
}

export const socketService = new SocketService();
