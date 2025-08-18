'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import Navbar from '@/components/Navbar';
import { FirebaseService, EpicAccount, FortniteStats, FortniteData } from '@/lib/firebase-service';
import OnboardingModal from '@/components/OnboardingModal';
import FortniteStatsDisplay from '@/components/FortniteStatsDisplay';

export default function DashboardPage() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [epicAccount, setEpicAccount] = useState<any>(null);
  const [fortniteStats, setFortniteStats] = useState<FortniteData | null>(null);
  const [replayUploads, setReplayUploads] = useState<any[]>([]);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showAllMatches, setShowAllMatches] = useState(false);
  const [subscriptionInfo, setSubscriptionInfo] = useState<any>(null);
  const [usageInfo, setUsageInfo] = useState<any>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      checkSubscription();
      loadEpicAccount();
      loadUserProfile();
      checkUsage();
    }
  }, [user]);

  // Check for subscription updates when user returns to dashboard
  useEffect(() => {
    const handleFocus = () => {
      if (user) {
        checkSubscription();
        checkUsage();
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [user]);

  useEffect(() => {
    // Check if this is an Epic OAuth callback
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state');
    
    if (code && state && user) {
      handleEpicOAuthCallback(code, state);
    }
  }, [user]);

  const loadUserProfile = async () => {
    try {
      if (user) {
        // Load the full user profile from Firebase
        const userDoc = await FirebaseService.getUserProfile(user.uid);
        if (userDoc) {
          setUserProfile(userDoc);

          
          // Check if user needs onboarding (no gaming preferences set)
          if (!userDoc.gaming || !userDoc.gaming.favoriteGame) {
            setShowOnboarding(true);
          }
        } else {
          // No profile exists, show onboarding
          setShowOnboarding(true);
        }
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
      // If error loading profile, show onboarding
      setShowOnboarding(true);
    }
  };

  const loadEpicAccount = async () => {
    try {
      // First try to load from Firebase
      if (user) {
        const firebaseEpicAccount = await FirebaseService.getEpicAccount(user.uid);
        if (firebaseEpicAccount) {
          setEpicAccount(firebaseEpicAccount);

          
          // Load stats from Firebase using new fortniteData collection
          const firebaseStats = await FirebaseService.getFortniteData(user.uid);
          
          if (firebaseStats) {
            setFortniteStats(firebaseStats);

          }
          return;
        }
      }
      
      // Fallback to localStorage if Firebase doesn't have data
    const epicAccountData = localStorage.getItem('epicAccountData');
    if (epicAccountData) {
      try {
        const parsed = JSON.parse(epicAccountData);
        setEpicAccount(parsed);
        // Load stats if account is connected
        if (parsed.id) {
            // Use the new function to pull stats immediately
            pullStatsFromOsirion();
        }
      } catch (error) {
        console.error('Failed to parse Epic account data:', error);
      }
      }
    } catch (error) {
      console.error('Error loading Epic account:', error);
    }
  };

  const handleEpicOAuthCallback = async (code: string, state: string) => {
    if (!user || user.uid !== state) {
      alert('Invalid user state for Epic OAuth');
      return;
    }

    try {
      const response = await fetch('/api/epic/oauth-callback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code,
          userId: user.uid,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to connect Epic account');
      }

      const data = await response.json();
      
      if (data.epicAccount) {
        localStorage.setItem('epicAccountData', JSON.stringify(data.epicAccount));
        setEpicAccount(data.epicAccount);
        // Immediately pull stats from Osirion API after successful OAuth
        await pullStatsFromOsirion();
        // Clear URL parameters
        window.history.replaceState({}, document.title, '/dashboard');
      }
    } catch (error) {
      console.error('Epic OAuth callback error:', error);
      alert('Failed to connect Epic account. Please try again.');
    }
  };

  const checkUsage = async () => {
    try {
      if (!user?.uid) return;
      
      const response = await fetch(`/api/usage/check?userId=${user.uid}`);
      if (response.ok) {
        const data = await response.json();
        setUsageInfo(data.usage);

      } else {
        console.error('Usage check failed:', response.status);
      }
    } catch (error) {
      console.error('Error checking usage:', error);
    }
  };

  const checkSubscription = async () => {
    if (!user) return;
    
    try {
      const response = await fetch('/api/check-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.uid,
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        // Allow access for free tier users
        const canAccess = data.hasActiveSubscription || data.subscriptionTier === 'free';
        setHasActiveSubscription(canAccess);
        setSubscriptionInfo(data); // Store subscription info

      } else {
        console.error('Subscription check failed:', response.status);
        // Default to allowing access for free users
        setHasActiveSubscription(true);
        setSubscriptionInfo(null); // Clear subscription info on failure
      }
    } catch (error) {
      console.error('Error checking subscription:', error);
      // Default to allowing access for free users
      setHasActiveSubscription(true);
      setSubscriptionInfo(null); // Clear subscription info on error
    } finally {
      setIsLoading(false);
    }
  };



  const handleOnboardingComplete = async () => {
    setShowOnboarding(false);
    // Reload user profile after onboarding
    await loadUserProfile();
  };

  const handleEpicSignIn = () => {
    if (!user) {
      alert('Please sign in to your account first to use Epic Games authentication');
      return;
    }

    // Epic Games OAuth flow
    const epicClientId = process.env.NEXT_PUBLIC_EPIC_CLIENT_ID;
    const redirectUri = process.env.NEXT_PUBLIC_EPIC_REDIRECT_URI || 'http://localhost:3000/auth/callback';
    
    if (!epicClientId) {
      alert('Epic OAuth not configured. Please contact support.');
      return;
    }

    // Epic OAuth parameters
    const params = new URLSearchParams({
      client_id: epicClientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'basic_profile friends_list country presence',
      state: user.uid,
      prompt: 'consent',
    });

    // Epic uses https://www.epicgames.com/id/authorize for OAuth
    const epicOAuthUrl = `https://www.epicgames.com/id/authorize?${params.toString()}`;
    window.location.href = epicOAuthUrl;
  };

  const disconnectEpicAccount = () => {
    setEpicAccount(null);
    setFortniteStats(null);
    // Clear from localStorage
    localStorage.removeItem('epicAccountData');
  };

  // Helper function to get proper plan display name
  const getPlanDisplayName = (tier: string | undefined) => {
    if (!tier) return 'FREE';
    
    switch (tier.toLowerCase()) {
      case 'pro':
        return 'PRO';
      case 'standard':
        return 'STANDARD';
      case 'paid':
        return 'STANDARD'; // Map 'paid' to 'STANDARD' for display
      case 'free':
        return 'FREE';
      default:
        return tier.toUpperCase();
    }
  };

  const pullStatsFromOsirion = async () => {
    if (!epicAccount || !user) {
      alert('Please connect your Epic Games account first');
      return;
    }
    
    // Check if user has reached monthly limit
    if (usageInfo && usageInfo.osirionPulls >= usageInfo.monthlyLimit) {
      alert('⚠️ Monthly API limit reached. You have used all your Osirion API pulls for this month. Please upgrade your plan or wait until next month.');
      return;
    }
    
    try {

      
      // Pull stats from Osirion API using the connected Epic account
      const requestBody = { 
        epicId: epicAccount.epicId || epicAccount.id,
        userId: user.uid,
        platform: 'pc'
      };
      
      
      
      const response = await fetch('/api/osirion/stats', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (response.ok) {
        try {
          const data = await response.json();

          
          if (data.success && data.data) {
            // Create comprehensive Fortnite data structure
            const fortniteStatsData: FortniteData = {
              id: FirebaseService.generateId(),
              userId: user.uid,
              epicId: epicAccount.epicId || epicAccount.id,
              epicName: epicAccount.displayName,
              syncedAt: new Date(),
              
              // Store ALL the raw Osirion data for comprehensive analysis
              rawOsirionData: {
                ...data.data,
                // Enhanced with additional calculated fields
                performanceMetrics: {
                  bestPlacement: Math.min(...(data.data.matches?.map((m: any) => m.placement) || [0])),
                  worstPlacement: Math.max(...(data.data.matches?.map((m: any) => m.placement) || [0])),
                  totalDamage: data.data.matches?.reduce((sum: number, m: any) => sum + (m.damage || 0), 0) || 0,
                  avgDamagePerMatch: data.data.matches ? 
                    data.data.matches.reduce((sum: number, m: any) => sum + (m.damage || 0), 0) / data.data.matches.length : 0,
                  totalSurvivalTime: data.data.matches?.reduce((sum: number, m: any) => sum + (m.survivalTime || 0), 0) || 0,
                  avgSurvivalTime: data.data.matches ? 
                    data.data.matches.reduce((sum: number, m: any) => sum + (m.survivalTime || 0), 0) / data.data.matches.length : 0,
                  top3Count: data.data.matches?.filter((m: any) => m.placement <= 3).length || 0,
                  top10Count: data.data.matches?.filter((m: any) => m.placement <= 10).length || 0,
                  top25Count: data.data.matches?.filter((m: any) => m.placement <= 25).length || 0,
                  highKillGames: data.data.matches?.filter((m: any) => (m.kills || 0) >= 5).length || 0,
                  lowKillGames: data.data.matches?.filter((m: any) => (m.kills || 0) <= 1).length || 0
                }
              },
              
              // Stats from Osirion API
              stats: {
                wins: data.data?.stats?.all?.wins || data.data?.all?.top1 || 0,
                kd: data.data?.stats?.all?.kd || data.data?.all?.kd || 0,
                placement: data.data?.stats?.all?.avgPlace || data.data?.all?.avgPlace || 0,
                earnings: 0, // Not available from Osirion
                matches: data.data?.stats?.all?.matches || data.data?.all?.matches || 0,
                top1: data.data?.stats?.all?.wins || data.data?.all?.top1 || 0,
                top3: data.data?.stats?.all?.top3 || data.data?.all?.top3 || 0,
                top5: data.data?.stats?.all?.top5 || data.data?.all?.top5 || 0,
                top10: data.data?.stats?.all?.top10 || data.data?.all?.top10 || 0,
                top25: data.data?.stats?.all?.top25 || data.data?.all?.top25 || 0,
                kills: data.data?.stats?.all?.kills || data.data?.all?.kills || 0,
                deaths: data.data?.stats?.all?.deaths || data.data?.all?.deaths || 0,
                assists: data.data?.stats?.all?.assists || data.data?.all?.assists || 0,
                damageDealt: data.data?.stats?.all?.damageDealt || data.data?.all?.damageDealt || 0,
                damageTaken: data.data?.stats?.all?.damageTaken || data.data?.all?.damageTaken || 0,
                timeAlive: data.data?.stats?.all?.avgSurvivalTime || data.data?.all?.timeAlive || 0,
                distanceTraveled: data.data?.stats?.all?.distanceTraveled || data.data?.all?.distanceTraveled || 0,
                materialsGathered: data.data?.stats?.all?.materialsGathered || data.data?.all?.materialsGathered || 0,
                structuresBuilt: data.data?.stats?.all?.structuresBuilt || data.data?.all?.structuresBuilt || 0
              },
              
              // Mode-specific stats (always provide default values)
              modes: {
                solo: {
                  kd: data.data?.stats?.solo?.kd || data.data?.solo?.kd || data.data?.all?.kd || 0,
                  winRate: data.data?.stats?.solo?.winRate || data.data?.solo?.winRate || 0,
                  matches: data.data?.stats?.solo?.matches || data.data?.solo?.matches || Math.max(0, Math.floor((data.data?.stats?.all?.matches || data.data?.all?.matches || 0) / 3)),
                  avgPlace: data.data?.stats?.solo?.avgPlace || data.data?.solo?.avgPlace || data.data?.all?.avgPlace || 0,
                  top1: data.data?.stats?.solo?.wins || data.data?.solo?.top1 || Math.max(0, Math.floor((data.data?.stats?.all?.wins || data.data?.all?.top1 || 0) / 3)),
                  top3: data.data?.stats?.solo?.top3 || data.data?.solo?.top3 || Math.max(0, Math.floor((data.data?.stats?.all?.top10 || data.data?.all?.top10 || 0) / 3)),
                  top5: data.data?.stats?.solo?.top5 || data.data?.solo?.top5 || Math.max(0, Math.floor((data.data?.stats?.all?.top10 || data.data?.all?.top10 || 0) / 3)),
                  top10: data.data?.stats?.solo?.top10 || data.data?.solo?.top10 || Math.max(0, Math.floor((data.data?.stats?.all?.top10 || data.data?.all?.top10 || 0) / 3)),
                  top25: data.data?.stats?.solo?.top25 || data.data?.solo?.top25 || Math.max(0, Math.floor((data.data?.stats?.all?.matches || data.data?.all?.matches || 0) / 4)),
                  kills: data.data?.stats?.solo?.kills || data.data?.solo?.kills || Math.max(0, Math.floor((data.data?.stats?.all?.kills || data.data?.all?.kills || 0) / 3)),
                  deaths: data.data?.stats?.solo?.deaths || data.data?.solo?.deaths || Math.max(0, Math.floor((data.data?.stats?.all?.matches || data.data?.all?.matches || 0) / 3)),
                  assists: data.data?.stats?.solo?.assists || data.data?.solo?.assists || Math.max(0, Math.floor((data.data?.stats?.all?.assists || data.data?.all?.assists || 0) / 3)),
                  damageDealt: data.data?.stats?.solo?.damageDealt || data.data?.solo?.damageDealt || 0,
                  damageTaken: data.data?.stats?.solo?.damageTaken || data.data?.solo?.damageTaken || 0,
                  timeAlive: data.data?.stats?.solo?.avgSurvivalTime || data.data?.solo?.timeAlive || data.data?.all?.timeAlive || 0,
                  distanceTraveled: data.data?.stats?.solo?.distanceTraveled || data.data?.solo?.distanceTraveled || 0,
                  materialsGathered: data.data?.stats?.solo?.materialsGathered || data.data?.solo?.materialsGathered || 0,
                  structuresBuilt: data.data?.stats?.solo?.structuresBuilt || data.data?.solo?.structuresBuilt || 0
                },
                
                duo: {
                  kd: data.data?.duo?.kd || data.data?.all?.kd || 0,
                  winRate: data.data?.duo?.winRate || 0,
                  matches: data.data?.duo?.matches || Math.max(0, Math.floor((data.data?.all?.matches || 0) / 3)),
                  avgPlace: data.data?.duo?.avgPlace || data.data?.all?.avgPlace || 0,
                  top1: data.data?.duo?.top1 || Math.max(0, Math.floor((data.data?.all?.top1 || 0) / 3)),
                  top3: data.data?.duo?.top3 || Math.max(0, Math.floor((data.data?.all?.top10 || 0) / 3)),
                  top5: data.data?.duo?.top5 || Math.max(0, Math.floor((data.data?.all?.top10 || 0) / 3)),
                  top10: data.data?.duo?.top10 || Math.max(0, Math.floor((data.data?.all?.top10 || 0) / 3)),
                  top25: data.data?.duo?.top25 || Math.max(0, Math.floor((data.data?.all?.matches || 0) / 4)),
                  kills: data.data?.duo?.kills || Math.max(0, Math.floor((data.data?.all?.kills || 0) / 3)),
                  deaths: data.data?.duo?.deaths || Math.max(0, Math.floor((data.data?.all?.matches || 0) / 3)),
                  assists: data.data?.duo?.assists || Math.max(0, Math.floor((data.data?.all?.assists || 0) / 3)),
                  damageDealt: data.data?.duo?.damageDealt || 0,
                  damageTaken: data.data?.duo?.damageTaken || 0,
                  timeAlive: data.data?.duo?.timeAlive || data.data?.all?.timeAlive || 0,
                  distanceTraveled: data.data?.duo?.distanceTraveled || 0,
                  materialsGathered: data.data?.duo?.materialsGathered || 0,
                  structuresBuilt: data.data?.duo?.structuresBuilt || 0
                },
                
                squad: {
                  kd: data.data?.squad?.kd || data.data?.all?.kd || 0,
                  winRate: data.data?.squad?.winRate || 0,
                  matches: data.data?.squad?.matches || Math.max(0, Math.floor((data.data?.all?.matches || 0) / 3)),
                  avgPlace: data.data?.squad?.avgPlace || data.data?.all?.avgPlace || 0,
                  top1: data.data?.squad?.top1 || Math.max(0, Math.floor((data.data?.all?.top1 || 0) / 3)),
                  top3: data.data?.squad?.top3 || Math.max(0, Math.floor((data.data?.all?.top10 || 0) / 3)),
                  top5: data.data?.squad?.top5 || Math.max(0, Math.floor((data.data?.all?.top10 || 0) / 3)),
                  top10: data.data?.squad?.top10 || Math.max(0, Math.floor((data.data?.all?.top10 || 0) / 3)),
                  top25: data.data?.squad?.top25 || Math.max(0, Math.floor((data.data?.all?.matches || 0) / 4)),
                  kills: data.data?.squad?.kills || Math.max(0, Math.floor((data.data?.all?.kills || 0) / 3)),
                  deaths: data.data?.squad?.deaths || Math.max(0, Math.floor((data.data?.all?.matches || 0) / 3)),
                  assists: data.data?.squad?.assists || Math.max(0, Math.floor((data.data?.all?.assists || 0) / 3)),
                  damageDealt: data.data?.squad?.damageDealt || 0,
                  damageTaken: data.data?.squad?.damageTaken || 0,
                  timeAlive: data.data?.squad?.timeAlive || data.data?.all?.timeAlive || 0,
                  distanceTraveled: data.data?.squad?.distanceTraveled || 0,
                  materialsGathered: data.data?.squad?.materialsGathered || 0,
                  structuresBuilt: data.data?.squad?.structuresBuilt || 0
                }
              },
              
              // Additional metadata
              dataSource: 'osirion',
              dataQuality: 'high',
              notes: 'Stats pulled from Osirion API - Enhanced with comprehensive data storage'
            };
            
            await FirebaseService.saveFortniteData(fortniteStatsData);
    
            
            // Update local state
            setFortniteStats(fortniteStatsData);
            
            // Track usage
            try {
              const { UsageTracker } = await import('@/lib/usage-tracker');
              await UsageTracker.incrementUsage(user.uid, 'epicSync');
            } catch (error) {
              console.warn('⚠️ Could not track Epic account usage:', error);
            }
            
            // Refresh usage info after successful pull
            await checkUsage();
            
            alert('✅ Fortnite stats successfully updated from Osirion API!');
            
          } else {
            console.error('❌ Osirion API returned error:', data);
            const errorData = data.error || {};
            
            if (errorData.message?.includes('Monthly limit reached')) {
              alert('⚠️ Monthly API limit reached. You have used all your Osirion API pulls for this month. Please upgrade your plan or wait until next month.');
            } else if (errorData.message?.includes('API key')) {
              alert('⚠️ API key issue detected. Please check your Osirion API key configuration.');
            } else {
              alert(`⚠️ Failed to load Fortnite stats: ${errorData.message || 'Unknown error'}`);
            }
          }
        } catch (parseError) {
          console.error('❌ Error parsing Osirion API response:', parseError);
          alert('❌ Error processing Fortnite stats response. Please try again.');
        }
      } else {
        console.error('❌ Osirion API request failed:', response.status, response.statusText);
        alert('❌ Failed to connect to Fortnite stats service. Please try again.');
      }
    } catch (error) {
      console.error('❌ Error in pullStatsFromOsirion:', error);
      alert('❌ Error pulling Fortnite stats. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const refreshStats = async () => {
    if (!epicAccount || !user) return;
    
    try {
      
        
        const response = await fetch('/api/osirion/stats', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            epicId: epicAccount.epicId, // Use epicId, not id
            userId: user.uid,
            platform: 'pc'
          }),
        });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // The Osirion API returns { success: true, data: {...} }
          // We need to extract the actual stats data
          if (data.data) {
            
            // Transform the Osirion response to match FortniteData structure
            const transformedStats: FortniteData = {
              id: FirebaseService.generateId(),
              userId: user.uid,
              epicId: epicAccount.epicId,
              epicName: data.data.account?.name || 'Unknown',
              syncedAt: new Date(),
              // Store ALL the raw Osirion data for comprehensive analysis
              rawOsirionData: {
                ...data.data,
                // Enhanced with additional calculated fields
                performanceMetrics: {
                  bestPlacement: Math.min(...(data.data.matches?.map((m: any) => m.placement) || [0])),
                  worstPlacement: Math.max(...(data.data.matches?.map((m: any) => m.placement) || [0])),
                  totalDamage: data.data.matches?.reduce((sum: number, m: any) => sum + (m.damage || 0), 0) || 0,
                  avgDamagePerMatch: data.data.matches ? 
                    data.data.matches.reduce((sum: number, m: any) => sum + (m.damage || 0), 0) / data.data.matches.length : 0,
                  totalSurvivalTime: data.data.matches?.reduce((sum: number, m: any) => sum + (m.survivalTime || 0), 0) || 0,
                  avgSurvivalTime: data.data.matches ? 
                    data.data.matches.reduce((sum: number, m: any) => sum + (m.survivalTime || 0), 0) / data.data.matches.length : 0,
                  top3Count: data.data.matches?.filter((m: any) => m.placement <= 3).length || 0,
                  top10Count: data.data.matches?.filter((m: any) => m.placement <= 10).length || 0,
                  top25Count: data.data.matches?.filter((m: any) => m.placement <= 25).length || 0,
                  highKillGames: data.data.matches?.filter((m: any) => (m.kills || 0) >= 5).length || 0,
                  lowKillGames: data.data.matches?.filter((m: any) => (m.kills || 0) <= 1).length || 0
                }
              },
              // Enhanced stats with more detailed calculations from raw match data
              stats: {
                wins: data.data.stats?.all?.wins || 0,
                kd: data.data.stats?.all?.kd || 0,
                placement: data.data.stats?.all?.avgPlace || 0,
                earnings: 0, // Not available from Osirion
                matches: data.data.stats?.all?.matches || 0,
                top1: data.data.stats?.all?.wins || 0,
                top3: data.data.stats?.all?.top3 || 0,
                top5: data.data.stats?.all?.top5 || 0,
                top10: data.data.stats?.all?.top10 || 0,
                top25: data.data.stats?.all?.top25 || 0,
                kills: data.data.stats?.all?.kills || 0,
                deaths: data.data.stats?.all?.deaths || 0,
                assists: data.data.stats?.all?.assists || 0,
                damageDealt: data.data.stats?.all?.damageDealt || 0,
                damageTaken: data.data.stats?.all?.damageTaken || 0,
                timeAlive: data.data.stats?.all?.avgSurvivalTime || data.data.preferences?.avgSurvivalTime || 0,
                distanceTraveled: data.data.stats?.all?.distanceTraveled || 0,
                materialsGathered: data.data.stats?.all?.materialsGathered || 0,
                structuresBuilt: data.data.stats?.all?.structuresBuilt || 0
              },
              modes: {
                solo: {
                  kd: data.data.stats?.solo?.kd || data.data.stats?.all?.kd || 0,
                  winRate: data.data.stats?.solo?.winRate || 0,
                  matches: data.data.stats?.solo?.matches || Math.max(0, Math.floor((data.data.stats?.all?.matches || 0) / 3)),
                  avgPlace: data.data.stats?.solo?.avgPlace || data.data.stats?.all?.avgPlace || 0,
                  top1: data.data.stats?.solo?.wins || Math.max(0, Math.floor((data.data.stats?.all?.wins || 0) / 3)),
                  top3: data.data.stats?.solo?.top3 || Math.max(0, Math.floor((data.data.stats?.all?.top10 || 0) / 3)),
                  top5: data.data.stats?.solo?.top5 || Math.max(0, Math.floor((data.data.stats?.all?.top10 || 0) / 3)),
                  top10: data.data.stats?.solo?.top10 || Math.max(0, Math.floor((data.data.stats?.all?.top10 || 0) / 3)),
                  top25: data.data.stats?.solo?.top25 || Math.max(0, Math.floor((data.data.stats?.all?.matches || 0) / 4)),
                  kills: data.data.stats?.solo?.kills || Math.max(0, Math.floor((data.data.stats?.all?.kills || 0) / 3)),
                  deaths: data.data.stats?.solo?.deaths || Math.max(0, Math.floor((data.data.stats?.all?.matches || 0) / 3)),
                  assists: data.data.stats?.solo?.assists || Math.max(0, Math.floor((data.data.stats?.all?.assists || 0) / 3)),
                  damageDealt: data.data.stats?.solo?.damageDealt || 0,
                  damageTaken: data.data.stats?.solo?.damageTaken || 0,
                  timeAlive: data.data.stats?.solo?.avgSurvivalTime || data.data.preferences?.avgSurvivalTime || 0,
                  distanceTraveled: data.data.stats?.solo?.distanceTraveled || 0,
                  materialsGathered: data.data.stats?.solo?.materialsGathered || 0,
                  structuresBuilt: data.data.stats?.solo?.structuresBuilt || 0
                },
                duo: {
                  kd: data.data.stats?.duo?.kd || data.data.stats?.all?.kd || 0,
                  winRate: data.data.stats?.duo?.winRate || 0,
                  matches: data.data.stats?.duo?.matches || Math.max(0, Math.floor((data.data.stats?.all?.matches || 0) / 3)),
                  avgPlace: data.data.stats?.duo?.avgPlace || data.data.stats?.all?.avgPlace || 0,
                  top1: data.data.stats?.duo?.wins || Math.max(0, Math.floor((data.data.stats?.all?.wins || 0) / 3)),
                  top3: data.data.stats?.duo?.top3 || Math.max(0, Math.floor((data.data.stats?.all?.top10 || 0) / 3)),
                  top5: data.data.stats?.duo?.top5 || Math.max(0, Math.floor((data.data.stats?.all?.top10 || 0) / 3)),
                  top10: data.data.stats?.duo?.top10 || Math.max(0, Math.floor((data.data.stats?.all?.top10 || 0) / 3)),
                  top25: data.data.stats?.duo?.top25 || Math.max(0, Math.floor((data.data.stats?.all?.matches || 0) / 4)),
                  kills: data.data.stats?.duo?.kills || Math.max(0, Math.floor((data.data.stats?.all?.kills || 0) / 3)),
                  deaths: data.data.stats?.duo?.deaths || Math.max(0, Math.floor((data.data.stats?.all?.matches || 0) / 3)),
                  assists: data.data.stats?.duo?.assists || Math.max(0, Math.floor((data.data.stats?.all?.assists || 0) / 3)),
                  damageDealt: data.data.stats?.duo?.damageDealt || 0,
                  damageTaken: data.data.stats?.duo?.damageTaken || 0,
                  timeAlive: data.data.stats?.duo?.avgSurvivalTime || data.data.preferences?.avgSurvivalTime || 0,
                  distanceTraveled: data.data.stats?.duo?.distanceTraveled || 0,
                  materialsGathered: data.data.stats?.duo?.materialsGathered || 0,
                  structuresBuilt: data.data.stats?.duo?.structuresBuilt || 0
                },
                squad: {
                  kd: data.data.stats?.squad?.kd || data.data.stats?.all?.kd || 0,
                  winRate: data.data.stats?.squad?.winRate || 0,
                  matches: data.data.stats?.squad?.matches || Math.max(0, Math.floor((data.data.stats?.all?.matches || 0) / 3)),
                  avgPlace: data.data.stats?.squad?.avgPlace || data.data.stats?.all?.avgPlace || 0,
                  top1: data.data.stats?.squad?.wins || Math.max(0, Math.floor((data.data.stats?.all?.wins || 0) / 3)),
                  top3: data.data.stats?.squad?.top3 || Math.max(0, Math.floor((data.data.stats?.all?.top10 || 0) / 3)),
                  top5: data.data.stats?.squad?.top5 || Math.max(0, Math.floor((data.data.stats?.all?.top10 || 0) / 3)),
                  top10: data.data.stats?.squad?.top10 || Math.max(0, Math.floor((data.data.stats?.all?.top10 || 0) / 3)),
                  top25: data.data.stats?.squad?.top25 || Math.max(0, Math.floor((data.data.stats?.all?.matches || 0) / 4)),
                  kills: data.data.stats?.squad?.kills || Math.max(0, Math.floor((data.data.stats?.all?.kills || 0) / 3)),
                  deaths: data.data.stats?.squad?.deaths || Math.max(0, Math.floor((data.data.stats?.all?.matches || 0) / 3)),
                  assists: data.data.stats?.squad?.assists || Math.max(0, Math.floor((data.data.stats?.all?.assists || 0) / 3)),
                  damageDealt: data.data.stats?.squad?.damageDealt || 0,
                  damageTaken: data.data.stats?.squad?.damageTaken || 0,
                  timeAlive: data.data.stats?.squad?.avgSurvivalTime || data.data.preferences?.avgSurvivalTime || 0,
                  distanceTraveled: data.data.stats?.squad?.distanceTraveled || 0,
                  materialsGathered: data.data.stats?.squad?.materialsGathered || 0,
                  structuresBuilt: data.data.stats?.squad?.structuresBuilt || 0
                }
              },
              dataSource: 'osirion',
              dataQuality: 'high',
              notes: 'Stats pulled from Osirion API - Enhanced with comprehensive data storage'
            };
            
            
            
            // Save the transformed stats to Firebase
            try {
              await FirebaseService.saveFortniteData(transformedStats);
      
            } catch (firebaseError) {
              console.error('❌ Error saving stats to Firebase:', firebaseError);
            }
            
            // Update local state
            setFortniteStats(transformedStats);
          } else {
            console.error('❌ Osirion API response missing data property');
          }
        }
      }
    } catch (error) {
      console.error('Error refreshing stats:', error);
    }
  };

  const handleReplayUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const upload = {
      id: Date.now().toString(),
      filename: file.name,
      status: 'uploading',
      createdAt: new Date()
    };

    setReplayUploads(prev => [upload, ...prev]);

    // Simulate upload process
    setTimeout(() => {
      setReplayUploads(prev => 
        prev.map(u => u.id === upload.id ? { ...u, status: 'processing' } : u)
      );
      
      setTimeout(() => {
        setReplayUploads(prev => 
          prev.map(u => u.id === upload.id ? { ...u, status: 'completed' } : u)
        );
      }, 3000);
    }, 2000);
  };

  const exportComprehensiveData = () => {
    if (!fortniteStats?.rawOsirionData?.matches) return;
    
    // Create CSV content with all match data
    const headers = [
      'Match #', 'Match ID', 'Placement', 'Kills', 'Assists', 'Damage', 
      'Survival Time (seconds)', 'Survival Time (minutes)', 'Performance Rating'
    ];
    
    const csvContent = [
      headers.join(','),
      ...fortniteStats.rawOsirionData.matches.map((match: any, index: number) => [
        index + 1,
        match.id || 'N/A',
        match.placement,
        match.kills || 0,
        match.assists || 0,
        Math.round(match.damage || 0),
        Math.round(match.survivalTime || 0),
        Math.round((match.survivalTime || 0) / 60),
        match.placement <= 3 ? 'Elite' : 
        match.placement <= 10 ? 'Strong' : 
        match.placement <= 25 ? 'Good' : 'Average'
      ].join(','))
    ].join('\n');
    
    // Add summary data
    const summaryData = `
Summary Statistics:
Total Matches: ${fortniteStats.rawOsirionData.matches.length}
Wins: ${fortniteStats.rawOsirionData.matches.filter((m: any) => m.placement === 1).length}
Top 3: ${fortniteStats.rawOsirionData.matches.filter((m: any) => m.placement <= 3).length}
Top 10: ${fortniteStats.rawOsirionData.matches.filter((m: any) => m.placement <= 10).length}
Total Kills: ${fortniteStats.rawOsirionData.matches.reduce((sum: number, m: any) => sum + (m.kills || 0), 0)}
Total Assists: ${fortniteStats.rawOsirionData.matches.reduce((sum: number, m: any) => sum + (m.assists || 0), 0)}
Total Damage: ${Math.round(fortniteStats.rawOsirionData.matches.reduce((sum: number, m: any) => sum + (m.damage || 0), 0))}
Average Placement: ${(fortniteStats.rawOsirionData.matches.reduce((sum: number, m: any) => sum + m.placement, 0) / fortniteStats.rawOsirionData.matches.length).toFixed(2)}
Average Survival Time: ${Math.round(fortniteStats.rawOsirionData.matches.reduce((sum: number, m: any) => sum + (m.survivalTime || 0), 0) / fortniteStats.rawOsirionData.matches.length / 60)} minutes
`;
    
    const fullContent = csvContent + summaryData;
    
    const blob = new Blob([fullContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fortnite-comprehensive-stats-${fortniteStats.epicName}-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-dark flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
            <div className="relative w-12 h-12">
              <Image
                src="/Black PathGen logo.png"
                alt="PathGen AI Logo"
                fill
                sizes="48px"
                className="object-contain"
                priority
              />
            </div>
          </div>
          <p className="text-white text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-dark">
      <Navbar />
      
      {/* Main Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-20">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
            <span className="text-primary-text">Welcome to</span>
            <br />
            <span className="text-gradient">PathGen AI</span>
          </h1>
          <p className="text-xl text-secondary-text">
            Your personal Fortnite improvement dashboard
          </p>
        </div>

        {/* Dashboard Content */}
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Epic Account Section */}
          <div className="glass-card p-6">
            <h3 className="text-xl font-semibold text-white mb-4">🎮 Epic Games Account</h3>
            {epicAccount ? (
              <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-green-400 font-semibold">Account Connected</h4>
                  <span className="px-3 py-1 bg-green-500 text-white text-xs rounded-full">Connected</span>
                </div>
                <div className="text-sm text-white/80 space-y-1">
                  <p><span className="text-white/60">Username:</span> {epicAccount.displayName}</p>
                  <p><span className="text-white/60">Platform:</span> {epicAccount.platform || 'Epic'}</p>
                  <p><span className="text-white/60">Connected:</span> {new Date(epicAccount.linkedAt || '').toLocaleDateString()}</p>
                  {usageInfo && (
                    <p><span className="text-white/60">API Pulls:</span> 
                      <span className={`ml-1 ${usageInfo.osirionPulls >= usageInfo.monthlyLimit ? 'text-red-400' : 'text-green-400'}`}>
                        {usageInfo.osirionPulls}/{usageInfo.monthlyLimit}
                      </span>
                    </p>
                  )}
                  <p className="text-xs text-gray-500 mt-2">
                    💾 All comprehensive stats are automatically saved to Firebase for AI coaching
                  </p>
                </div>
                <div className="flex space-x-3 mt-3">
                  <button
                    onClick={disconnectEpicAccount}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm transition-colors"
                  >
                    Disconnect Account
                  </button>
                  <button
                    onClick={pullStatsFromOsirion}
                    disabled={isLoading || (usageInfo && usageInfo.osirionPulls >= usageInfo.monthlyLimit)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white rounded-lg text-sm transition-colors"
                  >
                    {isLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white inline-block mr-2"></div>
                        Pulling Stats...
                      </>
                    ) : usageInfo && usageInfo.osirionPulls >= usageInfo.monthlyLimit ? (
                      '❌ Monthly Limit Reached'
                    ) : (
                      '🔄 Pull Latest Stats'
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center space-y-4">
                <p className="text-white/60">Connect your Epic Games account to access personalized Fortnite coaching and stats.</p>
                <button
                  onClick={handleEpicSignIn}
                  className="px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors"
                >
                  🎮 Sign In with Epic Games
                </button>
              </div>
            )}
          </div>

          {/* Key Stats Display */}
          {epicAccount && fortniteStats && (
            <div className="glass-card p-6">
              <h3 className="text-xl font-semibold text-white mb-4">📊 Key Performance Stats</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gray-800/50 rounded-lg p-4 text-center border border-gray-700">
                  <div className="text-2xl font-bold text-blue-400">
                    {fortniteStats.stats?.kd?.toFixed(2) || '0.00'}
                  </div>
                  <div className="text-sm text-gray-400">K/D Ratio</div>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-4 text-center border border-gray-700">
                  <div className="text-2xl font-bold text-green-400">
                    {fortniteStats.stats?.wins || 0}
                  </div>
                  <div className="text-sm text-gray-400">Wins</div>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-4 text-center border border-gray-700">
                  <div className="text-2xl font-bold text-yellow-400">
                    {fortniteStats.stats?.top10 || 0}
                  </div>
                  <div className="text-sm text-gray-400">Top 10</div>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-4 text-center border border-gray-700">
                  <div className="text-2xl font-bold text-purple-400">
                    {fortniteStats.stats?.matches || 0}
                  </div>
                  <div className="text-sm text-gray-400">Matches</div>
                </div>
              </div>
              
              {/* Data Source Info */}
              <div className="mt-4 text-center text-sm text-gray-400">
                <p>📡 Data pulled from Osirion API • All comprehensive stats stored in Firebase for AI coaching</p>
                <p className="mt-1">Last updated: {fortniteStats.syncedAt ? new Date(fortniteStats.syncedAt).toLocaleString() : 'Never'}</p>
              </div>
            </div>
          )}

          {/* No Stats Yet - Prompt to Pull Stats */}
          {epicAccount && !fortniteStats && (
            <div className="glass-card p-6">
              <h3 className="text-xl font-semibold text-white mb-4">📊 Fortnite Stats</h3>
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 text-center">
                <p className="text-blue-300 text-sm mb-3">
                  Ready to see your Fortnite performance stats? Click "Pull Latest Stats" above to get started!
                </p>
                <p className="text-gray-400 text-xs">
                  All comprehensive data will be stored in Firebase for AI coaching analysis
                </p>
              </div>
            </div>
          )}

          {/* Stats Loading Status */}
          {epicAccount && !fortniteStats && (
            <div className="glass-card p-6">
              <h3 className="text-xl font-semibold text-white mb-4">📊 Fortnite Stats Status</h3>
              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-yellow-500"></div>
                  <div>
                    <h4 className="text-yellow-400 font-semibold">Loading Fortnite Stats</h4>
                    <p className="text-yellow-300 text-sm">
                      Fetching your stats from Osirion API... This may take a few moments.
                    </p>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* Subscription Status Section */}
          {subscriptionInfo && (
            <div className="glass-card p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-white">💎 Subscription Status</h3>
                <button
                  onClick={checkSubscription}
                  disabled={isLoading}
                  className="px-3 py-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white text-xs rounded transition-colors"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white inline-block mr-1"></div>
                      Refreshing...
                    </>
                  ) : (
                    '🔄 Refresh'
                  )}
                </button>
              </div>
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-blue-400 font-semibold">
                    Current Plan: {getPlanDisplayName(subscriptionInfo.subscriptionTier)}
                  </h4>
                  <span className={`px-3 py-1 text-white text-xs rounded-full ${
                    subscriptionInfo.subscriptionTier === 'pro' ? 'bg-purple-500' :
                    subscriptionInfo.subscriptionTier === 'standard' ? 'bg-blue-500' :
                    'bg-green-500'
                  }`}>
                    {getPlanDisplayName(subscriptionInfo.subscriptionTier)}
                  </span>
                </div>
                <div className="text-sm text-white/80 space-y-2">
                  <p><span className="text-white/60">Status:</span> {subscriptionInfo.hasActiveSubscription ? 'Active' : 'Inactive'}</p>
                  <p><span className="text-white/60">Messages Remaining:</span> {subscriptionInfo.usage?.remaining || 0}</p>
                  <p><span className="text-white/60">Monthly Messages:</span> {subscriptionInfo.limits?.monthlyMessages || 0}</p>
                  <p><span className="text-white/60">Monthly Tokens:</span> {subscriptionInfo.limits?.monthlyTokens || 0}</p>
                  <p><span className="text-white/60">Data Pulls:</span> {subscriptionInfo.limits?.monthlyDataPulls || 0}</p>
                  <p><span className="text-white/60">Replay Uploads:</span> {subscriptionInfo.limits?.replayUploads || 0}</p>
                  <p><span className="text-white/60">Tournament Strategies:</span> {subscriptionInfo.limits?.tournamentStrategies || 0}</p>
                </div>
                {subscriptionInfo.subscriptionTier === 'free' && (
                  <div className="mt-3 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                    <p className="text-yellow-400 text-sm">
                      💡 Upgrade to Pro for unlimited AI coaching, advanced analytics, and tournament strategies!
                    </p>
                    <button
                      onClick={() => router.push('/pricing')}
                      className="mt-2 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg text-sm transition-colors"
                    >
                      View Pricing Plans
                    </button>
                  </div>
                )}
                
                {/* Payment completion note */}
                <div className="mt-3 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                  <p className="text-blue-400 text-sm">
                    💳 Just completed payment? Click "Refresh" above to update your subscription status!
                  </p>
                </div>
                

              </div>
            </div>
          )}

          {/* Usage Tracking Section */}
          {usageInfo && (
            <div className="glass-card p-6">
              <h3 className="text-xl font-semibold text-white mb-4">📊 Monthly Usage</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Osirion API Usage */}
                <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                  <h4 className="text-lg font-semibold text-white mb-3">Osirion API Pulls</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Used This Month:</span>
                      <span className="text-white font-medium">{usageInfo.osirionPulls}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Remaining:</span>
                      <span className="text-white font-medium">{usageInfo.osirionPullsRemaining}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Monthly Limit:</span>
                      <span className="text-white font-medium">{usageInfo.monthlyLimit}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Last Pull:</span>
                      <span className="text-white font-medium">
                        {usageInfo.lastPull ? new Date(usageInfo.lastPull).toLocaleDateString() : 'Never'}
                      </span>
                    </div>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="mt-3">
                    <div className="flex justify-between text-xs text-gray-400 mb-1">
                      <span>Progress</span>
                      <span>{usageInfo.osirionPulls}/{usageInfo.monthlyLimit}</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-300 ${
                          usageInfo.osirionPulls >= usageInfo.monthlyLimit 
                            ? 'bg-red-500' 
                            : usageInfo.osirionPulls >= usageInfo.monthlyLimit * 0.8 
                            ? 'bg-yellow-500' 
                            : 'bg-green-500'
                        }`}
                        style={{ width: `${Math.min((usageInfo.osirionPulls / usageInfo.monthlyLimit) * 100, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                {/* Usage Info */}
                <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                  <h4 className="text-lg font-semibold text-white mb-3">Usage Information</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Current Month:</span>
                      <span className="text-white font-medium">{usageInfo.currentMonth}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Last Reset:</span>
                      <span className="text-white font-medium">
                        {usageInfo.lastReset ? new Date(usageInfo.lastReset).toLocaleDateString() : 'Never'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Resets Next Month:</span>
                      <span className="text-white font-medium">Yes</span>
                    </div>
                  </div>
                  

                </div>
              </div>
            </div>
          )}

          {/* User Profile Section */}
           {userProfile && (
             <div className="glass-card p-6">
               <h3 className="text-xl font-semibold text-white mb-4">👤 User Profile</h3>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 {/* Basic Info */}
                 <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                   <h4 className="text-lg font-semibold text-white mb-3">Basic Information</h4>
                   <div className="space-y-2 text-sm">
                     <div className="flex justify-between">
                       <span className="text-gray-400">Name:</span>
                       <span className="text-white font-medium">{userProfile.displayName || 'Not set'}</span>
                     </div>
                     <div className="flex justify-between">
                       <span className="text-gray-400">Email:</span>
                       <span className="text-white font-medium">{userProfile.email || 'Not set'}</span>
                     </div>
                     <div className="flex justify-between">
                       <span className="text-gray-400">Timezone:</span>
                       <span className="text-white font-medium">{userProfile.profile?.timezone || 'Not set'}</span>
                     </div>
                     <div className="flex justify-between">
                       <span className="text-gray-400">Language:</span>
                       <span className="text-white font-medium">{userProfile.profile?.language || 'Not set'}</span>
                     </div>
                   </div>
                 </div>

                 {/* Gaming Preferences */}
                 <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                   <h4 className="text-lg font-semibold text-white mb-3">Gaming Preferences</h4>
                   <div className="space-y-2 text-sm">
                     <div className="flex justify-between">
                       <span className="text-gray-400">Favorite Game:</span>
                       <span className="text-white font-medium">{userProfile.gaming?.favoriteGame || 'Not set'}</span>
                     </div>
                     <div className="flex justify-between">
                       <span className="text-gray-400">Play Style:</span>
                       <span className="text-white font-medium capitalize">{userProfile.gaming?.playStyle || 'Not set'}</span>
                     </div>
                     <div className="flex justify-between">
                       <span className="text-gray-400">Skill Level:</span>
                       <span className="text-white font-medium capitalize">{userProfile.gaming?.skillLevel || 'Not set'}</span>
                     </div>
                     <div className="flex justify-between">
                       <span className="text-gray-400">Team Size:</span>
                       <span className="text-white font-medium capitalize">{userProfile.gaming?.teamSize || 'Not set'}</span>
                     </div>
                   </div>
                 </div>
               </div>

               {/* Goals */}
               {userProfile.gaming?.goals && userProfile.gaming.goals.length > 0 && (
                 <div className="mt-4">
                   <h4 className="text-lg font-semibold text-white mb-3">Gaming Goals</h4>
                   <div className="flex flex-wrap gap-2">
                     {userProfile.gaming.goals.map((goal: string, index: number) => (
                       <span key={index} className="px-3 py-1 bg-blue-600/20 text-blue-400 rounded-full text-sm border border-blue-600/30">
                         {goal}
                       </span>
                     ))}
                   </div>
                 </div>
               )}

               {/* AI Usage Stats */}
               {userProfile.ai && (
                 <div className="mt-4">
                   <h4 className="text-lg font-semibold text-white mb-3">AI Coaching Usage</h4>
                   <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                     <div className="bg-blue-600/10 border border-blue-600/20 rounded-lg p-3 text-center">
                       <div className="text-xl font-bold text-blue-400">{userProfile.ai.conversationsCreated || 0}</div>
                       <div className="text-xs text-blue-300">Conversations</div>
                     </div>
                     <div className="bg-green-600/10 border border-green-600/20 rounded-lg p-3 text-center">
                       <div className="text-xl font-bold text-green-400">{userProfile.ai.messagesUsed || 0}</div>
                       <div className="text-xs text-green-300">Messages Used</div>
                     </div>
                     <div className="bg-purple-600/10 border border-purple-600/20 rounded-lg p-3 text-center">
                       <div className="text-xl font-bold text-purple-400">{userProfile.statistics?.totalSessions || 0}</div>
                       <div className="text-xs text-purple-300">Total Sessions</div>
                     </div>
                     <div className="bg-orange-600/10 border border-orange-600/20 rounded-lg p-3 text-center">
                       <div className="text-xl font-bold text-orange-400">{userProfile.statistics?.totalTime || 0}</div>
                       <div className="text-xs text-orange-300">Total Time (min)</div>
                     </div>
                   </div>
                 </div>
               )}
             </div>
           )}

           {/* AI Connection Status */}
           <div className="glass-card p-6">
             <h3 className="text-xl font-semibold text-white mb-4">🤖 AI Coaching Connection</h3>
            {epicAccount ? (
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-blue-400 font-semibold">AI Coaching Active</h4>
                  <span className="px-3 py-1 bg-blue-500 text-white text-xs rounded-full">Connected</span>
                </div>
                <div className="text-sm text-white/80 space-y-1">
                  <p><span className="text-white/60">Status:</span> AI coaching is now connected to your Epic account</p>
                  <p><span className="text-white/60">Personalization:</span> Coaching based on your actual gameplay data</p>
                  <p><span className="text-white/60">Features:</span> Personalized advice, stat analysis, improvement tracking</p>
                </div>
                <div className="mt-3 space-y-2">
                  <Link
                    href="/ai"
                    className="inline-block px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors"
                  >
                    🚀 Start AI Coaching Session
                  </Link>
                  <p className="text-xs text-blue-300">Your AI coach now has access to your Epic account data for personalized advice</p>
                </div>
              </div>
            ) : (
              <div className="text-center space-y-4">
                <p className="text-white/60">Connect your Epic Games account to enable AI coaching with your actual gameplay data.</p>
                <div className="text-xs text-white/40 space-y-1">
                  <p>• Personalized coaching based on your stats</p>
                  <p>• Real-time performance analysis</p>
                  <p>• Custom improvement recommendations</p>
                </div>
              </div>
            )}
          </div>



          {/* Replay Upload Section */}
          {epicAccount && (
            <div className="glass-card p-6">
              <h3 className="text-xl font-semibold text-white mb-4">🎬 Replay Analysis</h3>
              <div className="space-y-4">
                <p className="text-white/60">Upload your Fortnite replay files for detailed analysis and coaching insights.</p>
                <div className="border-2 border-dashed border-white/20 rounded-lg p-6 text-center">
                  <input
                    type="file"
                    accept=".replay"
                    onChange={handleReplayUpload}
                    className="hidden"
                    id="replay-upload"
                  />
                  <label htmlFor="replay-upload" className="cursor-pointer">
                    <div className="text-4xl mb-2">📁</div>
                    <div className="text-white font-medium">Click to upload replay file</div>
                    <div className="text-white/60 text-sm mt-1">Supports .replay files</div>
                  </label>
                </div>
                {replayUploads.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-white font-medium">Recent Uploads:</h4>
                    {replayUploads.map((upload, index) => (
                      <div key={index} className="flex items-center justify-between bg-white/5 p-3 rounded-lg">
                        <span className="text-white/80">{upload.filename}</span>
                        <span className={`px-2 py-1 rounded text-xs ${
                          upload.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                          upload.status === 'processing' ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-red-500/20 text-red-400'
                        }`}>
                          {upload.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

                     {/* Quick Actions */}
           <div className="glass-card p-6">
             <h3 className="text-xl font-semibold text-white mb-4">Quick Actions</h3>
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
               <Link href="/ai" className="btn-secondary">
                 New AI Chat
               </Link>
               <Link href="/settings" className="btn-secondary">
                 Settings
               </Link>
               <button 
                 onClick={() => setShowOnboarding(true)} 
                 className="btn-secondary"
               >
                 Update Preferences
               </button>
               <button onClick={() => router.push('/')} className="btn-secondary">
                 Back to Home
               </button>
               <button onClick={logout} className="btn-secondary">
                 Logout
               </button>
             </div>
           </div>
        </div>
      </div>

      {/* Payment Gate Overlay */}
      {(!hasActiveSubscription && !isLoading) && (
        <div className="absolute inset-0 bg-dark-charcoal/90 backdrop-blur-md flex items-center justify-center z-30">
          <div className="text-center p-8 rounded-xl bg-dark-charcoal border border-white/10 shadow-lg max-w-md mx-auto">
            <div className="text-6xl mb-4 flex justify-center">
              <svg className="w-24 h-24 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0 1.1-.9-2-2-2zM9 6c0-1.66 1.34-3 3-3s3 1.34 3 3v2H9V6zm9 14H6V10h12v10z"/>
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-white mb-4">Premium Features</h2>
            <p className="text-secondary-text mb-6">
              Unlock the full potential of PathGen AI with our premium subscription. Get unlimited AI coaching, advanced analytics, and personalized strategies.
            </p>
            <div className="space-y-3">
              <Link href="/pricing" className="w-full btn-primary py-3 block">
                Subscribe Now - $6.99/month
              </Link>

              <button
                onClick={() => router.push('/')}
                className="w-full btn-secondary py-3"
              >
                Back to Home
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Onboarding Modal */}
      <OnboardingModal
        isOpen={showOnboarding}
        onComplete={handleOnboardingComplete}
        userId={user?.uid || ''}
        userEmail={user?.email || ''}
        userDisplayName={user?.displayName || ''}
      />
    </div>
  );
}
