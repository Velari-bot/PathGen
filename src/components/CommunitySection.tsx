'use client';

import React from 'react';
import { useRouter } from 'next/navigation';

export default function CommunitySection() {
  const router = useRouter();

  const handleJoinDiscord = () => {
    // Open Discord invite link
    window.open('https://discord.gg/pathgen', '_blank');
  };

  const handleJoinCommunity = () => {
    if (window.confirm('Join the PathGen Players Discord community?')) {
      handleJoinDiscord();
    }
  };

  return (
    <section className="section bg-gradient-dark relative overflow-hidden">
      <div className="relative z-10 text-center px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto mobile-container">
        <div className="glass-card p-8 text-center">
          <div className="text-6xl mb-6">🎮</div>
          <h2 className="text-3xl font-bold text-white mb-6">
            Join PathGen Players
          </h2>
          
          <p className="text-xl text-secondary-text mb-8 max-w-3xl mx-auto">
            Connect with other Fortnite players, share strategies, and get exclusive tips from the PathGen community.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div className="text-center">
              <div className="text-4xl mb-4">💬</div>
              <h3 className="text-xl font-semibold text-white mb-2">Strategy Sharing</h3>
              <p className="text-secondary-text text-sm">
                Share your wins and get advice from other players
              </p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-4">🏆</div>
              <h3 className="text-xl font-semibold text-white mb-2">Tournament Updates</h3>
              <p className="text-secondary-text text-sm">
                Get notified about upcoming tournaments and events
              </p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-4">🚀</div>
              <h3 className="text-xl font-semibold text-white mb-2">Pro Tips</h3>
              <p className="text-secondary-text text-sm">
                Exclusive tips and tricks from PathGen AI
              </p>
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-6 mb-8">
            <h3 className="text-2xl font-bold text-white mb-4">
              Community Stats
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-400 mb-2">500+</div>
                <div className="text-secondary-text text-sm">Active Players</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-400 mb-2">24/7</div>
                <div className="text-secondary-text text-sm">Support</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-400 mb-2">1000+</div>
                <div className="text-secondary-text text-sm">Strategies Shared</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-yellow-400 mb-2">50+</div>
                <div className="text-secondary-text text-sm">Tournaments</div>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button 
              onClick={handleJoinCommunity}
              className="btn-primary text-lg px-8 py-4 font-semibold"
            >
              Join Discord Community
            </button>
            <button 
              onClick={() => router.push('/pricing')}
              className="btn-secondary text-lg px-8 py-4 font-semibold"
            >
              Get Pro Access
            </button>
          </div>

          <p className="text-secondary-text text-sm mt-4">
            Free to join. Pro members get exclusive channels and early access to features.
          </p>
        </div>
      </div>
    </section>
  );
}
