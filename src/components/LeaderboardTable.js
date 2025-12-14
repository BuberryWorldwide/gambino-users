export default function LeaderboardTable({ rows = [] }) {
  return (
    <div className="card overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead className="text-zinc-400">
          <tr>
            <th className="text-left py-2">#</th>
            <th className="text-left py-2">User</th>
            <th className="text-left py-2">Glück</th>
            <th className="text-left py-2">Tier</th>
            <th className="text-left py-2">Balance</th>
            <th className="text-left py-2">Member Since</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.rank} className="border-t border-zinc-800/60">
              <td className="py-2">{r.rank}</td>
              <td className="py-2">{r.email}</td>
              <td className="py-2">{r.gluckScore}</td>
              <td className="py-2">{r.tier}</td>
              <td className="py-2">{r.balance || 0} GAMB</td>
              <td className="py-2">{new Date(r.memberSince).toLocaleDateString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
