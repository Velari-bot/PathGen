'use client';

import React, { useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import PremiumOnly from '@/components/PremiumOnly';

export default function TournamentStrategyPage() {
  const [selectedMode, setSelectedMode] = useState<'solo' | 'duos' | 'both'>('both');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const strategies = [
    {
      id: 'solo-placement-core',
      title: 'Solo Placement Strategy (Core)',
      category: 'general',
      mode: 'solo',
      difficulty: 'intermediate',
      content: `The golden rules of Solos are: Hide and rotate early.

Your best tactic is to play placement in every game. It's obvious when you realize that Top 10 is 40 points, and you would need 20 elims to get the same number of points from elims.

Most players who aim for consistent placements will do better than those who try to key every game.`,
      tips: [
        'Hide and rotate early - this is the golden rule',
        'Top 10 = 40 points vs 20 eliminations for same points',
        'Avoid unnecessary fights in early/mid game',
        'Only take fights you\'re confident you can win',
        'Consistency beats high-risk high-reward plays'
      ],
      effectiveness: { placement: 9, consistency: 9, skillRequired: 5 }
    },
    {
      id: 'crash-pad-safety',
      title: 'Crash Pad Bug Prevention (CRITICAL)',
      category: 'safety',
      mode: 'both',
      difficulty: 'beginner',
      content: `⚠️ CRITICAL: Crash pad bug is still in the game and causing tournament-ending deaths. We aren't sure exactly what causes it, but all clips we have seen are when you double bounce or run out of fizz during the pad.

The crash pad might get vaulted today, but if it's still in the game, follow these rules to avoid the bug that has cost many players their tournaments.

ALL DEATHS appear to be due to one of these two situations: double bouncing with crash pads OR running out of fizz mid-air during pad usage.`,
      tips: [
        'DON\'T double bounce with 2 crash pads',
        'NO bunny hopping when landing from pad if going downhill',
        'DON\'T run out of fizz in the air - this is deadly',
        'Fizz just BEFORE you pad, not during the pad usage',
        'Be extra careful with crash pad rotations in tournaments',
        'Consider alternative rotation methods if unsure'
      ],
      effectiveness: { placement: 10, consistency: 10, skillRequired: 3 }
    },
    {
      id: 'duos-trials-results',
      title: 'C6S4 Duos Trials - Final Results & Analysis',
      category: 'results',
      mode: 'duos',
      difficulty: 'intermediate',
      content: `Final results from the first C6S4 Duos Trial are now in. These are the ACTUAL thresholds that players achieved.

**NAC Results:**
- Top 1000: 250 points (Example: 3 Top 5s + 6 elims, 2 Top 10s + 4 elims, 2 Top 20s + 2 elims)
- Top 3000: 205 points  
- Top 7000: 150 points

**EU Results (Higher competition):**
- Top 1000: 275 points (Example: 1 Win + 8 elims, 2 Top 5s + 6 elims, 2 Top 10s + 4 elims, 2 Top 20s + 2 elims)
- Top 3000: 247 points
- Top 13000: 186 points

Queue bug was still happening - if you ever get to 6 minutes, you definitely have queue bug and should unready/ready again.`,
      tips: [
        'Use 6 minute queue time if you\'re Top 100, 5 minutes for everyone else',
        'If queue hits 6 minutes, you have queue bug - unready and requeue',
        'EU is more competitive than NAC by about 25 points',
        'Division targeting: Top 1K for Div 2, Top 3K for Div 3, Top 7K/13K for Div 4',
        'Save games for clutch moments - many players saved games and pushed at the end',
        'Max placement strategy recommended if you\'re near division cutoffs'
      ],
      effectiveness: { placement: 8, consistency: 9, skillRequired: 6 }
    },
    {
      id: 'duos-division-strategy',
      title: 'Duos Division Targeting',
      category: 'general',
      mode: 'duos',
      difficulty: 'intermediate',
      content: `**Division Targets**:
- Div 1/2 Trios players → Aim for Div 2 Duos (Top 1000)
- Div 3 Trios players → Aim for Div 3 Duos (Top 3000)
- Below Div 3 → Aim for Div 4 Duos (Top 13k EU / Top 7k NAC)

Point System: Win = 65 points, Elim = 1 point. Most points from placement.`,
      tips: [
        'Be confident in first game - you\'re better than 99% of players',
        'Can key first game if you\'re very good fighters',
        'Play for max placement in every game unless far behind',
        'Follow points estimates and use tourney calc between games'
      ],
      effectiveness: { placement: 8, consistency: 8, skillRequired: 7 }
    }
  ];

  const filteredStrategies = strategies.filter(strategy => {
    const modeMatch = selectedMode === 'both' || strategy.mode === selectedMode || strategy.mode === 'both';
    const categoryMatch = selectedCategory === 'all' || strategy.category === selectedCategory;
    return modeMatch && categoryMatch;
  });

  return (
    <PremiumOnly 
      pageName="Tournament Strategies" 
      description="Master competitive Fortnite with proven C6S4 strategies, loadout guides, and pro-level tactics for Solo Series and Duos Trials."
      showNavbar={false}
      showFooter={false}
    >
      <div className="min-h-screen bg-gradient-dark flex flex-col">
        <Navbar />
      
      <div className="flex-1 relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-gradient">
            🏆 Tournament Strategy Guide
          </h1>
          <p className="text-xl text-secondary-text max-w-3xl mx-auto">
            Master competitive Fortnite with proven strategies from C6S4 Solo Series and Duos Trials
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap justify-center gap-4 mb-8">
          <div className="glass-card p-2 flex space-x-2">
            {[
              { key: 'both', label: '🔄 All Modes' },
              { key: 'solo', label: '👤 Solo' },
              { key: 'duos', label: '👥 Duos' }
            ].map((mode) => (
              <button
                key={mode.key}
                onClick={() => setSelectedMode(mode.key as any)}
                className={`px-4 py-2 rounded font-medium transition-all ${
                  selectedMode === mode.key
                    ? 'bg-purple-600 text-white'
                    : 'text-secondary-text hover:text-primary-text'
                }`}
              >
                {mode.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tournament Results */}
          <div className="glass-card p-6 mb-8">
          <h2 className="text-2xl font-bold text-primary-text mb-4">📊 Latest Tournament Results</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white/5 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-primary-text mb-3">C6S4 Solo Series #1</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-secondary-text">NAC Top 100:</span>
                  <span className="text-accent font-bold">309 points</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-secondary-text">EU Top 100:</span>
                  <span className="text-accent font-bold">329 points</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-secondary-text">Series Final Est:</span>
                  <span className="text-green-400 font-bold">NAC: 1,200 | EU: 1,300</span>
                </div>
              </div>
            </div>
            
            <div className="bg-white/5 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-primary-text mb-3">C6S4 Duos Trials - Final Results</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-secondary-text">Win Points:</span>
                  <span className="text-accent">65 points</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-secondary-text">Elim Points:</span>
                  <span className="text-accent">1 point</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-secondary-text">Region Lock:</span>
                  <span className="text-red-400">Yes (unlike Solos)</span>
                </div>
                <div className="mt-3 pt-3 border-t border-white/10">
                  <div className="text-xs text-yellow-400 font-semibold mb-2">NAC Final Thresholds:</div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <span>Top 1K: <span className="text-accent">250 pts</span></span>
                    <span>Top 3K: <span className="text-accent">205 pts</span></span>
                    <span>Top 7K: <span className="text-accent">150 pts</span></span>
                  </div>
                </div>
                <div className="mt-2">
                  <div className="text-xs text-blue-400 font-semibold mb-2">EU Final Thresholds:</div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <span>Top 1K: <span className="text-accent">275 pts</span></span>
                    <span>Top 3K: <span className="text-accent">247 pts</span></span>
                    <span>Top 13K: <span className="text-accent">186 pts</span></span>
                  </div>
                </div>
              </div>
            </div>
            </div>
          </div>

        {/* Strategy Cards */}
              <div className="space-y-6">
          {filteredStrategies.map((strategy) => (
            <div key={strategy.id} className="glass-card p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-semibold text-primary-text mb-2">
                    {strategy.title}
                  </h3>
                  <div className="flex space-x-4 text-sm">
                    <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded">
                      {strategy.mode === 'both' ? 'Solo & Duos' : strategy.mode}
                    </span>
                    <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded">
                      {strategy.difficulty}
                    </span>
                  </div>
                </div>
              </div>

              <div className="prose prose-invert max-w-none mb-4">
                <div className="text-secondary-text whitespace-pre-line">
                  {strategy.content}
                </div>
          </div>

              <div>
                <h4 className="font-semibold text-primary-text mb-2">💡 Key Tips:</h4>
                <ul className="space-y-1">
                  {strategy.tips.map((tip, index) => (
                    <li key={index} className="text-secondary-text text-sm flex items-start">
                      <span className="text-accent mr-2">•</span>
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>

              {strategy.category === 'safety' && (
                <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded">
                  <p className="text-red-400 text-sm font-medium">
                    ⚠️ CRITICAL: This strategy prevents game-ending bugs!
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <Footer />
    </div>
    </PremiumOnly>
  );
}
