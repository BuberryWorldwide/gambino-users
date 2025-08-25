'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { getToken, clearToken } from '@/lib/auth';
import { useEffect, useState } from 'react';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [authed, setAuthed] = useState(false);

  useEffect(() => { setAuthed(!!getToken()); }, [pathname]);

  return (
    <nav className="border-b border-zinc-800 sticky top-0 z-40 bg-black/60 backdrop-blur">
      <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
        <Link href="/" className="font-extrabold text-2xl text-gold">GAMBINO</Link>
        <div className="flex gap-3">
          <Link href="/leaderboard" className="text-sm text-zinc-300 hover:text-gold">Leaderboard</Link>
          {authed ? (
            <>
              <Link href="/dashboard" className="text-sm text-zinc-300 hover:text-gold">Dashboard</Link>
              <button
                className="text-sm text-zinc-300 hover:text-gold"
                onClick={() => { clearToken(); router.push('/login'); }}
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="text-sm text-zinc-300 hover:text-gold">Login</Link>
              <Link href="/onboard" className="btn btn-gold text-sm">Get Started</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
