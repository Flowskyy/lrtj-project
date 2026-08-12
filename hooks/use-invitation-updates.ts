"use client";

import { useEffect, useState, useCallback, useRef } from 'react';

export function useInvitationUpdates() {
  const [isConnected, setIsConnected] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);
  const onInvitationsUpdatedRef = useRef<((invitations: any[]) => void) | null>(null);
  const onPendingUsersUpdatedRef = useRef<((users: any[]) => void) | null>(null);

  const onInvitationsUpdated = useCallback((callback: (invitations: any[]) => void) => {
    onInvitationsUpdatedRef.current = callback;
  }, []);

  const onPendingUsersUpdated = useCallback((callback: (users: any[]) => void) => {
    onPendingUsersUpdatedRef.current = callback;
  }, []);

  useEffect(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const eventSource = new EventSource('/api/admin-invitations/updates');
    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      setIsConnected(true);
    };

    eventSource.onerror = (error) => {
      console.error('Invitation SSE error:', error);
      setIsConnected(false);
    };

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === 'invitations_updated') {
          if (onInvitationsUpdatedRef.current) onInvitationsUpdatedRef.current(data.invitations);
        } else if (data.type === 'pending_users_updated') {
          if (onPendingUsersUpdatedRef.current) onPendingUsersUpdatedRef.current(data.users);
        }
      } catch (error) {
        console.error('Failed to parse invitation SSE data:', error);
      }
    };

    return () => {
      eventSource.close();
      if (eventSourceRef.current) {
        eventSourceRef.current = null;
      }
    };
  }, []);

  return {
    isConnected,
    onInvitationsUpdated,
    onPendingUsersUpdated,
  };
}