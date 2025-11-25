// src/lib/auth.js - Updated for RBAC system
const AUTH_KEYS = {
  TOKEN: 'gambino_token',
  USER: 'gambino_user',
  REFRESH_THRESHOLD: 30 * 60 * 1000, // 30 minutes before expiry
};

/**
 * Decode JWT token without verification (client-side only)
 */
function decodeToken(token) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const payload = JSON.parse(atob(parts[1]));
    return payload;
  } catch (error) {
    console.error('Failed to decode token:', error);
    return null;
  }
}

/**
 * Check if token is expired
 */
function isTokenExpired(token) {
  const payload = decodeToken(token);
  if (!payload || !payload.exp) return true;

  // Add 5 second buffer to account for clock skew
  const expiryTime = payload.exp * 1000;
  const currentTime = Date.now() + 5000;

  return currentTime >= expiryTime;
}

/**
 * Check if token will expire soon (within threshold)
 */
function isTokenExpiringSoon(token) {
  const payload = decodeToken(token);
  if (!payload || !payload.exp) return false;

  const expiryTime = payload.exp * 1000;
  const currentTime = Date.now();
  const timeUntilExpiry = expiryTime - currentTime;

  // Return true if expiring within 5 minutes
  return timeUntilExpiry > 0 && timeUntilExpiry < (5 * 60 * 1000);
}

/**
 * Get authentication token from storage
 * Automatically clears expired tokens
 */
export function getToken() {
  if (typeof window === 'undefined') return null;

  const token = localStorage.getItem(AUTH_KEYS.TOKEN) ||
                sessionStorage.getItem(AUTH_KEYS.TOKEN) ||
                null;

  // Clear expired token
  if (token && isTokenExpired(token)) {
    console.warn('🔒 Token expired, clearing auth data');
    clearToken();
    return null;
  }

  return token;
}

/**
 * Get stored user data
 */
export function getUser() {
  if (typeof window === 'undefined') return null;
  
  try {
    const userData = localStorage.getItem(AUTH_KEYS.USER) || 
                     sessionStorage.getItem(AUTH_KEYS.USER);
    return userData ? JSON.parse(userData) : null;
  } catch (error) {
    console.error('Error parsing user data:', error);
    clearToken();
    return null;
  }
}

/**
 * Store authentication data (unified approach)
 */
export function setToken(token, options = {}) {
  if (typeof window === 'undefined') return;
  
  const { remember = true, userData = null } = options;
  const storage = remember ? localStorage : sessionStorage;
  const otherStorage = remember ? sessionStorage : localStorage;
  
  // Store token
  storage.setItem(AUTH_KEYS.TOKEN, token);
  
  // Store user data if provided
  if (userData) {
    storage.setItem(AUTH_KEYS.USER, JSON.stringify(userData));
  }
  
  // Clear from other storage to avoid conflicts
  otherStorage.removeItem(AUTH_KEYS.TOKEN);
  otherStorage.removeItem(AUTH_KEYS.USER);
  
  // Remove legacy keys
  ['adminToken', 'adminData', 'role', 'accessToken'].forEach(key => {
    otherStorage.removeItem(key);
    storage.removeItem(key); // Also clean current storage
  });
}

/**
 * Clear all authentication data
 */
export function clearToken() {
  if (typeof window === 'undefined') return;
  
  // Clear from both storages
  [localStorage, sessionStorage].forEach(storage => {
    // New keys
    storage.removeItem(AUTH_KEYS.TOKEN);
    storage.removeItem(AUTH_KEYS.USER);
    
    // Legacy keys
    storage.removeItem('adminToken');
    storage.removeItem('adminData');
    storage.removeItem('role');
    storage.removeItem('accessToken');
  });
  
  // Clear any auth cookies
  document.cookie = 'token=; Max-Age=0; path=/';
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated() {
  return !!(getToken() && getUser());
}

/**
 * Get user's redirect URL based on role and server response
 */
export function getUserRedirectUrl(userData) {
  // Use server-provided redirect if available
  if (userData?.redirectTo) {
    return userData.redirectTo;
  }

  // Fallback based on role
  const role = userData?.role;
  switch (role) {
    case 'super_admin':
    case 'gambino_ops':
    case 'venue_manager':
    case 'venue_staff':
      return '/admin/dashboard';
    case 'user':
    default:
      return '/dashboard';
  }
}

/**
 * Check if user has specific permission
 */
export function hasPermission(permission, userData = null) {
  const user = userData || getUser();
  if (!user?.permissions) return false;
  
  return user.permissions.includes(permission);
}

/**
 * Check if user can access admin area
 */
export function canAccessAdmin(userData = null) {
  const user = userData || getUser();
  if (!user) return false;
  
  return ['super_admin', 'gambino_ops', 'venue_manager', 'venue_staff'].includes(user.role);
}

/**
 * Check if user can access specific venue
 */
export function canAccessVenue(storeId, userData = null) {
  const user = userData || getUser();
  if (!user) return false;
  
  // Admin roles can access all venues
  if (['super_admin', 'gambino_ops'].includes(user.role)) {
    return true;
  }
  
  // Regular users can access all for gameplay
  if (user.role === 'user') {
    return true;
  }
  
  // Venue staff/managers need to be assigned
  if (['venue_staff', 'venue_manager'].includes(user.role)) {
    return user.assignedVenues && user.assignedVenues.includes(storeId);
  }
  
  return false;
}

/**
 * React hook for authentication management
 */
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import api from './api';

// src/lib/auth.js - Updated useAuth hook with auto-logout

export function useAuth(options = {}) {
  const { 
    requireAuth = false, 
    requireAdmin = false,
    redirectTo = '/login'
  } = options;

  const router = useRouter();
  const [user, setUser] = useState(null);
  const [token, setTokenState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initialize auth state
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const currentToken = getToken();
    const currentUser = getUser();

    setTokenState(currentToken);
    setUser(currentUser);

    // Handle requirements
    if (requireAuth && !currentToken) {
      router.push(redirectTo);
      return;
    }

    if (requireAdmin && (!currentUser || !canAccessAdmin(currentUser))) {
      router.push('/dashboard');
      return;
    }

    // Auto-refresh token if expiring soon
    if (currentToken && isTokenExpiringSoon(currentToken)) {
      console.log('🔄 Token expiring soon, attempting auto-refresh...');
      refreshAuth().catch(err => {
        console.error('Auto-refresh failed:', err);
      });
    }

    setLoading(false);
  }, [requireAuth, requireAdmin, redirectTo, router]);

  /**
   * Login function using unified endpoint
   */
  const login = useCallback(async (email, password, remember = true) => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.post('/api/auth/login', { 
        email: email.toLowerCase().trim(), 
        password 
      });

      const data = response.data;

      if (!data.success || !data.token || !data.user) {
        throw new Error(data.error || 'Login failed');
      }

      // Store auth data using unified approach
      setToken(data.token, { remember, userData: data.user });
      setTokenState(data.token);
      setUser(data.user);

      console.log('✅ Login successful:', {
        userId: data.user.id,
        role: data.user.role,
        area: data.user.area,
        redirectTo: data.user.redirectTo || data.redirectTo
      });

      // Always use getUserRedirectUrl to properly route admin users to admin.gambino.gold
      const redirectUrl = getUserRedirectUrl(data.user);
      window.location.href = redirectUrl;

      return data;
    } catch (err) {
      const errorMessage = err.response?.data?.error || err.message || 'Login failed';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Logout function
   */
  const logout = useCallback(async () => {
    try {
      setLoading(true);
      
      // Call logout endpoint (optional)
      if (token) {
        try {
          await api.post('/api/auth/logout');
        } catch (err) {
          console.warn('Logout endpoint failed:', err);
        }
      }

      // Clear local auth data
      clearToken();
      setTokenState(null);
      setUser(null);
      setError(null);

      console.log('📤 Logout successful');
      
      // Redirect to login
      window.location.href = '/login';
      
    } catch (err) {
      console.error('Logout error:', err);
      // Clear auth data even if logout fails
      clearToken();
      setTokenState(null);
      setUser(null);
      window.location.href = '/login';
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Auto-logout functionality based on user role
  useEffect(() => {
    if (!user) return;

    const getInactivityTimeout = (role) => {
      switch (role) {
        case 'super_admin':
        case 'gambino_ops':
          return 30 * 60 * 1000; // 30 minutes for high-privilege admin users
        case 'venue_manager':
        case 'venue_staff':
          return 45 * 60 * 1000; // 45 minutes for venue users
        case 'user':
        default:
          return 60 * 60 * 1000; // 1 hour for regular users
      }
    };

    let inactivityTimer;
    const timeout = getInactivityTimeout(user.role);

    const resetTimer = () => {
      clearTimeout(inactivityTimer);
      inactivityTimer = setTimeout(() => {
        logout();
        alert(`Session expired due to inactivity (${timeout / 60000} minutes). Please log in again.`);
      }, timeout);
    };

    // Events that indicate user activity
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    events.forEach(event => {
      document.addEventListener(event, resetTimer, true);
    });

    // Start the timer
    resetTimer();

    console.log(`🕒 Auto-logout timer set for ${timeout / 60000} minutes (${user.role})`);

    // Cleanup on unmount or user change
    return () => {
      clearTimeout(inactivityTimer);
      events.forEach(event => {
        document.removeEventListener(event, resetTimer, true);
      });
    };
  }, [user, logout]);

  /**
   * Refresh authentication data
   */
  const refreshAuth = useCallback(async () => {
    try {
      if (!token) return false;

      const response = await api.post('/api/auth/refresh');
      const data = response.data;

      if (!data.success) {
        throw new Error(data.error || 'Token refresh failed');
      }

      // Update stored auth data
      setToken(data.token, { remember: true, userData: data.user });
      setTokenState(data.token);
      setUser(data.user);

      console.log('🔄 Token refreshed successfully');
      return true;

    } catch (err) {
      console.error('Token refresh failed:', err);
      logout(); // Force logout on refresh failure
      return false;
    }
  }, [token, logout]);

  return {
    user,
    token,
    loading,
    error,
    isAuthenticated: !!(token && user),
    canAccessAdmin: canAccessAdmin(user),
    hasPermission: (permission) => hasPermission(permission, user),
    canAccessVenue: (storeId) => canAccessVenue(storeId, user),
    login,
    logout,
    refreshAuth,
    clearError: () => setError(null)
  };
}