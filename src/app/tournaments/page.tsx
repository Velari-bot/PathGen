'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import PremiumOnly from '@/components/PremiumOnly';

interface TournamentWeek {
  id: string;
  name: string;
  region: string;
  mode: string;
  date: string;
  isActive: boolean;
  pointThresholds: {
    top100: number;
    top500: number;
    top1000: number;
    top2500: number;
    top7500: number;
  };
  estimates: {
    top100: number;
    top500: number;
    top1000: number;
    top2500: number;
    top7500: number;
  };
  finalResults?: {
    top100: number;
    top500: number;
    top1000: number;
    top2500: number;
    top7500: number;
  };
}

interface UserPerformance {
  weekId: string;
  totalPoints: number;
  finalPlacement: number;
  totalGames: number;
  targetPoints: number;
  achievedGoal: boolean;
}

export default function TournamentsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'tracker' | 'calculator'>('overview');
  const [selectedRegion, setSelectedRegion] = useState<'NAC' | 'EU'>('NAC');
  const [selectedMode, setSelectedMode] = useState<'solo' | 'duos'>('solo');
  
  // Calculator state
  const [currentPoints, setCurrentPoints] = useState<number>(0);
  const [gamesRemaining, setGamesRemaining] = useState<number>(10);
  const [targetPoints, setTargetPoints] = useState<number>(300);
  
  // Tracker state
  const [userPerformances, setUserPerformances] = useState<UserPerformance[]>([]);

  // Mock tournament data (in real app, this would come from your tournament service)
  const tournaments: TournamentWeek[] = [
    {
      id: 'c6s4-solo-nac-week1',
      name: 'C6S4 SOLO SERIES #1',
      region: 'NAC',
      mode: 'solo',
      date: '2024-01-01',
      isActive: false,
      pointThresholds: {
        top100: 309,
        top500: 273,
        top1000: 256,
        top2500: 226,
        top7500: 159
      },
      estimates: {
        top100: 305,
        top500: 275,
        top1000: 260,
        top2500: 235,
        top7500: 170
      },
      finalResults: {
        top100: 309,
        top500: 273,
        top1000: 256,
        top2500: 226,
        top7500: 159
      }
    },
    {
      id: 'c6s4-solo-eu-week1',
      name: 'C6S4 SOLO SERIES #1',
      region: 'EU',
      mode: 'solo',
      date: '2024-01-01',
      isActive: false,
      pointThresholds: {
        top100: 329,
        top500: 298,
        top1000: 285,
        top2500: 265,
        top7500: 232
      },
      estimates: {
        top100: 315,
        top500: 290,
        top1000: 275,
        top2500: 255,
        top7500: 220
      },
      finalResults: {
        top100: 329,
        top500: 298,
        top1000: 285,
        top2500: 265,
        top7500: 232
      }
    },
    {
      id: 'c6s4-duos-trials',
      name: 'C6S4 DUOS TRIALS',
      region: 'NAC',
      mode: 'duos',
      date: '2024-01-08',
      isActive: true,
      pointThresholds: {
        top100: 0, // Live updates during tournament
        top500: 0,
        top1000: 0,
        top2500: 0,
        top7500: 0
      },
      estimates: {
        top100: 350,
        top500: 320,
        top1000: 290,
        top2500: 260,
        top7500: 200
      }
    }
  ];

  const filteredTournaments = tournaments.filter(t => 
    t.region === selectedRegion && t.mode === selectedMode
  );

  // Tournament Calculator
  const calculateScenarios = () => {
    const pointsNeeded = targetPoints - currentPoints;
    const averageNeeded = gamesRemaining > 0 ? pointsNeeded / gamesRemaining : 0;

    const scenarios = [];

    if (selectedMode === 'solo') {
      // Conservative scenario
      scenarios.push({
        name: 'Placement Strategy',
        description: 'Focus on consistent placements',
        games: [
          { placement: 'Top 5', eliminations: 2, points: 52 },
          { placement: 'Top 10', eliminations: 1, points: 42 },
          { placement: 'Top 25', eliminations: 0, points: 30 }
        ],
        totalPoints: currentPoints + 124,
        difficulty: 'Medium',
        success: '70%'
      });

      // Aggressive scenario
      scenarios.push({
        name: 'Win Strategy',
        description: 'Go for wins with eliminations',
        games: [
          { placement: 'Win', eliminations: 12, points: 84 },
          { placement: 'Top 10', eliminations: 2, points: 44 }
        ],
        totalPoints: currentPoints + 128,
        difficulty: 'Hard',
        success: '30%'
      });
    } else {
      // Duos scenarios
      scenarios.push({
        name: 'Duos Placement',
        description: 'Max placement every game',
        games: [
          { placement: 'Top 5', eliminations: 3, points: 63 },
          { placement: 'Top 10', eliminations: 2, points: 57 },
          { placement: 'Top 15', eliminations: 1, points: 51 }
        ],
        totalPoints: currentPoints + 171,
        difficulty: 'Medium',
        success: '65%'
      });
    }

    return { averageNeeded, scenarios };
  };

  const { averageNeeded, scenarios } = calculateScenarios();

  return (
    <PremiumOnly 
      pageName="Tournament Hub" 
      description="Track your competitive performance, calculate optimal strategies, and master tournament gameplay with real C6S4 data and AI-powered insights."
      showNavbar={false}
      showFooter={false}
    >
      <div className="min-h-screen bg-gradient-dark flex flex-col">
        <Navbar />
        
      <div className="flex-1 relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 pt-20 sm:pt-24">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-gradient">
              🏆 Tournament Hub
            </h1>
          <p className="text-xl text-secondary-text max-w-3xl mx-auto">
            Track tournaments, analyze performance, and get AI-powered strategies for competitive Fortnite
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex justify-center mb-8">
          <div className="glass-card p-2 flex space-x-2">
            {[
              { key: 'overview', label: '📊 Overview', icon: '📊' },
              { key: 'tracker', label: '📈 Performance', icon: '📈' },
              { key: 'calculator', label: '🧮 Calculator', icon: '🧮' }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                  activeTab === tab.key
                    ? 'bg-accent text-white shadow-lg'
                    : 'text-secondary-text hover:text-primary-text hover:bg-white/5'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Region and Mode Selectors */}
        <div className="flex justify-center space-x-4 mb-8">
          <div className="glass-card p-2 flex space-x-2">
            {['NAC', 'EU'].map((region) => (
              <button
                key={region}
                onClick={() => setSelectedRegion(region as any)}
                className={`px-4 py-2 rounded font-medium transition-all ${
                  selectedRegion === region
                    ? 'bg-blue-600 text-white'
                    : 'text-secondary-text hover:text-primary-text'
                }`}
              >
                {region}
              </button>
            ))}
            </div>
            
          <div className="glass-card p-2 flex space-x-2">
            {['solo', 'duos'].map((mode) => (
              <button
                key={mode}
                onClick={() => setSelectedMode(mode as any)}
                className={`px-4 py-2 rounded font-medium capitalize transition-all ${
                  selectedMode === mode
                    ? 'bg-purple-600 text-white'
                    : 'text-secondary-text hover:text-primary-text'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
          </div>

        {/* Content based on active tab */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Current Tournaments */}
            <div className="glass-card p-6">
              <h2 className="text-2xl font-bold text-primary-text mb-6">
                📅 {selectedRegion} {selectedMode.charAt(0).toUpperCase() + selectedMode.slice(1)} Tournaments
              </h2>
              
              <div className="space-y-4">
                {filteredTournaments.map((tournament) => (
                  <div key={tournament.id} className="border border-white/10 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl font-semibold text-primary-text">
                          {tournament.name}
                        </h3>
                        <p className="text-secondary-text">
                          {tournament.region} • {new Date(tournament.date).toLocaleDateString()}
                          {tournament.isActive && (
                            <span className="ml-2 px-2 py-1 bg-green-500 text-white text-xs rounded">
                              LIVE
                            </span>
                          )}
                        </p>
              </div>
            </div>

                    {/* Point Thresholds */}
                    <div className="grid grid-cols-5 gap-4 text-center">
                      {Object.entries(tournament.finalResults || tournament.pointThresholds).map(([rank, points]) => (
                        <div key={rank} className="bg-white/5 rounded p-3">
                          <div className="text-sm text-secondary-text capitalize">
                            {rank.replace(/(\d+)/, ' $1')}
                          </div>
                          <div className="text-lg font-bold text-primary-text">
                            {points || 'TBD'}
                </div>
                          {tournament.estimates && (
                            <div className="text-xs text-accent">
                              Est: {tournament.estimates[rank as keyof typeof tournament.estimates]}
                </div>
                          )}
              </div>
                      ))}
            </div>

                    {tournament.finalResults && (
                      <div className="mt-4 p-3 bg-green-500/10 border border-green-500/20 rounded">
                        <p className="text-green-400 text-sm">
                          ✅ Tournament completed • Final qualification estimate: {selectedRegion === 'NAC' ? '1,200' : '1,300'} points for Series Final
                        </p>
                </div>
                    )}
                </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'calculator' && (
          <div className="space-y-8">
            <div className="glass-card p-6">
              <h2 className="text-2xl font-bold text-primary-text mb-6">
                🧮 Tournament Points Calculator
              </h2>
              
              {/* Calculator Inputs */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-secondary-text mb-2">
                    Current Points
                  </label>
                  <input
                    type="number"
                    value={currentPoints}
                    onChange={(e) => setCurrentPoints(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-primary-text"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-text mb-2">
                    Games Remaining
                  </label>
                  <input
                    type="number"
                    value={gamesRemaining}
                    onChange={(e) => setGamesRemaining(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-primary-text"
                    placeholder="10"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-text mb-2">
                    Target Points
                  </label>
                  <input
                    type="number"
                    value={targetPoints}
                    onChange={(e) => setTargetPoints(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-primary-text"
                    placeholder="300"
                  />
              </div>
            </div>

              {/* Results */}
              <div className="bg-white/5 rounded-lg p-4 mb-6">
                <h3 className="text-lg font-semibold text-primary-text mb-2">📊 Analysis</h3>
                <p className="text-secondary-text">
                  You need <span className="text-accent font-bold">{targetPoints - currentPoints} more points</span> in{' '}
                  <span className="text-accent font-bold">{gamesRemaining} games</span>
                </p>
                <p className="text-secondary-text">
                  Average needed per game: <span className="text-accent font-bold">{averageNeeded.toFixed(1)} points</span>
                </p>
                
                {averageNeeded > 50 && (
                  <div className="mt-3 p-3 bg-red-500/10 border border-red-500/20 rounded">
                    <p className="text-red-400 text-sm">
                      ⚠️ High average needed - consider going for wins and eliminations
                    </p>
                  </div>
                )}
                {averageNeeded <= 30 && (
                  <div className="mt-3 p-3 bg-green-500/10 border border-green-500/20 rounded">
                    <p className="text-green-400 text-sm">
                      ✅ Achievable with consistent placement strategy
                    </p>
                </div>
                )}
              </div>

              {/* Scenarios */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-primary-text">🎯 Recommended Scenarios</h3>
                {scenarios.map((scenario, index) => (
                  <div key={index} className="border border-white/10 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-semibold text-primary-text">{scenario.name}</h4>
                        <p className="text-sm text-secondary-text">{scenario.description}</p>
            </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-accent">
                          {scenario.totalPoints} pts
                </div>
                        <div className="text-xs text-secondary-text">
                          {scenario.difficulty} • {scenario.success} success
                </div>
              </div>
            </div>

                    <div className="grid grid-cols-3 gap-2 text-sm">
                      {scenario.games.map((game, gameIndex) => (
                        <div key={gameIndex} className="bg-white/5 rounded p-2 text-center">
                          <div className="font-medium text-primary-text">{game.placement}</div>
                          <div className="text-secondary-text">{game.eliminations} elims</div>
                          <div className="text-accent">{game.points} pts</div>
                        </div>
                      ))}
                </div>
                </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'tracker' && (
          <div className="space-y-8">
            <div className="glass-card p-6">
              <h2 className="text-2xl font-bold text-primary-text mb-6">
                📈 Performance Tracker
              </h2>
              
              {!user ? (
                <div className="text-center py-8">
                  <p className="text-secondary-text mb-4">
                    Sign in to track your tournament performance and get personalized insights
                  </p>
                  <button className="bg-accent hover:bg-accent/80 text-white px-6 py-3 rounded-lg font-medium">
                    Sign In
                  </button>
                </div>
              ) : (
                <div>
                  {/* Add Performance Entry */}
                  <div className="bg-white/5 rounded-lg p-4 mb-6">
                    <h3 className="text-lg font-semibold text-primary-text mb-4">
                      ➕ Add Tournament Result
                    </h3>
                    {/* Add form for entering tournament results */}
                    <p className="text-secondary-text">
                      Performance tracking form will be implemented here
                </p>
              </div>

                  {/* Performance History */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-primary-text">
                      📊 Your Tournament History
                    </h3>
                    {userPerformances.length === 0 ? (
                      <p className="text-secondary-text">
                        No tournament results yet. Add your first result above!
                      </p>
                    ) : (
                      <div>Performance history will be displayed here</div>
                    )}
              </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
    </PremiumOnly>
  );
}