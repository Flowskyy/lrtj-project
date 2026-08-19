"use client";

import { useEffect, useState, useCallback, useRef } from 'react';

interface UserListUpdate {
  id: string;
  name: string;
  email: string;
  roleId: number | null;
  roleName: string | null;
  createdAt: string;
  updatedAt: string;
  isOnline: boolean;
  lastSeen: string | null;
  currentPage: string | null;
  lastOnline: string | null;
}

interface UseUserListUpdatesOptions {
  pollingInterval?: number; // seconds
}

export function useUserListUpdates(options: UseUserListUpdatesOptions = {}) {
  const {
    pollingInterval = 3, // Poll every 3 seconds by default
  } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const onUsersAddedRef = useRef<((users: UserListUpdate[]) => void) | null>(null);
  const onUsersDeletedRef = useRef<((userIds: string[]) => void) | null>(null);
  const onUsersUpdatedRef = useRef<((users: UserListUpdate[]) => void) | null>(null);

  // Register callbacks for different event types
  const onUsersAdded = useCallback((callback: (users: UserListUpdate[]) => void) => {
    onUsersAddedRef.current = callback;
  }, []);

  const onUsersDeleted = useCallback((callback: (userIds: string[]) => void) => {
    onUsersDeletedRef.current = callback;
  }, []);

  const onUsersUpdated = useCallback((callback: (users: UserListUpdate[]) => void) => {
    onUsersUpdatedRef.current = callback;
  }, []);

  useEffect(() => {
    // Clear any existing connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    // Set up SSE connection with credentials for cross-origin support
    const eventSource = new EventSource('/api/admin-users/updates', {
      withCredentials: true
    });
    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      setIsConnected(true);
    };

    eventSource.onerror = (error) => {
      console.error('User list SSE error:', error);
      setIsConnected(false);
    };

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === 'connected') {
          setLastUpdate(new Date().toISOString());
        } else if (data.type === 'initial') {
          // Initial data - typically handled by the component's own fetch
          setLastUpdate(new Date().toISOString());
        } else if (data.type === 'users_added') {
          if (onUsersAddedRef.current) {
            onUsersAddedRef.current(data.users);
          }
        } else if (data.type === 'users_deleted') {
          if (onUsersDeletedRef.current) {
            onUsersDeletedRef.current(data.userIds);
          }
        } else if (data.type === 'users_updated') {
          if (onUsersUpdatedRef.current) {
            onUsersUpdatedRef.current(data.users);
          }
        } else if (data.type === 'heartbeat') {
          setLastUpdate(new Date().toISOString());
        }
      } catch (error) {
        console.error('Failed to parse user list SSE data:', error);
      }
    };

    // Cleanup function
    return () => {
      eventSource.close();
      if (eventSourceRef.current) {
        eventSourceRef.current = null;
      }
    };
  }, [pollingInterval]);

  return {
    isConnected,
    lastUpdate,
    onUsersAdded,
    onUsersDeleted,
    onUsersUpdated,
  };
}
