import { NextRequest, NextResponse } from 'next/server';
import { getModelRecommendation, modelUsageTracker, MODEL_CONFIGS } from '@/lib/ai-model-selector';
import { trackUsage } from '@/lib/usage-tracker';

// This would be replaced with actual AI service calls
interface AIServiceResponse {
  response: string;
  tokensUsed: {
    input: number;
    output: number;
  };
  model: string;
}

// Mock AI service - replace with actual implementation
async function callAIService(model: string, prompt: string, context?: any): Promise<AIServiceResponse> {
  // This is where you'd integrate with OpenAI, Anthropic, etc.
  // For now, return a mock response
  
  const responses = {
    '4o-mini': {
      response: `Quick response using ${model}: ${prompt.slice(0, 50)}...`,
      tokensUsed: { input: Math.floor(prompt.length / 4), output: 50 },
      model
    },
    '4-turbo-mini': {
      response: `Detailed analysis using ${model}: ${prompt}. Here's a comprehensive breakdown...`,
      tokensUsed: { input: Math.floor(prompt.length / 4), output: 200 },
      model
    },
    '5-mini': {
      response: `Advanced strategic analysis using ${model}: ${prompt}. Let me provide deep insights and predictive guidance...`,
      tokensUsed: { input: Math.floor(prompt.length / 4), output: 500 },
      model
    }
  };
  
  // Simulate API delay based on model
  const delays = { '4o-mini': 100, '4-turbo-mini': 300, '5-mini': 800 };
  await new Promise(resolve => setTimeout(resolve, delays[model as keyof typeof delays] || 200));
  
  return responses[model as keyof typeof responses] || responses['4o-mini'];
}

export async function POST(request: NextRequest) {
  try {
    const { 
      message, 
      conversationHistory = [], 
      userId, 
      userTier = 'free',
      gameData,
      forceModel 
    } = await request.json();

    if (!message || !userId) {
      return NextResponse.json({ 
        error: 'Missing required fields: message and userId' 
      }, { status: 400 });
    }

    console.log(`🤖 Smart AI Chat - User: ${userId} | Tier: ${userTier} | Message: "${message.slice(0, 50)}..."`);

    // Get model recommendation
    const recommendation = getModelRecommendation(
      message,
      conversationHistory,
      {
        messageCount: conversationHistory.length,
        hasGameData: !!gameData,
        userTier: userTier as 'free' | 'pro'
      }
    );

    // Allow manual model override (useful for testing/debugging)
    const selectedModel = forceModel || recommendation.model;
    const modelConfig = MODEL_CONFIGS[selectedModel];

    console.log(`🎯 Model Selection: ${selectedModel}`);
    console.log(`📊 Reasoning: ${recommendation.reasoning}`);
    console.log(`💰 Estimated Cost: $${recommendation.estimatedCost.toFixed(6)}`);

    // Check Pro limits for expensive models
    if (userTier === 'free' && selectedModel === '5-mini') {
      return NextResponse.json({
        error: 'Advanced AI model requires Pro subscription',
        suggestedUpgrade: true,
        alternativeModel: '4-turbo-mini'
      }, { status: 403 });
    }

    // Prepare context for AI
    const aiContext = {
      userTier,
      gameData,
      conversationHistory: conversationHistory.slice(-5), // Last 5 messages
      requestType: recommendation.analysis.requestType,
      complexity: recommendation.analysis.complexity
    };

    // Build enhanced prompt based on model capabilities
    let enhancedPrompt = message;
    
    if (selectedModel !== '4o-mini') {
      enhancedPrompt = `Context: PathGen AI Assistant for Fortnite coaching
User Tier: ${userTier}
Request Type: ${recommendation.analysis.requestType}
Complexity: ${recommendation.analysis.complexity}

${gameData ? `Game Data Available: ${JSON.stringify(gameData, null, 2)}` : 'No game data provided'}

User Message: ${message}

${selectedModel === '5-mini' ? 'Provide advanced strategic analysis with predictions and personalized recommendations.' : 
  selectedModel === '4-turbo-mini' ? 'Provide detailed analysis and multi-step guidance.' : 
  'Provide a helpful and concise response.'}`;
    }

    // Call AI service
    const startTime = Date.now();
    const aiResponse = await callAIService(selectedModel, enhancedPrompt, aiContext);
    const responseTime = Date.now() - startTime;

    // Calculate actual cost
    const actualCost = (aiResponse.tokensUsed.input + aiResponse.tokensUsed.output) * modelConfig.costPerToken;

    // Track usage
    modelUsageTracker.track({
      model: selectedModel,
      requestType: recommendation.analysis.requestType,
      complexity: recommendation.analysis.complexity,
      cost: actualCost,
      timestamp: new Date(),
      userId,
      userTier: userTier as 'free' | 'pro'
    });

    // Track in existing usage system
    await trackUsage({
      userId,
      feature: 'ai_chat',
      tokensUsed: aiResponse.tokensUsed.input + aiResponse.tokensUsed.output,
      creditsUsed: 1, // Standard credit cost
      subscriptionTier: userTier as 'free' | 'pro',
      metadata: {
        model: selectedModel,
        complexity: recommendation.analysis.complexity,
        cost: actualCost,
        responseTime
      }
    });

    return NextResponse.json({
      response: aiResponse.response,
      model: selectedModel,
      analysis: recommendation.analysis,
      performance: {
        responseTime,
        tokensUsed: aiResponse.tokensUsed,
        estimatedCost: recommendation.estimatedCost,
        actualCost,
        modelCapabilities: modelConfig.capabilities
      },
      reasoning: recommendation.reasoning,
      suggestions: {
        efficiency: actualCost < 0.001 ? 'Very cost-efficient' : 
                   actualCost < 0.01 ? 'Cost-efficient' : 'Premium response',
        modelUsed: `${selectedModel} (${modelConfig.responseSpeed} response)`
      }
    });

  } catch (error) {
    console.error('❌ Smart AI Chat error:', error);
    return NextResponse.json({ 
      error: 'Failed to process AI request',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// GET endpoint for model statistics
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }

    const dailyStats = modelUsageTracker.getDailyStats(userId);
    
    return NextResponse.json({
      dailyStats,
      modelConfigs: MODEL_CONFIGS,
      recommendations: {
        message: dailyStats.totalCost > 0.10 ? 
          'Consider upgrading to Pro for unlimited advanced AI access' :
          'Your AI usage is very cost-efficient today!'
      }
    });

  } catch (error) {
    console.error('❌ Stats error:', error);
    return NextResponse.json({ error: 'Failed to get stats' }, { status: 500 });
  }
}
