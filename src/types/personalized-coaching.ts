// Advanced Personalization & Gamification System

export interface CoachingStyle {
  mode: 'strict' | 'mentor' | 'tactical' | 'chill';
  intensity: 'high' | 'medium' | 'low';
  focusAreas: string[];
  preferredLanguage: 'direct' | 'encouraging' | 'analytical' | 'casual';
  responseLength: 'concise' | 'detailed' | 'comprehensive';
}

export interface MomentumAnalysis {
  userId: string;
  currentMomentum: 'hot' | 'cold' | 'stable' | 'tilted';
  performanceStreak: {
    type: 'positive' | 'negative' | 'mixed';
    duration: number; // games
    trend: 'improving' | 'declining' | 'stable';
  };
  tiltIndicators: {
    recentDeaths: number;
    performanceDrop: number; // percentage
    timeSinceLastWin: number; // minutes
    consecutiveLosses: number;
  };
  recommendations: {
    action: 'continue' | 'take_break' | 'practice_mode' | 'reset_session';
    duration?: number; // minutes
    activity?: string;
    reasoning: string;
  };
}

export interface TeamSynergyAnalysis {
  teamId: string;
  teamMembers: string[];
  synergyMetrics: {
    assistRate: number;
    reviveRate: number;
    surgeContribution: number; // percentage
    clutchPotential: number;
    communicationScore: number;
    roleClarity: number;
  };
  individualContributions: {
    [userId: string]: {
      surgeDamage: number;
      assists: number;
      revives: number;
      clutchMoments: number;
      leadershipScore: number;
    };
  };
  teamStrengths: string[];
  teamWeaknesses: string[];
  recommendations: {
    primary: string;
    secondary: string;
    teamDrills: string[];
  };
}

export interface EventPrepSession {
  eventId: string;
  eventType: 'fncs' | 'cash_cup' | 'arena' | 'custom';
  eventDate: Date;
  prepLevel: 'beginner' | 'intermediate' | 'advanced' | 'pro';
  last20GamesAnalysis: {
    avgSurvivalTime: number;
    avgPlacement: number;
    consistencyScore: number;
    keyHabits: string[];
    improvementAreas: string[];
  };
  tournamentMindsetChecklist: {
    rotations: {
      early: boolean;
      mid: boolean;
      late: boolean;
      stormAwareness: boolean;
    };
    surgePlan: {
      positioning: boolean;
      timing: boolean;
      teamCoordination: boolean;
    };
    commsFocus: {
      callouts: boolean;
      strategy: boolean;
      morale: boolean;
    };
    mentalPrep: {
      confidence: boolean;
      focus: boolean;
      stressManagement: boolean;
    };
  };
  personalizedPrepPlan: {
    focusAreas: string[];
    practiceDrills: string[];
    mentalPrep: string[];
    goals: string[];
  };
}

export interface MetaAwareness {
  region: 'na_east' | 'na_west' | 'eu' | 'oce' | 'asia';
  currentMeta: {
    popularPOIs: Array<{
      poi: string;
      popularity: number; // percentage
      surgeCongestion: number;
      rotationDifficulty: number;
    }>;
    playstyleTrends: {
      aggressive: number;
      passive: number;
      balanced: number;
    };
    weaponMeta: string[];
    buildingTrends: string[];
  };
  regionalInsights: {
    avgSurvivalTime: number;
    avgKills: number;
    commonStrategies: string[];
    uniquePatterns: string[];
  };
  personalizedRecommendations: {
    poiSuggestions: string[];
    strategyAdjustments: string[];
    metaAdaptations: string[];
  };
}

export interface GamifiedProgress {
  userId: string;
  playerLevel: number;
  totalXP: number;
  currentXP: number;
  xpToNextLevel: number;
  badges: Array<{
    id: string;
    name: string;
    description: string;
    category: 'survival' | 'accuracy' | 'efficiency' | 'consistency' | 'teamwork';
    rarity: 'common' | 'rare' | 'epic' | 'legendary';
    unlockedAt: Date;
    progress: number; // 0-100
  }>;
  achievements: Array<{
    id: string;
    name: string;
    description: string;
    unlockedAt: Date;
    milestone: string;
  }>;
  streaks: {
    currentStreak: {
      type: 'improvement' | 'consistency' | 'achievement';
      duration: number;
      description: string;
    };
    longestStreak: {
      type: string;
      duration: number;
      achievedAt: Date;
    };
  };
  weeklyGoals: {
    primary: string;
    secondary: string;
    progress: number; // 0-100
    deadline: Date;
  };
  leaderboard: {
    rank: number;
    category: string;
    score: number;
  };
}

export interface CoachDrillBank {
  drills: Array<{
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
  }>;
  personalizedDrills: Array<{
    drillId: string;
    assignedAt: Date;
    priority: 'high' | 'medium' | 'low';
    reason: string;
    expectedOutcome: string;
    progress: number; // 0-100
  }>;
  drillHistory: Array<{
    drillId: string;
    completedAt: Date;
    performance: number; // 0-100
    notes: string;
    improvement: number; // percentage
  }>;
}

export interface PersonalizedCoachingProfile {
  userId: string;
  coachingStyle: CoachingStyle;
  momentumAnalysis: MomentumAnalysis;
  teamSynergy?: TeamSynergyAnalysis;
  eventPrep?: EventPrepSession;
  metaAwareness: MetaAwareness;
  gamifiedProgress: GamifiedProgress;
  drillBank: CoachDrillBank;
  preferences: {
    notificationFrequency: 'immediate' | 'daily' | 'weekly';
    coachingIntensity: 'light' | 'moderate' | 'intensive';
    focusAreas: string[];
    learningStyle: 'visual' | 'practical' | 'analytical';
    motivationType: 'achievement' | 'improvement' | 'competition';
  };
  lastUpdated: Date;
}
