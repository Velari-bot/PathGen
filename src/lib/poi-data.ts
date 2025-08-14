import { POILocation, POIAnalysis, DropLocationStrategy } from '@/types';

// Complete POI data from the analysis
export const POI_DATA: POILocation[] = [
  {
    name: "Fighting Frogs",
    zoneNumber: 19,
    lootScore: 50,
    metalAmount: 6000,
    avgTeams: 1.51,
    survivalRate: 40,
    overallRating: "High Action"
  },
  {
    name: "Yacht Stop",
    zoneNumber: 20,
    lootScore: 55,
    metalAmount: 750,
    avgTeams: 1.43,
    survivalRate: 48,
    overallRating: "Balanced"
  },
  {
    name: "Martial Maneuvers",
    zoneNumber: 21,
    lootScore: 41,
    metalAmount: 1900,
    avgTeams: 1.15,
    survivalRate: 65,
    overallRating: "Safe"
  },
  {
    name: "First Order Base",
    zoneNumber: 23,
    lootScore: 74,
    metalAmount: 500,
    avgTeams: 1.64,
    survivalRate: 53,
    overallRating: "High Loot"
  },
  {
    name: "Supernova Academy",
    zoneNumber: 28,
    lootScore: 40,
    metalAmount: 2600,
    avgTeams: 1.43,
    survivalRate: 63,
    overallRating: "Safe"
  },
  {
    name: "Rocky Rus",
    zoneNumber: 29,
    lootScore: 81,
    metalAmount: 9300,
    avgTeams: 1.12,
    survivalRate: 42,
    overallRating: "High Loot + Metal"
  },
  {
    name: "Swarmy Stash",
    zoneNumber: 33,
    lootScore: 55,
    metalAmount: 9600,
    avgTeams: 1.20,
    survivalRate: 49,
    overallRating: "High Metal"
  },
  {
    name: "O.Z.P. HQ Base Tunnel",
    zoneNumber: 35,
    lootScore: 40,
    metalAmount: 2100,
    avgTeams: 1.20,
    survivalRate: 67,
    overallRating: "Safe"
  },
  {
    name: "Pumpkin Pipes",
    zoneNumber: 41,
    lootScore: 56,
    metalAmount: 3000,
    avgTeams: 1.42,
    survivalRate: 61,
    overallRating: "Balanced"
  },
  {
    name: "Open-Air Onsen",
    zoneNumber: 43,
    lootScore: 55,
    metalAmount: 2400,
    avgTeams: 1.39,
    survivalRate: 67,
    overallRating: "Safe"
  },
  {
    name: "Overlook Lighthouse",
    zoneNumber: 46,
    lootScore: 53,
    metalAmount: 10000,
    avgTeams: 1.44,
    survivalRate: 68,
    overallRating: "High Metal + Safe"
  },
  {
    name: "Shining Span",
    zoneNumber: 46,
    lootScore: 56,
    metalAmount: 7500,
    avgTeams: 1.29,
    survivalRate: 63,
    overallRating: "High Metal"
  },
  {
    name: "Salty Docks",
    zoneNumber: 50,
    lootScore: 72,
    metalAmount: 2600,
    avgTeams: 1.24,
    survivalRate: 59,
    overallRating: "High Loot"
  },
  {
    name: "Kappa Kappa Factory",
    zoneNumber: 55,
    lootScore: 57,
    metalAmount: 2200,
    avgTeams: 1.10,
    survivalRate: 67,
    overallRating: "Safe"
  },
  {
    name: "Utopia City",
    zoneNumber: 67,
    lootScore: 49,
    metalAmount: 8300,
    avgTeams: 0.92,
    survivalRate: 75,
    overallRating: "Very Safe + High Metal"
  },
  {
    name: "Rogue Slurp Room Market",
    zoneNumber: 68,
    lootScore: 71,
    metalAmount: 3300,
    avgTeams: 1.26,
    survivalRate: 68,
    overallRating: "High Loot + Safe"
  },
  {
    name: "Rolling Blossoms Farm",
    zoneNumber: 69,
    lootScore: 50,
    metalAmount: 10000,
    avgTeams: 0.82,
    survivalRate: 72,
    overallRating: "Very Safe + High Metal"
  },
  {
    name: "Way Station",
    zoneNumber: 75,
    lootScore: 47,
    metalAmount: 2000,
    avgTeams: 0.61,
    survivalRate: 71,
    overallRating: "Very Safe"
  },
  {
    name: "Outpost Enclave",
    zoneNumber: 77,
    lootScore: 38,
    metalAmount: 1600,
    avgTeams: 0.42,
    survivalRate: 73,
    overallRating: "Very Safe"
  },
  {
    name: "Kite's Flight",
    zoneNumber: 78,
    lootScore: 1,
    metalAmount: 3500,
    avgTeams: 0.89,
    survivalRate: 71,
    overallRating: "Very Safe + Low Loot"
  },
  {
    name: "The Great Turtle",
    zoneNumber: 78,
    lootScore: 1,
    metalAmount: 23,
    avgTeams: 0.89,
    survivalRate: 72,
    overallRating: "Very Safe + Low Loot"
  },
  {
    name: "Crabby Cove",
    zoneNumber: 112,
    lootScore: 53,
    metalAmount: 5300,
    avgTeams: 0.69,
    survivalRate: 69,
    overallRating: "Safe + High Metal"
  },
  {
    name: "Sakura Stadium",
    zoneNumber: 126,
    lootScore: 34,
    metalAmount: 200,
    avgTeams: 0.13,
    survivalRate: 100,
    overallRating: "Safest + Low Loot"
  },
  {
    name: "Shiny Shafts",
    zoneNumber: 128,
    lootScore: 109,
    metalAmount: 9300,
    avgTeams: 1.14,
    survivalRate: 75,
    overallRating: "Best Overall"
  }
];

export class POIService {
  static getAllPOIs(): POILocation[] {
    return POI_DATA;
  }

  static getPOIByName(name: string): POILocation | undefined {
    return POI_DATA.find(poi => poi.name.toLowerCase().includes(name.toLowerCase()));
  }

  static getBestDropLocations(limit: number = 5): POILocation[] {
    return POI_DATA
      .sort((a, b) => {
        // Sort by overall value (loot + metal + survival rate)
        const aValue = a.lootScore + (a.metalAmount / 1000) + a.survivalRate;
        const bValue = b.lootScore + (b.metalAmount / 1000) + b.survivalRate;
        return bValue - aValue;
      })
      .slice(0, limit);
  }

  static getSafestLocations(limit: number = 5): POILocation[] {
    return POI_DATA
      .sort((a, b) => b.survivalRate - a.survivalRate)
      .slice(0, limit);
  }

  static getHighestLootLocations(limit: number = 5): POILocation[] {
    return POI_DATA
      .sort((a, b) => b.lootScore - a.lootScore)
      .slice(0, limit);
  }

  static getBestBuildingLocations(limit: number = 5): POILocation[] {
    return POI_DATA
      .sort((a, b) => b.metalAmount - a.metalAmount)
      .slice(0, limit);
  }

  static getAggressiveLocations(limit: number = 5): POILocation[] {
    return POI_DATA
      .filter(poi => poi.avgTeams > 1.2 && poi.lootScore > 50)
      .sort((a, b) => b.lootScore - a.lootScore)
      .slice(0, limit);
  }

  static getPassiveLocations(limit: number = 5): POILocation[] {
    return POI_DATA
      .filter(poi => poi.avgTeams < 1.0 && poi.survivalRate > 65)
      .sort((a, b) => b.survivalRate - a.survivalRate)
      .slice(0, limit);
  }

  static getBalancedLocations(limit: number = 5): POILocation[] {
    return POI_DATA
      .filter(poi => poi.avgTeams >= 1.0 && poi.avgTeams <= 1.2)
      .sort((a, b) => {
        const aBalance = (a.lootScore + a.survivalRate) / 2;
        const bBalance = (b.lootScore + b.survivalRate) / 2;
        return bBalance - aBalance;
      })
      .slice(0, limit);
  }

  static getDropLocationStrategy(playerStyle: 'aggressive' | 'passive' | 'balanced'): DropLocationStrategy {
    switch (playerStyle) {
      case 'aggressive':
        return {
          playerStyle: 'aggressive',
          recommendedLocations: this.getAggressiveLocations(3),
          strategy: "Land at high-loot, high-action locations to get early eliminations and better gear",
          tips: [
            "Drop at locations with 1.2+ average teams for action",
            "Prioritize loot score over survival rate",
            "Be prepared for early fights",
            "Focus on getting weapons quickly",
            "Use building materials strategically in fights"
          ]
        };

      case 'passive':
        return {
          playerStyle: 'passive',
          recommendedLocations: this.getPassiveLocations(3),
          strategy: "Land at safe, low-competition locations to survive longer and gather resources",
          tips: [
            "Drop at locations with <1.0 average teams",
            "Prioritize survival rate over loot",
            "Gather building materials early",
            "Avoid unnecessary fights",
            "Focus on positioning and rotation"
          ]
        };

      case 'balanced':
        return {
          playerStyle: 'balanced',
          recommendedLocations: this.getBalancedLocations(3),
          strategy: "Land at balanced locations that offer good loot with moderate competition",
          tips: [
            "Drop at locations with 1.0-1.2 average teams",
            "Balance loot needs with safety",
            "Be ready for fights but don't seek them out",
            "Gather resources while staying alert",
            "Adapt strategy based on early game situation"
          ]
        };

      default:
        return this.getDropLocationStrategy('balanced');
    }
  }

  static getPOIAnalysis(): POIAnalysis {
    return {
      bestDropLocations: this.getBestDropLocations(5),
      safestLocations: this.getSafestLocations(5),
      highestLootLocations: this.getHighestLootLocations(5),
      bestBuildingLocations: this.getBestBuildingLocations(5),
      recommendations: {
        aggressive: this.getAggressiveLocations(3),
        passive: this.getPassiveLocations(3),
        balanced: this.getBalancedLocations(3)
      }
    };
  }

  static getLocationByZone(zoneNumber: number): POILocation[] {
    return POI_DATA.filter(poi => poi.zoneNumber === zoneNumber);
  }

  static getLocationsByZoneRange(minZone: number, maxZone: number): POILocation[] {
    return POI_DATA.filter(poi => poi.zoneNumber >= minZone && poi.zoneNumber <= maxZone);
  }
}
