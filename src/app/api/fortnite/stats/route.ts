import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { username } = await request.json();
    
    if (!username) {
      return NextResponse.json({ error: 'Username is required' }, { status: 400 });
    }

    const apiKey = process.env.FORTNITE_TRACKER_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Fortnite Tracker API key not configured' }, { status: 500 });
    }

    console.log('Fetching stats for username:', username);
    console.log('Using API key:', apiKey.substring(0, 8) + '...');

    // Use the correct Fortnite Tracker API endpoint
    const platform = 'pc'; // Default to PC, could be made configurable
    
    try {
      console.log(`Fetching from: https://fortnitetracker.com/api/v1/profile/${platform}/${username}`);
      
      const response = await fetch(`https://fortnitetracker.com/api/v1/profile/${platform}/${username}`, {
        headers: {
          'TRN-Api-Key': apiKey,
          'User-Agent': 'PathGen-AI/1.0 (Fortnite Stats Integration)',
          'Accept': 'application/json'
        }
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API request failed. Status:', response.status, 'Error:', errorText.substring(0, 200));
        
        // If we get a Cloudflare challenge, provide helpful fallback
        if (errorText.includes('Just a moment') || errorText.includes('Cloudflare') || response.status === 403) {
          console.log('Cloudflare protection detected - providing fallback response');
          
          return NextResponse.json({
            success: false,
            blocked: true,
            message: 'Fortnite Tracker is currently blocking automated requests',
            fallback: {
              manualCheckUrl: `https://fortnitetracker.com/profile/${platform}/${username}`,
              instructions: [
                'Click the link above to view your stats on Fortnite Tracker',
                'Copy your K/D ratio, win rate, and match count',
                'Return here and enter them manually for personalized AI coaching'
              ],
              manualStatsForm: {
                kd: 0,
                winRate: 0,
                matches: 0,
                avgPlace: 0
              }
            },
            username,
            platform
          });
        }
        
        return NextResponse.json({ 
          success: false,
          error: 'Failed to fetch Fortnite stats',
          details: errorText.substring(0, 200),
          status: response.status
        }, { status: response.status });
      }

      const data = await response.json();
      console.log('Raw API response received, data keys:', Object.keys(data || {}));

      // Transform the data to our format
      const transformedStats = transformTrackerData(data);
      const preferences = analyzePreferences(transformedStats);

      const result = {
        success: true,
        blocked: false,
        ...transformedStats,
        preferences
      };

      console.log('Successfully transformed and returning stats');
      return NextResponse.json(result);

    } catch (fetchError) {
      console.error('Fetch error:', fetchError);
      return NextResponse.json({ 
        success: false,
        error: 'Network error when contacting Fortnite Tracker',
        details: fetchError.message,
        fallback: {
          manualCheckUrl: `https://fortnitetracker.com/profile/${platform}/${username}`,
          instructions: [
            'Click the link above to view your stats on Fortnite Tracker',
            'Copy your K/D ratio, win rate, and match count',
            'Return here and enter them manually for personalized AI coaching'
          ]
        }
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Error in Fortnite stats API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function transformTrackerData(apiData: any): any {
  console.log('Transforming API data...');
  
  // Handle different possible data structures
  if (!apiData) {
    console.log('No API data received');
    return createDefaultStats();
  }

  // Check if we have the expected structure
  const stats = apiData.stats || {};
  const allStats = stats.all || {};
  
  console.log('Available stat categories:', Object.keys(stats));
  console.log('All stats keys:', Object.keys(allStats));

  // Extract stats with fallbacks
  const transformed = {
    account: {
      id: apiData.accountId || apiData.account?.id || 'unknown',
      name: apiData.epicUserHandle || apiData.account?.epicUserHandle || 'unknown',
      platform: apiData.platformId || apiData.account?.platformId || 'pc'
    },
    stats: {
      all: {
        wins: extractStatValue(allStats.wins) || 0,
        top10: extractStatValue(allStats.top10) || 0,
        kills: extractStatValue(allStats.kills) || 0,
        kd: extractStatValue(allStats.kd) || 0,
        matches: extractStatValue(allStats.matches) || 0,
        winRate: extractStatValue(allStats.winRate) || 0,
        avgPlace: extractStatValue(allStats.avgPlace) || 0,
        avgKills: extractStatValue(allStats.avgKills) || 0
      }
    },
    recentMatches: [] // We'll get this from a separate call if needed
  };

  console.log('Transformed stats:', transformed);
  return transformed;
}

function extractStatValue(stat: any): number | null {
  if (!stat) return null;
  
  // Fortnite Tracker stats can be in different formats
  if (typeof stat === 'number') return stat;
  if (typeof stat === 'string') return parseFloat(stat);
  if (stat.value !== undefined) return parseFloat(stat.value);
  if (stat.displayValue !== undefined) return parseFloat(stat.displayValue);
  
  return null;
}

function createDefaultStats(): any {
  return {
    account: {
      id: 'unknown',
      name: 'Unknown',
      platform: 'pc'
    },
    stats: {
      all: {
        wins: 0,
        top10: 0,
        kills: 0,
        kd: 0,
        matches: 0,
        winRate: 0,
        avgPlace: 0,
        avgKills: 0
      }
    },
    recentMatches: []
  };
}

function analyzePreferences(stats: any): any {
  // For now, provide default preferences since we don't have match data
  return {
    preferredDrop: 'Unknown',
    weakestZone: 'Unknown',
    bestWeapon: 'Unknown',
    avgSurvivalTime: 0
  };
}
