// src/utils/axios.ts
import { enqueueSnackbar } from 'notistack';
import axios, { AxiosRequestConfig } from 'axios';

import { BACKEND_HOST_API } from 'src/config-global';

const axiosInstance = axios.create({ baseURL: BACKEND_HOST_API });

axiosInstance.interceptors.response.use(
  (res) => {
    if (res.data && res.data.code !== 0) {
      return Promise.reject(res.data.message);
    }
    return res.data;
  },
  (error) => {
    // Handle 429 Too Many Requests error
    if (error.response && error.response.status === 429) {
      enqueueSnackbar('Too many requests. Please try again later.', {
        variant: 'error',
        anchorOrigin: {
          vertical: 'top',
          horizontal: 'right',
        },
      });
    }
    return Promise.reject(
      (error.response && error.response.data && error.response.data.message) ||
        'Something went wrong'
    );
  }
);

export default axiosInstance;

// ----------------------------------------------------------------------

export const fetcher = async (args: string | [string, AxiosRequestConfig]) => {
  const [url, config] = Array.isArray(args) ? args : [args];

  const res = await axiosInstance.get(url, { ...config });

  return res;
};

// ----------------------------------------------------------------------

export const endpoints = {
  chat: {
    suggestions: (dataSourceId: string) => `/api/v1/chat/suggestions/${dataSourceId}`,
    session: '/api/v1/chat/session',
    ask: '/api/v1/chat/ask',
    sessions: (dataSourceId: string) => `/api/v1/chat/sessions/${dataSourceId}`,
    messages: (sessionId: string) => `/api/v1/chat/sessions/${sessionId}/messages`,
  },
  kanban: '/api/kanban',
  calendar: '/api/calendar',
  auth: {
    me: '/api/v1/users/me',
    login: '/api/v1/auth/login',
    register: '/api/v1/auth/register',
  },
  dataSource: {
    base: '/api/v1/data-sources',
    list: '/api/v1/data-sources',
    create: '/api/v1/data-sources',
    details: (id: string) => `/api/v1/data-sources/${id}`,
    update: (id: string) => `/api/v1/data-sources/${id}`,
    delete: (id: string) => `/api/v1/data-sources/${id}`,
    owned: '/api/v1/data-sources/owned',
    shared: '/api/v1/data-sources/available',
    available: '/api/v1/data-sources/available',
    testConnection: (id: string) => `/api/v1/data-sources/${id}/test-connection`,
    owners: {
      list: (dataSourceId: string) => `/api/v1/data-sources/${dataSourceId}/owners`,
      create: (dataSourceId: string, username: string) => `/api/v1/data-sources/${dataSourceId}/owners/${username}`,
      delete: (dataSourceId: string, ownerId: string) => `/api/v1/data-sources/${dataSourceId}/owners/${ownerId}`,
    },
    groups: {
      base: (dataSourceId: string) => `/api/v1/data-sources/${dataSourceId}/groups`,
      list: (dataSourceId: string) => `/api/v1/data-sources/${dataSourceId}/groups`,
      create: (dataSourceId: string) => `/api/v1/data-sources/${dataSourceId}/groups`,
      details: (groupId: string) => 
        `/api/v1/data-sources/groups/${groupId}`,
      update: (dataSourceId: string, groupId: string) => 
        `/api/v1/data-sources/${dataSourceId}/groups/${groupId}`,
      delete: (dataSourceId: string, groupId: string) => 
        `/api/v1/data-sources/${dataSourceId}/groups/${groupId}`,
      members: {
        base: (dataSourceId: string, groupId: string) => 
          `/api/v1/data-sources/${dataSourceId}/groups/${groupId}/members`,
        delete: (dataSourceId: string, groupId: string) => 
          `/api/v1/data-sources/${dataSourceId}/groups/${groupId}/members`,
      },
    },
    tables: {
      updateBatch: (dataSourceId: string) => `/api/v1/data-sources/${dataSourceId}/tables/batch`,
      base: (dataSourceId: string) => `/api/v1/data-sources/${dataSourceId}/tables`,
      list: (dataSourceId: string) => `/api/v1/data-sources/${dataSourceId}/tables`,
      create: (dataSourceId: string) => `/api/v1/data-sources/${dataSourceId}/tables`,
      details: (dataSourceId: string, tableId: string) => 
        `/api/v1/data-sources/${dataSourceId}/tables/${tableId}`,
      update: (dataSourceId: string, tableId: string) => 
        `/api/v1/data-sources/${dataSourceId}/tables/${tableId}`,
      delete: (dataSourceId: string, tableId: string) => 
        `/api/v1/data-sources/${dataSourceId}/tables/${tableId}`,
      columns: {
        base: (dataSourceId: string, tableId: string) => 
          `/api/v1/data-sources/${dataSourceId}/tables/${tableId}/columns`,
        list: (dataSourceId: string, tableId: string) => 
          `/api/v1/data-sources/${dataSourceId}/tables/${tableId}/columns`,
        create: (dataSourceId: string, tableId: string) => 
          `/api/v1/data-sources/${dataSourceId}/tables/${tableId}/columns`,
        details: (dataSourceId: string, tableId: string, columnId: string) => 
          `/api/v1/data-sources/${dataSourceId}/tables/${tableId}/columns/${columnId}`,
        update: (dataSourceId: string, tableId: string, columnId: string) => 
          `/api/v1/data-sources/${dataSourceId}/tables/${tableId}/columns/${columnId}`,
        delete: (dataSourceId: string, tableId: string, columnId: string) => 
          `/api/v1/data-sources/${dataSourceId}/tables/${tableId}/columns/${columnId}`,
        relations: {
          base: (dataSourceId: string, tableId: string, columnId: string) => 
            `/api/v1/data-sources/${dataSourceId}/tables/${tableId}/columns/${columnId}/relations`,
          update: (dataSourceId: string, tableId: string, columnId: string, relationId: string) => 
            `/api/v1/data-sources/${dataSourceId}/tables/${tableId}/columns/${columnId}/relations/${relationId}`,
          delete: (dataSourceId: string, tableId: string, columnId: string, relationId: string) => 
            `/api/v1/data-sources/${dataSourceId}/tables/${tableId}/columns/${columnId}/relations/${relationId}`,
        },
      },
    },
  },
  embed: {
    testConnection: `/api/proxy/embed/api/v1/db/test-connection`,
    connect: `/api/proxy/embed/api/v1/db/get-schema`,
  },
  engine: {
    schemaEnrichment: '/api/proxy/engine/schema-enrichment-lite',
  },
};