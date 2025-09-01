'use client';

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/contexts/SubscriptionContext';

export default function TestSubscriptionFix() {
  const { user } = useAuth();
  const { subscription, loading } = useSubscription();
  const [isFixing, setIsFixing] = useState(false);
  const [result, setResult] = useState<any>(null);

  const fixSubscription = async () => {
    if (!user) return;
    
    setIsFixing(true);
    setResult(null);
    
    try {
      const response = await fetch('/api/fix-user-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.uid,
        }),
      });
      
      const data = await response.json();
      setResult(data);
      
      if (data.success) {
        // Reload the page to refresh subscription context
        window.location.reload();
      }
    } catch (error) {
      setResult({ error: 'Failed to fix subscription', details: error });
    } finally {
      setIsFixing(false);
    }
  };

  const checkSubscription = async () => {
    if (!user) return;
    
    try {
      const response = await fetch('/api/check-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.uid,
        }),
      });
      
      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({ error: 'Failed to check subscription', details: error });
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">🔧 Subscription Fix Tool</h1>
        
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Current Status</h2>
          <div className="space-y-2">
            <p><strong>User ID:</strong> {user?.uid || 'Not logged in'}</p>
            <p><strong>Subscription Tier:</strong> {subscription?.tier || 'free'}</p>
            <p><strong>Subscription Status:</strong> {subscription?.status || 'free'}</p>
            <p><strong>Loading:</strong> {loading ? 'Yes' : 'No'}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <button
            onClick={checkSubscription}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
          >
            🔍 Check Subscription Status
          </button>
          
          <button
            onClick={fixSubscription}
            disabled={isFixing}
            className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
          >
            {isFixing ? '🔧 Fixing...' : '🔧 Fix Subscription Status'}
          </button>
        </div>

        {result && (
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Result</h3>
            <pre className="bg-gray-900 p-4 rounded text-sm overflow-auto">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}

        <div className="bg-yellow-900 border border-yellow-600 rounded-lg p-6 mt-6">
          <h3 className="text-lg font-semibold text-yellow-200 mb-2">Instructions</h3>
          <ol className="list-decimal list-inside space-y-2 text-yellow-100">
            <li>Click "Check Subscription Status" to see your current subscription data</li>
            <li>If you're on Pro but it shows "free", click "Fix Subscription Status"</li>
            <li>The page will reload automatically after fixing</li>
            <li>Check if the subscription status is now correct</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
