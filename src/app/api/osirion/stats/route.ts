import { NextRequest, NextResponse } from 'next/server';
import { OsirionService } from '@/lib/osirion';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import * as admin from 'firebase-admin';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('📥 Osirion API received:', body);
    
    const { epicId, userId, platform = 'pc' } = body;
    
    console.log('🔍 Parsed data:', { epicId, userId, platform });
    
    if (!epicId) {
      console.log('❌ Missing epicId');
      return NextResponse.json({ 
        error: 'Epic ID is required',
        received: body,
        missing: 'epicId'
      }, { status: 400 });
    }

    if (!userId) {
      console.log('❌ Missing userId');
      return NextResponse.json({ 
        error: 'User ID is required',
        received: body,
        missing: 'userId'
      }, { status: 400 });
    }

    // Initialize Firebase Admin if not already initialized
    if (getApps().length === 0) {
      // Only initialize if we have the required environment variables
      if (process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
        try {
          initializeApp({
            credential: cert({
              projectId: process.env.FIREBASE_PROJECT_ID || 'pathgen-a771b',
              clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
              privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
            }),
          });
        } catch (error: any) {
          if (error.code !== 'app/duplicate-app') {
            console.error('❌ Firebase Admin initialization error:', error);
            return NextResponse.json({
              success: false,
              error: 'Firebase initialization failed',
              details: error.message
            }, { status: 500 });
          }
        }
      }
    }

    const db = getFirestore();
    
    // Check monthly usage limit (10 pulls per month per user)
    try {
      const usageRef = db.collection('usage').doc(userId);
      const usageDoc = await usageRef.get();
      
      if (usageDoc.exists) {
        const usageData = usageDoc.data();
        const currentMonth = new Date().getFullYear() * 100 + new Date().getMonth() + 1;
        const lastUsageMonth = usageData?.lastMonth || 0;
        
        // Reset usage if it's a new month
        if (currentMonth > lastUsageMonth) {
          await usageRef.set({
            lastMonth: currentMonth,
            osirionPulls: 0,
            lastReset: new Date()
          }, { merge: true });
          console.log('🔄 Reset monthly usage counter for new month');
        }
        
        const currentPulls = usageData?.osirionPulls || 0;
        if (currentPulls >= 10) {
          console.log(`❌ Monthly limit reached: ${currentPulls}/10 pulls used`);
          return NextResponse.json({
            success: false,
            blocked: true,
            message: 'Monthly limit reached',
            error: 'You have used all 10 monthly Osirion pulls',
            currentUsage: currentPulls,
            limit: 10,
            suggestion: 'Wait until next month or upgrade your plan for more pulls',
            fallback: {
              manualCheckUrl: `https://osirion.gg/profile/${epicId}`,
              instructions: [
                'Monthly limit reached - please check your stats manually on Osirion',
                'You can still view cached stats if available',
                'Limit resets at the beginning of each month'
              ]
            }
          });
        }
        
        console.log(`📊 Current monthly usage: ${currentPulls}/10 pulls`);
      } else {
        // First time user, initialize usage
        await usageRef.set({
          lastMonth: new Date().getFullYear() * 100 + new Date().getMonth() + 1,
          osirionPulls: 0,
          lastReset: new Date()
        });
        console.log('🆕 Initialized usage tracking for new user');
      }
    } catch (usageError) {
      console.error('⚠️ Warning: Could not check usage limits:', usageError);
      // Continue with the request even if usage tracking fails
    }

    // Check if Osirion API key is configured
    if (!process.env.OSIRION_API_KEY) {
      console.error('❌ OSIRION_API_KEY environment variable not set');
      return NextResponse.json({
        success: false,
        blocked: true,
        message: 'Osirion API not configured',
        error: 'OSIRION_API_KEY environment variable is missing',
        suggestion: 'Please configure the Osirion API key in your environment variables'
      }, { status: 500 });
    }

    const osirionService = new OsirionService();
    
    try {
      // Get player stats from Osirion using Epic ID
      const stats = await osirionService.getPlayerStats(epicId, platform);
      
      console.log('📊 Raw Osirion stats received:', JSON.stringify(stats, null, 2));
      
      if (!stats) {
        console.log('❌ No stats returned from Osirion service, trying to load from Firebase...');
        
        // Try to load stats from Firebase as fallback
        try {
          const fortniteDataRef = db.collection('fortniteData').doc(userId);
          const fortniteDoc = await fortniteDataRef.get();
          
          if (fortniteDoc.exists) {
            const firebaseData = fortniteDoc.data();
            console.log('✅ Found existing stats in Firebase:', firebaseData);
            
            if (firebaseData) {
              // Return the cached stats from Firebase
                             // Get current usage for response
               let currentUsage = 0;
               try {
                 const usageRef = db.collection('usage').doc(userId);
                 const usageDoc = await usageRef.get();
                 if (usageDoc.exists) {
                   currentUsage = usageDoc.data()?.osirionPulls || 0;
                 }
               } catch (error) {
                 console.error('⚠️ Could not get current usage for response:', error);
               }

               return NextResponse.json({
                 success: true,
                 blocked: false,
                 data: {
                   account: {
                     id: firebaseData.epicId || epicId,
                     name: firebaseData.epicName || 'Unknown',
                     platform: 'pc'
                   },
                   stats: {
                     all: {
                       wins: firebaseData.stats?.wins || 0,
                       top10: firebaseData.stats?.top10 || 0,
                       kills: firebaseData.stats?.kills || 0,
                       kd: firebaseData.stats?.kd || 0,
                       matches: firebaseData.stats?.matches || 0,
                       winRate: firebaseData.stats?.wins && firebaseData.stats?.matches ? 
                           (firebaseData.stats.wins / firebaseData.stats.matches) * 100 : 0,
                       avgPlace: firebaseData.stats?.placement || 0,
                       avgKills: firebaseData.stats?.kills && firebaseData.stats?.matches ? 
                           firebaseData.stats.kills / firebaseData.stats.matches : 0
                     }
                   },
                   recentMatches: [],
                   preferences: {
                     preferredDrop: 'Unknown',
                     weakestZone: 'Unknown',
                     bestWeapon: 'Unknown',
                     avgSurvivalTime: firebaseData.stats?.timeAlive || 0
                   },
                   osirionData: {
                     totalMatches: firebaseData.stats?.matches || 0,
                     assists: firebaseData.stats?.assists || 0,
                     events: []
                   }
                 },
                 usage: {
                   current: currentUsage,
                   limit: 10,
                   remaining: 10 - currentUsage
                 },
                 monthlyLimit: {
                   pullsUsed: currentUsage,
                   pullsRemaining: 10 - currentUsage,
                   resetsNextMonth: true
                 },
                 source: 'firebase_cache',
                 message: 'Stats loaded from Firebase cache (Osirion API unavailable)'
               });
            }
          }
        } catch (firebaseError) {
          console.error('⚠️ Could not load from Firebase cache:', firebaseError);
        }
        
        // If no Firebase cache, return error
        return NextResponse.json({
          success: false,
          blocked: true,
          message: 'Failed to fetch Osirion stats and no cached data available',
          fallback: {
            manualCheckUrl: `https://osirion.gg/profile/${epicId}`,
            instructions: [
              'API call failed - please check your Epic ID',
              'You can manually enter your stats for personalized AI coaching'
            ],
            manualStatsForm: {
              kd: 0,
              winRate: 0,
              matches: 0,
              avgPlace: 0
            }
          }
        });
      }
      
      // Validate stats structure
      if (!stats.summary || !stats.matches) {
        console.log('❌ Invalid stats structure:', { hasSummary: !!stats.summary, hasMatches: !!stats.matches });
        return NextResponse.json({
          success: false,
          blocked: true,
          message: 'Invalid stats structure received from Osirion',
          error: 'Missing summary or matches data',
          receivedStats: stats
        });
      }

      // Increment usage counter (skipped for now)
      console.log('📊 Usage tracking skipped - focusing on core functionality');

      // Transform to match existing frontend expectations
      console.log('🔧 Transforming Osirion stats to frontend format...');
      
      const transformedStats = {
        account: {
          id: stats.accountId || epicId,
          name: stats.username || 'Unknown',
          platform: stats.platform || platform
        },
        stats: {
          all: {
            wins: stats.summary?.wins || 0,
            top10: stats.summary?.top10 || 0,
            kills: stats.summary?.kills || 0,
            kd: stats.summary?.kills && stats.summary?.totalMatches ? 
                (stats.summary.kills / Math.max(stats.summary.totalMatches - stats.summary.wins, 1)) : 0,
            matches: stats.summary?.totalMatches || 0,
            winRate: stats.summary?.totalMatches && stats.summary?.wins ? 
                (stats.summary.wins / stats.summary.totalMatches) * 100 : 0,
            avgPlace: stats.summary?.avgPlacement || 0,
            avgKills: stats.summary?.avgKills || 0
          }
        },
        recentMatches: stats.matches?.slice(0, 25) || [], // Default to 25 matches
        preferences: {
          preferredDrop: 'Unknown', // Would be calculated from match data
          weakestZone: 'Unknown',
          bestWeapon: 'Unknown',
          avgSurvivalTime: stats.summary?.avgSurvivalTime || 0
        },
        osirionData: {
          totalMatches: stats.summary?.totalMatches || 0,
          assists: stats.summary?.assists || 0,
          events: stats.matches ? stats.matches.flatMap(m => m.events || []).slice(0, 10) : [] // Default to 10 events
        }
      };
      
      console.log('✅ Transformed stats:', JSON.stringify(transformedStats, null, 2));

      // Save stats to Firebase for local storage
      try {
        const fortniteData = {
          userId: userId,
          epicId: epicId,
          epicName: transformedStats.account.name,
          syncedAt: new Date(),
          stats: {
            wins: transformedStats.stats.all.wins,
            kd: transformedStats.stats.all.kd,
            placement: transformedStats.stats.all.avgPlace,
            earnings: 0, // Not available from Osirion
            matches: transformedStats.stats.all.matches,
            top1: transformedStats.stats.all.wins,
            top3: 0, // Calculate from matches if needed
            top5: 0, // Calculate from matches if needed
            top10: transformedStats.stats.all.top10,
            top25: 0, // Calculate from matches if needed
            kills: transformedStats.stats.all.kills,
            deaths: 0, // Not available from Osirion
            assists: transformedStats.osirionData.assists,
            damageDealt: 0, // Not available from Osirion
            damageTaken: 0, // Not available from Osirion
            timeAlive: transformedStats.preferences.avgSurvivalTime,
            distanceTraveled: 0, // Not available from Osirion
            materialsGathered: 0, // Not available from Osirion
            structuresBuilt: 0 // Not available from Osirion
          },
          modes: {
            // For now, use overall stats for all modes
            solo: {
              kd: transformedStats.stats.all.kd,
              winRate: transformedStats.stats.all.winRate,
              matches: Math.floor(transformedStats.stats.all.matches / 3), // Estimate
              avgPlace: transformedStats.stats.all.avgPlace,
              top1: Math.floor(transformedStats.stats.all.wins / 3),
              top3: Math.floor(transformedStats.stats.all.top10 / 3),
              top5: Math.floor(transformedStats.stats.all.top10 / 3),
              top10: Math.floor(transformedStats.stats.all.top10 / 3),
              top25: Math.floor(transformedStats.stats.all.matches / 4),
              kills: Math.floor(transformedStats.stats.all.kills / 3),
              deaths: Math.floor(transformedStats.stats.all.matches / 3),
              assists: Math.floor(transformedStats.osirionData.assists / 3),
              damageDealt: 0,
              damageTaken: 0,
              timeAlive: transformedStats.preferences.avgSurvivalTime,
              distanceTraveled: 0,
              materialsGathered: 0,
              structuresBuilt: 0
            },
            duo: {
              kd: transformedStats.stats.all.kd,
              winRate: transformedStats.stats.all.winRate,
              matches: Math.floor(transformedStats.stats.all.matches / 3),
              avgPlace: transformedStats.stats.all.avgPlace,
              top1: Math.floor(transformedStats.stats.all.wins / 3),
              top3: Math.floor(transformedStats.stats.all.top10 / 3),
              top5: Math.floor(transformedStats.stats.all.top10 / 3),
              top10: Math.floor(transformedStats.stats.all.top10 / 3),
              top25: Math.floor(transformedStats.stats.all.matches / 4),
              kills: Math.floor(transformedStats.stats.all.kills / 3),
              deaths: Math.floor(transformedStats.stats.all.matches / 3),
              assists: Math.floor(transformedStats.osirionData.assists / 3),
              damageDealt: 0,
              damageTaken: 0,
              timeAlive: transformedStats.preferences.avgSurvivalTime,
              distanceTraveled: 0,
              materialsGathered: 0,
              structuresBuilt: 0
            },
            squad: {
              kd: transformedStats.stats.all.kd,
              winRate: transformedStats.stats.all.winRate,
              matches: Math.floor(transformedStats.stats.all.matches / 3),
              avgPlace: transformedStats.stats.all.avgPlace,
              top1: Math.floor(transformedStats.stats.all.wins / 3),
              top3: Math.floor(transformedStats.stats.all.top10 / 3),
              top5: Math.floor(transformedStats.stats.all.top10 / 3),
              top10: Math.floor(transformedStats.stats.all.top10 / 3),
              top25: Math.floor(transformedStats.stats.all.matches / 4),
              kills: Math.floor(transformedStats.stats.all.kills / 3),
              deaths: Math.floor(transformedStats.stats.all.matches / 3),
              assists: Math.floor(transformedStats.osirionData.assists / 3),
              damageDealt: 0,
              damageTaken: 0,
              timeAlive: transformedStats.preferences.avgSurvivalTime,
              distanceTraveled: 0,
              materialsGathered: 0,
              structuresBuilt: 0
            }
          },
          dataSource: 'osirion',
          dataQuality: 'high',
          notes: 'Stats pulled from Osirion API and saved to Firebase'
        };

                 // Save to Firebase
         const fortniteDataRef = db.collection('fortniteData').doc(userId);
         await fortniteDataRef.set(fortniteData, { merge: true });
         console.log('✅ Fortnite stats saved to Firebase successfully');

         // Also save to fortniteStats collection for compatibility
         const fortniteStatsRef = db.collection('fortniteStats').doc(userId);
         await fortniteStatsRef.set({
           userId: userId,
           epicId: epicId,
           epicName: transformedStats.account.name,
           syncedAt: new Date(),
           stats: fortniteData.stats,
           modes: fortniteData.modes,
           dataSource: 'osirion',
           dataQuality: 'high',
           notes: 'Stats pulled from Osirion API and saved to Firebase'
         }, { merge: true });
         console.log('✅ Fortnite stats also saved to fortniteStats collection');

         // Increment usage counter after successful API call
         try {
           const usageRef = db.collection('usage').doc(userId);
           await usageRef.update({
             osirionPulls: admin.firestore.FieldValue.increment(1),
             lastPull: new Date()
           });
           console.log('📊 Usage counter incremented successfully');
         } catch (incrementError) {
           console.error('⚠️ Warning: Could not increment usage counter:', incrementError);
         }

      } catch (firebaseError) {
        console.error('⚠️ Warning: Could not save to Firebase:', firebaseError);
        // Continue with the response even if Firebase save fails
      }

      // Get current usage for response
      let currentUsage = 0;
      try {
        const usageRef = db.collection('usage').doc(userId);
        const usageDoc = await usageRef.get();
        if (usageDoc.exists) {
          currentUsage = usageDoc.data()?.osirionPulls || 0;
        }
      } catch (error) {
        console.error('⚠️ Could not get current usage for response:', error);
      }

      return NextResponse.json({
        success: true,
        blocked: false,
        data: transformedStats, // Wrap in data property for frontend compatibility
        usage: {
          current: currentUsage + 1, // +1 because we just incremented it
          limit: 10,
          remaining: 10 - (currentUsage + 1)
        },
        monthlyLimit: {
          pullsUsed: currentUsage + 1,
          pullsRemaining: 10 - (currentUsage + 1),
          resetsNextMonth: true
        }
      });

    } catch (fetchError) {
      console.error('Osirion API error:', fetchError);
      return NextResponse.json({ 
        success: false,
        blocked: true,
        error: 'Network error when contacting Osirion API',
        details: (fetchError as Error).message,
        fallback: {
          manualCheckUrl: `https://osirion.gg/profile/${epicId}`,
          instructions: [
            'Click the link above to view your stats on Osirion',
            'Copy your K/D ratio, win rate, and match count',
            'Return here and enter them manually for personalized AI coaching'
          ],
          manualStatsForm: {
            kd: 0,
            winRate: 0,
            matches: 0,
            avgPlace: 0
          }
        }
      });
    }

  } catch (error) {
    console.error('Error in Osirion stats API:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Internal server error',
      details: (error as Error).message
    }, { status: 500 });
  }
}
