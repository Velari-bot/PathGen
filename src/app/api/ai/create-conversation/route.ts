import { NextRequest, NextResponse } from 'next/server';
import { FirebaseService, ChatMessage } from '@/lib/firebase-service';
import { UsageTracker } from '@/lib/usage-tracker';

export async function POST(request: NextRequest) {
  try {
    const { conversation, userId } = await request.json();

    if (!conversation || !userId) {
      return NextResponse.json(
        { error: 'Missing conversation data or userId' },
        { status: 400 }
      );
    }

    // Check if user can create more conversations
    const userTier = 'free' as 'free' | 'paid' | 'pro'; // This should come from user's actual tier
    const canCreateConversation = await UsageTracker.canUseFeature(userId, 'conversationsPerMonth', userTier);

    if (!canCreateConversation.canUse) {
      return NextResponse.json({
        success: false,
        blocked: true,
        message: 'Monthly conversation limit reached',
        upgradeRequired: true,
        currentUsage: canCreateConversation.currentUsage,
        limit: canCreateConversation.limit,
        suggestion: 'Upgrade to access more AI conversations per month'
      });
    }

    // Save conversation to Firebase
    await FirebaseService.saveConversation(conversation);

    // Increment usage counter
    await UsageTracker.incrementUsage(userId, 'conversationsCreated');

    // Create welcome message from AI
    const welcomeMessage: Omit<ChatMessage, 'id' | 'timestamp'> = {
      chatId: conversation.id,
      userId: userId,
      content: `Welcome to PathGen, ${conversation.epicName}! 🎮

I'm your AI Fortnite coach, and I'm here to help you improve your game. I can see you've just connected your Epic account, which means we can work together to analyze your stats and create a personalized improvement plan.

🎯 **What would you like to focus on first?**

I can help with:
• **Building techniques** - Ramp rushes, 90s, editing
• **Aim and accuracy** - Tracking, flick shots, building while shooting
• **Game sense** - Positioning, rotations, when to fight vs. when to run
• **Strategy** - Drop locations, loadout management, endgame tactics

Just tell me what you'd like to work on, or ask me to analyze your current performance!`,
      type: 'text' as const,
      role: 'assistant',
      aiResponse: {
        model: 'gpt-4',
        confidence: 0.95,
        suggestions: ['Focus on building fundamentals', 'Practice aim training', 'Study high-level gameplay'],
        relatedTopics: ['building', 'aim', 'positioning', 'game-sense'],
        followUpQuestions: ['What\'s your biggest struggle in Fortnite?', 'Which mode do you play most?', 'What\'s your goal for improvement?'],
        tokensUsed: 150
      }
    };

    // Save welcome message to Firebase
    await FirebaseService.addMessage(conversation.id, welcomeMessage);

    return NextResponse.json({
      success: true,
      conversation: conversation,
      welcomeMessage: welcomeMessage,
      usage: {
        current: canCreateConversation.currentUsage + 1,
        limit: canCreateConversation.limit,
        remaining: canCreateConversation.remaining - 1
      }
    });

  } catch (error) {
    console.error('Error creating AI conversation:', error);
    return NextResponse.json(
      { 
        error: 'Failed to create AI conversation',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
