import { 
  OsirionStats, 
  OsirionMatch, 
  OsirionEvent, 
  OsirionReplayUpload, 
  OsirionComputeRequest,
  UsageLimits,
  CurrentUsage
} from '@/types';

export class OsirionService {
  private apiKey: string;
  private baseUrl = 'https://api.osirion.gg/fortnite/v1';

  constructor() {
    this.apiKey = process.env.OSIRION_API_KEY || '';
  }

  async getPlayerStats(epicId: string, platform: string = 'pc'): Promise<OsirionStats | null> {
    try {
      if (!this.apiKey) {
        console.warn('Osirion API key not configured');
        return null;
      }

      console.log('Fetching Osirion stats for Epic ID:', epicId);

      // Get player matches from Osirion using the correct endpoint
      const matchesResponse = await fetch(
        `${this.baseUrl}/matches?epicIds=${epicId}&limit=25&ignoreUploads=false`,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!matchesResponse.ok) {
        const errorText = await matchesResponse.text();
        console.error('Failed to fetch Osirion matches. Status:', matchesResponse.status, 'Error:', errorText);
        return null;
      }

      const matchesData = await matchesResponse.json();
      console.log('Raw Osirion matches data:', matchesData);
      
      if (!matchesData.matches || !Array.isArray(matchesData.matches)) {
        console.warn('No matches found or invalid response structure');
        return null;
      }

      // Transform Osirion data to our format
      const transformedStats = this.transformStatsData(epicId, matchesData.matches);
      console.log('Transformed Osirion stats:', transformedStats);
      
      return transformedStats;
    } catch (error) {
      console.error('Error fetching Osirion stats:', error);
      return null;
    }
  }

  async getMatchHistory(epicId: string, limit: number = 25): Promise<OsirionMatch[]> {
    try {
      if (!this.apiKey) {
        console.warn('Osirion API key not configured');
        return [];
      }

      const response = await fetch(
        `${this.baseUrl}/matches?epicIds=${epicId}&limit=${limit}&ignoreUploads=false`,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        console.error('Failed to fetch match history. Status:', response.status);
        return [];
      }

      const data = await response.json();
      return this.transformMatches(data.matches || []);
    } catch (error) {
      console.error('Error fetching match history:', error);
      return [];
    }
  }

  async getMatchInfo(matchId: string): Promise<any> {
    try {
      if (!this.apiKey) {
        console.warn('Osirion API key not configured');
        return null;
      }

      const response = await fetch(
        `${this.baseUrl}/matches/${matchId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        console.error('Failed to fetch match info. Status:', response.status);
        return null;
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching match info:', error);
      return null;
    }
  }

  async uploadReplay(matchId: string, replayFile: File): Promise<OsirionReplayUpload | null> {
    try {
      if (!this.apiKey) {
        console.warn('Osirion API key not configured');
        return null;
      }

      // Note: The actual replay upload endpoint isn't documented in the provided API docs
      // This is a placeholder implementation
      console.log('Replay upload not yet implemented - endpoint not documented');
      
      return {
        id: `temp-${Date.now()}`,
        matchId: matchId,
        status: 'uploading',
        createdAt: new Date()
      };
    } catch (error) {
      console.error('Error uploading replay:', error);
      return null;
    }
  }

  async requestCompute(computeType: string, data: any): Promise<OsirionComputeRequest | null> {
    try {
      if (!this.apiKey) {
        console.warn('Osirion API key not configured');
        return null;
      }

      // Note: The actual compute endpoint isn't documented in the provided API docs
      // This is a placeholder implementation
      console.log('Compute request not yet implemented - endpoint not documented');
      
      return {
        id: `temp-${Date.now()}`,
        type: computeType as any,
        status: 'pending',
        createdAt: new Date()
      };
    } catch (error) {
      console.error('Error requesting compute:', error);
      return null;
    }
  }

  private transformMatches(matches: any[]): OsirionMatch[] {
    return matches.map(match => {
      const playerStats = match.playerStats?.[0] || {};
      
      return {
        id: match.info?.matchId || match.matchId,
        timestamp: new Date(match.info?.startTimestamp ? match.info.startTimestamp / 1000000 : Date.now()),
        placement: playerStats.placement || 0,
        kills: playerStats.eliminations || 0,
        assists: playerStats.assists || 0,
        damage: playerStats.damageDone || 0,
        survivalTime: match.info?.lengthMs ? match.info.lengthMs / 1000 : 0,
        events: this.transformEvents(match.events || [])
      };
    });
  }

  private transformEvents(events: any[]): OsirionEvent[] {
    return events.map(event => ({
      type: event.type || 'EliminationEvent',
      timestamp: event.timestamp || 0,
      data: event.data || event
    }));
  }

  private transformStatsData(epicId: string, matches: any[]): OsirionStats {
    console.log('Processing', matches.length, 'matches from Osirion');
    
    // Debug: Log first few matches to see their structure
    if (matches.length > 0) {
      console.log('First match structure:', JSON.stringify(matches[0], null, 2));
      console.log('First match gameMode:', matches[0]?.info?.gameMode);
      console.log('First match playerStats:', matches[0]?.playerStats);
    }
    
    // More lenient filtering - accept any match with player stats
    const validMatches = matches.filter(match => {
      const hasPlayerStats = match.playerStats && Array.isArray(match.playerStats) && match.playerStats.length > 0;
      const hasInfo = match.info;
      
      if (!hasPlayerStats) {
        console.log('Match filtered out - no player stats:', match.info?.matchId);
      }
      if (!hasInfo) {
        console.log('Match filtered out - no info:', match);
      }
      
      return hasPlayerStats && hasInfo;
    });
    
    console.log('Valid matches after filtering:', validMatches.length);
    
    const playerStats = validMatches.map(match => {
      const stats = match.playerStats?.[0] || {};
      return {
        matchId: match.info?.matchId,
        placement: stats.placement || 0,
        eliminations: stats.eliminations || 0,
        assists: stats.assists || 0,
        damageDone: stats.damageDone || 0,
        lengthMs: match.info?.lengthMs || 0,
        gameMode: match.info?.gameMode || 'Unknown',
        startTimestamp: match.info?.startTimestamp || 0
      };
    });

    const totalMatches = playerStats.length;
    const wins = playerStats.filter(m => m.placement === 1).length;
    const top10 = playerStats.filter(m => m.placement <= 10).length;
    const totalKills = playerStats.reduce((sum, m) => sum + m.eliminations, 0);
    const totalAssists = playerStats.reduce((sum, m) => sum + m.assists, 0);
    const avgPlacement = totalMatches > 0 ? playerStats.reduce((sum, m) => sum + m.placement, 0) / totalMatches : 0;
    const avgKills = totalMatches > 0 ? totalKills / totalMatches : 0;
    const avgSurvivalTime = totalMatches > 0 ? playerStats.reduce((sum, m) => sum + (m.lengthMs / 1000), 0) / totalMatches : 0;

    // Get the username from the first match's player stats
    const firstMatchUsername = validMatches[0]?.playerStats?.[0]?.epicUsername || 'Unknown';
    
    return {
      accountId: epicId,
      username: firstMatchUsername, // Use real Epic username from API
      platform: 'pc', // Default to PC for now
      matches: this.transformMatches(validMatches),
      summary: {
        totalMatches,
        wins,
        top10,
        kills: totalKills,
        assists: totalAssists,
        avgPlacement,
        avgKills,
        avgSurvivalTime
      }
    };
  }
}

// Subscription tier definitions - Credit-Efficient Tiers
export const SUBSCRIPTION_TIERS = {
  free: {
    id: 'free',
    name: 'Free',
    price: 0,
    currency: 'USD',
    limits: {
      osirion: {
        matchesPerMonth: 6, // 6 uploads × $0.0254 = $0.15 (one-time trial)
        eventTypesPerMatch: 1,
        replayUploadsPerMonth: 0, // No replay uploads for free tier
        computeRequestsPerMonth: 0, // No compute for free tier
        osirionPullsPerMonth: 10 // 10 pulls per month
      },
      ai: {
        messagesPerMonth: 45 // 45 messages × ~$0.00038 = $0.017 (one-time trial)
      }
    },
    features: [
      '6 matches 1 time (one-time access)',
      'Basic elimination events only',
      '45 AI messages 1 time',
      '10 Osirion API pulls per month',
      'Epic account connection',
      'Powered by Osirion'
    ]
  },
  paid: {
    id: 'paid',
    name: 'Standard',
    price: 6.99,
    currency: 'USD',
    limits: {
      osirion: {
        matchesPerMonth: 45, // 45 uploads × $0.0254 = $1.14 (≈1000 credits = ~€2 worth, safe)
        eventTypesPerMatch: 3,
        replayUploadsPerMonth: 5, // 5 × 20 credits = 100 credits ≈ €0.20
        computeRequestsPerMonth: 50, // 50 × 10 credits = 500 credits ≈ €1
        osirionPullsPerMonth: 50 // 50 pulls per month
      },
      ai: {
        messagesPerMonth: 225 // 225 messages × ~$0.00038 = $0.085 (light weight on API)
      }
    },
    features: [
      '45 matches per month',
      '3 event types per match',
      '5 replay uploads per month',
      '50 compute requests per month',
      '225 AI messages per month',
      '50 Osirion API pulls per month',
      'Epic account connection',
      'Powered by Osirion'
    ]
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    price: 24.99,
    currency: 'USD',
    limits: {
      osirion: {
        matchesPerMonth: 225, // 225 uploads × $0.0254 = $5.72 (≈5000 credits = ~€10)
        eventTypesPerMatch: -1, // All types
        replayUploadsPerMonth: 175, // 175 × 20 credits = 3500 credits = ~€7
        computeRequestsPerMonth: 275, // 275 × 10 credits = 2750 credits = ~€5.5
        osirionPullsPerMonth: 500 // 500 pulls per month
      },
      ai: {
        messagesPerMonth: 650 // 650 messages × ~$0.00038 = $0.247
      }
    },
    features: [
      '225 matches per month',
      'All event types',
      '175 replay uploads per month',
      '275 compute requests per month',
      '650 AI messages per month',
      '500 Osirion API pulls per month',
      'Epic account connection',
      'Powered by Osirion'
    ]
  }
};

// Usage tracking service
export class UsageTracker {
  static async checkUsage(userId: string, tier: keyof typeof SUBSCRIPTION_TIERS): Promise<CurrentUsage> {
    // This would typically query a database to get current usage
    // For now, return a mock implementation
    const now = new Date();
    const resetDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    
    return {
      osirion: {
        matchesUsed: 0,
        replayUploadsUsed: 0,
        computeRequestsUsed: 0
      },
      ai: {
        messagesUsed: 0
      },
      resetDate
    };
  }

  static async incrementUsage(userId: string, type: 'matches' | 'replayUploads' | 'computeRequests' | 'aiMessages'): Promise<void> {
    // This would typically increment usage in a database
    console.log(`Incrementing ${type} usage for user ${userId}`);
  }

  static canUseFeature(userId: string, tier: keyof typeof SUBSCRIPTION_TIERS, feature: keyof UsageLimits['osirion'] | 'aiMessages'): boolean {
    const limits = SUBSCRIPTION_TIERS[tier].limits;
    
    if (feature === 'aiMessages') {
      return limits.ai.messagesPerMonth === -1 || true; // Would check actual usage
    }
    
    const osirionLimits = limits.osirion[feature as keyof UsageLimits['osirion']];
    return osirionLimits === -1 || true; // Would check actual usage
  }
}
