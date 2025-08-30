'use client';

import React, { useState } from 'react';
import Image from 'next/image';

const personas = [
  {
    id: 'casual',
    title: 'Casual Player',
    description: 'Play for fun and improvement',
    features: ['Basic building tips', 'Weapon recommendations', 'Survival strategies', 'Fun gameplay focus'],
    icon: '🎮',
    color: 'white',
    difficulty: 'Beginner',
    timeCommitment: '1-2 hours/week',
    bestFor: 'New players, casual gamers'
  },
  {
    id: 'creative',
    title: 'Creative Warrior',
    description: 'Master the art of building',
    features: ['Advanced building techniques', 'Edit training', 'Creative mode strategies', 'Building speed drills'],
    icon: '🏗️',
    color: 'white',
    difficulty: 'Intermediate',
    timeCommitment: '3-5 hours/week',
    bestFor: 'Building enthusiasts, creative players'
  },
  {
    id: 'competitive',
    title: 'Competitive Player',
    description: 'Dominate tournaments and cash cups',
    features: ['Pro-level strategies', 'Meta analysis', 'Tournament preparation', 'Advanced mechanics'],
    icon: '🏆',
    color: 'white',
    difficulty: 'Advanced',
    timeCommitment: '5+ hours/week',
    bestFor: 'Tournament players, pros'
  }
];

const additionalFeatures = [
  {
    title: 'Personalized Training Plans',
    description: 'AI-generated routines based on your skill level',
    icon: (
      <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
        <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/>
      </svg>
    )
  },
  {
    title: 'Progress Tracking',
    description: 'Monitor your improvement with detailed analytics',
    icon: (
      <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
        <path d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z"/>
      </svg>
    )
  },
  {
            title: 'Tournament Challenges',
    description: 'Compete with other players in weekly events',
    icon: (
      <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
      </svg>
    )
  },
  {
    title: 'Expert Mentorship',
    description: 'Get tips from top Fortnite professionals',
    icon: (
      <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
      </svg>
    )
  }
];

export default function PersonaSelector() {
  const [selectedPersona, setSelectedPersona] = useState('casual');
  const [showFeatures, setShowFeatures] = useState(false);

  return (
    <section className="section bg-gradient-dark relative overflow-hidden py-20">
      {/* Enhanced animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-1/4 w-32 h-32 bg-white/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-1/4 w-40 h-40 bg-white/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 w-24 h-24 bg-white/5 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-1/3 right-1/3 w-20 h-20 bg-white/3 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '0.5s' }}></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center mobile-container">
        {/* Logo Section at Top */}
        <div className="flex justify-center mb-8 sm:mb-12 lg:mb-16 animate-fade-in">
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* White curved corner cube with logo */}
            <div className="relative w-12 h-12 sm:w-16 sm:h-16 bg-white rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg">
              <div className="relative w-8 h-8 sm:w-12 sm:h-12">
                <Image
                  src="/Black PathGen logo.png"
                  alt="PathGen AI Logo"
                  fill
                  sizes="(max-width: 640px) 32px, 48px"
                  className="object-contain"
                />
              </div>
            </div>
            <span className="text-2xl sm:text-3xl font-bold text-primary-text">PathGen AI</span>
          </div>
        </div>

        {/* Enhanced Header with more spacing */}
        <div className="animate-fade-in mb-12 sm:mb-16 lg:mb-20">
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6 lg:mb-8 leading-tight">
            <span className="text-primary-text">Choose Your</span>
            <br />
            <span className="text-gradient">Playstyle</span>
          </h2>
          
          <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-secondary-text mb-8 sm:mb-10 lg:mb-12 max-w-3xl mx-auto leading-relaxed px-4">
            Select your Fortnite persona and get personalized coaching tailored to your goals and skill level.
          </p>
        </div>

        {/* Enhanced Persona Cards with more spacing */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 max-w-6xl mx-auto mb-12 sm:mb-16 lg:mb-20">
          {personas.map((persona, index) => (
            <div
              key={persona.id}
              className={`glass-card cursor-pointer transition-all duration-500 hover:scale-105 touch-friendly ${
                selectedPersona === persona.id 
                  ? 'ring-2 ring-white ring-opacity-50 scale-105 shadow-2xl' 
                  : 'hover:ring-2 hover:ring-white/30 hover:shadow-xl'
              } animate-slide-up`}
              style={{ animationDelay: `${index * 0.2}s` }}
              onClick={() => setSelectedPersona(persona.id)}
            >
              {/* Enhanced Icon */}
              <div className="text-4xl sm:text-5xl lg:text-6xl mb-4 sm:mb-6 animate-bounce" style={{ animationDelay: `${index * 0.1}s` }}>
                {persona.icon}
              </div>
              
              {/* Title */}
              <h3 className="text-xl sm:text-2xl font-bold text-primary-text mb-2 sm:mb-3">
                {persona.title}
              </h3>
              
              {/* Description */}
              <p className="text-secondary-text mb-3 sm:mb-4 leading-relaxed text-sm sm:text-base">
                {persona.description}
              </p>

              {/* Difficulty & Time */}
              <div className="flex flex-col sm:flex-row justify-between items-center mb-3 sm:mb-4 text-sm gap-2 sm:gap-0">
                <span className="bg-white/10 px-3 py-1 rounded-full text-white text-xs sm:text-sm">
                  {persona.difficulty}
                </span>
                <span className="text-secondary-text text-xs sm:text-sm">
                  {persona.timeCommitment}
                </span>
              </div>

              {/* Best For */}
              <p className="text-secondary-text text-xs sm:text-sm mb-4 sm:mb-6 italic text-center sm:text-left">
                Best for: {persona.bestFor}
              </p>
              
              {/* Features */}
              <ul className="space-y-2 sm:space-y-3 mb-4 sm:mb-6 text-left">
                {persona.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-white rounded-full flex-shrink-0 animate-pulse mt-1" style={{ animationDelay: `${featureIndex * 0.1}s` }}></div>
                    <span className="text-secondary-text text-xs sm:text-sm leading-relaxed">{feature}</span>
                  </li>
                ))}
              </ul>
              
              {/* Selection indicator */}
              <div className={`w-full h-2 rounded-full transition-all duration-500 ${
                selectedPersona === persona.id 
                  ? 'bg-gradient-to-r from-white to-gray-200' 
                  : 'bg-white/20'
              }`}></div>
            </div>
          ))}
        </div>

        {/* Enhanced CTA Section with more spacing */}
        <div className="animate-fade-in-up mb-12 sm:mb-16 lg:mb-20" style={{ animationDelay: '0.8s' }}>
          <div className="bg-white/5 rounded-xl sm:rounded-2xl p-6 sm:p-8 border border-white/10 mx-4">
            <h3 className="text-xl sm:text-2xl font-bold text-white mb-3 sm:mb-4">
              Ready to Start Your Journey?
            </h3>
            <p className="text-secondary-text mb-4 sm:mb-6 text-sm sm:text-base">
              Join thousands of players who have already improved their Fortnite skills with PathGen AI.
            </p>
            
            <div className="flex flex-col gap-3 sm:gap-4 justify-center items-center max-w-md mx-auto">
              <button className="btn-primary text-sm sm:text-base lg:text-lg px-6 sm:px-8 py-3 sm:py-4 group w-full touch-friendly">
                <span className="group-hover:scale-110 transition-transform duration-300 inline-block">
                  Start Coaching with {personas.find(p => p.id === selectedPersona)?.title}
                </span>
              </button>
              
              <button 
                className="btn-secondary text-sm sm:text-base lg:text-lg px-6 sm:px-8 py-3 sm:py-4 w-full touch-friendly"
                onClick={() => setShowFeatures(!showFeatures)}
              >
                {showFeatures ? 'Hide' : 'Show'} All Features
              </button>
            </div>
          </div>
        </div>

        {/* Additional Features Grid with more spacing */}
        {showFeatures && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 max-w-6xl mx-auto animate-fade-in-up mb-12 sm:mb-16 lg:mb-20">
            {additionalFeatures.map((feature, index) => (
              <div 
                key={index}
                className="glass-card text-center p-4 sm:p-6 hover:scale-105 transition-transform duration-300"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="text-3xl sm:text-4xl mb-3 sm:mb-4">{feature.icon}</div>
                <h4 className="text-base sm:text-lg font-semibold text-white mb-2">{feature.title}</h4>
                <p className="text-secondary-text text-xs sm:text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Enhanced bottom accent line with more spacing */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-white to-transparent opacity-60 animate-pulse"></div>
    </section>
  );
}
