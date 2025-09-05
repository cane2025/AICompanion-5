import { useEffect, useState, useCallback, useMemo } from 'react';

/**
 * Debounce hook för att förbättra prestanda på sök/filter funktioner
 * @param value - Värdet som ska debounca
 * @param delay - Delay i millisekunder (standard: 250ms för optimal UX)
 * @returns Debounced value
 */
export function useDebounce<T>(value: T, delay: number = 250): T {
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

/**
 * Debounced callback hook för funktioner som ska köras med fördröjning
 * @param callback - Funktionen som ska debounca
 * @param delay - Delay i millisekunder
 * @param deps - Dependencies för callback
 * @returns Debounced callback function
 */
export function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number = 250,
  deps: React.DependencyList = []
): T {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const memoizedCallback = useCallback(callback, deps);

  const [debouncedCallback] = useState(() => {
    let timeoutId: NodeJS.Timeout;

    const debounced = (...args: Parameters<T>): void => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        memoizedCallback(...args);
      }, delay);
    };

    // Add cleanup method
    (debounced as any).cancel = () => {
      clearTimeout(timeoutId);
    };

    return debounced as T;
  });

  useEffect(() => {
    return () => {
      (debouncedCallback as any).cancel?.();
    };
  }, [debouncedCallback]);

  return debouncedCallback;
}

/**
 * Optimized search hook med debounce och memoization
 * @param items - Array att söka i
 * @param searchTerm - Sökterm
 * @param searchFields - Fält att söka i
 * @param delay - Debounce delay
 * @returns Filtrerade resultat
 */
export function useOptimizedSearch<T extends Record<string, any>>(
  items: T[],
  searchTerm: string,
  searchFields: (keyof T)[],
  delay: number = 250
): T[] {
  const debouncedSearchTerm = useDebounce(searchTerm.toLowerCase().trim(), delay);

  const filteredItems = useMemo(() => {
    if (!debouncedSearchTerm) return items;

    return items.filter(item => 
      searchFields.some(field => {
        const value = item[field];
        if (typeof value === 'string') {
          return value.toLowerCase().includes(debouncedSearchTerm);
        }
        if (typeof value === 'number') {
          return value.toString().includes(debouncedSearchTerm);
        }
        return false;
      })
    );
  }, [items, debouncedSearchTerm, searchFields]);

  return filteredItems;
}

/**
 * Lazy loading hook för stora listor
 * @param items - Alla items
 * @param pageSize - Antal items per "sida"
 * @returns Hanterare för lazy loading
 */
export function useLazyLoading<T>(items: T[], pageSize: number = 20) {
  const [visibleCount, setVisibleCount] = useState(pageSize);
  
  const visibleItems = useMemo(() => 
    items.slice(0, visibleCount), 
    [items, visibleCount]
  );

  const loadMore = useCallback(() => {
    setVisibleCount(prev => Math.min(prev + pageSize, items.length));
  }, [pageSize, items.length]);

  const hasMore = visibleCount < items.length;

  const reset = useCallback(() => {
    setVisibleCount(pageSize);
  }, [pageSize]);

  return {
    visibleItems,
    loadMore,
    hasMore,
    reset,
    totalCount: items.length,
    visibleCount
  };
}

/**
 * Performance monitoring hook
 * @param label - Label för performance mätning
 * @param dependencies - Dependencies som triggar mätning
 */
export function usePerformanceMonitor(
  label: string, 
  dependencies: React.DependencyList = []
) {
  useEffect(() => {
    const startTime = performance.now();

    return () => {
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      // Logga endast om det tar längre än 100ms
      if (duration > 100) {
        console.warn(`🐌 Performance: ${label} tog ${duration.toFixed(2)}ms`);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dependencies);
}
