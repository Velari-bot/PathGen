export interface User {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  epicId?: string;
  discordId?: string;
  persona: 'casual' | 'creative' | 'competitive';
  subscription?: {
    plan: 'free' | 'pro' | 'premium';
    status: 'active' | 'canceled' | 'past_due';
    currentPeriodEnd?: Date;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface FortniteStats {
  epicId: string;
  kd: number;
  winPercentage: number;
  averagePlacement: number;
  creativeBuildsCompleted: number;
  totalMatches: number;
  lastUpdated: Date;
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
