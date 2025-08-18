import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { message, context, fortniteUsername, epicContext, userStats } = await request.json();

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

    // Use the comprehensive context provided by the client, or fall back to basic context
    let enhancedContext = context || 'You are PathGen AI, a helpful Fortnite improvement coach. Provide specific, actionable advice for Fortnite players. Keep responses concise but helpful.';
    
    // If we have a username but no context, add username to basic context
    if (fortniteUsername && !context) {
      enhancedContext = `You are PathGen AI, a helpful Fortnite improvement coach. The user's Fortnite username is ${fortniteUsername}. Provide specific, actionable advice for Fortnite players. Keep responses concise but helpful.`;
    }
    
    // If we have both context and username, append username info to the existing context
    if (fortniteUsername && context) {
      enhancedContext = `${context}\n\nUser's Fortnite username: ${fortniteUsername}`;
    }

    // Add Epic account context if available
    if (epicContext) {
      enhancedContext = `${enhancedContext}\n\nEpic Account Context: ${epicContext}`;
    }

    // Add user stats availability info
    if (userStats) {
      enhancedContext = `${enhancedContext}\n\nUser Stats: ${userStats}`;
    }

    // Add formatting and conciseness instructions
    enhancedContext += `

RESPONSE FORMATTING RULES:
- Keep responses under 150 words
- Use **bold** for key terms and numbers
- Use bullet points for lists
- Be direct and actionable
- No unnecessary explanations
- Always use specific data from the documentation when available
- Format like this example:

Question: "When does storm surge activate?"
Response: "**Storm Surge** activates at these player counts:

**Zone 2-3:** 90 players
**Zone 4:** 78 players  
**Zone 5:** 63 players
**Zone 6:** 54 players
**Zone 7:** 42 players
**Zone 8:** 39 players
**Zone 9-12:** 30 players

Focus on eliminations early to avoid damage later."`;

    console.log('Calling OpenAI with context length:', enhancedContext.length);
    console.log('Context preview (first 500 chars):', enhancedContext.substring(0, 500));
    console.log('Context contains zone data:', enhancedContext.includes('Double Pull'));
    console.log('Context contains POI data:', enhancedContext.includes('Martial Maneuvers'));
    console.log('Context contains tournament data:', enhancedContext.includes('FNCS'));

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
        max_tokens: 300,
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

    console.log('OpenAI response generated successfully');
    return NextResponse.json({ response: aiResponse });
  } catch (error: any) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate response' },
      { status: 500 }
    );
  }
}
