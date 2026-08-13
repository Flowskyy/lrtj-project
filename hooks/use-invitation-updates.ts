"use client";

import { useEffect, useState, useCallback, useRef } from 'react';

export function useInvitationUpdates() {
  const [isConnected, setIsConnected] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);
  const onInvitationsUpdatedRef = useRef<((invitations: any[]) => void) | null>(null);

  const onInvitationsUpdated = useCallback((callback: (invitations: any[]) => void) => {
    onInvitationsUpdatedRef.current = callback;
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
  };
}