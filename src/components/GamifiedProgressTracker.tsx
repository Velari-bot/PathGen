'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface TournamentProgress {
  totalTournaments: number;
  bestPlacement: number;
  averagePlacement: number;
  tournamentsWon: number;
  top3Finishes: number;
  top10Finishes: number;
  totalWinnings: number;
  progressPercentage: number;
  skillScore: number;
  level: string;
  nextMilestone: string;
  recentImprovements: {
    tournamentPerformance: string;
    placementConsistency: string;
    competitiveGrowth: string;
  };
}

export default function GamifiedProgressTracker() {
  const { user } = useAuth();
  const { subscription } = useSubscription();
  const [tournamentProgress, setTournamentProgress] = useState<TournamentProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Only show progress animation if user is NOT pro
  const isPro = subscription?.tier === 'pro';
  
  useEffect(() => {
    const loadTournamentProgress = async () => {
      if (!user || !db) {
        setLoading(false);
        return;
      }

      try {
        // Get user's Fortnite stats from Firestore
        const statsRef = doc(db, 'fortniteStats', user.uid);
        const statsDoc = await getDoc(statsRef);
        
        if (statsDoc.exists()) {
          const statsData = statsDoc.data();
          const tournamentStats = statsData.tournaments || {};
          
          // Calculate tournament-based progress
          const progress = calculateTournamentProgress(tournamentStats, isPro);
          setTournamentProgress(progress);
        } else {
          // No stats found, create default progress
          const defaultProgress = calculateTournamentProgress({}, isPro);
          setTournamentProgress(defaultProgress);
        }
      } catch (err) {
        console.error('Error loading tournament progress:', err);
        setError('Failed to load progress data');
        // Fallback to default progress
        const fallbackProgress = calculateTournamentProgress({}, isPro);
        setTournamentProgress(fallbackProgress);
      } finally {
        setLoading(false);
      }
    };

    loadTournamentProgress();
  }, [user, isPro]);

  const calculateTournamentProgress = (tournamentStats: any, isProUser: boolean): TournamentProgress => {
    const {
      totalTournaments = 0,
      bestPlacement = 999,
      averagePlacement = 999,
      tournamentsWon = 0,
      top3Finishes = 0,
      top10Finishes = 0,
      totalWinnings = 0
    } = tournamentStats;

    // Calculate skill score based on tournament performance
    let skillScore = 50; // Base score
    
    // Bonus for tournament participation
    if (totalTournaments > 0) {
      skillScore += Math.min(totalTournaments * 2, 20); // Max 20 points for participation
    }
    
    // Bonus for best placement (lower is better)
    if (bestPlacement < 999) {
      if (bestPlacement <= 10) skillScore += 15;
      else if (bestPlacement <= 25) skillScore += 10;
      else if (bestPlacement <= 50) skillScore += 5;
    }
    
    // Bonus for tournament wins
    skillScore += tournamentsWon * 5;
    
    // Bonus for top finishes
    skillScore += top3Finishes * 3;
    skillScore += top10Finishes * 1;
    
    // Cap skill score
    skillScore = Math.min(skillScore, 100);
    
    // Determine level based on skill score
    let level = 'Beginner';
    let nextMilestone = 'Intermediate';
    let targetScore = 70;
    
    if (skillScore >= 80) {
      level = 'Expert';
      nextMilestone = 'Elite';
      targetScore = 95;
    } else if (skillScore >= 65) {
      level = 'Advanced';
      nextMilestone = 'Expert';
      targetScore = 80;
    } else if (skillScore >= 50) {
      level = 'Intermediate';
      nextMilestone = 'Advanced';
      targetScore = 65;
    } else {
      level = 'Beginner';
      nextMilestone = 'Intermediate';
      targetScore = 50;
    }
    
    // Calculate progress percentage
    let progressPercentage = 0;
    
    if (isProUser) {
      // Pro users get full progress based on actual performance
      progressPercentage = Math.min((skillScore / targetScore) * 100, 100);
    } else {
      // Free users get limited progress to encourage upgrade
      const actualProgress = (skillScore / targetScore) * 100;
      progressPercentage = Math.min(actualProgress, 85); // Cap at 85% for free users
    }
    
    // Calculate recent improvements based on tournament data
    const recentImprovements = {
      tournamentPerformance: totalTournaments > 0 ? `+${Math.min(totalTournaments * 5, 25)}%` : '+0%',
      placementConsistency: bestPlacement < 999 ? `+${Math.max(15 - bestPlacement, 5)}%` : '+0%',
      competitiveGrowth: tournamentsWon > 0 ? `+${tournamentsWon * 10}%` : '+0%'
    };
    
    return {
      totalTournaments,
      bestPlacement,
      averagePlacement,
      tournamentsWon,
      top3Finishes,
      top10Finishes,
      totalWinnings,
      progressPercentage,
      skillScore: Math.round(skillScore),
      level,
      nextMilestone,
      recentImprovements
    };
  };

  const getProgressColor = (progress: number) => {
    if (progress < 30) return 'text-red-400';
    if (progress < 70) return 'text-yellow-400';
    return 'text-green-400';
  };

  const getProgressBarColor = (progress: number) => {
    if (progress < 30) return 'bg-red-400';
    if (progress < 70) return 'bg-yellow-400';
    return 'bg-green-400';
  };

  if (loading) {
    return (
      <div className="glass-card p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mx-auto"></div>
          <p className="text-secondary-text mt-2">Loading progress...</p>
        </div>
      </div>
    );
  }

  if (error || !tournamentProgress) {
    return (
      <div className="glass-card p-6">
        <div className="text-center">
          <p className="text-red-400">Failed to load progress data</p>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card p-6">
      <div className="text-center mb-6">
        <h3 className="text-2xl font-bold text-white mb-2">Your Skill Score</h3>
        <div className="text-4xl font-bold text-blue-400 mb-2">{tournamentProgress.skillScore}</div>
        <div className="text-lg text-secondary-text">Current Level: {tournamentProgress.level}</div>
      </div>

      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-secondary-text text-sm">Progress to {tournamentProgress.nextMilestone}</span>
          <span className={`text-sm font-semibold ${getProgressColor(tournamentProgress.progressPercentage)}`}>
            {Math.round(tournamentProgress.progressPercentage)}%
          </span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-3">
          <div 
            className={`h-3 rounded-full transition-all duration-500 ${getProgressBarColor(tournamentProgress.progressPercentage)}`}
            style={{ width: `${tournamentProgress.progressPercentage}%` }}
          ></div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="text-center">
          <div className="text-2xl font-bold text-red-400 mb-1">Current: {tournamentProgress.skillScore}</div>
          <div className="text-secondary-text text-sm">Your skill level</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-400 mb-1">Target: {tournamentProgress.skillScore >= 80 ? 95 : tournamentProgress.skillScore >= 65 ? 80 : tournamentProgress.skillScore >= 50 ? 65 : 50}</div>
          <div className="text-secondary-text text-sm">With PathGen Pro</div>
        </div>
      </div>

      <div className="bg-gray-800 rounded-lg p-4 mb-6">
        <h4 className="text-lg font-semibold text-white mb-3">Tournament Performance</h4>
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-secondary-text text-sm">Tournaments Played</span>
            <span className="text-blue-400 text-sm">{tournamentProgress.totalTournaments}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-secondary-text text-sm">Best Placement</span>
            <span className="text-green-400 text-sm">{tournamentProgress.bestPlacement < 999 ? `#${tournamentProgress.bestPlacement}` : 'N/A'}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-secondary-text text-sm">Tournaments Won</span>
            <span className="text-yellow-400 text-sm">{tournamentProgress.tournamentsWon}</span>
          </div>
        </div>
      </div>

      <div className="bg-gray-800 rounded-lg p-4 mb-6">
        <h4 className="text-lg font-semibold text-white mb-3">Recent Improvements</h4>
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-secondary-text text-sm">Tournament Performance</span>
            <span className="text-green-400 text-sm">{tournamentProgress.recentImprovements.tournamentPerformance}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-secondary-text text-sm">Placement Consistency</span>
            <span className="text-green-400 text-sm">{tournamentProgress.recentImprovements.placementConsistency}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-secondary-text text-sm">Competitive Growth</span>
            <span className="text-green-400 text-sm">{tournamentProgress.recentImprovements.competitiveGrowth}</span>
          </div>
        </div>
      </div>

      <div className="text-center">
        {isPro ? (
          <div className="text-lg font-semibold text-green-400 mb-2">
            ✅ Pro Member - Full Access Unlocked
          </div>
        ) : (
          <>
            <div className="text-lg font-semibold text-white mb-2">
              +{Math.max(0, (tournamentProgress.skillScore >= 80 ? 95 : tournamentProgress.skillScore >= 65 ? 80 : tournamentProgress.skillScore >= 50 ? 65 : 50) - tournamentProgress.skillScore)} Skill Points Available
            </div>
            <div className="text-secondary-text text-sm">
              Play tournaments to unlock your full potential
            </div>
          </>
        )}
      </div>
    </div>
  );
}
