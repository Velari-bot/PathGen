'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import SmoothScroll from '@/components/SmoothScroll';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { creditTracker } from '@/lib/credit-tracker';
import { CreditSystem } from '@/lib/credit-system';

export default function SettingsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [displayName, setDisplayName] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [epicAccount, setEpicAccount] = useState<any>(null);
  const [userCredits, setUserCredits] = useState<any>(null);
  const [isLoadingCredits, setIsLoadingCredits] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [showCreditCosts, setShowCreditCosts] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || '');
      loadEpicAccount();
      loadUserCredits();
      loadUserProfile();
    }
  }, [user]);

  const loadEpicAccount = () => {
    const epicAccountData = localStorage.getItem('epicAccountData');
    if (epicAccountData) {
      try {
        const parsed = JSON.parse(epicAccountData);
        setEpicAccount(parsed);
      } catch (error) {
        console.error('Failed to parse Epic account data:', error);
      }
    }
  };

  const loadUserProfile = async () => {
    if (!user || !db) return;
    
    try {
      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        const profileData = userDoc.data();
        setUserProfile(profileData);
        
        // Set the display name from the profile data
        if (profileData.displayName) {
          setDisplayName(profileData.displayName);
        }
        
        // Convert standard users to pro users
        if (profileData.subscriptionTier === 'standard' && db) {
          await updateDoc(userDocRef, {
            subscriptionTier: 'pro'
          });
          profileData.subscriptionTier = 'pro';
        }
        
        // Refresh credits after profile is loaded
        if (profileData.subscriptionTier !== userProfile?.subscriptionTier) {
          loadUserCredits();
        }
      }
    } catch (error) {
      console.error('Failed to load user profile:', error);
    }
  };

  const loadUserCredits = async () => {
    if (!user) return;
    
    setIsLoadingCredits(true);
    try {
      // Get the current subscription tier from userProfile or default to free
      const currentTier = userProfile?.subscriptionTier || 'free';
      
      // Convert standard to pro if needed
      if (currentTier === 'standard' && db) {
        const userDocRef = doc(db, 'users', user.uid);
        await updateDoc(userDocRef, {
          subscriptionTier: 'pro'
        });
        // Update local state
        setUserProfile((prev: any) => prev ? { ...prev, subscriptionTier: 'pro' } : null);
      }
      
      // Get user credits from credit tracker
      let credits = creditTracker.getUserCredits(user.uid);
      
      // If no credits found, initialize them
      if (!credits) {
        credits = await creditTracker.initializeUserCredits(user.uid, currentTier === 'standard' ? 'pro' : currentTier);
      }
      
      // Ensure the plan matches the userProfile subscription tier and set correct credits
      if (credits && userProfile?.subscriptionTier) {
        credits.plan = userProfile.subscriptionTier;
        
        // Ensure Pro users have 4000 credits
        if (userProfile.subscriptionTier === 'pro' || userProfile.subscriptionTier === 'standard') {
          credits.totalCredits = 4000;
          credits.availableCredits = 4000;
          credits.plan = 'pro';
        }
      }
      
      setUserCredits(credits);
    } catch (error) {
      console.error('Failed to load user credits:', error);
      // Set default credits if there's an error
      const currentTier = userProfile?.subscriptionTier || 'free';
      const defaultCredits = currentTier === 'free' ? 250 : 4000;
      
      const mockCredits = {
        userId: user.uid,
        totalCredits: defaultCredits,
        usedCredits: 0,
        availableCredits: defaultCredits,
        lastReset: new Date(),
        plan: currentTier === 'standard' ? 'pro' : currentTier,
        expiresAt: currentTier === 'free' ? undefined : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      };
      
      // Ensure Pro users get 4000 credits
      if (currentTier === 'pro' || currentTier === 'standard') {
        mockCredits.totalCredits = 4000;
        mockCredits.availableCredits = 4000;
        mockCredits.plan = 'pro';
      }
      
      setUserCredits(mockCredits);
    } finally {
      setIsLoadingCredits(false);
    }
  };

  const disconnectEpicAccount = () => {
    if (confirm('Are you sure you want to disconnect your Epic Games account? This will remove all linked data.')) {
      setEpicAccount(null);
      localStorage.removeItem('epicAccountData');
      setMessage('Epic account disconnected successfully!');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const handleSave = async () => {
    if (!user || !db) return;
    
    setIsSaving(true);
    setMessage('');
    
    try {
      // Update the user's display name in Firebase
      const userDocRef = doc(db, 'users', user.uid);
      await updateDoc(userDocRef, {
        displayName: displayName,
        updatedAt: new Date()
      });
      
      // Also update the local user state
      if (userProfile) {
        setUserProfile({
          ...userProfile,
          displayName: displayName
        });
      }
      
      setMessage('Profile updated successfully!');
      setIsEditing(false);
      
      // Clear success message after 3 seconds
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error updating profile:', error);
      setMessage('Failed to update profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setDisplayName(user?.displayName || '');
    setIsEditing(false);
    setMessage('');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-dark flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <SmoothScroll>
      <div className="min-h-screen bg-gradient-dark">
        <Navbar />
        
        {/* Main Content */}
        <div className="relative z-10 max-w-4xl mx-auto px-6 sm:px-8 lg:px-12 py-20">
          {/* Animated Background */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-20 left-20 w-32 h-32 bg-white/5 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-20 right-20 w-40 h-40 bg-white/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
            <div className="absolute top-1/2 left-1/2 w-24 h-24 bg-white/5 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '2s' }}></div>
            
            {/* Moving Lines */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white to-transparent animate-pulse"></div>
              <div className="absolute top-1/4 left-0 w-full h-px bg-gradient-to-r from-transparent via-white to-transparent animate-pulse" style={{ animationDelay: '1s' }}></div>
              <div className="absolute top-1/2 left-0 w-full h-px bg-gradient-to-r from-transparent via-white to-transparent animate-pulse" style={{ animationDelay: '2s' }}></div>
              <div className="absolute top-3/4 left-0 w-full h-px bg-gradient-to-r from-transparent via-white to-transparent animate-pulse" style={{ animationDelay: '3s' }}></div>
            </div>
          </div>

          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              <span className="text-primary-text">Settings</span>
            </h1>
            <p className="text-xl text-secondary-text">
              Manage your profile and account settings
            </p>
          </div>

          {/* Settings Content */}
          <div className="max-w-4xl mx-auto space-y-8">
            {/* Profile Information */}
            <div className="glass-card p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-white">Profile Information</h2>
                {!isEditing ? (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-4 py-2 bg-white text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    Edit Profile
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={handleSave}
                      disabled={isSaving}
                      className="px-4 py-2 bg-white text-gray-900 hover:bg-gray-100 disabled:bg-gray-400 disabled:text-gray-500 rounded-lg transition-colors"
                    >
                      {isSaving ? 'Saving...' : 'Save'}
                    </button>
                    <button
                      onClick={handleCancel}
                      className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
              
              {message && (
                <div className={`mb-4 p-3 rounded-lg ${
                  message.includes('successfully') 
                    ? 'bg-white/20 border border-white/30 text-white' 
                    : 'bg-red-500/20 border border-red-500/30 text-red-400'
                }`}>
                  {message}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-white mb-2">
                    Email Address
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={user.email || ''}
                    disabled
                    className="w-full px-4 py-3 border border-white/20 rounded-xl bg-white/5 text-white cursor-not-allowed opacity-70"
                    placeholder="Email cannot be changed"
                  />
                  <p className="text-xs text-gray-400 mt-1">Email address cannot be modified for security reasons</p>
                </div>
                <div>
                  <label htmlFor="displayName" className="block text-sm font-medium text-white mb-2">
                    Display Name
                  </label>
                  <input
                    id="displayName"
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    disabled={!isEditing}
                    className={`w-full px-4 py-3 border rounded-xl transition-colors ${
                      isEditing 
                        ? 'border-white/50 bg-white/10 text-white focus:border-white focus:outline-none focus:ring-2 focus:ring-white/20' 
                        : 'border-white/20 bg-white/5 text-white cursor-not-allowed opacity-70'
                    }`}
                    placeholder="Enter your display name"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    {isEditing ? 'This name will be displayed to other users' : 'Click Edit Profile to change your display name'}
                  </p>
                </div>
              </div>
            </div>

            {/* Epic Account Management */}
            <div className="glass-card p-6">
              <h2 className="text-xl font-semibold text-white mb-4">🎮 Epic Games Account</h2>
              {epicAccount ? (
                <div className="space-y-4">
                  <div className="bg-white/10 border border-white/20 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-white font-semibold">Account Connected</h3>
                      <span className="px-3 py-1 bg-white text-gray-900 text-xs rounded-full">Connected</span>
                    </div>
                    <div className="text-sm text-white/80 space-y-1">
                      <p><span className="text-white/60">Username:</span> {epicAccount.displayName}</p>
                      <p><span className="text-white/60">Platform:</span> {epicAccount.platform || 'Epic'}</p>
                      <p><span className="text-white/60">Connected:</span> {new Date(epicAccount.linkedAt || '').toLocaleDateString()}</p>
                    </div>
                    <button
                      onClick={disconnectEpicAccount}
                      className="mt-3 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm transition-colors"
                    >
                      Disconnect Account
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center space-y-4">
                  <p className="text-white/60">No Epic Games account connected.</p>
                  <p className="text-white/40 text-sm">Connect your Epic account in the dashboard to access personalized Fortnite coaching.</p>
                  <button
                    onClick={() => router.push('/dashboard')}
                    className="px-4 py-2 bg-white text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    Go to Dashboard
                  </button>
                </div>
              )}
            </div>

            {/* Credit System */}
            <div className="glass-card p-6">
              <h2 className="text-xl font-semibold text-white mb-4">💎 Credit System</h2>
              {isLoadingCredits ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto"></div>
                  <p className="text-white/60 mt-2">Loading credit data...</p>
                </div>
              ) : userCredits ? (
                <div className="space-y-6">
                  {/* Credit Overview */}
                  <div className="bg-white/10 border border-white/20 rounded-lg p-4">
                    <h3 className="text-white font-semibold mb-2">Current Plan: {(userProfile?.subscriptionTier || userCredits?.plan || 'free').toUpperCase()}</h3>
                    <p className="text-white/80 text-sm">Track your credit balance and usage</p>
                  </div>

                  {/* Credit Balance */}
                  <div className="bg-white/10 border border-white/20 rounded-lg p-4">
                    <div className="mb-3">
                      <h3 className="text-white font-semibold">💎 Credit Balance</h3>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-white">
                          {CreditSystem.formatCredits(userCredits.availableCredits)}
                        </div>
                        <div className="text-gray-300 text-sm">Available</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-white">
                          {CreditSystem.formatCredits(userCredits.usedCredits)}
                        </div>
                        <div className="text-gray-300 text-sm">Used</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-white">
                          {CreditSystem.formatCredits(userCredits.totalCredits)}
                        </div>
                        <div className="text-gray-300 text-sm">Total</div>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-4">
                      <div className="flex justify-between text-sm text-gray-300 mb-2">
                        <span>Credit Usage</span>
                        <span>{((userCredits.usedCredits / userCredits.totalCredits) * 100).toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div 
                          className="h-2 rounded-full transition-all duration-300 bg-white"
                          style={{ width: `${Math.min((userCredits.usedCredits / userCredits.totalCredits) * 100, 100)}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Plan Info */}
                    <div className="bg-gray-700 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-white font-medium">Current Plan: {(userProfile?.subscriptionTier || userCredits.plan).toUpperCase()}</div>
                          <div className="text-gray-300 text-sm">
                            {(userProfile?.subscriptionTier || userCredits.plan) === 'free' ? 'One-time allocation' : 'Monthly allocation'}
                          </div>
                        </div>
                        {userCredits.expiresAt && (
                          <div className="text-right">
                            <div className="text-gray-300 text-sm">Resets</div>
                            <div className="text-white font-medium">
                              {userCredits.expiresAt.toLocaleDateString()}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Quick Credit Costs */}
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="text-lg font-semibold text-white">Quick Actions (Credit Costs)</h3>
                      <button
                        onClick={() => setShowCreditCosts(!showCreditCosts)}
                        className="px-3 py-1 bg-white/10 border border-white/20 text-white text-xs rounded-lg transition-colors hover:bg-white/20"
                      >
                        {showCreditCosts ? 'Hide Costs' : 'Show Costs'}
                      </button>
                    </div>
                    {showCreditCosts && (
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-300">AI Chat</span>
                          <span className="text-white">1 credit</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-300">Stats Lookup</span>
                          <span className="text-white">2 credits</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-300">Replay Upload</span>
                          <span className="text-white">20 credits</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-300">Osirion Pull (Premium)</span>
                          <span className="text-white">50 credits</span>
                        </div>
                      </div>
                    )}
                  </div>


                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-white/60">No credit data available</p>
                  <button
                    onClick={loadUserCredits}
                    className="mt-2 px-4 py-2 bg-white text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    Load Credit Data
                  </button>
                </div>
              )}
            </div>

            {/* Account Status */}
            <div className="glass-card p-6">
              <h2 className="text-xl font-semibold text-white mb-4">Account Status</h2>
              <p className="text-secondary-text mb-4">
                Your account is currently active with the {(userProfile?.subscriptionTier || userCredits?.plan || 'free')} plan. 
                {(userProfile?.subscriptionTier || userCredits?.plan) === 'free' ? ' Upgrade to Pro for unlimited credits and premium features.' : ' You have access to all premium features.'}
              </p>
              <button
                onClick={() => router.push('/pricing')}
                className="px-6 py-3 bg-white text-gray-900 rounded-lg transition-all duration-300 transform hover:scale-105 hover:bg-gray-100"
              >
                {(userProfile?.subscriptionTier || userCredits?.plan) === 'free' ? 'Upgrade to Pro' : 'View Pricing Plans'}
              </button>
            </div>

            {/* Navigation */}
            <div className="text-center">
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={() => router.push('/dashboard')}
                  className="px-6 py-3 border-2 border-white/20 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-all duration-300 hover:border-white/40 transform hover:scale-105"
                >
                  ← Back to Dashboard
                </button>
                <button
                  onClick={() => router.push('/')}
                  className="px-6 py-3 bg-white hover:bg-gray-100 text-gray-900 rounded-lg transition-all duration-300 transform hover:scale-105"
                >
                  Back to Home
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </SmoothScroll>
  );
}
