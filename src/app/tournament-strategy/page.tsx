'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import PremiumOnly from '@/components/PremiumOnly';
import { trackPageView, trackTournamentView } from '@/components/TwitterPixel';

export default function TournamentStrategyPage() {
  const [selectedMode, setSelectedMode] = useState<'solo' | 'duos' | 'both'>('both');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Track page view for Twitter/X advertising
  useEffect(() => {
    try {
      trackPageView('Tournament Strategy');
      trackTournamentView('strategy_guide');
    } catch (error) {
      console.warn('⚠️ Could not track tournament strategy page view:', error);
    }
  }, []);

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
      id: 'crash-pad-vaulted-update',
      title: 'Crash Pads VAULTED - Launch Pad Meta',
      category: 'safety',
      mode: 'duos',
      difficulty: 'beginner',
      content: `✅ UPDATE: Crash pads have been VAULTED due to the game-ending bug! This is actually good news - no more risk of crash pad deaths.

**NEW MOBILITY META:**
- Launch Pads are now the primary mobility item
- Much safer than crash pads (no bug risk)
- Best used in zones 6-8 for optimal rotations
- Both players should prioritize Fizz now that crash pads are gone

**Division Cup Specific:**
- Launch Pads for 1 player minimum
- Fizz is CRITICAL for both players
- Legendary Slurps are essential heals
- Plan rotations around Launch Pad timing`,
      tips: [
        'Launch Pads are now primary mobility (crash pads vaulted)',
        'Use Launch Pads in zones 6-8 for best value',
        'Fizz is critical for both players now',
        'Legendary Slurps + Fizz = perfect heal combo',
        'Plan your rotations around Launch Pad availability',
        'Much safer mobility meta without crash pad bug risk'
      ],
      effectiveness: { placement: 9, consistency: 10, skillRequired: 4 }
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
      id: 'division-cups-strategy',
      title: 'C6S4 Duo Division Cups - Complete Guide',
      category: 'general',
      mode: 'duos',
      difficulty: 'intermediate',
      content: `🏆 **DIVISION CUPS - NEW FORMAT**

**Key Rules:**
- NO region lock (can play any region you didn't play trials for)
- NO points-based matchmaking except lowest division
- Div 1: Must play both days with same teammate (like Trios)
- Divs 2-5: Two separate tournaments, can change teammates

**Division Difficulty Comparison (vs Trio Divs):**
- Div 1 = Top half of Trio Div 1
- Div 2 = Bottom Trio Div 1 + Top half Trio Div 2  
- Div 3 = Bottom half of Trio Div 2
- Div 4 = Top 7K of Trio Div 3
- Div 5 = Everyone else in Trio Div 3

**Point System:**
- Win: 65 points (all divisions)
- Eliminations: Div 1 = 3pts, Div 2-5 = 2pts
- Points start at Top 25`,
      tips: [
        'Start 1 minute late (avoid early keying)',
        'Choose high-rated drop spots from division data',
        '99% of time: play placement over keying',
        'Look for 200-300 damage in early zones, then focus endgame',
        'Most games won\'t have surge until zones 4-8',
        'Use Launch Pads in zones 6-8 for optimal rotations',
        'Fizz + Legendary Slurps priority for both players',
        'Can drop divisions and return to higher any time'
      ],
      effectiveness: { placement: 9, consistency: 8, skillRequired: 7 }
    },
    {
      id: 'division-cups-cup1-analysis',
      title: 'Division Cups #1 - LIVE Analysis & Strategies',
      category: 'results',
      mode: 'duos',
      difficulty: 'advanced',
      content: `🔥 **DIVISION CUPS #1 RESULTS ANALYSIS**

**Key Insights from First Cup:**
- EU consistently 15-60 points higher than NAC per division
- Div 4 had highest qualification requirements (410 EU / 350 NAC)
- Storm changes caused brief chaos but were reverted for comp
- No significant queue bugs reported

**Division Point Patterns:**
- Div 1: Cumulative format, 280 EU / 270 NAC for Day 1 qual
- Div 2-3: Similar difficulty (335-345 EU / 320-335 NAC) 
- Div 4: Hardest single division (410 EU / 350 NAC)
- Div 5: Most accessible (335 EU / 295 NAC)

**Strategy Adjustments Based on Results:**
- Div 4 players: Expect 400+ points needed, aggressive early games
- Div 1: Conservative Day 1, save energy for cumulative Day 2
- Div 2-3: Standard placement with 6-8 elim games for safety
- Div 5: Focus on consistency, avoid high-risk plays`,
      tips: [
        'EU is 15-60 points harder per division - adjust expectations',
        'Div 4 requires most aggressive playstyle (400+ points)',
        'Storm changes can happen - but usually reverted quickly',
        'No region lock means you can division shop strategically',
        'Day 1 Div 1 qual around 270-280, plan Day 2 accordingly',
        'Div 5 most forgiving - perfect for learning division format',
        'Queue times: 2min safe most divs, 6min for Div 1 & 5'
      ],
      effectiveness: { placement: 9, consistency: 9, skillRequired: 8 }
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
    },
    {
      id: 'division-cups-day2-meta',
      title: '🆕 Division Cups Day 2 - Elimination Point NERF',
      category: 'meta',
      mode: 'duos',
      difficulty: 'intermediate',
      content: `🚨 **MAJOR DAY 2 CHANGES - ELIM POINTS NERFED**

**Updated Point System (Day 2):**
- EU/NAC Div 2-4: 2pts → 1pt per elim
- EU/NAC Div 5: 2pts → 0pts per elim  
- Other regions Div 2: 2pts → 1pt per elim
- Other regions Div 3: 2pts → 0pts per elim

**What We Learned from Day 1:**
- Surge active ~15% of Div 1 games, ~3% in Divs 2-5
- Divs 2,3,5 (and NAC Div 4) = MAX PLACEMENT META
- EU Div 4 qual was 404 points (very achievable without keying)
- Many teams qualified with loads of Top 5s in dead games

**Day 2 Final Results:**
- EU: Div 1 (534), Div 2 (294), Div 3 (300), Div 4 (349), Div 5 (246)
- NAC: Div 1 (270), Div 2 (335), Div 3 (335), Div 4 (340), Div 5 (302)

**Strategy Adaptation for Reduced Elim Points:**
- Even MORE placement focused than Day 1
- Defend yourself when keyed, but avoid initiating fights
- Look for Top 5s and Top 10s consistently
- Tag damage early/mid game, then watch player count`,
      tips: [
        'Elimination points are now almost worthless - focus 100% placement',
        'Defend when keyed but never initiate unnecessary fights',
        'Queue bug still exists: 2min requeue Div 2-4, 6min Div 1+5', 
        'Tag 200-300 damage early zones, then pure placement',
        'Most qual scores achievable with consistent Top 5s/10s',
        'Dropspot data from Day 1 available - use less contested spots',
        'Dead games are more common - take advantage with placement',
        'Div 5 has 0 elim points - 100% placement only strategy'
      ],
      effectiveness: { placement: 10, consistency: 10, skillRequired: 5 }
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
      
      <div className="flex-1 relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 pt-20 sm:pt-24">
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
              <h3 className="text-lg font-semibold text-primary-text mb-3">C6S4 Duos Competitions</h3>
              
              {/* Trials Results */}
              <div className="mb-4">
                <h4 className="text-sm font-semibold text-yellow-400 mb-2">🏆 Duos Trials (Final Results)</h4>
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <div className="text-yellow-400 font-medium">NAC:</div>
                    <div>Top 1K: <span className="text-accent">243 pts</span></div>
                    <div>Top 3K: <span className="text-accent">204 pts</span></div>
                    <div>Top 7K: <span className="text-accent">140 pts</span></div>
                  </div>
            <div>
                    <div className="text-blue-400 font-medium">EU:</div>
                    <div>Top 1K: <span className="text-accent">275 pts</span></div>
                    <div>Top 3K: <span className="text-accent">247 pts</span></div>
                    <div>Top 13K: <span className="text-accent">186 pts</span></div>
                  </div>
                </div>
          </div>

              {/* Console Cash Cup */}
              <div className="mb-4 pt-3 border-t border-white/10">
                <h4 className="text-sm font-semibold text-green-400 mb-2">🎮 Console Cash Cup #4 (Final)</h4>
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <div className="text-yellow-400 font-medium">NAC:</div>
                    <div>Top 100: <span className="text-accent">267 pts</span></div>
                    <div>Top 500: <span className="text-accent">231 pts</span></div>
                    <div>Top 1K: <span className="text-accent">210 pts</span></div>
                    <div>Top 2.5K: <span className="text-accent">176 pts</span></div>
                  </div>
                <div>
                    <div className="text-blue-400 font-medium">EU:</div>
                    <div>Top 100: <span className="text-accent">278 pts</span></div>
                    <div>Top 500: <span className="text-accent">250 pts</span></div>
                    <div>Top 1K: <span className="text-accent">233 pts</span></div>
                    <div>Top 2.5K: <span className="text-accent">206 pts</span></div>
                    <div>Top 7.5K: <span className="text-accent">164 pts</span></div>
                  </div>
                </div>
              </div>

              {/* Division Cups Info */}
              <div className="pt-3 border-t border-white/10">
                <h4 className="text-sm font-semibold text-purple-400 mb-2">⚔️ Duo Division Cups (LIVE DATA)</h4>
                
                {/* Cup #1 Results */}
                <div className="mb-3">
                  <h5 className="text-xs font-semibold text-yellow-400 mb-1">🏆 Cup #1 Final Results</h5>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <div className="text-yellow-400 font-medium mb-1">NAC:</div>
                      <div>Div 1: <span className="text-accent">~270 pts</span></div>
                      <div>Div 2: <span className="text-accent">320 pts</span></div>
                      <div>Div 3: <span className="text-accent">335 pts</span></div>
                      <div>Div 4: <span className="text-accent">350 pts</span></div>
                      <div>Div 5: <span className="text-accent">295 pts</span></div>
                    </div>
                    <div>
                      <div className="text-blue-400 font-medium mb-1">EU:</div>
                      <div>Div 1: <span className="text-accent">280 pts</span></div>
                      <div>Div 2: <span className="text-accent">335 pts</span></div>
                      <div>Div 3: <span className="text-accent">345 pts</span></div>
                      <div>Div 4: <span className="text-accent">410 pts</span></div>
                      <div>Div 5: <span className="text-accent">335 pts</span></div>
                    </div>
                  </div>
                </div>

                {/* Rules Summary */}
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-secondary-text">Win Points:</span>
                    <span className="text-accent">65 points</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-secondary-text">Elim Points:</span>
                    <span className="text-accent">Div 1: 3pts | Div 2-5: 2pts</span>
                    </div>
                  <div className="flex justify-between">
                    <span className="text-secondary-text">Region Lock:</span>
                    <span className="text-green-400">None (can play any region)</span>
                    </div>
                  <div className="flex justify-between">
                    <span className="text-secondary-text">Storm Changes:</span>
                    <span className="text-green-400">Reverted for comp (normal zones)</span>
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
