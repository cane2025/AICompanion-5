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
  delay: number
): T {
  const [debouncedCallback] = useState(() => {
    let timeoutId: NodeJS.Timeout;
    return ((...args: Parameters<T>) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => callback(...args), delay);
    }) as T;
  });

  return debouncedCallback;
}

export function useOptimizedSearch<T>(
  data: T[],
  searchTerm: string,
  searchFields: (keyof T)[]
): T[] {
  const [results, setResults] = useState<T[]>([]);

  useEffect(() => {
    if (!searchTerm.trim()) {
      setResults(data);
      return;
    }

    const filtered = data.filter(item =>
      searchFields.some(field => {
        const value = item[field];
        return value && String(value).toLowerCase().includes(searchTerm.toLowerCase());
      })
    );

    setResults(filtered);
  }, [data, searchTerm, searchFields]);

  return results;
}

export function usePerformanceMonitor() {
  const [metrics, setMetrics] = useState({
    renderTime: 0,
    lastUpdate: Date.now()
  });

  const updateMetrics = useCallback((renderTime: number) => {
    setMetrics({
      renderTime,
      lastUpdate: Date.now()
    });
  }, []);

  return { metrics, updateMetrics };
}
