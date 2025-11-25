'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
  const router = useRouter();
  
  useEffect(() => {
    // Redirect to your actual registration page
    router.replace('/onboard');
  }, [router]);
  
  return (
    <div className="min-h-screen flex items-center justify-center relative">
      <div className="text-white">Redirecting to registration...</div>
    </div>
  );
}