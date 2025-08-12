'use client';

import React from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import Image from 'next/image';

export default function HeroSection() {
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

      <div className="relative z-10 text-center px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
        {/* Logo Section at Top */}
        <div className="flex justify-center mb-16 hero-logo">
          <div className="flex items-center space-x-3">
            {/* White curved corner cube with logo */}
            <div className="relative w-20 h-20 bg-white rounded-2xl flex items-center justify-center shadow-lg">
              <div className="relative w-16 h-16">
                <Image
                  src="/Black PathGen logo.png"
                  alt="PathGen AI Logo"
                  fill
                  className="object-contain"
                />
              </div>
            </div>
            <span className="text-4xl font-bold text-primary-text">PathGen AI</span>
          </div>
        </div>

        {/* Main Title */}
        <h1 className="hero-title text-5xl md:text-7xl lg:text-8xl font-bold mb-6 leading-tight">
          <span className="text-primary-text">Level Up Your</span>
          <br />
          <span className="text-gradient bg-gradient-to-r from-white via-gray-200 to-white bg-clip-text text-transparent">
            Fortnite Game
          </span>
        </h1>

        {/* Subtitle */}
        <p className="hero-subtitle text-xl md:text-2xl lg:text-3xl text-secondary-text mb-12 max-w-4xl mx-auto leading-relaxed">
          Master the battle royale with AI-powered coaching, personalized strategies, and real-time performance tracking. 
          <span className="text-white font-semibold"> Dominate every match.</span>
        </p>

        {/* CTA Buttons */}
        <div className="hero-buttons flex flex-col sm:flex-row gap-4 justify-center items-center">
          <button className="btn-primary text-lg px-8 py-4 group">
            <span className="group-hover:scale-110 transition-transform duration-300 inline-block">
              Start Free Trial
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-white to-gray-200 rounded-xl opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
          </button>
          
          <button className="btn-secondary text-lg px-8 py-4 group">
            <span className="group-hover:scale-110 transition-transform duration-300 inline-block">
              Watch Demo
            </span>
          </button>
        </div>

        {/* Stats */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <div className="text-center">
            <div className="text-3xl md:text-4xl font-bold text-white mb-2">10K+</div>
            <div className="text-secondary-text">Active Players</div>
          </div>
          <div className="text-center">
            <div className="text-3xl md:text-4xl font-bold text-white mb-2">95%</div>
            <div className="text-secondary-text">Success Rate</div>
          </div>
          <div className="text-center">
            <div className="text-3xl md:text-4xl font-bold text-white mb-2">24/7</div>
            <div className="text-secondary-text">AI Support</div>
          </div>
        </div>
      </div>

      {/* Bottom accent line */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-white to-transparent opacity-60"></div>
    </section>
  );
}
