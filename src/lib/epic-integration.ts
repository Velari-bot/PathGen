import { FirebaseService } from './firebase-service';

export interface EpicFortniteStats {
  epicId: string;
  epicName: string;
  platform: string;
  
  // Overall stats
  overall: {
    wins: number;
    kd: number;
    placement: number;
    earnings: number;
    matches: number;
    top1: number;
    top3: number;
    top5: number;
    top10: number;
    top25: number;
    kills: number;
    deaths: number;
    assists: number;
    damageDealt: number;
    damageTaken: number;
    timeAlive: number;
    distanceTraveled: number;
    materialsGathered: number;
    structuresBuilt: number;
  };
  
  // Mode-specific stats
  solo?: {
    kd: number;
    winRate: number;
    matches: number;
    avgPlace: number;
    top1: number;
    top3: number;
    top5: number;
    top10: number;
    top25: number;
    kills: number;
    deaths: number;
    assists: number;
    damageDealt: number;
    damageTaken: number;
    timeAlive: number;
    distanceTraveled: number;
    materialsGathered: number;
    structuresBuilt: number;
  };
  
  duo?: {
    kd: number;
    winRate: number;
    matches: number;
    avgPlace: number;
    top1: number;
    top3: number;
    top5: number;
    top10: number;
    top25: number;
    kills: number;
    deaths: number;
    assists: number;
    damageDealt: number;
    damageTaken: number;
    timeAlive: number;
    distanceTraveled: number;
    materialsGathered: number;
    structuresBuilt: number;
  };
  
  squad?: {
    kd: number;
    winRate: number;
    matches: number;
    avgPlace: number;
    top1: number;
    top3: number;
    top5: number;
    top10: number;
    top25: number;
    kills: number;
    deaths: number;
    assists: number;
    damageDealt: number;
    damageTaken: number;
    timeAlive: number;
    distanceTraveled: number;
    materialsGathered: number;
    structuresBuilt: number;
  };
  
  // Arena stats
  arena?: {
    division: number;
    hype: number;
    kd: number;
    winRate: number;
    matches: number;
    avgPlace: number;
    top1: number;
    top3: number;
    top5: number;
    top10: number;
    top25: number;
    kills: number;
    deaths: number;
    assists: number;
    damageDealt: number;
    damageTaken: number;
    timeAlive: number;
    distanceTraveled: number;
    materialsGathered: number;
    structuresBuilt: number;
  };
}

export class EpicIntegration {
  private static readonly OSIRION_API_KEY = process.env.OSIRION_API_KEY;
  private static readonly OSIRION_API_BASE_URL = 'https://api.osirion.com/v1';
  
  /**
   * Pull Fortnite stats from Osirion API and save to Firebase
   */
  static async pullAndSaveFortniteStats(userId: string, epicId: string, epicName: string): Promise<void> {
    try {
      console.log(`🔄 Pulling Fortnite stats from Osirion for Epic ID: ${epicId}`);
      
      // Pull stats from Osirion API
      const stats = await this.pullFortniteStatsFromOsirion(epicId);
      
      if (stats) {
        // Save to Firebase
        await FirebaseService.saveFortniteData({
          userId,
          epicId,
          epicName,
          stats: stats.overall,
          modes: {
            solo: stats.solo,
            duo: stats.duo,
            squad: stats.squad,
            arena: stats.arena
          },
          dataSource: 'osirion',
          dataQuality: 'high'
        });
        
        console.log(`✅ Fortnite stats from Osirion saved to Firebase for user: ${userId}`);
      } else {
        console.log(`⚠️ No Fortnite stats found in Osirion for Epic ID: ${epicId}`);
      }
    } catch (error) {
      console.error(`❌ Error pulling Fortnite stats from Osirion for Epic ID ${epicId}:`, error);
      throw error;
    }
  }
  
  /**
   * Pull Fortnite stats from Osirion API
   */
  private static async pullFortniteStatsFromOsirion(epicId: string): Promise<EpicFortniteStats | null> {
    if (!this.OSIRION_API_KEY) {
      console.warn('⚠️ Osirion API key not configured');
      return null;
    }
    
    try {
      // Call Osirion API to get player stats
      const response = await fetch(`${this.OSIRION_API_BASE_URL}/player/stats`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.OSIRION_API_KEY}`
        },
        body: JSON.stringify({
          epicId: epicId,
          platform: 'epic'
        })
      });
      
      if (!response.ok) {
        console.warn(`⚠️ Osirion API returned ${response.status}: ${response.statusText}`);
        return null;
      }
      
      const data = await response.json();
      
      // Transform Osirion API response to our format
      return this.transformOsirionResponse(data, epicId);
      
    } catch (error) {
      console.error('❌ Error calling Osirion API:', error);
      return null;
    }
  }
  
  /**
   * Transform Osirion API response to our format
   */
  private static transformOsirionResponse(apiData: any, epicId: string): EpicFortniteStats | null {
    try {
      if (!apiData.player || !apiData.stats) {
        return null;
      }
      
      const player = apiData.player;
      const stats = apiData.stats;
      const platform = player.platform || 'epic';
      const epicName = player.displayName || player.epicName || 'Unknown';
      
      // Extract overall stats
      const overall = this.extractModeStats(stats.overall || stats);
      
      // Extract mode-specific stats
      const solo = stats.solo ? this.extractModeStats(stats.solo) : undefined;
      const duo = stats.duo ? this.extractModeStats(stats.duo) : undefined;
      const squad = stats.squad ? this.extractModeStats(stats.squad) : undefined;
      const arena = stats.arena ? this.extractModeStats(stats.arena) : undefined;
      
      return {
        epicId,
        epicName,
        platform,
        overall,
        solo,
        duo,
        squad,
        arena
      };
      
    } catch (error) {
      console.error('❌ Error transforming Osirion API response:', error);
      return null;
    }
  }
  
  /**
   * Extract stats for a specific game mode
   */
  private static extractModeStats(modeStats: any): any {
    return {
      wins: modeStats.wins || modeStats.top1 || 0,
      kd: modeStats.kd || modeStats.killDeathRatio || 0,
      placement: modeStats.avgPlace || modeStats.averagePlacement || 0,
      earnings: modeStats.earnings || 0,
      matches: modeStats.matches || modeStats.gamesPlayed || 0,
      top1: modeStats.top1 || modeStats.victories || 0,
      top3: modeStats.top3 || 0,
      top5: modeStats.top5 || 0,
      top10: modeStats.top10 || 0,
      top25: modeStats.top25 || 0,
      kills: modeStats.kills || modeStats.eliminations || 0,
      deaths: modeStats.deaths || 0,
      assists: modeStats.assists || 0,
      damageDealt: modeStats.damage || modeStats.damageDealt || 0,
      damageTaken: modeStats.damageTaken || 0,
      timeAlive: modeStats.timeAlive || modeStats.survivalTime || 0,
      distanceTraveled: modeStats.distanceTraveled || 0,
      materialsGathered: modeStats.materialsGathered || 0,
      structuresBuilt: modeStats.structuresBuilt || 0
    };
  }
  
  /**
   * Get recent matches for a player from Osirion
   */
  static async getRecentMatches(epicId: string, limit: number = 10): Promise<any[]> {
    if (!this.OSIRION_API_KEY) {
      return [];
    }
    
    try {
      const response = await fetch(`${this.OSIRION_API_BASE_URL}/player/matches`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.OSIRION_API_KEY}`
        },
        body: JSON.stringify({
          epicId: epicId,
          limit: limit
        })
      });
      
      if (!response.ok) {
        return [];
      }
      
      const data = await response.json();
      return data.matches || [];
      
    } catch (error) {
      console.error('❌ Error getting recent matches from Osirion:', error);
      return [];
    }
  }
  
  /**
   * Get player's current season stats from Osirion
   */
  static async getCurrentSeasonStats(epicId: string): Promise<any> {
    if (!this.OSIRION_API_KEY) {
      return null;
    }
    
    try {
      const response = await fetch(`${this.OSIRION_API_BASE_URL}/player/season`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.OSIRION_API_KEY}`
        },
        body: JSON.stringify({
          epicId: epicId
        })
      });
      
      if (!response.ok) {
        return null;
      }
      
      const data = await response.json();
      return data;
      
    } catch (error) {
      console.error('❌ Error getting current season stats from Osirion:', error);
      return null;
    }
  }
}
