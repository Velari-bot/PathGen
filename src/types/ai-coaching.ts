// AI Coaching Response Types
export interface AICoachingResponse {
  quick_fix: string;
  detailed_analysis: string[];
  action_plan: string[];
  tone: 'motivator' | 'tactical' | 'strict' | 'chill';
}

export interface AICoachingRequest {
  message: string;
  userProfile?: {
    epicId?: string;
    displayName?: string;
    skillLevel?: 'beginner' | 'competitive' | 'pro';
    playstyle?: 'aggressive' | 'passive' | 'balanced';
  };
  recentStats?: {
    kd: number;
    winRate: number;
    avgPlacement: number;
    accuracy: number;
    matsUsed: number;
    deaths: number;
    matches: number;
  };
  replayData?: {
    fileName: string;
    uploadDate: Date;
    analysisResults?: any;
  };
  conversationHistory?: Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
  }>;
}

export interface CreditUsage {
  feature: 'chat' | 'replay_upload' | 'osirion_pull' | 'stats_lookup' | 'tournament_strategy' | 'poi_analysis';
  cost: number;
  timestamp: Date;
  success: boolean;
  metadata?: any;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  epicId?: string;
  skillLevel?: 'beginner' | 'competitive' | 'pro';
  playstyle?: 'aggressive' | 'passive' | 'balanced';
  subscription?: {
    tier: 'free' | 'pro';
    status: 'active' | 'inactive' | 'cancelled';
    expiresAt?: Date;
  };
  usage?: {
    creditsUsed: number;
    creditsTotal: number;
    lastUsed: Date;
    featuresUsed: string[];
  };
  createdAt: Date;
  lastLogin: Date;
}

export interface Conversation {
  chatId: string;
  userId: string;
  messages: Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    aiResponse?: AICoachingResponse;
  }>;
  createdAt: Date;
  lastUpdated: Date;
  messageCount: number;
}
