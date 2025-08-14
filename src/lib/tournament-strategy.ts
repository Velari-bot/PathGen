import { TournamentInfo, TournamentDivision, CompetitiveStrategy } from '@/types';

// C6S4 Tournament Information
export const C6S4_TOURNAMENT: TournamentInfo = {
  name: "C6S4 FNCS Trio Practice Cup",
  season: "C6S4",
  type: "FNCS",
  format: "Trio",
  pointsSystem: {
    win: 65,
    eliminations: {
      div1: 2,
      div2Plus: 1
    },
    placement: "Points start at Top 17"
  },
  loadoutRecommendations: {
    shotgun: [
      "Sentinel Pump (best overall)",
      "Revolver (if you're confident and practiced)"
    ],
    ar: [
      "OXR Rifle (for players needing lots of surge)",
      "Hammer/Fury AR (better for boxfighting, most players)"
    ],
    mobility: [
      "Crash Pads (primary)",
      "Launch Pads (backup)",
      "2 stacks of crash pads recommended"
    ],
    heals: [
      "Legendary Slurps (best)",
      "Splashes and Fizz (second best)",
      "Always carry Fizz for mobility combos",
      "Med kits, minis, bigs, med mist (equal value)"
    ]
  },
  divisions: [
    {
      id: 1,
      name: "Division 1",
      description: "Top tier competitive play with surge mechanics",
      qualifyingCriteria: "Top 40 trios on EU/NAC, Top 20 on other regions",
      playerCount: 100,
      hasElo: false,
      surgeFrequency: "high",
      strategy: "Focus on placement in every game. Eliminations are bonus points. Only fight for surge or refreshes.",
      tips: [
        "Start on time to avoid missing first games",
        "Aim for placement in every game",
        "Fight only for surge or refreshes",
        "Eliminations are bonus, not priority",
        "Be prepared for surge in many lobbies"
      ]
    },
    {
      id: 2,
      name: "Division 2",
      description: "High-level competitive with moderate surge",
      qualifyingCriteria: "Top 40 trios on EU/NAC, Top 20 on other regions",
      playerCount: 100,
      hasElo: false,
      surgeFrequency: "medium",
      strategy: "Fully placement-focused with selective eliminations. Get early damage then assess surge potential.",
      tips: [
        "Start on time - lobbies get stacked",
        "Get early damage then assess surge",
        "Focus on placement over eliminations",
        "Only fight when you have massive advantage",
        "Lobbies average 45 players at first zone, 30 in moving zones"
      ]
    },
    {
      id: 3,
      name: "Division 3",
      description: "Intermediate competitive play",
      playerCount: 100,
      hasElo: true,
      surgeFrequency: "low",
      strategy: "Placement-focused with 6-7 endgames. Avoid early fights if running out of games.",
      tips: [
        "Start on time or up to 5 minutes late maximum",
        "Aim for 6-7 endgames",
        "If running out of games, disengage off spawn",
        "Avoid early/mid game fights when behind",
        "Use Tourney Calc Bot to track progress"
      ]
    }
  ]
};

export class TournamentStrategyService {
  static getTournamentInfo(): TournamentInfo {
    return C6S4_TOURNAMENT;
  }

  static getDivisionStrategy(divisionId: number): TournamentDivision | undefined {
    return C6S4_TOURNAMENT.divisions.find(div => div.id === divisionId);
  }

  static getLoadoutRecommendations(): TournamentInfo['loadoutRecommendations'] {
    return C6S4_TOURNAMENT.loadoutRecommendations;
  }

  static getCompetitiveStrategy(division: number): CompetitiveStrategy {
    const divInfo = this.getDivisionStrategy(division);
    
    if (!divInfo) {
      return this.getDefaultStrategy();
    }

    switch (division) {
      case 1:
        return {
          division: 1,
          playstyle: 'placement',
          earlyGame: "Land safely, gather resources, avoid unnecessary fights",
          midGame: "Focus on positioning and rotation, only engage for surge or refreshes",
          endGame: "Prioritize placement over eliminations, play for surge mechanics",
          surgeStrategy: "Be prepared for surge in many lobbies, fight strategically for surge items",
          loadoutPriority: ["Shotgun", "AR", "Mobility", "Heals"]
        };

      case 2:
        return {
          division: 2,
          playstyle: 'balanced',
          earlyGame: "Get early damage safely, assess lobby strength",
          midGame: "Balance placement with selective eliminations when advantageous",
          endGame: "Focus on placement, only fight when you have clear advantage",
          surgeStrategy: "Monitor for surge opportunities, adapt strategy based on surge potential",
          loadoutPriority: ["Shotgun", "AR", "Mobility", "Heals"]
        };

      case 3:
        return {
          division: 3,
          playstyle: 'placement',
          earlyGame: "Land safely, avoid early fights if possible",
          midGame: "Focus on survival and positioning",
          endGame: "Play for placement, avoid risky engagements",
          surgeStrategy: "Surge is rare, focus on consistent placement",
          loadoutPriority: ["Shotgun", "AR", "Mobility", "Heals"]
        };

      default:
        return this.getDefaultStrategy();
    }
  }

  private static getDefaultStrategy(): CompetitiveStrategy {
    return {
      division: 0,
      playstyle: 'balanced',
      earlyGame: "Land safely and gather resources",
      midGame: "Focus on positioning and survival",
      endGame: "Play for placement over eliminations",
      surgeStrategy: "Adapt based on division level",
      loadoutPriority: ["Shotgun", "AR", "Mobility", "Heals"]
    };
  }

  static getTournamentTips(): string[] {
    return [
      "Play with the same trio on both days of practice cups",
      "Points are cumulative across 2 days",
      "No region lock - you can play in different regions",
      "Division 1+2 have no Elo - next 33 teams queue into next game",
      "Division 3 has normal points-based matchmaking",
      "You can't change divisions between Day 1 and Day 2",
      "Start on time to maximize your games",
      "Focus on placement over eliminations in most divisions",
      "Use surge mechanics strategically in Division 1+2",
      "Always carry mobility items for endgame positioning"
    ];
  }

  static getDivisionQualificationTips(division: number): string[] {
    switch (division) {
      case 1:
        return [
          "Qualify from Division 2 by placing in top 40 (EU/NAC) or top 20 (other regions)",
          "Focus on consistent placement finishes",
          "Master surge mechanics and timing",
          "Practice endgame scenarios with your trio"
        ];

      case 2:
        return [
          "Qualify from Division 3 by placing in top 40 (EU/NAC) or top 20 (other regions)",
          "Improve early game survival rate",
          "Work on mid-game positioning and rotation",
          "Practice selective engagement strategies"
        ];

      case 3:
        return [
          "Aim for top 2k placements to qualify for Division 2",
          "Focus on consistent endgame appearances",
          "Improve early game survival",
          "Practice efficient resource gathering"
        ];

      default:
        return [
          "Focus on improving your current division performance",
          "Practice with your trio regularly",
          "Study successful players in your division",
          "Work on fundamental mechanics"
        ];
    }
  }

  static getLoadoutBuilder(): Record<string, string[]> {
    return {
      "Primary Loadout": [
        "Sentinel Pump Shotgun",
        "Hammer/Fury AR (or OXR if you need lots of surge)",
        "2 stacks of Crash Pads",
        "2 Legendary Slurps",
        "1 Fizz for mobility combos"
      ],
      "Alternative Options": [
        "Revolver (if practiced)",
        "OXR Rifle (for surge-heavy playstyle)",
        "Launch Pads (if no Crash Pads)",
        "Splashes, Med Kits, Minis (if no Slurps)"
      ],
      "Priority Order": [
        "1. Shotgun (essential for close combat)",
        "2. AR (mid-range and boxfighting)",
        "3. Mobility (positioning and escape)",
        "4. Heals (sustain and endgame)",
        "5. Utility items (surge, refreshes)"
      ]
    };
  }
}
