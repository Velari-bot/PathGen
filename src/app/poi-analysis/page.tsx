'use client';

import React, { useState } from 'react';
import Navbar from '@/components/Navbar';
import { POIService } from '@/lib/poi-data';
import { POILocation, DropLocationStrategy } from '@/types';
import PremiumOnly from '@/components/PremiumOnly';

export default function POIAnalysisPage() {
  const [selectedStyle, setSelectedStyle] = useState<'aggressive' | 'passive' | 'balanced'>('balanced');
  const [selectedPOI, setSelectedPOI] = useState<POILocation | null>(null);
  const [showAllPOIs, setShowAllPOIs] = useState(false);

  const strategy = POIService.getDropLocationStrategy(selectedStyle);
  const allPOIs = POIService.getAllPOIs();
  const topPOIs = POIService.getBestDropLocations(10);

  const getStyleColor = (style: string) => {
    switch (style) {
      case 'aggressive': return 'text-red-400';
      case 'passive': return 'text-green-400';
      case 'balanced': return 'text-blue-400';
      default: return 'text-gray-400';
    }
  };

  const getStyleBgColor = (style: string) => {
    switch (style) {
      case 'aggressive': return 'bg-red-500/20 border-red-500/30';
      case 'passive': return 'bg-green-500/20 border-green-500/30';
      case 'balanced': return 'bg-blue-500/20 border-blue-500/30';
      default: return 'bg-gray-500/20 border-gray-500/30';
    }
  };

  const getSurvivalColor = (rate: number) => {
    if (rate >= 70) return 'text-green-400';
    if (rate >= 50) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getLootColor = (score: number) => {
    if (score >= 70) return 'text-purple-400';
    if (score >= 50) return 'text-blue-400';
    return 'text-gray-400';
  };

  const getMetalColor = (amount: number) => {
    if (amount >= 8000) return 'text-orange-400';
    if (amount >= 5000) return 'text-yellow-400';
    return 'text-gray-400';
  };

  return (
    <PremiumOnly 
      pageName="POI Analysis" 
      description="Master drop locations with data-driven POI analysis, seasonal hotspots, loot tier rankings, and strategic landing zone recommendations."
      showNavbar={false}
      showFooter={false}
    >
      <div className="min-h-screen bg-gradient-dark">
        <Navbar />
      
      <div className="container mx-auto px-4 py-16 pt-20 sm:pt-24">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-bold text-white text-center mb-8">
            🗺️ POI Analysis & Drop Locations
          </h1>
          
          {/* Player Style Selection */}
          <div className="glass-card p-6 mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">Choose Your Play Style</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {(['aggressive', 'passive', 'balanced'] as const).map((style) => (
                <button
                  key={style}
                  onClick={() => setSelectedStyle(style)}
                  className={`p-4 rounded-lg border-2 transition-all duration-300 ${
                    selectedStyle === style 
                      ? getStyleBgColor(style) + ' scale-105' 
                      : 'bg-white/5 border-white/20 hover:bg-white/10'
                  }`}
                >
                  <h3 className={`text-xl font-semibold mb-2 capitalize ${getStyleColor(style)}`}>
                    {style}
                  </h3>
                  <p className="text-gray-300 text-sm">
                    {style === 'aggressive' && 'High action, high risk, high reward'}
                    {style === 'passive' && 'Safe drops, survival focused, resource gathering'}
                    {style === 'balanced' && 'Moderate action, balanced approach'}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Strategy Recommendations */}
          <div className="glass-card p-6 mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">
              Strategy for <span className={getStyleColor(selectedStyle)}>{selectedStyle}</span> Players
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold text-white mb-3">Recommended Drop Locations</h3>
                <div className="space-y-3">
                  {strategy.recommendedLocations.map((poi, index) => (
                    <div
                      key={poi.name}
                      className="bg-white/5 p-3 rounded-lg cursor-pointer hover:bg-white/10 transition-colors"
                      onClick={() => setSelectedPOI(poi)}
                    >
                      <div className="flex justify-between items-center">
                        <span className="text-white font-medium">{poi.name}</span>
                        <span className="text-sm text-gray-400">Zone {poi.zoneNumber}</span>
                      </div>
                      <div className="flex justify-between text-sm mt-1">
                        <span className={getLootColor(poi.lootScore)}>Loot: {poi.lootScore}</span>
                        <span className={getMetalColor(poi.metalAmount)}>Metal: {poi.metalAmount.toLocaleString()}</span>
                        <span className={getSurvivalColor(poi.survivalRate)}>{poi.survivalRate}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-3">Strategy & Tips</h3>
                <p className="text-gray-300 mb-4">{strategy.strategy}</p>
                <ul className="space-y-2">
                  {strategy.tips.map((tip, index) => (
                    <li key={index} className="flex items-start">
                      <span className="text-blue-400 mr-2">•</span>
                      <span className="text-gray-300 text-sm">{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Top POIs Overview */}
          <div className="glass-card p-6 mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-semibold text-white">Top Drop Locations</h2>
              <button
                onClick={() => setShowAllPOIs(!showAllPOIs)}
                className="text-blue-400 hover:text-blue-300 transition-colors"
              >
                {showAllPOIs ? 'Show Top 10' : 'Show All Locations'}
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-gray-400 border-b border-white/20">
                    <th className="text-left p-2">Location</th>
                    <th className="text-left p-2">Zone</th>
                    <th className="text-left p-2">Loot</th>
                    <th className="text-left p-2">Metal</th>
                    <th className="text-left p-2">Teams</th>
                    <th className="text-left p-2">Survival</th>
                    <th className="text-left p-2">Rating</th>
                  </tr>
                </thead>
                <tbody>
                  {(showAllPOIs ? allPOIs : topPOIs).map((poi) => (
                    <tr
                      key={poi.name}
                      className="border-b border-white/10 hover:bg-white/5 cursor-pointer transition-colors"
                      onClick={() => setSelectedPOI(poi)}
                    >
                      <td className="p-2 text-white font-medium">{poi.name}</td>
                      <td className="p-2 text-gray-300">{poi.zoneNumber}</td>
                      <td className={`p-2 ${getLootColor(poi.lootScore)}`}>{poi.lootScore}</td>
                      <td className={`p-2 ${getMetalColor(poi.metalAmount)}`}>{poi.metalAmount.toLocaleString()}</td>
                      <td className="p-2 text-gray-300">{poi.avgTeams}</td>
                      <td className={`p-2 ${getSurvivalColor(poi.survivalRate)}`}>{poi.survivalRate}%</td>
                      <td className="p-2 text-gray-300">{poi.overallRating}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* POI Detail Modal */}
          {selectedPOI && (
            <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
              <div className="glass-card p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-start mb-4">
                  <h2 className="text-2xl font-semibold text-white">{selectedPOI.name}</h2>
                  <button
                    onClick={() => setSelectedPOI(null)}
                    className="text-gray-400 hover:text-white text-2xl"
                  >
                    ×
                  </button>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-white/5 p-3 rounded-lg">
                    <div className="text-gray-400 text-sm">Zone Number</div>
                    <div className="text-white font-semibold">{selectedPOI.zoneNumber}</div>
                  </div>
                  <div className="bg-white/5 p-3 rounded-lg">
                    <div className="text-gray-400 text-sm">Average Teams</div>
                    <div className="text-white font-semibold">{selectedPOI.avgTeams}</div>
                  </div>
                  <div className="bg-white/5 p-3 rounded-lg">
                    <div className="text-gray-400 text-sm">Loot Score</div>
                    <div className={`font-semibold ${getLootColor(selectedPOI.lootScore)}`}>
                      {selectedPOI.lootScore}
                    </div>
                  </div>
                  <div className="bg-white/5 p-3 rounded-lg">
                    <div className="text-gray-400 text-sm">Metal Amount</div>
                    <div className={`font-semibold ${getMetalColor(selectedPOI.metalAmount)}`}>
                      {selectedPOI.metalAmount.toLocaleString()}
                    </div>
                  </div>
                  <div className="bg-white/5 p-3 rounded-lg">
                    <div className="text-gray-400 text-sm">Survival Rate</div>
                    <div className={`font-semibold ${getSurvivalColor(selectedPOI.survivalRate)}`}>
                      {selectedPOI.survivalRate}%
                    </div>
                  </div>
                  <div className="bg-white/5 p-3 rounded-lg">
                    <div className="text-gray-400 text-sm">Overall Rating</div>
                    <div className="text-white font-semibold">{selectedPOI.overallRating}</div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">Drop Strategy</h3>
                    <div className="bg-white/5 p-3 rounded-lg">
                      {selectedPOI.avgTeams > 1.3 ? (
                        <p className="text-red-400">High competition - be prepared for early fights!</p>
                      ) : selectedPOI.avgTeams > 1.0 ? (
                        <p className="text-yellow-400">Moderate competition - stay alert but not overly aggressive</p>
                      ) : (
                        <p className="text-green-400">Low competition - safe to land and gather resources</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">Resource Priority</h3>
                    <div className="space-y-2">
                      {selectedPOI.lootScore > 60 && (
                        <div className="flex items-center text-purple-400">
                          <span className="mr-2">🎯</span>
                          <span>Prioritize looting for weapons and items</span>
                        </div>
                      )}
                      {selectedPOI.metalAmount > 5000 && (
                        <div className="flex items-center text-orange-400">
                          <span className="mr-2">🏗️</span>
                          <span>Great for building and defensive play</span>
                        </div>
                      )}
                      {selectedPOI.survivalRate > 65 && (
                        <div className="flex items-center text-green-400">
                          <span className="mr-2">🛡️</span>
                          <span>High survival rate - good for passive players</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
    </PremiumOnly>
  );
}
