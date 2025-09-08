// Pathgen AI Match Analysis Schema

export interface MatchData {
  userId: string;
  matchId: string;
  date: string; // ISO string
  
  // Basic match info
  poi: string; // Point of Interest where player landed
  survivalTime: number; // minutes alive
  placement: number; // final placement
  kills: number;
  assists: number;
  damageDealt: number;
  damageTaken: number;
  
  // Advanced metrics
  stormDamage: number; // how much storm damage taken
  rotationTiming: 'early' | 'mid' | 'late'; // relative to zones
  
  // Materials tracking
  materials: {
    matsGathered: number;
    matsUsed: number;
    matsUsedPerFight: number;
  };
  
  // Accuracy metrics
  accuracy: {
    shotsFired: number;
    shotsHit: number;
    hitRate: number; // percentage
  };
  
  // Death analysis
  deaths: {
    cause: string; // e.g., "lost height in midgame", "third-party fight"
    fightType: string; // e.g., "2v1", "1v1", "team fight"
  };
}

export interface AggregatedMatchData {
  userId: string;
  gamesAnalyzed: number;
  
  // Performance averages
  avgSurvivalTime: number;
  prevAvgSurvivalTime: number;
  avgPlacement: number;
  avgKills: number;
  avgDamageDealt: number;
  avgDamageTaken: number;
  
  // Accuracy trends
  accuracy: {
    current: number;
    previous: number;
  };
  
  // Materials usage trends
  matsUsedPerFight: {
    current: number;
    previous: number;
  };
  
  // Strategic patterns
  mostCommonPOIs: string[];
  rotationTrend: 'early' | 'mid' | 'late';
  mostCommonDeathCause: string;
  
  // Performance changes
  survivalTimeChange: number; // percentage change
  accuracyChange: number; // percentage change
  matsEfficiencyChange: number; // percentage change
}

export interface CoachingInsight {
  observation: string; // What happened in recent games
  trend: string; // Comparison to past performance
  advice: string; // Actionable coaching tips
  encouragement: string; // Positive reinforcement and next steps
}

export interface AICoachingResponse {
  quick_fix: string;
  detailed_analysis: string[];
  action_plan: string[];
  tone: 'motivator' | 'tactical' | 'strict' | 'chill';
  insights?: CoachingInsight;
  matchData?: AggregatedMatchData;
}
