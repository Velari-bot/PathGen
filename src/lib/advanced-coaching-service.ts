import { 
  SkillProgression, 
  RoleSpecificInsights, 
  FocusPriority, 
  ProBenchmark, 
  SessionSummary, 
  WeeklyReport, 
  PersonalizedCoaching 
} from '@/types/advanced-coaching';
import { AggregatedMatchData } from '@/types/match-analysis';

export class AdvancedCoachingService {
  // Pro benchmarks based on FNCS/competitive data
  private static readonly PRO_BENCHMARKS = {
    survivalTime: { average: 12.5, top10: 15.2 },
    accuracy: { average: 35, top10: 42 },
    matsPerFight: { average: 120, top10: 95 },
    avgPlacement: { average: 25, top10: 18 },
    kd: { average: 1.8, top10: 2.4 }
  };

  /**
   * Track skill progression over time
   */
  static async trackSkillProgression(
    userId: string, 
    currentData: AggregatedMatchData,
    historicalData?: AggregatedMatchData[]
  ): Promise<SkillProgression> {
    const previousData = historicalData?.[0];
    
    return {
      userId,
      skillMetrics: {
        survivalTime: {
          current: currentData.avgSurvivalTime,
          previous: previousData?.avgSurvivalTime || currentData.avgSurvivalTime,
          trend: this.calculateTrend(currentData.avgSurvivalTime, previousData?.avgSurvivalTime),
          weeklyChange: currentData.survivalTimeChange,
          monthlyChange: this.calculateMonthlyChange(currentData.avgSurvivalTime, historicalData),
          allTimeHigh: Math.max(currentData.avgSurvivalTime, ...(historicalData?.map(d => d.avgSurvivalTime) || [])),
          allTimeLow: Math.min(currentData.avgSurvivalTime, ...(historicalData?.map(d => d.avgSurvivalTime) || []))
        },
        accuracy: {
          current: currentData.accuracy.current,
          previous: previousData?.accuracy.current || currentData.accuracy.current,
          trend: this.calculateTrend(currentData.accuracy.current, previousData?.accuracy.current),
          weeklyChange: currentData.accuracyChange,
          monthlyChange: this.calculateMonthlyChange(currentData.accuracy.current, historicalData?.map(d => d.accuracy.current)),
          allTimeHigh: Math.max(currentData.accuracy.current, ...(historicalData?.map(d => d.accuracy.current) || [])),
          allTimeLow: Math.min(currentData.accuracy.current, ...(historicalData?.map(d => d.accuracy.current) || []))
        },
        matsEfficiency: {
          current: currentData.matsUsedPerFight.current,
          previous: previousData?.matsUsedPerFight.current || currentData.matsUsedPerFight.current,
          trend: this.calculateTrend(currentData.matsUsedPerFight.current, previousData?.matsUsedPerFight.current, true), // lower is better
          weeklyChange: currentData.matsEfficiencyChange,
          monthlyChange: this.calculateMonthlyChange(currentData.matsUsedPerFight.current, historicalData?.map(d => d.matsUsedPerFight.current)),
          allTimeHigh: Math.max(currentData.matsUsedPerFight.current, ...(historicalData?.map(d => d.matsUsedPerFight.current) || [])),
          allTimeLow: Math.min(currentData.matsUsedPerFight.current, ...(historicalData?.map(d => d.matsUsedPerFight.current) || []))
        },
        placement: {
          current: currentData.avgPlacement,
          previous: previousData?.avgPlacement || currentData.avgPlacement,
          trend: this.calculateTrend(currentData.avgPlacement, previousData?.avgPlacement, true), // lower is better
          weeklyChange: this.calculatePercentageChange(currentData.avgPlacement, previousData?.avgPlacement),
          monthlyChange: this.calculateMonthlyChange(currentData.avgPlacement, historicalData?.map(d => d.avgPlacement)),
          allTimeHigh: Math.max(currentData.avgPlacement, ...(historicalData?.map(d => d.avgPlacement) || [])),
          allTimeLow: Math.min(currentData.avgPlacement, ...(historicalData?.map(d => d.avgPlacement) || []))
        }
      },
      lastUpdated: new Date(),
      sessionCount: 1,
      totalSessions: (historicalData?.length || 0) + 1
    };
  }

  /**
   * Generate role-specific coaching insights
   */
  static generateRoleSpecificInsights(
    aggregatedData: AggregatedMatchData,
    fortniteStats: any
  ): RoleSpecificInsights {
    return {
      solo: {
        strengths: this.identifySoloStrengths(aggregatedData, fortniteStats),
        weaknesses: this.identifySoloWeaknesses(aggregatedData, fortniteStats),
        focusAreas: ['Early rotations', 'Mats conservation', '1v1 mechanics'],
        specificAdvice: this.generateSoloAdvice(aggregatedData, fortniteStats)
      },
      duo: {
        strengths: this.identifyDuoStrengths(aggregatedData, fortniteStats),
        weaknesses: this.identifyDuoWeaknesses(aggregatedData, fortniteStats),
        focusAreas: ['Team coordination', 'Split rotations', '2v2 fights'],
        specificAdvice: this.generateDuoAdvice(aggregatedData, fortniteStats)
      },
      trio: {
        strengths: this.identifyTrioStrengths(aggregatedData, fortniteStats),
        weaknesses: this.identifyTrioWeaknesses(aggregatedData, fortniteStats),
        focusAreas: ['Role clarity', 'Surge control', 'Team fights'],
        specificAdvice: this.generateTrioAdvice(aggregatedData, fortniteStats)
      }
    };
  }

  /**
   * Generate focus priority with confidence scores
   */
  static generateFocusPriority(
    aggregatedData: AggregatedMatchData,
    skillProgression: SkillProgression
  ): FocusPriority {
    const issues = [
      {
        skill: 'Early Rotations',
        impact: aggregatedData.rotationTrend === 'late' ? 'high' : 'medium',
        confidence: aggregatedData.rotationTrend === 'late' ? 95 : 60,
        reason: aggregatedData.rotationTrend === 'late' ? 'Consistently rotating late' : 'Rotation timing needs work',
        specificAction: 'Start rotating 2nd zone toward safer POIs'
      },
      {
        skill: 'Mats Efficiency',
        impact: aggregatedData.matsEfficiencyChange > 20 ? 'high' : 'medium',
        confidence: aggregatedData.matsEfficiencyChange > 20 ? 90 : 70,
        reason: aggregatedData.matsEfficiencyChange > 20 ? 'Using too many mats per fight' : 'Mats usage could improve',
        specificAction: 'Focus on controlled builds in mid-game fights'
      },
      {
        skill: 'Accuracy',
        impact: aggregatedData.accuracyChange < -10 ? 'high' : 'low',
        confidence: aggregatedData.accuracyChange < -10 ? 85 : 50,
        reason: aggregatedData.accuracyChange < -10 ? 'Accuracy dropped significantly' : 'Accuracy is stable',
        specificAction: 'Practice aim drills for 15 minutes daily'
      },
      {
        skill: 'Storm Survival',
        impact: aggregatedData.survivalTimeChange < -15 ? 'high' : 'medium',
        confidence: aggregatedData.survivalTimeChange < -15 ? 88 : 65,
        reason: aggregatedData.survivalTimeChange < -15 ? 'Survival time dropped significantly' : 'Survival time needs improvement',
        specificAction: 'Work on storm awareness and early positioning'
      }
    ];

    // Sort by confidence and impact
    const sortedIssues = issues.sort((a, b) => {
      const aScore = (a.confidence * (a.impact === 'high' ? 3 : a.impact === 'medium' ? 2 : 1));
      const bScore = (b.confidence * (b.impact === 'high' ? 3 : b.impact === 'medium' ? 2 : 1));
      return bScore - aScore;
    });

    return {
      primaryFocus: sortedIssues[0],
      secondaryFocus: sortedIssues[1],
      ignoreForNow: sortedIssues.slice(2).map(issue => issue.skill)
    };
  }

  /**
   * Generate pro benchmark comparisons
   */
  static generateProBenchmarks(aggregatedData: AggregatedMatchData): ProBenchmark[] {
    return [
      {
        skill: 'Survival Time',
        playerValue: aggregatedData.avgSurvivalTime,
        proAverage: this.PRO_BENCHMARKS.survivalTime.average,
        proTop10: this.PRO_BENCHMARKS.survivalTime.top10,
        gap: this.calculatePercentageGap(aggregatedData.avgSurvivalTime, this.PRO_BENCHMARKS.survivalTime.average),
        achievable: aggregatedData.avgSurvivalTime < this.PRO_BENCHMARKS.survivalTime.average * 1.2,
        timeframe: aggregatedData.avgSurvivalTime < this.PRO_BENCHMARKS.survivalTime.average * 0.8 ? '2 weeks' : '1 month'
      },
      {
        skill: 'Accuracy',
        playerValue: aggregatedData.accuracy.current,
        proAverage: this.PRO_BENCHMARKS.accuracy.average,
        proTop10: this.PRO_BENCHMARKS.accuracy.top10,
        gap: this.calculatePercentageGap(aggregatedData.accuracy.current, this.PRO_BENCHMARKS.accuracy.average),
        achievable: aggregatedData.accuracy.current < this.PRO_BENCHMARKS.accuracy.average * 1.3,
        timeframe: aggregatedData.accuracy.current < this.PRO_BENCHMARKS.accuracy.average * 0.7 ? '3 weeks' : '2 months'
      },
      {
        skill: 'Mats Efficiency',
        playerValue: aggregatedData.matsUsedPerFight.current,
        proAverage: this.PRO_BENCHMARKS.matsPerFight.average,
        proTop10: this.PRO_BENCHMARKS.matsPerFight.top10,
        gap: this.calculatePercentageGap(aggregatedData.matsUsedPerFight.current, this.PRO_BENCHMARKS.matsPerFight.average),
        achievable: aggregatedData.matsUsedPerFight.current > this.PRO_BENCHMARKS.matsPerFight.average * 0.8,
        timeframe: aggregatedData.matsUsedPerFight.current > this.PRO_BENCHMARKS.matsPerFight.average * 1.2 ? '2 weeks' : '1 month'
      }
    ];
  }

  /**
   * Generate session summary
   */
  static generateSessionSummary(
    userId: string,
    aggregatedData: AggregatedMatchData,
    skillProgression: SkillProgression
  ): SessionSummary {
    const improvements = [];
    const regressions = [];
    
    if (skillProgression.skillMetrics.survivalTime.trend === 'improving') {
      improvements.push(`Survival time improved by ${skillProgression.skillMetrics.survivalTime.weeklyChange.toFixed(1)}%`);
    } else if (skillProgression.skillMetrics.survivalTime.trend === 'declining') {
      regressions.push(`Survival time dropped by ${Math.abs(skillProgression.skillMetrics.survivalTime.weeklyChange).toFixed(1)}%`);
    }

    if (skillProgression.skillMetrics.accuracy.trend === 'improving') {
      improvements.push(`Accuracy improved by ${skillProgression.skillMetrics.accuracy.weeklyChange.toFixed(1)}%`);
    } else if (skillProgression.skillMetrics.accuracy.trend === 'declining') {
      regressions.push(`Accuracy dropped by ${Math.abs(skillProgression.skillMetrics.accuracy.weeklyChange).toFixed(1)}%`);
    }

    const focusPriority = this.generateFocusPriority(aggregatedData, skillProgression);
    
    return {
      sessionId: `session_${Date.now()}`,
      userId,
      date: new Date(),
      gamesAnalyzed: aggregatedData.gamesAnalyzed,
      keyInsights: [
        `Analyzed ${aggregatedData.gamesAnalyzed} games with focus on ${focusPriority.primaryFocus.skill}`,
        `Most common POI: ${aggregatedData.mostCommonPOIs[0]}`,
        `Rotation trend: ${aggregatedData.rotationTrend}`
      ],
      improvements,
      regressions,
      focusForNextSession: [focusPriority.primaryFocus.specificAction, focusPriority.secondaryFocus.specificAction],
      practiceDrill: this.generatePracticeDrill(focusPriority.primaryFocus.skill),
      motivation: this.generateMotivation(improvements, regressions, aggregatedData)
    };
  }

  /**
   * Generate weekly report
   */
  static generateWeeklyReport(
    userId: string,
    weeklyData: AggregatedMatchData[],
    skillProgression: SkillProgression
  ): WeeklyReport {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);
    
    const totalGames = weeklyData.reduce((sum, data) => sum + data.gamesAnalyzed, 0);
    const avgSurvivalChange = weeklyData.reduce((sum, data) => sum + data.survivalTimeChange, 0) / weeklyData.length;
    const avgAccuracyChange = weeklyData.reduce((sum, data) => sum + data.accuracyChange, 0) / weeklyData.length;
    
    const biggestImprovement = avgSurvivalChange > avgAccuracyChange ? 'Storm survival' : 'Accuracy';
    const biggestChallenge = avgSurvivalChange < avgAccuracyChange ? 'Storm survival' : 'Accuracy';
    
    return {
      weekId: `week_${Date.now()}`,
      userId,
      startDate,
      endDate: new Date(),
      gamesAnalyzed: totalGames,
      overallProgress: {
        accuracy: avgAccuracyChange,
        survivalTime: avgSurvivalChange,
        placement: 0, // Calculate based on data
        matsEfficiency: weeklyData.reduce((sum, data) => sum + data.matsEfficiencyChange, 0) / weeklyData.length
      },
      biggestImprovement,
      biggestChallenge,
      focusForNextWeek: ['Early rotations', 'Mats conservation'],
      goalsForNextWeek: {
        primary: 'Improve storm survival to 11+ minutes',
        secondary: 'Reduce mats per fight by 20%',
        measurable: 'Track survival time and mats usage in next 10 games'
      },
      motivation: this.generateWeeklyMotivation(avgSurvivalChange, avgAccuracyChange, totalGames),
      achievements: this.generateAchievements(skillProgression)
    };
  }

  // Helper methods
  private static calculateTrend(current: number, previous: number, lowerIsBetter = false): 'improving' | 'declining' | 'stable' {
    if (!previous) return 'stable';
    const change = ((current - previous) / previous) * 100;
    
    if (lowerIsBetter) {
      return change < -5 ? 'improving' : change > 5 ? 'declining' : 'stable';
    } else {
      return change > 5 ? 'improving' : change < -5 ? 'declining' : 'stable';
    }
  }

  private static calculateMonthlyChange(current: number, historicalData?: number[]): number {
    if (!historicalData || historicalData.length < 4) return 0;
    const monthlyData = historicalData.slice(0, 4);
    const monthlyAvg = monthlyData.reduce((sum, val) => sum + val, 0) / monthlyData.length;
    return ((current - monthlyAvg) / monthlyAvg) * 100;
  }

  private static calculatePercentageChange(current: number, previous?: number): number {
    if (!previous) return 0;
    return ((current - previous) / previous) * 100;
  }

  private static calculatePercentageGap(playerValue: number, proValue: number): number {
    return ((playerValue - proValue) / proValue) * 100;
  }

  private static identifySoloStrengths(data: AggregatedMatchData, stats: any): string[] {
    const strengths = [];
    if (data.avgKills > 2) strengths.push('Strong fighting mechanics');
    if (data.accuracy.current > 30) strengths.push('Good aim');
    if (data.avgSurvivalTime > 10) strengths.push('Solid survival instincts');
    return strengths;
  }

  private static identifySoloWeaknesses(data: AggregatedMatchData, stats: any): string[] {
    const weaknesses = [];
    if (data.rotationTrend === 'late') weaknesses.push('Late rotations');
    if (data.matsUsedPerFight.current > 150) weaknesses.push('Mats inefficiency');
    if (data.avgPlacement > 30) weaknesses.push('Mid-game positioning');
    return weaknesses;
  }

  private static generateSoloAdvice(data: AggregatedMatchData, stats: any): string[] {
    return [
      'Focus on early rotations to avoid stacked fights',
      'Practice 1v1 mechanics in Creative',
      'Work on mats conservation in early game'
    ];
  }

  private static identifyDuoStrengths(data: AggregatedMatchData, stats: any): string[] {
    return ['Team coordination', 'Split rotations'];
  }

  private static identifyDuoWeaknesses(data: AggregatedMatchData, stats: any): string[] {
    return ['Communication', 'Role clarity'];
  }

  private static generateDuoAdvice(data: AggregatedMatchData, stats: any): string[] {
    return [
      'Establish clear roles (IGL vs fragger)',
      'Practice split rotations',
      'Work on 2v2 fight mechanics'
    ];
  }

  private static identifyTrioStrengths(data: AggregatedMatchData, stats: any): string[] {
    return ['Team fights', 'Surge control'];
  }

  private static identifyTrioWeaknesses(data: AggregatedMatchData, stats: any): string[] {
    return ['Role clarity', 'Communication'];
  }

  private static generateTrioAdvice(data: AggregatedMatchData, stats: any): string[] {
    return [
      'Let your IGL take lead rotations',
      'Hold surge angles instead of rotating first',
      'Practice team fight coordination'
    ];
  }

  private static generatePracticeDrill(skill: string): { name: string; description: string; duration: string; creativeCode?: string } {
    const drills = {
      'Early Rotations': {
        name: 'Zone Control Practice',
        description: 'Practice rotating early in different zones',
        duration: '20 minutes',
        creativeCode: '1234-5678-9012'
      },
      'Mats Efficiency': {
        name: 'Build Battle Efficiency',
        description: 'Practice controlled building with limited mats',
        duration: '15 minutes',
        creativeCode: '2345-6789-0123'
      },
      'Accuracy': {
        name: 'Raider464 Aim Trainer',
        description: 'Focus on tracking and flick shots',
        duration: '15 minutes',
        creativeCode: '3456-7890-1234'
      },
      'Storm Survival': {
        name: 'Storm Awareness Drill',
        description: 'Practice storm positioning and rotations',
        duration: '25 minutes',
        creativeCode: '4567-8901-2345'
      }
    };

    return drills[skill] || {
      name: 'General Practice',
      description: 'Focus on overall improvement',
      duration: '20 minutes'
    };
  }

  private static generateMotivation(improvements: string[], regressions: string[], data: AggregatedMatchData): string {
    if (improvements.length > regressions.length) {
      return `Great session! You're making solid progress. Keep focusing on ${improvements[0]} and you'll see even better results.`;
    } else if (regressions.length > 0) {
      return `Even though ${regressions[0]}, your ${data.avgKills > 2 ? 'fighting mechanics' : 'positioning'} stayed strong. Focus on the fundamentals and the improvements will follow.`;
    } else {
      return `Consistent performance today. Small improvements compound over time - keep grinding!`;
    }
  }

  private static generateWeeklyMotivation(survivalChange: number, accuracyChange: number, totalGames: number): string {
    if (survivalChange > 10 || accuracyChange > 10) {
      return `Outstanding week! You're trending in the right direction. With ${totalGames} games analyzed, you're building solid habits.`;
    } else if (survivalChange > 0 || accuracyChange > 0) {
      return `Solid progress this week. Every small improvement adds up - you're on the right track.`;
    } else {
      return `Consistent week of practice. Sometimes progress isn't linear, but your dedication will pay off.`;
    }
  }

  private static generateAchievements(skillProgression: SkillProgression): string[] {
    const achievements = [];
    
    if (skillProgression.skillMetrics.survivalTime.allTimeHigh > 15) {
      achievements.push('Survival Master - Reached 15+ minute survival time');
    }
    
    if (skillProgression.skillMetrics.accuracy.allTimeHigh > 40) {
      achievements.push('Accuracy Ace - Hit 40%+ accuracy');
    }
    
    if (skillProgression.totalSessions > 10) {
      achievements.push('Dedicated Player - Completed 10+ coaching sessions');
    }
    
    return achievements;
  }
}
