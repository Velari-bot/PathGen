'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';

export default function SettingsPage() {
  const { user, loading, updateUserProfile } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'settings' | 'billing'>('settings');
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateMessage, setUpdateMessage] = useState('');
  
  // Form states
  const [displayName, setDisplayName] = useState('');
  const [epicId, setEpicId] = useState('');
  const [discordId, setDiscordId] = useState('');
  const [selectedPersona, setSelectedPersona] = useState('casual');

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || '');
      setEpicId(user.epicId || '');
      setDiscordId(user.discordId || '');
      setSelectedPersona(user.persona);
    }
  }, [user]);

  const handleProfileUpdate = async () => {
    if (!user) return;
    
    setIsUpdating(true);
    setUpdateMessage('');
    
    try {
      await updateUserProfile({
        displayName,
        epicId,
        discordId,
        persona: selectedPersona as 'casual' | 'creative' | 'competitive'
      });
      setUpdateMessage('Profile updated successfully!');
    } catch (error) {
      setUpdateMessage('Failed to update profile. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-purple mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="pt-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-dark mb-2">Settings</h1>
            <p className="text-gray-600">
              Manage your profile, connections, and subscription
            </p>
          </div>

          {/* Tab Navigation */}
          <div className="flex space-x-1 bg-white p-1 rounded-xl border border-gray-200 mb-8">
            <button
              onClick={() => setActiveTab('settings')}
              className={`flex-1 py-3 px-6 rounded-lg font-medium transition-colors ${
                activeTab === 'settings'
                  ? 'bg-primary-purple text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Profile & Connections
            </button>
            <button
              onClick={() => setActiveTab('billing')}
              className={`flex-1 py-3 px-6 rounded-lg font-medium transition-colors ${
                activeTab === 'billing'
                  ? 'bg-primary-purple text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Billing & Subscription
            </button>
          </div>

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <div className="space-y-8">
              {/* Profile Settings */}
              <div className="card">
                <h2 className="text-xl font-semibold text-dark mb-6">Profile Information</h2>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 mb-2">
                      Display Name
                    </label>
                    <input
                      id="displayName"
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-purple focus:border-transparent transition-colors"
                      placeholder="Enter your display name"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                      Email
                    </label>
                    <input
                      id="email"
                      type="email"
                      value={user.email}
                      disabled
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-50 text-gray-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                  </div>
                </div>

                <div className="mt-6">
                  <label htmlFor="persona" className="block text-sm font-medium text-gray-700 mb-2">
                    Playstyle
                  </label>
                  <select
                    id="persona"
                    value={selectedPersona}
                    onChange={(e) => setSelectedPersona(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-purple focus:border-transparent transition-colors"
                  >
                    <option value="casual">Casual - Play for fun and relaxation</option>
                    <option value="creative">Creative Warrior - Master building and creative combat</option>
                    <option value="competitive">Competitive - Dominate tournaments and ranked play</option>
                  </select>
                </div>
              </div>

              {/* Game Connections */}
              <div className="card">
                <h2 className="text-xl font-semibold text-dark mb-6">Game Connections</h2>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="epicId" className="block text-sm font-medium text-gray-700 mb-2">
                      Epic Games ID
                    </label>
                    <input
                      id="epicId"
                      type="text"
                      value={epicId}
                      onChange={(e) => setEpicId(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-purple focus:border-transparent transition-colors"
                      placeholder="Enter your Epic Games ID"
                    />
                    <p className="text-xs text-gray-500 mt-1">Connect your Epic account to sync stats</p>
                  </div>
                  
                  <div>
                    <label htmlFor="discordId" className="block text-sm font-medium text-gray-700 mb-2">
                      Discord ID
                    </label>
                    <input
                      id="discordId"
                      type="text"
                      value={discordId}
                      onChange={(e) => setDiscordId(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-purple focus:border-transparent transition-colors"
                      placeholder="Enter your Discord ID"
                    />
                    <p className="text-xs text-gray-500 mt-1">Join our Discord community</p>
                  </div>
                </div>
              </div>

              {/* Update Button */}
              <div className="flex justify-end">
                <button
                  onClick={handleProfileUpdate}
                  disabled={isUpdating}
                  className="btn-primary px-8 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUpdating ? 'Updating...' : 'Update Profile'}
                </button>
              </div>

              {updateMessage && (
                <div className={`text-center p-4 rounded-lg ${
                  updateMessage.includes('successfully') 
                    ? 'bg-green-50 text-green-700 border border-green-200' 
                    : 'bg-red-50 text-red-700 border border-red-200'
                }`}>
                  {updateMessage}
                </div>
              )}
            </div>
          )}

          {/* Billing Tab */}
          {activeTab === 'billing' && (
            <div className="space-y-8">
              {/* Current Plan */}
              <div className="card">
                <h2 className="text-xl font-semibold text-dark mb-6">Current Plan</h2>
                <div className="bg-gradient-to-r from-primary-purple to-primary-blue rounded-xl p-6 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-2xl font-bold mb-2">
                        {user.subscription?.plan === 'pro' ? 'Pro Plan' : 
                         user.subscription?.plan === 'premium' ? 'Premium Plan' : 'Free Plan'}
                      </h3>
                      <p className="text-white/80">
                        {user.subscription?.plan === 'free' 
                          ? 'Basic features and limited AI coaching'
                          : user.subscription?.plan === 'pro'
                          ? 'Advanced coaching and priority support'
                          : 'Unlimited coaching and exclusive features'
                        }
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold">
                        {user.subscription?.plan === 'free' ? '$0' :
                         user.subscription?.plan === 'pro' ? '$19' : '$39'}
                      </div>
                      <div className="text-white/80">
                        {user.subscription?.plan === 'free' ? 'Forever' : 'per month'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Plan Comparison */}
              <div className="card">
                <h2 className="text-xl font-semibold text-dark mb-6">Available Plans</h2>
                <div className="grid md:grid-cols-3 gap-6">
                  {/* Free Plan */}
                  <div className="border-2 border-gray-200 rounded-xl p-6 text-center">
                    <h3 className="text-xl font-semibold text-dark mb-2">Free</h3>
                    <div className="text-3xl font-bold text-dark mb-4">$0<span className="text-lg text-gray-500">/month</span></div>
                    <ul className="text-sm text-gray-600 space-y-2 mb-6">
                      <li>• Basic AI coaching</li>
                      <li>• Limited daily questions</li>
                      <li>• Basic stats tracking</li>
                      <li>• Community access</li>
                    </ul>
                    <button className="w-full py-2 px-4 border-2 border-gray-300 text-gray-700 rounded-lg hover:border-gray-400 transition-colors">
                      Current Plan
                    </button>
                  </div>

                  {/* Pro Plan */}
                  <div className="border-2 border-primary-purple rounded-xl p-6 text-center relative">
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-primary-purple text-white px-4 py-1 rounded-full text-sm font-medium">
                      Popular
                    </div>
                    <h3 className="text-xl font-semibold text-dark mb-2">Pro</h3>
                    <div className="text-3xl font-bold text-dark mb-4">$19<span className="text-lg text-gray-500">/month</span></div>
                    <ul className="text-sm text-gray-600 space-y-2 mb-6">
                      <li>• Unlimited AI coaching</li>
                      <li>• Advanced stats analysis</li>
                      <li>• Personalized training plans</li>
                      <li>• Priority support</li>
                      <li>• Discord community</li>
                    </ul>
                    <button className="w-full py-2 px-4 bg-primary-purple text-white rounded-lg hover:bg-primary-blue transition-colors">
                      Upgrade to Pro
                    </button>
                  </div>

                  {/* Premium Plan */}
                  <div className="border-2 border-gray-200 rounded-xl p-6 text-center">
                    <h3 className="text-xl font-semibold text-dark mb-2">Premium</h3>
                    <div className="text-3xl font-bold text-dark mb-4">$39<span className="text-lg text-gray-500">/month</span></div>
                    <ul className="text-sm text-gray-600 space-y-2 mb-6">
                      <li>• Everything in Pro</li>
                      <li>• 1-on-1 coaching sessions</li>
                      <li>• Custom training maps</li>
                      <li>• Tournament analysis</li>
                      <li>• Exclusive Discord channels</li>
                    </ul>
                    <button className="w-full py-2 px-4 border-2 border-gray-300 text-gray-700 rounded-lg hover:border-gray-400 transition-colors">
                      Upgrade to Premium
                    </button>
                  </div>
                </div>
              </div>

              {/* Billing Actions */}
              <div className="card">
                <h2 className="text-xl font-semibold text-dark mb-6">Billing Actions</h2>
                <div className="space-y-4">
                  <button className="w-full py-3 px-6 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors">
                    Manage Payment Methods
                  </button>
                  <button className="w-full py-3 px-6 bg-gray-600 text-white rounded-xl hover:bg-gray-700 transition-colors">
                    View Billing History
                  </button>
                  {user.subscription?.plan !== 'free' && (
                    <button className="w-full py-3 px-6 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors">
                      Cancel Subscription
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
