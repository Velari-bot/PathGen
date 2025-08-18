import { 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit, 
  collection,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  Timestamp,
  addDoc,
  increment
} from 'firebase/firestore';
import { db } from './firebase';

// Type assertion for db - we know it will be available at runtime
const firestoreDb = db!;

// New interfaces for the enhanced database structure
export interface Chat {
  id: string;
  userId: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
  messageCount: number;
  
  // Chat metadata
  type: 'coaching' | 'analysis' | 'strategy' | 'general' | 'tournament';
  status: 'active' | 'archived' | 'deleted';
  tags: string[];
  
  // Linked Fortnite data
  linkedFortniteData?: {
    epicId?: string;
    epicName?: string;
    stats?: Partial<FortniteStats>;
    lastSync?: Date;
  };
  
  // AI coaching specific
  coachingSession?: {
    focusArea: 'building' | 'aim' | 'positioning' | 'gameSense' | 'mechanics' | 'general';
    skillLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert';
    goals: string[];
    progress: number;
    nextSteps: string[];
  };
  
  // Performance tracking
  performance?: {
    beforeStats?: Partial<FortniteStats>;
    afterStats?: Partial<FortniteStats>;
    improvementAreas: string[];
    goalsMet: string[];
    goalsMissed: string[];
  };
}

export interface ChatMessage {
  id: string;
  chatId: string;
  userId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  
  // Message metadata
  type: 'text' | 'image' | 'file' | 'stats' | 'analysis';
  
  // AI-specific fields
  aiResponse?: {
    model: string;
    confidence: number;
    suggestions: string[];
    relatedTopics: string[];
    followUpQuestions: string[];
    tokensUsed: number;
  };
  
  // User message metadata
  userMessage?: {
    intent: string;
    sentiment: 'positive' | 'negative' | 'neutral';
    containsStats: boolean;
    containsReplay: boolean;
    questionType?: 'how-to' | 'why' | 'what-if' | 'comparison' | 'general';
  };
  
  // Attachments
  attachments?: {
    type: 'image' | 'file' | 'stats' | 'replay';
    url?: string;
    filename?: string;
    size?: number;
    metadata?: any;
  }[];
  
  // Context
  context?: {
    previousMessages: string[];
    currentTopic: string;
    userStats?: Partial<FortniteStats>;
    sessionGoals?: string[];
  };
}

export interface UsageLog {
  id: string;
  userId: string;
  timestamp: Date;
  requestType: 'chat' | 'data_pull' | 'stats_analysis' | 'replay_upload' | 'tournament_strategy';
  tokensUsed: number;
  cost: number;
  
  // Request details
  details: {
    endpoint?: string;
    duration?: number;
    success: boolean;
    errorMessage?: string;
    metadata?: any;
  };
  
  // Subscription context
  subscriptionTier: 'free' | 'standard' | 'pro';
  remainingTokens: number;
}

export interface Subscription {
  id: string;
  userId: string;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  plan: 'free' | 'standard' | 'pro';
  status: 'active' | 'canceled' | 'paused' | 'past_due' | 'unpaid';
  
  // Billing details
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  canceledAt?: Date;
  
  // Plan limits
  limits: {
    monthlyMessages: number;
    monthlyTokens: number;
    monthlyDataPulls: number;
    replayUploads: number;
    tournamentStrategies: number;
    prioritySupport: boolean;
    advancedAnalytics: boolean;
  };
  
  // Usage tracking
  usage: {
    messagesUsed: number;
    tokensUsed: number;
    dataPullsUsed: number;
    replayUploadsUsed: number;
    tournamentStrategiesUsed: number;
    resetDate: Date;
  };
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

export interface FortniteData {
  id: string;
  userId: string;
  epicId: string;
  epicName: string;
  syncedAt: Date;
  
  // Raw data from APIs for comprehensive analysis
  rawOsirionData?: any; // Complete Osirion API response
  rawEpicData?: any; // Complete Epic API response
  
  // Stats
  stats: {
    wins: number;
    kd: number;
    placement: number;
    earnings: number;
    matches: number;
    top1: number;
    top3: number;
    top5: number;
    top10: number;
    top25: number;
    kills: number;
    deaths: number;
    assists: number;
    damageDealt: number;
    damageTaken: number;
    timeAlive: number;
    distanceTraveled: number;
    materialsGathered: number;
    structuresBuilt: number;
  };
  
  // Mode-specific data
  modes: {
    solo?: Partial<FortniteStats['solo']>;
    duo?: Partial<FortniteStats['duo']>;
    squad?: Partial<FortniteStats['squad']>;
    arena?: Partial<FortniteStats['arena']>;
  };
  
  // Tournament data
  tournaments?: {
    totalTournaments: number;
    bestPlacement: number;
    totalWinnings: number;
    averagePlacement: number;
    tournamentsWon: number;
    top3Finishes: number;
    top10Finishes: number;
  };
  
  // Data source
  dataSource: 'osirion' | 'epic' | 'manual';
  dataQuality: 'high' | 'medium' | 'low';
  notes?: string;
}

export interface EpicAccount {
  id: string;
  epicId: string;
  displayName: string;
  platform: string;
  userId: string;
  linkedAt: Date;
  isReal: boolean;
  note?: string;
  // Additional Epic account fields
  accountId?: string;
  country?: string;
  preferredLanguage?: string;
  email?: string;
  lastLogin?: Date;
  status?: 'active' | 'inactive' | 'banned';
  verificationStatus?: 'verified' | 'unverified' | 'pending';
}

export interface FortniteStats {
  id: string;
  userId: string;
  epicId: string;
  epicName: string;
  platform: string;
  lastUpdated: Date;
  
  // Overall stats
  overall: {
    kd: number;
    winRate: number;
    matches: number;
    avgPlace: number;
    top1: number;
    top3: number;
    top5: number;
    top10: number;
    top25: number;
    kills: number;
    deaths: number;
    assists: number;
    damageDealt: number;
    damageTaken: number;
    timeAlive: number;
    distanceTraveled: number;
    materialsGathered: number;
    structuresBuilt: number;
  };
  
  // Mode-specific stats
  solo?: {
    kd: number;
    winRate: number;
    matches: number;
    avgPlace: number;
    top1: number;
    top3: number;
    top5: number;
    top10: number;
    top25: number;
    kills: number;
    deaths: number;
    assists: number;
    damageDealt: number;
    damageTaken: number;
    timeAlive: number;
    distanceTraveled: number;
    materialsGathered: number;
    structuresBuilt: number;
  };
  
  duo?: {
    kd: number;
    winRate: number;
    matches: number;
    avgPlace: number;
    top1: number;
    top3: number;
    top5: number;
    top10: number;
    top25: number;
    kills: number;
    deaths: number;
    assists: number;
    damageDealt: number;
    damageTaken: number;
    timeAlive: number;
    distanceTraveled: number;
    materialsGathered: number;
    structuresBuilt: number;
  };
  
  squad?: {
    kd: number;
    winRate: number;
    matches: number;
    avgPlace: number;
    top1: number;
    top3: number;
    top5: number;
    top10: number;
    top25: number;
    kills: number;
    deaths: number;
    assists: number;
    damageDealt: number;
    damageTaken: number;
    timeAlive: number;
    distanceTraveled: number;
    materialsGathered: number;
    structuresBuilt: number;
  };
  
  // Arena stats
  arena?: {
    division: number;
    hype: number;
    kd: number;
    winRate: number;
    matches: number;
    avgPlace: number;
    top1: number;
    top3: number;
    top5: number;
    top10: number;
    top25: number;
    kills: number;
    deaths: number;
    assists: number;
    damageDealt: number;
    damageTaken: number;
    timeAlive: number;
    distanceTraveled: number;
    materialsGathered: number;
    structuresBuilt: number;
  };
  
  // Tournament stats
  tournaments?: {
    totalTournaments: number;
    bestPlacement: number;
    totalWinnings: number;
    averagePlacement: number;
    tournamentsWon: number;
    top3Finishes: number;
    top10Finishes: number;
  };
  
  // Weapon stats
  weapons?: {
    favoriteWeapon: string;
    totalEliminations: number;
    weaponAccuracy: number;
    headshotPercentage: number;
    criticalHits: number;
  };
  
  // Vehicle stats
  vehicles?: {
    favoriteVehicle: string;
    totalDistance: number;
    eliminationsInVehicle: number;
    timeInVehicle: number;
  };
  
  // Building stats
  building?: {
    totalStructuresBuilt: number;
    structuresDestroyed: number;
    buildingEfficiency: number;
    editSpeed: number;
    buildingAccuracy: number;
  };
  
  // Social stats
  social?: {
    friendsCount: number;
    followersCount: number;
    followingCount: number;
    teamKills: number;
    friendlyFire: number;
  };
  
  // Performance metrics
  performance?: {
    averageFPS: number;
    ping: number;
    packetLoss: number;
    serverRegion: string;
    lastServerChange?: Date;
  };
  
  // Usage tracking
  usage: {
    current: number;
    limit: number;
    resetDate: Date;
    lastApiCall: Date;
    totalApiCalls: number;
  };
  
  // Metadata
  metadata: {
    season: number;
    chapter: number;
    lastMatchId?: string;
    lastMatchDate?: Date;
    dataSource: 'osirion' | 'epic' | 'manual';
    dataQuality: 'high' | 'medium' | 'low';
    notes?: string;
  };
}

export interface ReplayUpload {
  id: string;
  userId: string;
  epicId: string;
  epicName: string;
  filename: string;
  fileSize: number;
  status: 'uploading' | 'processing' | 'completed' | 'failed';
  createdAt: Date;
  updatedAt: Date;
  
  // Match details
  matchId?: string;
  matchDate?: Date;
  matchMode?: string;
  matchResult?: 'victory' | 'defeat' | 'draw';
  placement?: number;
  playersInMatch?: number;
  
  // Analysis results
  analysisResult?: {
    keyMoments: string[];
    mistakes: string[];
    improvements: string[];
    highlights: string[];
    overallScore: number;
    categoryScores: {
      building: number;
      aim: number;
      positioning: number;
      gameSense: number;
      mechanics: number;
    };
  };
  
  // Processing info
  processingTime?: number;
  analysisVersion?: string;
  aiModel?: string;
  confidence?: number;
}

export interface Conversation {
  id: string;
  userId: string;
  epicId?: string;
  epicName?: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
  messageCount: number;
  
  // Conversation metadata
  type: 'coaching' | 'analysis' | 'strategy' | 'general';
  status: 'active' | 'archived' | 'deleted';
  tags: string[];
  
  // AI coaching specific
  coachingSession?: {
    focusArea: 'building' | 'aim' | 'positioning' | 'gameSense' | 'mechanics' | 'general';
    skillLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert';
    goals: string[];
    progress: number;
    nextSteps: string[];
  };
  
  // Performance tracking
  performance?: {
    beforeStats?: Partial<FortniteStats>;
    afterStats?: Partial<FortniteStats>;
    improvementAreas: string[];
    goalsMet: string[];
    goalsMissed: string[];
  };
}

export interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  
  // Message metadata
  type: 'text' | 'image' | 'file' | 'stats' | 'analysis';
  role: 'user' | 'assistant' | 'system';
  
  // AI-specific fields
  aiResponse?: {
    model: string;
    confidence: number;
    suggestions: string[];
    relatedTopics: string[];
    followUpQuestions: string[];
  };
  
  // User message metadata
  userMessage?: {
    intent: string;
    sentiment: 'positive' | 'negative' | 'neutral';
    containsStats: boolean;
    containsReplay: boolean;
    questionType?: 'how-to' | 'why' | 'what-if' | 'comparison' | 'general';
  };
  
  // Attachments
  attachments?: {
    type: 'image' | 'file' | 'stats' | 'replay';
    url?: string;
    filename?: string;
    size?: number;
    metadata?: any;
  }[];
  
  // Context
  context?: {
    previousMessages: string[];
    currentTopic: string;
    userStats?: Partial<FortniteStats>;
    sessionGoals?: string[];
  };
}

export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  createdAt: Date;
  lastLogin: Date;
  
  // Profile information
  profile: {
    avatar?: string;
    bio?: string;
    location?: string;
    timezone?: string;
    language: string;
    dateOfBirth?: Date;
    gender?: 'male' | 'female' | 'other' | 'prefer-not-to-say';
  };
  
  // Gaming preferences
  gaming: {
    favoriteGame: string;
    skillLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert';
    playStyle: 'aggressive' | 'passive' | 'balanced' | 'support';
    preferredModes: string[];
    teamSize: 'solo' | 'duo' | 'squad' | 'any';
    goals: string[];
  };
  
  // Subscription and usage
  subscription: {
    status: 'free' | 'basic' | 'pro' | 'premium';
    tier: string;
    startDate: Date;
    endDate?: Date;
    autoRenew: boolean;
    paymentMethod?: string;
    stripeCustomerId?: string;
    stripeSubscriptionId?: string;
  };
  
  // Settings
  settings: {
    notifications: {
      email: boolean;
      push: boolean;
      sms: boolean;
      discord: boolean;
    };
    privacy: {
      profilePublic: boolean;
      statsPublic: boolean;
      allowFriendRequests: boolean;
      showOnlineStatus: boolean;
    };
    preferences: {
      theme: 'light' | 'dark' | 'auto';
      language: string;
      timezone: string;
      dateFormat: string;
      timeFormat: '12h' | '24h';
    };
  };
  
  // Statistics
  statistics: {
    totalSessions: number;
    totalTime: number;
    lastActivity: Date;
    favoriteFeatures: string[];
    mostUsedTools: string[];
    improvementAreas: string[];
  };
}

export class FirebaseService {
  // Epic Account Management
  static async saveEpicAccount(epicAccount: EpicAccount): Promise<void> {
    try {
      const docRef = doc(firestoreDb, 'epicAccounts', epicAccount.id);
      await setDoc(docRef, {
        ...epicAccount,
        linkedAt: new Date(),
        updatedAt: new Date()
      });
      console.log('✅ Epic account saved to Firebase');
    } catch (error) {
      console.error('❌ Error saving Epic account to Firebase:', error);
      throw error;
    }
  }

  static async getEpicAccount(userId: string): Promise<EpicAccount | null> {
    try {
      const q = query(
        collection(firestoreDb, 'epicAccounts'),
        where('userId', '==', userId),
        limit(1)
      );
      
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        const data = doc.data();
        return {
          id: data.id || doc.id,
          epicId: data.epicId || '',
          displayName: data.displayName || '',
          platform: data.platform || 'unknown',
          userId: data.userId || '',
          isReal: data.isReal || false,
          linkedAt: data.linkedAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date()
        } as EpicAccount;
      }
      return null;
    } catch (error) {
      console.error('❌ Error getting Epic account from Firebase:', error);
      throw error;
    }
  }

  // Fortnite Stats Management
  static async saveFortniteStats(stats: FortniteStats): Promise<void> {
    try {
      const docRef = doc(firestoreDb, 'fortniteStats', stats.id);
      await setDoc(docRef, {
        ...stats,
        lastUpdated: new Date(),
        updatedAt: new Date()
      });
      console.log('✅ Fortnite stats saved to Firebase');
    } catch (error) {
      console.error('❌ Error saving Fortnite stats to Firebase:', error);
      throw error;
    }
  }

  static async getFortniteStats(userId: string): Promise<FortniteStats | null> {
    try {
      const q = query(
        collection(firestoreDb, 'fortniteStats'),
        where('userId', '==', userId),
        orderBy('lastUpdated', 'desc'),
        limit(1)
      );
      
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        const data = doc.data();
        return {
          id: data.id || doc.id,
          userId: data.userId || '',
          epicId: data.epicId || '',
          epicName: data.epicName || data.displayName || '',
          platform: data.platform || 'unknown',
          lastUpdated: data.lastUpdated?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          overall: data.overall || {
            kd: 0, winRate: 0, matches: 0, avgPlace: 0, top1: 0, top3: 0, top5: 0, top10: 0, top25: 0,
            kills: 0, deaths: 0, assists: 0, damageDealt: 0, damageTaken: 0, timeAlive: 0, distanceTraveled: 0,
            materialsGathered: 0, structuresBuilt: 0
          },
          usage: data.usage || { matchesUsed: 0, lastReset: new Date() },
          metadata: data.metadata || { source: 'firebase', version: '1.0' }
        } as FortniteStats;
      }
      return null;
    } catch (error) {
      console.error('❌ Error getting Fortnite stats from Firebase:', error);
      throw error;
    }
  }

  // User Profile Management
  static async saveUserProfile(profile: UserProfile): Promise<void> {
    try {
      const docRef = doc(firestoreDb, 'users', profile.id);
      await setDoc(docRef, {
        ...profile,
        createdAt: profile.createdAt || new Date(),
        lastLogin: new Date(),
        updatedAt: new Date()
      });
      console.log('✅ User profile saved to Firebase');
    } catch (error) {
      console.error('❌ Error saving user profile to Firebase:', error);
      throw error;
    }
  }

  static async getUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      const docRef = doc(firestoreDb, 'users', userId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          id: data.id || docSnap.id,
          email: data.email || '',
          displayName: data.displayName || data.email?.split('@')[0] || 'User',
          createdAt: data.createdAt?.toDate() || new Date(),
          lastLogin: data.lastLogin?.toDate() || new Date(),
          profile: data.profile || {
            language: 'en',
            avatar: null,
            bio: null,
            location: null,
            timezone: null,
            dateOfBirth: null,
            gender: null
          },
          gaming: data.gaming || {
            favoriteGame: 'Fortnite',
            skillLevel: 'beginner',
            playStyle: 'balanced',
            preferredModes: ['Battle Royale'],
            teamSize: 'solo',
            goals: ['Improve K/D ratio', 'Win more matches']
          },
          subscription: data.subscription || {
            status: data.subscriptionStatus || 'free',
            tier: data.subscriptionTier || 'free',
            startDate: data.createdAt?.toDate() || new Date(),
            endDate: null,
            autoRenew: false,
            paymentMethod: null,
            stripeCustomerId: data.stripeCustomerId || null,
            stripeSubscriptionId: null
          },
          settings: data.settings || {
            notifications: {
              email: true,
              push: false,
              sms: false,
              discord: false
            },
            privacy: {
              profilePublic: false,
              statsPublic: false,
              allowFriendRequests: true,
              showOnlineStatus: true
            },
            preferences: {
              theme: 'dark',
              language: 'en',
              timezone: 'UTC',
              dateFormat: 'MM/DD/YYYY',
              timeFormat: '12h'
            }
          },
          statistics: data.statistics || {
            totalSessions: 0,
            totalTime: 0,
            lastActivity: data.lastLogin?.toDate() || new Date(),
            favoriteFeatures: [],
            mostUsedTools: [],
            improvementAreas: []
          }
        } as UserProfile;
      }
      return null;
    } catch (error) {
      console.error('❌ Error getting user profile from Firebase:', error);
      throw error;
    }
  }

  // Initialize user usage tracking
  static async initializeUserUsage(userId: string): Promise<void> {
    try {
      // Create usage document for the user
      const usageRef = doc(firestoreDb, 'usage', userId);
      await setDoc(usageRef, {
        userId,
        createdAt: new Date(),
        updatedAt: new Date(),
        
        // AI usage tracking
        ai: {
          conversationsCreated: 0,
          messagesUsed: 0,
          lastReset: new Date()
        },
        
        // Epic account usage
        epic: {
          lastSync: new Date(),
          statsPulled: 0,
          syncCount: 0,
          lastActivity: new Date()
        },
        
        // Osirion API usage
        osirion: {
          computeRequestsUsed: 0,
          eventTypesUsed: 0,
          lastReset: new Date(),
          matchesUsed: 0,
          replayUploadsUsed: 0,
          subscriptionTier: 'free',
          totalSessions: 0,
          updatedAt: new Date()
        }
      });
      
      console.log('✅ User usage tracking initialized in Firebase');
    } catch (error) {
      console.error('❌ Error initializing user usage tracking:', error);
      throw error;
    }
  }

  // Replay Upload Management
  static async saveReplayUpload(upload: ReplayUpload): Promise<void> {
    try {
      const docRef = doc(firestoreDb, 'replayUploads', upload.id);
      await setDoc(docRef, {
        ...upload,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      console.log('✅ Replay upload saved to Firebase');
    } catch (error) {
      console.error('❌ Error saving replay upload to Firebase:', error);
      throw error;
    }
  }

  static async getReplayUploads(userId: string): Promise<ReplayUpload[]> {
    try {
      const q = query(
        collection(firestoreDb, 'replayUploads'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date()
        } as ReplayUpload;
      });
    } catch (error) {
      console.error('❌ Error getting replay uploads from Firebase:', error);
      throw error;
    }
  }

  // Conversation Management
  static async saveConversation(conversation: Omit<Conversation, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const conversationData = {
        ...conversation,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      const docRef = await addDoc(collection(firestoreDb, 'conversations'), conversationData);
      console.log('✅ Conversation saved to Firebase');
      return docRef.id;
    } catch (error) {
      console.error('❌ Error saving conversation to Firebase:', error);
      throw error;
    }
  }

  static async getConversations(userId: string): Promise<Conversation[]> {
    try {
      const q = query(
        collection(firestoreDb, 'conversations'),
        where('userId', '==', userId),
        orderBy('updatedAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date()
        } as Conversation;
      });
    } catch (error) {
      console.error('❌ Error getting conversations from Firebase:', error);
      throw error;
    }
  }

  static async updateConversation(conversationId: string, updates: Partial<Conversation>): Promise<void> {
    try {
      const docRef = doc(firestoreDb, 'conversations', conversationId);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: new Date()
      });
      console.log('✅ Conversation updated in Firebase');
    } catch (error) {
      console.error('❌ Error updating conversation in Firebase:', error);
      throw error;
    }
  }

  static async addConversationMessage(conversationId: string, message: Omit<Message, 'id' | 'timestamp'>): Promise<string> {
    try {
      const messageData = {
        ...message,
        timestamp: new Date()
      };
      
      const docRef = await addDoc(collection(firestoreDb, 'conversations', conversationId, 'messages'), messageData);
      console.log('✅ Message added to Firebase');
      return docRef.id;
    } catch (error) {
      console.error('❌ Error adding message to Firebase:', error);
      throw error;
    }
  }

  static async getMessages(conversationId: string): Promise<Message[]> {
    try {
      const q = query(
        collection(firestoreDb, 'conversations', conversationId, 'messages'),
        orderBy('timestamp', 'asc')
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          ...data,
          timestamp: data.timestamp?.toDate() || new Date()
        } as Message;
      });
    } catch (error) {
      console.error('❌ Error getting messages from Firebase:', error);
      throw error;
    }
  }

  // Utility Methods
  static generateId(): string {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
  }

  static async updateConversationTitle(conversationId: string, title: string): Promise<void> {
    try {
      const docRef = doc(firestoreDb, 'conversations', conversationId);
      await updateDoc(docRef, {
        title,
        updatedAt: new Date()
      });
      console.log('✅ Conversation title updated in Firebase');
    } catch (error) {
      console.error('❌ Error updating conversation title in Firebase:', error);
      throw error;
    }
  }

  static async deleteConversation(conversationId: string): Promise<void> {
    try {
      const docRef = doc(firestoreDb, 'conversations', conversationId);
      await deleteDoc(docRef);
      console.log('✅ Conversation deleted from Firebase');
    } catch (error) {
      console.error('❌ Error deleting conversation from Firebase:', error);
      throw error;
    }
  }

  // Advanced Stats Methods
  static async getStatsByMode(userId: string, mode: 'solo' | 'duo' | 'squad' | 'arena'): Promise<any> {
    try {
      const stats = await this.getFortniteStats(userId);
      if (stats && stats[mode]) {
        return stats[mode];
      }
      return null;
    } catch (error) {
      console.error(`❌ Error getting ${mode} stats:`, error);
      throw error;
    }
  }

  static async getStatsComparison(userId: string, mode1: string, mode2: string): Promise<any> {
    try {
      const stats = await this.getFortniteStats(userId);
      if (stats) {
        return {
          mode1: stats[mode1 as keyof FortniteStats],
          mode2: stats[mode2 as keyof FortniteStats],
          comparison: this.compareStats(stats[mode1 as keyof FortniteStats], stats[mode2 as keyof FortniteStats])
        };
      }
      return null;
    } catch (error) {
      console.error('❌ Error getting stats comparison:', error);
      throw error;
    }
  }

  private static compareStats(stats1: any, stats2: any): any {
    if (!stats1 || !stats2) return null;
    
    const comparison: any = {};
    const fields = ['kd', 'winRate', 'avgPlace', 'matches'];
    
    fields.forEach(field => {
      if (stats1[field] !== undefined && stats2[field] !== undefined) {
        const diff = stats1[field] - stats2[field];
        const percentage = stats2[field] !== 0 ? (diff / stats2[field]) * 100 : 0;
        
        comparison[field] = {
          difference: diff,
          percentage: percentage,
          better: diff > 0 ? 'mode1' : diff < 0 ? 'mode2' : 'equal'
        };
      }
    });
    
    return comparison;
  }

  // Chat Management
  static async createChat(chat: Omit<Chat, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const chatData = {
        ...chat,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      const docRef = await addDoc(collection(firestoreDb, 'chats'), chatData);
      console.log('✅ Chat created in Firebase with ID:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('❌ Error creating chat in Firebase:', error);
      throw error;
    }
  }

  static async getChats(userId: string): Promise<Chat[]> {
    try {
      const q = query(
        collection(firestoreDb, 'chats'),
        where('userId', '==', userId),
        orderBy('updatedAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date()
        } as Chat;
      });
    } catch (error) {
      console.error('❌ Error getting chats from Firebase:', error);
      throw error;
    }
  }

  static async getChat(chatId: string): Promise<Chat | null> {
    try {
      const docRef = doc(firestoreDb, 'chats', chatId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date()
        } as Chat;
      }
      return null;
    } catch (error) {
      console.error('❌ Error getting chat from Firebase:', error);
      throw error;
    }
  }

  static async updateChat(chatId: string, updates: Partial<Chat>): Promise<void> {
    try {
      const docRef = doc(firestoreDb, 'chats', chatId);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: new Date()
      });
      console.log('✅ Chat updated in Firebase');
    } catch (error) {
      console.error('❌ Error updating chat in Firebase:', error);
      throw error;
    }
  }

  static async deleteChat(chatId: string): Promise<void> {
    try {
      const docRef = doc(firestoreDb, 'chats', chatId);
      await deleteDoc(docRef);
      console.log('✅ Chat deleted from Firebase');
    } catch (error) {
      console.error('❌ Error deleting chat from Firebase:', error);
      throw error;
    }
  }

  // Chat Message Management
  static async addMessage(chatId: string, message: Omit<ChatMessage, 'id' | 'timestamp'>): Promise<string> {
    try {
      const messageData = {
        ...message,
        timestamp: new Date()
      };
      
      const docRef = await addDoc(collection(firestoreDb, 'chats', chatId, 'messages'), messageData);
      
      // Update chat message count
      await this.updateChat(chatId, { messageCount: 1 });
      
      console.log('✅ Message added to chat in Firebase');
      return docRef.id;
    } catch (error) {
      console.error('❌ Error adding message to chat in Firebase:', error);
      throw error;
    }
  }

  static async getChatMessages(chatId: string): Promise<ChatMessage[]> {
    try {
      const q = query(
        collection(firestoreDb, 'chats', chatId, 'messages'),
        orderBy('timestamp', 'asc')
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          timestamp: data.timestamp?.toDate() || new Date()
        } as ChatMessage;
      });
    } catch (error) {
      console.error('❌ Error getting chat messages from Firebase:', error);
      throw error;
    }
  }

  // Usage Log Management
  static async logUsage(usageLog: Omit<UsageLog, 'id' | 'timestamp'>): Promise<string> {
    try {
      const logData = {
        ...usageLog,
        timestamp: new Date()
      };
      
      const docRef = await addDoc(collection(firestoreDb, 'usageLogs'), logData);
      console.log('✅ Usage logged to Firebase');
      return docRef.id;
    } catch (error) {
      console.error('❌ Error logging usage to Firebase:', error);
      throw error;
    }
  }

  static async getUserUsageLogs(userId: string, limitCount: number = 100): Promise<UsageLog[]> {
    try {
      const q = query(
        collection(firestoreDb, 'usageLogs'),
        where('userId', '==', userId),
        orderBy('timestamp', 'desc'),
        limit(limitCount)
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          timestamp: data.timestamp?.toDate() || new Date()
        } as UsageLog;
      });
    } catch (error) {
      console.error('❌ Error getting user usage logs from Firebase:', error);
      throw error;
    }
  }

  // Subscription Management
  static async createSubscription(subscription: Omit<Subscription, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const subscriptionData = {
        ...subscription,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      const docRef = await addDoc(collection(firestoreDb, 'subscriptions'), subscriptionData);
      console.log('✅ Subscription created in Firebase');
      return docRef.id;
    } catch (error) {
      console.error('❌ Error creating subscription in Firebase:', error);
      throw error;
    }
  }

  static async getSubscription(userId: string): Promise<Subscription | null> {
    try {
      const q = query(
        collection(firestoreDb, 'subscriptions'),
        where('userId', '==', userId),
        limit(1)
      );
      
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          currentPeriodStart: data.currentPeriodStart?.toDate() || new Date(),
          currentPeriodEnd: data.currentPeriodEnd?.toDate() || new Date(),
          canceledAt: data.canceledAt?.toDate(),
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          usage: {
            ...data.usage,
            resetDate: data.usage?.resetDate?.toDate() || new Date()
          }
        } as Subscription;
      }
      return null;
    } catch (error) {
      console.error('❌ Error getting subscription from Firebase:', error);
      throw error;
    }
  }

  static async updateSubscription(subscriptionId: string, updates: Partial<Subscription>): Promise<void> {
    try {
      const docRef = doc(firestoreDb, 'subscriptions', subscriptionId);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: new Date()
      });
      console.log('✅ Subscription updated in Firebase');
    } catch (error) {
      console.error('❌ Error updating subscription in Firebase:', error);
      throw error;
    }
  }

  static async updateSubscriptionUsage(subscriptionId: string, usageUpdates: Partial<Subscription['usage']>): Promise<void> {
    try {
      const docRef = doc(firestoreDb, 'subscriptions', subscriptionId);
      const updates: any = { updatedAt: new Date() };
      
      // Update usage fields with increment
      if (usageUpdates.messagesUsed !== undefined) {
        updates['usage.messagesUsed'] = increment(1);
      }
      if (usageUpdates.tokensUsed !== undefined) {
        const tokensToAdd = typeof usageUpdates.tokensUsed === 'number' ? usageUpdates.tokensUsed : 0;
        updates['usage.tokensUsed'] = increment(tokensToAdd);
      }
      if (usageUpdates.dataPullsUsed !== undefined) {
        updates['usage.dataPullsUsed'] = increment(1);
      }
      if (usageUpdates.replayUploadsUsed !== undefined) {
        updates['usage.replayUploadsUsed'] = increment(1);
      }
      if (usageUpdates.tournamentStrategiesUsed !== undefined) {
        updates['usage.tournamentStrategiesUsed'] = increment(1);
      }
      
      await updateDoc(docRef, updates);
      console.log('✅ Subscription usage updated in Firebase');
    } catch (error) {
      console.error('❌ Error updating subscription usage in Firebase:', error);
      throw error;
    }
  }

  // Fortnite Data Management
  static async saveFortniteData(fortniteData: Omit<FortniteData, 'id' | 'syncedAt'>): Promise<string> {
    try {
      const data = {
        ...fortniteData,
        syncedAt: new Date()
      };
      
      const docRef = await addDoc(collection(firestoreDb, 'fortniteData'), data);
      console.log('✅ Fortnite data saved to Firebase');
      return docRef.id;
    } catch (error) {
      console.error('❌ Error saving Fortnite data to Firebase:', error);
      throw error;
    }
  }

  static async getFortniteData(userId: string): Promise<FortniteData | null> {
    try {
      const q = query(
        collection(firestoreDb, 'fortniteData'),
        where('userId', '==', userId),
        orderBy('syncedAt', 'desc'),
        limit(1)
      );
      
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          syncedAt: data.syncedAt?.toDate() || new Date()
        } as FortniteData;
      }
      return null;
    } catch (error) {
      console.error('❌ Error getting Fortnite data from Firebase:', error);
      throw error;
    }
  }

  // Subscription Plan Management
  static getSubscriptionPlanLimits(plan: 'free' | 'standard' | 'pro') {
    const plans = {
      free: {
        monthlyMessages: 10,
        monthlyTokens: 1000,
        monthlyDataPulls: 5,
        replayUploads: 0,
        tournamentStrategies: 0,
        prioritySupport: false,
        advancedAnalytics: false
      },
      standard: {
        monthlyMessages: 100,
        monthlyTokens: 10000,
        monthlyDataPulls: 50,
        replayUploads: 5,
        tournamentStrategies: 10,
        prioritySupport: false,
        advancedAnalytics: true
      },
      pro: {
        monthlyMessages: 1000,
        monthlyTokens: 100000,
        monthlyDataPulls: 500,
        replayUploads: 50,
        tournamentStrategies: 100,
        prioritySupport: true,
        advancedAnalytics: true
      }
    };
    
    return plans[plan];
  }

  // Usage Tracking and Limits
  static async checkUserLimits(userId: string, requestType: UsageLog['requestType']): Promise<{
    allowed: boolean;
    remaining: number;
    limit: number;
    subscription: Subscription | null;
  }> {
    try {
      const subscription = await this.getSubscription(userId);
      const plan = subscription?.plan || 'free';
      const limits = this.getSubscriptionPlanLimits(plan);
      
      if (!subscription) {
        // Create default free subscription
        const defaultSubscription = await this.createSubscription({
          userId,
          plan: 'free',
          status: 'active',
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
          cancelAtPeriodEnd: false,
          limits,
          usage: {
            messagesUsed: 0,
            tokensUsed: 0,
            dataPullsUsed: 0,
            replayUploadsUsed: 0,
            tournamentStrategiesUsed: 0,
            resetDate: new Date()
          }
        });
        
        return {
          allowed: true,
          remaining: limits.monthlyMessages,
          limit: limits.monthlyMessages,
          subscription: await this.getSubscription(userId)
        };
      }
      
      // Check if we need to reset monthly usage
      const now = new Date();
      const lastReset = subscription.usage.resetDate;
      const daysSinceReset = Math.floor((now.getTime() - lastReset.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysSinceReset >= 30) {
        // Reset monthly usage
        await this.updateSubscription(subscription.id, {
          usage: {
            messagesUsed: 0,
            tokensUsed: 0,
            dataPullsUsed: 0,
            replayUploadsUsed: 0,
            tournamentStrategiesUsed: 0,
            resetDate: now
          }
        });
        subscription.usage = {
          messagesUsed: 0,
          tokensUsed: 0,
          dataPullsUsed: 0,
          replayUploadsUsed: 0,
          tournamentStrategiesUsed: 0,
          resetDate: now
        };
      }
      
      // Check limits based on request type
      let currentUsage = 0;
      let limit = 0;
      
      switch (requestType) {
        case 'chat':
          currentUsage = subscription.usage.messagesUsed;
          limit = subscription.limits.monthlyMessages;
          break;
        case 'data_pull':
          currentUsage = subscription.usage.dataPullsUsed;
          limit = subscription.limits.monthlyDataPulls;
          break;
        case 'replay_upload':
          currentUsage = subscription.usage.replayUploadsUsed;
          limit = subscription.limits.replayUploads;
          break;
        case 'tournament_strategy':
          currentUsage = subscription.usage.tournamentStrategiesUsed;
          limit = subscription.limits.tournamentStrategies;
          break;
        default:
          currentUsage = 0;
          limit = 0;
      }
      
      const remaining = Math.max(0, limit - currentUsage);
      const allowed = currentUsage < limit;
      
      return {
        allowed,
        remaining,
        limit,
        subscription
      };
    } catch (error) {
      console.error('❌ Error checking user limits:', error);
      throw error;
    }
  }

  // Analytics and Reporting
  static async getUserAnalytics(userId: string, days: number = 30): Promise<{
    totalRequests: number;
    totalTokens: number;
    totalCost: number;
    requestsByType: Record<string, number>;
    dailyUsage: Array<{ date: string; requests: number; tokens: number }>;
  }> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      
      const q = query(
        collection(firestoreDb, 'usageLogs'),
        where('userId', '==', userId),
        where('timestamp', '>=', startDate),
        orderBy('timestamp', 'asc')
      );
      
      const querySnapshot = await getDocs(q);
      const logs = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          ...data,
          timestamp: data.timestamp?.toDate() || new Date()
        } as UsageLog;
      });
      
      // Calculate totals
      const totalRequests = logs.length;
      const totalTokens = logs.reduce((sum, log) => sum + log.tokensUsed, 0);
      const totalCost = logs.reduce((sum, log) => sum + log.cost, 0);
      
      // Group by request type
      const requestsByType = logs.reduce((acc, log) => {
        acc[log.requestType] = (acc[log.requestType] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      // Group by day
      const dailyUsage = logs.reduce((acc, log) => {
        const date = log.timestamp.toISOString().split('T')[0];
        const existing = acc.find(d => d.date === date);
        
        if (existing) {
          existing.requests += 1;
          existing.tokens += log.tokensUsed;
        } else {
          acc.push({ date, requests: 1, tokens: log.tokensUsed });
        }
        
        return acc;
      }, [] as Array<{ date: string; requests: number; tokens: number }>);
      
      return {
        totalRequests,
        totalTokens,
        totalCost,
        requestsByType,
        dailyUsage
      };
    } catch (error) {
      console.error('❌ Error getting user analytics:', error);
      throw error;
    }
  }
}
