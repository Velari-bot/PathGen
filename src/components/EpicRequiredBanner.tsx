'use client';

import React from 'react';
import { EpicConnectButton } from '@/components/EpicConnectButton';

interface EpicRequiredProps {
  message?: string;
  className?: string;
}

export const EpicRequiredBanner: React.FC<EpicRequiredProps> = ({ 
  message = "Connect your Epic account to get personalized AI coaching based on your Fortnite stats",
  className = ""
}) => {
  return (
    <div className={`bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 text-white ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h3 className="text-lg font-bold mb-2">🎮 Epic Account Required</h3>
          <p className="text-blue-100 mb-4">{message}</p>
          <div className="text-sm text-blue-200">
            <p>• Get personalized coaching based on your actual stats</p>
            <p>• AI analyzes your K/D, win rate, and performance patterns</p>
            <p>• Receive specific advice tailored to your skill level</p>
          </div>
        </div>
        <div className="ml-6">
          <EpicConnectButton />
        </div>
      </div>
    </div>
  );
};

export default EpicRequiredBanner;
