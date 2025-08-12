import { NextRequest, NextResponse } from 'next/server';
import { fortniteService } from '@/lib/fortnite';

export async function POST(request: NextRequest) {
  try {
    const { message, context, fortniteUsername } = await request.json();

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Check if OpenAI API key is available
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    // Get Fortnite stats and generate personalized context
    let enhancedContext = context || 'You are PathGen AI, a helpful Fortnite improvement coach. Provide specific, actionable advice for Fortnite players. Keep responses concise but helpful.';
    
    if (fortniteUsername) {
      const fortniteStats = await fortniteService.getPlayerStats(fortniteUsername);
      if (fortniteStats) {
        enhancedContext = fortniteService.generateAIContext(fortniteStats);
      }
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: enhancedContext
          },
          {
            role: 'user',
            content: message
          }
        ],
        max_tokens: 500,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenAI API error:', errorData);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0]?.message?.content || 'Sorry, I could not generate a response.';

    return NextResponse.json({ response: aiResponse });
  } catch (error: any) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate response' },
      { status: 500 }
    );
  }
}
