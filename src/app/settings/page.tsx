'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import SmoothScroll from '@/components/SmoothScroll';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import PremiumOnly from '@/components/PremiumOnly';

export default function SettingsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [displayName, setDisplayName] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [epicAccount, setEpicAccount] = useState<any>(null);
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
        
        // Credits will be automatically updated via the useCreditsDisplay hook
      }
    } catch (error) {
      console.error('Failed to load user profile:', error);
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
    <PremiumOnly 
      pageName="Settings" 
      description="Manage your account preferences, Epic Games integration, notification settings, and personalize your PathGen AI experience."
      showNavbar={false}
      showFooter={false}
    >
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

            {/* Account Status */}
            <div className="glass-card p-6">
              <h2 className="text-xl font-semibold text-white mb-4">Account Status</h2>
              <p className="text-secondary-text mb-4">
                Your account is currently active with the {(userProfile?.subscriptionTier || 'free')} plan. 
                {(userProfile?.subscriptionTier || 'free') === 'free' ? ' Upgrade to Pro for unlimited credits and premium features.' : ' You have access to all premium features.'}
              </p>
              <button
                onClick={() => router.push('/pricing')}
                className="px-6 py-3 bg-white text-gray-900 rounded-lg transition-all duration-300 transform hover:scale-105 hover:bg-gray-100"
              >
                {(userProfile?.subscriptionTier || 'free') === 'free' ? 'Upgrade to Pro' : 'View Pricing Plans'}
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
    </PremiumOnly>
  );
}
