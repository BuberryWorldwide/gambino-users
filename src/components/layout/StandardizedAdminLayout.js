// src/components/layout/StandardizedAdminLayout.js
'use client';
import { useRouter, usePathname } from 'next/navigation';
import { getToken, clearToken, getUser } from '@/lib/auth';
import { useEffect, useState } from 'react';

export default function StandardizedAdminLayout({ 
  children, 
  pageTitle, 
  pageDescription, 
  pageActions 
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.push('/login');
      return;
    }
    
    const userData = getUser();
    setUser(userData);
  }, [router]);

  const handleLogout = () => {
    clearToken();
    router.push('/login');
  };

  // Navigation based on user role
  const getNavItems = () => {
    const baseItems = [
      { href: '/admin', label: 'Dashboard' }
    ];

    if (user?.role === 'super_admin' || user?.role === 'gambino_ops') {
      return [
        ...baseItems,
        { href: '/admin/users', label: 'Participants' },
        { href: '/admin/stores', label: 'Stores' },
        { href: '/admin/treasury', label: 'Treasury' },
        { href: '/admin/metrics', label: 'Analytics' }
      ];
    }

    if (user?.role === 'venue_manager' || user?.role === 'venue_staff') {
      return [
        ...baseItems,
        { href: '/admin/venues', label: 'My Venues' },
        { href: '/admin/reports', label: 'Reports' }
      ];
    }

    return baseItems;
  };

  const isActive = (href) => {
    if (href === '/admin') {
      return pathname === '/admin';
    }
    return pathname.startsWith(href);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-black flex items-center justify-center relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.02)_1px,transparent_1px)] bg-[size:100px_100px]"></div>
          <div className="absolute top-20 left-10 w-32 h-32 border border-yellow-500/10 rounded-xl rotate-12 animate-pulse"></div>
          <div className="absolute bottom-32 left-20 w-40 h-40 border border-orange-500/10 rounded-2xl rotate-45 animate-pulse" style={{ animationDuration: '4s' }}></div>
        </div>
        <div className="relative z-10 text-center">
          <div className="w-12 h-12 border-3 border-yellow-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-white text-lg">Loading admin interface...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-black relative overflow-hidden text-white">
      {/* Background Effects - Matching login page */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.02)_1px,transparent_1px)] bg-[size:100px_100px]"></div>
        <div className="absolute top-20 left-10 w-32 h-32 border border-yellow-500/10 rounded-xl rotate-12 animate-pulse"></div>
        <div className="absolute top-40 right-20 w-24 h-24 border border-amber-400/10 rounded-full animate-bounce" style={{ animationDuration: '3s' }}></div>
        <div className="absolute bottom-32 left-20 w-40 h-40 border border-orange-500/10 rounded-2xl rotate-45 animate-pulse" style={{ animationDuration: '4s' }}></div>
        <div className="absolute bottom-20 right-10 w-28 h-28 border border-yellow-600/10 rounded-lg -rotate-12 animate-bounce" style={{ animationDuration: '5s' }}></div>
      </div>

      {/* Header Navigation */}
      <div className="relative z-10 bg-gray-800/50 backdrop-blur-xl border-b border-gray-700/50 sticky top-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Brand */}
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="w-8 h-8 bg-gradient-to-r from-yellow-400 to-amber-500 rounded-lg flex items-center justify-center p-1.5">
                  <img 
                    src="/logo.png" 
                    alt="Gambino Gold Logo" 
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'block';
                    }}
                  />
                  <span className="text-black font-bold text-xs hidden">G</span>
                </div>
              </div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-yellow-400 to-amber-500 bg-clip-text text-transparent">
                GAMBINO GOLD
              </h1>
            </div>

            {/* Navigation */}
            <nav className="flex space-x-1">
              {getNavItems().map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive(item.href)
                      ? 'bg-gradient-to-r from-yellow-400 to-amber-500 text-black shadow-lg'
                      : 'text-gray-300 hover:text-white hover:bg-gray-700/50'
                  }`}
                >
                  {item.label}
                </a>
              ))}
            </nav>

            {/* User Menu */}
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <div className="text-sm font-medium text-white">
                  {user?.firstName} {user?.lastName}
                </div>
                <div className="text-xs text-gray-400 capitalize">
                  {user?.role?.replace('_', ' ')}
                </div>
              </div>
              <button 
                onClick={handleLogout} 
                className="bg-gradient-to-r from-red-600/80 to-red-700/80 hover:from-red-600 hover:to-red-700 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 shadow-lg backdrop-blur-sm"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Page Header */}
        {pageTitle && (
          <div className="mb-10">
            <div className="bg-gray-800/50 backdrop-blur-xl rounded-2xl p-8 border border-gray-700/50 shadow-2xl">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-4xl font-bold text-white mb-2">
                    {pageTitle}
                  </h2>
                  {pageDescription && (
                    <p className="text-lg text-gray-300">
                      {pageDescription}
                    </p>
                  )}
                </div>
                {pageActions && (
                  <div className="flex items-center space-x-3">
                    {pageActions}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Page Content */}
        {children}
      </div>
    </div>
  );
}

// Reusable UI Components for Admin Pages
export const AdminCard = ({ children, className = '', ...props }) => (
  <div 
    className={`bg-gray-800/50 backdrop-blur-xl rounded-2xl p-6 border border-gray-700/50 shadow-xl ${className}`}
    {...props}
  >
    {children}
  </div>
);

export const AdminButton = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  className = '', 
  ...props 
}) => {
  const baseClasses = "font-semibold rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg";
  
  const variants = {
    primary: "bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-500 hover:to-amber-600 text-black",
    secondary: "bg-gray-700/30 hover:bg-gray-600/50 border border-gray-600/50 hover:border-gray-500/50 text-white backdrop-blur-sm",
    danger: "bg-gradient-to-r from-red-600/80 to-red-700/80 hover:from-red-600 hover:to-red-700 text-white backdrop-blur-sm",
    success: "bg-gradient-to-r from-green-600/80 to-green-700/80 hover:from-green-600 hover:to-green-700 text-white backdrop-blur-sm"
  };

  const sizes = {
    sm: "px-3 py-2 text-sm",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base"
  };

  return (
    <button 
      className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export const AdminMetricCard = ({
  title,
  value,
  subtitle,
  trend,
  color = 'yellow',
  href
}) => {
  const colors = {
    yellow: {
      bg: 'bg-yellow-500/20 group-hover:bg-yellow-500/30',
      border: 'border-gray-600/50 hover:border-yellow-500/50',
      hover: 'hover:bg-yellow-700/30',
      text: 'group-hover:text-yellow-200',
      subtext: 'group-hover:text-yellow-300',
      icon: 'bg-yellow-400'
    },
    green: {
      bg: 'bg-green-500/20 group-hover:bg-green-500/30',
      border: 'border-gray-600/50 hover:border-green-500/50',
      hover: 'hover:bg-green-700/30',
      text: 'group-hover:text-green-200',
      subtext: 'group-hover:text-green-300',
      icon: 'bg-green-400'
    },
    blue: {
      bg: 'bg-blue-500/20 group-hover:bg-blue-500/30',
      border: 'border-gray-600/50 hover:border-blue-500/50',
      hover: 'hover:bg-blue-700/30',
      text: 'group-hover:text-blue-200',
      subtext: 'group-hover:text-blue-300',
      icon: 'bg-blue-400'
    },
    orange: {
      bg: 'bg-orange-500/20 group-hover:bg-orange-500/30',
      border: 'border-gray-600/50 hover:border-orange-500/50',
      hover: 'hover:bg-orange-700/30',
      text: 'group-hover:text-orange-200',
      subtext: 'group-hover:text-orange-300',
      icon: 'bg-orange-400'
    }
  };

  const colorScheme = colors[color] || colors.yellow;
  const Component = href ? 'a' : 'div';
  const interactiveClasses = href ? 'group cursor-pointer' : '';

  return (
    <Component 
      href={href}
      className={`${interactiveClasses} bg-gray-700/30 ${colorScheme.hover} border ${colorScheme.border} rounded-xl p-6 transition-all duration-300 backdrop-blur-sm`}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="mb-3">
            <div className={`font-semibold text-white ${colorScheme.text} transition-colors duration-300`}>
              {title}
            </div>
            {subtitle && (
              <div className={`text-sm text-gray-400 ${colorScheme.subtext} transition-colors duration-300`}>
                {subtitle}
              </div>
            )}
          </div>
          <div className="text-2xl font-bold text-white mb-1">
            {value}
          </div>
          {trend && (
            <div className={`text-sm ${trend.positive ? 'text-green-400' : 'text-red-400'}`}>
              {trend.positive ? '↗' : '↘'} {trend.value}
            </div>
          )}
        </div>
      </div>
    </Component>
  );
};

export const AdminStatusBadge = ({ status, className = '' }) => {
  const colors = {
    active: 'bg-green-900/20 border-green-500/30 text-green-300',
    inactive: 'bg-red-900/20 border-red-500/30 text-red-300',
    pending: 'bg-yellow-900/20 border-yellow-500/30 text-yellow-300',
    maintenance: 'bg-orange-900/20 border-orange-500/30 text-orange-300'
  };
  
  return (
    <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full border backdrop-blur-sm ${colors[status] || colors.inactive} ${className}`}>
      {status}
    </span>
  );
};

export const AdminLoadingSpinner = ({ size = 'md', color = 'yellow' }) => {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  const colors = {
    yellow: 'border-yellow-400',
    white: 'border-white',
    gray: 'border-gray-400'
  };

  return (
    <div className={`${sizes[size]} border-2 ${colors[color]} border-t-transparent rounded-full animate-spin`}></div>
  );
};