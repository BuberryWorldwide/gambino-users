import { useState, useEffect } from 'react';

function GamingStatCard({ title, value, subtitle, icon, highlight = false }) {
  return (
    <div className={`card p-6 ${highlight ? 'ring-2 ring-yellow-500/30' : ''}`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-white">{title}</h3>
        <span className="text-2xl">{icon}</span>
      </div>
      <div className="text-3xl font-bold text-white mb-1">{value}</div>
      {subtitle && <div className="text-sm text-neutral-400">{subtitle}</div>}
    </div>
  );
}

function SessionHistory({ sessionHistory = [] }) {
  return (
    <div className="card p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-white">Recent Mining Sessions</h3>
      </div>
      
      {sessionHistory.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-neutral-400">No mining sessions found</div>
          <div className="text-sm text-neutral-500 mt-2">Start mining to see your session history!</div>
        </div>
      ) : (
        <div className="space-y-3">
          {sessionHistory.slice(0, 10).map((session) => (
            <div key={session.sessionId} className="bg-neutral-800/50 p-4 rounded-lg">
              <div className="flex justify-between items-start">
                <div>
                  <div className="text-white font-medium">
                    {session.machineName || session.machineId}
                  </div>
                  <div className="text-sm text-neutral-400">{session.storeName}</div>
                  <div className="text-xs text-neutral-500 mt-1">
                    {new Date(session.startedAt).toLocaleString()}
                    {session.duration && ` • ${session.duration} min`}
                    {session.totalBets > 0 && ` • Played: ${session.totalBets} GAMBINO`}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-neutral-300">
                    {session.duration ? `${session.duration}m` : 'Active'}
                  </div>
                  {session.totalWinnings !== undefined && session.totalBets !== undefined && (
                    <div className={`font-medium text-sm ${
                      (session.totalWinnings - session.totalBets) >= 0 ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {(session.totalWinnings - session.totalBets) >= 0 ? '+' : ''}{(session.totalWinnings - session.totalBets).toLocaleString()} GAMBINO
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function PerformanceAnalytics({ profile }) {
  const gluckScore = profile?.gluckScore || 0;
  const tier = profile?.tier || 'none';
  const totalJackpots = (profile?.majorJackpots || 0) + (profile?.minorJackpots || 0);
  const uniqueMachines = new Set(profile?.machinesPlayed || []).size;
  
  // Calculate some performance metrics
  const jackpotRate = uniqueMachines > 0 ? (totalJackpots / uniqueMachines * 100).toFixed(1) : 0;
  const accountAge = profile?.createdAt ? 
    Math.floor((Date.now() - new Date(profile.createdAt).getTime()) / (1000 * 60 * 60 * 24)) : 0;
  
  return (
    <div className="card p-6">
      <h3 className="text-lg font-semibold text-white mb-4">Performance Analytics</h3>
      
      <div className="space-y-4">
        {/* Tier Progress */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-neutral-400">Current Tier</span>
            <span className={`font-medium ${
              tier === 'tier1' ? 'text-yellow-400' :
              tier === 'tier2' ? 'text-blue-400' :
              tier === 'tier3' ? 'text-green-400' :
              'text-neutral-400'
            }`}>
              {tier.toUpperCase()}
            </span>
          </div>
          <div className="bg-neutral-800 rounded-full h-2">
            <div 
              className={`h-2 rounded-full ${
                tier === 'tier1' ? 'bg-yellow-400' :
                tier === 'tier2' ? 'bg-blue-400' :
                tier === 'tier3' ? 'bg-green-400' :
                'bg-neutral-600'
              }`}
              style={{ 
                width: `${Math.min((gluckScore / 10000) * 100, 100)}%` 
              }}
            ></div>
          </div>
          <div className="text-xs text-neutral-500 mt-1">
            {gluckScore.toLocaleString()} / 10,000 Glück Score for next tier
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-neutral-800/50 p-3 rounded">
            <div className="text-sm text-neutral-400">Jackpot Rate</div>
            <div className="text-lg font-bold text-white">{jackpotRate}%</div>
            <div className="text-xs text-neutral-500">Per machine played</div>
          </div>
          
          <div className="bg-neutral-800/50 p-3 rounded">
            <div className="text-sm text-neutral-400">Account Age</div>
            <div className="text-lg font-bold text-white">{accountAge}</div>
            <div className="text-xs text-neutral-500">Days active</div>
          </div>
          
          <div className="bg-neutral-800/50 p-3 rounded">
            <div className="text-sm text-neutral-400">Avg Per Machine</div>
            <div className="text-lg font-bold text-white">
              {uniqueMachines > 0 ? (gluckScore / uniqueMachines).toFixed(0) : 0}
            </div>
            <div className="text-xs text-neutral-500">Glück Score</div>
          </div>
          
          <div className="bg-neutral-800/50 p-3 rounded">
            <div className="text-sm text-neutral-400">Success Rate</div>
            <div className="text-lg font-bold text-white">
              {totalJackpots > 0 ? 
                Math.floor((profile?.majorJackpots || 0) / totalJackpots * 100) : 0}%
            </div>
            <div className="text-xs text-neutral-500">Major jackpots</div>
          </div>
        </div>

        {/* Machine Stats */}
        <div>
          <div className="text-sm text-neutral-400 mb-2">Machine History</div>
          <div className="space-y-2">
            <div className="text-xs text-neutral-500">
              Total machines played: {uniqueMachines}
            </div>
            {profile?.machinesPlayed && profile.machinesPlayed.length > 0 && (
              <div className="text-xs text-neutral-500">
                Recent machines: {profile.machinesPlayed.slice(-3).join(', ')}
              </div>
            )}
            {profile?.lastActivity && (
              <div className="text-xs text-neutral-500">
                Last active: {new Date(profile.lastActivity).toLocaleDateString()}
              </div>
            )}
            {profile?.createdAt && (
              <div className="text-xs text-neutral-500">
                Member since: {new Date(profile.createdAt).toLocaleDateString()}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function JackpotHistory({ profile }) {
  // Simplified: Just show basic jackpot info from profile
  // No API calls, no simulation - just real data from profile
  const majorJackpots = profile?.majorJackpots || 0;
  const minorJackpots = profile?.minorJackpots || 0;
  const totalJackpots = majorJackpots + minorJackpots;

  return (
    <div className="card p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-white">Jackpot Summary</h3>
      </div>
      
      {totalJackpots === 0 ? (
        <div className="text-center py-8">
          <div className="text-neutral-400">No jackpots won yet</div>
          <div className="text-sm text-neutral-500 mt-2">Keep mining to hit your first jackpot!</div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Summary Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-yellow-900/20 border border-yellow-500/30 p-4 rounded-lg">
              <div className="text-xs text-yellow-400 uppercase tracking-wider mb-1">Major Jackpots</div>
              <div className="text-2xl font-bold text-yellow-300">{majorJackpots}</div>
            </div>
            <div className="bg-blue-900/20 border border-blue-500/30 p-4 rounded-lg">
              <div className="text-xs text-blue-400 uppercase tracking-wider mb-1">Minor Jackpots</div>
              <div className="text-2xl font-bold text-blue-300">{minorJackpots}</div>
            </div>
          </div>

          {/* Total Summary */}
          <div className="bg-neutral-800/50 p-4 rounded-lg">
            <div className="flex justify-between items-center">
              <div>
                <div className="text-white font-medium">Total Jackpots Won</div>
                <div className="text-sm text-neutral-400">Across all machines</div>
              </div>
              <div className="text-2xl font-bold text-green-400">{totalJackpots}</div>
            </div>
          </div>

          {/* Note about detailed history */}
          <div className="text-xs text-neutral-500 text-center pt-2 border-t border-neutral-700">
            💡 Detailed jackpot history will be available soon
          </div>
        </div>
      )}
    </div>
  );
}

export default function GamingTab({ profile, currentSession, sessionHistory = [] }) {
  const gluckScore = profile?.gluckScore || 0;
  const tier = profile?.tier || 'none';
  const majorJackpots = profile?.majorJackpots || 0;
  const minorJackpots = profile?.minorJackpots || 0;
  const totalJackpots = majorJackpots + minorJackpots;
  const uniqueMachines = new Set(profile?.machinesPlayed || []).size;

  return (
    <div className="space-y-6">
      {/* Current Session Alert */}
      {currentSession && (
        <div className="bg-green-900/20 border border-green-500/30 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
            <h3 className="font-medium text-white">Currently Mining</h3>
          </div>
          <p className="text-green-300">{currentSession.machineName || currentSession.machineId}</p>
          <p className="text-sm text-green-400">{currentSession.storeName}</p>
          <p className="text-xs text-green-500 mt-1">
            Duration: {currentSession.duration || 0} minutes
          </p>
        </div>
      )}

      {/* Mining Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <GamingStatCard 
          title="Glück Score"
          value={gluckScore.toLocaleString()}
          subtitle={`Tier: ${tier.toUpperCase()}`}
          icon="⭐"
          highlight={gluckScore > 1000}
        />
        
        <GamingStatCard 
          title="Total Jackpots"
          value={totalJackpots.toLocaleString()}
          subtitle={`${majorJackpots} major • ${minorJackpots} minor`}
          icon="🎰"
          highlight={totalJackpots > 0}
        />
        
        <GamingStatCard 
          title="Machines Played"
          value={uniqueMachines}
          subtitle="Unique machines"
          icon="⛏️"
        />
        
        <GamingStatCard 
          title="Current Status"
          value={currentSession ? "Mining" : "Offline"}
          subtitle={currentSession ? currentSession.machineName : "Not in session"}
          icon={currentSession ? "🟢" : "🔴"}
          highlight={!!currentSession}
        />
      </div>

      {/* Detailed Mining Information */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <JackpotHistory profile={profile} />
        <PerformanceAnalytics profile={profile} />
      </div>

      {/* Session History */}
      <SessionHistory sessionHistory={sessionHistory} />
    </div>
  );
}