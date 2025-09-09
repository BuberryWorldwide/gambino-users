'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

export default function AdminLayout({ children }) {
  const router = useRouter();
  const [ok, setOk] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const adminToken = localStorage.getItem('adminToken');
    const userToken = localStorage.getItem('gambino_token');
    const token = adminToken || userToken;

    if (!token) {
      router.replace('/login');
      return;
    }

    // Get user profile to check role and handle redirects
    api.get('/api/users/profile', {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(res => {
      const user = res?.data?.user;
      const role = user?.role;
      
      console.log('Admin layout - User role:', role);
      console.log('Admin layout - Assigned venues:', user?.assignedVenues);
      
      // Allow admin-capable roles in admin area
      const adminRoles = ['super_admin', 'gambino_ops', 'venue_manager', 'venue_staff'];
      
      if (adminRoles.includes(role)) {
        // Special handling for venue managers - redirect to their assigned store
        if (role === 'venue_manager' && user?.assignedVenues?.length > 0) {
          const currentPath = window.location.pathname;
          const targetStore = `/admin/stores/${user.assignedVenues[0]}`;
          
          // Redirect if on admin root OR not on their store page
          if (currentPath === '/admin' || !currentPath.startsWith(`/admin/stores/${user.assignedVenues[0]}`)) {
            console.log('Redirecting venue manager to:', targetStore);
            router.replace(targetStore);
            return;
          }
        }
        
        setOk(true);
      } else {
        // Non-admin roles go to regular dashboard
        router.replace('/dashboard');
      }
    })
    .catch(() => {
      // Any 401/403 → punt to login
      router.replace('/login');
    });
  }, [router]);

  if (!ok) return null;
  return <>{children}</>;
}