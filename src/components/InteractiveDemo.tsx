'use client';

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

export default function InteractiveDemo() {
  const { user } = useAuth();
  const router = useRouter();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [demoData, setDemoData] = useState({
    skillScore: 68,
    winRate: 12,
    kdRatio: 1.2,
    buildingSpeed: 'Medium',
    gameSense: 'Good',
    positioning: 'Needs Work'
  });

  const handleTryDemo = async () => {
    if (!user) {
      router.push('/login');
      return;
    }

    setIsAnalyzing(true);
    
    // Simulate analysis
    setTimeout(() => {
      setAnalysisComplete(true);
      setIsAnalyzing(false);
    }, 3000);
  };

  const handleUpgrade = () => {
    if (!user) {
      router.push('/login');
      return;
    }
    router.push('/pricing');
  };

  if (analysisComplete) {
    return (
      <div className="glass-card p-8 text-center max-w-4xl mx-auto">
        <div className="text-4xl mb-6">🎯</div>
        <h2 className="text-3xl font-bold text-white mb-6">
          Your Skill Analysis Complete!
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="text-center">
            <div className="text-2xl font-bold text-red-400 mb-2">Current Score: {demoData.skillScore}</div>
            <div className="text-lg text-secondary-text">Your current skill level</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-400 mb-2">With PathGen Pro: 82</div>
            <div className="text-lg text-secondary-text">Projected improvement</div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6 mb-8">
          <h3 className="text-xl font-semibold text-white mb-4">Key Areas to Improve:</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-secondary-text">Building Speed</span>
                <span className="text-yellow-400">{demoData.buildingSpeed}</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div className="bg-yellow-400 h-2 rounded-full" style={{ width: '60%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-secondary-text">Positioning</span>
                <span className="text-red-400">{demoData.positioning}</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div className="bg-red-400 h-2 rounded-full" style={{ width: '40%' }}></div>
              </div>
            </div>
          </div>
        </div>

        <div className="text-center mb-8">
          <p className="text-xl text-white mb-4">
            This is just a preview. Get your full personalized analysis with PathGen Pro.
          </p>
          <div className="text-2xl font-bold text-green-400 mb-2">
            +14 Skill Points • +47% Win Rate • +0.8 K/D
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button 
            onClick={handleUpgrade}
            className="btn-primary text-lg px-8 py-4 font-semibold"
          >
            Get Full Analysis – $6.99/month
          </button>
          <button 
            onClick={() => setAnalysisComplete(false)}
            className="btn-secondary text-lg px-8 py-4 font-semibold"
          >
            Try Another Demo
          </button>
        </div>
      </div>
    );
  }

  return (
    <section className="section bg-gradient-dark relative overflow-hidden">
      <div className="relative z-10 text-center px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto mobile-container">
        <div className="glass-card p-8 text-center max-w-4xl mx-auto my-16">
          <div className="text-4xl mb-6">🎮</div>
          <h2 className="text-3xl font-bold text-white mb-6">
            Try PathGen AI Right Now
          </h2>
          
          <p className="text-xl text-secondary-text mb-8">
            Upload your stats. Get feedback in seconds. See the magic.
          </p>

          <div className="bg-gray-800 rounded-lg p-6 mb-8">
            <h3 className="text-xl font-semibold text-white mb-4">What You'll Get:</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl mb-2">📊</div>
                <div className="text-white font-medium">Skill Analysis</div>
                <div className="text-secondary-text text-sm">Your current level</div>
              </div>
              <div className="text-center">
                <div className="text-2xl mb-2">🎯</div>
                <div className="text-white font-medium">Weakness Detection</div>
                <div className="text-secondary-text text-sm">What to improve</div>
              </div>
              <div className="text-center">
                <div className="text-2xl mb-2">🚀</div>
                <div className="text-white font-medium">Improvement Plan</div>
                <div className="text-secondary-text text-sm">How to get better</div>
              </div>
            </div>
          </div>

          <button 
            onClick={handleTryDemo}
            disabled={isAnalyzing}
            className="btn-primary text-lg px-8 py-4 font-semibold disabled:opacity-50"
          >
            {isAnalyzing ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Analyzing Your Gameplay...
              </div>
            ) : (
              'Run Free Analysis'
            )}
          </button>

          <p className="text-secondary-text text-sm mt-4">
            Free users get 1 analysis. Pro users get unlimited.
          </p>
        </div>
      </div>
    </section>
  );
}
