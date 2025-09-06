'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { usePathgenAI } from '@/hooks/usePathgenAI';
import { CoachingCard } from '@/components/CoachingCard';
import { EpicRequiredBanner } from '@/components/EpicRequiredBanner';
import { AICoachingResponse } from '@/types/ai-coaching';
// Remove direct import of ConversationManager - use API calls instead

export const PathGenAIChat: React.FC = () => {
  const { user } = useAuth();
  const { askAI, isLoading, error, lastResponse } = usePathgenAI();
  const [inputMessage, setInputMessage] = useState('');
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [conversationHistory, setConversationHistory] = useState<Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    aiResponse?: AICoachingResponse;
  }>>([]);

  // Load user profile to check Epic account connection
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
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  };

  // Initialize conversation
  useEffect(() => {
    if (user && !currentChatId) {
      initializeConversation();
    }
  }, [user, currentChatId]);

  const initializeConversation = async () => {
    try {
      const response = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user!.uid })
      });
      
      if (response.ok) {
        const data = await response.json();
        setCurrentChatId(data.chatId);
      } else {
        console.error('Failed to create conversation');
      }
    } catch (error) {
      console.error('Error initializing conversation:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !user || !currentChatId) return;

    const message = inputMessage.trim();
    setInputMessage('');

    // Add user message to history
    const userMessage = {
      role: 'user' as const,
      content: message,
      timestamp: new Date()
    };
    setConversationHistory(prev => [...prev, userMessage]);

    try {
      // Get AI response
      const aiResponse = await askAI(message, currentChatId);

      // Add AI response to history
      const assistantMessage = {
        role: 'assistant' as const,
        content: JSON.stringify(aiResponse),
        timestamp: new Date(),
        aiResponse
      };
      setConversationHistory(prev => [...prev, assistantMessage]);

    } catch (error) {
      console.error('Error sending message:', error);
      
      // Add error message to history
      const errorMessage = {
        role: 'assistant' as const,
        content: 'Sorry, I encountered an error processing your message. Please try again.',
        timestamp: new Date()
      };
      setConversationHistory(prev => [...prev, errorMessage]);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const clearConversation = () => {
    setConversationHistory([]);
    if (currentChatId) {
      // Delete conversation via API
      fetch(`/api/conversations/${currentChatId}`, {
        method: 'DELETE'
      }).catch(error => {
        console.error('Error deleting conversation:', error);
      });
      initializeConversation();
    }
  };

  if (!user) {
    return (
      <div className="bg-gray-800 rounded-lg p-6 text-center">
        <p className="text-gray-400">Please log in to use PathGen AI</p>
      </div>
    );
  }

  // Check if Epic account is connected
  if (!userProfile?.epicId) {
    return (
      <div className="max-w-4xl mx-auto">
        <EpicRequiredBanner 
          message="Connect your Epic account to get personalized AI coaching based on your Fortnite stats"
          className="mb-6"
        />
        
        {/* Show basic AI chat without stats */}
        <div className="bg-gray-800 rounded-lg p-6 text-center">
          <h3 className="text-lg font-bold text-white mb-2">Basic AI Chat Available</h3>
          <p className="text-gray-400 mb-4">
            You can still ask general Fortnite questions, but personalized coaching requires Epic account connection.
          </p>
          <div className="text-sm text-gray-500">
            <p>• General Fortnite strategy advice</p>
            <p>• Meta discussions and tips</p>
            <p>• Basic improvement guidance</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-gray-800 rounded-lg p-4 mb-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">PathGen AI Coach</h2>
            <p className="text-gray-400 text-sm">Your personal Fortnite improvement coach</p>
          </div>
          <button
            onClick={clearConversation}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm transition-colors"
          >
            New Chat
          </button>
        </div>
      </div>

      {/* Conversation History */}
      <div className="space-y-4 mb-6">
        {conversationHistory.map((message, index) => (
          <div key={index} className="flex flex-col space-y-2">
            {message.role === 'user' ? (
              <div className="flex justify-end">
                <div className="bg-blue-600 text-white rounded-lg p-3 max-w-xs">
                  {message.content}
                </div>
              </div>
            ) : (
              <div className="flex justify-start">
                <div className="max-w-full">
                  {message.aiResponse ? (
                    <CoachingCard response={message.aiResponse} />
                  ) : (
                    <div className="bg-gray-700 text-white rounded-lg p-3 max-w-xs">
                      {message.content}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Loading indicator */}
        {isLoading && (
          <div className="flex justify-start">
            <CoachingCard 
              response={{
                quick_fix: "Analyzing your question...",
                detailed_analysis: ["Processing your request", "Gathering relevant data", "Generating insights"],
                action_plan: ["Please wait", "AI is working", "Response coming soon"],
                tone: "chill"
              }}
              isLoading={true}
            />
          </div>
        )}

        {/* Error display */}
        {error && (
          <div className="bg-red-600 text-white rounded-lg p-4">
            <p className="font-semibold">Error:</p>
            <p>{error}</p>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="bg-gray-800 rounded-lg p-4">
        <div className="flex space-x-2">
          <textarea
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask PathGen AI about your Fortnite gameplay, strategies, or improvement tips..."
            className="flex-1 bg-gray-700 text-white rounded-lg p-3 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={3}
            disabled={isLoading}
          />
          <button
            onClick={handleSendMessage}
            disabled={isLoading || !inputMessage.trim()}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
          >
            {isLoading ? 'Sending...' : 'Send'}
          </button>
        </div>
        
        {/* Quick suggestions */}
        <div className="mt-3 flex flex-wrap gap-2">
          {[
            "Why do I lose mid-game fights?",
            "How can I improve my aim?",
            "What's the best landing strategy?",
            "How do I rotate better?"
          ].map((suggestion, index) => (
            <button
              key={index}
              onClick={() => setInputMessage(suggestion)}
              className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-full text-sm transition-colors"
            >
              {suggestion}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PathGenAIChat;
