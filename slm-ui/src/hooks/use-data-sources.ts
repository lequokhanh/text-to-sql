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

interface SharedApiDataSource {
  id: number;
  databaseType: 'POSTGRESQL' | 'MYSQL';
  name: string;
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

function transformSharedApiDataSource(apiSource: SharedApiDataSource): DatabaseSource {
  return {
    id: apiSource.id.toString(),
    databaseType: apiSource.databaseType,
    name: apiSource.name,
    // For shared sources, we don't have access to these fields
    host: '',
    port: '',
    databaseName: '',
    username: '',
    password: '',
    tableDefinitions: [],
  };
}

export function useDataSources() {
  const [dataSources, setDataSources] = useState<DatabaseSource[]>([]);
  const [sharedSources, setSharedSources] = useState<DatabaseSource[]>([]);
  const [selectedSource, setSelectedSource] = useState<DatabaseSource | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDataSources = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Fetch owned sources
      const { data: ownedData } = await axiosInstance.get(endpoints.dataSource.owned);
      const transformedOwnedSources = Array.isArray(ownedData) ? ownedData.map(transformApiDataSource) : [];
      setDataSources(transformedOwnedSources);

      // Fetch shared sources
      const { data: sharedData } = await axiosInstance.get(endpoints.dataSource.available);
      const transformedSharedSources = Array.isArray(sharedData) 
        ? sharedData.map((source: SharedApiDataSource) => transformSharedApiDataSource(source)) 
        : [];
      setSharedSources(transformedSharedSources);

      // Handle selected source
      if (selectedSource) {
        const sourceExistsInOwned = transformedOwnedSources.some(source => source.id === selectedSource.id);
        const sourceExistsInShared = transformedSharedSources.some(source => source.id === selectedSource.id);
        
        if (!sourceExistsInOwned && !sourceExistsInShared && transformedOwnedSources.length > 0) {
          // If source doesn't exist in either owned or shared, select the first owned source
          setSelectedSource(transformedOwnedSources[0]);
        }
      } else if (transformedOwnedSources.length > 0) {
        // If no source is selected and we have owned sources, select the first one
        setSelectedSource(transformedOwnedSources[0]);
      }
    } catch (err) {
      console.error('Error fetching data sources:', err);
      setError('Failed to fetch data sources');
      setDataSources([]);
      setSharedSources([]);
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
          databaseDescription: source.databaseDescription || '',
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
    sharedSources,
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