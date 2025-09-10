// src/components/layout/AdminLayout.js
'use client';
import { useRouter, usePathname } from 'next/navigation';
import { getToken, clearToken, getUser } from '@/lib/auth';
import { useEffect, useState } from 'react';

export default function AdminLayout({ children, pageTitle, pageDescription, pageActions }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.push('/admin/login');
      return;
    }
    
    const userData = getUser();
    setUser(userData);
  }, [router]);

  const handleLogout = () => {
    clearToken();
    router.push('/admin/login');
  };

  const navItems = [
    { href: '/admin/dashboard', label: 'Dashboard', icon: '📊' },
    { href: '/admin/stores', label: 'Stores', icon: '🏪' },
    { href: '/admin/users', label: 'Users', icon: '👥' },
    { href: '/admin/treasury', label: 'Treasury', icon: '💰' },
    { href: '/admin/analytics', label: 'Analytics', icon: '📈' },
  ];

  const isActive = (href) => pathname === href || pathname.startsWith(href + '/');

  if (!user) return null;

  return (
    <div className="min-h-screen bg-neutral-950">
      {/* Main App Header */}
      <header className="bg-neutral-900 border-b border-neutral-700 px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-yellow-500 rounded flex items-center justify-center">
              <span className="text-black font-bold text-sm">G</span>
            </div>
            <span className="text-white font-semibold">GAMBINO</span>
          </div>
          
          <nav className="flex items-center gap-6">
            <a href="/leaderboard" className="text-neutral-300 hover:text-white transition-colors">
              Leaderboard
            </a>
            <a href="/dashboard" className="text-neutral-300 hover:text-white transition-colors">
              Dashboard
            </a>
            <a href="/account" className="text-neutral-300 hover:text-white transition-colors">
              Account
            </a>
            <button 
              onClick={handleLogout}
              className="text-neutral-300 hover:text-white transition-colors"
            >
              Logout
            </button>
          </nav>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar Navigation */}
        <aside className="w-64 bg-neutral-900 border-r border-neutral-700 min-h-[calc(100vh-64px)]">
          <div className="p-6">
            {/* User Info */}
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">
                  {user?.firstName?.[0] || 'A'}
                </span>
              </div>
              <div>
                <div className="text-white font-medium">
                  {user?.firstName || 'Admin'}
                </div>
                <div className="text-neutral-400 text-sm capitalize">
                  {user?.role?.replace('_', ' ') || 'Administrator'}
                </div>
              </div>
            </div>
            
            {/* Navigation */}
            <nav className="space-y-2">
              {navItems.map((item) => (
                <NavItem 
                  key={item.href}
                  href={item.href} 
                  active={isActive(item.href)}
                  icon={item.icon}
                >
                  {item.label}
                </NavItem>
              ))}
            </nav>
          </div>
        </aside>
        
        {/* Main Content */}
        <main className="flex-1 p-8">
          {/* Page Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">
                {pageTitle}
              </h1>
              {pageDescription && (
                <p className="text-neutral-400">{pageDescription}</p>
              )}
            </div>
            {pageActions && (
              <div className="flex items-center gap-3">
                {pageActions}
              </div>
            )}
          </div>

          {/* Page Content */}
          {children}
        </main>
      </div>
    </div>
  );
}

function NavItem({ href, active, children, icon }) {
  return (
    <a 
      href={href}
      className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
        active 
          ? 'bg-yellow-500 text-black font-medium' 
          : 'text-neutral-300 hover:bg-neutral-800 hover:text-white'
      }`}
    >
      <span className="text-lg">{icon}</span>
      {children}
    </a>
  );
}