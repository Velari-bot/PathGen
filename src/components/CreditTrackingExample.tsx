'use client';

import React, { useState } from 'react';
import { useCreditTracking } from '@/hooks/useCreditTracking';
import { useAuth } from '@/contexts/AuthContext';
import { CreditSystem } from '@/lib/credit-system-client';

export default function CreditTrackingExample() {
  const { user } = useAuth();
  const { trackCreditUsage, updateCreditResult, refundCredits, isTracking } = useCreditTracking();
  const [result, setResult] = useState<string>('');
  const [availableCredits, setAvailableCredits] = useState<number>(0);

  const handleAIChat = async () => {
    if (!user) {
      setResult('Please log in to use this feature');
      return;
    }

    // Step 1: Track credit usage immediately when user clicks
    const trackResult = await trackCreditUsage('ai_chat_simple', {
      messageLength: 'short',
      timestamp: new Date().toISOString()
    });

    if (!trackResult.success) {
      setResult(`Error: ${trackResult.error}`);
      setAvailableCredits(trackResult.availableCredits);
      return;
    }

    setAvailableCredits(trackResult.availableCredits);
    setResult(`Credits deducted. Available: ${trackResult.availableCredits}`);

    // Step 2: Simulate AI chat processing
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Step 3: Update credit usage result (success)
      await updateCreditResult('ai_chat_simple', trackResult.sessionId!, true, {
        responseReceived: true,
        tokensUsed: 150
      });

      setResult(`AI Chat completed successfully! Available credits: ${trackResult.availableCredits}`);

    } catch (error) {
      // Step 3: Update credit usage result (failure)
      await updateCreditResult('ai_chat_simple', trackResult.sessionId!, false, {
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      // Step 4: Optionally refund credits if action failed
      const refundResult = await refundCredits('ai_chat_simple', trackResult.sessionId!);
      
      if (refundResult.success) {
        setAvailableCredits(refundResult.availableCredits);
        setResult(`Action failed. Credits refunded. Available: ${refundResult.availableCredits}`);
      } else {
        setResult('Action failed. Credits not refunded.');
      }
    }
  };

  const handleReplayUpload = async () => {
    if (!user) {
      setResult('Please log in to use this feature');
      return;
    }

    // Track credit usage immediately
    const trackResult = await trackCreditUsage('replay_upload', {
      fileSize: '2.5MB',
      timestamp: new Date().toISOString()
    });

    if (!trackResult.success) {
      setResult(`Error: ${trackResult.error}`);
      setAvailableCredits(trackResult.availableCredits);
      return;
    }

    setAvailableCredits(trackResult.availableCredits);
    setResult(`Replay upload started. Credits deducted. Available: ${trackResult.availableCredits}`);

    // Simulate upload processing
    try {
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      await updateCreditResult('replay_upload', trackResult.sessionId!, true, {
        uploadComplete: true,
        analysisComplete: true
      });

      setResult(`Replay upload completed! Available credits: ${trackResult.availableCredits}`);

    } catch (error) {
      await updateCreditResult('replay_upload', trackResult.sessionId!, false, {
        error: error instanceof Error ? error.message : 'Upload failed'
      });

      const refundResult = await refundCredits('replay_upload', trackResult.sessionId!);
      
      if (refundResult.success) {
        setAvailableCredits(refundResult.availableCredits);
        setResult(`Upload failed. Credits refunded. Available: ${refundResult.availableCredits}`);
      } else {
        setResult('Upload failed. Credits not refunded.');
      }
    }
  };

  const handleStatsLookup = async () => {
    if (!user) {
      setResult('Please log in to use this feature');
      return;
    }

    const trackResult = await trackCreditUsage('stat_lookup_basic', {
      playerName: 'example_player',
      timestamp: new Date().toISOString()
    });

    if (!trackResult.success) {
      setResult(`Error: ${trackResult.error}`);
      setAvailableCredits(trackResult.availableCredits);
      return;
    }

    setAvailableCredits(trackResult.availableCredits);
    setResult(`Stats lookup started. Credits deducted. Available: ${trackResult.availableCredits}`);

    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      await updateCreditResult('stat_lookup_basic', trackResult.sessionId!, true, {
        statsRetrieved: true,
        matchesFound: 25
      });

      setResult(`Stats lookup completed! Available credits: ${trackResult.availableCredits}`);

    } catch (error) {
      await updateCreditResult('stat_lookup_basic', trackResult.sessionId!, false, {
        error: error instanceof Error ? error.message : 'Lookup failed'
      });

      const refundResult = await refundCredits('stat_lookup_basic', trackResult.sessionId!);
      
      if (refundResult.success) {
        setAvailableCredits(refundResult.availableCredits);
        setResult(`Lookup failed. Credits refunded. Available: ${refundResult.availableCredits}`);
      } else {
        setResult('Lookup failed. Credits not refunded.');
      }
    }
  };

  return (
    <div className="glass-card p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold text-white mb-6">Credit Tracking Examples</h2>
      
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-blue-400 mb-2">Available Credits: {availableCredits}</h3>
        <p className="text-secondary-text text-sm">Credits are deducted immediately when actions are triggered</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <button
          onClick={handleAIChat}
          disabled={isTracking}
          className="btn-primary disabled:opacity-50"
        >
          {isTracking ? 'Processing...' : 'AI Chat (1 credit)'}
        </button>
        
        <button
          onClick={handleReplayUpload}
          disabled={isTracking}
          className="btn-secondary disabled:opacity-50"
        >
          {isTracking ? 'Processing...' : 'Replay Upload (20 credits)'}
        </button>
        
        <button
          onClick={handleStatsLookup}
          disabled={isTracking}
          className="btn-primary disabled:opacity-50"
        >
          {isTracking ? 'Processing...' : 'Stats Lookup (2 credits)'}
        </button>
      </div>

      <div className="bg-gray-800 rounded-lg p-4">
        <h4 className="text-lg font-semibold text-white mb-2">Result:</h4>
        <p className="text-secondary-text">{result || 'Click a button to test credit tracking'}</p>
      </div>

      <div className="mt-6 text-sm text-gray-400">
        <h4 className="font-semibold text-white mb-2">How it works:</h4>
        <ol className="list-decimal list-inside space-y-1">
          <li>Credits are deducted immediately when you click a button</li>
          <li>Action is processed (simulated here)</li>
          <li>Result is logged as success or failure</li>
          <li>Credits can be refunded if action fails</li>
        </ol>
      </div>
    </div>
  );
}
