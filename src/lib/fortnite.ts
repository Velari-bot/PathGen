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
}

export class FortniteService {
  private apiKey: string;
  private baseUrl = 'https://fortniteapi.io/v1';

  constructor() {
    this.apiKey = process.env.FORTNITE_TRACKER_KEY || '';
  }

  async getPlayerStats(username: string): Promise<FortniteStats | null> {
    try {
      if (!this.apiKey) {
        console.warn('Fortnite API key not configured');
        return null;
      }

      // Get player stats
      const statsResponse = await fetch(
        `${this.baseUrl}/stats/br/v2?name=${encodeURIComponent(username)}`,
        {
          headers: {
            'Authorization': this.apiKey
          }
        }
      );

      if (!statsResponse.ok) {
        console.warn('Failed to fetch Fortnite stats');
        return null;
      }

      const statsData = await statsResponse.json();
      
      // Get recent matches
      const matchesResponse = await fetch(
        `${this.baseUrl}/matches/br?name=${encodeURIComponent(username)}&limit=10`,
        {
          headers: {
            'Authorization': this.apiKey
          }
        }
      );

      let recentMatches: any[] = [];
      if (matchesResponse.ok) {
        const matchesData = await matchesResponse.json();
        recentMatches = matchesData.matches || [];
      }

      // Analyze preferences based on recent matches
      const preferences = this.analyzePreferences(statsData, recentMatches);

      return {
        account: statsData.account,
        stats: statsData.stats,
        recentMatches,
        preferences
      };
    } catch (error) {
      console.error('Error fetching Fortnite data:', error);
      return null;
    }
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

    // Analyze drop locations
    const dropCounts: { [key: string]: number } = {};
    const placementByDrop: { [key: string]: number[] } = {};
    
    matches.forEach(match => {
      if (match.dropLocation) {
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
    const earlyGamePlacements = matches.filter(m => m.placement <= 25).length;
    const lateGamePlacements = matches.filter(m => m.placement > 25).length;
    const weakestZone = earlyGamePlacements > lateGamePlacements ? 'late game rotations' : 'early game fights';

    // Calculate average survival time (rough estimate based on placement)
    const avgSurvivalTime = matches.reduce((sum, match) => {
      // Rough estimate: 100 players, placement determines survival time
      const survivalPercent = (100 - match.placement) / 100;
      return sum + (survivalPercent * 20); // Assume 20 minute average game
    }, 0) / matches.length;

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
