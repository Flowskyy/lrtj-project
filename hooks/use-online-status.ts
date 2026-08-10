"use client";

import { useEffect, useState, useCallback, useRef } from 'react';

interface OnlineUser {
  id: string;
  name: string;
  email: string;
  lastSeen: string | null;
}

interface UseOnlineStatusOptions {
  heartbeatInterval?: number; // seconds
  cleanupInterval?: number; // seconds
}

export function useOnlineStatus(options: UseOnlineStatusOptions = {}) {
  const {
    heartbeatInterval = 30, // Send heartbeat every 30 seconds
    cleanupInterval = 60, // Trigger cleanup every 60 seconds
  } = options;

  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const cleanupIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Send heartbeat to server
  const sendHeartbeat = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/heartbeat', { method: 'POST' });
      if (!response.ok) {
        console.error('Heartbeat failed:', response.status, response.statusText);
      } else {
        const data = await response.json();
        console.log('Heartbeat successful:', data);
      }
    } catch (error) {
      console.error('Heartbeat failed:', error);
    }
  }, []);

  // Trigger cleanup of offline users
  const triggerCleanup = useCallback(async () => {
    try {
      await fetch('/api/auth/cleanup-offline', { method: 'POST' });
    } catch (error) {
      console.error('Cleanup failed:', error);
    }
  }, []);

  useEffect(() => {
    // Send initial heartbeat
    sendHeartbeat();

    // Set up heartbeat interval
    heartbeatIntervalRef.current = setInterval(sendHeartbeat, heartbeatInterval * 1000);

    // Set up cleanup interval
    cleanupIntervalRef.current = setInterval(triggerCleanup, cleanupInterval * 1000);

    // Set up SSE connection
    const eventSource = new EventSource('/api/auth/online-status');
    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      setIsConnected(true);
    };

    eventSource.onerror = (error) => {
      console.error('SSE error:', error);
      setIsConnected(false);
    };

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('SSE received:', data);
        
        if (data.type === 'initial' || data.type === 'update') {
          setOnlineUsers(data.users);
        }
      } catch (error) {
        console.error('Failed to parse SSE data:', error);
      }
    };

    // Cleanup function
    return () => {
      eventSource.close();
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
      }
      if (cleanupIntervalRef.current) {
        clearInterval(cleanupIntervalRef.current);
      }
    };
  }, [heartbeatInterval, cleanupInterval, sendHeartbeat, triggerCleanup]);

  return {
    onlineUsers,
    isConnected,
    sendHeartbeat,
  };
}
