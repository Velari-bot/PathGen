import { NextRequest, NextResponse } from 'next/server';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

export async function POST(request: NextRequest) {
  try {
    const { conversation, userId } = await request.json();

    if (!conversation || !userId) {
      return NextResponse.json(
        { error: 'Missing conversation data or userId' },
        { status: 400 }
      );
    }

    // Initialize Firebase Admin if not already initialized
    if (getApps().length === 0) {
      if (process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
        try {
          initializeApp({
            credential: cert({
              projectId: process.env.FIREBASE_PROJECT_ID || 'pathgen-a771b',
              clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
              privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
            }),
          });
        } catch (error: any) {
          if (error.code !== 'app/duplicate-app') {
            console.error('❌ Firebase Admin initialization error:', error);
            return NextResponse.json({
              success: false,
              error: 'Firebase initialization failed',
              details: error.message
            }, { status: 500 });
          }
        }
      } else {
        console.error('❌ Firebase Admin credentials not configured');
        return NextResponse.json({
          success: false,
          error: 'Firebase Admin credentials not configured',
          details: 'Missing FIREBASE_CLIENT_EMAIL or FIREBASE_PRIVATE_KEY'
        }, { status: 500 });
      }
    }

    const db = getFirestore();
    
    // Get user's actual subscription tier from database
    let userTier: 'free' | 'paid' | 'pro' = 'free';
    try {
      const userRef = db.collection('users').doc(userId);
      const userDoc = await userRef.get();
      if (userDoc.exists) {
        const userData = userDoc.data();
        const subscriptionTier = userData?.subscriptionTier || 'free';
        // Map subscription tier names to match UsageTracker expectations
        userTier = subscriptionTier === 'standard' ? 'paid' : subscriptionTier;
      }
    } catch (error) {
      console.warn('Could not get user subscription tier, defaulting to free:', error);
    }
    
    // For now, skip usage checking in API route to simplify
    // TODO: Implement server-side usage tracking
    
    // Save conversation to Firebase using Admin SDK
    try {
      const conversationRef = db.collection('conversations').doc(conversation.id);
      await conversationRef.set({
        ...conversation,
        createdAt: new Date(),
        updatedAt: new Date(),
        userId: userId,
        status: 'active'
      });
      console.log('✅ Conversation saved to Firebase');
    } catch (error) {
      console.error('❌ Error saving conversation to Firebase:', error);
      return NextResponse.json({
        success: false,
        error: 'Failed to save conversation',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, { status: 500 });
    }

    // Create welcome message from AI
    const welcomeMessage = {
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
      type: 'text',
      role: 'assistant',
      timestamp: new Date(),
      aiResponse: {
        model: 'gpt-4',
        confidence: 0.95,
        suggestions: ['Focus on building fundamentals', 'Practice aim training', 'Study high-level gameplay'],
        relatedTopics: ['building', 'aim', 'positioning', 'game-sense'],
        followUpQuestions: ['What\'s your biggest struggle in Fortnite?', 'Which mode do you play most?', 'What\'s your goal for improvement?'],
        tokensUsed: 150
      }
    };

    // Save welcome message to Firebase using Admin SDK
    try {
      const messagesRef = db.collection('conversations').doc(conversation.id).collection('messages');
      await messagesRef.add(welcomeMessage);
      console.log('✅ Welcome message saved to Firebase');
    } catch (error) {
      console.error('❌ Error saving welcome message to Firebase:', error);
      // Don't fail the entire request if message save fails
    }

    return NextResponse.json({
      success: true,
      conversation: conversation,
      welcomeMessage: welcomeMessage,
      message: 'Conversation created successfully'
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
