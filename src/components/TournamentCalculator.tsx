'use client';

import { useState, useRef } from 'react';

interface TournamentCalculatorProps {
  isOpen: boolean;
  onClose: () => void;
}

interface TournamentData {
  name: string;
  color: string;
  pointsPerGame: number;
  maxGames: number;
  timeLimit?: number; // in hours
  division: 'div1' | 'div2';
}

const TOURNAMENTS: TournamentData[] = [
  { name: 'FNCS Div 1', color: 'bg-red-500', pointsPerGame: 15, maxGames: 10, timeLimit: 3, division: 'div1' },
  { name: 'FNCS Div 2/3', color: 'bg-red-600', pointsPerGame: 12, maxGames: 10, timeLimit: 3, division: 'div2' },
  { name: 'Eval', color: 'bg-green-500', pointsPerGame: 10, maxGames: 10, timeLimit: 2, division: 'div2' },
  { name: 'Console VCC', color: 'bg-blue-500', pointsPerGame: 8, maxGames: 10, timeLimit: 2, division: 'div2' },
  { name: 'PJ/Crystal/Axe/Surf Cups', color: 'bg-gray-500', pointsPerGame: 6, maxGames: 10, timeLimit: 1.5, division: 'div2' },
  { name: 'Icon Reload Cups', color: 'bg-gray-600', pointsPerGame: 5, maxGames: 10, timeLimit: 1, division: 'div2' },
  { name: 'OG Cup', color: 'bg-gray-700', pointsPerGame: 4, maxGames: 10, timeLimit: 1, division: 'div2' }
];

interface TournamentPlan {
  currentPoints: number;
  targetPoints: number;
  pointsNeeded: number;
  gamesNeeded: number;
  gamesLeft: number;
  timeLeft: number;
  gamePlan: GamePlan[];
  canReachTarget: boolean;
}

interface GamePlan {
  gameNumber: number;
  type: 'full' | 'partial';
  targetPoints: number;
  placement: number;
  eliminations: number;
  playstyle: string;
  timeEstimate: number;
  pointsAfter: number;
  minutesAfter: number;
}

// Scoring tables for each division
const getScoringTable = (division: 'div1' | 'div2') => {
  if (division === 'div1') {
    return {
      eliminationBonus: 2,
      placements: [
        { place: 1, points: 1500 },
        { place: 2, points: 1350 },
        { place: 3, points: 1275 },
        { place: 4, points: 1238 },
        { place: 5, points: 1200 },
        { place: 6, points: 1163 },
        { place: 7, points: 1125 },
        { place: 8, points: 1088 },
        { place: 9, points: 1050 },
        { place: 10, points: 938 },
        { place: 20, points: 825 },
        { place: 30, points: 713 },
        { place: 40, points: 600 },
        { place: 50, points: 525 },
        { place: 60, points: 488 },
        { place: 70, points: 450 },
        { place: 80, points: 413 },
        { place: 90, points: 375 },
        { place: 100, points: 338 },
        { place: 150, points: 300 },
        { place: 200, points: 263 },
        { place: 250, points: 225 },
        { place: 300, points: 188 },
        { place: 400, points: 150 },
        { place: 500, points: 75 },
        { place: 1000, points: 30 },
        { place: 2500, points: 23 },
        { place: 5000, points: 15 },
        { place: 7500, points: 8 },
        { place: 10000, points: 0 }
      ]
    };
  } else {
    return {
      eliminationBonus: 1,
      placements: [
        { place: 1, points: 65 },
        { place: 2, points: 54 },
        { place: 3, points: 48 },
        { place: 4, points: 44 },
        { place: 5, points: 40 },
        { place: 6, points: 36 },
        { place: 7, points: 33 },
        { place: 8, points: 30 },
        { place: 9, points: 27 },
        { place: 10, points: 24 },
        { place: 11, points: 21 },
        { place: 12, points: 18 },
        { place: 13, points: 15 },
        { place: 14, points: 12 },
        { place: 15, points: 9 },
        { place: 16, points: 6 },
        { place: 17, points: 3 }
      ]
    };
  }
};

export default function TournamentCalculator({ isOpen, onClose }: TournamentCalculatorProps) {
  const [showCalculator, setShowCalculator] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [selectedTournament, setSelectedTournament] = useState<TournamentData | null>(null);
  const [tournamentPlan, setTournamentPlan] = useState<TournamentPlan | null>(null);
  const [formData, setFormData] = useState({
    currentPoints: '',
    targetPoints: '',
    gamesLeft: '',
    hoursLeft: '',
    minutesLeft: ''
  });

  const updateFormData = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const calculateTournamentPlan = (): TournamentPlan | null => {
    if (!selectedTournament || !formData.currentPoints || !formData.targetPoints || !formData.gamesLeft) {
      return null;
    }

    const current = parseInt(formData.currentPoints);
    const target = parseInt(formData.targetPoints);
    const gamesLeft = parseInt(formData.gamesLeft);
    const hoursLeft = parseFloat(formData.hoursLeft) || 0;
    const minutesLeft = parseInt(formData.minutesLeft) || 0;
    const totalMinutesLeft = hoursLeft * 60 + minutesLeft;

    const pointsNeeded = target - current;
    
    const scoringTable = getScoringTable(selectedTournament.division);
    const eliminationBonus = scoringTable.eliminationBonus;
    
    // Calculate realistic targets for each game
    const gamePlan: GamePlan[] = [];
    let remainingPoints = pointsNeeded;
    
    for (let i = 0; i < gamesLeft && remainingPoints > 0; i++) {
      // Calculate how many points we need this game
      const remainingGames = gamesLeft - i;
      const targetPointsThisGame = Math.ceil(remainingPoints / remainingGames);
      
      // Find the best placement + eliminations combination
      let placement = 0;
      let eliminations = 0;
      
      // Find the best placement that gives us close to our target
      for (const placementData of scoringTable.placements) {
        const placementPoints = placementData.points;
        const remainingForElims = targetPointsThisGame - placementPoints;
        
        if (remainingForElims >= 0) {
          const elimsNeeded = Math.ceil(remainingForElims / eliminationBonus);
          
          if (elimsNeeded <= 25) { // Increased elim limit for more flexibility
            placement = placementData.place;
            eliminations = elimsNeeded;
            break;
          }
        }
      }
      
      if (placement === 0) {
        // Fallback: just get eliminations
        placement = 25; // Mid-tier placement
        eliminations = Math.ceil(targetPointsThisGame / eliminationBonus);
      }
      
      const actualPoints = scoringTable.placements.find(p => p.place === placement)?.points || 0;
      const elimPoints = eliminations * eliminationBonus;
      const totalPoints = actualPoints + elimPoints;
      
      gamePlan.push({
        gameNumber: i + 1,
        type: i < Math.ceil(pointsNeeded / selectedTournament.pointsPerGame) ? 'full' : 'partial',
        targetPoints: totalPoints,
        placement,
        eliminations,
        playstyle: eliminations > 5 ? 'Aggressive' : eliminations > 2 ? 'Balanced' : 'Passive',
        timeEstimate: (selectedTournament.timeLimit || 2) * 60,
        pointsAfter: current + totalPoints,
        minutesAfter: totalMinutesLeft - (i < Math.ceil(pointsNeeded / selectedTournament.pointsPerGame) ? 30 : Math.min(25, totalMinutesLeft))
      });
      
      remainingPoints -= totalPoints;
    }
    
    return {
      currentPoints: current,
      targetPoints: target,
      pointsNeeded: pointsNeeded,
      gamesNeeded: Math.ceil(pointsNeeded / selectedTournament.pointsPerGame),
      gamesLeft: gamesLeft,
      timeLeft: totalMinutesLeft,
      gamePlan: gamePlan,
      canReachTarget: true
    };
  };

  const handleCalculate = () => {
    console.log('Calculate button clicked!');
    console.log('Form data:', formData);
    console.log('Selected tournament:', selectedTournament);
    
    const plan = calculateTournamentPlan();
    console.log('Calculated plan:', plan);
    
    if (plan) {
      setTournamentPlan(plan);
      setShowResults(true);
      console.log('Plan set successfully, showing results');
    } else {
      console.log('No plan generated - check inputs');
      
      // Calculate what's actually possible
      const current = parseInt(formData.currentPoints);
      const target = parseInt(formData.targetPoints);
      const gamesLeft = parseInt(formData.gamesLeft);
      const maxPossiblePoints = gamesLeft * (selectedTournament?.pointsPerGame || 12);
      const pointsNeeded = target - current;
      const maxAchievable = current + maxPossiblePoints;
      
      alert(`Target not reachable with current settings!\n\n` +
            `You need: ${pointsNeeded} points\n` +
            `You can get max: ${maxPossiblePoints} points in ${gamesLeft} games\n` +
            `Max achievable: ${maxAchievable} points\n\n` +
            `Try reducing your target to ${maxAchievable} or increasing games left.`);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700 bg-gray-800">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">🧮</span>
          </div>
          <div>
              <h2 className="text-2xl font-bold text-white">PathGen Tourney Calculator PRO</h2>
              <p className="text-gray-400 text-sm">Professional Tournament Strategy Tool</p>
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

        {/* Content Area with Scroll */}
        <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
          {!showCalculator && !showResults && (
            <div className="p-6">
              <div className="text-center mb-8">
                <h3 className="text-xl font-semibold text-white mb-4">Select Your Tournament</h3>
                <p className="text-gray-400 mb-6">Choose the tournament you're competing in to get personalized strategy</p>
      </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {TOURNAMENTS.map((tournament) => (
            <button
                    key={tournament.name}
                    onClick={() => {
                      setSelectedTournament(tournament);
                      setShowCalculator(true);
                    }}
                    className={`p-6 rounded-lg border-2 transition-all duration-300 hover:scale-105 ${
                      selectedTournament?.name === tournament.name
                        ? 'border-blue-500 bg-blue-500 bg-opacity-20'
                        : 'border-gray-600 hover:border-gray-500'
                    }`}
                  >
                    <div className={`w-4 h-4 ${tournament.color} rounded-full mb-3`}></div>
                    <h4 className="text-white font-semibold text-lg">{tournament.name}</h4>
            </button>
          ))}
        </div>
            </div>
          )}

          {showCalculator && !showResults && (
            <div className="p-6">
              <div className="text-center mb-6">
                <h3 className="text-xl font-semibold text-white mb-2">Tournament Calculator</h3>
                <p className="text-gray-400">Enter your current stats to get a personalized game plan</p>
      </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-white font-medium mb-2">Current Points</label>
                  <input
                    type="number"
                    placeholder="0"
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none"
                    onChange={(e) => updateFormData('currentPoints', e.target.value)}
                  />
                </div>
          <div>
                  <label className="block text-white font-medium mb-2">Target Points</label>
            <input
              type="number"
                    placeholder="100"
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none"
                    onChange={(e) => updateFormData('targetPoints', e.target.value)}
            />
          </div>
          <div>
                  <label className="block text-white font-medium mb-2">Games Left</label>
            <input
              type="number"
                    placeholder="6"
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none"
                    onChange={(e) => updateFormData('gamesLeft', e.target.value)}
            />
          </div>
                <div>
                  <label className="block text-white font-medium mb-2">Time Left (Hours)</label>
                  <input
                    type="number"
                    placeholder="2"
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none"
                    onChange={(e) => updateFormData('hoursLeft', e.target.value)}
                  />
          </div>
                <div>
                  <label className="block text-white font-medium mb-2">Time Left (Minutes)</label>
                  <input
                    type="number"
                    placeholder="30"
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none"
                    onChange={(e) => updateFormData('minutesLeft', e.target.value)}
                  />
        </div>
      </div>

              {/* Action Buttons */}
              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => setShowCalculator(false)}
                  className="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                >
                  Back to Tournaments
                </button>
                <button
                  onClick={handleCalculate}
                  disabled={!formData.currentPoints || !formData.targetPoints || !formData.gamesLeft}
                  className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors"
                >
                  Calculate Plan
                </button>
              </div>

              {/* Debug Info */}
              <div className="mt-4 p-3 bg-gray-800 rounded-lg text-xs text-gray-400">
                <p>Debug: Current Points: {formData.currentPoints || 'Not set'}</p>
                <p>Debug: Target Points: {formData.targetPoints || 'Not set'}</p>
                <p>Debug: Games Left: {formData.gamesLeft || 'Not set'}</p>
                <p>Debug: Hours Left: {formData.hoursLeft || 'Not set'}</p>
                <p>Debug: Minutes Left: {formData.minutesLeft || 'Not set'}</p>
              </div>

              {/* Scoring Table */}
              {selectedTournament && (
                <div className="mt-8 bg-gray-800 rounded-lg p-4">
                  <h4 className="text-white font-semibold text-lg mb-4 text-center">
                    {selectedTournament.division === 'div1' ? 'Div 1' : 'Div 2 & 3'} Scoring Table
                  </h4>
                  <div className="text-center mb-4">
                    <p className="text-gray-400">
                      Each Elimination = +{getScoringTable(selectedTournament.division).eliminationBonus} point
                    </p>
                    <p className="text-gray-400">
                      {selectedTournament.division === 'div1' ? '1.5x' : '1x'} multiplier
                    </p>
                  </div>
                  
                  <div className={`grid gap-4 ${
                    selectedTournament.division === 'div1' ? 'grid-cols-5' : 'grid-cols-4'
                  }`}>
                    {getScoringTable(selectedTournament.division).placements.map((placement, index) => (
                      <div key={index} className="text-center">
                        <div className="bg-gray-700 rounded-lg p-3">
                          {placement.place === 1 ? (
                            <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center mx-auto mb-2">
                              <span className="text-white font-bold text-sm">🏆</span>
                            </div>
                          ) : (
                            <p className="text-gray-400 text-sm mb-2">#{placement.place}</p>
                          )}
                          <p className="text-white font-bold text-lg">{placement.points.toLocaleString()}</p>
                        </div>
              </div>
            ))}
          </div>
        </div>
      )}
            </div>
          )}

          {showResults && tournamentPlan && (
            <div className="p-6 space-y-6">
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-white mb-2">Your Tournament Strategy</h3>
                <p className="text-gray-400">Here's your personalized plan to reach {tournamentPlan.targetPoints} points</p>
              </div>

              {/* Tournament Status Summary */}
              <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                <h4 className="text-white font-semibold text-lg mb-4 text-center">Tournament Status</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-3">
                      <span className="text-white font-bold text-lg">🏆</span>
                    </div>
                    <p className="text-gray-400 text-sm mb-1">Current points</p>
                    <p className="text-white font-bold text-2xl">{tournamentPlan.currentPoints}</p>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-3">
                      <span className="text-white font-bold text-lg">🎯</span>
                    </div>
                    <p className="text-white font-bold text-2xl">{tournamentPlan.targetPoints}</p>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-3">
                      <span className="text-white font-bold text-lg">🎮</span>
          </div>
                    <p className="text-gray-400 text-sm mb-1">Games left</p>
                    <p className="text-white font-bold text-2xl">{tournamentPlan.gamesLeft}</p>
          </div>
        </div>
      </div>

              {/* Requirement & Queue Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-800 rounded-lg p-4 border-l-4 border-red-500">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <h4 className="text-white font-semibold">Requirement</h4>
                  </div>
                  <p className="text-gray-300 mb-2">You need <span className="text-red-400 font-bold">{tournamentPlan.pointsNeeded}</span> more points</p>
                </div>
                
                <div className="bg-gray-800 rounded-lg p-4 border-l-4 border-yellow-500">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <h4 className="text-white font-semibold">Queue Info</h4>
                  </div>
                  <p className="text-gray-300 mb-2">You have <span className="text-yellow-400 font-bold">{tournamentPlan.gamesLeft}</span> games left</p>
                  <p className="text-gray-400 text-sm">Focus on your game plan below</p>
                </div>
              </div>

              {/* Your Tourney Plan */}
              <div className="bg-gray-800 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-4">
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h4 className="text-white font-semibold text-lg">Your Tourney Plan:</h4>
                </div>
                
                <div className="space-y-3">
                  {tournamentPlan.gamePlan.map((game, index) => (
                    <div key={index} className="bg-gray-700 rounded-lg p-3 border-l-4 border-blue-500">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              game.type === 'full' ? 'bg-green-600 text-white' : 'bg-purple-600 text-white'
                            }`}>
                              {game.type === 'full' ? 'Full Game' : 'Partial Game'}
                            </span>
                            <span className="text-white font-medium">Game {game.gameNumber}</span>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                            <div>
                              <p className="text-gray-400">Target:</p>
                              <p className="text-white font-medium">Top {game.placement}</p>
                            </div>
                            <div>
                              <p className="text-gray-400">Elims:</p>
                              <p className="text-white font-medium">{game.eliminations}</p>
                            </div>
                            <div>
                              <p className="text-gray-400">Points:</p>
                              <p className="text-white font-medium">{game.targetPoints}</p>
                            </div>
                            <div>
                              <p className="text-gray-400">Style:</p>
                              <p className="text-white font-medium">{game.playstyle}</p>
                            </div>
                          </div>
                        </div>
                      </div>
        </div>
                  ))}
        </div>
      </div>

              {/* Action Buttons */}
              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setShowResults(false);
                    setShowCalculator(false);
                  }}
                  className="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                >
                  Back to Tournaments
                </button>
        <button
          onClick={() => {
                    setShowResults(false);
                    setShowCalculator(true);
          }}
                  className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
                  Recalculate
        </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

