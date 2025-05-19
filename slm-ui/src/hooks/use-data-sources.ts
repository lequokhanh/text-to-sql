// File: src/hooks/use-data-sources.ts
import { useState, useCallback } from 'react';

import axiosInstance, { endpoints } from 'src/utils/axios';

import { DatabaseSource } from 'src/types/database';

interface ApiDataSource {
  id: number;
  databaseType: 'POSTGRESQL' | 'MYSQL';
  name: string;
  host: string;
  port: number;
  databaseName: string;
  username: string;
  password: string;
  collectionName?: string;
  tableDefinitions?: any[];
}

function transformApiDataSource(apiSource: ApiDataSource): DatabaseSource {
  return {
    id: apiSource.id.toString(),
    databaseType: apiSource.databaseType,
    name: apiSource.name,
    host: apiSource.host,
    port: apiSource.port.toString(),
    databaseName: apiSource.databaseName,
    username: apiSource.username,
    password: apiSource.password,
    tableDefinitions: apiSource.tableDefinitions || [],
  };
}

export function useDataSources() {
  const [dataSources, setDataSources] = useState<DatabaseSource[]>([]);
  const [selectedSource, setSelectedSource] = useState<DatabaseSource | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDataSources = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { data } = await axiosInstance.get(endpoints.dataSource.owned);
      const transformedSources = Array.isArray(data) ? data.map(transformApiDataSource) : [];
      setDataSources(transformedSources);

      // Set the first data source as selected if available and no source is currently selected
      if (transformedSources.length > 0 && !selectedSource) {
        setSelectedSource(transformedSources[0]);
      } else if (selectedSource) {
        // Check if selected source still exists in the data
        const sourceExists = transformedSources.some(source => source.id === selectedSource.id);
        if (!sourceExists && transformedSources.length > 0) {
          // If selected source no longer exists, select the first available source
          setSelectedSource(transformedSources[0]);
        } else if (!sourceExists) {
          // If no sources available, clear selection
          setSelectedSource(null);
        }
      }
    } catch (err) {
      console.error('Error fetching data sources:', err);
      setError('Failed to fetch data sources');
      setDataSources([]);
    } finally {
      setIsLoading(false);
    }
  }, [selectedSource]);

  const createDataSource = useCallback(
    async (source: DatabaseSource) => {
      setIsLoading(true);
      setError(null);

      try {
        // Transform the source data to match API format
        const apiPayload = {
          databaseType: source.databaseType,
          host: source.host,
          port: parseInt(source.port, 10),
          databaseName: source.databaseName,
          username: source.username,
          password: source.password,
          name: source.name,
          tableDefinitions: source.tableDefinitions || [],
        };

        await axiosInstance.post(endpoints.dataSource.create, apiPayload);
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
      prev.map((source) => (source.id === updatedSource.id ? updatedSource : source))
    );
    
    // Update selected source if it's the one being updated
    if (selectedSource?.id === updatedSource.id) {
      setSelectedSource(updatedSource);
    }
  }, [selectedSource]);

  const deleteDataSource = useCallback(
    (sourceId: string) => {
      setDataSources((prev) => prev.filter((source) => source.id !== sourceId));
      if (selectedSource?.id === sourceId) {
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