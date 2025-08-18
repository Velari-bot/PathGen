'use client';

import React, { useState, useEffect } from 'react';
import { EpicConnectButton } from './EpicConnectButton';
import { useAuth } from '@/contexts/AuthContext';

interface EpicAccount {
  id: string;
  displayName: string;
  platform?: string;
  linkedAt?: string;
}

export default function FortniteAccountSection() {
  const { user } = useAuth();
  const [epicAccount, setEpicAccount] = useState<EpicAccount | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'epic'>('epic');

  // Fetch user's linked Epic account on component mount
  useEffect(() => {
    if (user) {
      fetchEpicAccount();
    }
  }, [user]);

  const fetchEpicAccount = async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      // You'll need to create this API endpoint to fetch the user's linked Epic account
      const response = await fetch(`/api/user/get-epic-account?userId=${user.uid}`);
      if (response.ok) {
        const data = await response.json();
        setEpicAccount(data.epicAccount || null);
      }
    } catch (error) {
      console.error('Failed to fetch Epic account:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEpicAccountLinked = (account: EpicAccount) => {
    setEpicAccount(account);
  };

  const handleEpicAccountError = (error: string) => {
    console.error('Epic account error:', error);
    // You can show a toast notification here
  };

  const getStatusBadge = () => {
    if (isLoading) {
      return <span className="px-3 py-1 bg-gray-500 text-white text-xs rounded-full">Loading...</span>;
    }
    
    if (epicAccount) {
      return <span className="px-3 py-1 bg-green-500 text-white text-xs rounded-full">Connected</span>;
    }
    
    return <span className="px-3 py-1 bg-gray-500 text-white text-xs rounded-full">Not Connected</span>;
  };

  if (!user) {
    return (
      <div className="bg-white/5 border border-white/20 rounded-xl p-6">
        <h2 className="text-xl font-semibold text-white mb-4">Fortnite Account</h2>
        <p className="text-white/60">Please log in to connect your Fortnite account.</p>
      </div>
    );
  }

  return (
    <div className="bg-white/5 border border-white/20 rounded-xl p-6">
      <h2 className="text-xl font-semibold text-white mb-6">Fortnite Account</h2>
      
             {/* Epic Account Section */}

             <div className="space-y-4">
         {epicAccount ? (
           <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
             <div className="flex items-center justify-between mb-3">
               <h3 className="text-green-400 font-semibold">Account Connected</h3>
               {getStatusBadge()}
             </div>
             <div className="text-sm text-white/80 space-y-1">
               <p><span className="text-white/60">Username:</span> {epicAccount.displayName}</p>
               <p><span className="text-white/60">Platform:</span> {epicAccount.platform || 'Epic'}</p>
               <p><span className="text-white/60">Connected:</span> {new Date(epicAccount.linkedAt || '').toLocaleDateString()}</p>
             </div>
             <button
               onClick={() => setEpicAccount(null)}
               className="mt-3 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm transition-colors"
             >
               Disconnect Account
             </button>
           </div>
         ) : (
           <div className="text-center space-y-4">
             <p className="text-white/60">Connect your Epic Games account to access personalized Fortnite coaching.</p>
             <EpicConnectButton 
               onAccountLinked={handleEpicAccountLinked}
               onError={handleEpicAccountError}
             />
           </div>
         )}
       </div>

      {/* Status Display */}
      <div className="mt-6 pt-4 border-t border-white/10">
        <div className="flex items-center justify-between">
          <span className="text-white/60 text-sm">Status</span>
          {getStatusBadge()}
        </div>
      </div>
    </div>
  );
}
