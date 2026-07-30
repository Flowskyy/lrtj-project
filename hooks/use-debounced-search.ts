import { useCallback, useRef, useEffect } from "react";

interface UseDebouncedSearchOptions {
  delay?: number;
}

export function useDebouncedSearch(options: UseDebouncedSearchOptions = {}) {
  const { delay = 300 } = options;
  const searchDebounceRef = useRef<NodeJS.Timeout | undefined>(undefined);

  const handleSearchChange = useCallback((callback: () => void) => {
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }
    
    searchDebounceRef.current = setTimeout(() => {
      callback();
    }, delay);
  }, [delay]);

  useEffect(() => {
    return () => {
      if (searchDebounceRef.current) {
        clearTimeout(searchDebounceRef.current);
      }
    };
  }, []);

  return {
    handleSearchChange,
  };
}
