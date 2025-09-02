import axios from 'axios';
import { getToken } from './auth';

const API = process.env.NEXT_PUBLIC_API_URL;
if (!API && typeof window !== 'undefined') {
  console.warn('NEXT_PUBLIC_API_URL is not set; requests will use same-origin.');
}

const api = axios.create({
  baseURL: API || '',
  withCredentials: false, // <-- you’re using Bearer tokens, not cookies
});

api.interceptors.request.use((config) => {
  const isOnboarding = config.url?.includes('/onboarding/');
  if (!config.headers?.Authorization && !isOnboarding) {
    const t = getToken();
    if (t) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${t}`;
    }
  }
  return config;
});

export default api;
