'use client';

import React from 'react';
import { AICoachingResponse } from '@/types/ai-coaching';

interface CoachingCardProps {
  response: AICoachingResponse;
  isLoading?: boolean;
  className?: string;
}

export const CoachingCard: React.FC<CoachingCardProps> = ({ 
  response, 
  isLoading = false, 
  className = '' 
}) => {
  const getToneIcon = (tone: string) => {
    switch (tone) {
      case 'motivator':
        return '🔥';
      case 'tactical':
        return '🎯';
      case 'strict':
        return '⚡';
      case 'chill':
        return '😎';
      default:
        return '💡';
    }
  };

  const getToneColor = (tone: string) => {
    switch (tone) {
      case 'motivator':
        return 'from-orange-500 to-red-500';
      case 'tactical':
        return 'from-blue-500 to-purple-500';
      case 'strict':
        return 'from-red-500 to-pink-500';
      case 'chill':
        return 'from-green-500 to-blue-500';
      default:
        return 'from-gray-500 to-gray-600';
    }
  };

  if (isLoading) {
    return (
      <div className={`bg-gray-800 rounded-lg p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-700 rounded mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-700 rounded"></div>
            <div className="h-4 bg-gray-700 rounded w-3/4"></div>
            <div className="h-4 bg-gray-700 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-gradient-to-br ${getToneColor(response.tone)} rounded-lg p-6 text-white ${className}`}>
      {/* Header */}
      <div className="flex items-center mb-4">
        <span className="text-2xl mr-2">{getToneIcon(response.tone)}</span>
        <h3 className="text-lg font-bold capitalize">{response.tone} Coach</h3>
      </div>

      {/* Quick Fix */}
      <div className="mb-6">
        <h4 className="text-sm font-semibold text-gray-200 mb-2">⚡ QUICK FIX</h4>
        <p className="text-lg font-medium leading-relaxed">{response.quick_fix}</p>
      </div>

      {/* Detailed Analysis */}
      <div className="mb-6">
        <h4 className="text-sm font-semibold text-gray-200 mb-3">📊 DETAILED ANALYSIS</h4>
        <ul className="space-y-2">
          {response.detailed_analysis.map((point, index) => (
            <li key={index} className="flex items-start">
              <span className="text-gray-300 mr-2 mt-1">•</span>
              <span className="text-gray-100 leading-relaxed">{point}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Action Plan */}
      <div>
        <h4 className="text-sm font-semibold text-gray-200 mb-3">🎯 ACTION PLAN</h4>
        <div className="space-y-3">
          {response.action_plan.map((action, index) => (
            <div key={index} className="flex items-start bg-white/10 rounded-lg p-3">
              <span className="bg-white/20 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mr-3 mt-0.5">
                {index + 1}
              </span>
              <span className="text-gray-100 leading-relaxed">{action}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="mt-6 pt-4 border-t border-white/20">
        <p className="text-xs text-gray-300 text-center">
          PathGen AI • Powered by advanced Fortnite analysis
        </p>
      </div>
    </div>
  );
};

export default CoachingCard;
