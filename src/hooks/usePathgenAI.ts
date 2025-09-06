'use client';

import { useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { AICoachingResponse } from '@/types/ai-coaching';

interface UsePathgenAIResult {
  askAI: (message: string, chatId?: string) => Promise<AICoachingResponse>;
  isLoading: boolean;
  error: string | null;
  lastResponse: AICoachingResponse | null;
}

export function usePathgenAI(): UsePathgenAIResult {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastResponse, setLastResponse] = useState<AICoachingResponse | null>(null);

  const askAI = useCallback(async (message: string, chatId?: string): Promise<AICoachingResponse> => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/ai-coaching', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          userId: user.uid,
          chatId
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get AI response');
      }

      if (!data.success) {
        throw new Error(data.error || 'AI processing failed');
      }

      const aiResponse = data.response as AICoachingResponse;
      setLastResponse(aiResponse);
      return aiResponse;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      
      // Return fallback response
      const fallbackResponse: AICoachingResponse = {
        quick_fix: "I encountered an error processing your request. Please try again.",
        detailed_analysis: [
          "Technical issue occurred during AI processing",
          "This might be due to insufficient credits or API limits",
          "Your message was received but couldn't be processed"
        ],
        action_plan: [
          "Check your credit balance in the dashboard",
          "Try rephrasing your question",
          "Contact support if the issue persists"
        ],
        tone: "chill"
      };

      setLastResponse(fallbackResponse);
      return fallbackResponse;
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  return {
    askAI,
    isLoading,
    error,
    lastResponse
  };
}
