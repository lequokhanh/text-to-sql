import axios, { AxiosRequestConfig } from 'axios';

import { BACKEND_HOST_API } from 'src/config-global';

const axiosInstance = axios.create({ baseURL: BACKEND_HOST_API });

axiosInstance.interceptors.response.use(
  (res) => {
    if (res.data && res.data.code !== 0) {
      return Promise.reject(res.data);
    }
    return res.data;
  },
  (error) => Promise.reject((error.response && error.response.data) || 'Something went wrong')
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
  chat: '/api/chat',
  kanban: '/api/kanban',
  calendar: '/api/calendar',
  auth: {
    me: '/api/v1/users/me',
    login: '/api/v1/auth/login',
    register: '/api/v1/auth/register',
  },
  dataSource: {
    create: '/api/v1/data-sources',
    owned: '/api/v1/data-sources/owned',
  }
};
