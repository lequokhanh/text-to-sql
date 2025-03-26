import axios, { AxiosRequestConfig } from 'axios';

import { ENGINE_HOST_API } from 'src/config-global';

const axiosInstance = axios.create({ baseURL: ENGINE_HOST_API });

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
  query: '/query',
};
