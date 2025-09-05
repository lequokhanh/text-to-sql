import { useState, useEffect, useCallback } from 'react';

import axiosInstance, { endpoints } from 'src/utils/axios';

import { DatabaseSource } from 'src/types/database';

/**
 * Custom hook to handle chat suggestions
 */
export function useChatSuggestions(selectedSource: DatabaseSource | null) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isSuggestionsLoading, setIsSuggestionsLoading] = useState(false);

  const fetchSuggestions = useCallback(async () => {
    if (!selectedSource) return;
    
    setIsSuggestionsLoading(true);
    try {
      const response = await axiosInstance.get(endpoints.chat.suggestions(selectedSource.id));
      setSuggestions(response.data);
    } catch (err) {
      console.error('Error fetching suggestions:', err);
    } finally {
      setIsSuggestionsLoading(false);
    }
  }, [selectedSource]);

  useEffect(() => {
    if (selectedSource) {
      fetchSuggestions();
    }
  }, [selectedSource, fetchSuggestions]);

  return {
    suggestions,
    isSuggestionsLoading,
    fetchSuggestions,
  };
}