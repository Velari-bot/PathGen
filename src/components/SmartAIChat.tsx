'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { getModelRecommendation } from '@/lib/ai-model-selector';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  model?: string;
  cost?: number;
  reasoning?: string;
}

interface ModelStats {
  totalRequests: number;
  totalCost: number;
  modelBreakdown: Record<string, number>;
}

export default function SmartAIChat() {
  const { user } = useAuth();
  const { subscriptionTier } = useSubscription();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [modelStats, setModelStats] = useState<ModelStats | null>(null);
  const [showModelInfo, setShowModelInfo] = useState(false);

  // Load stats on component mount
  useEffect(() => {
    if (user) {
      loadModelStats();
    }
  }, [user]);

  const loadModelStats = async () => {
    try {
      const response = await fetch(`/api/ai-chat-smart?userId=${user?.uid}`);
      if (response.ok) {
        const data = await response.json();
        setModelStats(data.dailyStats);
      }
    } catch (error) {
      console.error('Failed to load model stats:', error);
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || !user) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    // Show model recommendation before sending
    const recommendation = getModelRecommendation(
      inputMessage,
      messages.map(m => m.content),
      {
        messageCount: messages.length,
        hasGameData: false, // You'd check for actual game data
        userTier: subscriptionTier === 'pro' ? 'pro' : 'free'
      }
    );

    console.log(`🤖 Will use: ${recommendation.model} | ${recommendation.reasoning}`);

    try {
      const response = await fetch('/api/ai-chat-smart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: inputMessage,
          conversationHistory: messages.map(m => m.content),
          userId: user.uid,
          userTier: subscriptionTier,
          gameData: null // Add actual game data here
        })
      });

      if (response.ok) {
        const data = await response.json();
        
        const assistantMessage: ChatMessage = {
          role: 'assistant',
          content: data.response,
          timestamp: new Date(),
          model: data.model,
          cost: data.performance.actualCost,
          reasoning: data.reasoning
        };

        setMessages(prev => [...prev, assistantMessage]);
        await loadModelStats(); // Refresh stats
        
      } else {
        const error = await response.json();
        if (error.suggestedUpgrade) {
          setMessages(prev => [...prev, {
            role: 'assistant',
            content: '🔒 This request requires advanced AI analysis. Upgrade to Pro for access to our most intelligent models!',
            timestamp: new Date(),
            model: 'upgrade-prompt'
          }]);
        } else {
          throw new Error(error.error);
        }
      }
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date(),
        model: 'error'
      }]);
    }

    setInputMessage('');
    setIsLoading(false);
  };

  const getModelIcon = (model?: string) => {
    switch (model) {
      case '4o-mini': return '⚡';
      case '4-turbo-mini': return '🧠';
      case '5-mini': return '🚀';
      case 'upgrade-prompt': return '🔒';
      case 'error': return '❌';
      default: return '🤖';
    }
  };

  const getModelColor = (model?: string) => {
    switch (model) {
      case '4o-mini': return 'text-green-600';
      case '4-turbo-mini': return 'text-blue-600';
      case '5-mini': return 'text-purple-600';
      case 'upgrade-prompt': return 'text-yellow-600';
      case 'error': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg">
        {/* Header with model stats */}
        <div className="border-b p-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold">Smart AI Chat</h2>
            <div className="flex items-center gap-4">
              {modelStats && (
                <div className="text-sm text-gray-600">
                  Today: {modelStats.totalRequests} requests, ${modelStats.totalCost.toFixed(4)}
                </div>
              )}
              <button
                onClick={() => setShowModelInfo(!showModelInfo)}
                className="text-blue-600 hover:text-blue-800 text-sm"
              >
                {showModelInfo ? 'Hide' : 'Show'} Model Info
              </button>
            </div>
          </div>
          
          {showModelInfo && (
            <div className="mt-4 p-3 bg-gray-50 rounded text-sm">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <div className="font-semibold">⚡ 4o-mini</div>
                  <div className="text-gray-600">Fast & cheap</div>
                  <div className="text-xs">Quick responses, basic queries</div>
                </div>
                <div>
                  <div className="font-semibold">🧠 4-turbo-mini</div>
                  <div className="text-gray-600">Balanced</div>
                  <div className="text-xs">Analysis, multi-step reasoning</div>
                </div>
                <div>
                  <div className="font-semibold">🚀 5-mini {subscriptionTier !== 'pro' && '(Pro)'}</div>
                  <div className="text-gray-600">Advanced</div>
                  <div className="text-xs">Predictions, complex analysis</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Chat messages */}
        <div className="h-96 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && (
            <div className="text-center text-gray-500 py-8">
              <div className="text-lg mb-2">🤖 Smart AI Assistant</div>
              <p>I automatically choose the best AI model for your request to optimize cost and quality!</p>
              <div className="mt-4 text-sm">
                <p><strong>Try:</strong></p>
                <p>"How many wins do I have?" (uses fast ⚡ model)</p>
                <p>"Analyze my gameplay and suggest improvements" (uses smart 🧠 model)</p>
                <p>"Predict my rank next season based on trends" (uses advanced 🚀 model)</p>
              </div>
            </div>
          )}
          
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  message.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                {message.role === 'assistant' && (
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-lg ${getModelColor(message.model)}`}>
                      {getModelIcon(message.model)}
                    </span>
                    <span className="text-xs text-gray-500">
                      {message.model} {message.cost && `($${message.cost.toFixed(6)})`}
                    </span>
                  </div>
                )}
                <div>{message.content}</div>
                {message.reasoning && showModelInfo && (
                  <div className="text-xs text-gray-500 mt-1 italic">
                    {message.reasoning}
                  </div>
                )}
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 text-gray-800 px-4 py-2 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  Thinking...
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input area */}
        <div className="border-t p-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="Ask anything about your Fortnite gameplay..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isLoading}
            />
            <button
              onClick={sendMessage}
              disabled={isLoading || !inputMessage.trim()}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Send
            </button>
          </div>
          
          {/* Model recommendation preview */}
          {inputMessage && (
            <div className="mt-2 text-xs text-gray-500">
              {(() => {
                const rec = getModelRecommendation(inputMessage, [], {
                  messageCount: 0,
                  hasGameData: false,
                  userTier: subscriptionTier === 'pro' ? 'pro' : 'free'
                });
                return `Will use: ${getModelIcon(rec.model)} ${rec.model} - ${rec.reasoning}`;
              })()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
