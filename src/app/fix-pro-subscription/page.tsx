'use client';

import { useState } from 'react';

export default function ProSubscriptionFixPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const fixProSubscription = async () => {
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/comprehensive-pro-fix', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: '0IJZBQg3cDWIeDeWSWhK2IZjQ6u2'
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        setResult(data);
        console.log('✅ Pro subscription fix successful:', data);
      } else {
        setError(data.error || 'Failed to fix Pro subscription');
        console.error('❌ Pro subscription fix failed:', data);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('❌ Error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-dark p-8">
      <div className="max-w-4xl mx-auto">
        <div className="glass-card p-8">
          <h1 className="text-3xl font-bold text-white mb-6">
            🔧 Pro Subscription Fix
          </h1>
          
          <div className="space-y-6">
            <div className="bg-blue-500/20 border border-blue-500/30 rounded-lg p-4">
              <h2 className="text-xl font-semibold text-white mb-2">
                What This Does:
              </h2>
              <ul className="text-white/80 space-y-1">
                <li>• Sets your subscription tier to <strong>Pro</strong></li>
                <li>• Updates your credits to <strong>4000</strong></li>
                <li>• Fixes all subscription-related fields in Firebase</li>
                <li>• Updates usage tracking to Pro limits</li>
                <li>• Logs the fix for audit purposes</li>
              </ul>
            </div>

            <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-lg p-4">
              <h2 className="text-xl font-semibold text-white mb-2">
                ⚠️ Important:
              </h2>
              <p className="text-white/80">
                This will only work if you have already paid for Pro subscription. 
                It fixes the issue where payment succeeded but Firebase wasn't updated properly.
              </p>
            </div>

            <button
              onClick={fixProSubscription}
              disabled={isLoading}
              className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white font-semibold py-4 px-6 rounded-lg transition-colors"
            >
              {isLoading ? '🔧 Fixing Pro Subscription...' : '🔧 Fix My Pro Subscription'}
            </button>

            {error && (
              <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-red-400 mb-2">❌ Error:</h3>
                <p className="text-red-300">{error}</p>
              </div>
            )}

            {result && (
              <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-green-400 mb-2">✅ Success!</h3>
                <div className="text-green-300 space-y-2">
                  <p><strong>Message:</strong> {result.message}</p>
                  <p><strong>Plan:</strong> {result.plan}</p>
                  <p><strong>Status:</strong> {result.status}</p>
                  {result.creditsUpdated && (
                    <p><strong>Credits Added:</strong> {result.creditsAdded}</p>
                  )}
                  <p><strong>Timestamp:</strong> {new Date(result.timestamp).toLocaleString()}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
