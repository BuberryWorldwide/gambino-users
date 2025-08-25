// lib/api.js (or wherever you create axios instance)
import axios from 'axios';
import { getToken } from './auth';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE || 'http://192.168.1.235:3001',
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  // Only add JWT token if there's NO Authorization header already set
  // AND this isn't an onboarding request
  const isOnboardingRequest = config.url?.includes('/onboarding/');
  
  if (!config.headers?.Authorization && !isOnboardingRequest) {
    const t = getToken();
    if (t) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${t}`;
    }
  }
  return config;
});

export default api;