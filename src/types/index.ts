export interface User {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  epicId?: string;
  discordId?: string;
  persona: 'casual' | 'creative' | 'competitive';
  subscription?: {
    plan: 'free' | 'paid' | 'pro';
    status: 'active' | 'canceled' | 'past_due';
    currentPeriodEnd?: Date;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface FortniteStats {
  account?: {
    id: string;
    name: string;
    platform: string;
  };
  stats?: {
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
  };
  recentMatches?: any[];
  preferences?: {
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
  osirionData?: {
    totalMatches: number;
    assists: number;
    events: any[];
  };
  usage?: {
    current: number;
    limit: number;
    resetDate: Date;
  };
}

export interface ChatMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  userId: string;
}

export interface AICoachingSession {
  id: string;
  userId: string;
  messages: ChatMessage[];
  persona: 'casual' | 'creative' | 'competitive';
  createdAt: Date;
  updatedAt: Date;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  interval: 'month' | 'year';
  features: string[];
  stripePriceId: string;
}

export interface Persona {
  id: 'casual' | 'creative' | 'competitive';
  name: string;
  description: string;
  icon: string;
  color: string;
}

// Drone spawn data types
export interface DroneSpawnLocation {
  name: string;
  coordinates: { x: number; y: number };
  spawnRate: string;
  spawnFrequency: string;
  lootTier: string;
  strategicValue: 'high' | 'medium' | 'low';
  notes: string[];
}

export interface DroneSpawnData {
  locations: DroneSpawnLocation[];
  spawnMechanics: {
    timing: string;
    frequency: string;
    lootQuality: string;
    strategicAdvantage: string;
  };
  tournamentStrategy: {
    earlyGame: string;
    midGame: string;
    endGame: string;
    riskAssessment: string;
  };
}

// New Osirion API types
export interface OsirionMatch {
  id: string;
  timestamp: Date;
  placement: number;
  kills: number;
  assists: number;
  damage: number;
  survivalTime: number;
  events: OsirionEvent[];
}

export interface OsirionEvent {
  type: 'EliminationEvent' | 'ReviveEvent' | 'RebootEvent' | 'ZoneEvent' | 'ItemEvent';
  timestamp: number;
  data: any;
}

export interface OsirionStats {
  accountId: string;
  username: string;
  platform: string;
  matches: OsirionMatch[];
  summary: {
    totalMatches: number;
    wins: number;
    top10: number;
    kills: number;
    assists: number;
    avgPlacement: number;
    avgKills: number;
    avgSurvivalTime: number;
  };
}

export interface OsirionReplayUpload {
  id: string;
  matchId: string;
  status: 'uploading' | 'processing' | 'completed' | 'failed';
  analysis?: any;
  createdAt: Date;
}

export interface OsirionComputeRequest {
  id: string;
  type: 'match_analysis' | 'replay_analysis' | 'performance_prediction';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  result?: any;
  createdAt: Date;
  completedAt?: Date;
}

// Usage tracking types
export interface UsageLimits {
  osirion: {
    matchesPerMonth: number;
    eventTypesPerMatch: number;
    replayUploadsPerMonth: number;
    computeRequestsPerMonth: number;
  };
  ai: {
    messagesPerMonth: number;
  };
}

export interface CurrentUsage {
  osirion: {
    matchesUsed: number;
    replayUploadsUsed: number;
    computeRequestsUsed: number;
  };
  ai: {
    messagesUsed: number;
  };
  resetDate: Date;
}

export interface SubscriptionTier {
  id: 'free' | 'paid' | 'pro';
  name: string;
  price: number;
  currency: string;
  limits: UsageLimits;
  features: string[];
}

// POI (Points of Interest) types for location-based coaching
export interface POILocation {
  name: string;
  zoneNumber: number;
  lootScore: number;
  metalAmount: number;
  avgTeams: number;
  survivalRate: number;
  overallRating?: string;
  coordinates?: {
    x: number;
    y: number;
  };
}

export interface POIAnalysis {
  bestDropLocations: POILocation[];
  safestLocations: POILocation[];
  highestLootLocations: POILocation[];
  bestBuildingLocations: POILocation[];
  recommendations: {
    aggressive: POILocation[];
    passive: POILocation[];
    balanced: POILocation[];
  };
}

export interface DropLocationStrategy {
  playerStyle: 'aggressive' | 'passive' | 'balanced';
  recommendedLocations: POILocation[];
  strategy: string;
  tips: string[];
}

// Tournament and Competitive types
export interface TournamentDivision {
  id: number;
  name: string;
  description: string;
  qualifyingCriteria: string;
  playerCount: number;
  hasElo: boolean;
  surgeFrequency: 'high' | 'medium' | 'low';
  strategy: string;
  tips: string[];
}

export interface TournamentInfo {
  name: string;
  season: string;
  type: 'FNCS' | 'Cash Cup' | 'Practice Cup';
  format: 'Trio' | 'Duo' | 'Solo';
  divisions: TournamentDivision[];
  pointsSystem: {
    win: number;
    eliminations: {
      div1: number;
      div2Plus: number;
    };
    placement: string;
  };
  loadoutRecommendations: {
    shotgun: string[];
    ar: string[];
    mobility: string[];
    heals: string[];
  };
}

export interface CompetitiveStrategy {
  division: number;
  playstyle: 'placement' | 'aggressive' | 'balanced';
  earlyGame: string;
  midGame: string;
  endGame: string;
  surgeStrategy: string;
  loadoutPriority: string[];
}

// Live Tournament Updates types
export interface LiveTournamentUpdate {
  id: string;
  tournamentName: string;
  region: 'EU' | 'NA' | 'OCE' | 'ASIA';
  timestamp: string;
  updates: TournamentPointUpdate[];
  queueInfo?: string;
  notes?: string;
}

export interface TournamentPointUpdate {
  rank: string;
  points: number;
  timestamp: string;
  notes?: string;
}

export interface TournamentBreakdown {
  rank: string;
  points: number;
  example: {
    wins: number;
    top5s: number;
    top10s: number;
    top20s: number;
    elimsPerGame: number;
    spareGames: number;
  };
}

export interface IconReloadCup {
  name: string;
  format: string;
  duration: string;
  games: number;
  hasElo: boolean;
  regionLocked: boolean;
  liveUpdates: LiveTournamentUpdate[];
}

export interface ConsoleVictoryCashCup {
  name: string;
  format: string;
  duration: string;
  games: number;
  hasElo: boolean;
  regionLocked: boolean;
  liveUpdates: LiveTournamentUpdate[];
  breakdown: TournamentBreakdown;
}

export interface BladeOfChampionsCup {
  name: string;
  format: string;
  duration: string;
  games: number;
  hasElo: boolean;
  regionLocked: boolean;
  qualification: string;
  preRoundEstimate: {
    points: number;
    range: string;
    notes: string;
  };
}
