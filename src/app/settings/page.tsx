'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import SmoothScroll from '@/components/SmoothScroll';
import { UsageTracker } from '@/lib/usage-tracker';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function SettingsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [displayName, setDisplayName] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [epicAccount, setEpicAccount] = useState<any>(null);
  const [usageData, setUsageData] = useState<any>(null);
  const [isLoadingUsage, setIsLoadingUsage] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || '');
      loadEpicAccount();
      loadUsageData();
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
        
        // Refresh usage data after profile is loaded to get correct limits
        if (profileData.subscriptionTier !== userProfile?.subscriptionTier) {
          loadUsageData();
        }
      }
    } catch (error) {
      console.error('Failed to load user profile:', error);
    }
  };

  const loadUsageData = async () => {
    if (!user) return;
    
    setIsLoadingUsage(true);
    try {
      // Get the current subscription tier from userProfile or default to free
      const currentTier = userProfile?.subscriptionTier || 'free';
      const usageSummary = await UsageTracker.getUsageSummary(user.uid, currentTier as 'free' | 'paid' | 'pro');
      
      // Set the usage data directly
      if (usageSummary) {
        setUsageData(usageSummary);
      }
    } catch (error) {
      console.error('Failed to load usage data:', error);
      // Set default usage data if there's a permission error
      if (error instanceof Error && error.message?.includes('permissions')) {
        const currentTier = userProfile?.subscriptionTier || 'free';
        setUsageData({
          usage: {
            subscriptionTier: currentTier,
            osirion: { matchesUsed: 0, eventTypesUsed: 0, replayUploadsUsed: 0, computeRequestsUsed: 0 },
            ai: { messagesUsed: 0, conversationsCreated: 0 },
            epic: { lastSync: null, syncCount: 0, statsPulled: 0 },
            totalSessions: 0
          },
          limits: UsageTracker.getLimitsForTier(currentTier as 'free' | 'paid' | 'pro')
        });
      }
    } finally {
      setIsLoadingUsage(false);
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
                    className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                  >
                    Edit Profile
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={handleSave}
                      disabled={isSaving}
                      className="px-4 py-2 bg-green-500 hover:bg-green-600 disabled:bg-green-400 text-white rounded-lg transition-colors"
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
                    ? 'bg-green-500/20 border border-green-500/30 text-green-400' 
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
                        ? 'border-blue-500/50 bg-white/10 text-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20' 
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
                  <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-green-400 font-semibold">Account Connected</h3>
                      <span className="px-3 py-1 bg-green-500 text-white text-xs rounded-full">Connected</span>
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
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                  >
                    Go to Dashboard
                  </button>
                </div>
              )}
            </div>

            {/* Usage Tracking */}
            <div className="glass-card p-6">
              <h2 className="text-xl font-semibold text-white mb-4">📊 Usage & Credits</h2>
              {isLoadingUsage ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto"></div>
                  <p className="text-white/60 mt-2">Loading usage data...</p>
                </div>
              ) : usageData ? (
                <div className="space-y-6">
                  {/* Subscription Info */}
                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                    <h3 className="text-blue-400 font-semibold mb-2">Current Plan: {(userProfile?.subscriptionTier || 'free').toUpperCase()}</h3>
                    <p className="text-white/80 text-sm">Track your monthly usage and remaining credits</p>
                  </div>

                  {/* User Subscription Details */}
                  <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="text-green-400 font-semibold">📋 Subscription Details</h3>
                      <button
                        onClick={loadUserProfile}
                        className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-xs rounded-lg transition-colors"
                      >
                        🔄 Refresh
                      </button>
                    </div>
                    {userProfile ? (
                      <>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="bg-white/5 rounded-lg p-3">
                            <p className="text-white/60 text-sm">Current Tier</p>
                            <p className="text-white font-semibold capitalize">
                              {userProfile.subscriptionTier || 'Free'}
                            </p>
                          </div>
                          <div className="bg-white/5 rounded-lg p-3">
                            <p className="text-white/60 text-sm">Status</p>
                            <p className="text-white font-semibold capitalize">
                              {userProfile.subscriptionStatus || 'Active'}
                            </p>
                          </div>
                          <div className="bg-white/5 rounded-lg p-3">
                            <p className="text-white/60 text-sm">Member Since</p>
                            <p className="text-white font-semibold">
                              {userProfile.createdAt ? new Date(userProfile.createdAt.toDate()).toLocaleDateString() : 'N/A'}
                            </p>
                          </div>
                          <div className="bg-white/5 rounded-lg p-3">
                            <p className="text-white/60 text-sm">Last Login</p>
                            <p className="text-white font-semibold">
                              {userProfile.lastLogin ? new Date(userProfile.lastLogin.toDate()).toLocaleDateString() : 'N/A'}
                            </p>
                          </div>
                        </div>
                        <div className="mt-3 p-3 bg-white/5 rounded-lg">
                          <p className="text-white/60 text-sm">Plan Duration</p>
                          <p className="text-white font-semibold">
                            {userProfile.subscriptionTier === 'free' ? 'Lifetime Access' : 
                             userProfile.subscriptionTier === 'pro' ? 'Pro Subscription' : 'Monthly Subscription'}
                          </p>
                          {userProfile.subscriptionTier === 'pro' && (
                            <p className="text-white/60 text-xs mt-1">
                              Pro tier with 30,000 credits/month - Unlimited for most users
                            </p>
                          )}
                          {userProfile.subscriptionTier !== 'free' && userProfile.subscriptionTier !== 'pro' && (
                            <p className="text-white/60 text-xs mt-1">
                              Next billing cycle: {userProfile.lastLogin ? new Date(new Date(userProfile.lastLogin.toDate()).getTime() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString() : 'N/A'}
                            </p>
                          )}
                        </div>
                      </>
                    ) : (
                      <div className="text-center py-4">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mx-auto mb-2"></div>
                        <p className="text-white/60 text-sm">Loading subscription details...</p>
                      </div>
                    )}
                  </div>

                  {/* Osirion Usage */}
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-3">🎯 Osirion API Usage</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-white/5 rounded-lg p-3">
                        <p className="text-white/60 text-sm">Matches Used</p>
                        <p className="text-white font-semibold">
                          {usageData.usage.osirion.matchesUsed} / {usageData.limits.osirion.matchesPerMonth === -1 ? '∞' : usageData.limits.osirion.matchesPerMonth}
                        </p>
                      </div>
                      <div className="bg-white/5 rounded-lg p-3">
                        <p className="text-white/60 text-sm">Replay Uploads</p>
                        <p className="text-white font-semibold">
                          {usageData.usage.osirion.replayUploadsUsed} / {usageData.limits.osirion.replayUploadsPerMonth === -1 ? '∞' : usageData.limits.osirion.replayUploadsPerMonth}
                        </p>
                      </div>
                      <div className="bg-white/5 rounded-lg p-3">
                        <p className="text-white/60 text-sm">Compute Requests</p>
                        <p className="text-white font-semibold">
                          {usageData.usage.osirion.computeRequestsUsed} / {usageData.limits.osirion.computeRequestsPerMonth === -1 ? '∞' : usageData.limits.osirion.computeRequestsPerMonth}
                        </p>
                      </div>
                      <div className="bg-white/5 rounded-lg p-3">
                        <p className="text-white/60 text-sm">Event Types</p>
                        <p className="text-white font-semibold">
                          {usageData.usage.osirion.eventTypesUsed} / {usageData.limits.osirion.eventTypesPerMatch === -1 ? '∞' : usageData.limits.osirion.eventTypesPerMatch}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* AI Usage */}
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-3">🤖 AI Coaching Usage</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-white/5 rounded-lg p-3">
                        <p className="text-white/60 text-sm">AI Messages</p>
                        <p className="text-white font-semibold">
                          {usageData.usage.ai.messagesUsed} / {usageData.limits.ai.messagesPerMonth === -1 ? '∞' : usageData.limits.ai.messagesPerMonth}
                        </p>
                      </div>
                      <div className="bg-white/5 rounded-lg p-3">
                        <p className="text-white/60 text-sm">Conversations</p>
                        <p className="text-white font-semibold">
                          {usageData.usage.ai.conversationsCreated} / {usageData.limits.ai.conversationsPerMonth === -1 ? '∞' : usageData.limits.ai.conversationsPerMonth}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Epic Account Usage */}
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-3">🎮 Epic Account Sync</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-white/5 rounded-lg p-3">
                        <p className="text-white/60 text-sm">Last Sync</p>
                        <p className="text-white font-semibold">
                          {epicAccount?.linkedAt ? new Date(epicAccount.linkedAt).toLocaleDateString() : 'Never'}
                        </p>
                      </div>
                      <div className="bg-white/5 rounded-lg p-3">
                        <p className="text-white/60 text-sm">Sync Count</p>
                        <p className="text-white font-semibold">{epicAccount ? '1' : '0'}</p>
                      </div>
                      <div className="bg-white/5 rounded-lg p-3">
                        <p className="text-white/60 text-sm">Stats Pulled</p>
                        <p className="text-white font-semibold">{epicAccount ? '1' : '0'}</p>
                      </div>
                      <div className="bg-white/5 rounded-lg p-3">
                        <p className="text-white/60 text-sm">Total Sessions</p>
                        <p className="text-white font-semibold">{epicAccount ? '1' : '0'}</p>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={loadUsageData}
                    className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                  >
                    🔄 Refresh Usage Data
                  </button>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-white/60">No usage data available</p>
                  <button
                    onClick={loadUsageData}
                    className="mt-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                  >
                    Load Usage Data
                  </button>
                </div>
              )}
            </div>

            {/* Account Status */}
            <div className="glass-card p-6">
              <h2 className="text-xl font-semibold text-white mb-4">Account Status</h2>
              <p className="text-secondary-text mb-4">
                Your account is currently active. For additional features and support,
                please visit the pricing page to upgrade your subscription.
              </p>
              <button
                onClick={() => router.push('/pricing')}
                className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-lg transition-all duration-300 transform hover:scale-105"
              >
                View Pricing Plans
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
