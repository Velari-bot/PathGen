import { TournamentInfo, TournamentDivision, CompetitiveStrategy } from '@/types';

// Live Tournament Updates and Point Estimates
export interface LiveTournamentUpdate {
  id: string;
  tournamentName: string;
  region: 'EU' | 'NA' | 'OCE' | 'ASIA';
  timestamp: string;
  updates: TournamentPointUpdate[];
  queueInfo?: string;
  notes?: string;
}

export interface TournamentPointUpdate {
  rank: string;
  points: number;
  timestamp: string;
  notes?: string;
}

export interface TournamentBreakdown {
  rank: string;
  points: number;
  example: {
    wins: number;
    top5s: number;
    top10s: number;
    top20s: number;
    elimsPerGame: number;
    spareGames: number;
  };
}

// Icon Reload Cups Data
export const ICON_RELOAD_CUPS = {
  clix: {
    name: "CLIX RELOAD ICON CUP",
    format: "Duos Reload (Slurp Rush map)",
    duration: "2.5 hours (NOT 3 hours)",
    games: 10,
    hasElo: true,
    regionLocked: false,
    liveUpdates: [
      {
        id: "clix-eu-1",
        tournamentName: "CLIX RELOAD ICON CUP",
        region: "EU",
        timestamp: "2025-08-23T10:04:00Z",
        updates: [
          { rank: "Top 1000", points: 146, timestamp: "2025-08-23T10:04:00Z" }
        ],
        notes: "Watch for live updates later"
      },
      {
        id: "clix-eu-2", 
        tournamentName: "CLIX RELOAD ICON CUP",
        region: "EU",
        timestamp: "2025-08-23T10:33:00Z",
        updates: [
          { rank: "Top 1000", points: 142, timestamp: "2025-08-23T10:33:00Z" }
        ],
        notes: "No change"
      },
      {
        id: "clix-eu-3",
        tournamentName: "CLIX RELOAD ICON CUP", 
        region: "EU",
        timestamp: "2025-08-23T11:15:00Z",
        updates: [
          { rank: "Top 1000", points: 142, timestamp: "2025-08-23T11:15:00Z" }
        ],
        notes: "You need 139+ to have any chance and 145 to be safe. Queues should be under 2 minutes but there's quite a few people getting queue bugs so I would suggest giving 5 minutes if you can, and then requeue with 2 mins left if you didn't get a game after 3 mins"
      }
    ]
  },
  bugha: {
    name: "BUGHA RELOAD ICON CUP",
    format: "Duos Reload (Slurp Rush map)",
    duration: "2.5 hours (NOT 3 hours)",
    games: 10,
    hasElo: true,
    regionLocked: false,
    liveUpdates: [
      {
        id: "bugha-na-1",
        tournamentName: "BUGHA RELOAD ICON CUP",
        region: "NA",
        timestamp: "2025-08-22T20:05:00Z",
        updates: [
          { rank: "Top 650", points: 142, timestamp: "2025-08-22T20:05:00Z" }
        ]
      },
      {
        id: "bugha-na-2",
        tournamentName: "BUGHA RELOAD ICON CUP",
        region: "NA", 
        timestamp: "2025-08-22T20:37:00Z",
        updates: [
          { rank: "Top 650", points: 141, timestamp: "2025-08-22T20:37:00Z" }
        ]
      },
      {
        id: "bugha-na-3",
        tournamentName: "BUGHA RELOAD ICON CUP",
        region: "NA",
        timestamp: "2025-08-22T21:18:00Z", 
        updates: [
          { rank: "Top 650", points: 142, timestamp: "2025-08-22T21:18:00Z" }
        ],
        notes: "You need 139 to have any chance and 146+ to be fully safe. 1 minute for safe queue time!"
      },
      {
        id: "bugha-na-4",
        tournamentName: "BUGHA RELOAD ICON CUP",
        region: "NA",
        timestamp: "2025-08-23T16:11:00Z",
        updates: [
          { rank: "Top 650", points: 125, timestamp: "2025-08-23T16:11:00Z" }
        ],
        notes: "Looks like queue problems lowered points by about 10-15 points. Also I wrote top 1000 above but of course it was meant to say 650. Top 650 is now heading for 125-130 points"
      },
      {
        id: "bugha-na-5",
        tournamentName: "BUGHA RELOAD ICON CUP",
        region: "NA",
        timestamp: "2025-08-23T16:36:00Z",
        updates: [
          { rank: "Top 650", points: 130, timestamp: "2025-08-23T16:36:00Z" }
        ]
      },
      {
        id: "bugha-na-6",
        tournamentName: "BUGHA RELOAD ICON CUP",
        region: "NA",
        timestamp: "2025-08-23T17:22:00Z",
        updates: [
          { rank: "Top 650", points: 136, timestamp: "2025-08-23T17:22:00Z" }
        ],
        notes: "It's heading for 133 right now, but I think people might have extra games because of the queue problem at the start so I've added a few points. This is uncertain so I would suggest aiming for 140+. 2 minutes is safe for final queue if you don't get queue bug."
      }
    ]
  }
};

// Console Victory Cash Cup Data
export const CONSOLE_VICTORY_CASH_CUP = {
  name: "C6S4 Console Victory Cash Cup #2",
  format: "Console Victory Cash Cup",
  duration: "3 hours",
  games: 10,
  hasElo: true,
  regionLocked: false,
  liveUpdates: [
    {
      id: "console-eu-1",
      tournamentName: "C6S4 Console Victory Cash Cup #2",
      region: "EU",
      timestamp: "2025-08-24T03:24:00Z",
      updates: [
        { rank: "Top 100", points: 275, timestamp: "2025-08-24T03:24:00Z" },
        { rank: "Top 500 (qual)", points: 245, timestamp: "2025-08-24T03:24:00Z" },
        { rank: "Top 1000", points: 225, timestamp: "2025-08-24T03:24:00Z" },
        { rank: "Top 2500", points: 200, timestamp: "2025-08-24T03:24:00Z" },
        { rank: "Top 7500", points: 150, timestamp: "2025-08-24T03:24:00Z" }
      ],
      notes: "Pre-Round Estimate. Live updates later!"
    },
    {
      id: "console-eu-2",
      tournamentName: "C6S4 Console Victory Cash Cup #2",
      region: "EU",
      timestamp: "2025-08-24T09:15:00Z",
      updates: [
        { rank: "Top 100", points: 275, timestamp: "2025-08-24T09:15:00Z" },
        { rank: "Top 500 (qual)", points: 245, timestamp: "2025-08-24T09:15:00Z" },
        { rank: "Top 1000", points: 230, timestamp: "2025-08-24T09:15:00Z" },
        { rank: "Top 2500", points: 200, timestamp: "2025-08-24T09:15:00Z" },
        { rank: "Top 7500", points: 155, timestamp: "2025-08-24T09:15:00Z" }
      ]
    },
    {
      id: "console-eu-3",
      tournamentName: "C6S4 Console Victory Cash Cup #2",
      region: "EU",
      timestamp: "2025-08-24T09:49:00Z",
      updates: [
        { rank: "Top 100", points: 277, timestamp: "2025-08-24T09:49:00Z" },
        { rank: "Top 500", points: 247, timestamp: "2025-08-24T09:49:00Z" },
        { rank: "Top 1000", points: 231, timestamp: "2025-08-24T09:49:00Z" },
        { rank: "Top 2500", points: 204, timestamp: "2025-08-24T09:49:00Z" },
        { rank: "Top 7500", points: 158, timestamp: "2025-08-24T09:49:00Z" }
      ],
      notes: "Final Results"
    },
    {
      id: "console-na-1",
      tournamentName: "C6S4 Console Victory Cash Cup #2",
      region: "NA",
      timestamp: "2025-08-24T15:09:00Z",
      updates: [
        { rank: "Top 100", points: 265, timestamp: "2025-08-24T15:09:00Z" },
        { rank: "Top 500 (qual)", points: 235, timestamp: "2025-08-24T15:09:00Z" },
        { rank: "Top 1000", points: 215, timestamp: "2025-08-24T15:09:00Z" },
        { rank: "Top 2500", points: 175, timestamp: "2025-08-24T15:09:00Z" },
        { rank: "Top 7500", points: 110, timestamp: "2025-08-24T15:09:00Z" }
      ]
    },
    {
      id: "console-na-2",
      tournamentName: "C6S4 Console Victory Cash Cup #2",
      region: "NA",
      timestamp: "2025-08-24T15:52:00Z",
      updates: [
        { rank: "Top 100", points: 270, timestamp: "2025-08-24T15:52:00Z" },
        { rank: "Top 500 (qual)", points: 235, timestamp: "2025-08-24T15:52:00Z" },
        { rank: "Top 1000", points: 215, timestamp: "2025-08-24T15:52:00Z" },
        { rank: "Top 2500", points: 180, timestamp: "2025-08-24T15:52:00Z" },
        { rank: "Top 7500", points: 110, timestamp: "2025-08-24T15:52:00Z" }
      ],
      notes: "You need 232 to have a chance and 240 to be safe. 5 minutes for safe queue time if you don't get queue bug"
    }
  ],
  breakdown: {
    rank: "Top 500 (qual)",
    points: 245,
    example: {
      wins: 1,
      top5s: 2,
      top10s: 1,
      top20s: 1,
      elimsPerGame: 5,
      spareGames: 2
    }
  }
};

// Blade of Champions Cup Data
export const BLADE_OF_CHAMPIONS_CUP = {
  name: "C6S4 Blade of Champions Cup",
  format: "Blade of Champions Cup",
  duration: "3 hours",
  games: 10,
  hasElo: true,
  regionLocked: false,
  qualification: "You need Top 750 in Round 2 Group 1 to win the pickaxe",
  preRoundEstimate: {
    points: 29,
    range: "27-31",
    notes: "Very likely to be within 27-31. There is Elo, so you won't be able to keep winning easily if you have a good first game."
  }
};

// Tournament Strategy Service with Live Data
export class LiveTournamentService {
  static getIconReloadCups() {
    return ICON_RELOAD_CUPS;
  }

  static getConsoleVictoryCashCup() {
    return CONSOLE_VICTORY_CASH_CUP;
  }

  static getBladeOfChampionsCup() {
    return BLADE_OF_CHAMPIONS_CUP;
  }

  static getLatestUpdates(tournamentName: string, region?: string): LiveTournamentUpdate[] {
    const allUpdates: LiveTournamentUpdate[] = [];
    
    // Collect all updates from different tournaments
    Object.values(ICON_RELOAD_CUPS).forEach(cup => {
      allUpdates.push(...cup.liveUpdates as LiveTournamentUpdate[]);
    });
    
    allUpdates.push(...CONSOLE_VICTORY_CASH_CUP.liveUpdates as LiveTournamentUpdate[]);
    
    // Filter by tournament name and region if specified
    let filtered = allUpdates.filter(update => 
      update.tournamentName.toLowerCase().includes(tournamentName.toLowerCase())
    );
    
    if (region) {
      filtered = filtered.filter(update => update.region === region);
    }
    
    // Sort by timestamp (newest first)
    return filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  static getCurrentPointEstimates(tournamentName: string, region?: string): TournamentPointUpdate[] {
    const latestUpdates = this.getLatestUpdates(tournamentName, region);
    
    if (latestUpdates.length === 0) return [];
    
    // Get the most recent update
    const latestUpdate = latestUpdates[0];
    return latestUpdate.updates;
  }

  static getTournamentBreakdown(tournamentName: string): TournamentBreakdown | null {
    if (tournamentName.includes("Console Victory Cash Cup")) {
      return CONSOLE_VICTORY_CASH_CUP.breakdown;
    }
    return null;
  }

  static getQueueAdvice(tournamentName: string, region?: string): string[] {
    const latestUpdates = this.getLatestUpdates(tournamentName, region);
    const advice: string[] = [];
    
    latestUpdates.forEach(update => {
      if (update.notes) {
        advice.push(update.notes);
      }
    });
    
    return advice;
  }

  static getTournamentStrategy(tournamentName: string): string[] {
    const strategies: string[] = [];
    
    if (tournamentName.includes("Icon Reload")) {
      strategies.push(
        "Balance eliminations with placements",
        "Can die off spawn 1-2 times without affecting placement",
        "No region lock - play in any region",
        "Points based matchmaking (elo) is active",
        "Focus on consistent performance across 10 games"
      );
    }
    
    if (tournamentName.includes("Console Victory Cash Cup")) {
      strategies.push(
        "Console-specific competition",
        "High point requirements for qualification",
        "Focus on consistent top placements",
        "Manage your games wisely - only 10 games total",
        "Aim for multiple top 5 finishes"
      );
    }
    
    if (tournamentName.includes("Blade of Champions")) {
      strategies.push(
        "Need Top 750 in Round 2 Group 1 to win pickaxe",
        "Elo system makes consistent winning difficult",
        "Focus on consistent performance rather than going for wins",
        "Manage your early games carefully",
        "Adapt strategy based on your first game performance"
      );
    }
    
    return strategies;
  }

  static getPointTargetAdvice(currentPoints: number, targetRank: string, tournamentName: string): string {
    const estimates = this.getCurrentPointEstimates(tournamentName);
    const targetEstimate = estimates.find(est => est.rank === targetRank);
    
    if (!targetEstimate) {
      return "No current estimates available for this rank.";
    }
    
    const pointsNeeded = targetEstimate.points - currentPoints;
    
    if (pointsNeeded <= 0) {
      return `You're already above the ${targetRank} threshold! Keep playing consistently.`;
    }
    
    const gamesLeft = 10; // Assuming 10 games total
    const pointsPerGame = Math.ceil(pointsNeeded / gamesLeft);
    
    return `You need ${pointsNeeded} more points to reach ${targetRank}. Aim for ${pointsPerGame} points per game on average.`;
  }
}

// Tournament estimation data for NAC region
export const NAC_TOURNAMENT_DATA = {
  // C6S4 AXE OF CHAMPIONS CUP
  'axe-of-champions-cup': {
    name: 'C6S4 AXE OF CHAMPIONS CUP',
    region: 'NAC',
    date: '2025-08-30',
    thresholds: {
      'top-100': 330,
      'top-1800': 272,
      'safe-threshold': 277,
      'minimum-chance': 268
    },
    breakdown: {
      example: '280 points looks like: 2 Top 5s with 3 Elims, 2 Top 10s with 2 Elims, 3 Top 25s with 1 Elim, 3 spare games',
      safeQueueTime: '6 minutes for safe queue time if you\'re in the Top 100, 5 minutes is safe for everyone else'
    }
  },
  
  // C6S4 Console Cash Cup #3
  'console-cash-cup-3': {
    name: 'C6S4 Console Cash Cup #3',
    region: 'NAC',
    date: '2025-08-29',
    thresholds: {
      'top-100': 264,
      'top-500': 228,
      'top-1000': 208,
      'top-2500': 172,
      'top-7500': 88,
      'safe-threshold': 233,
      'minimum-chance': 225
    },
    breakdown: {
      example: '235 points looks like: 1 Win with 7 Elims, 2 Top 5s with 4 Elims, 1 Top 10 with 3 Elims, 1 Top 20 with 2 Elims, 2 spare games',
      safeQueueTime: '6 minutes for safe queue time if you\'re in the Top 100, 5 minutes is safe for everyone else'
    }
  },
  
  // C6S4 CHAMPION SURF WITCH CUP
  'champion-surf-witch-cup': {
    name: 'C6S4 CHAMPION SURF WITCH CUP',
    region: 'NAC',
    date: '2025-08-29',
    thresholds: {
      'top-100': 330,
      'top-1800': 275,
      'safe-threshold': 281,
      'minimum-chance': 270
    },
    breakdown: {
      example: '275 points looks like: 1 Top 5s with 4 Elims, 3 Top 10s with 2 Elims, 3 Top 25s with 1 Elim, 3 spare games',
      safeQueueTime: '6 minutes for safe queue time if you\'re in the Top 100, 5 minutes is safe for everyone else'
    }
  }
};

// Helper function to get tournament estimates
export function getTournamentEstimate(tournamentId: string, placement: string): number | null {
  const tournament = ALL_TOURNAMENT_DATA[tournamentId as keyof typeof ALL_TOURNAMENT_DATA];
  if (!tournament) return null;
  
  return tournament.thresholds[placement as keyof typeof tournament.thresholds] || null;
}

// Helper function to get tournament breakdown
export function getTournamentBreakdown(tournamentId: string): any {
  const tournament = ALL_TOURNAMENT_DATA[tournamentId as keyof typeof ALL_TOURNAMENT_DATA];
  if (!tournament) return null;
  
  return tournament.breakdown;
}

// Helper function to calculate if user is safe for a placement
export function isUserSafe(tournamentId: string, placement: string, userPoints: number): boolean {
  const tournament = ALL_TOURNAMENT_DATA[tournamentId as keyof typeof ALL_TOURNAMENT_DATA];
  if (!tournament) return false;
  
  const safeThreshold = tournament.thresholds['safe-threshold'];
  return userPoints >= safeThreshold;
}

// Helper function to get minimum points needed for a chance
export function getMinimumChance(tournamentId: string): number | null {
  const tournament = ALL_TOURNAMENT_DATA[tournamentId as keyof typeof ALL_TOURNAMENT_DATA];
  if (!tournament) return null;
  
  return tournament.thresholds['minimum-chance'];
}

// Helper function to get tournaments by region
export function getTournamentsByRegion(region: 'NAC' | 'EU'): any {
  if (region === 'NAC') {
    return NAC_TOURNAMENT_DATA;
  } else if (region === 'EU') {
    return EU_TOURNAMENT_DATA;
  }
  return {};
}

// Tournament estimation data for EU region
export const EU_TOURNAMENT_DATA = {
  // C6S4 AXE OF CHAMPIONS CUP
  'axe-of-champions-cup-eu': {
    name: 'C6S4 AXE OF CHAMPIONS CUP',
    region: 'EU',
    date: '2025-08-30',
    thresholds: {
      'top-100': 345,
      'top-2000': 296,
      'safe-threshold': 300,
      'minimum-chance': 292
    },
    breakdown: {
      example: '295 points looks like: 3 Top 5s with 3 Elims, 2 Top 10s with 1 Elim, 2 Top 25s with 0 Elims, 3 spare games',
      alternativeExample: '295 points with a big win to start: 1 Win with 15 Elims, 2 Top 10s with 2 Elims, 4 Top 25s with 0 Elims, 3 spare games',
      safeQueueTime: '6 minutes for safe queue time if you don\'t queue bug'
    }
  },
  
  // C6S4 Console Victory Cash Cup #3
  'console-victory-cash-cup-3-eu': {
    name: 'C6S4 Console Victory Cash Cup #3',
    region: 'EU',
    date: '2025-08-29',
    thresholds: {
      'top-100': 279,
      'top-500': 250,
      'top-1000': 232,
      'top-2500': 205,
      'top-7500': 158,
      'safe-threshold': 252,
      'minimum-chance': 244
    },
    breakdown: {
      example: '248 points looks like: 1 Win with 8 Elims, 2 Top 5s with 6 Elims, 1 Top 10 with 4 Elims, 1 Top 20 with 2 Elims, 2 spare games',
      safeQueueTime: '6 minutes for safe queue time if you\'re in the Top 100, 5 minutes is safe for everyone else'
    }
  },
  
  // C6S4 CHAMPION SURF WITCH CUP
  'champion-surf-witch-cup-eu': {
    name: 'C6S4 CHAMPION SURF WITCH CUP',
    region: 'EU',
    date: '2025-08-29',
    thresholds: {
      'top-100': 345,
      'top-2000': 292,
      'safe-threshold': 298,
      'minimum-chance': 288
    },
    breakdown: {
      example: '295 points looks like: 3 Top 5s with 3 Elims, 2 Top 10s with 1 Elim, 2 Top 25s with 0 Elims, 3 spare games',
      alternativeExample: '295 points with a big win to start: 1 Win with 15 Elims, 2 Top 10s with 2 Elims, 4 Top 25s with 0 Elims, 3 spare games',
      safeQueueTime: '6 minutes for safe queue time if you\'re in the Top 100, 5 minutes is safe for everyone else'
    }
  }
};

// Combined tournament data for all regions
export const ALL_TOURNAMENT_DATA = {
  ...NAC_TOURNAMENT_DATA,
  ...EU_TOURNAMENT_DATA
};
