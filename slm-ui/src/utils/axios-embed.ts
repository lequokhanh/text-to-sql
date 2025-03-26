import axios, { AxiosRequestConfig } from 'axios';

import { EMBED_HOST_API } from 'src/config-global';

const axiosInstance = axios.create({ baseURL: EMBED_HOST_API });

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
  db: {
    connect: '/api/v1/db/get-schema',
    query: '/api/v1/db/query',
    testConnection: '/api/v1/db/test-connection',
  },
};
