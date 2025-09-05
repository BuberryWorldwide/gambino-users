import axios from 'axios';
import { getToken } from './auth';

// Get API URL from environment or default
const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NEXT_PUBLIC_API_URL;

// TEMPORARY DEBUG - Remove after fixing
console.log('=== API DEBUG ===');
console.log('NEXT_PUBLIC_BACKEND_URL:', process.env.NEXT_PUBLIC_BACKEND_URL);
console.log('NEXT_PUBLIC_API_URL:', process.env.NEXT_PUBLIC_API_URL);
console.log('Final API_URL:', API_URL);
console.log('Window location:', typeof window !== 'undefined' ? window.location.href : 'server-side');

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
  // TEMPORARY DEBUG - Remove after fixing
  console.log('=== API REQUEST ===');
  console.log('URL:', config.baseURL + config.url);
  console.log('Method:', config.method);
  
  // Skip auth for onboarding endpoints
  const isOnboarding = config.url?.includes('/onboarding/');
  if (isOnboarding) {
    console.log('Headers (onboarding - no auth):', config.headers);
    return config;
  }

  // Don't override existing Authorization header
  if (config.headers?.Authorization) {
    console.log('Headers (existing auth):', config.headers);
    return config;
  }

  // FIXED: Use the unified getToken() function instead of manual localStorage checks
  const token = getToken();
  
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
    console.log('Headers (with token):', config.headers);
  } else {
    console.log('Headers (no token found):', config.headers);
  }

  return config;
});

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => {
    // TEMPORARY DEBUG - Remove after fixing
    console.log('=== API RESPONSE SUCCESS ===');
    console.log('Status:', response.status);
    console.log('Data:', response.data);
    return response;
  },
  (error) => {
    // TEMPORARY DEBUG - Remove after fixing
    console.log('=== API RESPONSE ERROR ===');
    console.log('Status:', error.response?.status);
    console.log('Error:', error.response?.data);
    console.log('Full error:', error);
    
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
        localStorage.removeItem('accessToken'); // Also clear the canonical token
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

export default api;