import axios from 'axios';
import { getToken } from './auth';

// Get API URL from environment or default
const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NEXT_PUBLIC_API_URL;

if (!API_URL && typeof window !== 'undefined') {
  console.warn('NEXT_PUBLIC_BACKEND_URL is not set; requests will use same-origin.');
}

const api = axios.create({
  baseURL: API_URL || '',
  withCredentials: false,
  timeout: 30000, // 30 second timeout
});

// Request interceptor to add auth headers
api.interceptors.request.use((config) => {
  // Skip auth for onboarding endpoints
  const isOnboarding = config.url?.includes('/onboarding/');
  if (isOnboarding) {
    return config;
  }

  // Don't override existing Authorization header
  if (config.headers?.Authorization) {
    return config;
  }

  // Try to get admin token first, then regular token
  const adminToken = localStorage.getItem('adminToken');
  const userToken = getToken(); // This gets 'gambino_token' from your auth.js
  
  const token = adminToken || userToken;
  
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle 401/403 errors
    if (error.response?.status === 401 || error.response?.status === 403) {
      // If we're in an admin context and get unauthorized, redirect to admin login
      if (window.location.pathname.startsWith('/admin')) {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminData');
        window.location.href = '/login';
      } else {
        // Regular user context
        localStorage.removeItem('gambino_token');
        localStorage.removeItem('gambino_user');
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

export default api;