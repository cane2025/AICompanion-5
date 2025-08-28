import { useState, useMemo, useCallback } from "react";
import Fuse from "fuse.js";

export interface SavedSearch {
  id: string;
  name: string;
  query: string;
  filters: Record<string, any>;
  sort: { field: string; direction: "asc" | "desc" };
}

interface UseSmartSearchOptions {
  keys: string[];
  threshold?: number;
  debounceMs?: number;
}

export function useSmartSearch<T>(data: T[], options: UseSmartSearchOptions) {
  const { keys, threshold = 0.4, debounceMs = 300 } = options;

  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [sort, setSort] = useState<{
    field: string;
    direction: "asc" | "desc";
  }>({
    field: "createdAt",
    direction: "desc",
  });

  // Create Fuse instance for fuzzy search
  const fuse = useMemo(() => {
    return new Fuse(data, {
      keys,
      threshold,
      includeScore: true,
      includeMatches: true,
    });
  }, [data, keys, threshold]);

  // Apply search
  const searchResults = useMemo(() => {
    if (!query.trim()) {
      return data.map((item, index) => ({
        item,
        refIndex: index,
        score: 0,
        matches: [],
      }));
    }

    return fuse.search(query);
  }, [fuse, query, data]);

  // Apply filters
  const filteredResults = useMemo(() => {
    let results = searchResults.map((result) => result.item);

    Object.entries(filters).forEach(([key, value]) => {
      if (value && value !== "") {
        results = results.filter((item: any) => {
          const itemValue = item[key];
          if (typeof itemValue === "string") {
            return itemValue.toLowerCase().includes(value.toLowerCase());
          }
          return itemValue === value;
        });
      }
    });

    return results;
  }, [searchResults, filters]);

  // Apply sorting
  const sortedResults = useMemo(() => {
    const sorted = [...filteredResults];

    sorted.sort((a: any, b: any) => {
      const aValue = a[sort.field];
      const bValue = b[sort.field];

      if (aValue === bValue) return 0;
      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;

      let comparison = 0;
      if (typeof aValue === "string" && typeof bValue === "string") {
        comparison = aValue.localeCompare(bValue);
      } else if (typeof aValue === "number" && typeof bValue === "number") {
        comparison = aValue - bValue;
      } else if (aValue instanceof Date && bValue instanceof Date) {
        comparison = aValue.getTime() - bValue.getTime();
      } else {
        comparison = String(aValue).localeCompare(String(bValue));
      }

      return sort.direction === "asc" ? comparison : -comparison;
    });

    return sorted;
  }, [filteredResults, sort]);

  // Get results with match information
  const resultWithMatches = useMemo(() => {
    return sortedResults.map((item) => {
      const searchResult = searchResults.find((result) => result.item === item);
      return {
        ...item,
        _searchScore: searchResult?.score,
        _searchMatches: searchResult?.matches,
      };
    });
  }, [sortedResults, searchResults]);

  // Debounced query setter
  const debouncedSetQuery = useCallback(
    (() => {
      let timeoutId: NodeJS.Timeout;
      return (newQuery: string) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => setQuery(newQuery), debounceMs);
      };
    })(),
    [debounceMs]
  );

  // Clear all filters
  const clearFilters = useCallback(() => {
    setQuery("");
    setFilters({});
    setSort({ field: "createdAt", direction: "desc" });
  }, []);

  // Apply saved search
  const applySavedSearch = useCallback((savedSearch: SavedSearch) => {
    setQuery(savedSearch.query);
    setFilters(savedSearch.filters);
    setSort(savedSearch.sort);
  }, []);

  return {
    result: sortedResults,
    resultWithMatches,
    query,
    setQuery: debouncedSetQuery,
    filters,
    setFilters,
    sort,
    setSort,
    totalCount: data.length,
    filteredCount: sortedResults.length,
    clearFilters,
    applySavedSearch,
  };
}
