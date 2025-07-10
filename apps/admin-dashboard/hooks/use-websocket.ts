'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';

interface WebSocketHookOptions {
  namespace?: string;
  autoConnect?: boolean;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: any) => void;
}

interface WebSocketEvent {
  type: string;
  timestamp: string;
  data: any;
}

export const useWebSocket = (options: WebSocketHookOptions = {}) => {
  const { namespace = '/events', autoConnect = true, onConnect, onDisconnect, onError } = options;

  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [events, setEvents] = useState<WebSocketEvent[]>([]);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  // Get auth token from Redux store
  const { token, user } = useSelector((state: RootState) => state.auth);

  const connect = useCallback(() => {
    if (!token || socketRef.current?.connected) {
      return;
    }

    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

    socketRef.current = io(`${backendUrl}${namespace}`, {
      auth: {
        token,
      },
      transports: ['websocket', 'polling'],
      timeout: 20000,
    });

    const socket = socketRef.current;

    socket.on('connect', () => {
      console.log('WebSocket connected');
      setIsConnected(true);
      setConnectionError(null);
      onConnect?.();
    });

    socket.on('disconnect', () => {
      console.log('WebSocket disconnected');
      setIsConnected(false);
      onDisconnect?.();
    });

    socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      setConnectionError(error.message);
      setIsConnected(false);
      onError?.(error);
    });

    socket.on('error', (error) => {
      console.error('WebSocket error:', error);
      setConnectionError(error.message);
      onError?.(error);
    });

    // Listen for all events and store them
    socket.onAny((eventName, ...args) => {
      if (eventName !== 'connect' && eventName !== 'disconnect') {
        const event: WebSocketEvent = {
          type: eventName,
          timestamp: new Date().toISOString(),
          data: args.length === 1 ? args[0] : args,
        };

        setEvents((prev) => [event, ...prev.slice(0, 99)]); // Keep last 100 events
      }
    });
  }, [token, namespace, onConnect, onDisconnect, onError]);

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
      setIsConnected(false);
    }
  }, []);

  const emit = useCallback((event: string, data?: any) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit(event, data);
    }
  }, []);

  const subscribe = useCallback((event: string, handler: (data: any) => void) => {
    if (socketRef.current) {
      socketRef.current.on(event, handler);

      // Return unsubscribe function
      return () => {
        if (socketRef.current) {
          socketRef.current.off(event, handler);
        }
      };
    }
    return () => {};
  }, []);

  const joinRoom = useCallback(
    (room: string) => {
      emit('join_room', room);
    },
    [emit],
  );

  const leaveRoom = useCallback(
    (room: string) => {
      emit('leave_room', room);
    },
    [emit],
  );

  const clearEvents = useCallback(() => {
    setEvents([]);
  }, []);

  // Auto-connect when token is available
  useEffect(() => {
    if (autoConnect && token && !socketRef.current) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [token, autoConnect, connect, disconnect]);

  // Join user's organization rooms when connected
  useEffect(() => {
    // TODO: Implement when user has organizationMemberships property
    // For now, just connect to default organization if available
    if (isConnected && user) {
      // Join default organization room if available
      // joinRoom(`org:${user.defaultOrganizationId}`);
    }
  }, [isConnected, user, joinRoom]);

  return {
    isConnected,
    connectionError,
    events,
    connect,
    disconnect,
    emit,
    subscribe,
    joinRoom,
    leaveRoom,
    clearEvents,
    socket: socketRef.current,
  };
};

// Hook for listening to specific event types
export const useWebSocketEvent = (
  eventType: string,
  handler: (data: any) => void,
  deps: any[] = [],
) => {
  const { subscribe, isConnected } = useWebSocket();

  useEffect(() => {
    if (!isConnected) return;

    const unsubscribe = subscribe(eventType, handler);
    return unsubscribe;
  }, [isConnected, eventType, subscribe, ...deps]);
};

// Hook for organization-specific events
export const useOrganizationEvents = (
  organizationId: string,
  onEvent?: (event: WebSocketEvent) => void,
) => {
  const { subscribe, joinRoom, leaveRoom, isConnected } = useWebSocket();
  const [organizationEvents, setOrganizationEvents] = useState<WebSocketEvent[]>([]);

  useEffect(() => {
    if (!isConnected || !organizationId) return;

    // Join organization room
    joinRoom(`org:${organizationId}`);

    // Subscribe to organization events
    const unsubscribeOrg = subscribe('organization_update', (data) => {
      if (data.organizationId === organizationId) {
        const event = { type: 'organization_update', timestamp: data.timestamp, data };
        setOrganizationEvents((prev) => [event, ...prev.slice(0, 49)]);
        onEvent?.(event);
      }
    });

    const unsubscribeHierarchy = subscribe('hierarchy_update', (data) => {
      if (data.organizationId === organizationId) {
        const event = { type: 'hierarchy_update', timestamp: data.timestamp, data };
        setOrganizationEvents((prev) => [event, ...prev.slice(0, 49)]);
        onEvent?.(event);
      }
    });

    const unsubscribePolicy = subscribe('policy_update', (data) => {
      if (data.organizationId === organizationId) {
        const event = { type: 'policy_update', timestamp: data.timestamp, data };
        setOrganizationEvents((prev) => [event, ...prev.slice(0, 49)]);
        onEvent?.(event);
      }
    });

    return () => {
      leaveRoom(`org:${organizationId}`);
      unsubscribeOrg();
      unsubscribeHierarchy();
      unsubscribePolicy();
    };
  }, [isConnected, organizationId, subscribe, joinRoom, leaveRoom, onEvent]);

  return {
    organizationEvents,
    clearOrganizationEvents: () => setOrganizationEvents([]),
  };
};

export default useWebSocket;
