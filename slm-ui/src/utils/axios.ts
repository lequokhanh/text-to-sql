// src/utils/axios.ts
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
  (error) =>
    Promise.reject(
      (error.response && error.response.data && error.response.data.message) ||
        'Something went wrong'
    )
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
    session: '/api/v1/chat/session',
    ask: '/api/v1/chat/ask',
    sessions: '/api/v1/chat/sessions',
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
    create: '/api/v1/data-sources',
    owned: '/api/v1/data-sources/owned',
    shared: '/api/v1/data-sources/shared',
    available: '/api/v1/data-sources/available',
    testConnection: (id: string) => `/api/v1/data-sources/${id}/test-connection`,
    groups: {
      base: (dataSourceId: string) => `/api/v1/data-sources/${dataSourceId}/groups`,
      details: (dataSourceId: string, groupId: string) => 
        `/api/v1/data-sources/${dataSourceId}/groups/${groupId}`,
      members: (dataSourceId: string, groupId: string) => 
        `/api/v1/data-sources/${dataSourceId}/groups/${groupId}/members`,
      removeMember: (dataSourceId: string, groupId: string, userId: string) => 
        `/api/v1/data-sources/${dataSourceId}/groups/${groupId}/members/${userId}`,
    },
    tables: {
      base: (dataSourceId: string) => `/api/v1/data-sources/${dataSourceId}/tables`,
      details: (dataSourceId: string, tableId: string) => 
        `/api/v1/data-sources/${dataSourceId}/tables/${tableId}`,
      columns: (dataSourceId: string, tableId: string) => 
        `/api/v1/data-sources/${dataSourceId}/tables/${tableId}/columns`,
    }
  },
  embed: {
    testConnection: `/api/proxy/embed/api/v1/db/test-connection`,
    connect: `/api/proxy/embed/api/v1/db/get-schema`,
  },
};