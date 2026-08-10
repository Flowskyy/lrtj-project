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
    heartbeatInterval = 15, // Send heartbeat every 15 seconds
    cleanupInterval = 30, // Trigger cleanup every 30 seconds
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

  // Mark current user as offline immediately (for tab close events)
  const markOffline = useCallback(() => {
    // Use navigator.sendBeacon for reliable delivery during page unload
    if (navigator.sendBeacon) {
      // sendBeacon uses GET by default with empty body, which we handle in the GET endpoint
      navigator.sendBeacon('/api/auth/mark-offline');
      console.log('SendBeacon: Marked user offline');
    } else {
      // Fallback to fetch with keepalive
      fetch('/api/auth/mark-offline', { 
        method: 'POST',
        keepalive: true,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      }).catch(err => console.error('Mark offline fallback failed:', err));
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

    // Handle tab close for instant offline detection
    const handleBeforeUnload = () => {
      markOffline();
    };

    const handlePageHide = () => {
      markOffline();
    };

    // Add event listeners for instant offline detection
    // Note: NOT using visibilitychange because it fires on tab switch/minimize, not just close
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('pagehide', handlePageHide);

    // Cleanup function
    return () => {
      eventSource.close();
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
      }
      if (cleanupIntervalRef.current) {
        clearInterval(cleanupIntervalRef.current);
      }
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('pagehide', handlePageHide);
    };
  }, [heartbeatInterval, cleanupInterval, sendHeartbeat, triggerCleanup, markOffline]);

  return {
    onlineUsers,
    isConnected,
    sendHeartbeat,
  };
}
