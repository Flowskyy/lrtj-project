"use client";

import { useEffect, useState, useCallback, useRef } from 'react';

export function useActivityLogUpdates() {
  const [isConnected, setIsConnected] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);
  const onLogsAddedRef = useRef<((logs: any[]) => void) | null>(null);
  const onLogsRevertedRef = useRef<((ids: string[]) => void) | null>(null);

  const onLogsAdded = useCallback((callback: (logs: any[]) => void) => {
    onLogsAddedRef.current = callback;
  }, []);

  const onLogsReverted = useCallback((callback: (ids: string[]) => void) => {
    onLogsRevertedRef.current = callback;
  }, []);

  useEffect(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const eventSource = new EventSource('/api/activity-logs/updates');
    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      setIsConnected(true);
    };

    eventSource.onerror = (error) => {
      console.error('Activity log SSE error:', error);
      setIsConnected(false);
    };

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === 'logs_added') {
          if (onLogsAddedRef.current) onLogsAddedRef.current(data.logs);
        } else if (data.type === 'logs_reverted') {
          if (onLogsRevertedRef.current) onLogsRevertedRef.current(data.ids);
        }
      } catch (error) {
        console.error('Failed to parse activity log SSE data:', error);
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
    onLogsAdded,
    onLogsReverted,
  };
}