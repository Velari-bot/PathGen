/**
 * Tournament Service for PathGen
 * Manages tournament data, strategies, and user performance tracking
 */

import { getDb } from './firebase-admin-api';
import type { 
  TournamentSeries, 
  TournamentWeek, 
  TournamentStrategy, 
  UserTournamentPerformance,
  TournamentMeta,
  TournamentCalculator,
  CalculationScenario
} from '@/types/tournament';

export class TournamentService {
  private static db = getDb();

  // Initialize tournament data with C6S4 Solo Series
  static async initializeTournamentData() {
    if (!this.db) throw new Error('Database not initialized');

    // Create C6S4 Solo Series
    const soloSeries: TournamentSeries = {
      id: 'c6s4-solo-series',
      name: 'C6S4 Solo Series',
      season: 'C6S4',
      mode: 'solo',
      region: 'NAC', // We'll create separate entries for each region
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-02-01'),
      isActive: true,
      totalWeeks: 4,
      qualifyingThreshold: 1200, // Updated estimate: 300 points x 4 weeks
      pointSystem: {
        winPoints: 60,
        eliminationPoints: 2,
        placementPoints: {
          '1': 60,
          '2': 54,
          '3': 52,
          '4': 50,
          '5': 48,
          '6-10': 40,
          '11-15': 35,
          '16-25': 30,
          '26-50': 25,
          '51-75': 15,
          '76-100': 5
        }
      }
    };

    // Create NAC Week 1
    const nacWeek1: TournamentWeek = {
      id: 'c6s4-solo-nac-week1',
      seriesId: 'c6s4-solo-series',
      weekNumber: 1,
      name: 'C6S4 SOLO SERIES #1 - NAC',
      date: new Date('2024-01-01'),
      region: 'NAC',
      isCompleted: true,
      pointThresholds: {
        top100: 309,
        top500: 273,
        top1000: 256,
        top2500: 226,
        top7500: 159,
        updatedAt: new Date()
      },
      estimates: {
        top100: 305,
        top500: 275,
        top1000: 260,
        top2500: 235,
        top7500: 170
      },
      finalResults: {
        top100: 309,
        top500: 273,
        top1000: 256,
        top2500: 226,
        top7500: 159
      }
    };

    // Create EU Week 1
    const euWeek1: TournamentWeek = {
      id: 'c6s4-solo-eu-week1',
      seriesId: 'c6s4-solo-series',
      weekNumber: 1,
      name: 'C6S4 SOLO SERIES #1 - EU',
      date: new Date('2024-01-01'),
      region: 'EU',
      isCompleted: true,
      pointThresholds: {
        top100: 329,
        top500: 298,
        top1000: 285,
        top2500: 265,
        top7500: 232,
        updatedAt: new Date()
      },
      estimates: {
        top100: 315,
        top500: 290,
        top1000: 275,
        top2500: 255,
        top7500: 220
      },
      finalResults: {
        top100: 329,
        top500: 298,
        top1000: 285,
        top2500: 265,
        top7500: 232
      }
    };

    // Create C6S4 Duos Division Cups
    const duosDivisionCups: TournamentSeries = {
      id: 'c6s4-duos-division-cups',
      name: 'C6S4 Duos Division Cups',
      season: 'C6S4',
      mode: 'duo',
      region: 'EU', // We'll create separate entries for each region
      startDate: new Date('2024-01-15'),
      endDate: new Date('2024-01-30'),
      isActive: true,
      totalWeeks: 2, // Day 1 and Day 2
      qualifyingThreshold: 600, // Cumulative for Div 1
      pointSystem: {
        winPoints: 65,
        eliminationPoints: 3, // Div 1 has 3 points, others vary by day/division
        placementPoints: {
          '1': 65,
          '2': 60,
          '3': 56,
          '4': 52,
          '5': 48,
          '6-10': 40,
          '11-15': 30,
          '16-25': 25,
          '26-50': 15,
          '51-75': 10,
          '76-100': 5
        }
      }
    };

    // EU Division Cups Day 1
    const euDivCupsDay1: TournamentWeek = {
      id: 'c6s4-duos-div-cups-eu-day1',
      seriesId: 'c6s4-duos-division-cups',
      weekNumber: 1,
      name: 'C6S4 DUOS DIV CUPS #1 - EU',
      date: new Date('2024-01-15'),
      region: 'EU',
      isCompleted: true,
      pointThresholds: {
        div1: 280,  // Top 50 Day 1
        div2: 335,  // Top 50
        div3: 345,  // Top 100  
        div4: 410,  // Top 200
        div5: 335,  // Top 300
        updatedAt: new Date()
      },
      estimates: {
        div1: 270,
        div2: 320,
        div3: 335,
        div4: 350,
        div5: 295
      },
      finalResults: {
        div1: 280,
        div2: 335,
        div3: 345,
        div4: 410,
        div5: 335
      }
    };

    // EU Division Cups Day 2 (NEW - Updated elim points)
    const euDivCupsDay2: TournamentWeek = {
      id: 'c6s4-duos-div-cups-eu-day2',
      seriesId: 'c6s4-duos-division-cups',
      weekNumber: 2,
      name: 'C6S4 DUOS DIV CUPS #2 - EU (Updated Elim Points)',
      date: new Date('2024-01-16'),
      region: 'EU',
      isCompleted: true,
      pointThresholds: {
        div1: 534,  // Top 50 Cumulative
        div2: 294,  // Top 50 (1 pt per elim)
        div3: 300,  // Top 100 (1 pt per elim)
        div4: 349,  // Top 200 (1 pt per elim)
        div5: 246,  // Top 300 (0 pts per elim)
        updatedAt: new Date()
      },
      estimates: {
        div1: 540,
        div2: 290,
        div3: 300,
        div4: 350,
        div5: 255
      },
      finalResults: {
        div1: 534,
        div2: 294,
        div3: 300,
        div4: 349,
        div5: 246
      }
    };

    // NAC Division Cups Day 2 (NEW - Updated elim points with complete data)
    const nacDivCupsDay2: TournamentWeek = {
      id: 'c6s4-duos-div-cups-nac-day2',
      seriesId: 'c6s4-duos-division-cups',
      weekNumber: 2,
      name: 'C6S4 DUOS DIV CUPS #2 - NAC (Updated Elim Points)',
      date: new Date('2024-01-16'),
      region: 'NAC',
      isCompleted: true,
      pointThresholds: {
        div1: 540,  // Top 50 Cumulative estimate
        div2: 335,  // Top 50 final (1 pt per elim)
        div3: 335,  // Top 100 final (1 pt per elim)  
        div4: 340,  // Top 200 final (1 pt per elim)
        div5: 302,  // Top 300 final (0 pts per elim)
        updatedAt: new Date()
      },
      estimates: {
        div1: 540,  // Cumulative estimate
        div2: 295,  // Day 2 estimate (1 pt per elim)
        div3: 295,  // Day 2 estimate (1 pt per elim)
        div4: 290,  // Day 2 estimate (1 pt per elim)
        div5: 225   // Day 2 estimate (0 pts per elim)
      },
      finalResults: {
        div1: 270, // Day 1 only (cumulative pending)
        div2: 335, // Final Day 2 result
        div3: 335, // Final Day 2 result
        div4: 340, // Final Day 2 result
        div5: 302  // Final Day 2 result
      }
    };

    try {
      // Save to Firestore
      await this.db.collection('tournament_series').doc(soloSeries.id).set(soloSeries);
      await this.db.collection('tournament_weeks').doc(nacWeek1.id).set(nacWeek1);
      await this.db.collection('tournament_weeks').doc(euWeek1.id).set(euWeek1);
      
      // Save Duos Division Cups data
      await this.db.collection('tournament_series').doc(duosDivisionCups.id).set(duosDivisionCups);
      await this.db.collection('tournament_weeks').doc(euDivCupsDay1.id).set(euDivCupsDay1);
      await this.db.collection('tournament_weeks').doc(euDivCupsDay2.id).set(euDivCupsDay2);
      await this.db.collection('tournament_weeks').doc(nacDivCupsDay2.id).set(nacDivCupsDay2);
      
      console.log('✅ Tournament data initialized successfully');
    } catch (error) {
      console.error('❌ Error initializing tournament data:', error);
    }
  }

  // Initialize tournament strategies
  static async initializeTournamentStrategies() {
    if (!this.db) throw new Error('Database not initialized');

    const strategies: TournamentStrategy[] = [
      {
        id: 'solo-placement-strategy',
        title: 'Solo Placement Strategy',
        category: 'general',
        targetSkillLevel: 'intermediate',
        targetGoal: 'placement',
        content: `The golden rules of Solos are: Hide and rotate early. 
        
        Your best tactic is to play placement in every game. It's obvious when you realize that Top 10 is 40 points, and you would need 20 elims to get the same number of points from elims.
        
        Most players who aim for consistent placements will do better than those who try to key every game.`,
        tips: [
          'Always prioritize early rotations',
          'Hide whenever possible',
          'Avoid unnecessary fights',
          'Focus on reaching Top 10 consistently',
          'Only take fights you are confident you can win'
        ],
        applicableRegions: ['NAC', 'EU', 'OCE', 'ASIA', 'BR', 'ME'],
        lastUpdated: new Date(),
        effectiveness: {
          placement: 9,
          consistency: 8,
          skillRequired: 5
        }
      },
      {
        id: 'solo-loadout-strategy',
        title: 'Optimal Solo Loadout',
        category: 'loadout',
        targetSkillLevel: 'intermediate',
        targetGoal: 'placement',
        content: `**Weapons**: Revolver only IF you are used to playing like that. If you're nervous about revolver only, add a Fury AR for close-range spray. Alternative: Pump + AR combo.
        
        **Rotation**: Crash Pads (be careful of double bouncing bug)
        
        **Heals**: Always want Fizz (for rotation) and legendary slurps (OP). Next best: chug splashes, then med kits, minis, bigs.`,
        tips: [
          'Test revolver-only in Ranked first',
          'Fury AR is best for solos spray speed',
          'Always carry Fizz for rotations',
          'Prioritize legendary slurps',
          'Be careful with crash pad double bouncing'
        ],
        applicableRegions: ['NAC', 'EU', 'OCE', 'ASIA', 'BR', 'ME'],
        lastUpdated: new Date(),
        effectiveness: {
          placement: 7,
          consistency: 8,
          skillRequired: 6
        }
      },
      {
        id: 'crash-pad-safety',
        title: 'Crash Pad Bug Prevention',
        category: 'rotation',
        targetSkillLevel: 'beginner',
        targetGoal: 'placement',
        content: `There's a critical crash pad bug causing fall damage deaths. Here's how to avoid it:
        
        The bug seems to happen when you double bounce or run out of fizz during the pad.`,
        tips: [
          'Don\'t double bounce with 2 crash pads',
          'No bunny hopping when landing from pad if going downhill',
          'Don\'t run out of fizz in the air',
          'Fizz just before you pad, not during',
          'This should reduce fall damage bug chances massively'
        ],
        applicableRegions: ['NAC', 'EU', 'OCE', 'ASIA', 'BR', 'ME'],
        lastUpdated: new Date(),
        effectiveness: {
          placement: 10,
          consistency: 10,
          skillRequired: 3
        }
      },
      {
        id: 'top100-qualification',
        title: 'Top 100 Qualification Strategy',
        category: 'general',
        targetSkillLevel: 'advanced',
        targetGoal: 'qualification',
        content: `If you think qualifying for the series final (Top 100) is possible, you need consistent Top 100 weekly placements.
        
        Most Top 100 players can get a nice win to start (10-15 elims) then stay consistent in high-elo lobbies.`,
        tips: [
          'Aim for consistent weekly Top 100 placements',
          'Get a strong win early (10-15 elims is plenty)',
          'Stay consistent in high-elo lobbies after',
          'If you\'re a strong fighter, you can key the first game',
          'Anywhere around Top 200-300 is still a decent start'
        ],
        applicableRegions: ['NAC', 'EU', 'OCE', 'ASIA', 'BR', 'ME'],
        lastUpdated: new Date(),
        effectiveness: {
          placement: 10,
          consistency: 7,
          skillRequired: 9
        }
      }
    ];

    try {
      const batch = this.db.batch();
      strategies.forEach(strategy => {
        const ref = this.db!.collection('tournament_strategies').doc(strategy.id);
        batch.set(ref, strategy);
      });
      await batch.commit();
      
      console.log('✅ Tournament strategies initialized successfully');
    } catch (error) {
      console.error('❌ Error initializing tournament strategies:', error);
    }
  }

  // Calculate tournament points needed
  static calculatePointsNeeded(
    currentPoints: number,
    gamesRemaining: number,
    targetPoints: number
  ): TournamentCalculator {
    const pointsNeeded = targetPoints - currentPoints;
    const requiredAverage = gamesRemaining > 0 ? pointsNeeded / gamesRemaining : 0;

    const scenarios: CalculationScenario[] = [];

    // Conservative scenario (placement focused)
    if (gamesRemaining >= 3) {
      scenarios.push({
        description: 'Conservative Placement Strategy',
        games: [
          { placement: 'Top 5', eliminations: 3, points: 54 },
          { placement: 'Top 10', eliminations: 1, points: 42 },
          { placement: 'Top 25', eliminations: 0, points: 30 }
        ],
        totalPoints: currentPoints + 126,
        difficulty: 'medium',
        probability: 0.7
      });
    }

    // Aggressive scenario (elimination focused)
    if (gamesRemaining >= 2) {
      scenarios.push({
        description: 'Aggressive Win Strategy',
        games: [
          { placement: 'Win', eliminations: 15, points: 90 },
          { placement: 'Top 10', eliminations: 2, points: 44 }
        ],
        totalPoints: currentPoints + 134,
        difficulty: 'hard',
        probability: 0.3
      });
    }

    // Balanced scenario
    if (gamesRemaining >= 4) {
      scenarios.push({
        description: 'Balanced Approach',
        games: [
          { placement: 'Win', eliminations: 8, points: 76 },
          { placement: 'Top 5', eliminations: 2, points: 52 },
          { placement: 'Top 10', eliminations: 1, points: 42 },
          { placement: 'Top 25', eliminations: 0, points: 30 }
        ],
        totalPoints: currentPoints + 200,
        difficulty: 'medium',
        probability: 0.5
      });
    }

    const recommendations: string[] = [];
    
    if (requiredAverage > 50) {
      recommendations.push('You need high-point games - consider going for wins');
      recommendations.push('Focus on early eliminations if you\'re a strong fighter');
    } else if (requiredAverage > 30) {
      recommendations.push('Aim for consistent Top 10 placements');
      recommendations.push('Take smart fights for a few eliminations');
    } else {
      recommendations.push('Focus on placement - avoid unnecessary fights');
      recommendations.push('Play for consistency over high-point games');
    }

    return {
      currentPoints,
      gamesRemaining,
      targetPoints,
      requiredAverage,
      possibleScenarios: scenarios,
      recommendations
    };
  }

  // Get current tournament meta
  static async getCurrentMeta(region: string): Promise<TournamentMeta | null> {
    if (!this.db) return null;

    try {
      const metaDoc = await this.db.collection('tournament_meta')
        .where('region', '==', region)
        .orderBy('lastUpdated', 'desc')
        .limit(1)
        .get();

      if (metaDoc.empty) return null;

      return metaDoc.docs[0].data() as TournamentMeta;
    } catch (error) {
      console.error('❌ Error fetching tournament meta:', error);
      return null;
    }

    // Create C6S4 Duos Trials data
    const duosTrialsNAC: TournamentWeek = {
      id: 'c6s4-duos-trials-nac',
      seriesId: 'c6s4-duos-trials',
      weekNumber: 1,
      name: 'C6S4 DUOS TRIALS - NAC',
      date: new Date('2024-01-15'),
      region: 'NAC',
      isCompleted: true,
      pointThresholds: {
        top100: 280,   // Estimated based on competitive level
        top500: 235,   // Estimated 
        top1000: 250,  // Actual final result
        top2500: 205,  // Actual final result (was top3000)
        top7500: 150,  // Actual final result (was top7000)
        updatedAt: new Date()
      },
      estimates: {
        top100: 280,
        top500: 235,
        top1000: 250,
        top2500: 205,
        top7500: 150
      },
      finalResults: {
        top100: 280,
        top500: 235,
        top1000: 250,
        top2500: 205,
        top7500: 150
      }
    };

    const duosTrialsEU: TournamentWeek = {
      id: 'c6s4-duos-trials-eu',
      seriesId: 'c6s4-duos-trials',
      weekNumber: 1,
      name: 'C6S4 DUOS TRIALS - EU',
      date: new Date('2024-01-15'),
      region: 'EU',
      isCompleted: true,
      pointThresholds: {
        top100: 320,   // Estimated based on competitive level
        top500: 290,   // Estimated 
        top1000: 275,  // Actual final result
        top2500: 247,  // Actual final result (was top3000)
        top7500: 186,  // Actual final result (was top13000)
        updatedAt: new Date()
      },
      estimates: {
        top100: 320,
        top500: 290,
        top1000: 275,
        top2500: 247,
        top7500: 186
      },
      finalResults: {
        top100: 320,
        top500: 290,
        top1000: 275,
        top2500: 247,
        top7500: 186
      }
    };

    // Save duos trials data
    try {
      await Promise.all([
        this.db.collection('tournament_weeks').doc(duosTrialsNAC.id).set(duosTrialsNAC),
        this.db.collection('tournament_weeks').doc(duosTrialsEU.id).set(duosTrialsEU)
      ]);
      console.log('✅ C6S4 Duos Trials data created');
    } catch (error) {
      console.error('❌ Error creating Duos Trials data:', error);
    }
  }

  // Save user tournament performance
  static async saveUserPerformance(performance: UserTournamentPerformance) {
    if (!this.db) throw new Error('Database not initialized');

    try {
      await this.db.collection('user_tournament_performance').doc(performance.id).set(performance);
      console.log('✅ User tournament performance saved');
    } catch (error) {
      console.error('❌ Error saving user performance:', error);
    }
  }

  // Get user tournament history
  static async getUserTournamentHistory(userId: string): Promise<UserTournamentPerformance[]> {
    if (!this.db) return [];

    try {
      const snapshot = await this.db.collection('user_tournament_performance')
        .where('userId', '==', userId)
        .orderBy('createdAt', 'desc')
        .get();

      return snapshot.docs.map((doc: any) => doc.data() as UserTournamentPerformance);
    } catch (error) {
      console.error('❌ Error fetching user tournament history:', error);
      return [];
    }
  }
}
