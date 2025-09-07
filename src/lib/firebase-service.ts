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
  Timestamp
} from 'firebase/firestore';
import { db } from './firebase';

// Type assertion for db - we know it will be available at runtime
const firestoreDb = db!;

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
  
  // Raw Osirion data for detailed analysis
  rawOsirionData?: {
    matches: Array<{
      id?: string;
      placement: number;
      kills: number;
      assists: number;
      damage: number;
      survivalTime?: number;
      woodFarmed?: number;
      stoneFarmed?: number;
      metalFarmed?: number;
      buildingHits?: number;
      woodBuildsPlaced?: number;
      stoneBuildsPlaced?: number;
      metalBuildsPlaced?: number;
      buildsEdited?: number;
      buildsEditedSuccessfully?: number;
      buildsEditedTotalTime?: number;
    }>;
    preferences?: {
      preferredDrop: string;
      weakestZone: string;
      bestWeapon: string;
      avgSurvivalTime: number;
    };
  };
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
        linkedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
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
      
      // Filter out undefined values to prevent Firestore errors
      const cleanStats = Object.fromEntries(
        Object.entries(stats).filter(([_, value]) => value !== undefined)
      );
      
      await setDoc(docRef, {
        ...cleanStats,
        lastUpdated: serverTimestamp(),
        updatedAt: serverTimestamp()
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
        
        // Return complete FortniteStats object with all fields
        return {
          id: data.id || doc.id,
          userId: data.userId || '',
          epicId: data.epicId || '',
          epicName: data.epicName || data.displayName || '',
          platform: data.platform || 'unknown',
          lastUpdated: data.lastUpdated?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          
          // Overall stats
          overall: data.overall || {
            kd: 0, winRate: 0, matches: 0, avgPlace: 0, top1: 0, top3: 0, top5: 0, top10: 0, top25: 0,
            kills: 0, deaths: 0, assists: 0, damageDealt: 0, damageTaken: 0, timeAlive: 0, distanceTraveled: 0,
            materialsGathered: 0, structuresBuilt: 0
          },
          
          // Mode-specific stats
          solo: data.solo || undefined,
          duo: data.duo || undefined,
          squad: data.squad || undefined,
          arena: data.arena || undefined,
          
          // Tournament stats
          tournaments: data.tournaments || undefined,
          
          // Weapon stats
          weapons: data.weapons || undefined,
          
          // Building stats
          building: data.building || undefined,
          
          // Performance stats
          performance: data.performance || undefined,
          
          // Usage tracking
          usage: data.usage || { matchesUsed: 0, lastReset: new Date() },
          
          // Metadata
          metadata: data.metadata || { source: 'firebase', version: '1.0' },
          
          // Raw Osirion data - this is crucial for AI analysis
          rawOsirionData: data.rawOsirionData || undefined
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
        createdAt: serverTimestamp(),
        lastLogin: serverTimestamp(),
        updatedAt: serverTimestamp()
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
            language: 'en'
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
            autoRenew: false
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
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        
        // AI usage tracking
        ai: {
          conversationsCreated: 0,
          messagesUsed: 0,
          lastReset: serverTimestamp()
        },
        
        // Epic account usage
        epic: {
          lastSync: serverTimestamp(),
          statsPulled: 0,
          syncCount: 0,
          lastActivity: serverTimestamp()
        },
        
        // Osirion API usage
        osirion: {
          computeRequestsUsed: 0,
          eventTypesUsed: 0,
          lastReset: serverTimestamp(),
          matchesUsed: 0,
          replayUploadsUsed: 0,
          subscriptionTier: 'free',
          totalSessions: 0,
          updatedAt: serverTimestamp()
        }
      });
      
      console.log('✅ User usage tracking initialized in Firebase');
    } catch (error) {
      console.error('❌ Error initializing user usage tracking:', error);
      throw error;
    }
  }


  // Conversation Management
  static async saveConversation(conversation: Conversation): Promise<void> {
    try {
      const docRef = doc(firestoreDb, 'conversations', conversation.id);
      await setDoc(docRef, {
        ...conversation,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      console.log('✅ Conversation saved to Firebase');
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

  static async saveMessage(conversationId: string, message: Message): Promise<void> {
    try {
      const docRef = doc(firestoreDb, 'conversations', conversationId, 'messages', message.id);
      await setDoc(docRef, {
        ...message,
        timestamp: serverTimestamp()
      });
      console.log('✅ Message saved to Firebase');
    } catch (error) {
      console.error('❌ Error saving message to Firebase:', error);
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
        updatedAt: serverTimestamp()
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
}
