'use client';

import React from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function AIShowcaseSection() {
  const router = useRouter();
  const { user } = useAuth();

  const handleUpgrade = () => {
    if (user) {
      router.push('/pricing');
    } else {
      router.push('/login');
    }
  };

  useGSAP(() => {
    // Stagger animation for feature cards
    gsap.from('.feature-card', {
      y: 50,
      opacity: 0,
      duration: 0.8,
      stagger: 0.2,
      ease: 'power2.out',
      scrollTrigger: {
        trigger: '.feature-card',
        start: 'top 80%',
        end: 'bottom 20%',
        toggleActions: 'play none none reverse'
      }
    });

    // Floating animation for icons
    gsap.to('.feature-icon', {
      y: -10,
      duration: 2,
      ease: 'power1.inOut',
      stagger: 0.3,
      repeat: -1,
      yoyo: true
    });
  }, []);

  const features = [
    {
      icon: '🤖',
      title: 'AI-Powered Coaching',
      free: '250 messages/month',
      pro: '4,000 messages/month',
      description: 'Get personalized strategies and real-time coaching from advanced AI',
      proBenefit: '16x more coaching sessions'
    },
    {
      icon: '📊',
      title: 'Advanced Analytics',
      free: 'Basic stats only',
      pro: 'Deep performance insights',
      description: 'Track your progress with detailed performance metrics and trends',
      proBenefit: 'Unlimited deep insights'
    },
    {
      icon: '🎬',
      title: 'Replay Analysis',
      free: '12 uploads/month',
      pro: '200 uploads/month',
      description: 'Upload your replays for AI-powered analysis and improvement tips',
      proBenefit: '17x more replay analysis'
    },
    {
      icon: '🏆',
      title: 'Tournament Tools',
      free: '25 strategies/month',
      pro: '400 strategies/month',
      description: 'Get competitive strategies and meta analysis for tournaments',
      proBenefit: '16x more strategies'
    },
    {
      icon: '⚡',
      title: 'Real-time Coaching',
      free: '❌ Not available',
      pro: '✅ Available',
      description: 'Get instant feedback and coaching during your matches',
      proBenefit: 'Pro-exclusive feature'
    },
    {
      icon: '🚫',
      title: 'Ad-Free Experience',
      free: '❌ Ad-supported',
      pro: '✅ Completely ad-free',
      description: 'Focus on your game without any distractions or interruptions',
      proBenefit: 'Clean, distraction-free experience'
    }
  ];

  return (
    <section className="section bg-gradient-dark relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-10 w-32 h-32 bg-white/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-10 w-40 h-40 bg-white/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mobile-container">
        {/* Pain Point Section */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
            <span className="text-primary-text">Why Most Fortnite</span>
            <br />
            <span className="text-gradient">Players Stay Stuck</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto mb-8">
            <div className="glass-card p-6 text-left">
              <div className="text-2xl mb-3">😤</div>
              <p className="text-white font-medium">You grind for hours but never see real improvement.</p>
            </div>
            <div className="glass-card p-6 text-left">
              <div className="text-2xl mb-3">🔄</div>
              <p className="text-white font-medium">You make the same mistakes every game without realizing it.</p>
            </div>
            <div className="glass-card p-6 text-left">
              <div className="text-2xl mb-3">🤔</div>
              <p className="text-white font-medium">You don't know why other players are ahead of you.</p>
            </div>
            <div className="glass-card p-6 text-left">
              <div className="text-2xl mb-3">💰</div>
              <p className="text-white font-medium">Real coaching is too expensive, slow, and inconsistent.</p>
            </div>
          </div>
          <p className="text-xl text-white font-semibold">
            👉 PathGen AI ends that cycle. Instantly.
          </p>
        </div>

        {/* Solution Section */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
            <span className="text-primary-text">Your Fortnite Coach,</span>
            <br />
            <span className="text-gradient">Powered by AI</span>
          </h2>
          <p className="text-xl text-secondary-text max-w-3xl mx-auto mb-8">
            PathGen AI combines ChatGPT's intelligence, Osirion's performance stats, and your uploaded data to create a personalized path to improvement.
            <br /><br />
            <span className="text-white font-semibold">No fluff. No guesswork. Just clear, actionable steps.</span>
          </p>
          
          {/* How it works */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto mb-12">
            <div className="text-center">
              <div className="text-4xl mb-4">📊</div>
              <h3 className="text-xl font-bold text-white mb-2">1. Upload your stats</h3>
              <p className="text-secondary-text">Connect your Epic account or upload replay data</p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-4">🤖</div>
              <h3 className="text-xl font-bold text-white mb-2">2. AI Analyzes everything</h3>
              <p className="text-secondary-text">Precision analysis of your gameplay patterns</p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-4">🎯</div>
              <h3 className="text-xl font-bold text-white mb-2">3. Get Coaching</h3>
              <p className="text-secondary-text">Drills, strategies, and fixes unique to your gameplay</p>
            </div>
          </div>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {features.map((feature, index) => (
            <div key={index} className="feature-card glass-card p-6 relative group hover:scale-105 transition-transform duration-300">
              {/* Icon */}
              <div className="feature-icon text-4xl mb-4 text-center">{feature.icon}</div>
              
              {/* Title */}
              <h3 className="text-xl font-bold text-white mb-3 text-center">{feature.title}</h3>
              
              {/* Description */}
              <p className="text-secondary-text text-sm mb-4 text-center">{feature.description}</p>
              
              {/* Free vs Pro Comparison */}
              <div className="space-y-3 mb-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-secondary-text">Free:</span>
                  <span className="text-sm text-red-400 font-medium">{feature.free}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-secondary-text">Pro:</span>
                  <span className="text-sm text-green-400 font-medium">{feature.pro}</span>
                </div>
              </div>
              
              {/* Pro Benefit */}
              <div className="bg-gradient-to-r from-green-500/20 to-blue-500/20 rounded-lg p-3 border border-green-500/30">
                <p className="text-sm text-green-400 font-medium text-center">
                  {feature.proBenefit}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Value Proposition */}
        <div className="glass-card p-8 text-center mb-16">
          <h3 className="text-2xl font-bold text-white mb-6">
            Why Players Upgrade to Pro
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="text-4xl mb-4">🚀</div>
              <h4 className="text-lg font-semibold text-white mb-2">16x More Value</h4>
              <p className="text-secondary-text text-sm">
                Get 16x more AI messages, replay uploads, and tournament strategies
              </p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-4">🎯</div>
              <h4 className="text-lg font-semibold text-white mb-2">Pro-Only Features</h4>
              <p className="text-secondary-text text-sm">
                Access advanced analytics, real-time coaching, and exclusive content
              </p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-4">⚡</div>
              <h4 className="text-lg font-semibold text-white mb-2">Ad-Free Experience</h4>
              <p className="text-secondary-text text-sm">
                Focus on your game without any distractions or interruptions
              </p>
            </div>
          </div>
        </div>

        {/* Social Proof Section */}
        <div className="glass-card p-8 text-center mb-16">
          <h2 className="text-3xl font-bold text-primary-text mb-8">
            What Fortnite Players Are Saying
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="text-4xl mb-4">💬</div>
              <p className="text-white font-medium mb-2">"PathGen told me exactly why I lose mid-game. I fixed it in 2 weeks."</p>
              <p className="text-secondary-text text-sm">- Competitive Player</p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-4">⏰</div>
              <p className="text-white font-medium mb-2">"It's like having a Fortnite coach 24/7, but way cheaper."</p>
              <p className="text-secondary-text text-sm">- Pro Player</p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-4">🏆</div>
              <p className="text-white font-medium mb-2">"I stopped wasting hours grinding and finally started winning."</p>
              <p className="text-secondary-text text-sm">- Tournament Winner</p>
            </div>
          </div>
        </div>

        {/* Urgency Section */}
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-primary-text mb-6">
            Every Game Without PathGen Is a Game You Don't Improve
          </h2>
          <div className="glass-card p-8 text-center">
            <p className="text-xl text-white mb-4">
              You're repeating the same mistakes right now.
            </p>
            <p className="text-xl text-white mb-4">
              Your opponents are getting smarter, faster, and more consistent.
            </p>
            <p className="text-xl text-white mb-6">
              Without AI coaching, you'll keep falling behind.
            </p>
            <p className="text-2xl text-white font-bold mb-8">
              👉 Don't just play Fortnite. Get better at it.
            </p>
            <button 
              onClick={handleUpgrade}
              className="btn-primary text-lg px-8 py-4 font-semibold"
            >
              Start Free →
            </button>
          </div>
        </div>

        {/* Final CTA Section */}
        <div className="text-center">
          <h3 className="text-4xl font-bold text-white mb-4">
            🔥 PathGen AI = Fortnite Improvement.
          </h3>
          <p className="text-xl text-secondary-text mb-8">
            It's not optional anymore. It's the fastest way to get better.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button 
              onClick={handleUpgrade}
              className="btn-primary text-lg px-8 py-4 font-semibold group"
            >
              <span className="group-hover:scale-110 transition-transform duration-300 inline-block">
                Start Free
              </span>
            </button>
            <button 
              onClick={() => router.push('/pricing')}
              className="btn-secondary text-lg px-8 py-4 font-semibold"
            >
              Go Pro – $6.99
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
