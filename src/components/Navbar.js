'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getToken, clearToken } from '@/lib/auth';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [authed, setAuthed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    setAuthed(!!getToken());
  }, [pathname]);

  const handleLogout = () => {
    clearToken();
    setMobileMenuOpen(false);
    router.push('/login');
  };

  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <nav className="sticky top-0 z-40 border-b border-neutral-800 bg-black/85 backdrop-blur-xl">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(600px_200px_at_50%_-20%,rgba(234,179,8,0.08),transparent_60%)]" />
      </div>

      <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between relative z-10">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-neutral-900/70 backdrop-blur-sm border border-neutral-700/50 shadow-lg shadow-black/25 overflow-hidden group-hover:border-yellow-500/30 transition-colors">
            <Image src="/logo.png" alt="Gambino Logo" width={32} height={32} className="object-contain" />
          </div>
          <div className="font-extrabold text-xl tracking-tight">
            <span className="bg-gradient-to-r from-yellow-400 via-yellow-500 to-amber-600 bg-clip-text text-transparent">
              Gambino Gold
            </span>
          </div>
        </Link>

        <div className="hidden md:flex items-center gap-6">
          <Link
            href="/network"
            className={`text-sm transition-all duration-200 hover:text-yellow-400 ${
              pathname === '/network' ? 'text-yellow-400 font-medium' : 'text-neutral-300'
            }`}
          >
            Network Status
          </Link>

          <Link
            href="/guide"
            className={`text-sm transition-all duration-200 hover:text-yellow-400 ${
              pathname === '/guide' ? 'text-yellow-400 font-medium' : 'text-neutral-300'
            }`}
          >
            Guide
          </Link>

          <Link
            href="/help"
            className={`text-sm transition-all duration-200 hover:text-yellow-400 ${
              pathname === '/help' ? 'text-yellow-400 font-medium' : 'text-neutral-300'
            }`}
          >
            Help
          </Link>

          {authed ? (
            <>
              <Link
                href="/dashboard"
                className={`text-sm transition-all duration-200 hover:text-yellow-400 ${
                  pathname === '/dashboard' ? 'text-yellow-400 font-medium' : 'text-neutral-300'
                }`}
              >
                Dashboard
              </Link>
              <Link
                href="/dashboard?tab=account"
                className={`text-sm transition-all duration-200 hover:text-yellow-400 ${
                  pathname === '/dashboard' ? 'text-neutral-300' : 'text-neutral-300'
                }`}
              >
                Account
              </Link>
              <button
                className="text-sm text-neutral-300 hover:text-yellow-400 transition-all duration-200"
                onClick={handleLogout}
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="text-sm text-neutral-300 hover:text-yellow-400 transition-all duration-200">
                Login
              </Link>
              <Link href="/onboard" className="btn btn-gold text-sm px-4 py-2">
                Get Started
              </Link>
            </>
          )}
        </div>

        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 rounded-lg text-neutral-300 hover:text-white hover:bg-neutral-800/50 transition-colors"
          aria-label="Toggle mobile menu"
        >
          <svg className={`h-6 w-6 transition-transform duration-300 ${mobileMenuOpen ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {mobileMenuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden border-t border-neutral-800 bg-black/95 backdrop-blur-xl">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30 md:hidden" onClick={closeMobileMenu} />
          <div className="relative z-40">
            <nav className="flex flex-col px-4 py-4 space-y-1">
              <Link
                href="/network"
                className={`px-3 py-3 text-sm transition-colors hover:text-white hover:bg-neutral-800/30 rounded-lg ${
                  pathname === '/network' ? 'text-yellow-400 bg-neutral-800/20' : 'text-neutral-300'
                }`}
                onClick={closeMobileMenu}
              >
                <div className="flex items-center gap-3">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Network Status
                </div>
              </Link>

              <Link
                href="/guide"
                className={`px-3 py-3 text-sm transition-colors hover:text-white hover:bg-neutral-800/30 rounded-lg ${
                  pathname === '/guide' ? 'text-yellow-400 bg-neutral-800/20' : 'text-neutral-300'
                }`}
                onClick={closeMobileMenu}
              >
                <div className="flex items-center gap-3">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                  Guide
                </div>
              </Link>

              <Link
                href="/help"
                className={`px-3 py-3 text-sm transition-colors hover:text-white hover:bg-neutral-800/30 rounded-lg ${
                  pathname === '/help' ? 'text-yellow-400 bg-neutral-800/20' : 'text-neutral-300'
                }`}
                onClick={closeMobileMenu}
              >
                <div className="flex items-center gap-3">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Help
                </div>
              </Link>

              {authed ? (
                <>
                  <Link
                    href="/dashboard"
                    className={`px-3 py-3 text-sm transition-colors hover:text-white hover:bg-neutral-800/30 rounded-lg ${
                      pathname === '/dashboard' ? 'text-yellow-400 bg-neutral-800/20' : 'text-neutral-300'
                    }`}
                    onClick={closeMobileMenu}
                  >
                    <div className="flex items-center gap-3">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                      Dashboard
                    </div>
                  </Link>

                  <Link
                    href="/dashboard?tab=account"
                    className="px-3 py-3 text-sm transition-colors hover:text-white hover:bg-neutral-800/30 rounded-lg text-neutral-300"
                    onClick={closeMobileMenu}
                  >
                    <div className="flex items-center gap-3">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      Account
                    </div>
                  </Link>

                  <button
                    className="px-3 py-3 text-sm text-neutral-300 transition-colors hover:text-white hover:bg-neutral-800/30 rounded-lg text-left"
                    onClick={handleLogout}
                  >
                    <div className="flex items-center gap-3">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      Logout
                    </div>
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="px-3 py-3 text-sm text-neutral-300 transition-colors hover:text-white hover:bg-neutral-800/30 rounded-lg"
                    onClick={closeMobileMenu}
                  >
                    <div className="flex items-center gap-3">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                      </svg>
                      Login
                    </div>
                  </Link>

                  <div className="pt-4 mt-4 border-t border-neutral-800">
                    <Link
                      href="/onboard"
                      className="block w-full rounded-lg bg-yellow-500 text-black px-6 py-3 text-center text-sm font-semibold transition-all duration-300 hover:bg-yellow-400"
                      onClick={closeMobileMenu}
                    >
                      Get Started
                    </Link>
                  </div>
                </>
              )}
            </nav>
          </div>
        </div>
      )}
    </nav>
  );
}