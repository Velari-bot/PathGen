'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import Navbar from '@/components/Navbar';
import { FirebaseService, EpicAccount, FortniteStats } from '@/lib/firebase-service';

import OnboardingModal from '@/components/OnboardingModal';
import EmailVerificationGuard from '@/components/EmailVerificationGuard';
import GamifiedProgressTracker from '@/components/GamifiedProgressTracker';

import { FullCreditDisplay } from '@/components/CreditDisplay';

export default function DashboardPage() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [epicAccount, setEpicAccount] = useState<any>(null);
  const [fortniteStats, setFortniteStats] = useState<any>(null);
  const [replayUploads, setReplayUploads] = useState<any[]>([]);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);

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
    }
  }, [user]);

  useEffect(() => {
    // Check if this is an Epic OAuth callback
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state');
    const success = urlParams.get('success');
    const sessionId = urlParams.get('session_id');
    
    if (code && state && user) {
      handleEpicOAuthCallback(code, state);
    }
    
    // Check if this is a successful payment
    if (success === 'true' && sessionId && user) {
      handlePaymentSuccess(sessionId);
    }
  }, [user]);

  const getSubscriptionTier = async (): Promise<string> => {
    if (!user) return 'free';
    
    try {
      // Always try to get the most up-to-date subscription data from the API
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
        const tier = data.subscriptionTier || 'free';
        console.log('✅ Got subscription tier from API:', tier);
        return tier;
      }
    } catch (error) {
      console.log('⚠️ API call failed, using local data:', error);
    }
    
    // Fallback to local Firebase data - ensure new accounts are 'free'
    try {
      const userDoc = await FirebaseService.getUserProfile(user.uid);
      // For new accounts or accounts without explicit subscription data, default to 'free'
      // Check both subscription.tier and subscriptionTier fields for compatibility
      const tier = userDoc?.subscription?.tier || 'free';
      console.log('✅ Got subscription tier from local Firebase:', tier);
      return tier;
    } catch (error) {
      console.error('Error getting subscription tier:', error);
      return 'free';
    }
  };



  const loadUserProfile = async () => {
    try {
      if (user) {
        // Load the full user profile from Firebase
        const userDoc = await FirebaseService.getUserProfile(user.uid);
        if (userDoc) {
          setUserProfile(userDoc);
          console.log('✅ User profile loaded from Firebase:', userDoc);
          
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
          console.log('✅ Epic account loaded from Firebase');
          
          // Load stats from Firebase
          const firebaseStats = await FirebaseService.getFortniteStats(user.uid);
          if (firebaseStats) {
            setFortniteStats(firebaseStats);
            console.log('✅ Fortnite stats loaded from Firebase');
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
        // Load stats if account is connected (check for either id or epicId)
        if (parsed.id || parsed.epicId) {
            // Use the new function to pull stats immediately
            pullStatsFromOsirion(parsed);
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
        await pullStatsFromOsirion(data.epicAccount);
        // Clear URL parameters
        window.history.replaceState({}, document.title, '/dashboard');
      }
    } catch (error) {
      console.error('Epic OAuth callback error:', error);
      alert('Failed to connect Epic account. Please try again.');
    }
  };

  const handlePaymentSuccess = async (sessionId: string) => {
    try {
      console.log('🔄 Processing payment success for session:', sessionId);
      
      // Test the webhook manually
      const response = await fetch('/api/test-webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Payment verification successful:', data);
        
        if (data.success) {
          // Reload subscription data
          await checkSubscription();
          
          // Show success message
          alert('Payment successful! Your Pro subscription is now active.');
        } else {
          console.error('❌ Payment verification failed:', data.error);
          alert('Payment verification failed. Please contact support.');
        }
      } else {
        console.error('❌ Payment verification request failed:', response.statusText);
        alert('Payment verification failed. Please contact support.');
      }
      
      // Clear URL parameters
      window.history.replaceState({}, document.title, '/dashboard');
    } catch (error) {
      console.error('❌ Error processing payment success:', error);
      alert('Error processing payment. Please contact support.');
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
        console.log('Subscription check result:', { 
          hasActiveSubscription: data.hasActiveSubscription, 
          subscriptionTier: data.subscriptionTier,
          canAccess 
        });
        

      } else {
        console.error('Subscription check failed:', response.status);
        // Default to allowing access for free users
        setHasActiveSubscription(true);
      }
    } catch (error) {
      console.error('Error checking subscription:', error);
      // Default to allowing access for free users
      setHasActiveSubscription(true);
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

  const pullStatsFromOsirion = async (account: any) => {
    if (!account || !user) return;
    
    try {
      console.log('🔄 Immediately pulling stats from Osirion API after OAuth success...');
      
      // Use epicId if available, otherwise fall back to id
      const epicId = account.epicId || account.id;
      console.log('🔍 Account object for stats pull:', account);
      console.log('🔍 Using Epic ID:', epicId);
      
      if (!epicId) {
        console.error('❌ No Epic ID found in account object for stats pull');
        return;
      }
      
      // First, save the Epic account to Firebase with expanded fields
      const epicAccountData: EpicAccount = {
        id: FirebaseService.generateId(),
        epicId: epicId,
        displayName: account.displayName,
        platform: account.platform || 'Epic',
        userId: user.uid,
        linkedAt: new Date(),
        isReal: account.isReal || false,
        // Additional Epic account fields - only include if they have values
        lastLogin: new Date(),
        status: 'active' as const,
        verificationStatus: 'verified' as const
      };

      // Only add optional fields if they have values
      if (account.accountId) {
        epicAccountData.accountId = account.accountId;
      }
      if (account.country) {
        epicAccountData.country = account.country;
      }
      if (account.preferredLanguage) {
        epicAccountData.preferredLanguage = account.preferredLanguage;
      }
      if (account.email) {
        epicAccountData.email = account.email;
      }

      // Only add note if it has a value
      if (account.note) {
        epicAccountData.note = account.note;
      }
      
      await FirebaseService.saveEpicAccount(epicAccountData);
      console.log('✅ Epic account saved to Firebase');
      

      
      // Now pull stats from Osirion API
      const response = await fetch('/api/osirion/stats', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          epicId: epicId,
          userId: user.uid,
          platform: 'pc'
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // Create comprehensive Fortnite stats structure
          const fortniteStatsData: FortniteStats = {
            id: FirebaseService.generateId(),
            userId: user.uid,
            epicId: account.id,
            epicName: account.displayName,
            platform: 'pc',
            lastUpdated: new Date(),
            
            // Overall stats from Osirion API
            overall: {
              kd: data.stats?.all?.kd || 0,
              winRate: data.stats?.all?.winRate || 0,
              matches: data.stats?.all?.matches || 0,
              avgPlace: data.stats?.all?.avgPlace || 0,
              top1: data.stats?.all?.top1 || 0,
              top3: data.stats?.all?.top3 || 0,
              top5: data.stats?.all?.top5 || 0,
              top10: data.stats?.all?.top10 || 0,
              top25: data.stats?.all?.top25 || 0,
              kills: data.stats?.all?.kills || 0,
              deaths: data.stats?.all?.deaths || 0,
              assists: data.stats?.all?.assists || 0,
              damageDealt: data.stats?.all?.damageDealt || 0,
              damageTaken: data.stats?.all?.damageTaken || 0,
              timeAlive: data.stats?.all?.timeAlive || 0,
              distanceTraveled: data.stats?.all?.distanceTraveled || 0,
              materialsGathered: data.stats?.all?.materialsGathered || 0,
              structuresBuilt: data.stats?.all?.structuresBuilt || 0
            },
            
            // Mode-specific stats (if available)
            solo: data.stats?.solo ? {
              kd: data.stats.solo.kd || 0,
              winRate: data.stats.solo.winRate || 0,
              matches: data.stats.solo.matches || 0,
              avgPlace: data.stats.solo.avgPlace || 0,
              top1: data.stats.solo.top1 || 0,
              top3: data.stats.solo.top3 || 0,
              top5: data.stats.solo.top5 || 0,
              top10: data.stats.solo.top10 || 0,
              top25: data.stats.solo.top25 || 0,
              kills: data.stats.solo.kills || 0,
              deaths: data.stats.solo.deaths || 0,
              assists: data.stats.solo.assists || 0,
              damageDealt: data.stats.solo.damageDealt || 0,
              damageTaken: data.stats.solo.damageTaken || 0,
              timeAlive: data.stats.solo.timeAlive || 0,
              distanceTraveled: data.stats.solo.distanceTraveled || 0,
              materialsGathered: data.stats.solo.materialsGathered || 0,
              structuresBuilt: data.stats.solo.structuresBuilt || 0
            } : undefined,
            
            duo: data.stats?.duo ? {
              kd: data.stats.duo.kd || 0,
              winRate: data.stats.duo.winRate || 0,
              matches: data.stats.duo.matches || 0,
              avgPlace: data.stats.duo.avgPlace || 0,
              top1: data.stats.duo.top1 || 0,
              top3: data.stats.duo.top3 || 0,
              top5: data.stats.duo.top5 || 0,
              top10: data.stats.duo.top10 || 0,
              top25: data.stats.duo.top25 || 0,
              kills: data.stats.duo.kills || 0,
              deaths: data.stats.duo.deaths || 0,
              assists: data.stats.duo.assists || 0,
              damageDealt: data.stats.duo.damageDealt || 0,
              damageTaken: data.stats.duo.damageTaken || 0,
              timeAlive: data.stats.duo.timeAlive || 0,
              distanceTraveled: data.stats.duo.distanceTraveled || 0,
              materialsGathered: data.stats.duo.materialsGathered || 0,
              structuresBuilt: data.stats.duo.structuresBuilt || 0
            } : undefined,
            
            squad: data.stats?.squad ? {
              kd: data.stats.squad.kd || 0,
              winRate: data.stats.squad.winRate || 0,
              matches: data.stats.squad.matches || 0,
              avgPlace: data.stats.squad.avgPlace || 0,
              top1: data.stats.squad.top1 || 0,
              top3: data.stats.squad.top3 || 0,
              top5: data.stats.squad.top5 || 0,
              top10: data.stats.squad.top10 || 0,
              top25: data.stats.squad.top25 || 0,
              kills: data.stats.squad.kills || 0,
              deaths: data.stats.squad.deaths || 0,
              assists: data.stats.squad.assists || 0,
              damageDealt: data.stats.squad.damageDealt || 0,
              damageTaken: data.stats.squad.damageTaken || 0,
              timeAlive: data.stats.squad.timeAlive || 0,
              distanceTraveled: data.stats.squad.distanceTraveled || 0,
              materialsGathered: data.stats.squad.materialsGathered || 0,
              structuresBuilt: data.stats.squad.structuresBuilt || 0
            } : undefined,
            
            // Usage tracking
            usage: {
              current: data.usage?.current || 0,
              limit: data.usage?.limit || 0,
              resetDate: data.usage?.resetDate ? new Date(data.usage.resetDate) : new Date(),
              lastApiCall: new Date(),
              totalApiCalls: 1
            },
            
            // Metadata
            metadata: {
              season: data.metadata?.season || 1,
              chapter: data.metadata?.chapter || 1,
              dataSource: 'osirion' as const,
              dataQuality: 'high' as const,
              notes: 'Data pulled from Osirion API after Epic OAuth'
            }
          };
          
                     await FirebaseService.saveFortniteStats(fortniteStatsData);
           console.log('✅ Comprehensive Fortnite stats saved to Firebase');
           

           
           // Update local state with the full data structure
           setFortniteStats(fortniteStatsData);
           console.log('✅ Comprehensive stats loaded from Osirion API and saved to Firebase:', fortniteStatsData);
        } else {
          console.log('⚠️ Osirion API response not successful:', data);
        }
      } else {
        console.error('❌ Failed to fetch stats from Osirion API:', response.status);
      }
    } catch (error) {
      console.error('❌ Error pulling stats from Osirion API:', error);
    }
  };

  const refreshStats = async () => {
    if (!epicAccount || !user) return;
    
    try {
      // Use epicId if available, otherwise fall back to id
      const epicId = epicAccount.epicId || epicAccount.id;
      console.log('🔄 Refreshing stats for Epic account:', epicId);
      console.log('🔍 Epic account object:', epicAccount);
      
      if (!epicId) {
        console.error('❌ No Epic ID found in account object');
        return;
      }
      
      const response = await fetch('/api/osirion/stats', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          epicId: epicId,
          userId: user.uid,
          platform: 'pc'
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('📊 Stats refresh response:', data);
        
        if (data.success && data.stats) {
          // Create the same comprehensive structure as in pullStatsFromOsirion
          const fortniteStatsData: FortniteStats = {
            id: FirebaseService.generateId(),
            userId: user.uid,
            epicId: epicId,
            epicName: epicAccount.displayName,
            platform: 'pc',
            lastUpdated: new Date(),
            
            // Overall stats from Osirion API
            overall: {
              kd: data.stats?.all?.kd || 0,
              winRate: data.stats?.all?.winRate || 0,
              matches: data.stats?.all?.matches || 0,
              avgPlace: data.stats?.all?.avgPlace || 0,
              top1: data.stats?.all?.top1 || 0,
              top3: data.stats?.all?.top3 || 0,
              top5: data.stats?.all?.top5 || 0,
              top10: data.stats?.all?.top10 || 0,
              top25: data.stats?.all?.top25 || 0,
              kills: data.stats?.all?.kills || 0,
              deaths: data.stats?.all?.deaths || 0,
              assists: data.stats?.all?.assists || 0,
              damageDealt: data.stats?.all?.damageDealt || 0,
              damageTaken: data.stats?.all?.damageTaken || 0,
              timeAlive: data.stats?.all?.timeAlive || 0,
              distanceTraveled: data.stats?.all?.distanceTraveled || 0,
              materialsGathered: data.stats?.all?.materialsGathered || 0,
              structuresBuilt: data.stats?.all?.structuresBuilt || 0
            },
            
            // Mode-specific stats (if available)
            solo: data.stats?.solo ? {
              kd: data.stats.solo.kd || 0,
              winRate: data.stats.solo.winRate || 0,
              matches: data.stats.solo.matches || 0,
              avgPlace: data.stats.solo.avgPlace || 0,
              top1: data.stats.solo.top1 || 0,
              top3: data.stats.solo.top3 || 0,
              top5: data.stats.solo.top5 || 0,
              top10: data.stats.solo.top10 || 0,
              top25: data.stats.solo.top25 || 0,
              kills: data.stats.solo.kills || 0,
              deaths: data.stats.solo.deaths || 0,
              assists: data.stats.solo.assists || 0,
              damageDealt: data.stats.solo.damageDealt || 0,
              damageTaken: data.stats.solo.damageTaken || 0,
              timeAlive: data.stats.solo.timeAlive || 0,
              distanceTraveled: data.stats.solo.distanceTraveled || 0,
              materialsGathered: data.stats.solo.materialsGathered || 0,
              structuresBuilt: data.stats.solo.structuresBuilt || 0
            } : undefined,
            
            duo: data.stats?.duo ? {
              kd: data.stats.duo.kd || 0,
              winRate: data.stats.duo.winRate || 0,
              matches: data.stats.duo.matches || 0,
              avgPlace: data.stats.duo.avgPlace || 0,
              top1: data.stats.duo.top1 || 0,
              top3: data.stats.duo.top3 || 0,
              top5: data.stats.duo.top5 || 0,
              top10: data.stats.duo.top10 || 0,
              top25: data.stats.duo.top25 || 0,
              kills: data.stats.duo.kills || 0,
              deaths: data.stats.duo.deaths || 0,
              assists: data.stats.duo.assists || 0,
              damageDealt: data.stats.duo.damageDealt || 0,
              damageTaken: data.stats.duo.damageTaken || 0,
              timeAlive: data.stats.duo.timeAlive || 0,
              distanceTraveled: data.stats.duo.distanceTraveled || 0,
              materialsGathered: data.stats.duo.materialsGathered || 0,
              structuresBuilt: data.stats.duo.structuresBuilt || 0
            } : undefined,
            
            squad: data.stats?.squad ? {
              kd: data.stats.squad.kd || 0,
              winRate: data.stats.squad.winRate || 0,
              matches: data.stats.squad.matches || 0,
              avgPlace: data.stats.squad.avgPlace || 0,
              top1: data.stats.squad.top1 || 0,
              top3: data.stats.squad.top3 || 0,
              top5: data.stats.squad.top5 || 0,
              top10: data.stats.squad.top10 || 0,
              top25: data.stats.squad.top25 || 0,
              kills: data.stats.squad.kills || 0,
              deaths: data.stats.squad.deaths || 0,
              assists: data.stats.squad.assists || 0,
              damageDealt: data.stats.squad.damageDealt || 0,
              damageTaken: data.stats.squad.damageTaken || 0,
              timeAlive: data.stats.squad.timeAlive || 0,
              distanceTraveled: data.stats.squad.distanceTraveled || 0,
              materialsGathered: data.stats.squad.materialsGathered || 0,
              structuresBuilt: data.stats.squad.structuresBuilt || 0
            } : undefined,
            
            // Usage tracking
            usage: {
              current: data.usage?.current || 0,
              limit: data.usage?.limit || 0,
              resetDate: data.usage?.resetDate ? new Date(data.usage.resetDate) : new Date(),
              lastApiCall: new Date(),
              totalApiCalls: 1
            },
            
            // Metadata
            metadata: {
              season: data.metadata?.season || 1,
              chapter: data.metadata?.chapter || 1,
              dataSource: 'osirion' as const,
              dataQuality: 'high' as const,
              notes: 'Data refreshed from Osirion API'
            }
          };
          
          // Save to Firebase
          await FirebaseService.saveFortniteStats(fortniteStatsData);
          console.log('✅ Refreshed stats saved to Firebase');
          
          // Update local state
          setFortniteStats(fortniteStatsData);
          console.log('✅ Stats state updated with refreshed data');
        } else {
          console.log('⚠️ Stats refresh response not successful:', data);
        }
      } else {
        console.error('❌ Failed to refresh stats from Osirion API:', response.status);
      }
    } catch (error) {
      console.error('❌ Error refreshing stats:', error);
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
    <EmailVerificationGuard>
      <div className="min-h-screen bg-gradient-dark mobile-container">
        <Navbar />
      

      
      {/* Main Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 sm:pt-24 pb-8 sm:pb-12">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-12">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6 leading-tight">
            <span className="text-primary-text">Welcome to</span>
            <br />
            <span className="text-gradient">PathGen AI</span>
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-secondary-text px-4">
            Your personal Fortnite improvement dashboard
          </p>
        </div>

        {/* Dashboard Content */}
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Credit Display Section */}
          <FullCreditDisplay />
          
          {/* Progress Tracker Section */}
          <GamifiedProgressTracker />
          
          {/* Combined Epic Account, AI Coaching, and Fortnite Stats Section */}
          <div className="glass-card p-6">
            <h3 className="text-xl font-semibold text-white mb-6">🎮 Epic Games Account & AI Coaching</h3>
            
            {/* Epic Account Status */}
            <div className="mb-6">
              {epicAccount ? (
                <div className="bg-white/10 border border-white/20 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-white font-semibold">Account Connected</h4>
                    <span className="px-3 py-1 bg-white text-gray-900 text-xs rounded-full">Connected</span>
                  </div>
                  <div className="text-sm text-white/80 space-y-1">
                    <p><span className="text-white/60">Username:</span> {epicAccount.displayName}</p>
                    <p><span className="text-white/60">Platform:</span> {epicAccount.platform || 'Epic'}</p>
                    <p><span className="text-white/60">Connected:</span> {new Date(epicAccount.linkedAt || '').toLocaleDateString()}</p>
                  </div>
                  <button
                    onClick={disconnectEpicAccount}
                    className="mt-3 px-4 py-2 bg-white text-gray-900 hover:bg-gray-100 rounded-lg text-sm transition-colors"
                  >
                    Disconnect Account
                  </button>
                </div>
              ) : (
                <div className="text-center space-y-4">
                  <p className="text-white/60">Connect your Epic Games account to access personalized Fortnite coaching and stats.</p>
                  <button
                    onClick={handleEpicSignIn}
                    className="px-6 py-3 bg-white text-gray-900 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
                  >
                    🎮 Sign In with Epic Games
                  </button>
                </div>
              )}
            </div>

            {/* AI Coaching Connection Status */}
            <div className="mb-6">
              <h4 className="text-lg font-semibold text-white mb-3">🤖 AI Coaching Connection</h4>
              {epicAccount ? (
                <div className="bg-white/10 border border-white/20 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h5 className="text-white font-semibold">AI Coaching Active</h5>
                    <span className="px-3 py-1 bg-white text-gray-900 text-xs rounded-full">Connected</span>
                  </div>
                  <div className="text-sm text-white/80 space-y-1">
                    <p><span className="text-white/60">Status:</span> AI coaching is now connected to your Epic account</p>
                    <p><span className="text-white/60">Personalization:</span> Coaching based on your actual gameplay data</p>
                    <p><span className="text-white/60">Features:</span> Personalized advice, stat analysis, improvement tracking</p>
                  </div>
                  <div className="mt-3 space-y-2">
                    <Link
                      href="/ai"
                      className="inline-block px-4 py-2 bg-white text-gray-900 hover:bg-gray-100 rounded-lg text-sm transition-colors"
                    >
                      🚀 Start AI Coaching Session
                    </Link>
                    <p className="text-xs text-white">Your AI coach now has access to your Epic account data for personalized advice</p>
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

            {/* Fortnite Performance Stats */}
            {epicAccount && (
              <div>
                <h4 className="text-lg font-semibold text-white mb-3">📊 Fortnite Performance Stats</h4>
                {fortniteStats ? (
                  <div className="space-y-6">
                    {/* Overall Stats */}
                    <div>
                      <h5 className="text-md font-semibold text-white mb-3">Overall Performance</h5>
                      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                        <div className="bg-white/10 border border-white/20 rounded-lg p-3 text-center">
                          <div className="text-xl font-bold text-white">{fortniteStats.overall?.kd?.toFixed(2) || 'N/A'}</div>
                          <div className="text-xs text-white">K/D Ratio</div>
                        </div>
                        <div className="bg-white/10 border border-white/20 rounded-lg p-3 text-center">
                          <div className="text-xl font-bold text-white">{fortniteStats.overall?.winRate?.toFixed(1) || 'N/A'}%</div>
                          <div className="text-xs text-white">Win Rate</div>
                        </div>
                        <div className="bg-white/10 border border-white/20 rounded-lg p-3 text-center">
                          <div className="text-xl font-bold text-white">{fortniteStats.overall?.matches || 'N/A'}</div>
                          <div className="text-xs text-white">Matches</div>
                        </div>
                        <div className="bg-white/10 border border-white/20 rounded-lg p-3 text-center">
                          <div className="text-xl font-bold text-white">{fortniteStats.overall?.avgPlace?.toFixed(1) || 'N/A'}</div>
                          <div className="text-xs text-white">Avg Placement</div>
                        </div>
                        <div className="bg-white/10 border border-white/20 rounded-lg p-3 text-center">
                          <div className="text-xl font-bold text-white">{fortniteStats.overall?.kills || 'N/A'}</div>
                          <div className="text-xs text-white">Total Kills</div>
                        </div>
                        <div className="bg-white/10 border border-white/20 rounded-lg p-3 text-center">
                          <div className="text-xl font-bold text-white">{fortniteStats.overall?.top1 || 'N/A'}</div>
                          <div className="text-xs text-white">Victories</div>
                        </div>
                      </div>
                    </div>

                    {/* Mode-specific Stats */}
                    {(fortniteStats.solo || fortniteStats.duo || fortniteStats.squad) && (
                      <div>
                        <h5 className="text-md font-semibold text-white mb-3">Mode Breakdown</h5>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {fortniteStats.solo && (
                            <div className="bg-white/10 border border-white/20 rounded-lg p-4">
                              <h6 className="text-sm font-semibold text-white mb-2">Solo</h6>
                              <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                  <span className="text-white/60">K/D:</span>
                                  <span className="text-white">{fortniteStats.solo.kd?.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-white/60">Win Rate:</span>
                                  <span className="text-white">{fortniteStats.solo.winRate?.toFixed(1)}%</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-white/60">Matches:</span>
                                  <span className="text-white">{fortniteStats.solo.matches}</span>
                                </div>
                              </div>
                            </div>
                          )}
                          
                          {fortniteStats.duo && (
                            <div className="bg-white/10 border border-white/20 rounded-lg p-4">
                              <h6 className="text-sm font-semibold text-white mb-2">Duo</h6>
                              <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                  <span className="text-white/60">K/D:</span>
                                  <span className="text-white">{fortniteStats.duo.kd?.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-white/60">Win Rate:</span>
                                  <span className="text-white">{fortniteStats.duo.winRate?.toFixed(1)}%</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-white/60">Matches:</span>
                                  <span className="text-white">{fortniteStats.duo.matches}</span>
                                </div>
                              </div>
                            </div>
                          )}
                          
                          {fortniteStats.squad && (
                            <div className="bg-white/10 border border-white/20 rounded-lg p-4">
                              <h6 className="text-sm font-semibold text-white mb-2">Squad</h6>
                              <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                  <span className="text-white/60">K/D:</span>
                                  <span className="text-white">{fortniteStats.squad.kd?.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-white/60">Win Rate:</span>
                                  <span className="text-white">{fortniteStats.squad.winRate?.toFixed(1)}%</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-white/60">Matches:</span>
                                  <span className="text-white">{fortniteStats.squad.matches}</span>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Additional Stats */}
                    <div>
                      <h5 className="text-md font-semibold text-white mb-3">Additional Metrics</h5>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div className="bg-white/10 border border-white/20 rounded-lg p-3 text-center">
                          <div className="text-lg font-bold text-white">{fortniteStats.overall?.damageDealt?.toLocaleString() || 'N/A'}</div>
                          <div className="text-xs text-white">Damage Dealt</div>
                        </div>
                        <div className="bg-white/10 border border-white/20 rounded-lg p-3 text-center">
                          <div className="text-lg font-bold text-white">{fortniteStats.overall?.structuresBuilt?.toLocaleString() || 'N/A'}</div>
                          <div className="text-xs text-white">Structures Built</div>
                        </div>
                        <div className="bg-white/10 border border-white/20 rounded-lg p-3 text-center">
                          <div className="text-lg font-bold text-white">{fortniteStats.overall?.materialsGathered?.toLocaleString() || 'N/A'}</div>
                          <div className="text-xs text-white">Materials</div>
                        </div>
                        <div className="bg-white/10 border border-white/20 rounded-lg p-3 text-center">
                          <div className="text-lg font-bold text-white">{fortniteStats.overall?.distanceTraveled?.toFixed(0) || 'N/A'}</div>
                          <div className="text-xs text-white">Distance (m)</div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-white/60 mb-4">Loading your comprehensive Fortnite stats...</p>
                    <button
                      onClick={refreshStats}
                      className="px-4 py-2 bg-white text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      Refresh Stats
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

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
                       <span key={index} className="px-3 py-1 bg-white/20 text-white rounded-full text-sm border border-white/30">
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
                     <div className="bg-white/10 border border-white/20 rounded-lg p-3 text-center">
                       <div className="text-xl font-bold text-white">{userProfile.ai.conversationsCreated || 0}</div>
                       <div className="text-xs text-white">Conversations</div>
                     </div>
                     <div className="bg-white/10 border border-white/20 rounded-lg p-3 text-center">
                       <div className="text-xl font-bold text-white">{userProfile.ai.messagesUsed || 0}</div>
                       <div className="text-xs text-white">Messages Used</div>
                     </div>
                     <div className="bg-white/10 border border-white/20 rounded-lg p-3 text-center">
                       <div className="text-xl font-bold text-white">{userProfile.statistics?.totalSessions || 0}</div>
                       <div className="text-xs text-white">Total Sessions</div>
                     </div>
                                            <div className="bg-white/10 border border-white/20 rounded-lg p-3 text-center">
                         <div className="text-xl font-bold text-white">{userProfile.statistics?.totalTime || 0}</div>
                         <div className="text-xs text-white">Total Time (min)</div>
                       </div>
                   </div>
                 </div>
               )}
             </div>
           )}



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
                          upload.status === 'completed' ? 'bg-white/20 text-white' :
                          upload.status === 'processing' ? 'bg-white/20 text-white' :
                          'bg-gray-500/20 text-gray-400'
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
             <h3 className="text-xl font-semibold text-white mb-4 text-left">Quick Actions</h3>
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
               <Link href="/ai" className="btn-secondary text-left">
                 New AI Chat
               </Link>
               <Link href="/map" className="btn-secondary text-left">
                 POI Analysis
               </Link>
               <Link href="/tournament-strategy" className="btn-secondary text-left">
                 Tournament Strategy
               </Link>
               <Link href="/settings" className="btn-secondary text-left">
                 Settings
               </Link>
               <button 
                 onClick={() => setShowOnboarding(true)} 
                 className="btn-secondary text-left"
               >
                 Update Preferences
               </button>
               <button onClick={() => router.push('/')} className="btn-secondary text-left">
                 Back to Home
               </button>
               <button onClick={logout} className="btn-secondary text-left">
                 Logout
               </button>
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
                  onClick={checkSubscription}
                  className="w-full bg-white text-dark-charcoal hover:bg-gray-100 py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>
                  </svg>
                  Refresh Subscription Status
                </button>
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
       </div>

       {/* Onboarding Modal */}
       <OnboardingModal
         isOpen={showOnboarding}
         onComplete={handleOnboardingComplete}
         userId={user?.uid || ''}
         userEmail={user?.email || ''}
         userDisplayName={user?.displayName || ''}
       />
     </div>
   </EmailVerificationGuard>
 );
 }
