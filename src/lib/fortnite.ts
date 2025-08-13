export interface FortniteStats {
  account: {
    id: string;
    name: string;
    platform: string;
  };
  stats: {
    all: {
      wins: number;
      top10: number;
      kills: number;
      kd: number;
      matches: number;
      winRate: number;
      avgPlace: number;
      avgKills: number;
    };
    solo?: {
      wins: number;
      top10: number;
      kills: number;
      kd: number;
      matches: number;
      winRate: number;
    };
    duo?: {
      wins: number;
      top10: number;
      kills: number;
      kd: number;
      matches: number;
      winRate: number;
    };
    squad?: {
      wins: number;
      top10: number;
      kills: number;
      kd: number;
      matches: number;
      winRate: number;
    };
  };
  recentMatches: Array<{
    id: string;
    date: string;
    placement: number;
    kills: number;
    mode: string;
    map: string;
    dropLocation?: string;
  }>;
  preferences: {
    preferredDrop: string;
    weakestZone: string;
    bestWeapon: string;
    avgSurvivalTime: number;
  };
  fallback?: {
    manualCheckUrl: string;
    instructions: string[];
    manualStatsForm: {
      kd: number;
      winRate: number;
      matches: number;
      avgPlace: number;
    };
  };
}

export class FortniteService {
  private apiKey: string;
  private baseUrl = 'https://api.fortnitetracker.com/v1';

  constructor() {
    this.apiKey = process.env.FORTNITE_TRACKER_KEY || '';
  }

  async getPlayerStats(username: string): Promise<FortniteStats | null> {
    try {
      if (!this.apiKey) {
        console.warn('Fortnite Tracker API key not configured');
        return null;
      }

      console.log('Fetching stats for username:', username);
      console.log('Using API key:', this.apiKey.substring(0, 8) + '...');

      // Get player stats from Fortnite Tracker
      const statsResponse = await fetch(
        `${this.baseUrl}/profile/pc/${encodeURIComponent(username)}`,
        {
          headers: {
            'TRN-Api-Key': this.apiKey
          }
        }
      );

      console.log('Stats response status:', statsResponse.status);
      console.log('Stats response headers:', Object.fromEntries(statsResponse.headers.entries()));

      if (!statsResponse.ok) {
        const errorText = await statsResponse.text();
        console.error('Failed to fetch Fortnite stats. Status:', statsResponse.status, 'Error:', errorText);
        return null;
      }

      const statsData = await statsResponse.json();
      console.log('Raw stats data:', statsData);
      
      // Get recent matches
      const matchesResponse = await fetch(
        `${this.baseUrl}/profile/pc/${encodeURIComponent(username)}/matches`,
        {
          headers: {
            'TRN-Api-Key': this.apiKey
          }
        }
      );

      let recentMatches: any[] = [];
      if (matchesResponse.ok) {
        const matchesData = await matchesResponse.json();
        console.log('Raw matches data:', matchesData);
        recentMatches = matchesData.matches || [];
      } else {
        console.warn('Failed to fetch matches. Status:', matchesResponse.status);
      }

      // Transform Fortnite Tracker data to our format
      const transformedStats = this.transformTrackerData(statsData, recentMatches);
      console.log('Transformed stats:', transformedStats);
      
      // Analyze preferences based on recent matches
      const preferences = this.analyzePreferences(transformedStats, recentMatches);

      return {
        ...transformedStats,
        recentMatches,
        preferences
      };
    } catch (error) {
      console.error('Error fetching Fortnite data from Fortnite Tracker:', error);
      return null;
    }
  }

  private transformTrackerData(trackerData: any, matches: any[]): any {
    console.log('Transforming tracker data:', trackerData);
    
    // Extract stats from Fortnite Tracker format
    const stats = trackerData.stats || {};
    const allStats = stats.all || {};
    
    // Fortnite Tracker uses a different structure - stats are nested with 'value' properties
    const transformed = {
      account: {
        id: trackerData.accountId || trackerData.account?.id || 'unknown',
        name: trackerData.epicUserHandle || trackerData.account?.epicUserHandle || 'unknown',
        platform: trackerData.platformId || trackerData.account?.platformId || 'pc'
      },
      stats: {
        all: {
          wins: this.extractStatValue(allStats.wins) || 0,
          top10: this.extractStatValue(allStats.top10) || 0,
          kills: this.extractStatValue(allStats.kills) || 0,
          kd: this.extractStatValue(allStats.kd) || 0,
          matches: this.extractStatValue(allStats.matches) || 0,
          winRate: this.extractStatValue(allStats.winRate) || 0,
          avgPlace: this.extractStatValue(allStats.avgPlace) || 0,
          avgKills: this.extractStatValue(allStats.avgKills) || 0
        }
      }
    };
    
    console.log('Transformed result:', transformed);
    return transformed;
  }

  private extractStatValue(stat: any): number | null {
    if (!stat) return null;
    
    // Fortnite Tracker stats can be in different formats
    if (typeof stat === 'number') return stat;
    if (typeof stat === 'string') return parseFloat(stat);
    if (stat.value !== undefined) return parseFloat(stat.value);
    if (stat.displayValue !== undefined) return parseFloat(stat.displayValue);
    
    return null;
  }

  private analyzePreferences(stats: any, matches: any[]): any {
    if (!matches.length) {
      return {
        preferredDrop: 'Unknown',
        weakestZone: 'Unknown',
        bestWeapon: 'Unknown',
        avgSurvivalTime: 0
      };
    }

    // Transform matches to our format
    const transformedMatches = matches.map(match => ({
      id: match.id || match.matchId || String(Math.random()),
      date: match.date || match.timestamp || new Date().toISOString(),
      placement: match.placement || match.rank || 100,
      kills: match.kills || 0,
      mode: match.mode || match.playlist || 'Unknown',
      map: match.map || 'Unknown',
      dropLocation: match.dropLocation || 'Unknown'
    }));

    // Analyze drop locations
    const dropCounts: { [key: string]: number } = {};
    const placementByDrop: { [key: string]: number[] } = {};
    
    transformedMatches.forEach(match => {
      if (match.dropLocation && match.dropLocation !== 'Unknown') {
        dropCounts[match.dropLocation] = (dropCounts[match.dropLocation] || 0) + 1;
        if (!placementByDrop[match.dropLocation]) {
          placementByDrop[match.dropLocation] = [];
        }
        placementByDrop[match.dropLocation].push(match.placement);
      }
    });

    // Find preferred drop (most frequent with best avg placement)
    let preferredDrop = 'Unknown';
    let bestAvgPlacement = Infinity;
    
    Object.entries(placementByDrop).forEach(([location, placements]) => {
      const avgPlacement = placements.reduce((a, b) => a + b, 0) / placements.length;
      if (avgPlacement < bestAvgPlacement) {
        bestAvgPlacement = avgPlacement;
        preferredDrop = location;
      }
    });

    // Analyze weakest zone (late game vs early game)
    const earlyGamePlacements = transformedMatches.filter(m => m.placement <= 25).length;
    const lateGamePlacements = transformedMatches.filter(m => m.placement > 25).length;
    const weakestZone = earlyGamePlacements > lateGamePlacements ? 'late game rotations' : 'early game fights';

    // Calculate average survival time (rough estimate based on placement)
    const avgSurvivalTime = transformedMatches.reduce((sum, match) => {
      // Rough estimate: 100 players, placement determines survival time
      const survivalPercent = (100 - match.placement) / 100;
      return sum + (survivalPercent * 20); // Assume 20 minute average game
    }, 0) / transformedMatches.length;

    return {
      preferredDrop: preferredDrop || 'Unknown',
      weakestZone,
      bestWeapon: 'Unknown', // Would need weapon data from matches
      avgSurvivalTime: Math.round(avgSurvivalTime)
    };
  }

  generateAIContext(stats: FortniteStats): string {
    const { stats: playerStats, preferences } = stats;
    const all = playerStats.all;

    return `You are PathGen AI, a Fortnite strategy assistant. The user's current stats are:
- KD = ${all.kd.toFixed(1)}
- Win Rate = ${all.winRate.toFixed(1)}%
- Matches Played = ${all.matches}
- Average Placement = ${all.avgPlace.toFixed(1)}
- Preferred Drop = ${preferences.preferredDrop}
- Weakest Zone = ${preferences.weakestZone}
- Average Survival Time = ${preferences.avgSurvivalTime} minutes

Use this information in all responses to tailor your advice specifically to this player's performance patterns and areas for improvement.`;
  }
}

export const fortniteService = new FortniteService();
