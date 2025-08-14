import { NextRequest, NextResponse } from 'next/server';
import { OsirionService, UsageTracker, SUBSCRIPTION_TIERS } from '@/lib/osirion';

export async function POST(request: NextRequest) {
  try {
    const { epicId, userId, platform = 'pc' } = await request.json();
    
    if (!epicId) {
      return NextResponse.json({ error: 'Epic ID is required' }, { status: 400 });
    }

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Check user's subscription tier (this would typically come from a database)
    // For now, assume free tier
    const userTier = 'free' as keyof typeof SUBSCRIPTION_TIERS;
    const limits = SUBSCRIPTION_TIERS[userTier].limits;

    // Check current usage
    const currentUsage = await UsageTracker.checkUsage(userId, userTier);
    
    // Check if user can fetch more matches
    if (limits.osirion.matchesPerMonth !== -1 && 
        currentUsage.osirion.matchesUsed >= limits.osirion.matchesPerMonth) {
      return NextResponse.json({
        success: false,
        blocked: true,
        message: 'Monthly match limit reached',
        upgradeRequired: true,
        currentUsage: currentUsage.osirion.matchesUsed,
        limit: limits.osirion.matchesPerMonth,
        suggestion: 'Upgrade to access more matches per month'
      });
    }

    const osirionService = new OsirionService();
    
    try {
      // Get player stats from Osirion using Epic ID
      const stats = await osirionService.getPlayerStats(epicId, platform);
      
      if (!stats) {
        return NextResponse.json({
          success: false,
          blocked: true,
          message: 'Failed to fetch Osirion stats',
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

      // Increment usage counter
      await UsageTracker.incrementUsage(userId, 'matches');

      // Transform to match existing frontend expectations
      const transformedStats = {
        account: {
          id: stats.accountId,
          name: stats.username,
          platform: stats.platform
        },
        stats: {
          all: {
            wins: stats.summary.wins,
            top10: stats.summary.top10,
            kills: stats.summary.kills,
            kd: stats.summary.kills / Math.max(stats.summary.totalMatches - stats.summary.wins, 1),
            matches: stats.summary.totalMatches,
            winRate: stats.summary.totalMatches > 0 ? (stats.summary.wins / stats.summary.totalMatches) * 100 : 0,
            avgPlace: stats.summary.avgPlacement,
            avgKills: stats.summary.avgKills
          }
        },
        recentMatches: stats.matches.slice(0, limits.osirion.matchesPerMonth === -1 ? 25 : limits.osirion.matchesPerMonth),
        preferences: {
          preferredDrop: 'Unknown', // Would be calculated from match data
          weakestZone: 'Unknown',
          bestWeapon: 'Unknown',
          avgSurvivalTime: stats.summary.avgSurvivalTime
        },
        osirionData: {
          totalMatches: stats.summary.totalMatches,
          assists: stats.summary.assists,
          events: stats.matches.flatMap(m => m.events).slice(0, limits.osirion.eventTypesPerMatch === -1 ? undefined : limits.osirion.eventTypesPerMatch)
        }
      };

      return NextResponse.json({
        success: true,
        blocked: false,
        ...transformedStats,
        usage: {
          current: currentUsage.osirion.matchesUsed + 1,
          limit: limits.osirion.matchesPerMonth,
          resetDate: currentUsage.resetDate
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
