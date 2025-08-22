'use client';

import { useState } from 'react';
import SmoothScroll from '@/components/SmoothScroll';
import TournamentCalculator from '@/components/TournamentCalculator';
import Navbar from '@/components/Navbar';

export default function TournamentsPage() {
  const [showCalculator, setShowCalculator] = useState(false);

  return (
    <SmoothScroll>
      <div className="min-h-screen bg-gradient-dark">
        {/* Global Navigation */}
        <Navbar />
        
        {/* Header */}
        <div className="pt-20 pb-12 px-4">
          <div className="max-w-6xl mx-auto text-center">
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
              🏆 Tournament Hub
            </h1>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Calculate your tournament strategy, track your progress, and optimize your gameplay to reach your goals
            </p>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-6xl mx-auto px-4 pb-20">
          {/* Tournament Calculator Section */}
          <div className="glass-card p-8 mb-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-white mb-4">Tournament Calculator PRO</h2>
              <p className="text-gray-300 text-lg max-w-2xl mx-auto">
                Get your tournament schedule and know exactly what to aim for in each game to reach your target points. 
                Plan your strategy like a pro!
              </p>
            </div>
            
            <div className="text-center">
              <button
                onClick={() => setShowCalculator(true)}
                className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl text-lg transition-all duration-300 transform hover:scale-105 shadow-lg"
              >
                🧮 Open Tournament Calculator
              </button>
            </div>
          </div>

          {/* Tournament Types Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* FNCS */}
            <div className="glass-card p-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🏆</span>
                </div>
                <h3 className="text-xl font-bold text-white mb-3">FNCS Tournaments</h3>
                <p className="text-gray-300 mb-4">
                  The most competitive Fortnite tournaments with high stakes and elite competition
                </p>
                <div className="text-sm text-gray-400 space-y-1">
                  <p>• Division 1: 15 points per game</p>
                  <p>• Division 2/3: 12 points per game</p>
                  <p>• 10 games maximum</p>
                  <p>• 3 hour time limit</p>
                </div>
              </div>
            </div>

            {/* Eval */}
            <div className="glass-card p-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">📊</span>
                </div>
                <h3 className="text-xl font-bold text-white mb-3">Eval Cups</h3>
                <p className="text-gray-300 mb-4">
                  Evaluation tournaments for skill assessment and practice
                </p>
                <div className="text-sm text-gray-400 space-y-1">
                  <p>• 10 points per game</p>
                  <p>• 10 games maximum</p>
                  <p>• 2 hour time limit</p>
                  <p>• Great for practice</p>
                </div>
              </div>
            </div>

            {/* Console VCC */}
            <div className="glass-card p-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🎮</span>
                </div>
                <h3 className="text-xl font-bold text-white mb-3">Console VCC</h3>
                <p className="text-gray-300 mb-4">
                  Console-specific tournaments with balanced competition
                </p>
                <div className="text-sm text-gray-400 space-y-1">
                  <p>• 8 points per game</p>
                  <p>• 10 games maximum</p>
                  <p>• 2 hour time limit</p>
                  <p>• Console only</p>
                </div>
              </div>
            </div>

            {/* Icon Reload */}
            <div className="glass-card p-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-gray-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🔄</span>
                </div>
                <h3 className="text-xl font-bold text-white mb-3">Icon Reload Cups</h3>
                <p className="text-gray-300 mb-4">
                  Quick tournaments with fast-paced action
                </p>
                <div className="text-sm text-gray-400 space-y-1">
                  <p>• 5 points per game</p>
                  <p>• 10 games maximum</p>
                  <p>• 1 hour time limit</p>
                  <p>• High intensity</p>
                </div>
              </div>
            </div>

            {/* OG Cup */}
            <div className="glass-card p-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">👑</span>
                </div>
                <h3 className="text-xl font-bold text-white mb-3">OG Cup</h3>
                <p className="text-gray-300 mb-4">
                  Classic tournament format for all skill levels
                </p>
                <div className="text-sm text-gray-400 space-y-1">
                  <p>• 4 points per game</p>
                  <p>• 10 games maximum</p>
                  <p>• 1 hour time limit</p>
                  <p>• Beginner friendly</p>
                </div>
              </div>
            </div>

            {/* Strategy Tips */}
            <div className="glass-card p-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">💡</span>
                </div>
                <h3 className="text-xl font-bold text-white mb-3">Strategy Tips</h3>
                <p className="text-gray-300 mb-4">
                  Key strategies for tournament success
                </p>
                <div className="text-sm text-gray-400 space-y-1 text-left">
                  <p>• Plan your drop spots</p>
                  <p>• Manage your time wisely</p>
                  <p>• Focus on consistency</p>
                  <p>• Stay calm under pressure</p>
                </div>
              </div>
            </div>
          </div>

          {/* How to Use */}
          <div className="glass-card p-8 mt-8">
            <h2 className="text-2xl font-bold text-white text-center mb-6">How to Use the Calculator</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-white font-bold">1</span>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Select Tournament</h3>
                <p className="text-gray-300 text-sm">
                  Choose your tournament type from the available options
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-white font-bold">2</span>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Enter Your Data</h3>
                <p className="text-gray-300 text-sm">
                  Input your current points, target, games left, and time remaining
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-white font-bold">3</span>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Get Strategy</h3>
                <p className="text-gray-300 text-sm">
                  Receive personalized strategy and time management advice
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Tournament Calculator Modal */}
        <TournamentCalculator 
          isOpen={showCalculator} 
          onClose={() => setShowCalculator(false)} 
        />
      </div>
    </SmoothScroll>
  );
}
