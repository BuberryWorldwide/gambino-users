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
  timeout: 30000,
});

// Debug interceptor to log all requests
api.interceptors.request.use((config) => {
  console.log('=== API REQUEST ===');
  console.log('URL:', config.baseURL + config.url);
  console.log('Method:', config.method);
  console.log('Headers:', config.headers);
  
  // ... rest of your existing interceptor code
  
  return config;
});

// Debug interceptor to log all responses
api.interceptors.response.use(
  (response) => {
    console.log('=== API RESPONSE SUCCESS ===');
    console.log('Status:', response.status);
    console.log('Data:', response.data);
    return response;
  },
  (error) => {
    console.log('=== API RESPONSE ERROR ===');
    console.log('Status:', error.response?.status);
    console.log('Error:', error.response?.data);
    console.log('Full error:', error);
    
    // ... rest of your existing error handling
    
    return Promise.reject(error);
  }
);

export default api;