import { useEffect, useState, useCallback } from 'react';

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number,
  deps: React.DependencyList = []
): T {
  const memoizedCallback = useCallback(callback, deps);
  
  const debouncedCallback = useCallback(
    (...args: Parameters<T>) => {
      const handler = setTimeout(() => {
        memoizedCallback(...args);
      }, delay);

      return () => {
        clearTimeout(handler);
      };
    },
    [memoizedCallback, delay]
  );

  return debouncedCallback as T;
}

export function useOptimizedSearch<T>(
  searchFunction: (query: string) => Promise<T[]>,
  delay: number = 300
) {
  const [searchResults, setSearchResults] = useState<T[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const debouncedSearch = useDebouncedCallback(
    async (query: string) => {
      if (!query.trim()) {
        setSearchResults([]);
        return;
      }
      
      setIsSearching(true);
      try {
        const results = await searchFunction(query);
        setSearchResults(results);
      } catch (error) {
        console.error("Search failed:", error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    },
    delay
  );

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    debouncedSearch(query);
  };

  return {
    searchResults,
    isSearching,
    searchQuery,
    handleSearch,
    clearSearch: () => {
      setSearchQuery("");
      setSearchResults([]);
    }
  };
}

export function usePerformanceMonitor() {
  const [performanceMetrics, setPerformanceMetrics] = useState<{
    renderTime: number;
    memoryUsage?: number;
  }>({ renderTime: 0 });

  useEffect(() => {
    const startTime = performance.now();
    
    return () => {
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      setPerformanceMetrics(prev => ({
        ...prev,
        renderTime
      }));
    };
  });

  return performanceMetrics;
}