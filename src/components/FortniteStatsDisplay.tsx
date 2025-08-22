'use client';

import React from 'react';
import { FortniteData } from '@/lib/firebase-service';
import { DRONE_SPAWN_DATA } from '@/lib/drone-spawn-data';

interface FortniteStatsDisplayProps {
  stats: FortniteData | null;
  isLoading?: boolean;
  showModes?: boolean;
  compact?: boolean;
}

export default function FortniteStatsDisplay({ 
  stats, 
  isLoading = false, 
  showModes = true,
  compact = false 
}: FortniteStatsDisplayProps) {
  const [showDetailed, setShowDetailed] = React.useState(false);
  const [showMatchDetails, setShowMatchDetails] = React.useState(false);


  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-32 bg-gray-700 rounded-lg"></div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-8 text-gray-400">
        <div className="text-4xl mb-2">📊</div>
        <p>No Fortnite stats available</p>
        <p className="text-sm">Connect your Epic account to see your stats</p>
      </div>
    );
  }

  // Safety check for expected data structure
  if (!stats.stats) {
    console.warn('⚠️ FortniteStatsDisplay: stats.stats is undefined, using fallback data');
    return (
      <div className="text-center py-8 text-gray-400">
        <div className="text-4xl mb-2">⚠️</div>
        <p>Stats data structure is incomplete</p>
        <p className="text-sm">Please refresh or reconnect your Epic account</p>
        <div className="mt-4 text-xs text-gray-500">
          <p>Expected: stats.stats object</p>
          <p>Received: {JSON.stringify(stats, null, 2)}</p>
        </div>
      </div>
    );
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toLocaleString();
  };

  const formatPercentage = (num: number) => {
    return (num * 100).toFixed(1) + '%';
  };

  const exportStatsToTxt = () => {
    if (!stats) return;
    
    const content = `FORTNITE STATS EXPORT
Generated: ${new Date().toLocaleString()}
Account: ${stats.epicName} (${stats.epicId})

OVERALL STATISTICS:
==================
Total Matches: ${stats.stats?.matches || 0}
Wins: ${stats.stats?.top1 || 0} (${formatPercentage((stats.stats?.top1 || 0) / Math.max(stats.stats?.matches || 1, 1))} Win Rate)
K/D Ratio: ${stats.stats?.kd?.toFixed(2) || '0.00'}
Top 3: ${stats.stats?.top3 || 0}
Top 5: ${stats.stats?.top5 || 0}
Top 10: ${stats.stats?.top10 || 0} (${formatPercentage((stats.stats?.top10 || 0) / Math.max(stats.stats?.matches || 1, 1))} Rate)
Top 25: ${stats.stats?.top25 || 0}
Kills: ${stats.stats?.kills || 0}
Deaths: ${stats.stats?.deaths || 0}
Assists: ${stats.stats?.assists || 0}
Damage Dealt: ${stats.stats?.damageDealt || 0}
Damage Taken: ${stats.stats?.damageTaken || 0}
Time Alive: ${stats.stats?.timeAlive || 0} seconds
Distance Traveled: ${stats.stats?.distanceTraveled || 0} units
Materials Gathered: ${stats.stats?.materialsGathered || 0}
Structures Built: ${stats.stats?.structuresBuilt || 0}

MODE BREAKDOWN:
===============
Solo: ${stats.modes?.solo?.matches || 0} matches, ${stats.modes?.solo?.top1 || 0} wins, ${stats.modes?.solo?.kd?.toFixed(2) || '0.00'} K/D
Duo: ${stats.modes?.duo?.matches || 0} matches, ${stats.modes?.duo?.top1 || 0} wins, ${stats.modes?.duo?.kd?.toFixed(2) || '0.00'} K/D
Squad: ${stats.modes?.squad?.matches || 0} matches, ${stats.modes?.squad?.top1 || 0} wins, ${stats.modes?.squad?.kd?.toFixed(2) || '0.00'} K/D

Data Source: ${stats.dataSource || 'Unknown'}
Data Quality: ${stats.dataQuality || 'Unknown'}
Last Updated: ${stats.syncedAt ? new Date(stats.syncedAt).toLocaleString() : 'Unknown'}
Notes: ${stats.notes || 'None'}`;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fortnite-stats-${stats.epicName}-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const StatCard = ({ title, value, subtitle, color = 'blue' }: {
    title: string;
    value: string | number;
    subtitle?: string;
    color?: 'blue' | 'green' | 'red' | 'yellow' | 'purple';
  }) => (
    <div className={`bg-gray-800 rounded-lg p-4 border-l-4 border-${color}-500`}>
      <div className="text-sm text-gray-400 mb-1">{title}</div>
      <div className="text-2xl font-bold text-white mb-1">{value}</div>
      {subtitle && <div className="text-xs text-gray-500">{subtitle}</div>}
    </div>
  );

  const ModeStats = ({ mode, title }: { mode: any; title: string }) => {
    if (!mode || !mode.matches || mode.matches === 0) return null;
    
    return (
      <div className="bg-gray-800 rounded-lg p-4">
        <h4 className="text-lg font-semibold text-white mb-3">{title}</h4>
        <div className="grid grid-cols-2 gap-3">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-400">{mode.matches}</div>
            <div className="text-xs text-gray-400">Matches</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-400">{mode.kd?.toFixed(2) || '0.00'}</div>
            <div className="text-xs text-gray-400">K/D</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-400">{mode.top1}</div>
            <div className="text-xs text-gray-400">Wins</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-400">{formatPercentage(mode.top1 / mode.matches)}</div>
            <div className="text-xs text-gray-400">Win Rate</div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-white">Fortnite Stats</h3>
          <p className="text-gray-400 text-sm">
            Last updated: {stats.syncedAt ? new Date(stats.syncedAt).toLocaleDateString() : 'Unknown'}
          </p>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-400">Data Source</div>
          <div className="text-xs px-2 py-1 bg-blue-500/20 text-blue-400 rounded-full">
            {stats.dataSource?.toUpperCase() || 'OSIRION'}
          </div>
        </div>
      </div>

      {/* Overall Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard 
          title="Total Matches" 
          value={formatNumber(stats.stats?.matches || 0)} 
          color="blue"
        />
        <StatCard 
          title="Wins" 
          value={formatNumber(stats.stats?.top1 || 0)} 
          subtitle={`${formatPercentage((stats.stats?.top1 || 0) / Math.max(stats.stats?.matches || 1, 1))} Win Rate`}
          color="green"
        />
        <StatCard 
          title="K/D Ratio" 
          value={stats.stats?.kd?.toFixed(2) || '0.00'} 
          color="yellow"
        />
        <StatCard 
          title="Top 10" 
          value={formatNumber(stats.stats?.top10 || 0)} 
          subtitle={`${formatPercentage((stats.stats?.top10 || 0) / Math.max(stats.stats?.matches || 1, 1))} Rate`}
          color="purple"
        />
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <StatCard 
          title="Kills" 
          value={formatNumber(stats.stats?.kills || 0)} 
          color="green"
        />
        <StatCard 
          title="Deaths" 
          value={formatNumber(stats.stats?.deaths || 0)} 
          color="red"
        />
        <StatCard 
          title="Damage Dealt" 
          value={formatNumber(stats.stats?.damageDealt || 0)} 
          color="yellow"
        />
        <StatCard 
          title="Top 25" 
          value={formatNumber(stats.stats?.top25 || 0)} 
          color="blue"
        />
        <StatCard 
          title="Top 5" 
          value={formatNumber(stats.stats?.top5 || 0)} 
          color="purple"
        />
        <StatCard 
          title="Top 3" 
          value={formatNumber(stats.stats?.top3 || 0)} 
          color="green"
        />
      </div>

      {/* Mode-specific Stats */}
      {showModes && (
        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-white">Mode Breakdown</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <ModeStats mode={stats.modes?.solo} title="Solo" />
            <ModeStats mode={stats.modes?.duo} title="Duo" />
            <ModeStats mode={stats.modes?.squad} title="Squad" />
            <ModeStats mode={stats.modes?.arena} title="Arena" />
          </div>
        </div>
      )}

             {/* Data Quality Info */}
       <div className="bg-gray-800/50 rounded-lg p-3 text-center">
         <div className="text-sm text-gray-400">
           Data Quality: <span className="text-green-400 font-medium">{stats.dataQuality || 'High'}</span>
           {stats.notes && (
             <span className="ml-2 text-gray-500">• {stats.notes}</span>
           )}
         </div>
       </div>

       {/* Show More / Export Section */}
       <div className="flex flex-col sm:flex-row gap-3 justify-center">
         <button
           onClick={() => setShowDetailed(!showDetailed)}
           className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
         >
           {showDetailed ? 'Show Less' : 'Show More Stats'}
         </button>
         
         <button
           onClick={exportStatsToTxt}
           className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
         >
           📥 Export Stats (TXT)
         </button>
         
         <button
           onClick={() => setShowDetailed(!showDetailed)}
           className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
         >
           🤖 {showDetailed ? 'Hide' : 'Show'} Drone Spawns
         </button>
         
         {stats.rawOsirionData?.matches && (
           <button
             onClick={() => setShowMatchDetails(!showMatchDetails)}
             className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
           >
             {showMatchDetails ? 'Hide Match Details' : 'Show Match Details'}
           </button>
         )}
       </div>

       {/* Detailed Stats Section */}
       {showDetailed && (
         <div className="bg-gray-800/50 rounded-lg p-6 space-y-4">
           <h4 className="text-lg font-semibold text-white text-center">Detailed Statistics</h4>
           
           <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
             <div className="text-center">
               <div className="text-2xl font-bold text-blue-400">{stats.stats?.damageDealt || 0}</div>
               <div className="text-xs text-gray-400">Total Damage</div>
             </div>
             <div className="text-center">
               <div className="text-2xl font-bold text-red-400">{stats.stats?.damageTaken || 0}</div>
               <div className="text-xs text-gray-400">Damage Taken</div>
             </div>
             <div className="text-center">
               <div className="text-2xl font-bold text-yellow-400">{stats.stats?.materialsGathered || 0}</div>
               <div className="text-xs text-gray-400">Materials</div>
             </div>
             <div className="text-center">
               <div className="text-2xl font-bold text-purple-400">{stats.stats?.structuresBuilt || 0}</div>
               <div className="text-xs text-gray-400">Structures</div>
             </div>
           </div>

           {stats.rawOsirionData?.preferences && (
             <div className="bg-gray-700/50 rounded-lg p-4">
               <h5 className="text-md font-semibold text-white mb-3">Player Preferences</h5>
               <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                 <div>
                   <span className="text-gray-400">Preferred Drop:</span>
                   <div className="text-white font-medium">{stats.rawOsirionData.preferences.preferredDrop || 'Unknown'}</div>
                 </div>
                 <div>
                   <span className="text-gray-400">Weakest Zone:</span>
                   <div className="text-white font-medium">{stats.rawOsirionData.preferences.weakestZone || 'Unknown'}</div>
                 </div>
                 <div>
                   <span className="text-gray-400">Best Weapon:</span>
                   <div className="text-white font-medium">{stats.rawOsirionData.preferences.bestWeapon || 'Unknown'}</div>
                 </div>
                 <div>
                   <span className="text-gray-400">Avg Survival:</span>
                   <div className="text-white font-medium">{Math.round((stats.rawOsirionData.preferences.avgSurvivalTime || 0) / 60)}m</div>
                 </div>
               </div>
             </div>
           )}
         </div>
       )}

               {/* Match Details Section */}
        {showMatchDetails && stats.rawOsirionData?.matches && (
          <div className="bg-gray-800/50 rounded-lg p-6">
            <h4 className="text-lg font-semibold text-white text-center mb-4">Recent Match Details</h4>
            
            <div className="max-h-96 overflow-y-auto space-y-3">
              {stats.rawOsirionData.matches.slice(0, 20).map((match: any, index: number) => (
                <div key={match.id || index} className="bg-gray-700/50 rounded-lg p-3">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-400">Match #{index + 1}</span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      match.placement === 1 ? 'bg-yellow-600 text-white' :
                      match.placement <= 3 ? 'bg-orange-600 text-white' :
                      match.placement <= 10 ? 'bg-green-600 text-white' :
                      match.placement <= 25 ? 'bg-blue-600 text-white' :
                      'bg-gray-600 text-white'
                    }`}>
                      #{match.placement}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div>
                      <span className="text-gray-400">Kills:</span>
                      <div className="text-white font-medium">{match.kills || 0}</div>
                    </div>
                    <div>
                      <span className="text-gray-400">Assists:</span>
                      <div className="text-white font-medium">{match.assists || 0}</div>
                    </div>
                    <div>
                      <span className="text-gray-400">Damage:</span>
                      <div className="text-white font-medium">{Math.round(match.damage || 0)}</div>
                    </div>
                  </div>
                  
                  {match.survivalTime && (
                    <div className="mt-2 text-xs text-gray-400">
                      Survival: {Math.round(match.survivalTime / 60)}m {Math.round(match.survivalTime % 60)}s
                    </div>
                  )}
                </div>
              ))}
            </div>
            
            <div className="text-center mt-4 text-sm text-gray-400">
              Showing {Math.min(20, stats.rawOsirionData.matches.length)} of {stats.rawOsirionData.matches.length} matches
            </div>
          </div>
        )}

        {/* Building & Resource Stats Section */}
        {showDetailed && stats.rawOsirionData?.matches && (
          <div className="bg-gray-800/50 rounded-lg p-6 space-y-4">
            <h4 className="text-lg font-semibold text-white text-center">🏗️ Building & Resource Analysis</h4>
            
            {/* Resource Gathering Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-400">
                  {Math.round(stats.rawOsirionData.matches.reduce((sum: number, m: any) => sum + (m.woodFarmed || 0), 0))}
                </div>
                <div className="text-xs text-gray-400">Total Wood</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-400">
                  {Math.round(stats.rawOsirionData.matches.reduce((sum: number, m: any) => sum + (m.stoneFarmed || 0), 0))}
                </div>
                <div className="text-xs text-gray-400">Total Stone</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-400">
                  {Math.round(stats.rawOsirionData.matches.reduce((sum: number, m: any) => sum + (m.metalFarmed || 0), 0))}
                </div>
                <div className="text-xs text-gray-400">Total Metal</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-400">
                  {Math.round(stats.rawOsirionData.matches.reduce((sum: number, m: any) => sum + (m.buildingHits || 0), 0))}
                </div>
                <div className="text-xs text-gray-400">Building Hits</div>
              </div>
            </div>

            {/* Building Efficiency */}
            <div className="bg-gray-700/50 rounded-lg p-4">
              <h5 className="text-md font-semibold text-white mb-3">Building Efficiency</h5>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                <div>
                  <span className="text-gray-400">Structures Built:</span>
                  <div className="text-white font-medium">
                    {Math.round(stats.rawOsirionData.matches.reduce((sum: number, m: any) => sum + (m.woodBuildsPlaced || 0) + (m.stoneBuildsPlaced || 0) + (m.metalBuildsPlaced || 0), 0))}
                  </div>
                </div>
                <div>
                  <span className="text-gray-400">Builds Edited:</span>
                  <div className="text-white font-medium">
                    {Math.round(stats.rawOsirionData.matches.reduce((sum: number, m: any) => sum + (m.buildsEdited || 0), 0))}
                  </div>
                </div>
                <div>
                  <span className="text-gray-400">Edit Success Rate:</span>
                  <div className="text-white font-medium">
                    {(() => {
                      const totalEdits = stats.rawOsirionData.matches.reduce((sum: number, m: any) => sum + (m.buildsEdited || 0), 0);
                      const successfulEdits = stats.rawOsirionData.matches.reduce((sum: number, m: any) => sum + (m.buildsEditedSuccessfully || 0), 0);
                      return totalEdits > 0 ? Math.round((successfulEdits / totalEdits) * 100) : 0;
                    })()}%
                  </div>
                </div>
                <div>
                  <span className="text-gray-400">Avg Edit Time:</span>
                  <div className="text-white font-medium">
                    {(() => {
                      const totalTime = stats.rawOsirionData.matches.reduce((sum: number, m: any) => sum + (m.buildsEditedTotalTime || 0), 0);
                      const totalEdits = stats.rawOsirionData.matches.reduce((sum: number, m: any) => sum + (m.buildsEdited || 0), 0);
                      return totalEdits > 0 ? Math.round(totalTime / totalEdits / 1000000) : 0;
                    })()}ms
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Drone Spawn Locations Section */}
        {showDetailed && (
          <div className="bg-gray-800/50 rounded-lg p-6 space-y-4">
            <h4 className="text-lg font-semibold text-white text-center">🤖 Drone Spawn Locations</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {DRONE_SPAWN_DATA.locations.map((location, index) => (
                <div key={index} className="bg-gray-700/50 rounded-lg p-4 border-l-4 border-blue-500">
                  <div className="flex items-center justify-between mb-2">
                    <h5 className="text-lg font-semibold text-white">{location.name}</h5>
                    <div className={`px-2 py-1 rounded text-xs font-medium ${
                      location.strategicValue === 'high' ? 'bg-green-600 text-white' :
                      location.strategicValue === 'medium' ? 'bg-yellow-600 text-white' :
                      'bg-red-600 text-white'
                    }`}>
                      {location.strategicValue.toUpperCase()}
                    </div>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Spawn Rate:</span>
                      <span className="text-white font-medium">{location.spawnRate}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Loot Tier:</span>
                      <span className="text-white font-medium">{location.lootTier}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Frequency:</span>
                      <span className="text-white font-medium">{location.spawnFrequency.replace(/_/g, ' ')}</span>
                    </div>
                  </div>
                  
                  <div className="mt-3">
                    <h6 className="text-sm font-medium text-gray-300 mb-2">Strategic Notes:</h6>
                    <ul className="text-xs text-gray-400 space-y-1">
                      {location.notes.map((note, noteIndex) => (
                        <li key={noteIndex} className="flex items-start">
                          <span className="text-blue-400 mr-2">•</span>
                          {note}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="bg-gray-700/50 rounded-lg p-4 mt-4">
              <h5 className="text-md font-semibold text-white mb-3">Tournament Strategy</h5>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-400">Early Game:</span>
                  <div className="text-white font-medium">{DRONE_SPAWN_DATA.tournamentStrategy.earlyGame}</div>
                </div>
                <div>
                  <span className="text-gray-400">Mid Game:</span>
                  <div className="text-white font-medium">{DRONE_SPAWN_DATA.tournamentStrategy.midGame}</div>
                </div>
                <div>
                  <span className="text-gray-400">End Game:</span>
                  <div className="text-white font-medium">{DRONE_SPAWN_DATA.tournamentStrategy.endGame}</div>
                </div>
                <div>
                  <span className="text-gray-400">Risk Assessment:</span>
                  <div className="text-white font-medium">{DRONE_SPAWN_DATA.tournamentStrategy.riskAssessment}</div>
                </div>
              </div>
            </div>
          </div>
        )}
     </div>
   );
 }
