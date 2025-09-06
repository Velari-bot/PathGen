import React from 'react';
import { CreditTrackingExample } from '@/components/CreditTrackingExample';
import { CreditDisplay } from '@/components/CreditDisplay';

export default function CreditTrackingTestPage() {
  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8">
          PathGen AI Credit Tracking System
        </h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Credit Display */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Real-time Credit Display</h2>
            <CreditDisplay />
          </div>
          
          {/* Credit Tracking Demo */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Credit Usage Demo</h2>
            <CreditTrackingExample />
          </div>
        </div>
        
        <div className="mt-12 bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">How the Credit System Works</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-medium text-blue-400 mb-3">Features</h3>
              <ul className="space-y-2 text-gray-300">
                <li>✅ Real-time credit updates via Firebase</li>
                <li>✅ Atomic credit deductions (no race conditions)</li>
                <li>✅ Automatic credit validation</li>
                <li>✅ Credit usage logging for analytics</li>
                <li>✅ Refund capabilities for failed actions</li>
                <li>✅ React hooks for easy integration</li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-medium text-green-400 mb-3">Usage Examples</h3>
              <div className="space-y-2 text-sm text-gray-300">
                <div>
                  <code className="bg-gray-700 px-2 py-1 rounded">useCreditsForChat()</code>
                  <span className="ml-2">→ Deducts 1 credit for AI chat</span>
                </div>
                <div>
                  <code className="bg-gray-700 px-2 py-1 rounded">useCreditsForReplayUpload()</code>
                  <span className="ml-2">→ Deducts 20 credits for replay upload</span>
                </div>
                <div>
                  <code className="bg-gray-700 px-2 py-1 rounded">useCreditsForOsirionPull()</code>
                  <span className="ml-2">→ Deducts 50 credits for Osirion data</span>
                </div>
                <div>
                  <code className="bg-gray-700 px-2 py-1 rounded">canAfford(amount)</code>
                  <span className="ml-2">→ Check if user has enough credits</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-6 p-4 bg-gray-700 rounded-lg">
            <h3 className="text-lg font-medium text-yellow-400 mb-2">Integration Steps</h3>
            <ol className="list-decimal list-inside space-y-1 text-gray-300">
              <li>Import <code className="bg-gray-600 px-1 rounded">useCreditTracking</code> hook</li>
              <li>Use <code className="bg-gray-600 px-1 rounded">useCreditsFor[Action]()</code> functions</li>
              <li>Check <code className="bg-gray-600 px-1 rounded">canAfford()</code> before actions</li>
              <li>Display real-time updates with <code className="bg-gray-600 px-1 rounded">CreditDisplay</code></li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
