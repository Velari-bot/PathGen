'use client';

import React, { useState } from 'react';
import { getModelRecommendation } from '@/lib/ai-model-selector';
import SmartAIChat from '@/components/SmartAIChat';

export default function AITestPage() {
  const [testInput, setTestInput] = useState('');
  const [testResults, setTestResults] = useState<any>(null);
  const [userTier, setUserTier] = useState<'free' | 'pro'>('free');

  const testModelSelection = () => {
    if (!testInput.trim()) return;

    const recommendation = getModelRecommendation(
      testInput,
      [],
      {
        messageCount: 0,
        hasGameData: false,
        userTier
      }
    );

    setTestResults(recommendation);
  };

  const testCases = [
    { input: "Hi", expected: "4o-mini", reason: "Simple greeting" },
    { input: "How many wins do I have?", expected: "4o-mini", reason: "Basic stats query" },
    { input: "Analyze my gameplay and tell me what I should improve", expected: "4-turbo-mini", reason: "Analysis required" },
    { input: "Create a detailed strategy for improving my competitive ranking over the next 3 months with step-by-step weekly goals", expected: "5-mini", reason: "Complex strategic planning" },
    { input: "Predict my future performance based on my current trends", expected: "5-mini", reason: "Prediction required" },
    { input: "What should I focus on to improve my building skills?", expected: "4-turbo-mini", reason: "Improvement guidance" }
  ];

  const runAllTests = () => {
    const results = testCases.map(testCase => {
      const recommendation = getModelRecommendation(
        testCase.input,
        [],
        { messageCount: 0, hasGameData: false, userTier }
      );
      
      return {
        ...testCase,
        actual: recommendation.model,
        passed: recommendation.model === testCase.expected,
        analysis: recommendation.analysis,
        reasoning: recommendation.reasoning
      };
    });
    
    console.table(results);
    alert(`Test Results: ${results.filter(r => r.passed).length}/${results.length} passed`);
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">AI Model Selection Test</h1>
      
      {/* User Tier Selector */}
      <div className="mb-6 p-4 bg-gray-100 rounded-lg">
        <label className="block text-sm font-medium mb-2">User Tier:</label>
        <div className="flex gap-4">
          <label className="flex items-center">
            <input
              type="radio"
              value="free"
              checked={userTier === 'free'}
              onChange={(e) => setUserTier(e.target.value as 'free' | 'pro')}
              className="mr-2"
            />
            Free
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              value="pro"
              checked={userTier === 'pro'}
              onChange={(e) => setUserTier(e.target.value as 'free' | 'pro')}
              className="mr-2"
            />
            Pro
          </label>
        </div>
      </div>

      {/* Manual Test */}
      <div className="mb-8 p-4 border rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Manual Test</h2>
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={testInput}
            onChange={(e) => setTestInput(e.target.value)}
            placeholder="Enter a test message..."
            className="flex-1 px-3 py-2 border rounded"
          />
          <button
            onClick={testModelSelection}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Test
          </button>
        </div>
        
        {testResults && (
          <div className="p-4 bg-gray-50 rounded">
            <h3 className="font-semibold mb-2">Results:</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <strong>Selected Model:</strong> {testResults.model}
              </div>
              <div>
                <strong>Complexity:</strong> {testResults.analysis.complexity}
              </div>
              <div>
                <strong>Request Type:</strong> {testResults.analysis.requestType}
              </div>
              <div>
                <strong>Estimated Cost:</strong> ${testResults.estimatedCost.toFixed(6)}
              </div>
              <div className="col-span-2">
                <strong>Reasoning:</strong> {testResults.reasoning}
              </div>
              <div className="col-span-2">
                <strong>Analysis:</strong>
                <ul className="ml-4 mt-1">
                  <li>• Requires Analysis: {testResults.analysis.requiresAnalysis ? 'Yes' : 'No'}</li>
                  <li>• Requires Prediction: {testResults.analysis.requiresPrediction ? 'Yes' : 'No'}</li>
                  <li>• Multi-step: {testResults.analysis.requiresMultiStep ? 'Yes' : 'No'}</li>
                  <li>• Personalization: {testResults.analysis.requiresPersonalization ? 'Yes' : 'No'}</li>
                  <li>• Word Count: {testResults.analysis.wordCount}</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Automated Tests */}
      <div className="mb-8 p-4 border rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Automated Test Cases</h2>
        <button
          onClick={runAllTests}
          className="mb-4 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
        >
          Run All Tests
        </button>
        
        <div className="space-y-2">
          {testCases.map((testCase, index) => (
            <div key={index} className="p-3 bg-gray-50 rounded text-sm">
              <div><strong>Input:</strong> "{testCase.input}"</div>
              <div><strong>Expected:</strong> {testCase.expected} ({testCase.reason})</div>
            </div>
          ))}
        </div>
      </div>

      {/* Model Costs */}
      <div className="mb-8 p-4 border rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Model Comparison</h2>
        <div className="grid grid-cols-3 gap-4">
          <div className="p-3 bg-green-50 rounded">
            <h3 className="font-semibold text-green-800">⚡ 4o-mini</h3>
            <p className="text-sm text-green-600">$0.000001/token</p>
            <p className="text-xs">Fast, cost-efficient</p>
            <p className="text-xs">Perfect for: Quick queries, stats, simple feedback</p>
          </div>
          <div className="p-3 bg-blue-50 rounded">
            <h3 className="font-semibold text-blue-800">🧠 4-turbo-mini</h3>
            <p className="text-sm text-blue-600">$0.000005/token</p>
            <p className="text-xs">Balanced performance</p>
            <p className="text-xs">Perfect for: Analysis, guidance, multi-step reasoning</p>
          </div>
          <div className="p-3 bg-purple-50 rounded">
            <h3 className="font-semibold text-purple-800">🚀 5-mini</h3>
            <p className="text-sm text-purple-600">$0.00001/token</p>
            <p className="text-xs">Advanced intelligence</p>
            <p className="text-xs">Perfect for: Predictions, complex strategy, patterns</p>
          </div>
        </div>
      </div>

      {/* Live Demo */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Live Demo Chat</h2>
        <SmartAIChat />
      </div>
    </div>
  );
}
