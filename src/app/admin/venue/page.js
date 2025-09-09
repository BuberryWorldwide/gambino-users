'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

export default function VenueManagerPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const redirectToStore = async () => {
      try {
        const { data } = await api.get('/api/users/profile');
        const assignedVenues = data?.user?.assignedVenues || [];
        
        if (assignedVenues.length > 0) {
          // Direct redirect to their store
          window.location.href = `/admin/stores/${assignedVenues[0]}`;
        } else {
          // No venues assigned
          router.push('/dashboard');
        }
      } catch (error) {
        router.push('/login');
      }
    };

    redirectToStore();
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="text-white">Redirecting to your venue...</div>
    </div>
  );
}