'use client';

import React, { useState } from 'react';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { FeatureGate, FeatureGateWithUsage, UsageIndicator } from './FeatureGate';

export function UsageExample() {
  const { trackUsage, getCurrentUsage } = useSubscription();
  const [usageData, setUsageData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleTrackUsage = async (feature: string) => {
    setLoading(true);
    try {
      const result = await trackUsage({
        feature: feature as any,
        tokensUsed: Math.floor(Math.random() * 100) + 10,
        metadata: { timestamp: new Date().toISOString() }
      });
      console.log('Usage tracked:', result);
      
      // Refresh usage data
      const currentUsage = await getCurrentUsage();
      setUsageData(currentUsage);
    } catch (error) {
      console.error('Failed to track usage:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGetUsage = async () => {
    setLoading(true);
    try {
      const currentUsage = await getCurrentUsage();
      setUsageData(currentUsage);
    } catch (error) {
      console.error('Failed to get usage:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Subscription & Usage Examples</h1>
      
      {/* Basic Feature Gate Example */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Feature Access Control</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Free Feature */}
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-2">Free Feature</h3>
            <FeatureGate requiredTier="free">
              <div className="bg-green-50 border border-green-200 rounded p-3">
                <p className="text-green-800">✅ This feature is available to all users!</p>
              </div>
            </FeatureGate>
          </div>

          {/* Standard Feature */}
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-2">Standard Feature</h3>
            <FeatureGate requiredTier="standard">
              <div className="bg-blue-50 border border-blue-200 rounded p-3">
                <p className="text-blue-800">🚀 Standard tier feature unlocked!</p>
              </div>
            </FeatureGate>
          </div>

          {/* Pro Feature */}
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-2">Pro Feature</h3>
            <FeatureGate requiredTier="pro">
              <div className="bg-purple-50 border border-purple-200 rounded p-3">
                <p className="text-purple-800">💎 Pro tier exclusive feature!</p>
              </div>
            </FeatureGate>
          </div>

          {/* Feature with Fallback */}
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-2">Feature with Fallback</h3>
            <FeatureGate 
              requiredTier="standard" 
              fallback={
                <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
                  <p className="text-yellow-800">⚠️ Upgrade to Standard to access this feature</p>
                </div>
              }
            >
              <div className="bg-blue-50 border border-blue-200 rounded p-3">
                <p className="text-blue-800">🚀 Standard tier feature unlocked!</p>
              </div>
            </FeatureGate>
          </div>
        </div>
      </div>

      {/* Usage Tracking Example */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Usage Tracking</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <UsageIndicator feature="message" />
          <UsageIndicator feature="data_pull" />
          <UsageIndicator feature="tournament_strategy" />
        </div>

        <div className="space-y-4">
          <h3 className="font-medium text-gray-900">Track Feature Usage</h3>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleTrackUsage('message')}
              disabled={loading}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
            >
              {loading ? 'Tracking...' : 'Track Message Usage'}
            </button>
            <button
              onClick={() => handleTrackUsage('data_pull')}
              disabled={loading}
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50"
            >
              {loading ? 'Tracking...' : 'Track Data Pull Usage'}
            </button>
            <button
              onClick={() => handleTrackUsage('tournament_strategy')}
              disabled={loading}
              className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50"
            >
              {loading ? 'Tracking...' : 'Track Tournament Strategy Usage'}
            </button>
            <button
              onClick={handleGetUsage}
              disabled={loading}
              className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50"
            >
              {loading ? 'Loading...' : 'Get Current Usage'}
            </button>
          </div>
        </div>

        {usageData && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Current Usage Data</h4>
            <pre className="text-sm text-gray-700 overflow-auto">
              {JSON.stringify(usageData, null, 2)}
            </pre>
          </div>
        )}
      </div>

      {/* Feature Gate with Usage Tracking */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Feature Gate with Usage Tracking</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-2">AI Message (Auto-tracking)</h3>
            <FeatureGateWithUsage 
              requiredTier="free" 
              feature="message"
              onFeatureUse={() => {
                console.log('AI message feature used!');
                alert('AI message sent! Usage automatically tracked.');
              }}
            >
              <button className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
                Send AI Message
              </button>
            </FeatureGateWithUsage>
          </div>

          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-2">Tournament Strategy (Auto-tracking)</h3>
            <FeatureGateWithUsage 
              requiredTier="standard" 
              feature="tournament_strategy"
              onFeatureUse={() => {
                console.log('Tournament strategy generated!');
                alert('Tournament strategy generated! Usage automatically tracked.');
              }}
            >
              <button className="w-full px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600">
                Generate Strategy
              </button>
            </FeatureGateWithUsage>
          </div>
        </div>
      </div>

      {/* Subscription Status */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Subscription Status</h2>
        <div className="text-sm text-gray-600">
          <p>This component demonstrates how to use the subscription system:</p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>Feature gates control access based on subscription tier</li>
            <li>Usage tracking automatically monitors feature usage</li>
            <li>Real-time subscription state updates</li>
            <li>Automatic limit enforcement</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
