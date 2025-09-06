'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { EpicConnectButton } from '@/components/EpicConnectButton';
import { PathGenAIChat } from '@/components/PathGenAIChat';
import { StatsDemo } from '@/components/StatsDemo';

export default function E2ETestingPage() {
  const { user, loading } = useAuth();
  const [testStep, setTestStep] = useState(1);
  const [testResults, setTestResults] = useState<string[]>([]);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user) {
      loadUserProfile();
    }
  }, [user]);

  const loadUserProfile = async () => {
    try {
      const response = await fetch(`/api/user-profile?userId=${user?.uid}`);
      if (response.ok) {
        const data = await response.json();
        setUserProfile(data.profile);
        updateTestResults(`✅ User profile loaded: ${data.profile.displayName}`);
      }
    } catch (error) {
      updateTestResults(`❌ Error loading profile: ${error}`);
    }
  };

  const updateTestResults = (result: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${result}`]);
  };

  const runCompleteTest = async () => {
    setIsLoading(true);
    setTestResults([]);
    updateTestResults('🚀 Starting End-to-End Test...');

    try {
      // Step 1: Check Authentication
      updateTestResults('Step 1: Checking authentication...');
      if (!user) {
        updateTestResults('❌ User not authenticated');
        return;
      }
      updateTestResults('✅ User authenticated');

      // Step 2: Check Epic Account Connection
      updateTestResults('Step 2: Checking Epic account connection...');
      if (!userProfile?.epicId) {
        updateTestResults('⚠️ Epic account not connected - user needs to connect');
        setTestStep(2);
        return;
      }
      updateTestResults('✅ Epic account connected');

      // Step 3: Test Osirion Stats Fetch
      updateTestResults('Step 3: Testing Osirion stats fetch...');
      try {
        const statsResponse = await fetch('/api/osirion/stats', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            epicId: userProfile.epicId,
            userId: user.uid,
            platform: 'pc'
          })
        });
        
        if (statsResponse.ok) {
          const statsData = await statsResponse.json();
          updateTestResults(`✅ Osirion stats fetched: ${statsData.data?.summary?.totalMatches || 0} matches`);
        } else {
          updateTestResults('⚠️ Osirion stats fetch failed - may be rate limited');
        }
      } catch (error) {
        updateTestResults(`⚠️ Osirion stats error: ${error}`);
      }

      // Step 4: Test AI Coaching
      updateTestResults('Step 4: Testing AI coaching...');
      try {
        const aiResponse = await fetch('/api/ai-coaching', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: 'Test message for E2E testing',
            userId: user.uid,
            chatId: 'test-chat-' + Date.now()
          })
        });

        if (aiResponse.ok) {
          const aiData = await aiResponse.json();
          updateTestResults(`✅ AI coaching response received: ${aiData.quick_fix?.substring(0, 50)}...`);
        } else {
          const errorData = await aiResponse.json();
          updateTestResults(`❌ AI coaching failed: ${errorData.error}`);
        }
      } catch (error) {
        updateTestResults(`❌ AI coaching error: ${error}`);
      }

      // Step 5: Test Credit System
      updateTestResults('Step 5: Testing credit system...');
      try {
        const creditResponse = await fetch(`/api/get-credits?userId=${user.uid}`);
        if (creditResponse.ok) {
          const creditData = await creditResponse.json();
          updateTestResults(`✅ Credits retrieved: ${creditData.credits?.credits_remaining || 0} remaining`);
        } else {
          updateTestResults('❌ Credit system test failed');
        }
      } catch (error) {
        updateTestResults(`❌ Credit system error: ${error}`);
      }

      updateTestResults('🎉 End-to-End Test Complete!');
      setTestStep(3);

    } catch (error) {
      updateTestResults(`❌ Test failed: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEpicAccountLinked = (epicAccount: any) => {
    updateTestResults(`✅ Epic account linked: ${epicAccount.displayName}`);
    loadUserProfile();
    setTestStep(3);
  };

  const handleEpicError = (error: string) => {
    updateTestResults(`❌ Epic account error: ${error}`);
  };

  if (loading) {
    return <div className="p-8 text-center">Loading...</div>;
  }

  if (!user) {
    return (
      <div className="p-8 text-center">
        <h1 className="text-2xl font-bold mb-4">End-to-End Testing</h1>
        <p className="text-gray-600">Please log in to run tests</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">🧪 End-to-End Testing Dashboard</h1>
      
      {/* Test Progress */}
      <div className="bg-gray-800 rounded-lg p-6 mb-6">
        <h2 className="text-xl font-bold text-white mb-4">Test Progress</h2>
        <div className="flex items-center space-x-4 mb-4">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${testStep >= 1 ? 'bg-green-500' : 'bg-gray-500'}`}>
            <span className="text-white font-bold">1</span>
          </div>
          <span className="text-white">Authentication</span>
          
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${testStep >= 2 ? 'bg-green-500' : 'bg-gray-500'}`}>
            <span className="text-white font-bold">2</span>
          </div>
          <span className="text-white">Epic Account</span>
          
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${testStep >= 3 ? 'bg-green-500' : 'bg-gray-500'}`}>
            <span className="text-white font-bold">3</span>
          </div>
          <span className="text-white">AI Coaching</span>
        </div>
        
        <button
          onClick={runCompleteTest}
          disabled={isLoading}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg disabled:opacity-50"
        >
          {isLoading ? 'Running Tests...' : 'Run Complete Test'}
        </button>
      </div>

      {/* Test Results */}
      <div className="bg-gray-800 rounded-lg p-6 mb-6">
        <h2 className="text-xl font-bold text-white mb-4">Test Results</h2>
        <div className="bg-black rounded-lg p-4 h-64 overflow-y-auto">
          {testResults.length === 0 ? (
            <p className="text-gray-400">No test results yet. Click "Run Complete Test" to start.</p>
          ) : (
            testResults.map((result, index) => (
              <div key={index} className="text-green-400 font-mono text-sm mb-1">
                {result}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Epic Account Connection */}
      {testStep === 2 && (
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-white mb-4">Connect Epic Account</h2>
          <EpicConnectButton
            onAccountLinked={handleEpicAccountLinked}
            onError={handleEpicError}
          />
        </div>
      )}

      {/* AI Coaching Test */}
      {testStep >= 3 && userProfile?.epicId && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-bold text-white mb-4">AI Coaching Test</h2>
            <PathGenAIChat />
          </div>
          
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-bold text-white mb-4">Stats Demo</h2>
            <StatsDemo />
          </div>
        </div>
      )}

      {/* User Profile Info */}
      <div className="bg-gray-800 rounded-lg p-6 mt-6">
        <h2 className="text-xl font-bold text-white mb-4">User Profile</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-gray-400">Display Name:</span>
            <div className="text-white">{userProfile?.displayName || 'Not set'}</div>
          </div>
          <div>
            <span className="text-gray-400">Epic ID:</span>
            <div className="text-white">{userProfile?.epicId || 'Not connected'}</div>
          </div>
          <div>
            <span className="text-gray-400">Skill Level:</span>
            <div className="text-white">{userProfile?.skillLevel || 'Not set'}</div>
          </div>
          <div>
            <span className="text-gray-400">Playstyle:</span>
            <div className="text-white">{userProfile?.playstyle || 'Not set'}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
