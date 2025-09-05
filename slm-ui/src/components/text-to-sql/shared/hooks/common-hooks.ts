import { useState, useCallback } from 'react';

/**
 * Custom hook for managing search functionality
 */
export function useSearch<T>(
  items: T[],
  searchFn: (item: T, query: string) => boolean
) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredItems = items.filter(item => 
    searchQuery ? searchFn(item, searchQuery) : true
  );

  const clearSearch = useCallback(() => {
    setSearchQuery('');
  }, []);

  return {
    searchQuery,
    setSearchQuery,
    filteredItems,
    clearSearch,
  };
}

/**
 * Custom hook for managing dialog states
 */
export function useDialog() {
  const [open, setOpen] = useState(false);

  const openDialog = useCallback(() => setOpen(true), []);
  const closeDialog = useCallback(() => setOpen(false), []);

  return {
    open,
    openDialog,
    closeDialog,
  };
}

/**
 * Custom hook for managing loading states
 */
export function useLoading() {
  const [loading, setLoading] = useState(false);

  const startLoading = useCallback(() => setLoading(true), []);
  const stopLoading = useCallback(() => setLoading(false), []);

  const withLoading = useCallback(async <T>(asyncFn: () => Promise<T>): Promise<T> => {
    startLoading();
    try {
      return await asyncFn();
    } finally {
      stopLoading();
    }
  }, [startLoading, stopLoading]);

  return {
    loading,
    startLoading,
    stopLoading,
    withLoading,
  };
}

/**
 * Custom hook for managing error states
 */
export function useError() {
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => setError(null), []);
  
  const handleError = useCallback((err: any) => {
    const message = err?.message || err?.toString() || 'An unexpected error occurred';
    setError(message);
  }, []);

  return {
    error,
    setError,
    clearError,
    handleError,
  };
}