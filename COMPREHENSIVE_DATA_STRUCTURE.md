# Comprehensive Data Structure for PathGen Firebase Integration

This document outlines the expanded data structure that now includes comprehensive Fortnite statistics, Epic account details, and user profile information.

## 🎮 Epic Account Data Structure

### Basic Fields
- **id**: Unique identifier for the Epic account
- **epicId**: Epic Games account ID
- **displayName**: Epic Games username
- **platform**: Gaming platform (PC, Xbox, PlayStation, etc.)
- **userId**: Firebase user ID (links to user account)
- **linkedAt**: When the account was connected
- **isReal**: Whether this is a real Epic OAuth account or development fallback
- **note**: Optional notes about the account

### Additional Epic Account Fields
- **accountId**: Epic account identifier
- **country**: User's country from Epic profile
- **preferredLanguage**: User's preferred language
- **email**: Epic account email address
- **lastLogin**: Last time the account was accessed
- **status**: Account status ('active', 'inactive', 'banned')
- **verificationStatus**: Verification level ('verified', 'unverified', 'pending')

## 📊 Fortnite Statistics Data Structure

### Core Information
- **id**: Unique identifier for the stats record
- **userId**: Firebase user ID
- **epicId**: Epic Games account ID
- **epicName**: Epic Games username
- **platform**: Gaming platform
- **lastUpdated**: When stats were last updated

### Overall Performance Stats
- **kd**: Kill/Death ratio
- **winRate**: Win percentage
- **matches**: Total matches played
- **avgPlace**: Average placement in matches
- **top1**: Number of victories
- **top3**: Number of top 3 finishes
- **top5**: Number of top 5 finishes
- **top10**: Number of top 10 finishes
- **top25**: Number of top 25 finishes
- **kills**: Total eliminations
- **deaths**: Total deaths
- **assists**: Total assists
- **damageDealt**: Total damage dealt to opponents
- **damageTaken**: Total damage taken
- **timeAlive**: Total time survived
- **distanceTraveled**: Total distance traveled
- **materialsGathered**: Total materials collected
- **structuresBuilt**: Total structures built

### Mode-Specific Stats
Each game mode (solo, duo, squad) includes the same comprehensive stats as overall performance.

### Arena Stats
- **division**: Current arena division
- **hype**: Arena hype points
- Plus all standard performance metrics

### Tournament Stats
- **totalTournaments**: Number of tournaments entered
- **bestPlacement**: Best tournament finish
- **totalWinnings**: Total prize money won
- **averagePlacement**: Average tournament finish
- **tournamentsWon**: Number of tournament victories
- **top3Finishes**: Number of top 3 tournament finishes
- **top10Finishes**: Number of top 10 tournament finishes

### Weapon Stats
- **favoriteWeapon**: Most used weapon
- **totalEliminations**: Total eliminations with weapons
- **weaponAccuracy**: Overall weapon accuracy
- **headshotPercentage**: Headshot percentage
- **criticalHits**: Number of critical hits

### Vehicle Stats
- **favoriteVehicle**: Most used vehicle
- **totalDistance**: Distance traveled in vehicles
- **eliminationsInVehicle**: Kills while in vehicles
- **timeInVehicle**: Time spent in vehicles

### Building Stats
- **totalStructuresBuilt**: Total structures constructed
- **structuresDestroyed**: Total structures destroyed
- **buildingEfficiency**: Building efficiency rating
- **editSpeed**: Building edit speed
- **buildingAccuracy**: Building accuracy

### Social Stats
- **friendsCount**: Number of friends
- **followersCount**: Number of followers
- **followingCount**: Number of people followed
- **teamKills**: Accidental team eliminations
- **friendlyFire**: Friendly fire incidents

### Performance Metrics
- **averageFPS**: Average frames per second
- **ping**: Network latency
- **packetLoss**: Network packet loss
- **serverRegion**: Server region
- **lastServerChange**: Last server change

### Usage Tracking
- **current**: Current API usage count
- **limit**: API usage limit
- **resetDate**: When usage resets
- **lastApiCall**: Last API call timestamp
- **totalApiCalls**: Total API calls made

### Metadata
- **season**: Current Fortnite season
- **chapter**: Current Fortnite chapter
- **lastMatchId**: ID of last match played
- **lastMatchDate**: Date of last match
- **dataSource**: Source of data ('osirion', 'epic', 'manual')
- **dataQuality**: Quality rating ('high', 'medium', 'low')
- **notes**: Additional notes about the data

## 🎬 Replay Upload Data Structure

### Basic Information
- **id**: Unique upload identifier
- **userId**: Firebase user ID
- **epicId**: Epic Games account ID
- **epicName**: Epic Games username
- **filename**: Original replay filename
- **fileSize**: File size in bytes
- **status**: Upload status ('uploading', 'processing', 'completed', 'failed')
- **createdAt**: When upload was created
- **updatedAt**: When upload was last updated

### Match Details
- **matchId**: Fortnite match identifier
- **matchDate**: When the match occurred
- **matchMode**: Game mode (solo, duo, squad, etc.)
- **matchResult**: Match outcome ('victory', 'defeat', 'draw')
- **placement**: Final placement in the match
- **playersInMatch**: Number of players in the match

### Analysis Results
- **keyMoments**: Array of important moments in the replay
- **mistakes**: Array of mistakes identified
- **improvements**: Array of suggested improvements
- **highlights**: Array of highlight moments
- **overallScore**: Overall performance score
- **categoryScores**: Detailed scores for different categories
  - **building**: Building skill score
  - **aim**: Aim accuracy score
  - **positioning**: Positioning score
  - **gameSense**: Game sense score
  - **mechanics**: Mechanical skill score

### Processing Information
- **processingTime**: Time taken to process the replay
- **analysisVersion**: Version of analysis algorithm used
- **aiModel**: AI model used for analysis
- **confidence**: Confidence level of the analysis

## 💬 Conversation Data Structure

### Basic Information
- **id**: Unique conversation identifier
- **userId**: Firebase user ID
- **epicId**: Epic Games account ID (optional)
- **epicName**: Epic Games username (optional)
- **title**: Conversation title
- **createdAt**: When conversation was created
- **updatedAt**: When conversation was last updated
- **messageCount**: Number of messages in conversation

### Conversation Metadata
- **type**: Conversation type ('coaching', 'analysis', 'strategy', 'general')
- **status**: Conversation status ('active', 'archived', 'deleted')
- **tags**: Array of tags for categorization

### AI Coaching Session
- **focusArea**: Primary focus area ('building', 'aim', 'positioning', 'gameSense', 'mechanics', 'general')
- **skillLevel**: User's skill level ('beginner', 'intermediate', 'advanced', 'expert')
- **goals**: Array of learning goals
- **progress**: Progress percentage (0-100)
- **nextSteps**: Array of next steps to take

### Performance Tracking
- **beforeStats**: User stats before coaching session
- **afterStats**: User stats after coaching session
- **improvementAreas**: Areas that improved
- **goalsMet**: Goals that were achieved
- **goalsMissed**: Goals that were not met

## 💬 Message Data Structure

### Basic Information
- **id**: Unique message identifier
- **text**: Message content
- **isUser**: Whether message is from user or AI
- **timestamp**: When message was sent

### Message Metadata
- **type**: Message type ('text', 'image', 'file', 'stats', 'analysis')
- **role**: Message role ('user', 'assistant', 'system')

### AI Response Details
- **model**: AI model used for response
- **confidence**: Confidence level of response
- **suggestions**: Array of suggestions provided
- **relatedTopics**: Array of related topics
- **followUpQuestions**: Array of follow-up questions

### User Message Analysis
- **intent**: User's intent
- **sentiment**: Message sentiment ('positive', 'negative', 'neutral')
- **containsStats**: Whether message contains statistics
- **containsReplay**: Whether message contains replay data
- **questionType**: Type of question ('how-to', 'why', 'what-if', 'comparison', 'general')

### Attachments
- **type**: Attachment type ('image', 'file', 'stats', 'replay')
- **url**: Attachment URL
- **filename**: Attachment filename
- **size**: Attachment size
- **metadata**: Additional attachment metadata

### Context
- **previousMessages**: Array of previous message summaries
- **currentTopic**: Current conversation topic
- **userStats**: User's current statistics
- **sessionGoals**: Current session goals

## 👤 User Profile Data Structure

### Basic Information
- **id**: Firebase user ID
- **email**: User's email address
- **displayName**: User's display name
- **createdAt**: When account was created
- **lastLogin**: Last login timestamp

### Profile Information
- **avatar**: Profile picture URL
- **bio**: User biography
- **location**: User's location
- **timezone**: User's timezone
- **language**: Preferred language
- **dateOfBirth**: Date of birth
- **gender**: Gender identity

### Gaming Preferences
- **favoriteGame**: Favorite game
- **skillLevel**: Skill level ('beginner', 'intermediate', 'advanced', 'expert')
- **playStyle**: Play style ('aggressive', 'passive', 'balanced', 'support')
- **preferredModes**: Preferred game modes
- **teamSize**: Preferred team size ('solo', 'duo', 'squad', 'any')
- **goals**: Gaming goals

### Subscription Information
- **status**: Subscription status ('free', 'basic', 'pro', 'premium')
- **tier**: Subscription tier
- **startDate**: Subscription start date
- **endDate**: Subscription end date
- **autoRenew**: Whether auto-renewal is enabled
- **paymentMethod**: Payment method
- **stripeCustomerId**: Stripe customer ID
- **stripeSubscriptionId**: Stripe subscription ID

### Settings
- **notifications**: Notification preferences
  - **email**: Email notifications enabled
  - **push**: Push notifications enabled
  - **sms**: SMS notifications enabled
  - **discord**: Discord notifications enabled
- **privacy**: Privacy settings
  - **profilePublic**: Profile is public
  - **statsPublic**: Statistics are public
  - **allowFriendRequests**: Allow friend requests
  - **showOnlineStatus**: Show online status
- **preferences**: User preferences
  - **theme**: UI theme ('light', 'dark', 'auto')
  - **language**: Interface language
  - **timezone**: Timezone setting
  - **dateFormat**: Date format preference
  - **timeFormat**: Time format ('12h', '24h')

### Statistics
- **totalSessions**: Total number of sessions
- **totalTime**: Total time spent using the app
- **lastActivity**: Last activity timestamp
- **favoriteFeatures**: Most used features
- **mostUsedTools**: Most used tools
- **improvementAreas**: Areas for improvement

## 🔐 Security Features

### Authentication Required
- All operations require valid Firebase Authentication
- Users can only access their own data
- Epic accounts are linked to user IDs for security

### Data Isolation
- Users cannot access other users' data
- All collections are protected by user ID matching
- Nested collections inherit parent security rules

### Audit Trail
- All data operations include timestamps
- Creation and update times are tracked
- Data source and quality are documented

## 📈 Performance Optimizations

### Database Indexes
- User ID + timestamp combinations for efficient queries
- Epic account lookups by user ID
- Conversation sorting by update time
- Replay upload sorting by creation time

### Data Structure
- Efficient nested data organization
- Optional fields to reduce storage for unused features
- Batch operations for multiple related updates

## 🚀 Deployment

### Firebase Rules
- Secure Firestore security rules
- Performance-optimized indexes
- Windows batch file for easy deployment

### Environment Setup
- Comprehensive setup documentation
- Environment variable configuration
- Firebase CLI integration

This comprehensive data structure provides a robust foundation for the PathGen application, enabling detailed Fortnite analytics, secure user data management, and scalable AI coaching features.
