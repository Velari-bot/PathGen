/**
 * Tournament System Types for PathGen
 */

export interface TournamentSeries {
  id: string;
  name: string; // e.g., "C6S4 Solo Series"
  season: string; // e.g., "C6S4"
  mode: 'solo' | 'duo' | 'trio' | 'squad';
  region: 'NAC' | 'EU' | 'OCE' | 'ASIA' | 'BR' | 'ME';
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  totalWeeks: number;
  qualifyingThreshold: number; // Points needed to qualify for finals
  
  // Point system
  pointSystem: {
    winPoints: number;
    eliminationPoints: number;
    placementPoints: {
      [placement: string]: number; // e.g., "1": 60, "2-5": 50, etc.
    };
  };
}

export interface TournamentWeek {
  id: string;
  seriesId: string;
  weekNumber: number;
  name: string; // e.g., "C6S4 SOLO SERIES #1"
  date: Date;
  region: string;
  isCompleted: boolean;
  
  // Live point thresholds (flexible for different formats)
  pointThresholds: {
    // Standard format (Solo Series, Trials)
    top100?: number;
    top500?: number;
    top1000?: number;
    top2500?: number;
    top7500?: number;
    top3000?: number;
    top13000?: number;
    // Division format (Division Cups)
    div1?: number;
    div2?: number;
    div3?: number;
    div4?: number;
    div5?: number;
    updatedAt: Date;
  };
  
  // Pre-round estimates (flexible for different formats)
  estimates: {
    // Standard format
    top100?: number;
    top500?: number;
    top1000?: number;
    top2500?: number;
    top7500?: number;
    top3000?: number;
    top13000?: number;
    // Division format
    div1?: number;
    div2?: number;
    div3?: number;
    div4?: number;
    div5?: number;
  };
  
  // Final results (flexible for different formats)
  finalResults?: {
    // Standard format
    top100?: number;
    top500?: number;
    top1000?: number;
    top2500?: number;
    top7500?: number;
    top3000?: number;
    top13000?: number;
    // Division format
    div1?: number;
    div2?: number;
    div3?: number;
    div4?: number;
    div5?: number;
  };
}

export interface TournamentStrategy {
  id: string;
  title: string;
  category: 'general' | 'loadout' | 'rotation' | 'endgame' | 'dropspot';
  targetSkillLevel: 'beginner' | 'intermediate' | 'advanced' | 'pro';
  targetGoal: 'placement' | 'elimination' | 'qualification' | 'pr_gain';
  content: string;
  tips: string[];
  applicableRegions: string[];
  lastUpdated: Date;
  
  // Strategy effectiveness
  effectiveness: {
    placement: number; // 1-10 rating
    consistency: number; // 1-10 rating
    skillRequired: number; // 1-10 rating
  };
}

export interface UserTournamentPerformance {
  id: string;
  userId: string;
  seriesId: string;
  weekId: string;
  
  // Performance data
  totalPoints: number;
  finalPlacement: number;
  totalGames: number;
  
  // Game breakdown
  games: TournamentGame[];
  
  // Analysis
  consistency: number; // Standard deviation of placements
  averageEliminations: number;
  averagePlacement: number;
  
  // Goals and progress
  targetPoints: number;
  targetPlacement: number;
  achievedGoal: boolean;
  
  createdAt: Date;
  updatedAt: Date;
}

export interface TournamentGame {
  gameNumber: number;
  placement: number;
  eliminations: number;
  points: number;
  
  // Optional detailed stats
  damageDealt?: number;
  buildingDestroyed?: number;
  survivalTime?: number;
  loadout?: string[];
  
  // Game analysis
  keyMistakes?: string[];
  goodPlays?: string[];
  improvementAreas?: string[];
}

export interface TournamentCalculator {
  currentPoints: number;
  gamesRemaining: number;
  targetPoints: number;
  
  // Calculation results
  requiredAverage: number;
  possibleScenarios: CalculationScenario[];
  recommendations: string[];
}

export interface CalculationScenario {
  description: string;
  games: {
    placement: string;
    eliminations: number;
    points: number;
  }[];
  totalPoints: number;
  difficulty: 'easy' | 'medium' | 'hard' | 'very_hard';
  probability: number; // Estimated success rate
}

export interface TournamentMeta {
  id: string;
  week: string;
  region: string;
  
  // Current meta information
  popularDropspots: {
    name: string;
    popularity: number; // percentage
    avgPlacement: number;
    riskLevel: 'low' | 'medium' | 'high';
  }[];
  
  popularLoadouts: {
    weapons: string[];
    heals: string[];
    mobility: string[];
    usage: number; // percentage
    effectiveness: number; // 1-10 rating
  }[];
  
  // Key strategies
  rotationMeta: {
    strategy: string;
    description: string;
    effectiveness: number;
  }[];
  
  // Known bugs and issues
  knownIssues: {
    issue: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    workaround?: string;
  }[];
  
  lastUpdated: Date;
}

export interface TournamentCoaching {
  userId: string;
  weekId: string;
  
  // AI-generated coaching
  preGameStrategy: string;
  midGameAdjustments: string;
  postGameAnalysis: string;
  
  // Personalized recommendations
  recommendedLoadout: string[];
  recommendedDropspots: string[];
  playStyle: 'aggressive' | 'passive' | 'balanced';
  
  // Goals and targets
  recommendedTargetPoints: number;
  confidenceLevel: number; // 1-10
  
  // Progress tracking
  improvementAreas: string[];
  strengths: string[];
  
  generatedAt: Date;
}
