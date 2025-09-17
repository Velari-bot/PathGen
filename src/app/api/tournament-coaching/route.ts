/**
 * Tournament Coaching API
 * Provides AI-powered tournament coaching based on user stats and tournament data
 */

import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/firebase-admin-api';

export async function POST(request: NextRequest) {
  try {
    const { 
      userId, 
      tournamentType, // 'solo' | 'duos' | 'duos_division_cups'
      region, // 'NAC' | 'EU'
      currentPoints = 0,
      gamesRemaining = 10,
      targetPoints = 300,
      userStats // Optional user fortnite stats
    } = await request.json();

    if (!userId || !tournamentType || !region) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, tournamentType, region' },
        { status: 400 }
      );
    }

    // Generate tournament-specific coaching
    const coaching = await generateTournamentCoaching({
      userId,
      tournamentType,
      region,
      currentPoints,
      gamesRemaining,
      targetPoints,
      userStats
    });

    return NextResponse.json({
      success: true,
      coaching
    });

  } catch (error) {
    console.error('❌ Error generating tournament coaching:', error);
    return NextResponse.json({ error: 'Failed to generate coaching' }, { status: 500 });
  }
}

async function generateTournamentCoaching({
  userId,
  tournamentType,
  region,
  currentPoints,
  gamesRemaining,
  targetPoints,
  userStats
}: {
  userId: string;
  tournamentType: 'solo' | 'duos' | 'duos_division_cups';
  region: 'NAC' | 'EU';
  currentPoints: number;
  gamesRemaining: number;
  targetPoints: number;
  userStats?: any;
}) {
  const pointsNeeded = targetPoints - currentPoints;
  const averageNeeded = gamesRemaining > 0 ? pointsNeeded / gamesRemaining : 0;

  // Tournament-specific point values (updated for Division Cups Day 2)
  const pointValues = tournamentType === 'solo' 
    ? { win: 60, elimination: 2, top10: 40, top25: 30 }
    : tournamentType === 'duos_division_cups'
    ? { win: 65, elimination: 1, top5: 50, top10: 40, top25: 25 } // Day 2: Div 2-4 = 1pt, Div 5 = 0pts
    : { win: 65, elimination: 2, top5: 50, top10: 40, top25: 25 };

  // Get tournament thresholds
  const thresholds = getRegionThresholds(region, tournamentType);

  // Generate strategies based on current situation
  let strategy = '';
  let loadoutRecommendation = '';
  let playstyleRecommendation = '';
  let riskLevel = 'medium';

  if (averageNeeded > 50) {
    // High points needed - aggressive strategy
    strategy = `🎯 **HIGH-POINT STRATEGY NEEDED**
    
You need ${pointsNeeded} points in ${gamesRemaining} games (${averageNeeded.toFixed(1)} avg/game).

**Recommended Approach:**
${tournamentType === 'solo' ? 
`- Go for a win early (60 points + eliminations)
- If you're a strong fighter, key the first 1-2 games
- Need 10-15 eliminations in win to hit target efficiently
- After big game, play safer for consistent placement` :
`- Focus on early wins (65 points each)
- Coordinate with teammate for team eliminations  
- Target contested drops for early eliminations
- Need wins + solid placement games`}

**Risk Assessment:** This is high-risk but necessary given your target.`;
    riskLevel = 'high';
    playstyleRecommendation = 'aggressive';

  } else if (averageNeeded > 30) {
    // Medium points - balanced strategy
    strategy = `⚖️ **BALANCED STRATEGY**
    
${tournamentType === 'duos_division_cups' ? 
`🆕 **DIVISION CUPS DAY 2 UPDATE:**
- Elimination points REDUCED: Div 2-4 = 1pt, Div 5 = 0pts
- Max placement is MORE important than ever
- Defend yourself when keyed, but avoid unnecessary fights
- Focus on endgames - surge only active ~15% Div 1, ~3% other divs` : ''}`
    
You need ${pointsNeeded} points in ${gamesRemaining} games (${averageNeeded.toFixed(1)} avg/game).

**Recommended Approach:**
${tournamentType === 'solo' ?
`- Mix of placement and smart eliminations
- Aim for Top 10 every game (40 points)
- Take 1-2 smart fights per game
- Consider going for 1 win if opportunity arises` :
`- Focus on consistent Top 5 placements (50+ points)
- Take smart team fights when advantageous
- Prioritize survival over risky eliminations
- Look for 1-2 wins across remaining games`}

**Risk Assessment:** Achievable with smart gameplay.`;
    riskLevel = 'medium';
    playstyleRecommendation = 'balanced';

  } else {
    // Low points needed - placement strategy
    strategy = `🛡️ **PLACEMENT STRATEGY**
    
${tournamentType === 'duos_division_cups' ? 
`🎯 **DIVISION CUPS DAY 2 META:**
- Elim points nerfed: Div 2-4 (1pt), Div 5 (0pts)  
- Play MAX PLACEMENT strategy
- Avg top 5s/top 10s will qualify easily
- Defend when keyed but avoid W-keying
- Queue bug still exists: 2min requeue for Div 2-4, 6min for Div 1+5

` : ''}`
    
You need ${pointsNeeded} points in ${gamesRemaining} games (${averageNeeded.toFixed(1)} avg/game).

**Recommended Approach:**
${tournamentType === 'solo' ?
`- Play for placement every game
- Hide and rotate early (golden rule)
- Avoid all unnecessary fights
- Top 25 every game should exceed target
- Only fight if absolutely necessary for placement` :
`- Max placement strategy every game
- Avoid early/mid game fights completely
- Focus on perfect rotations and positioning
- Top 10 consistently will easily hit target`}

**Risk Assessment:** Very achievable with consistent execution.`;
    riskLevel = 'low';
    playstyleRecommendation = 'passive';
  }

  // Tournament-specific loadout recommendations
  if (tournamentType === 'solo') {
    loadoutRecommendation = `🔫 **SOLO LOADOUT**

**Weapons:**
- Revolver (if comfortable) OR Pump + AR combo
- Fury AR recommended for close-range spray
- Test loadout in Ranked first if unsure

**Mobility:** 
- ✅ Launch Pads (crash pads vaulted - safer meta!)

**Heals:**
- Priority: Fizz + Legendary Slurps
- Backup: Chug Splashes
- Fill: Med Kits, Minis, Bigs

**⚠️ CRASH PAD BUG WARNING:**
- Don't double bounce with 2 pads
- No bunny hopping when landing downhill
- Fizz BEFORE the pad, not during`;

  } else {
    loadoutRecommendation = `🔫 **DUOS LOADOUT**

**Weapons:**
- Sentinel Pump OR Revolver (preference)
- MK7 AR (current meta weapon)

**Mobility:**
- ✅ Launch Pads (crash pads VAULTED - much safer!)
- Use Launch Pads in zones 6-8 for optimal rotations

**Heals:**
- Perfect: Fizz + Legendary Slurps
- Excellent: Chug Splashes
- Standard: Minis/Bigs/Med Kits

**Team Coordination:**
- Split heal priorities between teammates
- One player focuses on team support items`;
  }

  // Add user stats analysis if provided
  let statsAnalysis = '';
  if (userStats) {
    const avgPlacement = userStats.averagePlacement || 50;
    const avgEliminations = userStats.averageEliminations || 2;
    const winRate = userStats.winRate || 0.05;

    statsAnalysis = `📊 **YOUR STATS ANALYSIS**

Based on your recent performance:
- Average Placement: ${avgPlacement}
- Average Eliminations: ${avgEliminations}
- Win Rate: ${(winRate * 100).toFixed(1)}%

**Personalized Recommendations:**
${avgPlacement > 25 ? 
  '- Focus on early rotation and positioning improvement\n- Practice zone prediction and movement\n- Avoid mid-game fights that compromise placement' :
  '- Your placement is strong - can afford smart aggression\n- Look for opportunities to increase elimination count\n- Consider going for wins when positioned well'
}

${avgEliminations < 2 ?
  '- Practice aim training and boxfighting\n- Take more smart 1v1 opportunities\n- Focus on third-partying weak opponents' :
  '- Good elimination rate - balance with placement focus\n- Use fighting skills strategically for better positions'
}`;
  }

  // Regional context
  const regionalContext = `🌍 **${region} TOURNAMENT CONTEXT**

${tournamentType === 'duos_division_cups' ? `
**Current DIVISION CUPS thresholds (${region}):**
- Div 1: ${(thresholds as any).div1} points (Day 1 qual)
- Div 2: ${(thresholds as any).div2} points
- Div 3: ${(thresholds as any).div3} points
- Div 4: ${(thresholds as any).div4} points (Hardest)
- Div 5: ${(thresholds as any).div5} points (Most accessible)

${region === 'EU' ? 
  'EU is consistently 15-60 points higher per division than NAC.' :
  'NAC generally 15-60 points lower than EU but still competitive.'
}

**Division Difficulty Analysis:**
- Div 4 requires most aggressive play (400+ EU / 350+ NAC)
- Div 1 is cumulative format (conservative Day 1, aggressive Day 2)
- Div 5 most forgiving for learning the format
` : `
**Current ${tournamentType.toUpperCase()} thresholds:**
- Top 100: ${(thresholds as any).top100} points
- Top 500: ${(thresholds as any).top500} points  
- Top 1000: ${(thresholds as any).top1000} points

${region === 'EU' ? 
  'EU typically has higher point requirements due to larger player base and increased competition.' :
  'NAC generally has slightly lower thresholds but still highly competitive.'
}

**Your Target (${targetPoints} pts) puts you in:**
${targetPoints >= (thresholds as any).top100 ? '🏆 Top 100 range (Qualification track)' :
  targetPoints >= (thresholds as any).top500 ? '🥇 Top 500 range (Excellent placement)' :
  targetPoints >= (thresholds as any).top1000 ? '🥈 Top 1000 range (Strong showing)' :
  '🥉 Solid placement range'
}`}`;

  return {
    strategy,
    loadoutRecommendation,
    statsAnalysis,
    regionalContext,
    playstyleRecommendation,
    riskLevel,
    averagePointsNeeded: averageNeeded,
    pointsRemaining: pointsNeeded,
    confidence: calculateConfidence(averageNeeded, riskLevel, userStats),
    nextGameTarget: Math.ceil(averageNeeded),
    safetyTips: [
      'Queue 6 minutes early if in Top 100, 5 minutes otherwise',
      'If queue hits 6 minutes, you have queue bug - unready and requeue',
      'Launch Pads are safer than crash pads (which are vaulted)',
      'Start 1 minute late in Division Cups to avoid early keying',
      'Division Cups: 2min queue for Div 2-4, 6min for Div 1 & 5',
      'EU is 15-60 points harder per division than NAC',
      'Div 4 hardest (400+ points), Div 5 most accessible (300 points)',
      'Storm changes may happen but usually get reverted quickly',
      'Use tournament calculator between games',
      'Never run out of games - worst possible outcome',
      'If running low on games, disengage every spawn fight'
    ]
  };
}

function getRegionThresholds(region: string, tournamentType: string) {
  if (tournamentType === 'solo') {
    // C6S4 Solo Series actual results
    return region === 'EU' 
      ? { top100: 329, top500: 298, top1000: 285, top2500: 265, top7500: 232 }
      : { top100: 309, top500: 273, top1000: 256, top2500: 226, top7500: 159 };
  } else if (tournamentType === 'duos_division_cups') {
    // C6S4 Division Cups Day 2 - FINAL RESULTS (Updated Elim Points)
    return region === 'EU'
      ? { div1: 534, div2: 294, div3: 300, div4: 349, div5: 246 } // Day 2 results
      : { div1: 270, div2: 335, div3: 335, div4: 340, div5: 302 }; // NAC Day 2 results
  } else {
    // C6S4 Duos Trials - ACTUAL FINAL RESULTS
    return region === 'EU'
      ? { top100: 320, top500: 290, top1000: 275, top3000: 247, top13000: 186 }
      : { top100: 280, top500: 235, top1000: 243, top3000: 204, top7000: 140 };
  }
}

function calculateConfidence(averageNeeded: number, riskLevel: string, userStats?: any): number {
  let baseConfidence = 0.5;
  
  // Adjust based on point requirements
  if (averageNeeded < 25) baseConfidence = 0.8;
  else if (averageNeeded < 40) baseConfidence = 0.6;
  else if (averageNeeded < 60) baseConfidence = 0.4;
  else baseConfidence = 0.2;
  
  // Adjust based on user stats if available
  if (userStats) {
    const placement = userStats.averagePlacement || 50;
    const eliminations = userStats.averageEliminations || 2;
    
    if (placement < 20) baseConfidence += 0.2;
    if (eliminations > 3) baseConfidence += 0.1;
  }
  
  return Math.min(Math.max(baseConfidence, 0.1), 0.9);
}
