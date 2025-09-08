// Advanced Coaching System - Skill Progression & Personalization

export interface SkillProgression {
  userId: string;
  skillMetrics: {
    survivalTime: {
      current: number;
      previous: number;
      trend: 'improving' | 'declining' | 'stable';
      weeklyChange: number;
      monthlyChange: number;
      allTimeHigh: number;
      allTimeLow: number;
    };
    accuracy: {
      current: number;
      previous: number;
      trend: 'improving' | 'declining' | 'stable';
      weeklyChange: number;
      monthlyChange: number;
      allTimeHigh: number;
      allTimeLow: number;
    };
    matsEfficiency: {
      current: number;
      previous: number;
      trend: 'improving' | 'declining' | 'stable';
      weeklyChange: number;
      monthlyChange: number;
      allTimeHigh: number;
      allTimeLow: number;
    };
    placement: {
      current: number;
      previous: number;
      trend: 'improving' | 'declining' | 'stable';
      weeklyChange: number;
      monthlyChange: number;
      allTimeHigh: number;
      allTimeLow: number;
    };
  };
  lastUpdated: Date;
  sessionCount: number;
  totalSessions: number;
}

export interface RoleSpecificInsights {
  solo: {
    strengths: string[];
    weaknesses: string[];
    focusAreas: string[];
    specificAdvice: string[];
  };
  duo: {
    strengths: string[];
    weaknesses: string[];
    focusAreas: string[];
    specificAdvice: string[];
  };
  trio: {
    strengths: string[];
    weaknesses: string[];
    focusAreas: string[];
    specificAdvice: string[];
  };
}

export interface FocusPriority {
  primaryFocus: {
    skill: string;
    impact: 'high' | 'medium' | 'low';
    confidence: number; // 0-100
    reason: string;
    specificAction: string;
  };
  secondaryFocus: {
    skill: string;
    impact: 'high' | 'medium' | 'low';
    confidence: number;
    reason: string;
    specificAction: string;
  };
  ignoreForNow: string[];
}

export interface ProBenchmark {
  skill: string;
  playerValue: number;
  proAverage: number;
  proTop10: number;
  gap: number; // percentage difference
  achievable: boolean;
  timeframe: string; // "2 weeks", "1 month", etc.
}

export interface SessionSummary {
  sessionId: string;
  userId: string;
  date: Date;
  gamesAnalyzed: number;
  keyInsights: string[];
  improvements: string[];
  regressions: string[];
  focusForNextSession: string[];
  practiceDrill: {
    name: string;
    description: string;
    duration: string;
    creativeCode?: string;
  };
  motivation: string;
}

export interface WeeklyReport {
  weekId: string;
  userId: string;
  startDate: Date;
  endDate: Date;
  gamesAnalyzed: number;
  overallProgress: {
    accuracy: number; // percentage change
    survivalTime: number; // percentage change
    placement: number; // percentage change
    matsEfficiency: number; // percentage change
  };
  biggestImprovement: string;
  biggestChallenge: string;
  focusForNextWeek: string[];
  goalsForNextWeek: {
    primary: string;
    secondary: string;
    measurable: string; // specific metric to track
  };
  motivation: string;
  achievements: string[];
}

export interface PersonalizedCoaching {
  userId: string;
  coachingStyle: 'motivator' | 'tactical' | 'strict' | 'chill';
  preferredMode: 'solo' | 'duo' | 'trio';
  skillLevel: 'beginner' | 'intermediate' | 'advanced' | 'pro';
  personalityTraits: {
    respondsTo: 'encouragement' | 'challenges' | 'data' | 'examples';
    learningStyle: 'visual' | 'practical' | 'analytical';
    motivationType: 'competition' | 'improvement' | 'recognition';
  };
  coachingHistory: {
    lastSession: Date;
    totalSessions: number;
    averageSessionLength: number;
    preferredAdviceType: string[];
    ignoredAdvice: string[];
  };
  longTermGoals: string[];
  currentStreak: {
    type: 'improvement' | 'consistency' | 'breakthrough';
    duration: number; // days
    description: string;
  };
}
