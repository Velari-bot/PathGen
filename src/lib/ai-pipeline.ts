import { AICoachingRequest, AICoachingResponse } from '@/types/ai-coaching';
import { CreditTracker } from '@/lib/ai-credit-tracker';
import { OsirionService } from '@/lib/osirion';
import { MatchAnalysisService } from '@/lib/match-analysis-service';
import { AggregatedMatchData } from '@/types/match-analysis';

export class AIPipeline {
  private static readonly OPENAI_API_KEY = process.env.OPENAI_API_KEY;
  private static readonly OSIRION_API_KEY = process.env.OSIRION_API_KEY;

  /**
   * Fetch comprehensive player stats from Osirion API
   */
  static async fetchOsirionStats(epicId: string): Promise<any> {
    try {
      const osirionService = new OsirionService();
      const stats = await osirionService.getPlayerStats(epicId);
      
      if (!stats) {
        console.warn('No stats returned from Osirion for Epic ID:', epicId);
        return null;
      }

      // Extract comprehensive stats for AI analysis
      const comprehensiveStats = {
        // Basic stats
        username: stats.username,
        totalMatches: stats.summary.totalMatches,
        wins: stats.summary.wins,
        winRate: stats.summary.totalMatches > 0 ? (stats.summary.wins / stats.summary.totalMatches) * 100 : 0,
        avgPlacement: stats.summary.avgPlacement,
        avgKills: stats.summary.avgKills,
        avgSurvivalTime: stats.summary.avgSurvivalTime,
        
        // Calculated metrics
        kd: stats.summary.totalMatches > 0 ? stats.summary.kills / Math.max(1, stats.summary.totalMatches - stats.summary.wins) : 0,
        top10Rate: stats.summary.totalMatches > 0 ? (stats.summary.top10 / stats.summary.totalMatches) * 100 : 0,
        
        // Recent performance (last 10 matches)
        recentMatches: stats.matches.slice(0, 10).map(match => ({
          placement: match.placement,
          kills: match.kills,
          damage: match.damage,
          survivalTime: match.survivalTime,
          timestamp: match.timestamp
        })),
        
        // Performance trends
        recentWinRate: stats.matches.slice(0, 10).filter(m => m.placement === 1).length / Math.min(10, stats.matches.length) * 100,
        recentAvgPlacement: stats.matches.slice(0, 10).reduce((sum, m) => sum + m.placement, 0) / Math.min(10, stats.matches.length),
        recentAvgKills: stats.matches.slice(0, 10).reduce((sum, m) => sum + m.kills, 0) / Math.min(10, stats.matches.length),
        
        // Consistency metrics
        placementConsistency: this.calculateConsistency(stats.matches.map(m => m.placement)),
        killConsistency: this.calculateConsistency(stats.matches.map(m => m.kills)),
        
        // Performance patterns
        bestPlacement: Math.min(...stats.matches.map(m => m.placement)),
        worstPlacement: Math.max(...stats.matches.map(m => m.placement)),
        highestKills: Math.max(...stats.matches.map(m => m.kills)),
        avgDamage: stats.matches.reduce((sum, m) => sum + m.damage, 0) / stats.matches.length,
        
        // Time-based analysis
        avgSurvivalMinutes: stats.summary.avgSurvivalTime / 60,
        longestSurvival: Math.max(...stats.matches.map(m => m.survivalTime)) / 60,
        shortestSurvival: Math.min(...stats.matches.map(m => m.survivalTime)) / 60
      };

      console.log('Comprehensive Osirion stats for AI:', comprehensiveStats);
      return comprehensiveStats;
    } catch (error) {
      console.error('Error fetching comprehensive Osirion stats:', error);
      return null;
    }
  }

  /**
   * Calculate consistency score (lower is more consistent)
   */
  private static calculateConsistency(values: number[]): number {
    if (values.length === 0) return 0;
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    return Math.sqrt(variance);
  }

  /**
   * Format AI prompt with comprehensive user data and context
   */
  static formatAIPrompt(request: AICoachingRequest): string {
    const { message, userProfile, fortniteStats, recentStats, replayData, conversationHistory } = request;

    let prompt = `You are PathGen AI, a Fortnite improvement coach. Analyze the following data and respond in the required JSON format.

User Question: "${message}"

Player Data:`;

    if (userProfile) {
      prompt += `
- Player Profile:
  * Epic ID: ${userProfile.epicId || 'Not provided'}
  * Display Name: ${userProfile.displayName || 'Unknown'}
  * Skill Level: ${userProfile.skillLevel || 'Unknown'}
  * Playstyle: ${userProfile.playstyle || 'Unknown'}
  * Subscription Tier: ${userProfile.subscriptionTier || 'free'}`;

      // Include gaming preferences if available
      if (userProfile.gamingPreferences) {
        prompt += `
  * Gaming Preferences:
    - Favorite Game: ${userProfile.gamingPreferences.favoriteGame || 'Unknown'}
    - Goals: ${Array.isArray(userProfile.gamingPreferences.goals) ? userProfile.gamingPreferences.goals.join(', ') : 'Not specified'}
    - Time Zone: ${userProfile.gamingPreferences.timeZone || 'Unknown'}`;
      }

      // Include usage data if available
      if (userProfile.usage) {
        prompt += `
  * Usage Statistics:
    - AI Messages Used: ${userProfile.usage.aiMessages || 0}
    - Osirion Pulls Used: ${userProfile.usage.osirionPulls || 0}
    - Tournament Strategies Used: ${userProfile.usage.tournamentStrategies || 0}
    - Total Sessions: ${userProfile.usage.totalSessions || 0}`;
      }
    }

    // Include comprehensive Fortnite stats if available
    if (fortniteStats) {
      prompt += `
- Comprehensive Fortnite Statistics (from users collection):
  * Epic Name: ${fortniteStats.epicName || 'Unknown'}
  * Platform: ${fortniteStats.platform || 'Unknown'}
  * Last Updated: ${fortniteStats.lastUpdated?.toLocaleDateString() || 'Unknown'}
  
  * Overall Performance:
    - K/D Ratio: ${fortniteStats.overall.kd?.toFixed(2) || 'N/A'}
    - Win Rate: ${(fortniteStats.overall.winRate * 100)?.toFixed(1) || 'N/A'}%
    - Total Matches: ${fortniteStats.overall.matches || 0}
    - Average Placement: ${fortniteStats.overall.avgPlace?.toFixed(1) || 'N/A'}
    - Total Wins: ${fortniteStats.overall.top1 || 0}
    - Top 3 Finishes: ${fortniteStats.overall.top3 || 0}
    - Top 5 Finishes: ${fortniteStats.overall.top5 || 0}
    - Top 10 Finishes: ${fortniteStats.overall.top10 || 0}
    - Top 25 Finishes: ${fortniteStats.overall.top25 || 0}
    - Total Kills: ${fortniteStats.overall.kills || 0}
    - Total Deaths: ${fortniteStats.overall.deaths || 0}
    - Total Assists: ${fortniteStats.overall.assists || 0}
    - Damage Dealt: ${fortniteStats.overall.damageDealt || 0}
    - Damage Taken: ${fortniteStats.overall.damageTaken || 0}
    - Time Alive: ${fortniteStats.overall.timeAlive || 0} minutes
    - Distance Traveled: ${fortniteStats.overall.distanceTraveled || 0}
    - Materials Gathered: ${fortniteStats.overall.materialsGathered || 0}
    - Structures Built: ${fortniteStats.overall.structuresBuilt || 0}`;

      // Include mode-specific stats if available
      if (fortniteStats.solo) {
        prompt += `
  * Solo Performance:
    - K/D: ${fortniteStats.solo.kd?.toFixed(2) || 'N/A'}
    - Win Rate: ${(fortniteStats.solo.winRate * 100)?.toFixed(1) || 'N/A'}%
    - Matches: ${fortniteStats.solo.matches || 0}
    - Avg Placement: ${fortniteStats.solo.avgPlace?.toFixed(1) || 'N/A'}`;
      }

      if (fortniteStats.duo) {
        prompt += `
  * Duo Performance:
    - K/D: ${fortniteStats.duo.kd?.toFixed(2) || 'N/A'}
    - Win Rate: ${(fortniteStats.duo.winRate * 100)?.toFixed(1) || 'N/A'}%
    - Matches: ${fortniteStats.duo.matches || 0}
    - Avg Placement: ${fortniteStats.duo.avgPlace?.toFixed(1) || 'N/A'}`;
      }

      if (fortniteStats.squad) {
        prompt += `
  * Squad Performance:
    - K/D: ${fortniteStats.squad.kd?.toFixed(2) || 'N/A'}
    - Win Rate: ${(fortniteStats.squad.winRate * 100)?.toFixed(1) || 'N/A'}%
    - Matches: ${fortniteStats.squad.matches || 0}
    - Avg Placement: ${fortniteStats.squad.avgPlace?.toFixed(1) || 'N/A'}`;
      }

      // Include raw Osirion data if available
      if (fortniteStats.rawOsirionData) {
        prompt += `
  * Raw Osirion Data Available: Yes
    - Recent Matches: ${fortniteStats.rawOsirionData.matches?.length || 0} matches
    - Preferences: ${fortniteStats.rawOsirionData.preferences ? 'Available' : 'Not available'}`;
      }
    }

    if (recentStats) {
      prompt += `
- Comprehensive Match Statistics:
  * Username: ${(recentStats as any).username || 'Unknown'}
  * Total Matches: ${(recentStats as any).totalMatches || recentStats.matches || 0}
  * Win Rate: ${(recentStats as any).winRate?.toFixed(1) || (recentStats.winRate * 100).toFixed(1)}%
  * Average Placement: ${(recentStats as any).avgPlacement?.toFixed(1) || recentStats.avgPlacement?.toFixed(1) || 'N/A'}
  * Average Kills: ${(recentStats as any).avgKills?.toFixed(1) || 'N/A'}
  * K/D Ratio: ${(recentStats as any).kd?.toFixed(2) || recentStats.kd?.toFixed(2) || 'N/A'}
  * Top 10 Rate: ${(recentStats as any).top10Rate?.toFixed(1) || 'N/A'}%
  * Average Survival Time: ${(recentStats as any).avgSurvivalMinutes?.toFixed(1) || 'N/A'} minutes
  
- Recent Performance (Last 10 Matches):
  * Recent Win Rate: ${(recentStats as any).recentWinRate?.toFixed(1) || 'N/A'}%
  * Recent Avg Placement: ${(recentStats as any).recentAvgPlacement?.toFixed(1) || 'N/A'}
  * Recent Avg Kills: ${(recentStats as any).recentAvgKills?.toFixed(1) || 'N/A'}
  
- Performance Consistency:
  * Placement Consistency: ${(recentStats as any).placementConsistency?.toFixed(1) || 'N/A'} (lower = more consistent)
  * Kill Consistency: ${(recentStats as any).killConsistency?.toFixed(1) || 'N/A'} (lower = more consistent)
  
- Performance Range:
  * Best Placement: ${(recentStats as any).bestPlacement || 'N/A'}
  * Worst Placement: ${(recentStats as any).worstPlacement || 'N/A'}
  * Highest Kills: ${(recentStats as any).highestKills || 'N/A'}
  * Average Damage: ${(recentStats as any).avgDamage?.toFixed(0) || 'N/A'}
  * Longest Survival: ${(recentStats as any).longestSurvival?.toFixed(1) || 'N/A'} minutes
  * Shortest Survival: ${(recentStats as any).shortestSurvival?.toFixed(1) || 'N/A'} minutes

- Recent Match Details:`;
      
      if ((recentStats as any).recentMatches) {
        (recentStats as any).recentMatches.forEach((match: any, index: number) => {
          prompt += `
  * Match ${index + 1}: Placement ${match.placement}, ${match.kills} kills, ${match.damage} damage, ${(match.survivalTime / 60).toFixed(1)} min`;
        });
      }
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
- Use the specific stats provided to give personalized advice
- Identify patterns in their performance data
- Suggest improvements based on their actual gameplay metrics

Respond ONLY with JSON in this exact structure:
{
  "quick_fix": "1-sentence insight that's punchy and memorable, referencing their specific stats",
  "detailed_analysis": [
    "Point 1 with specific stat/observation from their data",
    "Point 2 with mistake/opportunity identified using their metrics",
    "Point 3 with trend/weakness pattern from their performance"
  ],
  "action_plan": [
    "Action step 1 - specific and measurable based on their stats",
    "Action step 2 - drill or habit to form addressing their weaknesses",
    "Action step 3 - practice routine or adjustment for their skill level"
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
   * Format structured AI prompt with match analysis data
   */
  static formatStructuredAIPrompt(request: AICoachingRequest, aggregatedData: AggregatedMatchData | null): string {
    const { message, userProfile, fortniteStats, recentStats, conversationHistory } = request;

    let prompt = `You are PathGen AI, a professional Fortnite coach that gives players personalized insights based on their gameplay data.

User Question: "${message}"

Player Profile:`;

    if (userProfile) {
      prompt += `
- Epic ID: ${userProfile.epicId || 'Not provided'}
- Display Name: ${userProfile.displayName || 'Unknown'}
- Skill Level: ${userProfile.skillLevel || 'Unknown'}
- Playstyle: ${userProfile.playstyle || 'Unknown'}
- Subscription Tier: ${userProfile.subscriptionTier || 'free'}`;
    }

    // Include structured match analysis if available
    if (aggregatedData) {
      prompt += `

📊 STRUCTURED MATCH ANALYSIS (Last ${aggregatedData.gamesAnalyzed} Games):

Performance Trends:
- Average Survival Time: ${aggregatedData.avgSurvivalTime.toFixed(1)} minutes (${aggregatedData.survivalTimeChange > 0 ? '+' : ''}${aggregatedData.survivalTimeChange.toFixed(1)}% vs previous)
- Average Placement: ${aggregatedData.avgPlacement.toFixed(1)}
- Average Kills: ${aggregatedData.avgKills.toFixed(1)}
- Average Damage Dealt: ${aggregatedData.avgDamageDealt.toFixed(0)}
- Average Damage Taken: ${aggregatedData.avgDamageTaken.toFixed(0)}

Accuracy Trends:
- Current Accuracy: ${aggregatedData.accuracy.current.toFixed(1)}%
- Previous Accuracy: ${aggregatedData.accuracy.previous.toFixed(1)}%
- Change: ${aggregatedData.accuracyChange > 0 ? '+' : ''}${aggregatedData.accuracyChange.toFixed(1)}%

Materials Usage:
- Current Mats per Fight: ${aggregatedData.matsUsedPerFight.current.toFixed(0)}
- Previous Mats per Fight: ${aggregatedData.matsUsedPerFight.previous.toFixed(0)}
- Change: ${aggregatedData.matsEfficiencyChange > 0 ? '+' : ''}${aggregatedData.matsEfficiencyChange.toFixed(1)}%

Strategic Patterns:
- Most Common POIs: ${aggregatedData.mostCommonPOIs.join(', ')}
- Rotation Trend: ${aggregatedData.rotationTrend}
- Most Common Death Cause: ${aggregatedData.mostCommonDeathCause}`;
    }

    // Include comprehensive Fortnite stats if available
    if (fortniteStats) {
      prompt += `

📈 COMPREHENSIVE FORTNITE STATISTICS:
- Epic Name: ${fortniteStats.epicName || 'Unknown'}
- Platform: ${fortniteStats.platform || 'Unknown'}
- Last Updated: ${fortniteStats.lastUpdated?.toLocaleDateString() || 'Unknown'}

Overall Performance:
- K/D Ratio: ${fortniteStats.overall.kd?.toFixed(2) || 'N/A'}
- Win Rate: ${(fortniteStats.overall.winRate * 100)?.toFixed(1) || 'N/A'}%
- Total Matches: ${fortniteStats.overall.matches || 0}
- Average Placement: ${fortniteStats.overall.avgPlace?.toFixed(1) || 'N/A'}
- Total Wins: ${fortniteStats.overall.top1 || 0}
- Top 10 Finishes: ${fortniteStats.overall.top10 || 0}
- Total Kills: ${fortniteStats.overall.kills || 0}
- Total Deaths: ${fortniteStats.overall.deaths || 0}
- Materials Gathered: ${fortniteStats.overall.materialsGathered || 0}
- Structures Built: ${fortniteStats.overall.structuresBuilt || 0}`;
    }

    // Fallback to recentStats if structured data not available
    if (recentStats && !aggregatedData) {
      prompt += `

📊 BASIC MATCH STATISTICS:
- K/D Ratio: ${recentStats.kd?.toFixed(2) || 'N/A'}
- Win Rate: ${recentStats.winRate?.toFixed(1) || 'N/A'}%
- Average Placement: ${recentStats.avgPlacement?.toFixed(1) || 'N/A'}
- Accuracy: ${recentStats.accuracy?.toFixed(1) || 'N/A'}%
- Materials Used: ${recentStats.matsUsed?.toFixed(0) || 'N/A'}
- Total Matches: ${recentStats.matches || 0}`;
    }

    if (conversationHistory && conversationHistory.length > 0) {
      prompt += `

Recent Conversation Context:`;
      conversationHistory.slice(-3).forEach(msg => {
        prompt += `
- ${msg.role}: ${msg.content}`;
      });
    }

    prompt += `

🎯 COACHING INSTRUCTIONS:
You are a professional esports coach. Always follow this structure:

1. **Direct Observation** – Call out what happened in the player's recent games with specifics (POIs, rotations, survival time, mats, accuracy).

2. **Comparison/Trend** – Compare current performance to their own past averages or highlight changes over the last X games.

3. **Actionable Advice** – Give clear, practical coaching tips they can apply in the next matches. Mention zone rotations, mats usage, aim drills, or positioning.

4. **Encouragement/Next Step** – End with positive reinforcement and a suggested focus for improvement.

Tone: Speak like an esports coach — concise, confident, tactical. Never give vague or generic advice. Never sound like a wiki or tutorial.

Example style: "In your last 5 games, you rotated through Mega City late and lost height to two stacked teams. Try rotating earlier (2nd zone) toward Slappy Shores where mats are more consistent. Also, your builds per fight dropped 12% compared to your average — which means you're burning mats too fast midgame."

Respond ONLY with JSON in this exact structure:
{
  "quick_fix": "1-sentence insight that's punchy and memorable, referencing their specific stats",
  "detailed_analysis": [
    "Point 1 with specific stat/observation from their data",
    "Point 2 with mistake/opportunity identified using their metrics", 
    "Point 3 with trend/weakness pattern from their performance"
  ],
  "action_plan": [
    "Action step 1 - specific and measurable based on their stats",
    "Action step 2 - tactical improvement they can implement",
    "Action step 3 - practice routine or drill to work on"
  ],
  "tone": "tactical"
}`;

    return prompt;
  }

  /**
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

      let aggregatedMatchData: AggregatedMatchData | null = null;

      // Use Fortnite stats from the unified users collection if available
      if (request.fortniteStats) {
        console.log('📊 Using Fortnite stats from users collection for structured analysis');
        
        // Process raw Osirion data into structured match data
        const matchData = MatchAnalysisService.processMatchData(
          request.fortniteStats.rawOsirionData || request.fortniteStats,
          userId
        );
        
        if (matchData.length > 0) {
          // Aggregate the match data for trend analysis
          aggregatedMatchData = MatchAnalysisService.aggregateMatchData(matchData);
          console.log('📈 Generated aggregated match data:', aggregatedMatchData);
          
          // Convert to format expected by AI
          request.recentStats = {
            kd: request.fortniteStats.overall.kd,
            winRate: request.fortniteStats.overall.winRate * 100,
            avgPlacement: request.fortniteStats.overall.avgPlace,
            accuracy: aggregatedMatchData.accuracy.current,
            matsUsed: aggregatedMatchData.matsUsedPerFight.current,
            deaths: request.fortniteStats.overall.deaths,
            matches: request.fortniteStats.overall.matches
          };
        }
      } else if (request.userProfile?.epicId) {
        // Fallback: Fetch from Osirion API if stats not in users collection
        console.log('📊 Fortnite stats not found in users collection, fetching from Osirion API');
        const osirionStats = await this.fetchOsirionStats(request.userProfile.epicId);
        if (osirionStats) {
          request.recentStats = osirionStats;
        }
      }

      // Format prompt with structured match analysis
      const prompt = this.formatStructuredAIPrompt(request, aggregatedMatchData);
      const aiResponse = await this.callOpenAI(prompt);

      // Enhance response with structured insights if available
      if (aggregatedMatchData) {
        const insights = MatchAnalysisService.generateCoachingInsights(aggregatedMatchData);
        aiResponse.insights = insights;
        aiResponse.matchData = aggregatedMatchData;
      }

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
