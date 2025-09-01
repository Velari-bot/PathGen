'use client';

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/contexts/SubscriptionContext';

export default function SubscriptionTestPage() {
  const { user } = useAuth();
  const { subscription, loading, error, usage, limits } = useSubscription();
  const [testResults, setTestResults] = useState<any[]>([]);
  const [isRunningTests, setIsRunningTests] = useState(false);

  const addTestResult = (test: string, success: boolean, details: any) => {
    setTestResults(prev => [...prev, {
      test,
      success,
      details,
      timestamp: new Date().toISOString()
    }]);
  };

  const runSubscriptionTests = async () => {
    if (!user) {
      addTestResult('User Authentication', false, 'No user logged in');
      return;
    }

    setIsRunningTests(true);
    setTestResults([]);

    try {
      // Test 1: Check current subscription status
      addTestResult('Current Subscription Status', true, {
        tier: subscription?.tier || 'free',
        status: subscription?.status || 'free'
      });

      // Test 2: Test manual pro fix
      try {
        const response = await fetch('/api/manual-pro-fix', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.uid })
        });
        
        const result = await response.json();
        addTestResult('Manual Pro Fix', result.success, {
          message: result.message,
          updatedFields: result.updatedFields,
          error: result.error
        });
      } catch (error: any) {
        addTestResult('Manual Pro Fix', false, { error: error.message });
      }

      // Test 3: Test subscription consistency check
      try {
        const response = await fetch('/api/check-subscription-consistency', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.uid })
        });
        
        const result = await response.json();
        addTestResult('Consistency Check', result.success, {
          currentStatus: result.currentStatus,
          consistencyCheck: result.consistencyCheck,
          error: result.error
        });
      } catch (error: any) {
        addTestResult('Consistency Check', false, { error: error.message });
      }

      // Test 4: Check subscription data after updates
      setTimeout(async () => {
        try {
          const response = await fetch('/api/check-subscription', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: user.uid })
          });
          
          const result = await response.json();
          addTestResult('Post-Update Verification', result.success, {
            subscriptionData: result.subscriptionData,
            userData: result.userData,
            error: result.error
          });
        } catch (error: any) {
          addTestResult('Post-Update Verification', false, { error: error.message });
        }
      }, 2000);

    } catch (error: any) {
      addTestResult('Test Suite', false, { error: error.message });
    } finally {
      setIsRunningTests(false);
    }
  };

  const resetToFree = async () => {
    if (!user) return;

    try {
      const response = await fetch('/api/manual-pro-fix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId: user.uid,
          tier: 'free',
          status: 'active'
        })
      });
      
      const result = await response.json();
      addTestResult('Reset to Free', result.success, result);
    } catch (error: any) {
      addTestResult('Reset to Free', false, { error: error.message });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Subscription System Test</h1>
        
        {/* Current Status */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Current Status</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-medium text-gray-700">User</h3>
              <p className="text-sm text-gray-600">{user?.email || 'Not logged in'}</p>
            </div>
            <div>
              <h3 className="font-medium text-gray-700">Subscription</h3>
              <p className="text-sm text-gray-600">
                {loading ? 'Loading...' : 
                 subscription ? `${subscription.tier} - ${subscription.status}` : 'No subscription'}
              </p>
            </div>
            <div>
              <h3 className="font-medium text-gray-700">Usage</h3>
              <p className="text-sm text-gray-600">
                {usage ? `Messages: ${usage.messagesUsed || 0}` : 'No usage data'}
              </p>
            </div>
            <div>
              <h3 className="font-medium text-gray-700">Limits</h3>
              <p className="text-sm text-gray-600">
                {limits ? `Messages: ${limits.monthlyMessages || 0}` : 'No limits data'}
              </p>
            </div>
          </div>
        </div>

        {/* Test Controls */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Test Controls</h2>
          <div className="flex gap-4">
            <button
              onClick={runSubscriptionTests}
              disabled={isRunningTests || !user}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {isRunningTests ? 'Running Tests...' : 'Run Subscription Tests'}
            </button>
            <button
              onClick={resetToFree}
              disabled={isRunningTests || !user}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 disabled:opacity-50"
            >
              Reset to Free
            </button>
          </div>
        </div>

        {/* Test Results */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Test Results</h2>
          {testResults.length === 0 ? (
            <p className="text-gray-500">No tests run yet. Click "Run Subscription Tests" to start.</p>
          ) : (
            <div className="space-y-4">
              {testResults.map((result, index) => (
                <div
                  key={index}
                  className={`p-4 rounded border ${
                    result.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium">{result.test}</h3>
                    <span className={`px-2 py-1 rounded text-xs ${
                      result.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {result.success ? 'PASS' : 'FAIL'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">
                    {result.timestamp}
                  </p>
                  <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto">
                    {JSON.stringify(result.details, null, 2)}
                  </pre>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mt-6">
            <h3 className="text-red-800 font-medium">Error</h3>
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}
      </div>
    </div>
  );
}
