import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-[70vh] grid place-items-center text-center">
      <div>
        <h1 className="text-6xl font-extrabold text-gold mb-4">GAMBINO</h1>
        <p className="text-xl text-zinc-300 mb-8">Farm Luck. Mine Destiny.</p>
        <div className="flex gap-3 justify-center">
          <Link href="/onboard" className="btn btn-gold">Get Started</Link>
          <Link href="/leaderboard" className="btn btn-ghost">View Leaderboard</Link>
        </div>
      </div>
    </div>
  );
}
