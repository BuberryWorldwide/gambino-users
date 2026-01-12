// src/lib/api.js - Updated API client for RBAC system with Treasury integration
import axios from 'axios';
import { getToken, clearToken, getUserRedirectUrl, getUser } from './auth';

// Get API URL from environment (trim to remove any trailing newlines)
const API_URL = (process.env.NEXT_PUBLIC_BACKEND_URL ||
               process.env.NEXT_PUBLIC_API_URL ||
               '').trim();

if (!API_URL && typeof window !== 'undefined') {
  console.warn('NEXT_PUBLIC_BACKEND_URL not set; using same-origin requests');
}

// Create axios instance with updated configuration
const api = axios.create({
  baseURL: API_URL,
  withCredentials: false,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Request interceptor for authentication
api.interceptors.request.use(
  (config) => {
    // Skip auth for public endpoints
    const publicEndpoints = [
      '/api/auth/login',
      '/api/users/register', 
      '/api/leaderboard',
      '/health'
    ];
    
    const isPublic = publicEndpoints.some(endpoint => 
      config.url?.includes(endpoint)
    );

    if (isPublic) {
      console.log('📡 Public API request:', config.url);
      return config;
    }

    // Don't override existing Authorization header
    if (config.headers?.Authorization) {
      console.log('📡 API request with existing auth:', config.url);
      return config;
    }

    // Add authentication token
    const token = getToken();
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
      console.log('📡 Authenticated API request:', config.url);
    } else {
      console.log('📡 Unauthenticated API request:', config.url);
    }

    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling and redirects
api.interceptors.response.use(
  (response) => {
    // Log successful responses in development
    if (process.env.NODE_ENV === 'development') {
      console.log('✅ API Response:', {
        url: response.config.url,
        status: response.status,
        method: response.config.method?.toUpperCase()
      });
    }
    return response;
  },
  (error) => {
    const { response, config } = error;
    

    // Handle authentication errors (401)
    if (response?.status === 401) {
      console.warn('🔒 Authentication failed - clearing auth data');
      clearToken();
      
      // Redirect to login unless already there
      if (typeof window !== 'undefined' && 
          !window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    
    // Handle authorization errors (403)
    else if (response?.status === 403) {
      const errorCode = response?.data?.code;
      
      if (errorCode === 'INSUFFICIENT_PERMISSIONS') {
        console.warn('🚫 Insufficient permissions for this action');
        
        // Redirect admin users to appropriate area based on their role
        const user = getUser();
        if (user && ['venue_staff', 'venue_manager'].includes(user.role)) {
          const redirectUrl = getUserRedirectUrl(user);
          if (window.location.pathname !== redirectUrl) {
            window.location.href = redirectUrl;
          }
        }
      }
      
      if (errorCode === 'VENUE_ACCESS_DENIED') {
        console.warn('🏪 Venue access denied');
        // Show user-friendly error or redirect to their allowed venues
      }
    }
    
    // Handle server errors (5xx)
    else if (response?.status >= 500) {
      console.error('🔥 Server error occurred');
      // Could trigger error boundary or notification
    }

    return Promise.reject(error);
  }
);

// --- Enhanced API Methods ---

/**
 * Authentication API methods (using unified endpoint)
 */
export const authAPI = {
  /**
   * Login user with unified endpoint
   */
  login: async (email, password) => {
    const response = await api.post('/api/auth/login', { 
      email: email.toLowerCase().trim(), 
      password 
    });
    return response.data;
  },

  /**
   * Refresh authentication token
   */
  refresh: async () => {
    const response = await api.post('/api/auth/refresh');
    return response.data;
  },

  /**
   * Get current user profile
   */
  getProfile: async () => {
    const response = await api.get('/api/auth/profile');
    return response.data;
  },

  /**
   * Logout (optional server-side cleanup)
   */
  logout: async () => {
    try {
      const response = await api.post('/api/auth/logout');
      return response.data;
    } catch (error) {
      // Don't throw on logout errors
      console.warn('Logout API call failed:', error);
      return { success: true };
    }
  }
};

/**
 * User management API methods
 */
export const userAPI = {
  /**
   * Get current user profile (updated endpoint)
   */
  getProfile: async () => {
    const response = await api.get('/api/users/profile');
    return response.data;
  },

  /**
   * Update user profile
   */
  updateProfile: async (updates) => {
    const response = await api.put('/api/users/profile', updates);
    return response.data;
  },

  /**
   * Change password
   */
  changePassword: async (currentPassword, newPassword) => {
    const response = await api.post('/api/users/change-password', {
      currentPassword,
      newPassword
    });
    return response.data;
  },

  /**
   * Get user's venue access summary
   */
  getVenueAccess: async () => {
    const response = await api.get('/api/user/venue-access');
    return response.data;
  },

  /**
   * Get user's current session
   */
  getCurrentSession: async () => {
    const response = await api.get('/api/users/current-session');
    return response.data;
  },

  /**
   * Get user's session history
   */
  getSessionHistory: async (limit = 20) => {
    const response = await api.get('/api/users/session-history', {
      params: { limit }
    });
    return response.data;
  },

  /**
   * End current session
   */
  endSession: async () => {
    const response = await api.post('/api/users/end-session');
    return response.data;
  }
};

/**
 * Admin user management API methods
 */
export const adminAPI = {
  /**
   * Get all users (admin only)
   */
  getUsers: async (params = {}) => {
    const response = await api.get('/api/admin/users', { params });
    return response.data;
  },

  /**
   * Create new user (admin only)
   */
  createUser: async (userData) => {
    const response = await api.post('/api/admin/users/create', userData);
    return response.data;
  },

  /**
   * Update user (admin only)
   */
  updateUser: async (userId, updates) => {
    const response = await api.put(`/api/admin/users/${userId}`, updates);
    return response.data;
  },

  /**
   * Get admin metrics
   */
  getMetrics: async (timeframe = '30d') => {
    const response = await api.get('/api/admin/metrics', { 
      params: { timeframe } 
    });
    return response.data;
  }
};

/**
 * Store/Venue management API methods
 */
export const storeAPI = {
  /**
   * Get all stores accessible to current user
   */
  getStores: async (params = {}) => {
    const response = await api.get('/api/admin/stores', { params });
    return response.data;
  },

  /**
   * Get specific store details
   */
  getStore: async (storeId) => {
    const response = await api.get(`/api/admin/stores/${storeId}`);
    return response.data;
  },

  /**
   * Update store (requires management access)
   */
  updateStore: async (storeId, updates) => {
    const response = await api.put(`/api/admin/stores/${storeId}`, updates);
    return response.data;
  },

  /**
   * Create new store
   */
  createStore: async (storeData) => {
    const response = await api.post('/api/admin/stores/create', storeData);
    return response.data;
  },

  /**
   * Get store wallet information
   */
  getStoreWallet: async (storeId) => {
    const response = await api.get(`/api/admin/wallet/${storeId}`);
    return response.data;
  },

  /**
   * Generate store wallet
   */
  generateStoreWallet: async (storeId) => {
    const response = await api.post(`/api/admin/wallet/${storeId}/generate`);
    return response.data;
  }
};

/**
 * Daily Reports API methods
 * Add this section to your src/lib/api.js file
 */
export const reportsAPI = {
  /**
   * Get all daily reports for a specific store and date
   * @param {string} storeId - Store identifier
   * @param {string} date - Date in YYYY-MM-DD format
   */
  getDailyReports: async (storeId, date) => {
    const response = await api.get(`/api/admin/reports/daily/${storeId}`, {
      params: { date }
    });
    return response.data;
  },

  /**
   * Update report reconciliation status (include/exclude)
   * @param {string} reportId - Report MongoDB ObjectId
   * @param {boolean} include - Whether to include in reconciliation
   * @param {string} notes - Optional notes
   */
  updateReconciliation: async (reportId, include, notes = '') => {
    const response = await api.post(`/api/admin/reports/${reportId}/reconciliation`, {
      include,
      notes
    });
    return response.data;
  },

  /**
   * Get reconciliation summary for a date range
   * @param {string} storeId - Store identifier
   * @param {string} startDate - Start date in YYYY-MM-DD format
   * @param {string} endDate - End date in YYYY-MM-DD format
   */
  getReconciliationSummary: async (storeId, startDate, endDate) => {
    const response = await api.get(`/api/admin/reports/${storeId}/reconciliation`, {
      params: { startDate, endDate }
    });
    return response.data;
  },

  /**
   * Get reports for multiple dates (helper method)
   * @param {string} storeId - Store identifier
   * @param {Date[]} dates - Array of Date objects
   */
  getMultipleDates: async (storeId, dates) => {
    const requests = dates.map(date => {
      const dateStr = date.toISOString().split('T')[0];
      return reportsAPI.getDailyReports(storeId, dateStr);
    });
    
    const results = await Promise.allSettled(requests);
    
    return results.map((result, index) => ({
      date: dates[index],
      success: result.status === 'fulfilled',
      data: result.status === 'fulfilled' ? result.value : null,
      error: result.status === 'rejected' ? result.reason : null
    }));
  },

  /**
   * Bulk update reconciliation status
   * @param {Array<{reportId: string, include: boolean, notes?: string}>} updates
   */
  bulkUpdateReconciliation: async (updates) => {
    const requests = updates.map(update => 
      reportsAPI.updateReconciliation(update.reportId, update.include, update.notes)
    );
    
    const results = await Promise.allSettled(requests);
    
    return {
      success: results.filter(r => r.status === 'fulfilled').length,
      failed: results.filter(r => r.status === 'rejected').length,
      results: results
    };
  }
};

/**
 * Wallet API methods
 */
export const walletAPI = {
  /**
   * Generate new wallet
   */
  generate: async () => {
    const response = await api.post('/api/wallet/generate');
    return response.data;
  },

  /**
   * Get wallet balance
   */
  getBalance: async (walletAddress, updateDB = false) => {
    const response = await api.get(`/api/wallet/balance/${walletAddress}`, {
      params: updateDB ? { updateDB: 'true' } : {}
    });
    return response.data;
  },

  /**
   * Get wallet QR code
   */
  getQRCode: async (walletAddress) => {
    const response = await api.get(`/api/wallet/qrcode/${walletAddress}`);
    return response.data;
  },

  /**
   * Get private key
   */
  getPrivateKey: async () => {
    const response = await api.get('/api/wallet/private-key');
    return response.data;
  },

  /**
   * Connect external wallet
   */
  connect: async (publicKey, message, signatureBase64) => {
    const response = await api.post('/api/wallet/connect', {
      publicKey,
      message,
      signatureBase64
    });
    return response.data;
  }
};

/**
 * Treasury API methods - REMOVED FOR SECURITY
 * Treasury operations should only be accessed through admin-v2 application
 * Regular users do not need access to treasury endpoints
 *
 * If you need treasury functionality, use the admin dashboard at:
 * https://admin.gambino.gold/admin/distributions
 */

/**
 * Referral API methods
 */
export const referralAPI = {
  /**
   * Validate a referral code (public)
   */
  validate: async (code) => {
    const response = await api.post('/api/referral/validate', { code });
    return response.data;
  },

  /**
   * Get current user's referral statistics
   */
  getStats: async () => {
    const response = await api.get('/api/referral/stats');
    return response.data;
  },

  /**
   * Get referral history (people you've referred)
   */
  getHistory: async (page = 1, limit = 20) => {
    const response = await api.get('/api/referral/history', {
      params: { page, limit }
    });
    return response.data;
  },

  /**
   * Get referral leaderboard
   */
  getLeaderboard: async (timeframe = 'all') => {
    const response = await api.get('/api/referral/leaderboard', {
      params: { timeframe }
    });
    return response.data;
  },

  /**
   * Track referral share event (analytics)
   */
  trackShare: async (platform) => {
    const response = await api.post('/api/referral/track-share', { platform });
    return response.data;
  }
};

/**
 * Public API methods (no auth required)
 */
export const publicAPI = {
  /**
   * Get leaderboard
   */
  getLeaderboard: async (limit = 50) => {
    const response = await api.get('/api/leaderboard', { 
      params: { limit } 
    });
    return response.data;
  },

  /**
   * Health check
   */
  health: async () => {
    const response = await api.get('/health');
    return response.data;
  },

  /**
   * User registration
   */
  register: async (userData) => {
    const response = await api.post('/api/users/register', userData);
    return response.data;
  }
};

// Arca Protocol API base URL (trim to remove any trailing newlines)
const ARCA_API_URL = (process.env.NEXT_PUBLIC_ARCA_API_URL || 'https://api.arca-protocol.com').trim();

/**
 * Mining API - Entropy mining session management
 */
export const miningAPI = {
  /**
   * Fetch available mining interfaces from Arca Protocol
   */
  getInterfaces: async () => {
    try {
      const response = await fetch(`${ARCA_API_URL}/v1/mining/interfaces`);
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch mining interfaces');
      }
      return data.interfaces;
    } catch (error) {
      console.error('Failed to fetch mining interfaces:', error);
      return [];
    }
  },

  /**
   * Create a mining session for entropy contribution
   * Returns a short-lived token and wallet address
   */
  createSession: async () => {
    const response = await api.post('/api/games/session');
    return response.data;
  },

  /**
   * Launch a mining session with authentication
   * @param {string} gameUrl - The full game URL to launch
   */
  launchSession: async (gameUrl) => {
    const session = await miningAPI.createSession();
    if (!session.success) {
      throw new Error(session.error || 'Failed to create mining session');
    }

    // Return URL with token for redirect
    const separator = gameUrl.includes('?') ? '&' : '?';
    return `${gameUrl}${separator}token=${encodeURIComponent(session.gameToken)}`;
  }
};

// --- Helper Functions ---

/**
 * Helper function to check if request failed due to permission issues
 */
export function isPermissionError(error) {
  return error?.response?.status === 403 && 
         ['INSUFFICIENT_PERMISSIONS', 'VENUE_ACCESS_DENIED'].includes(
           error?.response?.data?.code
         );
}

/**
 * Helper function to check if request failed due to authentication
 */
export function isAuthError(error) {
  return error?.response?.status === 401;
}

/**
 * Helper function to extract error message from API response
 */
export function getErrorMessage(error, defaultMessage = 'An error occurred') {
  if (error?.response?.data?.error) {
    return error.response.data.error;
  }
  
  if (error?.message) {
    return error.message;
  }
  
  return defaultMessage;
}

/**
 * Helper function to check if user has permission for an API call
 * This can prevent unnecessary API calls that will fail
 */
export function canMakeRequest(permission) {
  const user = getUser();
  if (!user || !user.permissions) return false;
  
  return user.permissions.includes(permission);
}

// Export the configured axios instance as default
export default api;