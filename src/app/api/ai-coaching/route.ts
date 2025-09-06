import { NextRequest, NextResponse } from 'next/server';
import { AIPipeline } from '@/lib/ai-pipeline';
import { AICoachingRequest } from '@/types/ai-coaching';
import { db } from '@/lib/firebase-admin';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, userId, chatId } = body;

    if (!message || !userId) {
      return NextResponse.json(
        { error: 'Message and userId are required' },
        { status: 400 }
      );
    }

    // Get user profile from Firestore
    const userRef = db.collection('users').doc(userId);
    const userSnap = await userRef.get();
    
    if (!userSnap.exists) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const userData = userSnap.data();
    
    // Ensure we have Epic ID for stats fetching
    if (!userData?.epicId) {
      return NextResponse.json(
        { error: 'Epic account not connected. Please connect your Epic account to get personalized coaching.' },
        { status: 400 }
      );
    }
    
    // Get conversation history if chatId is provided
    let conversationHistory = [];
    if (chatId) {
      const chatRef = db.collection('conversations').doc(chatId);
      const chatSnap = await chatRef.get();
      
      if (chatSnap.exists) {
        const chatData = chatSnap.data();
        conversationHistory = chatData?.messages || [];
      }
    }

    // Prepare AI coaching request
    const coachingRequest: AICoachingRequest = {
      message,
      userProfile: {
        epicId: userData?.epicId,
        displayName: userData?.displayName,
        skillLevel: userData?.skillLevel,
        playstyle: userData?.playstyle
      },
      conversationHistory: conversationHistory.slice(-10) // Last 10 messages for context
    };

    // Process AI coaching request
    const aiResponse = await AIPipeline.processCoachingRequest(userId, coachingRequest);

    // Save conversation to Firestore
    if (chatId) {
      const conversationRef = db.collection('conversations').doc(chatId);
      
      // Add user message
      const userMessage = {
        role: 'user',
        content: message,
        timestamp: new Date()
      };

      // Add AI response
      const assistantMessage = {
        role: 'assistant',
        content: JSON.stringify(aiResponse),
        timestamp: new Date(),
        aiResponse
      };

      // Update conversation
      await conversationRef.update({
        messages: [...conversationHistory, userMessage, assistantMessage],
        lastUpdated: new Date(),
        messageCount: conversationHistory.length + 2
      });
    }

    return NextResponse.json({
      success: true,
      response: aiResponse
    });

  } catch (error) {
    console.error('AI coaching API error:', error);
    
    // Return error response in AI format
    const errorResponse = {
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
      tone: "chill" as const
    };

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      response: errorResponse
    }, { status: 500 });
  }
}
