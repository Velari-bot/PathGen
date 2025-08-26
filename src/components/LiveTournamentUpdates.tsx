'use client';

import { useState, useEffect } from 'react';
import { LiveTournamentService, ALL_TOURNAMENT_DATA } from '@/lib/tournament-data';

interface LiveTournamentUpdatesProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LiveTournamentUpdates({ isOpen, onClose }: LiveTournamentUpdatesProps) {
  const [selectedTournament, setSelectedTournament] = useState<string>('');
  const [selectedRegion, setSelectedRegion] = useState<string>('');
  const [updates, setUpdates] = useState<any[]>([]);
  const [currentEstimates, setCurrentEstimates] = useState<any[]>([]);
  const [breakdown, setBreakdown] = useState<any>(null);

  const tournaments = [
    { name: 'CLIX RELOAD ICON CUP', key: 'clix' },
    { name: 'BUGHA RELOAD ICON CUP', key: 'bugha' },
    { name: 'C6S4 Console Victory Cash Cup #2', key: 'console' },
    { name: 'C6S4 Blade of Champions Cup', key: 'blade' }
  ];

  const regions = ['EU', 'NA', 'OCE', 'ASIA'];

  useEffect(() => {
    if (selectedTournament) {
      const latestUpdates = LiveTournamentService.getLatestUpdates(selectedTournament, selectedRegion || undefined);
      const estimates = LiveTournamentService.getCurrentPointEstimates(selectedTournament, selectedRegion || undefined);
      const tournamentBreakdown = LiveTournamentService.getTournamentBreakdown(selectedTournament);
      
      setUpdates(latestUpdates);
      setCurrentEstimates(estimates);
      setBreakdown(tournamentBreakdown);
    }
  }, [selectedTournament, selectedRegion]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700 bg-gray-800">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">📊</span>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Live Tournament Updates</h2>
              <p className="text-gray-400 text-sm">Real-time point estimates and strategy updates</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-gray-700 rounded-lg"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-80px)] p-6">
          {/* Tournament Selection */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-white mb-4">Select Tournament</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {tournaments.map((tournament) => (
                <button
                  key={tournament.key}
                  onClick={() => setSelectedTournament(tournament.name)}
                  className={`p-4 rounded-lg border-2 transition-all duration-300 ${
                    selectedTournament === tournament.name
                      ? 'border-green-500 bg-green-500 bg-opacity-20'
                      : 'border-gray-600 hover:border-gray-500'
                  }`}
                >
                  <h4 className="text-white font-medium">{tournament.name}</h4>
                </button>
              ))}
            </div>
          </div>

          {/* Region Selection */}
          {selectedTournament && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-white mb-4">Select Region (Optional)</h3>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedRegion('')}
                  className={`px-4 py-2 rounded-lg border transition-all duration-300 ${
                    selectedRegion === ''
                      ? 'border-blue-500 bg-blue-500 bg-opacity-20 text-white'
                      : 'border-gray-600 text-gray-300 hover:border-gray-500'
                  }`}
                >
                  All Regions
                </button>
                {regions.map((region) => (
                  <button
                    key={region}
                    onClick={() => setSelectedRegion(region)}
                    className={`px-4 py-2 rounded-lg border transition-all duration-300 ${
                      selectedRegion === region
                        ? 'border-blue-500 bg-blue-500 bg-opacity-20 text-white'
                        : 'border-gray-600 text-gray-300 hover:border-gray-500'
                    }`}
                  >
                    {region}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Current Point Estimates */}
          {currentEstimates.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-white mb-4">Current Point Estimates</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {currentEstimates.map((estimate, index) => (
                  <div key={index} className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-white font-medium">{estimate.rank}</h4>
                      <span className="text-green-400 font-bold text-lg">{estimate.points}</span>
                    </div>
                    <p className="text-gray-400 text-sm">
                      Updated: {new Date(estimate.timestamp).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tournament Breakdown */}
          {breakdown && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-white mb-4">Tournament Breakdown Example</h3>
              <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                <div className="text-center mb-4">
                  <h4 className="text-white font-semibold text-xl">{breakdown.rank}</h4>
                  <p className="text-green-400 font-bold text-2xl">{breakdown.points} points</p>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                  <div className="text-center">
                    <p className="text-gray-400">Wins</p>
                    <p className="text-white font-medium">{breakdown.example.wins}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-gray-400">Top 5s</p>
                    <p className="text-white font-medium">{breakdown.example.top5s}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-gray-400">Top 10s</p>
                    <p className="text-white font-medium">{breakdown.example.top10s}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-gray-400">Top 20s</p>
                    <p className="text-white font-medium">{breakdown.example.top20s}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-gray-400">Elims per Game</p>
                    <p className="text-white font-medium">{breakdown.example.elimsPerGame}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-gray-400">Spare Games</p>
                    <p className="text-white font-medium">{breakdown.example.spareGames}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Live Updates History */}
          {updates.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-white mb-4">Live Updates History</h3>
              <div className="space-y-4">
                {updates.slice(0, 5).map((update, index) => (
                  <div key={index} className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="text-white font-medium">{update.tournamentName}</h4>
                        <p className="text-gray-400 text-sm">{update.region} • {new Date(update.timestamp).toLocaleString()}</p>
                      </div>
                      <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm">
                        Update #{updates.length - index}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-3">
                      {update.updates.map((pointUpdate: any, pointIndex: number) => (
                        <div key={pointIndex} className="bg-gray-700 rounded-lg p-3">
                          <div className="flex items-center justify-between">
                            <span className="text-gray-300 text-sm">{pointUpdate.rank}</span>
                            <span className="text-green-400 font-bold">{pointUpdate.points}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {update.notes && (
                      <div className="bg-yellow-900 bg-opacity-30 border border-yellow-600 rounded-lg p-3">
                        <p className="text-yellow-200 text-sm">{update.notes}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Strategy Tips */}
          {selectedTournament && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-white mb-4">Strategy Tips</h3>
              <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                <ul className="space-y-2">
                  {LiveTournamentService.getTournamentStrategy(selectedTournament).map((tip, index) => (
                    <li key={index} className="flex items-start space-x-2">
                      <span className="text-green-400 mt-1">•</span>
                      <span className="text-gray-300 text-sm">{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Queue Advice */}
          {selectedTournament && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-white mb-4">Queue Advice</h3>
              <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                {LiveTournamentService.getQueueAdvice(selectedTournament, selectedRegion || undefined).length > 0 ? (
                  <ul className="space-y-2">
                    {LiveTournamentService.getQueueAdvice(selectedTournament, selectedRegion || undefined).map((advice, index) => (
                      <li key={index} className="flex items-start space-x-2">
                        <span className="text-blue-400 mt-1">•</span>
                        <span className="text-gray-300 text-sm">{advice}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-400 text-sm">No specific queue advice available for this tournament.</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
