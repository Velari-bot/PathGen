'use client';

import React, { useState, useEffect } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function HeroSection() {
  const router = useRouter();
  const { user } = useAuth();
  const [currentTitleIndex, setCurrentTitleIndex] = useState(0);
  const [displayText, setDisplayText] = useState('');
  const [isTyping, setIsTyping] = useState(true);

  const titles = [
    "Your AI Fortnite Coach",
    "The AI Coach That Makes You Better", 
    "Unlock Pro-Level Gameplay"
  ];

  useEffect(() => {
    let currentIndex = 0;
    let charIndex = 0;
    let isDeleting = false;

    const typeText = () => {
      const currentTitle = titles[currentIndex];
      
      if (isDeleting) {
        setDisplayText(currentTitle.substring(0, charIndex - 1));
        charIndex--;
      } else {
        setDisplayText(currentTitle.substring(0, charIndex + 1));
        charIndex++;
      }

      let typeSpeed = 100;

      if (isDeleting) {
        typeSpeed = 50;
      } else {
        typeSpeed = 150;
      }

      if (!isDeleting && charIndex === currentTitle.length) {
        typeSpeed = 2000; // Pause at end
        isDeleting = true;
      } else if (isDeleting && charIndex === 0) {
        isDeleting = false;
        currentIndex = (currentIndex + 1) % titles.length;
        typeSpeed = 500; // Pause before next word
      }

      setTimeout(typeText, typeSpeed);
    };

    typeText();
  }, []);

  const handleTryForFree = () => {
    if (user) {
      router.push('/dashboard');
    } else {
      router.push('/login');
    }
  };

  const handleGoPro = async () => {
    if (!user) {
      router.push('/login');
      return;
    }

    try {
      // Get stored tracking code if available
      const trackingCode = localStorage.getItem('pathgen_tracking_code');
      
      // Create Stripe checkout session directly
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'user-email': user.email || 'customer@example.com',
          'tracking-code': trackingCode || '',
        },
        body: JSON.stringify({
          priceId: 'price_1RvsvqCitWuvPenEw9TefOig', // Pro tier price ID
          userId: user.uid,
          tier: 'pro',
          promoCode: null
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create checkout session');
      }

      const { url } = await response.json();
      
      if (url) {
        window.location.href = url;
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (error: any) {
      console.error('Error creating checkout session:', error);
      alert(`Payment Error: ${error.message || 'Failed to create checkout session. Please try again.'}`);
    }
  };

  useGSAP(() => {
    // Hero entrance animation
    const tl = gsap.timeline({ delay: 0.5 });
    
    tl.from('.hero-logo', {
      y: -30,
      opacity: 0,
      duration: 1,
      ease: 'power3.out'
    })
    .from('.hero-title', {
      y: 50,
      opacity: 0,
      duration: 1,
      ease: 'power3.out'
    }, '-=0.5')
    .from('.hero-subtitle', {
      y: 30,
      opacity: 0,
      duration: 0.8,
      ease: 'power2.out'
    }, '-=0.5')
    .from('.hero-buttons', {
      y: 30,
      opacity: 0,
      duration: 0.8,
      ease: 'power2.out'
    }, '-=0.3')
    .from('.hero-particles', {
      scale: 0,
      opacity: 0,
      duration: 1,
      ease: 'back.out(1.7)',
      stagger: 0.1
    }, '-=0.5');

    // Floating animation for particles
    gsap.to('.hero-particles', {
      y: -20,
      duration: 3,
      ease: 'power1.inOut',
      stagger: 0.2,
      repeat: -1,
      yoyo: true
    });

    // Glow effect on title
    gsap.to('.hero-title', {
      textShadow: '0 0 30px rgba(255, 255, 255, 0.5)',
      duration: 2,
      ease: 'power2.inOut',
      repeat: -1,
      yoyo: true
    });
  }, []);

  return (
    <section className="section bg-gradient-dark relative overflow-hidden">
      {/* Animated background particles */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="hero-particles absolute top-20 left-20 w-2 h-2 bg-white rounded-full opacity-60"></div>
        <div className="hero-particles absolute top-40 right-32 w-3 h-3 bg-white rounded-full opacity-40"></div>
        <div className="hero-particles absolute bottom-32 left-1/4 w-1 h-1 bg-white rounded-full opacity-80"></div>
        <div className="hero-particles absolute top-1/2 right-20 w-2 h-2 bg-white rounded-full opacity-50"></div>
        <div className="hero-particles absolute bottom-20 right-1/3 w-1.5 h-1.5 bg-white rounded-full opacity-70"></div>
      </div>

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary-bg/50 via-transparent to-white/5"></div>

      <div className="relative z-10 text-center px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto mobile-container">
        {/* Logo Section at Top */}
        <div className="flex justify-center mb-8 sm:mb-12 lg:mb-16 hero-logo">
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* White curved corner cube with logo */}
            <div className="relative w-16 h-16 sm:w-20 sm:h-20 bg-white rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg">
              <div className="relative w-12 h-12 sm:w-16 sm:h-16">
                <Image
                  src="/Black PathGen logo.png"
                  alt="PathGen AI Logo"
                  fill
                  sizes="(max-width: 640px) 48px, 64px"
                  priority
                  className="object-contain"
                />
              </div>
            </div>
            <span className="text-2xl sm:text-3xl lg:text-4xl font-bold text-primary-text">PathGen AI</span>
          </div>
        </div>

        {/* Main Title with Typing Animation */}
        <h1 className="hero-title text-3xl xs:text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold mb-4 sm:mb-6 leading-tight">
          <span className="text-primary-text">
            {displayText}
            <span className="animate-pulse">|</span>
          </span>
        </h1>

        {/* Subtitle */}
        <p className="hero-subtitle text-base sm:text-lg md:text-xl lg:text-2xl xl:text-3xl text-secondary-text mb-8 sm:mb-10 lg:mb-12 max-w-4xl mx-auto leading-relaxed px-4">
          Unlock pro-level gameplay insights with PathGen AI.
        </p>

        {/* CTA Buttons */}
        <div className="hero-buttons flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center max-w-md sm:max-w-none mx-auto">
          <button 
            onClick={handleTryForFree}
            className="btn-primary text-sm sm:text-base lg:text-lg px-6 sm:px-8 py-3 sm:py-4 group w-full sm:w-auto touch-friendly"
          >
            <span className="group-hover:scale-110 transition-transform duration-300 inline-block">
              Start Free – Upgrade Anytime
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-white to-gray-200 rounded-xl opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
          </button>
          
          <button 
            onClick={handleGoPro}
            className="btn-secondary text-sm sm:text-base lg:text-lg px-6 sm:px-8 py-3 sm:py-4 group w-full sm:w-auto touch-friendly relative overflow-hidden"
            style={{
              animation: 'pulse-glow 2s ease-in-out infinite',
              boxShadow: '0 0 20px rgba(255, 255, 255, 0.3), 0 0 40px rgba(255, 255, 255, 0.2), 0 0 60px rgba(255, 255, 255, 0.1)'
            }}
          >
            <span className="group-hover:scale-110 transition-transform duration-300 inline-block relative z-10">
              Go Pro – Only $6.99/month
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-white/20 via-white/10 to-white/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </button>
        </div>

        {/* Stats */}
        <div className="mt-12 sm:mt-14 lg:mt-16 grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8 max-w-4xl mx-auto px-4">
          <div className="text-center mobile-spacing">
            <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-1 sm:mb-2">24/7</div>
            <div className="text-secondary-text text-sm sm:text-base">AI Coach Availability</div>
          </div>
          <div className="text-center mobile-spacing">
            <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-1 sm:mb-2">$6.99</div>
            <div className="text-secondary-text text-sm sm:text-base">vs $100+ for coaching</div>
          </div>
          <div className="text-center mobile-spacing">
            <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-1 sm:mb-2">Instant</div>
            <div className="text-secondary-text text-sm sm:text-base">Analysis & Feedback</div>
          </div>
        </div>

        {/* Scarcity & FOMO Section */}
        <div className="mt-8 sm:mt-10 lg:mt-12 max-w-4xl mx-auto px-4 mb-16">
          <div className="glass-card p-6 text-center">
            <div className="text-2xl mb-4">⏰</div>
            <h3 className="text-lg sm:text-xl font-bold text-white mb-2">
              Early users lock in $6.99/month forever
            </h3>
            <p className="text-secondary-text text-sm sm:text-base mb-4">
              Price going up soon. Don't fall behind other players improving with PathGen.
            </p>
            <div className="text-3xl font-bold text-yellow-400 mb-2">200+ Fortnite matches analyzed</div>
            <p className="text-secondary-text text-sm">Join the players already dominating their friends</p>
          </div>
        </div>
      </div>

      {/* Bottom accent line */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-white to-transparent opacity-60"></div>
    </section>
  );
}
