# Firebase Setup Guide for PathGen


This guide explains how to set up Firebase for your PathGen application with secure Firestore rules and comprehensive data structures.

## Prerequisites

1. **Firebase CLI**: Install Firebase CLI globally
   ```bash
   npm install -g firebase-tools
   ```

2. **Firebase Project**: Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)

## Initial Setup

### 1. Login to Firebase
```bash
firebase login
```

### 2. Initialize Firebase in your project
```bash
firebase init
```

Select the following options:
- **Firestore**: Yes
- **Hosting**: Yes (optional)
- **Use existing project**: Yes (select your project)

### 3. Configure Firestore Rules
The `firestore.rules` file contains secure rules that:
- Allow users to access only their own data
- Prevent unauthorized access to other users' data
- Secure Epic accounts, Fortnite stats, conversations, and replay uploads
- Enforce user isolation for all collections

### 4. Configure Firestore Indexes
The `firestore.indexes.json` file contains performance-optimized indexes for:
- Epic accounts by user ID and link date
- Fortnite stats by user ID and update date
- Conversations by user ID and update date
- Replay uploads by user ID and creation date
- Users by email for authentication lookups

## Epic Games OAuth Integration

### Required OAuth Scopes
Your Epic Games OAuth configuration now includes these scopes:
- `basic_profile` - Basic account information
- `friends_list` - Access to friends list
- `country` - Geographic location data
- `presence` - Online status and presence

### OAuth Flow
1. User authenticates with Epic Games
2. OAuth callback immediately triggers Osirion API data pull
3. Comprehensive Fortnite stats are fetched and stored
4. Data is linked to user's Firebase account

## Comprehensive Data Structures

### Epic Account Data (`epicAccounts` collection)
```typescript
interface EpicAccount {
  id: string;
  userId: string;
  epicId: string;
  epicName: string;
  accountId: string;
  country: string;
  preferredLanguage: string;
  email: string;
  lastLogin: Date;
  status: string;
  verificationStatus: string;
  linkedAt: Date;
  updatedAt: Date;
}
```

### Fortnite Statistics (`fortniteStats` collection)
```typescript
interface FortniteStats {
  id: string;
  userId: string;
  epicName: string;
  platform: string;
  lastUpdated: Date;
  
  // Overall stats
  overall: {
    matches: number;
    wins: number;
    winRate: number;
    kills: number;
    deaths: number;
    kdRatio: number;
    avgPlace: number;
    avgKills: number;
    avgDeaths: number;
    avgDamage: number;
    avgSurvivalTime: number;
    totalDamage: number;
    totalSurvivalTime: number;
  };
  
  // Mode-specific stats
  solo: ModeStats;
  duo: ModeStats;
  squad: ModeStats;
  
  // Advanced metrics
  arena: ArenaStats;
  tournaments: TournamentStats;
  weapons: WeaponStats;
  vehicles: VehicleStats;
  building: BuildingStats;
  social: SocialStats;
  performance: PerformanceStats;
  
  // Usage tracking
  usage: {
    lastPlayed: Date;
    playTime: number;
    sessions: number;
    favoriteMode: string;
  };
  
  // Metadata
  metadata: {
    season: string;
    chapter: string;
    lastSync: Date;
    dataSource: string;
  };
}
```

### User Profile (`users` collection)
```typescript
interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  photoURL: string;
  createdAt: Date;
  updatedAt: Date;
  
  profile: {
    firstName: string;
    lastName: string;
    bio: string;
    avatar: string;
    preferences: UserPreferences;
  };
  
  gaming: {
    primaryGame: string;
    skillLevel: string;
    goals: string[];
    favoriteModes: string[];
  };
  
  subscription: {
    plan: string;
    status: string;
    startDate: Date;
    endDate: Date;
    features: string[];
  };
  
  settings: {
    notifications: NotificationSettings;
    privacy: PrivacySettings;
    theme: string;
    language: string;
  };
  
  statistics: {
    totalSessions: number;
    totalPlayTime: number;
    achievements: string[];
    lastActive: Date;
  };
}
```

### Additional Collections
- `replayUploads/{uploadId}` - Replay file uploads with metadata
- `conversations/{conversationId}` - AI coaching conversations
- `conversations/{conversationId}/messages/{messageId}` - Messages within conversations
- `subscriptions/{subscriptionId}` - User subscription data (read-only)
- `usage/{usageId}` - API usage tracking (read-only)

## Firebase Service Implementation

### Service Methods
The `FirebaseService` class provides these methods:

```typescript
// Epic Account Management
static async saveEpicAccount(account: EpicAccount): Promise<void>
static async getEpicAccount(userId: string): Promise<EpicAccount | null>

// Fortnite Stats Management
static async saveFortniteStats(stats: FortniteStats): Promise<void>
static async getFortniteStats(userId: string): Promise<FortniteStats | null>
static async getStatsByMode(userId: string, mode: string): Promise<ModeStats | null>
static async getStatsComparison(userId: string): Promise<StatsComparison | null>

// User Profile Management
static async saveUserProfile(profile: UserProfile): Promise<void>
static async getUserProfile(userId: string): Promise<UserProfile | null>

// Conversation Management
static async saveConversation(conversation: Conversation): Promise<void>
static async getConversations(userId: string): Promise<Conversation[]>
static async saveMessage(conversationId: string, message: Message): Promise<void>
```

## Immediate Osirion API Integration

### Automatic Data Pull
After successful Epic OAuth:
1. `pullStatsFromOsirion()` function is called immediately
2. Comprehensive Fortnite stats are fetched from Osirion API
3. Data is automatically saved to Firebase
4. Local state is updated with new statistics
5. User sees immediate results without manual refresh

### Data Synchronization
- Stats are pulled immediately after OAuth success
- Data is stored in both Firebase and local storage
- Firebase serves as the primary data source
- Local storage provides fallback for offline scenarios

## Deploying Rules and Indexes

### Windows Deployment Script
Use the provided `deploy-firebase.bat` file:
```cmd
deploy-firebase.bat
```

### Manual Deployment
```bash
# Deploy Firestore Rules
firebase deploy --only firestore:rules

# Deploy Firestore Indexes
firebase deploy --only firestore:indexes

# Deploy Everything
firebase deploy
```

## Security Rules Overview

### User Data Protection
- Users can only read/write their own user document
- All data is linked to user ID for security
- Epic accounts require valid user authentication
- Fortnite stats are user-specific and isolated

### Data Access Control
- Epic accounts: Users can only access accounts linked to their user ID
- Fortnite stats: Stats are user-specific and cannot be accessed by other users
- Conversations: Users can only access their own conversations and messages
- Replay uploads: Uploads are user-specific and secure
- Subscriptions & Usage: Read-only access for authenticated users

### Security Features
- **Authentication Required**: All operations require valid Firebase Auth
- **User Isolation**: Users can only access their own data
- **Data Validation**: Backend handles sensitive operations
- **Audit Trail**: Timestamps on all data operations
- **Nested Security**: Messages inherit conversation-level permissions

## Environment Variables

Ensure these are set in your `.env.local`:

```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Epic Games OAuth
NEXT_PUBLIC_EPIC_CLIENT_ID=your_epic_client_id
NEXT_PUBLIC_EPIC_REDIRECT_URI=your_redirect_uri

# Osirion API
OSIRION_API_KEY=your_osirion_api_key
OSIRION_API_URL=https://api.osirion.com
```

## Testing Security Rules

### Test Rules Locally
```bash
firebase emulators:start --only firestore
```

### Run Security Tests
```bash
firebase emulators:exec --only firestore "npm test"
```

## Monitoring & Analytics

### Firestore Usage
- Monitor read/write operations in Firebase Console
- Set up alerts for unusual activity
- Track API usage per user
- Monitor data growth and performance

### Security Monitoring
- Review authentication logs
- Monitor failed rule evaluations
- Set up alerts for security violations
- Track user data access patterns

## Performance Optimization

### Indexing Strategy
- Composite indexes for common query patterns
- User ID + timestamp combinations for efficient sorting
- Email-based lookups for authentication
- Mode-specific stat queries

### Data Structure Benefits
- Nested objects reduce document reads
- Comprehensive stats in single documents
- Efficient querying with proper indexes
- Minimal data duplication

## Best Practices

1. **Never expose Firebase config in client-side code** (already handled)
2. **Use security rules as your primary security layer**
3. **Validate data on both client and server**
4. **Regularly review and update security rules**
5. **Monitor usage patterns for anomalies**
6. **Use the Firebase service for all data operations**
7. **Implement proper error handling and fallbacks**
8. **Cache frequently accessed data locally**

## Troubleshooting

### Common Issues
- **Permission Denied**: Check if user is authenticated and accessing own data
- **Missing Indexes**: Deploy indexes if queries fail
- **Rule Evaluation**: Use Firebase Console to debug rule failures
- **OAuth Scope Issues**: Verify Epic Games OAuth scopes are properly configured
- **Data Sync Issues**: Check Osirion API connectivity and rate limits

### Debug Mode
Enable debug logging in development:
```typescript
// In your Firebase config
if (process.env.NODE_ENV === 'development') {
  console.log('Firebase Debug Mode Enabled');
  console.log('Epic OAuth Scopes:', 'basic_profile friends_list country presence');
}
```

### Data Validation
- Verify Epic account data structure after OAuth
- Check Fortnite stats completeness
- Ensure user profile data is properly linked
- Monitor conversation and message creation

## Support

For Firebase-specific issues:
- [Firebase Documentation](https://firebase.google.com/docs)
- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/get-started)
- [Firebase Community](https://firebase.google.com/community)

For PathGen-specific issues:
- Check the application logs for OAuth and API errors
- Review the Firebase service implementation
- Verify environment variables are set correctly
- Test Epic OAuth flow and Osirion API integration
- Check Firebase Console for rule evaluation failures

## Recent Updates

### v2.1 - Pro Tier Optimization & Cost Protection
- 🎯 **Pro Tier Limits**: Updated to 30,000 credits/month across all features
- 💰 **Margin Protection**: Maintains healthy $17.22+ margin per Pro user ($24.99 - $7.77 Osirion cost)
- 🛡️ **Abuse Prevention**: Protects against extreme data pulls while feeling unlimited
- 📊 **User Experience**: 99% of Pro users will never hit the 30,000 credit limit
- 🔒 **Cost Control**: Prevents cost spikes from extreme API abuse

### v2.0 - Comprehensive Data Integration
- ✅ Expanded Epic account data fields
- ✅ Comprehensive Fortnite statistics structure
- ✅ Immediate Osirion API integration after OAuth
- ✅ Enhanced Firebase security rules
- ✅ Performance-optimized Firestore indexes
- ✅ Complete Firebase service implementation
- ✅ User profile management system
- ✅ Windows-compatible deployment scripts
