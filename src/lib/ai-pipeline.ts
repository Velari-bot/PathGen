import { AICoachingRequest, AICoachingResponse } from '@/types/ai-coaching';
import { CreditTracker } from '@/lib/ai-credit-tracker';

export class AIPipeline {
  private static readonly OPENAI_API_KEY = process.env.OPENAI_API_KEY;
  private static readonly OSIRION_API_KEY = process.env.OSIRION_API_KEY;

  /**
   * Fetch player stats from Osirion API
   */
  static async fetchOsirionStats(epicId: string): Promise<any> {
    try {
      const response = await fetch(`https://api.osirion.gg/matches?epicId=${epicId}`, {
        headers: {
          'Authorization': `Bearer ${this.OSIRION_API_KEY}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Osirion API error: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching Osirion stats:', error);
      return null;
    }
  }

  /**
   * Format AI prompt with user data and context
   */
  static formatAIPrompt(request: AICoachingRequest): string {
    const { message, userProfile, recentStats, replayData, conversationHistory } = request;

    let prompt = `You are PathGen AI, a Fortnite improvement coach. Analyze the following data and respond in the required JSON format.

User Question: "${message}"

Player Data:`;

    if (userProfile) {
      prompt += `
- Player Profile:
  * Epic ID: ${userProfile.epicId || 'Not provided'}
  * Display Name: ${userProfile.displayName || 'Unknown'}
  * Skill Level: ${userProfile.skillLevel || 'Unknown'}
  * Playstyle: ${userProfile.playstyle || 'Unknown'}`;
    }

    if (recentStats) {
      prompt += `
- Recent Match Stats:
  * K/D Ratio: ${recentStats.kd}
  * Win Rate: ${(recentStats.winRate * 100).toFixed(1)}%
  * Average Placement: ${recentStats.avgPlacement}
  * Accuracy: ${recentStats.accuracy}%
  * Materials Used: ${recentStats.matsUsed}
  * Deaths: ${recentStats.deaths}
  * Matches Played: ${recentStats.matches}`;
    }

    if (replayData) {
      prompt += `
- Replay Data:
  * File: ${replayData.fileName}
  * Uploaded: ${replayData.uploadDate.toISOString()}
  * Analysis: ${replayData.analysisResults ? 'Available' : 'Pending'}`;
    }

    if (conversationHistory && conversationHistory.length > 0) {
      prompt += `
- Recent Conversation Context:`;
      conversationHistory.slice(-5).forEach(msg => {
        prompt += `
  * ${msg.role}: ${msg.content}`;
      });
    }

    prompt += `

Instructions:
- Provide actionable, structured responses that guide the user step-by-step
- Always tie advice to specific gameplay events (stats, replays, trends)
- Never give vague advice — always measurable and actionable
- Keep responses short, punchy, and structured
- Reference uploaded data directly when available
- Encourage habit formation with drills and practice routines

Respond ONLY with JSON in this exact structure:
{
  "quick_fix": "1-sentence insight that's punchy and memorable",
  "detailed_analysis": [
    "Point 1 with specific stat/observation",
    "Point 2 with mistake/opportunity identified",
    "Point 3 with trend/weakness pattern"
  ],
  "action_plan": [
    "Action step 1 - specific and measurable",
    "Action step 2 - drill or habit to form",
    "Action step 3 - practice routine or adjustment"
  ],
  "tone": "motivator"
}`;

    return prompt;
  }

  /**
   * Call OpenAI API with formatted prompt
   */
  static async callOpenAI(prompt: string): Promise<AICoachingResponse> {
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [
            {
              role: 'system',
              content: 'You are PathGen AI, a Fortnite improvement coach. Always respond with valid JSON in the exact format requested.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 1000
        })
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      const aiResponse = data.choices[0]?.message?.content;

      if (!aiResponse) {
        throw new Error('No response from OpenAI');
      }

      // Parse JSON response
      const parsedResponse = JSON.parse(aiResponse) as AICoachingResponse;
      
      // Validate response structure
      if (!parsedResponse.quick_fix || !parsedResponse.detailed_analysis || !parsedResponse.action_plan) {
        throw new Error('Invalid response structure from AI');
      }

      return parsedResponse;
    } catch (error) {
      console.error('Error calling OpenAI:', error);
      throw error;
    }
  }

  /**
   * Process complete AI coaching request
   */
  static async processCoachingRequest(
    userId: string,
    request: AICoachingRequest
  ): Promise<AICoachingResponse> {
    try {
      // Check if user can afford AI chat
      const canAfford = await CreditTracker.canAffordCredits(userId, 'chat');
      if (!canAfford) {
        throw new Error('Insufficient credits for AI chat');
      }

      // Fetch Osirion stats if Epic ID is available
      let osirionStats = null;
      if (request.userProfile?.epicId) {
        osirionStats = await this.fetchOsirionStats(request.userProfile.epicId);
        if (osirionStats) {
          request.recentStats = {
            kd: osirionStats.kd || 0,
            winRate: osirionStats.winRate || 0,
            avgPlacement: osirionStats.avgPlacement || 0,
            accuracy: osirionStats.accuracy || 0,
            matsUsed: osirionStats.matsUsed || 0,
            deaths: osirionStats.deaths || 0,
            matches: osirionStats.matches || 0
          };
        }
      }

      // Format prompt and call AI
      const prompt = this.formatAIPrompt(request);
      const aiResponse = await this.callOpenAI(prompt);

      // Deduct credits after successful AI response
      await CreditTracker.deductCredits(userId, 'chat', {
        message: request.message,
        timestamp: new Date(),
        aiResponse
      });

      return aiResponse;
    } catch (error) {
      console.error('Error processing coaching request:', error);
      throw error;
    }
  }
}
