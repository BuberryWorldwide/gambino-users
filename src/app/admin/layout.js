'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api'; // axios instance with baseURL

export default function AdminLayout({ children }) {
  const router = useRouter();
  const [ok, setOk] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const adminToken   = localStorage.getItem('adminToken');
    const userToken    = localStorage.getItem('gambino_token');
    const token = adminToken || userToken;

    if (!token) {
      router.replace('/login');
      return;
    }

    // ensure this call carries the token we want (adminToken first)
    api.get('/api/users/profile', {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(res => {
      const role = res?.data?.user?.role;
      // allow only admin-capable roles in admin area
      if (['super_admin','store_owner','store_manager'].includes(role)) {
        setOk(true);
      } else {
        router.replace('/dashboard');
      }
    })
    .catch(() => {
      // any 401/403 → punt to login
      router.replace('/login');
    });
  }, [router]);

  if (!ok) return null;
  return <>{children}</>;
}
