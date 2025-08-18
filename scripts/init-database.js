const admin = require('firebase-admin');
const serviceAccount = require('../path/to/serviceAccountKey.json');

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// Database initialization script for PathGen
async function initializeDatabase() {
  console.log('🚀 Initializing PathGen Database...');

  try {
    // Create collections with sample data
    await createUsersCollection();
    await createSubscriptionsCollection();
    await createChatsCollection();
    await createUsageLogsCollection();
    await createFortniteDataCollection();
    await createAnalyticsCollection();
    
    console.log('✅ Database initialization completed successfully!');
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
  }
}

// Create Users collection with sample data
async function createUsersCollection() {
  console.log('📝 Creating Users collection...');
  
  const usersRef = db.collection('users');
  
  const sampleUsers = [
    {
      id: 'sample-user-1',
      email: 'player1@example.com',
      displayName: 'FortnitePro123',
      createdAt: new Date(),
      lastLogin: new Date(),
      profile: {
        avatar: 'https://example.com/avatar1.jpg',
        bio: 'Competitive Fortnite player looking to improve',
        location: 'United States',
        timezone: 'America/New_York',
        language: 'en',
        dateOfBirth: new Date('1995-01-01'),
        gender: 'male'
      },
      gaming: {
        favoriteGame: 'Fortnite',
        skillLevel: 'intermediate',
        playStyle: 'aggressive',
        preferredModes: ['Battle Royale', 'Arena'],
        teamSize: 'solo',
        goals: ['Improve K/D ratio', 'Win more tournaments', 'Master building mechanics']
      },
      subscription: {
        status: 'free',
        tier: 'free',
        startDate: new Date(),
        autoRenew: false
      },
      settings: {
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
          timezone: 'America/New_York',
          dateFormat: 'MM/DD/YYYY',
          timeFormat: '12h'
        }
      },
      statistics: {
        totalSessions: 0,
        totalTime: 0,
        lastActivity: new Date(),
        favoriteFeatures: [],
        mostUsedTools: [],
        improvementAreas: []
      }
    }
  ];

  for (const user of sampleUsers) {
    await usersRef.doc(user.id).set(user);
  }
  
  console.log('✅ Users collection created with sample data');
}

// Create Subscriptions collection
async function createSubscriptionsCollection() {
  console.log('💳 Creating Subscriptions collection...');
  
  const subscriptionsRef = db.collection('subscriptions');
  
  const sampleSubscriptions = [
    {
      id: 'sample-sub-1',
      userId: 'sample-user-1',
      plan: 'free',
      status: 'active',
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      cancelAtPeriodEnd: false,
      limits: {
        monthlyMessages: 10,
        monthlyTokens: 1000,
        monthlyDataPulls: 5,
        replayUploads: 0,
        tournamentStrategies: 0,
        prioritySupport: false,
        advancedAnalytics: false
      },
      usage: {
        messagesUsed: 0,
        tokensUsed: 0,
        dataPullsUsed: 0,
        replayUploadsUsed: 0,
        tournamentStrategiesUsed: 0,
        resetDate: new Date()
      },
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];

  for (const subscription of sampleSubscriptions) {
    await subscriptionsRef.doc(subscription.id).set(subscription);
  }
  
  console.log('✅ Subscriptions collection created with sample data');
}

// Create Chats collection
async function createChatsCollection() {
  console.log('💬 Creating Chats collection...');
  
  const chatsRef = db.collection('chats');
  
  const sampleChats = [
    {
      id: 'sample-chat-1',
      userId: 'sample-user-1',
      title: 'Building Improvement Session',
      createdAt: new Date(),
      updatedAt: new Date(),
      messageCount: 2,
      type: 'coaching',
      status: 'active',
      tags: ['building', 'coaching', 'improvement'],
      coachingSession: {
        focusArea: 'building',
        skillLevel: 'intermediate',
        goals: ['Improve 90s speed', 'Master editing techniques'],
        progress: 0.3,
        nextSteps: ['Practice 90s in creative', 'Work on edit courses']
      }
    }
  ];

  for (const chat of sampleChats) {
    await chatsRef.doc(chat.id).set(chat);
    
    // Create sample messages for each chat
    const messagesRef = chatsRef.doc(chat.id).collection('messages');
    
    const sampleMessages = [
      {
        id: 'msg-1',
        chatId: chat.id,
        userId: 'sample-user-1',
        role: 'user',
        content: 'I want to improve my building speed, especially 90s. Any tips?',
        timestamp: new Date(),
        type: 'text',
        userMessage: {
          intent: 'seeking_advice',
          sentiment: 'positive',
          containsStats: false,
          containsReplay: false,
          questionType: 'how-to'
        }
      },
      {
        id: 'msg-2',
        chatId: chat.id,
        userId: 'ai-assistant',
        role: 'assistant',
        content: 'Great question! To improve your 90s speed, I recommend starting with these exercises:\n\n1. **Creative Practice**: Build 90s in creative mode for 15-20 minutes daily\n2. **Edit Courses**: Practice editing through pre-built structures\n3. **Piece Control**: Focus on placing pieces efficiently rather than quickly at first\n\nWould you like me to create a personalized training plan based on your current stats?',
        timestamp: new Date(),
        type: 'text',
        aiResponse: {
          model: 'gpt-4',
          confidence: 0.95,
          suggestions: ['Creative practice', 'Edit courses', 'Piece control'],
          relatedTopics: ['building mechanics', 'editing', 'piece control'],
          followUpQuestions: ['Would you like a personalized training plan?'],
          tokensUsed: 150
        }
      }
    ];

    for (const message of sampleMessages) {
      await messagesRef.doc(message.id).set(message);
    }
  }
  
  console.log('✅ Chats collection created with sample data and messages');
}

// Create UsageLogs collection
async function createUsageLogsCollection() {
  console.log('📊 Creating UsageLogs collection...');
  
  const usageLogsRef = db.collection('usageLogs');
  
  const sampleUsageLogs = [
    {
      id: 'log-1',
      userId: 'sample-user-1',
      timestamp: new Date(),
      requestType: 'chat',
      tokensUsed: 150,
      cost: 0.003,
      details: {
        endpoint: '/api/chat',
        duration: 1200,
        success: true,
        metadata: { model: 'gpt-4', responseTime: 1200 }
      },
      subscriptionTier: 'free',
      remainingTokens: 850
    },
    {
      id: 'log-2',
      userId: 'sample-user-1',
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
      requestType: 'data_pull',
      tokensUsed: 0,
      cost: 0,
      details: {
        endpoint: '/api/fortnite/stats',
        duration: 800,
        success: true,
        metadata: { epicId: 'sample-epic-123', platform: 'pc' }
      },
      subscriptionTier: 'free',
      remainingTokens: 1000
    }
  ];

  for (const log of sampleUsageLogs) {
    await usageLogsRef.doc(log.id).set(log);
  }
  
  console.log('✅ UsageLogs collection created with sample data');
}

// Create FortniteData collection
async function createFortniteDataCollection() {
  console.log('🎮 Creating FortniteData collection...');
  
  const fortniteDataRef = db.collection('fortniteData');
  
  const sampleFortniteData = [
    {
      id: 'fortnite-data-1',
      userId: 'sample-user-1',
      epicId: 'sample-epic-123',
      epicName: 'FortnitePro123',
      syncedAt: new Date(),
      stats: {
        wins: 45,
        kd: 2.3,
        placement: 12.5,
        earnings: 1250,
        matches: 320,
        top1: 45,
        top3: 89,
        top5: 156,
        top10: 234,
        top25: 298,
        kills: 736,
        deaths: 320,
        assists: 89,
        damageDealt: 125000,
        damageTaken: 89000,
        timeAlive: 48000,
        distanceTraveled: 125000,
        materialsGathered: 45000,
        structuresBuilt: 8900
      },
      modes: {
        solo: {
          kd: 2.1,
          winRate: 0.14,
          matches: 150,
          avgPlace: 15.2,
          top1: 21,
          top3: 42,
          top5: 78,
          top10: 115,
          top25: 140,
          kills: 315,
          deaths: 150,
          assists: 0,
          damageDealt: 56250,
          damageTaken: 42000,
          timeAlive: 22500,
          distanceTraveled: 56250,
          materialsGathered: 21000,
          structuresBuilt: 4200
        },
        duo: {
          kd: 2.4,
          winRate: 0.16,
          matches: 100,
          avgPlace: 10.8,
          top1: 16,
          top3: 32,
          top5: 48,
          top10: 72,
          top25: 88,
          kills: 240,
          deaths: 100,
          assists: 45,
          damageDealt: 37500,
          damageTaken: 28000,
          timeAlive: 15000,
          distanceTraveled: 37500,
          materialsGathered: 14000,
          structuresBuilt: 2800
        },
        squad: {
          kd: 2.5,
          winRate: 0.11,
          matches: 70,
          avgPlace: 8.9,
          top1: 8,
          top3: 15,
          top5: 30,
          top10: 47,
          top25: 70,
          kills: 175,
          deaths: 70,
          assists: 44,
          damageDealt: 31250,
          damageTaken: 19000,
          timeAlive: 10500,
          distanceTraveled: 31250,
          materialsGathered: 10000,
          structuresBuilt: 1900
        }
      },
      tournaments: {
        totalTournaments: 12,
        bestPlacement: 3,
        totalWinnings: 1250,
        averagePlacement: 15.2,
        tournamentsWon: 0,
        top3Finishes: 1,
        top10Finishes: 4
      },
      dataSource: 'osirion',
      dataQuality: 'high',
      notes: 'Player shows strong mechanical skills with room for improvement in game sense and positioning'
    }
  ];

  for (const data of sampleFortniteData) {
    await fortniteDataRef.doc(data.id).set(data);
  }
  
  console.log('✅ FortniteData collection created with sample data');
}

// Create Analytics collection
async function createAnalyticsCollection() {
  console.log('📈 Creating Analytics collection...');
  
  const analyticsRef = db.collection('analytics');
  
  // Daily Active Users
  const dauRef = analyticsRef.doc('dailyActiveUsers').collection('dates').doc(new Date().toISOString().split('T')[0]);
  await dauRef.set({
    'sample-user-1': new Date()
  });
  
  // Feature Usage
  const featureUsageRef = analyticsRef.doc('featureUsage').collection('features');
  
  const features = ['chat', 'stats_analysis', 'tournament_strategy', 'replay_upload'];
  
  for (const feature of features) {
    await featureUsageRef.doc(feature).set({
      'sample-user-1': {
        lastUsed: new Date(),
        usageCount: Math.floor(Math.random() * 10) + 1,
        metadata: { platform: 'web', subscription: 'free' }
      }
    });
  }
  
  console.log('✅ Analytics collection created with sample data');
}

// Create Firestore indexes
async function createIndexes() {
  console.log('🔍 Creating Firestore indexes...');
  
  // Note: In production, you would define these in firestore.indexes.json
  // This is just for demonstration
  console.log('📝 Indexes should be defined in firestore.indexes.json');
  console.log('📝 Common indexes needed:');
  console.log('  - users: email (ascending)');
  console.log('  - subscriptions: userId (ascending), status (ascending)');
  console.log('  - chats: userId (ascending), updatedAt (descending)');
  console.log('  - usageLogs: userId (ascending), timestamp (descending)');
  console.log('  - fortniteData: userId (ascending), syncedAt (descending)');
}

// Main execution
if (require.main === module) {
  initializeDatabase()
    .then(() => {
      console.log('🎉 Database initialization script completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Database initialization script failed:', error);
      process.exit(1);
    });
}

module.exports = {
  initializeDatabase,
  createUsersCollection,
  createSubscriptionsCollection,
  createChatsCollection,
  createUsageLogsCollection,
  createFortniteDataCollection,
  createAnalyticsCollection,
  createIndexes
};
