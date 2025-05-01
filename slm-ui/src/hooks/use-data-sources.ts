import { useState, useCallback } from 'react';

import axios, { endpoints } from 'src/utils/axios';

import { DatabaseSource } from 'src/types/database';

export function useDataSources() {
  const [dataSources, setDataSources] = useState<DatabaseSource[]>([]);
  const [selectedSource, setSelectedSource] = useState<DatabaseSource | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDataSources = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { data } = await axios.get(endpoints.dataSource.owned);
      setDataSources(data);

      // Set the first data source as selected if available and no source is currently selected
      if (data.length > 0 && !selectedSource) {
        setSelectedSource(data[0]);
      }
    } catch (err) {
      console.error('Error fetching data sources:', err);
      setError('Failed to fetch data sources');
    } finally {
      setIsLoading(false);
    }
  }, [selectedSource]);

  const createDataSource = useCallback(
    async (source: DatabaseSource) => {
      setIsLoading(true);
      setError(null);

      try {
        await axios.post(endpoints.dataSource.create, source);
        await fetchDataSources();
        return true;
      } catch (err) {
        console.error('Error creating data source:', err);
        setError('Failed to create data source');
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [fetchDataSources]
  );

  const updateDataSource = useCallback((updatedSource: DatabaseSource) => {
    setDataSources((prev) =>
      prev.map((source) => (source.name === updatedSource.name ? updatedSource : source))
    );
  }, []);

  const deleteDataSource = useCallback(
    (sourceId: string) => {
      setDataSources((prev) => prev.filter((source) => source.name !== sourceId));
      if (selectedSource?.name === sourceId) {
        setSelectedSource(null);
      }
    },
    [selectedSource]
  );

  return {
    dataSources,
    selectedSource,
    setSelectedSource,
    isLoading,
    error,
    fetchDataSources,
    createDataSource,
    updateDataSource,
    deleteDataSource,
  };
}
