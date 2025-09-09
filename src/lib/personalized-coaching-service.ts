import { 
  CoachingStyle, 
  MomentumAnalysis, 
  TeamSynergyAnalysis, 
  EventPrepSession, 
  MetaAwareness, 
  GamifiedProgress, 
  CoachDrillBank,
  PersonalizedCoachingProfile 
} from '@/types/personalized-coaching';
import { AggregatedMatchData } from '@/types/match-analysis';

export class PersonalizedCoachingService {
  // Regional meta data (would be updated regularly)
  private static readonly REGIONAL_META = {
    na_east: {
      popularPOIs: [
        { poi: 'Mega City', popularity: 35, surgeCongestion: 85, rotationDifficulty: 8 },
        { poi: 'Slappy Shores', popularity: 25, surgeCongestion: 60, rotationDifficulty: 5 },
        { poi: 'Knotty Nets', popularity: 20, surgeCongestion: 45, rotationDifficulty: 4 },
        { poi: 'Frenzy Fields', popularity: 15, surgeCongestion: 70, rotationDifficulty: 6 }
      ],
      playstyleTrends: { aggressive: 65, passive: 20, balanced: 15 },
      avgSurvivalTime: 11.2,
      avgKills: 2.8
    },
    eu: {
      popularPOIs: [
        { poi: 'Mega City', popularity: 30, surgeCongestion: 80, rotationDifficulty: 8 },
        { poi: 'Slappy Shores', popularity: 28, surgeCongestion: 55, rotationDifficulty: 5 },
        { poi: 'Knotty Nets', popularity: 22, surgeCongestion: 40, rotationDifficulty: 4 },
        { poi: 'Frenzy Fields', popularity: 20, surgeCongestion: 65, rotationDifficulty: 6 }
      ],
      playstyleTrends: { aggressive: 55, passive: 25, balanced: 20 },
      avgSurvivalTime: 12.1,
      avgKills: 2.5
    }
  };

  // Drill bank with specific Creative codes and objectives
  private static readonly DRILL_BANK: Array<{
    id: string;
    name: string;
    category: 'aim' | 'building' | 'rotations' | 'mats_efficiency' | 'teamwork' | 'mental';
    difficulty: 'beginner' | 'intermediate' | 'advanced' | 'pro';
    duration: string;
    creativeCode?: string;
    description: string;
    objectives: string[];
    successCriteria: string[];
    progressionSteps: string[];
    relatedSkills: string[];
  }> = [
    {
      id: 'raider464_aim',
      name: 'Raider464 Aim Trainer',
      category: 'aim',
      difficulty: 'intermediate',
      duration: '15 minutes',
      creativeCode: '1234-5678-9012',
      description: 'Focus on tracking and flick shots',
      objectives: ['Improve tracking accuracy', 'Practice flick shots', 'Build muscle memory'],
      successCriteria: ['80%+ accuracy', 'Consistent headshots', 'Quick target acquisition'],
      progressionSteps: ['Start with slow targets', 'Increase speed gradually', 'Add movement'],
      relatedSkills: ['accuracy', 'reaction_time', 'muscle_memory']
    },
    {
      id: 'mats_efficiency_realistics',
      name: 'Mats Efficiency Realistics',
      category: 'mats_efficiency',
      difficulty: 'advanced',
      duration: '20 minutes',
      creativeCode: '2345-6789-0123',
      description: 'Practice controlled building with limited mats',
      objectives: ['Use max 100 mats per fight', 'Build efficiently', 'Conserve resources'],
      successCriteria: ['Under 100 mats per fight', 'Wins with minimal building', 'Smart edit plays'],
      progressionSteps: ['Start with 150 mats', 'Reduce to 100 mats', 'Challenge with 75 mats'],
      relatedSkills: ['building_efficiency', 'edit_timing', 'resource_management']
    },
    {
      id: 'rotation_timing_arena',
      name: 'Rotation Timing Arena',
      category: 'rotations',
      difficulty: 'intermediate',
      duration: '30 minutes',
      creativeCode: '3456-7890-1234',
      description: 'Practice early rotations in Arena',
      objectives: ['Rotate at 1:30 left on first zone', 'Avoid storm damage', 'Secure positioning'],
      successCriteria: ['No storm damage', 'Early zone positioning', 'Consistent rotations'],
      progressionSteps: ['Practice timing', 'Add pressure', 'Tournament scenarios'],
      relatedSkills: ['storm_awareness', 'positioning', 'timing']
    },
    {
      id: 'team_coordination_drills',
      name: 'Team Coordination Drills',
      category: 'teamwork',
      difficulty: 'advanced',
      duration: '45 minutes',
      creativeCode: '4567-8901-2345',
      description: 'Practice team communication and coordination',
      objectives: ['Clear callouts', 'Role clarity', 'Team fights'],
      successCriteria: ['Effective communication', 'Coordinated pushes', 'Team synergy'],
      progressionSteps: ['Basic comms', 'Advanced strategies', 'Tournament prep'],
      relatedSkills: ['communication', 'teamwork', 'strategy']
    },
    {
      id: 'mech_training',
      name: 'Mech Training',
      category: 'building',
      difficulty: 'intermediate',
      duration: '20 minutes',
      creativeCode: '2424-4344-7824',
      description: 'Advanced mechanical training for building and editing',
      objectives: ['Improve building speed', 'Master edit techniques', 'Build muscle memory'],
      successCriteria: ['Consistent builds', 'Quick edits', 'Smooth mechanics'],
      progressionSteps: ['Basic builds', 'Edit plays', 'Advanced techniques'],
      relatedSkills: ['building', 'editing', 'mechanics']
    },
    {
      id: 'cup_endgame',
      name: 'Cup Endgame',
      category: 'rotations',
      difficulty: 'advanced',
      duration: '30 minutes',
      creativeCode: '7910-3591-7319',
      description: 'Practice endgame scenarios and surge control',
      objectives: ['Endgame positioning', 'Surge control', 'Late game strategy'],
      successCriteria: ['Consistent top 10s', 'Smart positioning', 'Surge management'],
      progressionSteps: ['Basic endgame', 'Surge scenarios', 'Tournament endgames'],
      relatedSkills: ['positioning', 'surge_control', 'endgame']
    },
    {
      id: 'realistics_2v1',
      name: '2v1 Realistics',
      category: 'teamwork',
      difficulty: 'advanced',
      duration: '25 minutes',
      creativeCode: '6809-4712-6549',
      description: 'Practice 2v1 scenarios and clutch situations',
      objectives: ['2v1 mechanics', 'Clutch potential', 'Team coordination'],
      successCriteria: ['Winning 2v1s', 'Smart plays', 'Team synergy'],
      progressionSteps: ['Basic 2v1s', 'Advanced scenarios', 'Clutch situations'],
      relatedSkills: ['teamwork', 'clutch', 'mechanics']
    },
    {
      id: 'pro_zw',
      name: 'Pro ZW',
      category: 'building',
      difficulty: 'pro',
      duration: '35 minutes',
      creativeCode: '3537-4087-0888',
      description: 'Professional zone wars for competitive practice',
      objectives: ['Zone war mechanics', 'Competitive building', 'Tournament prep'],
      successCriteria: ['Consistent wins', 'Smart builds', 'Tournament ready'],
      progressionSteps: ['Basic zone wars', 'Advanced scenarios', 'Pro level'],
      relatedSkills: ['building', 'zone_wars', 'competitive']
    },
    {
      id: 'martoz_turtle_wars',
      name: 'Martoz Turtle Wars',
      category: 'building',
      difficulty: 'advanced',
      duration: '30 minutes',
      creativeCode: '1513-6690-9481',
      description: 'Turtle wars for box fighting and defensive building',
      objectives: ['Box fighting', 'Defensive building', 'Edit plays'],
      successCriteria: ['Strong defense', 'Quick edits', 'Box fight wins'],
      progressionSteps: ['Basic turtling', 'Edit plays', 'Advanced box fights'],
      relatedSkills: ['box_fighting', 'editing', 'defense']
    }
  ];

  /**
   * Generate adaptable coaching style based on player preferences
   */
  static generateCoachingStyle(
    userPreferences: any,
    performanceData: AggregatedMatchData
  ): CoachingStyle {
    const performanceLevel = this.assessPerformanceLevel(performanceData);
    
    return {
      mode: userPreferences.coachingMode || this.determineOptimalMode(performanceLevel),
      intensity: userPreferences.intensity || this.determineIntensity(performanceLevel),
      focusAreas: userPreferences.focusAreas || this.getDefaultFocusAreas(performanceData),
      preferredLanguage: userPreferences.language || 'encouraging',
      responseLength: userPreferences.responseLength || 'detailed'
    };
  }

  /**
   * Analyze momentum and detect tilt
   */
  static analyzeMomentum(
    userId: string,
    recentGames: AggregatedMatchData[],
    currentPerformance: AggregatedMatchData
  ): MomentumAnalysis {
    const last5Games = recentGames.slice(0, 5);
    const performanceDrop = this.calculatePerformanceDrop(last5Games, currentPerformance);
    const consecutiveLosses = this.countConsecutiveLosses(last5Games);
    
    const momentum = this.determineMomentum(performanceDrop, consecutiveLosses);
    const tiltIndicators = this.assessTiltIndicators(last5Games, currentPerformance);
    
    return {
      userId,
      currentMomentum: momentum,
      performanceStreak: {
        type: performanceDrop > 20 ? 'negative' : performanceDrop < -10 ? 'positive' : 'mixed',
        duration: last5Games.length,
        trend: performanceDrop > 15 ? 'declining' : performanceDrop < -10 ? 'improving' : 'stable'
      },
      tiltIndicators: {
        recentDeaths: tiltIndicators.deaths,
        performanceDrop: performanceDrop,
        timeSinceLastWin: tiltIndicators.timeSinceWin,
        consecutiveLosses: consecutiveLosses
      },
      recommendations: this.generateMomentumRecommendations(momentum, tiltIndicators)
    };
  }

  /**
   * Analyze team synergy for Duos/Trios
   */
  static analyzeTeamSynergy(
    teamId: string,
    teamMembers: string[],
    teamPerformanceData: any
  ): TeamSynergyAnalysis {
    const synergyMetrics = this.calculateSynergyMetrics(teamPerformanceData);
    const individualContributions = this.calculateIndividualContributions(teamMembers, teamPerformanceData);
    
    return {
      teamId,
      teamMembers,
      synergyMetrics,
      individualContributions,
      teamStrengths: this.identifyTeamStrengths(synergyMetrics),
      teamWeaknesses: this.identifyTeamWeaknesses(synergyMetrics),
      recommendations: this.generateTeamRecommendations(synergyMetrics, individualContributions)
    };
  }

  /**
   * Generate event prep session
   */
  static generateEventPrepSession(
    userId: string,
    eventType: 'fncs' | 'cash_cup' | 'arena' | 'custom',
    eventDate: Date,
    last20Games: AggregatedMatchData[]
  ): EventPrepSession {
    const analysis = this.analyzeLast20Games(last20Games);
    const prepLevel = this.determinePrepLevel(analysis);
    
    return {
      eventId: `event_${Date.now()}`,
      eventType,
      eventDate,
      prepLevel,
      last20GamesAnalysis: analysis,
      tournamentMindsetChecklist: this.generateTournamentChecklist(analysis),
      personalizedPrepPlan: this.generatePersonalizedPrepPlan(analysis, prepLevel)
    };
  }

  /**
   * Generate meta awareness insights
   */
  static generateMetaAwareness(
    region: 'na_east' | 'na_west' | 'eu' | 'oce' | 'asia',
    userPerformance: AggregatedMatchData
  ): MetaAwareness {
    const regionalData = this.REGIONAL_META[region as keyof typeof this.REGIONAL_META] || this.REGIONAL_META.na_east;
    
    return {
      region,
      currentMeta: {
        popularPOIs: regionalData.popularPOIs,
        playstyleTrends: regionalData.playstyleTrends,
        weaponMeta: ['Assault Rifle', 'Shotgun', 'SMG', 'Sniper'],
        buildingTrends: ['High ground control', 'Edit plays', 'Box fighting']
      },
      regionalInsights: {
        avgSurvivalTime: regionalData.avgSurvivalTime,
        avgKills: regionalData.avgKills,
        commonStrategies: ['Early rotations', 'Surge control', 'Team coordination'],
        uniquePatterns: this.getRegionalPatterns(region)
      },
      personalizedRecommendations: this.generateMetaRecommendations(regionalData, userPerformance)
    };
  }

  /**
   * Generate gamified progress system
   */
  static generateGamifiedProgress(
    userId: string,
    performanceData: AggregatedMatchData,
    historicalData: AggregatedMatchData[]
  ): GamifiedProgress {
    const currentLevel = this.calculatePlayerLevel(performanceData, historicalData);
    const badges = this.generateBadges(performanceData, historicalData);
    const achievements = this.generateAchievements(performanceData, historicalData);
    
    return {
      userId,
      playerLevel: currentLevel,
      totalXP: this.calculateTotalXP(performanceData, historicalData),
      currentXP: this.calculateCurrentXP(performanceData),
      xpToNextLevel: this.calculateXPToNextLevel(currentLevel),
      badges,
      achievements,
      streaks: this.calculateStreaks(historicalData),
      weeklyGoals: this.generateWeeklyGoals(performanceData),
      leaderboard: this.calculateLeaderboardPosition(userId, performanceData)
    };
  }

  /**
   * Generate personalized drill recommendations
   */
  static generateDrillRecommendations(
    focusAreas: string[],
    skillLevel: string,
    performanceData: AggregatedMatchData
  ): CoachDrillBank {
    const relevantDrills = this.DRILL_BANK.filter(drill => 
      focusAreas.some(area => drill.relatedSkills.includes(area)) &&
      drill.difficulty === skillLevel
    );
    
    const personalizedDrills = relevantDrills.map(drill => ({
      drillId: drill.id,
      assignedAt: new Date(),
      priority: this.determineDrillPriority(drill, performanceData),
      reason: this.generateDrillReason(drill, performanceData),
      expectedOutcome: this.generateExpectedOutcome(drill),
      progress: 0
    }));
    
    return {
      drills: this.DRILL_BANK,
      personalizedDrills,
      drillHistory: []
    };
  }

  // Helper methods
  private static assessPerformanceLevel(data: AggregatedMatchData): 'beginner' | 'intermediate' | 'advanced' | 'pro' {
    if (data.avgSurvivalTime > 15 && data.accuracy.current > 40) return 'pro';
    if (data.avgSurvivalTime > 12 && data.accuracy.current > 30) return 'advanced';
    if (data.avgSurvivalTime > 9 && data.accuracy.current > 25) return 'intermediate';
    return 'beginner';
  }

  private static determineOptimalMode(level: string): 'strict' | 'mentor' | 'tactical' | 'chill' {
    switch (level) {
      case 'pro': return 'strict';
      case 'advanced': return 'tactical';
      case 'intermediate': return 'mentor';
      default: return 'chill';
    }
  }

  private static determineIntensity(level: string): 'high' | 'medium' | 'low' {
    switch (level) {
      case 'pro': return 'high';
      case 'advanced': return 'high';
      case 'intermediate': return 'medium';
      default: return 'low';
    }
  }

  private static getDefaultFocusAreas(data: AggregatedMatchData): string[] {
    const areas = [];
    if (data.rotationTrend === 'late') areas.push('rotations');
    if (data.matsEfficiencyChange > 20) areas.push('mats_efficiency');
    if (data.accuracyChange < -10) areas.push('accuracy');
    if (data.survivalTimeChange < -15) areas.push('survival');
    return areas.length > 0 ? areas : ['general_improvement'];
  }

  private static calculatePerformanceDrop(recentGames: AggregatedMatchData[], current: AggregatedMatchData): number {
    if (recentGames.length === 0) return 0;
    const avgRecent = recentGames.reduce((sum, game) => sum + game.avgSurvivalTime, 0) / recentGames.length;
    return ((current.avgSurvivalTime - avgRecent) / avgRecent) * 100;
  }

  private static countConsecutiveLosses(games: AggregatedMatchData[]): number {
    let count = 0;
    for (const game of games) {
      if (game.avgPlacement > 50) count++;
      else break;
    }
    return count;
  }

  private static determineMomentum(drop: number, losses: number): 'hot' | 'cold' | 'stable' | 'tilted' {
    if (losses >= 3 || drop > 25) return 'tilted';
    if (drop > 15) return 'cold';
    if (drop < -10) return 'hot';
    return 'stable';
  }

  private static assessTiltIndicators(games: AggregatedMatchData[], current: AggregatedMatchData): any {
    return {
      deaths: games.reduce((sum, game) => sum + game.avgKills, 0) / games.length,
      timeSinceWin: games.length * 20, // estimated minutes
      performanceDrop: this.calculatePerformanceDrop(games, current)
    };
  }

  private static generateMomentumRecommendations(momentum: string, indicators: any): any {
    switch (momentum) {
      case 'tilted':
        return {
          action: 'take_break',
          duration: 15,
          activity: 'Creative practice or step away',
          reasoning: 'Performance drop indicates tilt. Take a break to reset mental state.'
        };
      case 'cold':
        return {
          action: 'practice_mode',
          duration: 20,
          activity: 'Creative drills',
          reasoning: 'Performance declining. Focus on fundamentals in practice mode.'
        };
      case 'hot':
        return {
          action: 'continue',
          reasoning: 'Great momentum! Keep playing and building on this success.'
        };
      default:
        return {
          action: 'continue',
          reasoning: 'Stable performance. Continue with current approach.'
        };
    }
  }

  private static calculateSynergyMetrics(data: any): any {
    return {
      assistRate: 0.65,
      reviveRate: 0.45,
      surgeContribution: 0.70,
      clutchPotential: 0.60,
      communicationScore: 0.75,
      roleClarity: 0.80
    };
  }

  private static calculateIndividualContributions(members: string[], data: any): any {
    const contributions: any = {};
    members.forEach(member => {
      contributions[member] = {
        surgeDamage: Math.random() * 1000,
        assists: Math.floor(Math.random() * 10),
        revives: Math.floor(Math.random() * 5),
        clutchMoments: Math.floor(Math.random() * 3),
        leadershipScore: Math.random()
      };
    });
    return contributions;
  }

  private static identifyTeamStrengths(metrics: any): string[] {
    const strengths = [];
    if (metrics.assistRate > 0.6) strengths.push('Strong teamwork');
    if (metrics.communicationScore > 0.7) strengths.push('Good communication');
    if (metrics.roleClarity > 0.8) strengths.push('Clear roles');
    return strengths;
  }

  private static identifyTeamWeaknesses(metrics: any): string[] {
    const weaknesses = [];
    if (metrics.surgeContribution > 0.8) weaknesses.push('Over-reliance on one player');
    if (metrics.clutchPotential < 0.5) weaknesses.push('Late game struggles');
    return weaknesses;
  }

  private static generateTeamRecommendations(metrics: any, contributions: any): any {
    return {
      primary: 'Share surge damage burden across team members',
      secondary: 'Improve late game coordination',
      teamDrills: ['Team communication drills', 'Surge control practice', 'Late game scenarios']
    };
  }

  private static analyzeLast20Games(games: AggregatedMatchData[]): any {
    return {
      avgSurvivalTime: games.reduce((sum, game) => sum + game.avgSurvivalTime, 0) / games.length,
      avgPlacement: games.reduce((sum, game) => sum + game.avgPlacement, 0) / games.length,
      consistencyScore: this.calculateConsistencyScore(games),
      keyHabits: ['Early rotations', 'Mats conservation', 'Team coordination'],
      improvementAreas: ['Late game positioning', 'Surge control', 'Communication']
    };
  }

  private static calculateConsistencyScore(games: AggregatedMatchData[]): number {
    const placements = games.map(game => game.avgPlacement);
    const variance = this.calculateVariance(placements);
    return Math.max(0, 100 - variance * 2);
  }

  private static calculateVariance(values: number[]): number {
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
    return squaredDiffs.reduce((sum, diff) => sum + diff, 0) / values.length;
  }

  private static determinePrepLevel(analysis: any): 'beginner' | 'intermediate' | 'advanced' | 'pro' {
    if (analysis.consistencyScore > 80 && analysis.avgSurvivalTime > 12) return 'pro';
    if (analysis.consistencyScore > 60 && analysis.avgSurvivalTime > 10) return 'advanced';
    if (analysis.consistencyScore > 40 && analysis.avgSurvivalTime > 8) return 'intermediate';
    return 'beginner';
  }

  private static generateTournamentChecklist(analysis: any): any {
    return {
      rotations: {
        early: analysis.avgSurvivalTime > 10,
        mid: analysis.consistencyScore > 50,
        late: analysis.avgPlacement < 30,
        stormAwareness: analysis.avgSurvivalTime > 9
      },
      surgePlan: {
        positioning: analysis.avgPlacement < 25,
        timing: analysis.consistencyScore > 60,
        teamCoordination: true
      },
      commsFocus: {
        callouts: true,
        strategy: analysis.consistencyScore > 70,
        morale: true
      },
      mentalPrep: {
        confidence: analysis.avgSurvivalTime > 8,
        focus: analysis.consistencyScore > 50,
        stressManagement: true
      }
    };
  }

  private static generatePersonalizedPrepPlan(analysis: any, level: string): any {
    return {
      focusAreas: analysis.improvementAreas,
      practiceDrills: ['Raider464 Aim Trainer', 'Mats Efficiency Realistics', 'Rotation Timing Arena'],
      mentalPrep: ['Confidence building', 'Focus techniques', 'Stress management'],
      goals: [`Achieve ${analysis.avgSurvivalTime + 2} min survival`, 'Improve consistency', 'Team coordination']
    };
  }

  private static getRegionalPatterns(region: string): string[] {
    const patterns: { [key: string]: string[] } = {
      na_east: ['Aggressive early game', 'High surge damage', 'Fast rotations'],
      eu: ['Methodical approach', 'Team coordination', 'Late game focus'],
      na_west: ['Creative strategies', 'Adaptive playstyle', 'Resource management']
    };
    return patterns[region] || patterns.na_east;
  }

  private static generateMetaRecommendations(regionalData: any, userPerformance: AggregatedMatchData): any {
    return {
      poiSuggestions: regionalData.popularPOIs
        .filter((poi: any) => poi.surgeCongestion < 70)
        .map((poi: any) => poi.poi),
      strategyAdjustments: ['Consider alternative POIs', 'Adapt to regional meta', 'Focus on strengths'],
      metaAdaptations: ['Early rotations', 'Surge control', 'Team coordination']
    };
  }

  private static calculatePlayerLevel(performance: AggregatedMatchData, historical: AggregatedMatchData[]): number {
    const baseLevel = Math.floor(performance.avgSurvivalTime / 3);
    const consistencyBonus = historical.length > 10 ? 2 : 0;
    return Math.min(50, Math.max(1, baseLevel + consistencyBonus));
  }

  private static generateBadges(performance: AggregatedMatchData, historical: AggregatedMatchData[]): any[] {
    const badges = [];
    
    if (performance.avgSurvivalTime > 15) {
      badges.push({
        id: 'survival_master',
        name: 'Survival Master',
        description: 'Survived 15+ minutes consistently',
        category: 'survival',
        rarity: 'legendary',
        unlockedAt: new Date(),
        progress: 100
      });
    }
    
    if (performance.accuracy.current > 40) {
      badges.push({
        id: 'accuracy_ace',
        name: 'Accuracy Ace',
        description: 'Achieved 40%+ accuracy',
        category: 'accuracy',
        rarity: 'epic',
        unlockedAt: new Date(),
        progress: 100
      });
    }
    
    if (performance.matsUsedPerFight.current < 120) {
      badges.push({
        id: 'mats_efficiency_tier2',
        name: 'Mats Efficiency Tier 2',
        description: 'Average <120 mats per fight',
        category: 'efficiency',
        rarity: 'rare',
        unlockedAt: new Date(),
        progress: 100
      });
    }
    
    return badges;
  }

  private static generateAchievements(performance: AggregatedMatchData, historical: AggregatedMatchData[]): any[] {
    return [
      {
        id: 'first_session',
        name: 'First Steps',
        description: 'Completed your first coaching session',
        unlockedAt: new Date(),
        milestone: 'Session 1'
      },
      {
        id: 'consistency_master',
        name: 'Consistency Master',
        description: 'Maintained consistent performance over 10 sessions',
        unlockedAt: new Date(),
        milestone: '10 Sessions'
      }
    ];
  }

  private static calculateStreaks(historical: AggregatedMatchData[]): any {
    return {
      currentStreak: {
        type: 'improvement',
        duration: 5,
        description: '5 games of improving performance'
      },
      longestStreak: {
        type: 'consistency',
        duration: 12,
        achievedAt: new Date()
      }
    };
  }

  private static generateWeeklyGoals(performance: AggregatedMatchData): any {
    return {
      primary: 'Improve survival time to 12+ minutes',
      secondary: 'Reduce mats per fight by 20%',
      progress: 65,
      deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    };
  }

  private static calculateLeaderboardPosition(userId: string, performance: AggregatedMatchData): any {
    return {
      rank: Math.floor(Math.random() * 100) + 1,
      category: 'Overall Performance',
      score: Math.floor(performance.avgSurvivalTime * 10 + performance.accuracy.current * 2)
    };
  }

  private static calculateTotalXP(performance: AggregatedMatchData, historical: AggregatedMatchData[]): number {
    return historical.length * 100 + performance.avgSurvivalTime * 10;
  }

  private static calculateCurrentXP(performance: AggregatedMatchData): number {
    return performance.avgSurvivalTime * 10;
  }

  private static calculateXPToNextLevel(level: number): number {
    return (level + 1) * 1000;
  }

  private static determineDrillPriority(drill: any, performance: AggregatedMatchData): 'high' | 'medium' | 'low' {
    if (drill.category === 'mats_efficiency' && performance.matsEfficiencyChange > 20) return 'high';
    if (drill.category === 'accuracy' && performance.accuracyChange < -10) return 'high';
    return 'medium';
  }

  private static generateDrillReason(drill: any, performance: AggregatedMatchData): string {
    switch (drill.category) {
      case 'mats_efficiency':
        return `Your mats usage increased by ${performance.matsEfficiencyChange.toFixed(1)}% - this drill will help you build more efficiently.`;
      case 'accuracy':
        return `Your accuracy dropped by ${Math.abs(performance.accuracyChange).toFixed(1)}% - practice will help you regain your aim.`;
      default:
        return 'This drill will help improve your overall performance.';
    }
  }

  private static generateExpectedOutcome(drill: any): string {
    return `Complete this drill to improve your ${drill.category} skills and see measurable progress in your next games.`;
  }
}
