"use client";

import { useEffect, useState, useCallback, useRef } from 'react';
import { useAction } from '@/contexts/ActionContext';

interface OnlineUser {
  id: string;
  name: string;
  email: string;
  lastSeen: string | null;
  currentPage?: string | null;
  currentAction?: string | null;
}

interface UseOnlineStatusOptions {
  heartbeatInterval?: number; // seconds
  cleanupInterval?: number; // seconds
}

export function useOnlineStatus(options: UseOnlineStatusOptions = {}) {
  const {
    heartbeatInterval = 10, // Send heartbeat every 10 seconds
    cleanupInterval = 60, // Trigger cleanup every 60 seconds (safety net, not primary detection)
  } = options;

  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [sessionExpired, setSessionExpired] = useState(false);
  const lastKnownPageRef = useRef<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const cleanupIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const { currentAction, actionEntity } = useAction();

  // Send heartbeat to server
  const sendHeartbeat = useCallback(async (currentPage?: string) => {
    // Stop if session has already expired
    if (sessionExpired) {
      return;
    }

    // Update the last known page when provided
    if (currentPage !== undefined) {
      lastKnownPageRef.current = currentPage;
    }

    // Format action state for display
    let formattedAction: string | null = null;
    if (currentAction && actionEntity) {
      const actionVerb = currentAction.charAt(0).toUpperCase() + currentAction.slice(1);
      formattedAction = `${actionVerb} ${actionEntity}`;
    } else if (lastKnownPageRef.current) {
      // Always include the page name as the action when no specific action is set
      formattedAction = lastKnownPageRef.current;
    }

    // Never send null if we have a last known value - send the last known value instead
    const currentPageToSend = lastKnownPageRef.current || null;
    const currentActionToSend = formattedAction || null;

    try {
      const response = await fetch('/api/auth/heartbeat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPage: currentPageToSend,
          currentAction: currentActionToSend
        }),
      });
      if (!response.ok) {
        if (response.status === 401) {
          // Session expired - stop heartbeats and redirect to login
          setSessionExpired(true);
          // Clear sessionStorage flag
          sessionStorage.removeItem('tab_authenticated');
          if (heartbeatIntervalRef.current) {
            clearInterval(heartbeatIntervalRef.current);
            heartbeatIntervalRef.current = null;
          }
          if (cleanupIntervalRef.current) {
            clearInterval(cleanupIntervalRef.current);
            cleanupIntervalRef.current = null;
          }
          if (eventSourceRef.current) {
            eventSourceRef.current.close();
            eventSourceRef.current = null;
          }
          // Redirect to login
          window.location.href = '/login';
        } else {
          console.error('Heartbeat failed:', response.status, response.statusText);
        }
      }
    } catch (error) {
      console.error('Heartbeat failed:', error);
    }
  }, [currentAction, actionEntity, sessionExpired]); // Include sessionExpired in dependencies

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
    // Don't set up intervals if session has expired
    if (sessionExpired) {
      return;
    }

    // Clear any existing intervals before setting up new ones
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
    }
    if (cleanupIntervalRef.current) {
      clearInterval(cleanupIntervalRef.current);
    }

    // Set up heartbeat interval - will use last known page
    heartbeatIntervalRef.current = setInterval(() => sendHeartbeat(), heartbeatInterval * 1000);

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

    // Handle visibility change for more accurate online tracking
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        markOffline();
        // Clear heartbeat when hidden to save resources
        if (heartbeatIntervalRef.current) {
          clearInterval(heartbeatIntervalRef.current);
          heartbeatIntervalRef.current = null;
        }
      } else if (document.visibilityState === 'visible' && !sessionExpired) {
        // Resume heartbeat when visible
        sendHeartbeat();
        if (!heartbeatIntervalRef.current) {
          heartbeatIntervalRef.current = setInterval(() => sendHeartbeat(), heartbeatInterval * 1000);
        }
      }
    };

    // Add event listeners for instant offline detection
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('pagehide', handlePageHide);
    document.addEventListener('visibilitychange', handleVisibilityChange);

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
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [heartbeatInterval, cleanupInterval, sessionExpired]);

  // Send heartbeat immediately when action state changes
  useEffect(() => {
    sendHeartbeat();
  }, [currentAction, actionEntity, sendHeartbeat]);

  return {
    onlineUsers,
    isConnected,
    sendHeartbeat,
    sessionExpired,
  };
}
