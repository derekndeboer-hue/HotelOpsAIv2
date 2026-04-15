import axios, { type AxiosInstance, type AxiosRequestConfig } from 'axios';

const instance: AxiosInstance = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

// 401 interceptor: attempt token refresh once
let isRefreshing = false;
let refreshQueue: Array<() => void> = [];

instance.interceptors.response.use(
  res => res,
  async error => {
    const original = error.config as AxiosRequestConfig & { _retry?: boolean };
    if (error.response?.status === 401 && !original._retry) {
      if (isRefreshing) {
        return new Promise(resolve => {
          refreshQueue.push(() => resolve(instance(original)));
        });
      }
      original._retry = true;
      isRefreshing = true;
      try {
        await instance.post('/auth/refresh');
        refreshQueue.forEach(cb => cb());
        refreshQueue = [];
        return instance(original);
      } catch {
        refreshQueue = [];
        window.location.href = '/login';
        return Promise.reject(error);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  }
);

export async function get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
  const res = await instance.get<T>(url, config);
  return res.data;
}

export async function post<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
  const res = await instance.post<T>(url, data, config);
  return res.data;
}

export async function put<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
  const res = await instance.put<T>(url, data, config);
  return res.data;
}

export async function del<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
  const res = await instance.delete<T>(url, config);
  return res.data;
}

export { instance as axiosInstance };
