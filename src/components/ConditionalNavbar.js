// src/components/ConditionalNavbar.js
'use client';

import { usePathname } from 'next/navigation';
import Navbar from './Navbar';

export default function ConditionalNavbar() {
  const pathname = usePathname();
  
  // Hide navbar on admin pages
  const isAdminPage = pathname.startsWith('/admin');
  
  // Don't render anything if we're on an admin page
  if (isAdminPage) {
    return null;
  }
  
  // Render the navbar for all other pages
  return <Navbar />;
}