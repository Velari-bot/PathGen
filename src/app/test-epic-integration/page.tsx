'use client';

import React, { useState } from 'react';
import { EpicIntegration } from '@/lib/epic-integration';

export default function TestEpicIntegration() {
  const [epicId, setEpicId] = useState('');
  const [epicName, setEpicName] = useState('');
  const [userId, setUserId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<string>('');

  const handleTestIntegration = async () => {
    if (!epicId || !epicName || !userId) {
      setResult('Please fill in all fields');
      return;
    }

    setIsLoading(true);
    setResult('Testing Epic integration...');

    try {
      await EpicIntegration.pullAndSaveFortniteStats(userId, epicId, epicName);
      setResult('✅ Fortnite stats successfully pulled and saved to Firebase!');
    } catch (error) {
      setResult(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGetRecentMatches = async () => {
    if (!epicId) {
      setResult('Please enter an Epic ID');
      return;
    }

    setIsLoading(true);
    setResult('Getting recent matches...');

    try {
      const matches = await EpicIntegration.getRecentMatches(epicId, 5);
      setResult(`✅ Found ${matches.length} recent matches: ${JSON.stringify(matches, null, 2)}`);
    } catch (error) {
      setResult(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGetSeasonStats = async () => {
    if (!epicId) {
      setResult('Please enter an Epic ID');
      return;
    }

    setIsLoading(true);
    setResult('Getting season stats...');

    try {
      const stats = await EpicIntegration.getCurrentSeasonStats(epicId);
      if (stats) {
        setResult(`✅ Season stats: ${JSON.stringify(stats, null, 2)}`);
      } else {
        setResult('⚠️ No season stats found');
      }
    } catch (error) {
      setResult(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">🧪 Test Epic Integration</h1>
        
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Test Configuration</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-2">Epic ID</label>
              <input
                type="text"
                value={epicId}
                onChange={(e) => setEpicId(e.target.value)}
                placeholder="Enter Epic ID"
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Epic Name</label>
              <input
                type="text"
                value={epicName}
                onChange={(e) => setEpicName(e.target.value)}
                placeholder="Enter Epic Name"
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">User ID</label>
              <input
                type="text"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                placeholder="Enter User ID"
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
              />
            </div>
          </div>
          
          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleTestIntegration}
              disabled={isLoading}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 rounded font-medium"
            >
              {isLoading ? 'Testing...' : 'Test Full Integration'}
            </button>
            
            <button
              onClick={handleGetRecentMatches}
              disabled={isLoading}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 rounded font-medium"
            >
              {isLoading ? 'Loading...' : 'Get Recent Matches'}
            </button>
            
            <button
              onClick={handleGetSeasonStats}
              disabled={isLoading}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 rounded font-medium"
            >
              {isLoading ? 'Loading...' : 'Get Season Stats'}
            </button>
          </div>
        </div>
        
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Test Results</h2>
          <div className="bg-gray-700 rounded p-4 min-h-[200px]">
            <pre className="whitespace-pre-wrap text-sm">{result || 'No results yet...'}</pre>
          </div>
        </div>
        
        <div className="bg-blue-900/20 border border-blue-500/20 rounded-lg p-4 mt-6">
          <h3 className="text-lg font-semibold text-blue-400 mb-2">📋 What This Tests</h3>
          <ul className="text-sm text-gray-300 space-y-1">
            <li>• Epic account connection and data retrieval</li>
            <li>• Fortnite stats pulling from Osirion API</li>
            <li>• Data transformation and Firebase storage</li>
            <li>• Recent matches and season stats retrieval</li>
          </ul>
        </div>
        
        <div className="bg-yellow-900/20 border border-yellow-500/20 rounded-lg p-4 mt-4">
          <h3 className="text-lg font-semibold text-yellow-400 mb-2">⚠️ Requirements</h3>
          <ul className="text-sm text-gray-300 space-y-1">
            <li>• <code className="bg-gray-700 px-1 rounded">OSIRION_API_KEY</code> environment variable</li>
            <li>• Valid Epic Games account ID</li>
            <li>• Firebase connection working</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
