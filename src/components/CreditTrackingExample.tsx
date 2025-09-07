'use client';

import React, { useState } from 'react';
import { useCreditTracking } from '@/hooks/useCreditTracking';
import { CREDIT_COSTS } from '@/lib/credit-tracker';

export const CreditTrackingExample: React.FC = () => {
  const { 
    credits, 
    isLoading, 
    error, 
    useCreditsForChat, 
    useCreditsForOsirionPull,
    useCreditsForStatsLookup,
    useCreditsForTournamentStrategy,
    useCreditsForPOIAnalysis,
    deductCreditsAfterAction,
    canAfford,
    refreshCredits 
  } = useCreditTracking();

  const [actionResult, setActionResult] = useState<string>('');

  const handleAction = async (action: () => Promise<boolean>, actionName: string, cost: number) => {
    if (!canAfford(cost)) {
      setActionResult(`❌ Insufficient credits for ${actionName}. Need ${cost} credits.`);
      return;
    }

    setActionResult(`🔄 Processing ${actionName}...`);
    
    try {
      // First check affordability (this is what the convenience functions do)
      const canProceed = await action();
      if (!canProceed) {
        setActionResult(`❌ Cannot proceed with ${actionName}. Insufficient credits.`);
        return;
      }

      // Simulate the action (in real usage, this would be the actual feature)
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate processing
      
      // Deduct credits after successful action
      const deductSuccess = await deductCreditsAfterAction(cost, actionName.toLowerCase().replace(/\s+/g, '_'), {
        timestamp: new Date().toISOString(),
        simulated: true
      });
      
      if (deductSuccess) {
        setActionResult(`✅ ${actionName} completed successfully! ${cost} credits deducted.`);
      } else {
        setActionResult(`⚠️ ${actionName} completed but failed to deduct credits.`);
      }
    } catch (err) {
      setActionResult(`❌ Error during ${actionName}: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-gray-800 rounded-lg p-6">
        <div className="text-center text-gray-400">Loading credit system...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gray-800 rounded-lg p-6">
        <div className="text-center text-red-400">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <h2 className="text-xl font-bold text-white mb-4">Credit Tracking Demo</h2>
      
      {/* Current Credits Display */}
      {credits && (
        <div className="bg-gray-700 rounded-lg p-4 mb-6">
          <h3 className="text-lg font-semibold text-white mb-3">Current Credits</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-white">{credits.credits_remaining}</div>
              <div className="text-gray-300 text-sm">Available</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-white">{credits.credits_used}</div>
              <div className="text-gray-300 text-sm">Used</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-white">{credits.credits_total}</div>
              <div className="text-gray-300 text-sm">Total</div>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <button
          onClick={() => handleAction(useCreditsForChat, 'AI Chat', CREDIT_COSTS.AI_CHAT)}
          disabled={!canAfford(CREDIT_COSTS.AI_CHAT)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed"
        >
          Send AI Message ({CREDIT_COSTS.AI_CHAT} credit)
        </button>

        <button
          onClick={() => handleAction(useCreditsForStatsLookup, 'Stats Lookup', CREDIT_COSTS.STATS_LOOKUP)}
          disabled={!canAfford(CREDIT_COSTS.STATS_LOOKUP)}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed"
        >
          Lookup Stats ({CREDIT_COSTS.STATS_LOOKUP} credits)
        </button>


        <button
          onClick={() => handleAction(useCreditsForOsirionPull, 'Osirion Pull', CREDIT_COSTS.OSIRION_PULL)}
          disabled={!canAfford(CREDIT_COSTS.OSIRION_PULL)}
          className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:bg-gray-600 disabled:cursor-not-allowed"
        >
          Osirion Pull ({CREDIT_COSTS.OSIRION_PULL} credits)
        </button>

        <button
          onClick={() => handleAction(useCreditsForTournamentStrategy, 'Tournament Strategy', CREDIT_COSTS.TOURNAMENT_STRATEGY)}
          disabled={!canAfford(CREDIT_COSTS.TOURNAMENT_STRATEGY)}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed"
        >
          Get Strategy ({CREDIT_COSTS.TOURNAMENT_STRATEGY} credits)
        </button>

        <button
          onClick={() => handleAction(useCreditsForPOIAnalysis, 'POI Analysis', CREDIT_COSTS.POI_ANALYSIS)}
          disabled={!canAfford(CREDIT_COSTS.POI_ANALYSIS)}
          className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:bg-gray-600 disabled:cursor-not-allowed"
        >
          POI Analysis ({CREDIT_COSTS.POI_ANALYSIS} credits)
        </button>
      </div>

      {/* Action Result */}
      {actionResult && (
        <div className="bg-gray-700 rounded-lg p-4 mb-4">
          <div className="text-white">{actionResult}</div>
        </div>
      )}

      {/* Refresh Button */}
      <div className="text-center">
        <button
          onClick={refreshCredits}
          className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
        >
          Refresh Credits
        </button>
      </div>

      {/* Credit Costs Info */}
      <div className="mt-6 bg-gray-700 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-white mb-3">Credit Costs</h3>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-300">AI Chat Message</span>
            <span className="text-white">{CREDIT_COSTS.AI_CHAT} credit</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-300">Stats Lookup</span>
            <span className="text-white">{CREDIT_COSTS.STATS_LOOKUP} credits</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-300">Osirion Pull</span>
            <span className="text-white">{CREDIT_COSTS.OSIRION_PULL} credits</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-300">Tournament Strategy</span>
            <span className="text-white">{CREDIT_COSTS.TOURNAMENT_STRATEGY} credits</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-300">POI Analysis</span>
            <span className="text-white">{CREDIT_COSTS.POI_ANALYSIS} credits</span>
          </div>
        </div>
      </div>
    </div>
  );
};
