'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface TournamentCoachingProps {
  fortniteStats?: any;
  onCoachingGenerated?: (coaching: any) => void;
}

interface TournamentCoaching {
  strategy: string;
  loadoutRecommendation: string;
  statsAnalysis: string;
  regionalContext: string;
  playstyleRecommendation: string;
  riskLevel: string;
  averagePointsNeeded: number;
  pointsRemaining: number;
  confidence: number;
  nextGameTarget: number;
  safetyTips: string[];
}

export default function TournamentCoaching({ fortniteStats, onCoachingGenerated }: TournamentCoachingProps) {
  const { user } = useAuth();
  const [selectedMode, setSelectedMode] = useState<'solo' | 'duos'>('solo');
  const [selectedRegion, setSelectedRegion] = useState<'NAC' | 'EU'>('NAC');
  const [currentPoints, setCurrentPoints] = useState<number>(0);
  const [gamesRemaining, setGamesRemaining] = useState<number>(10);
  const [targetPoints, setTargetPoints] = useState<number>(300);
  const [coaching, setCoaching] = useState<TournamentCoaching | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const generateCoaching = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/tournament-coaching', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.uid,
          tournamentType: selectedMode,
          region: selectedRegion,
          currentPoints,
          gamesRemaining,
          targetPoints,
          userStats: fortniteStats
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        setCoaching(data.coaching);
        onCoachingGenerated?.(data.coaching);
      } else {
        console.error('Failed to generate coaching:', data.error);
      }
    } catch (error) {
      console.error('Error generating tournament coaching:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'text-green-400';
      case 'medium': return 'text-yellow-400';
      case 'high': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getPlaystyleColor = (style: string) => {
    switch (style) {
      case 'passive': return 'text-blue-400';
      case 'balanced': return 'text-purple-400';
      case 'aggressive': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  return (
    <div className="bg-white/5 rounded-lg p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-primary-text">🏆 Tournament Coaching</h3>
        {coaching && (
          <div className="text-sm text-secondary-text">
            Confidence: <span className="text-accent font-bold">{(coaching.confidence * 100).toFixed(0)}%</span>
          </div>
        )}
      </div>

      {/* Tournament Settings */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div>
          <label className="block text-sm font-medium text-secondary-text mb-1">Mode</label>
          <select
            value={selectedMode}
            onChange={(e) => setSelectedMode(e.target.value as 'solo' | 'duos')}
            className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded text-primary-text text-sm"
          >
            <option value="solo">Solo</option>
            <option value="duos">Duos</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-secondary-text mb-1">Region</label>
          <select
            value={selectedRegion}
            onChange={(e) => setSelectedRegion(e.target.value as 'NAC' | 'EU')}
            className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded text-primary-text text-sm"
          >
            <option value="NAC">NAC</option>
            <option value="EU">EU</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-secondary-text mb-1">Current Points</label>
          <input
            type="number"
            value={currentPoints}
            onChange={(e) => setCurrentPoints(Number(e.target.value))}
            className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded text-primary-text text-sm"
            placeholder="0"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-secondary-text mb-1">Games Left</label>
          <input
            type="number"
            value={gamesRemaining}
            onChange={(e) => setGamesRemaining(Number(e.target.value))}
            className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded text-primary-text text-sm"
            placeholder="10"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-secondary-text mb-1">Target Points</label>
          <input
            type="number"
            value={targetPoints}
            onChange={(e) => setTargetPoints(Number(e.target.value))}
            className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded text-primary-text text-sm"
            placeholder="300"
          />
        </div>
      </div>

      {/* Generate Button */}
      <button
        onClick={generateCoaching}
        disabled={isLoading || !user}
        className="w-full px-4 py-3 bg-accent hover:bg-accent/80 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
      >
        {isLoading ? 'Generating Coaching...' : '🚀 Generate Tournament Coaching'}
      </button>

      {/* Coaching Results */}
      {coaching && (
        <div className="space-y-6">
          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white/5 rounded p-3 text-center">
              <div className="text-lg font-bold text-primary-text">
                {coaching.averagePointsNeeded.toFixed(1)}
              </div>
              <div className="text-xs text-secondary-text">Avg Points/Game</div>
            </div>
            <div className="bg-white/5 rounded p-3 text-center">
              <div className="text-lg font-bold text-primary-text">
                {coaching.pointsRemaining}
              </div>
              <div className="text-xs text-secondary-text">Points Needed</div>
            </div>
            <div className="bg-white/5 rounded p-3 text-center">
              <div className={`text-lg font-bold ${getRiskColor(coaching.riskLevel)}`}>
                {coaching.riskLevel.toUpperCase()}
              </div>
              <div className="text-xs text-secondary-text">Risk Level</div>
            </div>
            <div className="bg-white/5 rounded p-3 text-center">
              <div className={`text-lg font-bold ${getPlaystyleColor(coaching.playstyleRecommendation)}`}>
                {coaching.playstyleRecommendation.toUpperCase()}
              </div>
              <div className="text-xs text-secondary-text">Playstyle</div>
            </div>
          </div>

          {/* Main Strategy */}
          <div className="bg-white/5 rounded-lg p-4">
            <h4 className="font-semibold text-primary-text mb-3">🎯 Strategy</h4>
            <div className="text-secondary-text text-sm whitespace-pre-line">
              {coaching.strategy}
            </div>
          </div>

          {/* Loadout Recommendation */}
          <div className="bg-white/5 rounded-lg p-4">
            <h4 className="font-semibold text-primary-text mb-3">🔫 Loadout</h4>
            <div className="text-secondary-text text-sm whitespace-pre-line">
              {coaching.loadoutRecommendation}
            </div>
          </div>

          {/* Stats Analysis */}
          {coaching.statsAnalysis && (
            <div className="bg-white/5 rounded-lg p-4">
              <h4 className="font-semibold text-primary-text mb-3">📊 Your Stats Analysis</h4>
              <div className="text-secondary-text text-sm whitespace-pre-line">
                {coaching.statsAnalysis}
              </div>
            </div>
          )}

          {/* Regional Context */}
          <div className="bg-white/5 rounded-lg p-4">
            <h4 className="font-semibold text-primary-text mb-3">🌍 Regional Context</h4>
            <div className="text-secondary-text text-sm whitespace-pre-line">
              {coaching.regionalContext}
            </div>
          </div>

          {/* Safety Tips */}
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
            <h4 className="font-semibold text-red-400 mb-3">⚠️ Critical Safety Tips</h4>
            <ul className="space-y-1">
              {coaching.safetyTips.map((tip, index) => (
                <li key={index} className="text-red-300 text-sm flex items-start">
                  <span className="text-red-400 mr-2">•</span>
                  {tip}
                </li>
              ))}
            </ul>
          </div>

          {/* Next Game Target */}
          <div className="bg-accent/10 border border-accent/20 rounded-lg p-4 text-center">
            <h4 className="font-semibold text-accent mb-2">🎯 Next Game Target</h4>
            <div className="text-2xl font-bold text-accent">
              {coaching.nextGameTarget} points
            </div>
            <div className="text-sm text-accent/80 mt-1">
              Focus on achieving this minimum in your next game
            </div>
          </div>
        </div>
      )}

      {!user && (
        <div className="text-center py-4">
          <p className="text-secondary-text">
            Sign in to get personalized tournament coaching based on your stats
          </p>
        </div>
      )}
    </div>
  );
}
