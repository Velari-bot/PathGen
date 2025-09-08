import { MatchData, AggregatedMatchData } from '@/types/match-analysis';

export class MatchAnalysisService {
  /**
   * Process raw Fortnite stats into structured match data
   */
  static processMatchData(rawStats: any, userId: string): MatchData[] {
    const matches: MatchData[] = [];
    
    // If we have raw Osirion data with individual matches
    if (rawStats.matches && Array.isArray(rawStats.matches)) {
      rawStats.matches.forEach((match: any, index: number) => {
        matches.push({
          userId,
          matchId: match.id || `match_${index}`,
          date: match.timestamp || new Date().toISOString(),
          
          // Basic match info
          poi: this.inferPOI(match), // We'll need to infer this from available data
          survivalTime: match.survivalTime || 0,
          placement: match.placement || 0,
          kills: match.kills || 0,
          assists: match.assists || 0,
          damageDealt: match.damage || 0,
          damageTaken: 0, // Not available in current data
          
          // Advanced metrics
          stormDamage: 0, // Not available in current data
          rotationTiming: this.inferRotationTiming(match),
          
          // Materials tracking
          materials: {
            matsGathered: match.woodFarmed + match.stoneFarmed + match.metalFarmed || 0,
            matsUsed: match.woodBuildsPlaced + match.stoneBuildsPlaced + match.metalBuildsPlaced || 0,
            matsUsedPerFight: this.calculateMatsPerFight(match)
          },
          
          // Accuracy metrics
          accuracy: {
            shotsFired: 0, // Not available in current data
            shotsHit: 0, // Not available in current data
            hitRate: this.calculateHitRate(match)
          },
          
          // Death analysis
          deaths: {
            cause: this.inferDeathCause(match),
            fightType: this.inferFightType(match)
          }
        });
      });
    }
    
    return matches;
  }
  
  /**
   * Aggregate match data for trend analysis
   */
  static aggregateMatchData(matches: MatchData[], previousMatches?: MatchData[]): AggregatedMatchData {
    const currentGames = matches.length;
    const previousGames = previousMatches?.length || 0;
    
    // Calculate current averages
    const avgSurvivalTime = this.calculateAverage(matches, 'survivalTime');
    const avgPlacement = this.calculateAverage(matches, 'placement');
    const avgKills = this.calculateAverage(matches, 'kills');
    const avgDamageDealt = this.calculateAverage(matches, 'damageDealt');
    const avgDamageTaken = this.calculateAverage(matches, 'damageTaken');
    
    // Calculate previous averages
    const prevAvgSurvivalTime = previousMatches ? this.calculateAverage(previousMatches, 'survivalTime') : avgSurvivalTime;
    const prevAccuracy = previousMatches ? this.calculateAverage(previousMatches, 'accuracy.hitRate') : 0;
    const prevMatsPerFight = previousMatches ? this.calculateAverage(previousMatches, 'materials.matsUsedPerFight') : 0;
    
    // Current metrics
    const currentAccuracy = this.calculateAverage(matches, 'accuracy.hitRate');
    const currentMatsPerFight = this.calculateAverage(matches, 'materials.matsUsedPerFight');
    
    // Calculate changes
    const survivalTimeChange = this.calculatePercentageChange(avgSurvivalTime, prevAvgSurvivalTime);
    const accuracyChange = this.calculatePercentageChange(currentAccuracy, prevAccuracy);
    const matsEfficiencyChange = this.calculatePercentageChange(currentMatsPerFight, prevMatsPerFight);
    
    // Strategic patterns
    const mostCommonPOIs = this.getMostCommonPOIs(matches);
    const rotationTrend = this.getMostCommonRotationTiming(matches);
    const mostCommonDeathCause = this.getMostCommonDeathCause(matches);
    
    return {
      userId: matches[0]?.userId || '',
      gamesAnalyzed: currentGames,
      
      // Performance averages
      avgSurvivalTime,
      prevAvgSurvivalTime,
      avgPlacement,
      avgKills,
      avgDamageDealt,
      avgDamageTaken,
      
      // Accuracy trends
      accuracy: {
        current: currentAccuracy,
        previous: prevAccuracy
      },
      
      // Materials usage trends
      matsUsedPerFight: {
        current: currentMatsPerFight,
        previous: prevMatsPerFight
      },
      
      // Strategic patterns
      mostCommonPOIs,
      rotationTrend,
      mostCommonDeathCause,
      
      // Performance changes
      survivalTimeChange,
      accuracyChange,
      matsEfficiencyChange
    };
  }
  
  /**
   * Generate coaching insights from aggregated data
   */
  static generateCoachingInsights(aggregatedData: AggregatedMatchData): {
    observation: string;
    trend: string;
    advice: string;
    encouragement: string;
  } {
    const { avgSurvivalTime, prevAvgSurvivalTime, survivalTimeChange, accuracy, matsUsedPerFight, mostCommonPOIs, rotationTrend, mostCommonDeathCause, accuracyChange, matsEfficiencyChange } = aggregatedData;
    
    // Observation - what happened in recent games
    const observation = `In your last ${aggregatedData.gamesAnalyzed} games, you averaged ${avgSurvivalTime.toFixed(1)} minutes of survival${survivalTimeChange < 0 ? ` (down from ${prevAvgSurvivalTime.toFixed(1)} minutes)` : ''}. You consistently dropped ${mostCommonPOIs.join(' and ')} and rotated ${rotationTrend}. Most deaths came from ${mostCommonDeathCause}.`;
    
    // Trend - comparison to past performance
    const trend = `Your survival time ${survivalTimeChange < 0 ? 'dropped' : 'improved'} by ${Math.abs(survivalTimeChange).toFixed(1)}% compared to previous games. Accuracy ${accuracy.current < accuracy.previous ? 'slipped' : 'improved'} by ${Math.abs(accuracyChange).toFixed(1)}%, and you're using ${matsEfficiencyChange > 0 ? 'more' : 'fewer'} materials per fight than usual.`;
    
    // Advice - actionable coaching tips
    const advice = this.generateActionableAdvice(aggregatedData);
    
    // Encouragement - positive reinforcement
    const encouragement = `Focus on ${this.getPrimaryFocus(aggregatedData)} in your next session. With consistent practice, you can bring your survival time above ${Math.max(avgSurvivalTime, prevAvgSurvivalTime).toFixed(1)} minutes.`;
    
    return {
      observation,
      trend,
      advice,
      encouragement
    };
  }
  
  // Helper methods
  private static calculateAverage(matches: MatchData[], field: string): number {
    if (matches.length === 0) return 0;
    
    const sum = matches.reduce((acc, match) => {
      const value = this.getNestedValue(match, field);
      return acc + (typeof value === 'number' ? value : 0);
    }, 0);
    
    return sum / matches.length;
  }
  
  private static getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }
  
  private static calculatePercentageChange(current: number, previous: number): number {
    if (previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  }
  
  private static inferPOI(match: any): string {
    // This would need to be enhanced with actual POI detection logic
    // For now, return a placeholder
    return 'Unknown POI';
  }
  
  private static inferRotationTiming(match: any): 'early' | 'mid' | 'late' {
    // This would need to be enhanced with actual rotation timing logic
    // For now, return a placeholder
    return 'mid';
  }
  
  private static calculateMatsPerFight(match: any): number {
    const totalMats = (match.woodBuildsPlaced || 0) + (match.stoneBuildsPlaced || 0) + (match.metalBuildsPlaced || 0);
    const fights = Math.max(1, match.kills || 1); // Estimate fights based on kills
    return totalMats / fights;
  }
  
  private static calculateHitRate(match: any): number {
    // This would need to be enhanced with actual accuracy calculation
    // For now, return a placeholder
    return 0;
  }
  
  private static inferDeathCause(match: any): string {
    // This would need to be enhanced with actual death cause analysis
    // For now, return a placeholder
    return 'Unknown cause';
  }
  
  private static inferFightType(match: any): string {
    // This would need to be enhanced with actual fight type analysis
    // For now, return a placeholder
    return 'Unknown fight type';
  }
  
  private static getMostCommonPOIs(matches: MatchData[]): string[] {
    const poiCounts: { [key: string]: number } = {};
    matches.forEach(match => {
      poiCounts[match.poi] = (poiCounts[match.poi] || 0) + 1;
    });
    
    return Object.entries(poiCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 2)
      .map(([poi]) => poi);
  }
  
  private static getMostCommonRotationTiming(matches: MatchData[]): 'early' | 'mid' | 'late' {
    const timingCounts: { [key: string]: number } = {};
    matches.forEach(match => {
      timingCounts[match.rotationTiming] = (timingCounts[match.rotationTiming] || 0) + 1;
    });
    
    const mostCommon = Object.entries(timingCounts)
      .sort(([,a], [,b]) => b - a)[0]?.[0];
    
    return mostCommon as 'early' | 'mid' | 'late' || 'mid';
  }
  
  private static getMostCommonDeathCause(matches: MatchData[]): string {
    const causeCounts: { [key: string]: number } = {};
    matches.forEach(match => {
      causeCounts[match.deaths.cause] = (causeCounts[match.deaths.cause] || 0) + 1;
    });
    
    const mostCommon = Object.entries(causeCounts)
      .sort(([,a], [,b]) => b - a)[0]?.[0];
    
    return mostCommon || 'Unknown cause';
  }
  
  private static generateActionableAdvice(aggregatedData: AggregatedMatchData): string {
    const advice: string[] = [];
    
    if (aggregatedData.survivalTimeChange < -10) {
      advice.push(`Try rotating earlier (2nd zone) toward safer POIs like Slappy Shores where mats are more consistent.`);
    }
    
    if (aggregatedData.accuracy.current < aggregatedData.accuracy.previous) {
      advice.push(`Set aside 15 minutes for KovaaK's or Fortnite Creative aim drills to improve accuracy.`);
    }
    
    if (aggregatedData.matsUsedPerFight.current > aggregatedData.matsUsedPerFight.previous * 1.2) {
      advice.push(`Focus on controlled builds in mid-game fights to conserve materials.`);
    }
    
    if (aggregatedData.rotationTrend === 'late') {
      advice.push(`Start rotating earlier to avoid storm damage and stacked fights.`);
    }
    
    return advice.join(' ');
  }
  
  private static getPrimaryFocus(aggregatedData: AggregatedMatchData): string {
    if (aggregatedData.survivalTimeChange < -10) {
      return 'storm survival and rotation timing';
    } else if (aggregatedData.accuracy.current < aggregatedData.accuracy.previous) {
      return 'aim practice and accuracy';
    } else if (aggregatedData.matsUsedPerFight.current > aggregatedData.matsUsedPerFight.previous * 1.2) {
      return 'material conservation and build efficiency';
    } else {
      return 'consistent performance and decision-making';
    }
  }
}
