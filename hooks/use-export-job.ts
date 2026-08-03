import { useState, useRef, useCallback, useEffect } from 'react';

interface ExportParams {
  [key: string]: string | undefined;
}

interface UseExportJobOptions {
  moduleEndpoint: string; // e.g. '/api/larata-club-earning'
  params: ExportParams;
  onComplete?: () => void;
  onError?: (message: string) => void;
}

export function useExportJob({ moduleEndpoint, params, onComplete, onError }: UseExportJobOptions) {
  const [isExporting, setIsExporting] = useState(false);
  const [processed, setProcessed] = useState(0);
  const [total, setTotal] = useState(0);
  const [status, setStatus] = useState<'idle' | 'running' | 'completed' | 'cancelled' | 'error'>('idle');
  const jobIdRef = useRef<string | null>(null);
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Stable, memoized params object - THIS is what was missing/undefined before.
  // Only re-create when the actual param VALUES change, not on every render.
  const paramsKey = JSON.stringify(params);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const memoizedParams = useState(() => params)[0]; 
  // ^ NOTE: if params can change during the component's life (e.g. filters), 
  // replace the line above with a proper useMemo keyed on paramsKey instead:
  // const memoizedParams = useMemo(() => params, [paramsKey]);

  const stopPolling = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  }, []);

  const startPolling = useCallback((currentJobId: string) => {
    stopPolling();
    pollIntervalRef.current = setInterval(async () => {
      try {
        const res = await fetch(`${moduleEndpoint}/export/status/${currentJobId}`);
        if (!res.ok) throw new Error('Status check failed');
        const data = await res.json();
        setProcessed(data.processed ?? 0);
        setTotal(data.total ?? 0);
        setStatus(data.status);

        if (data.status === 'completed') {
          stopPolling();
          setIsExporting(false);
          window.location.href = `${moduleEndpoint}/export/download/${currentJobId}`;
          onComplete?.();
        } else if (data.status === 'cancelled' || data.status === 'error') {
          stopPolling();
          setIsExporting(false);
          if (data.status === 'error') onError?.(data.error || 'Export failed');
        }
      } catch (error: any) {
        stopPolling();
        setIsExporting(false);
        onError?.(error.message);
      }
    }, 1000);
  }, [moduleEndpoint, stopPolling, onComplete, onError]);

  const startExport = useCallback(async () => {
    try {
      setIsExporting(true);
      setStatus('running');
      setProcessed(0);
      setTotal(0);
      const query = new URLSearchParams(memoizedParams as Record<string, string>).toString();
      const res = await fetch(`${moduleEndpoint}/export/start?${query}`, { method: 'POST' });
      if (!res.ok) throw new Error('Failed to start export');
      const data = await res.json();
      jobIdRef.current = data.jobId;
      startPolling(data.jobId);
    } catch (error: any) {
      setIsExporting(false);
      setStatus('error');
      onError?.(error.message);
    }
  }, [moduleEndpoint, memoizedParams, startPolling, onError]);

  const cancelExport = useCallback(async () => {
    if (!jobIdRef.current) return;
    stopPolling();
    try {
      await fetch(`${moduleEndpoint}/export/cancel/${jobIdRef.current}`, { method: 'POST' });
    } finally {
      setIsExporting(false);
      setStatus('cancelled');
    }
  }, [moduleEndpoint, stopPolling]);

  // Auto-cancel on unmount if still running
  useEffect(() => {
    return () => {
      stopPolling();
      if (jobIdRef.current && status === 'running') {
        fetch(`${moduleEndpoint}/export/cancel/${jobIdRef.current}`, { method: 'POST' }).catch(() => {});
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    isExporting,
    processed,
    total,
    percentage: total > 0 ? Math.round((processed / total) * 100) : 0,
    status,
    startExport,
    cancelExport,
  };
}
