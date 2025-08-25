'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { getToken } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import StatBox from '@/components/StatBox';

export default function Dashboard() {
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!getToken()) { router.push('/login'); return; }
    api.get('/api/users/profile')
      .then(({data}) => setProfile(data.user))
      .catch((err) => setError(err?.response?.data?.error || 'Failed to load profile'));
  }, [router]);

  if (!getToken()) return null;

  return (
    <div>
      <h1 className="text-3xl font-bold mb-3">Dashboard</h1>
      {error && <p className="text-red-400 text-sm">{error}</p>}
      {!profile ? (
        <div className="text-zinc-400">Loading…</div>
      ) : (
        <div className="grid md:grid-cols-3 gap-4">
          <StatBox label="GAMBINO Balance" value={profile.gambinoBalance.toLocaleString()} sub={profile.walletAddress}/>
          <StatBox label="Glück Score" value={profile.gluckScore.toLocaleString()} sub={`Tier: ${profile.tier}`}/>
          <StatBox label="Jackpots" value={profile.totalJackpots} sub={`Major ${profile.majorJackpots} • Minor ${profile.minorJackpots}`}/>
          <div className="md:col-span-3 card">
            <div className="text-zinc-400 text-sm mb-2">Machines Played</div>
            <div className="flex flex-wrap gap-2">
              {profile.machinesPlayed?.length ? profile.machinesPlayed.map(m => (
                <span key={m} className="px-2 py-1 rounded bg-zinc-800 border border-zinc-700 text-xs">{m}</span>
              )) : <span className="text-zinc-500">No data yet</span>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
