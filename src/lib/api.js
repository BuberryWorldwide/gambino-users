// lib/api.js
import axios from 'axios';
import { getToken } from './auth';

// ONE canonical env var — set this in Vercel + .env.local
const API = process.env.NEXT_PUBLIC_API_URL;

if (!API) {
  // Helpful console hint in dev if you forgot the env
  // (won't crash prod builds)
  // eslint-disable-next-line no-console
  console.warn('NEXT_PUBLIC_API_URL is not set; falling back to same-origin');
}

// Build the baseURL (prefer env; otherwise same-origin in dev)
const baseURL = API || (typeof window !== 'undefined' ? `${window.location.origin.replace(/^http:/, 'https:')}` : '');

const api = axios.create({
  baseURL,          // e.g. https://api.gambino.gold
  withCredentials: true,
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
