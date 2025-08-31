'use client';

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Navbar from '@/components/Navbar';

export default function TestSubscriptionFixPage() {
  const { user } = useAuth();
  const [isFixing, setIsFixing] = useState(false);
  const [isForceFixing, setIsForceFixing] = useState(false);
  const [result, setResult] = useState<string>('');

  const handleFixSubscription = async () => {
    if (!user) {
      setResult('No user logged in');
      return;
    }

    setIsFixing(true);
    setResult('');

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

      if (response.ok) {
        setResult(`✅ Success: ${data.message}`);
        // Refresh the page after a short delay to show updated subscription
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        setResult(`❌ Error: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      setResult(`❌ Network error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsFixing(false);
    }
  };

  const handleForceFixSubscription = async () => {
    if (!user) {
      setResult('No user logged in');
      return;
    }

    setIsForceFixing(true);
    setResult('');

    try {
      const response = await fetch('/api/force-fix-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.uid,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setResult(`✅ Force Fix Success: ${data.message} (Found Pro: ${data.foundProSubscription})`);
        // Refresh the page after a short delay to show updated subscription
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        setResult(`❌ Force Fix Error: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      setResult(`❌ Force Fix Network Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsForceFixing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-dark">
      <Navbar />
      <div className="container mx-auto px-4 py-20">
        <div className="max-w-md mx-auto">
          <h1 className="text-2xl font-bold text-white mb-6">Fix Subscription</h1>
          
          <div className="bg-dark-gray border border-white/10 rounded-lg p-6">
            <p className="text-white mb-4">
              User ID: <span className="text-blue-400">{user?.uid || 'Not logged in'}</span>
            </p>
            
            <button
              onClick={handleFixSubscription}
              disabled={isFixing || isForceFixing || !user}
              className="w-full btn-primary py-3 disabled:opacity-50 disabled:cursor-not-allowed mb-3"
            >
              {isFixing ? 'Fixing...' : 'Fix My Subscription'}
            </button>
            
            <button
              onClick={handleForceFixSubscription}
              disabled={isFixing || isForceFixing || !user}
              className="w-full bg-red-600 hover:bg-red-700 text-white py-3 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isForceFixing ? 'Force Fixing...' : 'Force Fix (Check Webhook Logs)'}
            </button>
            
            {result && (
              <div className="mt-4 p-3 rounded-lg text-sm">
                {result.startsWith('✅') ? (
                  <div className="bg-green-500/10 border border-green-500/20 text-green-400">
                    {result}
                  </div>
                ) : (
                  <div className="bg-red-500/10 border border-red-500/20 text-red-400">
                    {result}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
