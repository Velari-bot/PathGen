'use client';

import React, { useState } from 'react';
import Navbar from '@/components/Navbar';
import { TournamentStrategyService } from '@/lib/tournament-strategy';
import { TournamentDivision, CompetitiveStrategy } from '@/types';

export default function TournamentStrategyPage() {
  const [selectedDivision, setSelectedDivision] = useState<number>(1);
  const [activeTab, setActiveTab] = useState<'overview' | 'strategy' | 'loadout' | 'tips'>('overview');

  const tournament = TournamentStrategyService.getTournamentInfo();
  const divisionInfo = TournamentStrategyService.getDivisionStrategy(selectedDivision);
  const strategy = TournamentStrategyService.getCompetitiveStrategy(selectedDivision);
  const loadoutBuilder = TournamentStrategyService.getLoadoutBuilder();

  const getDivisionColor = (division: number) => {
    switch (division) {
      case 1: return 'text-yellow-400';
      case 2: return 'text-blue-400';
      case 3: return 'text-green-400';
      default: return 'text-gray-400';
    }
  };

  const getDivisionBgColor = (division: number) => {
    switch (division) {
      case 1: return 'bg-yellow-500/20 border-yellow-500/30';
      case 2: return 'bg-blue-500/20 border-blue-500/30';
      case 3: return 'bg-green-500/20 border-green-500/30';
      default: return 'bg-gray-500/20 border-gray-500/30';
    }
  };

  const getSurgeColor = (frequency: string) => {
    switch (frequency) {
      case 'high': return 'text-red-400';
      case 'medium': return 'text-yellow-400';
      case 'low': return 'text-green-400';
      default: return 'text-gray-400';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-dark">
      <Navbar />
      
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-bold text-white text-center mb-8">
            🏆 C6S4 Tournament Strategy Guide
          </h1>
          
          {/* Tournament Overview */}
          <div className="glass-card p-6 mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">{tournament.name}</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white/5 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-blue-400 mb-2">Points System</h3>
                <div className="space-y-2 text-sm text-gray-300">
                  <div>🏆 Win: {tournament.pointsSystem.win} points</div>
                  <div>🔫 Div 1 Elim: {tournament.pointsSystem.eliminations.div1} point</div>
                  <div>🔫 Div 2+ Elim: {tournament.pointsSystem.eliminations.div2Plus} point</div>
                  <div>📍 Placement: {tournament.pointsSystem.placement}</div>
                </div>
              </div>
              <div className="bg-white/5 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-purple-400 mb-2">Format</h3>
                <div className="space-y-2 text-sm text-gray-300">
                  <div>🎮 Type: {tournament.type}</div>
                  <div>👥 Format: {tournament.format}</div>
                  <div>🌍 No Region Lock</div>
                  <div>📅 2-Day Cumulative Points</div>
                </div>
              </div>
              <div className="bg-white/5 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-green-400 mb-2">Key Rules</h3>
                <div className="space-y-2 text-sm text-gray-300">
                  <div>✅ Same trio both days</div>
                  <div>❌ No division changes mid-tournament</div>
                  <div>⏰ Start on time</div>
                  <div>🎯 Focus on placement</div>
                </div>
              </div>
            </div>
          </div>

          {/* Division Selection */}
          <div className="glass-card p-6 mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">Choose Your Division</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {tournament.divisions.map((division) => (
                <button
                  key={division.id}
                  onClick={() => setSelectedDivision(division.id)}
                  className={`p-4 rounded-lg border-2 transition-all duration-300 ${
                    selectedDivision === division.id 
                      ? getDivisionBgColor(division.id) + ' scale-105' 
                      : 'bg-white/5 border-white/20 hover:bg-white/10'
                  }`}
                >
                  <h3 className={`text-xl font-semibold mb-2 ${getDivisionColor(division.id)}`}>
                    {division.name}
                  </h3>
                  <p className="text-gray-300 text-sm mb-2">{division.description}</p>
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>Elo: {division.hasElo ? 'Yes' : 'No'}</span>
                    <span className={getSurgeColor(division.surgeFrequency)}>
                      Surge: {division.surgeFrequency}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Strategy Tabs */}
          <div className="glass-card p-6 mb-8">
            <div className="flex flex-wrap gap-2 mb-6">
              {(['overview', 'strategy', 'loadout', 'tips'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    activeTab === tab 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-white/10 text-gray-300 hover:bg-white/20'
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            {activeTab === 'overview' && divisionInfo && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold text-white mb-3">
                    {divisionInfo.name} Strategy Overview
                  </h3>
                  <p className="text-gray-300 mb-4">{divisionInfo.strategy}</p>
                  <div className="bg-white/5 p-4 rounded-lg">
                    <h4 className="text-lg font-semibold text-blue-400 mb-2">Key Tips</h4>
                    <ul className="space-y-2">
                      {divisionInfo.tips.map((tip, index) => (
                        <li key={index} className="flex items-start">
                          <span className="text-blue-400 mr-2">•</span>
                          <span className="text-gray-300 text-sm">{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'strategy' && strategy && (
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-white mb-4">
                  {divisionInfo?.name} Competitive Strategy
                </h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="bg-white/5 p-4 rounded-lg">
                      <h4 className="text-lg font-semibold text-green-400 mb-2">Early Game</h4>
                      <p className="text-gray-300 text-sm">{strategy.earlyGame}</p>
                    </div>
                    <div className="bg-white/5 p-4 rounded-lg">
                      <h4 className="text-lg font-semibold text-yellow-400 mb-2">Mid Game</h4>
                      <p className="text-gray-300 text-sm">{strategy.midGame}</p>
                    </div>
                    <div className="bg-white/5 p-4 rounded-lg">
                      <h4 className="text-lg font-semibold text-red-400 mb-2">End Game</h4>
                      <p className="text-gray-300 text-sm">{strategy.endGame}</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="bg-white/5 p-4 rounded-lg">
                      <h4 className="text-lg font-semibold text-purple-400 mb-2">Surge Strategy</h4>
                      <p className="text-gray-300 text-sm">{strategy.surgeStrategy}</p>
                    </div>
                    <div className="bg-white/5 p-4 rounded-lg">
                      <h4 className="text-lg font-semibold text-blue-400 mb-2">Loadout Priority</h4>
                      <ul className="space-y-1">
                        {strategy.loadoutPriority.map((item, index) => (
                          <li key={index} className="text-gray-300 text-sm">
                            {index + 1}. {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'loadout' && (
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-white mb-4">Optimal Loadout Guide</h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {Object.entries(loadoutBuilder).map(([category, items]) => (
                    <div key={category} className="bg-white/5 p-4 rounded-lg">
                      <h4 className="text-lg font-semibold text-blue-400 mb-3">{category}</h4>
                      <ul className="space-y-2">
                        {items.map((item, index) => (
                          <li key={index} className="flex items-start">
                            <span className="text-gray-400 mr-2">•</span>
                            <span className="text-gray-300 text-sm">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'tips' && (
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-white mb-4">Tournament Tips & Rules</h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white/5 p-4 rounded-lg">
                    <h4 className="text-lg font-semibold text-green-400 mb-3">General Tips</h4>
                    <ul className="space-y-2">
                      {TournamentStrategyService.getTournamentTips().slice(0, 5).map((tip, index) => (
                        <li key={index} className="flex items-start">
                          <span className="text-blue-400 mr-2">•</span>
                          <span className="text-gray-300 text-sm">{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="bg-white/5 p-4 rounded-lg">
                    <h4 className="text-lg font-semibold text-yellow-400 mb-3">Qualification Tips</h4>
                    <ul className="space-y-2">
                      {TournamentStrategyService.getDivisionQualificationTips(selectedDivision).map((tip, index) => (
                        <li key={index} className="flex items-start">
                          <span className="text-blue-400 mr-2">•</span>
                          <span className="text-gray-300 text-sm">{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Quick Reference */}
          <div className="glass-card p-6">
            <h2 className="text-2xl font-semibold text-white mb-4">Quick Reference</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold text-blue-400 mb-3">Division Differences</h3>
                <div className="space-y-3">
                  {tournament.divisions.map((div) => (
                    <div key={div.id} className="bg-white/5 p-3 rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <span className={`font-semibold ${getDivisionColor(div.id)}`}>
                          {div.name}
                        </span>
                        <span className={`text-xs px-2 py-1 rounded ${getSurgeColor(div.surgeFrequency)}`}>
                          {div.surgeFrequency} surge
                        </span>
                      </div>
                      <p className="text-gray-300 text-sm">{div.description}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-purple-400 mb-3">Key Strategies</h3>
                <div className="space-y-3">
                  <div className="bg-white/5 p-3 rounded-lg">
                    <h4 className="font-semibold text-white mb-2">Division 1</h4>
                    <p className="text-gray-300 text-sm">Placement focus, surge mechanics, strategic fights only</p>
                  </div>
                  <div className="bg-white/5 p-3 rounded-lg">
                    <h4 className="font-semibold text-white mb-2">Division 2</h4>
                    <p className="text-gray-300 text-sm">Balanced approach, early damage assessment, selective eliminations</p>
                  </div>
                  <div className="bg-white/5 p-3 rounded-lg">
                    <h4 className="font-semibold text-white mb-2">Division 3</h4>
                    <p className="text-gray-300 text-sm">Survival focus, consistent endgames, avoid early fights</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
