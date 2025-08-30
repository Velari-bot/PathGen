'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';

const qaData = [
  {
    question: "How do I generate the best route for my game?",
    answer: "Just input your start and end points, and PathGen will create the fastest path for you."
  },
  {
    question: "Can PathGen optimize routes for different game modes?",
    answer: "Yes, you can select your game mode and PathGen will tailor the route accordingly."
  },
  {
    question: "How long does it take to get a route?",
    answer: "Routes are generated within seconds using our optimized AI models."
  },
  {
    question: "Can I customize the path preferences?",
    answer: "Yes, you can adjust settings like avoiding danger zones or prioritizing speed."
  },
  {
    question: "Does PathGen learn from my gameplay?",
    answer: "Yes, PathGen adapts over time to better suit your style and preferences."
  }
];

export default function AIShowcaseSection() {
  const [currentQAIndex, setCurrentQAIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [displayedAnswer, setDisplayedAnswer] = useState('');

  useEffect(() => {
    const interval = setInterval(() => {
      // Reset state
      setShowAnswer(false);
      setDisplayedAnswer('');
      
      // Show answer after delay
      setTimeout(() => {
        setShowAnswer(true);
        
        // Type out the answer
        const currentAnswer = qaData[currentQAIndex].answer;
        let currentText = '';
        let charIndex = 0;
        
        const typeInterval = setInterval(() => {
          if (charIndex < currentAnswer.length) {
            currentText += currentAnswer[charIndex];
            setDisplayedAnswer(currentText);
            charIndex++;
          } else {
            clearInterval(typeInterval);
          }
        }, 50);
        
      }, 1000);
      
      // Move to next Q&A
      setTimeout(() => {
        setCurrentQAIndex((prev) => (prev + 1) % qaData.length);
      }, 5000);
    }, 6000);

    return () => clearInterval(interval);
  }, [currentQAIndex]);

  return (
    <section className="section bg-gradient-dark relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 right-20 w-32 h-32 bg-white/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 left-20 w-40 h-40 bg-white/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 w-24 h-24 bg-white/5 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mobile-container">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          
          {/* Left side - Description */}
          <div className="text-center lg:text-left animate-fade-in order-2 lg:order-1">
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6 leading-tight">
              <span className="text-primary-text">AI-Powered</span>
              <br />
              <span className="text-gradient">Coaching</span>
            </h2>
            
            <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-secondary-text mb-6 sm:mb-8 leading-relaxed px-2 lg:px-0">
              Get personalized advice from an AI that understands Fortnite like a pro. 
              Real-time analysis, strategy tips, and performance insights tailored to your playstyle.
            </p>
            
            <div className="space-y-3 sm:space-y-4 max-w-md mx-auto lg:mx-0">
              <div className="flex items-center justify-center lg:justify-start space-x-3 text-secondary-text text-sm sm:text-base">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse flex-shrink-0"></div>
                <span>Instant match analysis</span>
              </div>
              <div className="flex items-center justify-center lg:justify-start space-x-3 text-secondary-text text-sm sm:text-base">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse flex-shrink-0" style={{ animationDelay: '0.5s' }}></div>
                <span>Personalized strategies</span>
              </div>
              <div className="flex items-center justify-center lg:justify-start space-x-3 text-secondary-text text-sm sm:text-base">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse flex-shrink-0" style={{ animationDelay: '1s' }}></div>
                <span>24/7 availability</span>
              </div>
            </div>
          </div>

          {/* Right side - Chat Panel */}
          <div className="animate-slide-up order-1 lg:order-2">
            <div className="glass-card w-full max-w-2xl mx-auto lg:mx-0 h-[400px] sm:h-[500px] lg:h-[600px] flex flex-col relative overflow-hidden">
              
              {/* Chat Header */}
              <div className="flex items-center space-x-3 sm:space-x-4 mb-4 sm:mb-6 pb-3 sm:pb-4 border-b border-white/10 relative z-10">
                <div className="relative w-10 h-10 sm:w-12 sm:h-12 bg-white rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg">
                  <div className="relative w-6 h-6 sm:w-8 sm:h-8">
                    <Image
                      src="/Black PathGen logo.png"
                      alt="PathGen AI Logo"
                      fill
                      sizes="(max-width: 640px) 24px, 32px"
                      className="object-contain"
                    />
                  </div>
                </div>
                <div>
                  <div className="text-primary-text font-semibold text-base sm:text-lg">PathGen Coach</div>
                  <div className="text-secondary-text text-xs sm:text-sm flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="hidden xs:inline">Online • Analyzing your game</span>
                    <span className="xs:hidden">Online</span>
                  </div>
                </div>
              </div>
              
              {/* Chat Messages Area */}
              <div className="flex-1 overflow-y-auto space-y-3 sm:space-y-4 mb-3 sm:mb-4 relative z-10 px-1">
                <div className="space-y-3 sm:space-y-4">
                  {/* Question */}
                  <div className="bg-dark-gray/50 rounded-lg p-3 sm:p-4 border border-white/20 shadow-lg animate-slide-in-left">
                    <div className="text-secondary-text text-xs sm:text-sm mb-2 flex items-center space-x-2">
                      <div className="w-2 h-2 bg-white rounded-full flex-shrink-0"></div>
                      <span>Question</span>
                    </div>
                    <div className="text-primary-text font-medium leading-relaxed text-sm sm:text-base">
                      {qaData[currentQAIndex].question}
                    </div>
                  </div>
                  
                  {/* Answer */}
                  {showAnswer && (
                    <div className="bg-white/10 rounded-lg p-3 sm:p-4 border border-white/30 shadow-lg backdrop-blur-sm animate-slide-in-right">
                      <div className="text-secondary-text text-xs sm:text-sm mb-2 flex items-center space-x-2">
                        <div className="w-2 h-2 bg-white rounded-full animate-pulse flex-shrink-0"></div>
                        <span>PathGen AI</span>
                      </div>
                      <div className="text-primary-text leading-relaxed text-sm sm:text-base">
                        <div className="relative">
                          {displayedAnswer}
                          {displayedAnswer.length < qaData[currentQAIndex].answer.length && (
                            <span className="inline-block w-2 h-4 bg-white ml-1 animate-pulse"></span>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Chat Footer */}
              <div className="pt-3 sm:pt-4 border-t border-white/10 relative z-10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-secondary-text text-xs sm:text-sm">
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse flex-shrink-0"></div>
                    <span className="hidden sm:inline">AI is analyzing your gameplay...</span>
                    <span className="sm:hidden">Analyzing...</span>
                  </div>
                  <div className="text-secondary-text text-xs bg-white/10 px-2 sm:px-3 py-1 rounded-full">
                    {currentQAIndex + 1} of {qaData.length}
                  </div>
                </div>
                
                {/* Progress bar */}
                <div className="mt-2 sm:mt-3 w-full bg-white/10 rounded-full h-1">
                  <div 
                    className="bg-gradient-to-r from-white to-gray-200 h-1 rounded-full transition-all duration-1000 ease-out"
                    style={{ width: `${((currentQAIndex + 1) / qaData.length) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom accent line */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-white to-transparent opacity-60 animate-pulse"></div>
    </section>
  );
}
