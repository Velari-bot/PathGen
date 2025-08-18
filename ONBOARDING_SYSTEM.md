# 🎮 PathGen AI Onboarding System

## Overview
The onboarding system collects comprehensive user information during signup to personalize the PathGen AI experience. It updates both the `users` and `usage` collections in Firebase.

## 🚀 How It Works

### 1. **Automatic Trigger**
- **New Users**: Onboarding automatically appears for users who don't have gaming preferences set
- **Existing Users**: Can manually trigger onboarding via "Update Preferences" button
- **Detection**: Checks if `userProfile.gaming.favoriteGame` exists

### 2. **4-Step Onboarding Process**

#### **Step 1: Basic Information**
- Display Name
- Timezone (auto-detected, user can change)
- Language preference

#### **Step 2: Gaming Preferences**
- Favorite Game (defaults to "Fortnite")
- Skill Level: Beginner, Intermediate, Advanced, Expert
- Play Style: Aggressive, Passive, Balanced
- Team Size: Solo, Duo, Squad, Any

#### **Step 3: Goals & Game Modes**
- Gaming Goals (select up to 5):
  - Improve K/D ratio
  - Increase win rate
  - Better building skills
  - Improve editing speed
  - Learn advanced strategies
  - Master specific weapons
  - Improve game sense
  - Better rotation timing
  - Learn new drop spots
  - Improve communication
- Preferred Game Modes (multiple selection):
  - Battle Royale
  - Team Rumble
  - Creative
  - Save the World
  - Arena
  - Custom Games

#### **Step 4: Preferences & Settings**
- Theme: Light, Dark, Auto
- Notification preferences:
  - Email notifications
  - Push notifications
  - SMS notifications
  - Discord notifications

### 3. **Firebase Updates**

#### **Users Collection**
```typescript
{
  uid: string,
  email: string,
  displayName: string,
  createdAt: timestamp,
  lastLogin: timestamp,
  
  profile: {
    language: string,
    timezone: string,
    avatar?: string,
    bio?: string,
    location?: string,
    dateOfBirth?: string,
    gender?: string
  },
  
  gaming: {
    favoriteGame: string,
    skillLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert',
    playStyle: 'aggressive' | 'passive' | 'balanced',
    preferredModes: string[],
    teamSize: 'solo' | 'duo' | 'squad' | 'any',
    goals: string[]
  },
  
  settings: {
    notifications: {
      email: boolean,
      push: boolean,
      sms: boolean,
      discord: boolean
    },
    privacy: {
      profilePublic: boolean,
      statsPublic: boolean,
      allowFriendRequests: boolean,
      showOnlineStatus: boolean
    },
    preferences: {
      theme: 'light' | 'dark' | 'auto',
      language: string,
      timezone: string,
      dateFormat: string,
      timeFormat: string
    }
  },
  
  statistics: {
    totalSessions: number,
    totalTime: number,
    lastActivity: timestamp,
    favoriteFeatures: string[],
    mostUsedTools: string[],
    improvementAreas: string[]
  }
}
```

#### **Usage Collection**
```typescript
{
  userId: string,
  createdAt: timestamp,
  updatedAt: timestamp,
  
  ai: {
    conversationsCreated: number,
    messagesUsed: number,
    lastReset: timestamp
  },
  
  epic: {
    lastSync: timestamp,
    statsPulled: number,
    syncCount: number,
    lastActivity: timestamp
  },
  
  osirion: {
    computeRequestsUsed: number,
    eventTypesUsed: number,
    lastReset: timestamp,
    matchesUsed: number,
    replayUploadsUsed: number,
    subscriptionTier: string,
    totalSessions: number,
    updatedAt: timestamp
  }
}
```

## 🔧 Technical Implementation

### **Components**
- `OnboardingModal.tsx` - Main onboarding component
- `DashboardPage.tsx` - Integrates onboarding flow
- `AuthContext.tsx` - Creates minimal user profile during signup

### **Key Functions**
- `loadUserProfile()` - Checks if user needs onboarding
- `handleOnboardingComplete()` - Reloads profile after completion
- `FirebaseService.initializeUserUsage()` - Creates usage tracking document

### **State Management**
- `showOnboarding` - Controls modal visibility
- `currentStep` - Tracks onboarding progress (1-4)
- `data` - Stores all onboarding responses

## 🎯 User Experience Features

### **Progress Tracking**
- Visual progress bar showing completion percentage
- Step counter (Step X of 4)
- Smooth transitions between steps

### **Responsive Design**
- Mobile-friendly interface
- Accessible form controls
- Clear visual feedback for selections

### **Data Validation**
- Required field validation
- Goal selection limits (max 5)
- Smart defaults based on user context

### **Personalization**
- Auto-detects timezone and language
- Pre-fills display name from auth
- Remembers previous selections

## 🔄 Integration Points

### **Dashboard Integration**
- Automatically shows for new users
- Manual trigger via "Update Preferences" button
- Seamless profile reload after completion

### **Auth Flow Integration**
- Triggers during first login
- Creates minimal profile during signup
- Preserves auth state during onboarding

### **Firebase Integration**
- Updates both `users` and `usage` collections
- Maintains data consistency
- Handles errors gracefully

## 🚀 Benefits

### **For Users**
- Personalized experience from day one
- Clear goal setting and tracking
- Customizable preferences
- Better AI coaching recommendations

### **For Developers**
- Comprehensive user data collection
- Structured data model
- Easy to extend and modify
- Consistent with existing architecture

### **For Business**
- Better user engagement
- Improved personalization
- Data-driven insights
- Enhanced user retention

## 🔮 Future Enhancements

### **Advanced Features**
- Profile picture upload
- Social media integration
- Achievement system
- Progress tracking

### **Analytics**
- Onboarding completion rates
- User preference analytics
- A/B testing for questions
- Conversion optimization

### **Integration**
- Third-party gaming APIs
- Social features
- Team matching
- Tournament integration

## 📝 Usage Examples

### **Manual Trigger**
```typescript
// In any component
const [showOnboarding, setShowOnboarding] = useState(false);

<button onClick={() => setShowOnboarding(true)}>
  Update Preferences
</button>

<OnboardingModal
  isOpen={showOnboarding}
  onComplete={() => setShowOnboarding(false)}
  userId={user.uid}
  userEmail={user.email}
  userDisplayName={user.displayName}
/>
```

### **Check Onboarding Status**
```typescript
const needsOnboarding = !userProfile?.gaming?.favoriteGame;
```

### **Customize Questions**
```typescript
// Modify GOAL_OPTIONS, GAME_MODES, etc. in OnboardingModal.tsx
const GOAL_OPTIONS = [
  'Your custom goal 1',
  'Your custom goal 2',
  // ... more goals
];
```

## 🐛 Troubleshooting

### **Common Issues**
1. **Modal not showing**: Check if `showOnboarding` state is true
2. **Data not saving**: Verify Firebase permissions and connection
3. **Profile not updating**: Ensure `loadUserProfile()` is called after completion

### **Debug Steps**
1. Check browser console for errors
2. Verify Firebase rules allow write access
3. Confirm user authentication state
4. Check network connectivity

## 📚 Related Files
- `src/components/OnboardingModal.tsx`
- `src/app/dashboard/page.tsx`
- `src/contexts/AuthContext.tsx`
- `src/lib/firebase-service.ts`

---

**Created**: August 15, 2025  
**Version**: 1.0.0  
**Status**: ✅ Complete and Ready for Testing
