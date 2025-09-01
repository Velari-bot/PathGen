'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export default function GamifiedProgressTracker() {
  const { user } = useAuth();
  const [skillScore, setSkillScore] = useState(68);
  const [targetScore, setTargetScore] = useState(82);
  const [progress, setProgress] = useState(0);
  const [level, setLevel] = useState('Intermediate');
  const [nextMilestone, setNextMilestone] = useState('Advanced');

  useEffect(() => {
    // Simulate progress updates
    const interval = setInterval(() => {
      setProgress(prev => {
        const newProgress = prev + Math.random() * 2;
        return Math.min(newProgress, 100);
      });
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const getProgressColor = () => {
    if (progress < 30) return 'text-red-400';
    if (progress < 70) return 'text-yellow-400';
    return 'text-green-400';
  };

  const getProgressBarColor = () => {
    if (progress < 30) return 'bg-red-400';
    if (progress < 70) return 'bg-yellow-400';
    return 'bg-green-400';
  };

  return (
    <div className="glass-card p-6">
      <div className="text-center mb-6">
        <h3 className="text-2xl font-bold text-white mb-2">Your Skill Score</h3>
        <div className="text-4xl font-bold text-blue-400 mb-2">{skillScore}</div>
        <div className="text-lg text-secondary-text">Current Level: {level}</div>
      </div>

      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-secondary-text text-sm">Progress to {nextMilestone}</span>
          <span className={`text-sm font-semibold ${getProgressColor()}`}>
            {Math.round(progress)}%
          </span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-3">
          <div 
            className={`h-3 rounded-full transition-all duration-500 ${getProgressBarColor()}`}
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="text-center">
          <div className="text-2xl font-bold text-red-400 mb-1">Current: {skillScore}</div>
          <div className="text-secondary-text text-sm">Your skill level</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-400 mb-1">Target: {targetScore}</div>
          <div className="text-secondary-text text-sm">With PathGen Pro</div>
        </div>
      </div>

      <div className="bg-gray-800 rounded-lg p-4 mb-6">
        <h4 className="text-lg font-semibold text-white mb-3">Recent Improvements</h4>
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-secondary-text text-sm">Building Speed</span>
            <span className="text-green-400 text-sm">+12%</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-secondary-text text-sm">Positioning</span>
            <span className="text-green-400 text-sm">+8%</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-secondary-text text-sm">Game Sense</span>
            <span className="text-green-400 text-sm">+15%</span>
          </div>
        </div>
      </div>

      <div className="text-center">
        <div className="text-lg font-semibold text-white mb-2">
          +{targetScore - skillScore} Skill Points Available
        </div>
        <div className="text-secondary-text text-sm">
          Upgrade to Pro to unlock your full potential
        </div>
      </div>
    </div>
  );
}
