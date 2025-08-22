import { DroneSpawnData } from '@/types';

export const DRONE_SPAWN_DATA: DroneSpawnData = {
  locations: [
    {
      name: "Supernova",
      coordinates: { x: 0.65, y: 0.35 }, // Approximate map coordinates
      spawnRate: "guaranteed",
      spawnFrequency: "once_per_game",
      lootTier: "epic",
      strategicValue: "high",
      notes: [
        "Guaranteed drone spawn every game",
        "High-tier loot including mythic weapons",
        "Strategic position for mid-game rotations",
        "High competition due to guaranteed spawn"
      ]
    },
    {
      name: "Shogun",
      coordinates: { x: 0.45, y: 0.55 },
      spawnRate: "guaranteed",
      spawnFrequency: "once_per_game",
      lootTier: "epic",
      strategicValue: "high",
      notes: [
        "Guaranteed drone spawn every game",
        "Excellent for aggressive playstyles",
        "High-tier loot and mobility items",
        "Good positioning for zone rotations"
      ]
    },
    {
      name: "Kappa Kappa",
      coordinates: { x: 0.75, y: 0.65 },
      spawnRate: "guaranteed",
      spawnFrequency: "once_per_game",
      lootTier: "epic",
      strategicValue: "medium",
      notes: [
        "Guaranteed drone spawn every game",
        "Balanced loot and positioning",
        "Lower competition than Supernova/Shogun",
        "Good for passive-aggressive playstyle"
      ]
    },
    {
      name: "Canyon",
      coordinates: { x: 0.25, y: 0.75 },
      spawnRate: "guaranteed",
      spawnFrequency: "once_per_game",
      lootTier: "epic",
      strategicValue: "medium",
      notes: [
        "Guaranteed drone spawn every game",
        "Remote location with lower competition",
        "High-tier loot with strategic positioning",
        "Good for survival-focused gameplay"
      ]
    }
  ],
  spawnMechanics: {
    timing: "Drones spawn at the beginning of each game, approximately 30 seconds after the battle bus starts",
    frequency: "Each location spawns exactly one drone per game, no exceptions",
    lootQuality: "Epic to Legendary tier weapons, mobility items, and healing supplies",
    strategicAdvantage: "Guaranteed high-tier loot for early game advantage and mid-game positioning"
  },
  tournamentStrategy: {
    earlyGame: "Land at drone spawn locations for guaranteed high-tier loot. Prioritize Supernova and Shogun for aggressive play, Kappa Kappa and Canyon for safer approaches",
    midGame: "Use drone loot advantage to control rotations and engage in favorable fights. The guaranteed spawns provide consistent loadout quality across all games",
    endGame: "Drone loot advantage diminishes in endgame, but early positioning and loadout quality from drone spawns can significantly impact final placement",
    riskAssessment: "High risk due to guaranteed spawns attracting multiple teams, but high reward with guaranteed epic+ tier loot. Essential for competitive play"
  }
};

// Helper function to get drone spawn information
export const getDroneSpawnInfo = (locationName: string) => {
  return DRONE_SPAWN_DATA.locations.find(location => 
    location.name.toLowerCase() === locationName.toLowerCase()
  );
};

// Helper function to get all drone spawn locations
export const getAllDroneSpawns = () => {
  return DRONE_SPAWN_DATA.locations;
};

// Helper function to get strategic recommendations based on playstyle
export const getDroneStrategyByPlaystyle = (playstyle: 'aggressive' | 'passive' | 'balanced') => {
  switch (playstyle) {
    case 'aggressive':
      return {
        recommendedLocations: ['Supernova', 'Shogun'],
        strategy: 'Land at high-competition drone spawns for early eliminations and high-tier loot',
        tips: [
          'Expect 2-3 teams at each location',
          'Prioritize weapons over healing initially',
          'Use drone loot advantage to push other teams',
          'Focus on eliminations for tournament points'
        ]
      };
    case 'passive':
      return {
        recommendedLocations: ['Canyon', 'Kappa Kappa'],
        strategy: 'Land at lower-competition drone spawns for safe loot and positioning',
        tips: [
          'Lower team count but still guaranteed loot',
          'Focus on survival and positioning',
          'Use drone loot for mid-game advantage',
          'Avoid early fights unless necessary'
        ]
      };
    case 'balanced':
      return {
        recommendedLocations: ['Kappa Kappa', 'Shogun'],
        strategy: 'Balance aggressive and passive approaches based on lobby strength',
        tips: [
          'Assess lobby strength before committing to fights',
          'Use drone loot for flexible gameplay',
          'Adapt strategy based on early game performance',
          'Maintain positioning while seeking eliminations'
        ]
      };
    default:
      return {
        recommendedLocations: ['Supernova', 'Shogun', 'Kappa Kappa', 'Canyon'],
        strategy: 'All drone spawns provide guaranteed high-tier loot',
        tips: [
          'Choose based on current tournament performance',
          'Consider zone predictions for optimal positioning',
          'Use drone loot advantage consistently across games'
        ]
      };
  }
};
