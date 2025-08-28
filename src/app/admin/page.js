// app/admin/page.js
'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { getToken } from '@/lib/auth';

const ADMIN_ROLES = ['super_admin', 'store_owner', 'store_manager'];

export default function AdminHome() {
  const router = useRouter();

  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState('');

  // data
  const [leaderboard, setLeaderboard] = useState([]);
  const [purchases, setPurchases] = useState(null); // could be list or summary
  const [jackpots, setJackpots] = useState(null);   // could be list or summary

  // Gate on token presence before doing any requests
  useEffect(() => {
    const t = getToken();
    if (!t) {
      router.replace('/login?next=/admin');
      return;
    }
    setReady(true);
  }, [router]);

  useEffect(() => {
    if (!ready) return;
    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        setError('');

        // 1) who am I?
        const profRes = await api.get('/api/users/profile');
        if (cancelled) return;
        const user = profRes?.data?.user || {};
        setProfile(user);

        // 2) role gate
        const role = user?.role || 'user';
        if (!ADMIN_ROLES.includes(role)) {
          router.replace('/dashboard');
          return;
        }

        // 3) Load live data in parallel (defensive on params)
        const since7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

        const reqs = [
          api.get('/api/leaderboard', { params: { timeframe: '7d', limit: 10 } }).catch(() => null),
          api.get('/api/tokens/purchase', {
            params: { timeframe: '7d', since: since7d, limit: 250, summary: 'true' }
          }).catch(() => null),
          api.get('/api/gaming/jackpot', {
            params: { timeframe: '7d', since: since7d, limit: 250, summary: 'true' }
          }).catch(() => null),
        ];

        const [lbRes, purRes, jackRes] = await Promise.all(reqs);
        if (cancelled) return;

        // Leaderboard: accept either { leaderboard: [...] } or an array
        const lb = lbRes?.data?.leaderboard || lbRes?.data || [];
        setLeaderboard(Array.isArray(lb) ? lb : []);

        // Purchases: accept { summary: {...} } OR array of records
        setPurchases(purRes?.data ?? null);

        // Jackpots: accept { summary: {...} } OR array of records
        setJackpots(jackRes?.data ?? null);
      } catch (e) {
        const status = e?.response?.status;
        if (status === 401) {
          router.replace('/login?next=/admin');
          return;
        }
        setError(e?.response?.data?.error || e?.message || 'Failed to load admin data');
      } finally {
        setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [ready, router]);

  // Compute simple quick stats from whatever shapes we got back
  const quick = useMemo(() => {
    // Users: we don’t have a live users-count endpoint; show LB size as a proxy
    const usersApprox = Array.isArray(leaderboard) ? leaderboard.length : 0;

    // Revenue 7d: prefer summary.total if present; else sum amounts from list
    let revenue7d = 0;
    if (purchases?.summary?.totalAmount != null) {
      revenue7d = Number(purchases.summary.totalAmount) || 0;
    } else if (Array.isArray(purchases)) {
      revenue7d = purchases.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    }

    // Tx 7d: prefer summary.count; else length
    let tx7d = 0;
    if (purchases?.summary?.count != null) {
      tx7d = Number(purchases.summary.count) || 0;
    } else if (Array.isArray(purchases)) {
      tx7d = purchases.length;
    }

    // Stores: not available in live endpoints; hide or set 0
    const stores = 0;

    return { usersApprox, stores, revenue7d, tx7d };
  }, [leaderboard, purchases]);

  if (!ready || loading) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-semibold mb-4">Admin Overview</h1>
        <div className="text-neutral-400">Loading admin data…</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-semibold mb-4">Admin Overview</h1>
        <div className="bg-red-900/20 border border-red-500 text-red-300 p-4 rounded-lg">
          {error}
        </div>
        <div className="mt-4">
          <button className="btn btn-ghost" onClick={() => location.reload()}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold">Admin Overview</h1>
          <p className="text-neutral-400">
            Welcome{profile?.email ? `, ${profile.email}` : ''}. Manage stores, users, and treasury.
          </p>
        </div>
        <div className="hidden md:block text-sm text-neutral-500">
          Role: <span className="uppercase">{profile?.role}</span>
        </div>
      </div>

      {/* Quick stats (from live endpoints only) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Top Players Listed" value={quick.usersApprox} />
        <StatCard label="Stores" value={quick.stores} />
        <StatCard label="Tx (7d)" value={quick.tx7d} />
        <StatCard label="Revenue (7d)" value={formatCurrency(quick.revenue7d)} />
      </div>

      {/* Sections */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <NavCard
          title="Stores"
          description="Add locations, edit details, manage store wallets."
          href="/admin/stores"
          icon="🏪"
        />
        <NavCard
          title="Users"
          description="Search, view, and adjust user accounts and balances."
          href="/admin/users"
          icon="👤"
        />
        <NavCard
          title="Treasury"
          description="View balances and execute GAMB/USDC transfers."
          href="/admin/treasury"
          icon="🏛️"
        />
      </div>

      {/* Leaderboard preview */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-lg">Leaderboard (7d)</h2>
          <Link href="/admin/leaderboard" className="text-yellow-400 text-sm">Open →</Link>
        </div>
        <ul className="divide-y divide-neutral-800">
          {(leaderboard || []).slice(0, 10).map((p, i) => (
            <li key={p?.userId || i} className="py-2 flex items-center justify-between text-sm">
              <div className="flex items-center gap-3">
                <span className="text-neutral-500 w-6 text-right">{i + 1}</span>
                <span className="font-medium">{p?.email || p?.username || p?.wallet || 'Player'}</span>
              </div>
              <div className="text-neutral-400">
                Glück: <span className="text-neutral-200 font-semibold">{p?.gluck || p?.gluckScore || 0}</span>
              </div>
            </li>
          ))}
          {(!leaderboard || leaderboard.length === 0) && (
            <li className="py-2 text-neutral-500">No leaderboard data.</li>
          )}
        </ul>
      </div>

      {/* 7d Purchases / Jackpots glance (optional display if shapes are lists) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <SummaryCard
          title="Purchases (7d)"
          hint="Totals computed client-side if no summary."
          items={Array.isArray(purchases) ? purchases.slice(0, 6) : []}
          total={formatCurrency(
            purchases?.summary?.totalAmount ??
            (Array.isArray(purchases) ? purchases.reduce((s, r) => s + (Number(r.amount) || 0), 0) : 0)
          )}
          count={
            purchases?.summary?.count ??
            (Array.isArray(purchases) ? purchases.length : 0)
          }
          link="/admin/purchases"
        />
        <SummaryCard
          title="Jackpots (7d)"
          hint="Totals computed client-side if no summary."
          items={Array.isArray(jackpots) ? jackpots.slice(0, 6) : []}
          total={formatCurrency(
            jackpots?.summary?.totalPayout ??
            (Array.isArray(jackpots) ? jackpots.reduce((s, r) => s + (Number(r.payout) || 0), 0) : 0)
          )}
          count={
            jackpots?.summary?.count ??
            (Array.isArray(jackpots) ? jackpots.length : 0)
          }
          link="/admin/jackpots"
        />
      </div>
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="card p-4">
      <div className="text-neutral-400 text-sm">{label}</div>
      <div className="text-2xl font-bold mt-1">{value}</div>
    </div>
  );
}

function NavCard({ title, description, href, icon }) {
  return (
    <Link href={href} className="card p-5 hover:border-yellow-500/40 transition-colors">
      <div className="flex items-start gap-3">
        <div className="text-2xl">{icon}</div>
        <div>
          <div className="font-semibold text-lg">{title}</div>
          <p className="text-sm text-neutral-400 mt-1">{description}</p>
          <div className="text-yellow-400 text-sm mt-3">Open →</div>
        </div>
      </div>
    </Link>
  );
}

function SummaryCard({ title, hint, items, total, count, link }) {
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h3 className="font-semibold">{title}</h3>
          <div className="text-xs text-neutral-500">{hint}</div>
        </div>
        <Link href={link} className="text-yellow-400 text-sm">Open →</Link>
      </div>
      <div className="text-sm text-neutral-400 mb-2">
        <span className="mr-4">Count: <span className="text-neutral-200 font-semibold">{count}</span></span>
        <span>Total: <span className="text-neutral-200 font-semibold">{total}</span></span>
      </div>
      <ul className="divide-y divide-neutral-800">
        {items.map((r, i) => (
          <li key={r?.id || r?._id || i} className="py-2 flex items-center justify-between text-sm">
            <span className="truncate mr-3">{r?.user?.email || r?.userEmail || r?.wallet || r?.store || 'Entry'}</span>
            <span className="text-neutral-300">
              {formatCurrency(r?.amount ?? r?.payout ?? 0)}
            </span>
          </li>
        ))}
        {(!items || items.length === 0) && (
          <li className="py-2 text-neutral-500">No recent records.</li>
        )}
      </ul>
    </div>
  );
}

function formatCurrency(n) {
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(Number(n) || 0);
  } catch {
    return `$${Number(n || 0).toLocaleString()}`;
  }
}
