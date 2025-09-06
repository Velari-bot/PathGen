'use client';

import React, { useState } from 'react';
import { CoachingCard } from '@/components/CoachingCard';

interface StatsDemoProps {
  className?: string;
}

export const StatsDemo: React.FC<StatsDemoProps> = ({ className = '' }) => {
  const [showDemo, setShowDemo] = useState(false);

  // Example comprehensive stats that would come from Osirion
  const exampleStats = {
    username: "ProPlayer123",
    totalMatches: 150,
    wins: 12,
    winRate: 8.0,
    avgPlacement: 23.5,
    avgKills: 2.1,
    kd: 1.4,
    top10Rate: 18.7,
    avgSurvivalMinutes: 8.2,
    recentWinRate: 5.0,
    recentAvgPlacement: 28.3,
    recentAvgKills: 1.8,
    placementConsistency: 15.2,
    killConsistency: 1.8,
    bestPlacement: 3,
    worstPlacement: 97,
    highestKills: 8,
    avgDamage: 450,
    longestSurvival: 18.5,
    shortestSurvival: 2.1
  };

  const exampleResponse = {
    quick_fix: `Your recent performance dropped significantly - from 8.0% win rate overall to 5.0% in last 10 matches, indicating you're struggling with mid-game positioning.`,
    detailed_analysis: [
      `Your placement consistency score of 15.2 shows high variance - you've placed anywhere from 3rd to 97th, indicating inconsistent decision-making`,
      `Recent matches show declining performance: avg placement went from 23.5 to 28.3, and kills dropped from 2.1 to 1.8 per match`,
      `Your survival time ranges from 2.1 to 18.5 minutes, suggesting you either die early or make it far - no middle ground consistency`
    ],
    action_plan: [
      `Focus on consistent early-game rotations: aim for 12+ minute survival in 80% of matches`,
      `Practice mid-game positioning drills: spend 20 minutes daily in Creative working on zone rotations`,
      `Review your worst placements (90+) to identify early death patterns and avoid those mistakes`
    ],
    tone: "tactical" as const
  };

  return (
    <div className={`bg-gray-800 rounded-lg p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-white">📊 Personalized AI Coaching Demo</h3>
        <button
          onClick={() => setShowDemo(!showDemo)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors"
        >
          {showDemo ? 'Hide Demo' : 'Show Demo'}
        </button>
      </div>

      {showDemo && (
        <div className="space-y-6">
          {/* Example Stats */}
          <div className="bg-gray-700 rounded-lg p-4">
            <h4 className="text-white font-semibold mb-3">Example Player Stats (from Osirion)</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-400">Username:</span>
                <div className="text-white font-medium">{exampleStats.username}</div>
              </div>
              <div>
                <span className="text-gray-400">Win Rate:</span>
                <div className="text-white font-medium">{exampleStats.winRate}%</div>
              </div>
              <div>
                <span className="text-gray-400">Avg Placement:</span>
                <div className="text-white font-medium">{exampleStats.avgPlacement}</div>
              </div>
              <div>
                <span className="text-gray-400">K/D Ratio:</span>
                <div className="text-white font-medium">{exampleStats.kd}</div>
              </div>
              <div>
                <span className="text-gray-400">Recent Win Rate:</span>
                <div className="text-white font-medium">{exampleStats.recentWinRate}%</div>
              </div>
              <div>
                <span className="text-gray-400">Recent Avg Placement:</span>
                <div className="text-white font-medium">{exampleStats.recentAvgPlacement}</div>
              </div>
              <div>
                <span className="text-gray-400">Placement Consistency:</span>
                <div className="text-white font-medium">{exampleStats.placementConsistency}</div>
              </div>
              <div>
                <span className="text-gray-400">Survival Range:</span>
                <div className="text-white font-medium">{exampleStats.shortestSurvival}-{exampleStats.longestSurvival} min</div>
              </div>
            </div>
          </div>

          {/* Example AI Response */}
          <div>
            <h4 className="text-white font-semibold mb-3">AI Response to: "Why am I performing worse recently?"</h4>
            <CoachingCard response={exampleResponse} />
          </div>

          {/* Key Features */}
          <div className="bg-gray-700 rounded-lg p-4">
            <h4 className="text-white font-semibold mb-3">🎯 Key Features</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <h5 className="text-blue-400 font-medium mb-2">Comprehensive Analysis</h5>
                <ul className="text-gray-300 space-y-1">
                  <li>• Recent vs overall performance trends</li>
                  <li>• Consistency scoring for placements/kills</li>
                  <li>• Survival time pattern analysis</li>
                  <li>• Performance range identification</li>
                </ul>
              </div>
              <div>
                <h5 className="text-green-400 font-medium mb-2">Personalized Coaching</h5>
                <ul className="text-gray-300 space-y-1">
                  <li>• Specific advice based on actual stats</li>
                  <li>• Targeted drills for identified weaknesses</li>
                  <li>• Measurable improvement goals</li>
                  <li>• Pattern recognition and solutions</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StatsDemo;
