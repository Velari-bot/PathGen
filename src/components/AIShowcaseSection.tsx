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
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
            <span className="text-primary-text">Free vs Pro</span>
            <br />
            <span className="text-gradient">What You Get</span>
          </h2>
          <p className="text-xl text-secondary-text max-w-3xl mx-auto">
            Start free and upgrade when you're ready to dominate. See the difference that makes champions.
          </p>
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

        {/* CTA Section */}
        <div className="text-center">
          <h3 className="text-2xl font-bold text-white mb-4">
            Ready to Dominate?
          </h3>
          <p className="text-secondary-text mb-8 max-w-2xl mx-auto">
            Join thousands of players who've already improved their win rate by 47% with PathGen Pro.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button 
              onClick={handleUpgrade}
              className="btn-primary text-lg px-8 py-4 font-semibold group"
            >
              <span className="group-hover:scale-110 transition-transform duration-300 inline-block">
                Upgrade to Pro - $6.99/month
              </span>
            </button>
            <button 
              onClick={() => router.push('/pricing')}
              className="btn-secondary text-lg px-8 py-4 font-semibold"
            >
              View Full Comparison
            </button>
          </div>
          <p className="text-xs text-secondary-text mt-4">
            Cancel anytime • 5-day money-back guarantee
          </p>
        </div>
      </div>
    </section>
  );
}
