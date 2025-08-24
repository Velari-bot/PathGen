'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import FortniteStatsDisplay from '@/components/FortniteStatsDisplay';
import { FirebaseService, FortniteStats, Message } from '@/lib/firebase-service';
import { UsageTracker } from '@/lib/usage-tracker';
import { DRONE_SPAWN_DATA, getDroneSpawnInfo, getDroneStrategyByPlaystyle } from '@/lib/drone-spawn-data';



export default function AIPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [fortniteStats, setFortniteStats] = useState<FortniteStats | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string; timestamp: Date }>>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoadingResponse, setIsLoadingResponse] = useState(false);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      loadFortniteStats();
      initializeChat();
    }
  }, [user]);

  const loadFortniteStats = async () => {
    try {
      setIsLoadingStats(true);
      const stats = await FirebaseService.getFortniteStats(user!.uid);
      setFortniteStats(stats);
    } catch (error) {
      console.error('Error loading Fortnite stats:', error);
    } finally {
      setIsLoadingStats(false);
    }
  };

  const initializeChat = async () => {
    if (!user) return;
    
    try {
      // Create a new chat session
      const chatId = `chat_${Date.now()}_${user.uid}`;
      setCurrentChatId(chatId);
      
      // For now, just set the chat ID without creating Firebase documents
      // TODO: Implement chat creation when FirebaseService methods are available
      console.log('✅ New chat session created:', chatId);
    } catch (error) {
      console.error('Error initializing chat:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !user || !currentChatId) return;

    const userMessage = {
      role: 'user' as const,
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoadingResponse(true);

    try {
      // For now, just save to local storage
      // TODO: Implement Firebase message saving when FirebaseService methods are available
      saveMessageToLocalStorage(userMessage);
      
      // Generate AI response
      const aiResponse = await generateAIResponse(inputMessage, fortniteStats);
      
      const assistantMessage = {
        role: 'assistant' as const,
        content: aiResponse,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, assistantMessage]);
      saveMessageToLocalStorage(assistantMessage);
      
    } catch (error) {
      console.error('Error processing message:', error);
      
      const errorMessage = {
        role: 'assistant' as const,
        content: 'Sorry, I encountered an error processing your message. Please try again.',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoadingResponse(false);
    }
  };

  const generateAIResponse = async (userQuestion: string, stats: FortniteStats | null): Promise<string> => {
    // Enhanced AI coaching logic using comprehensive data
    if (!stats) {
      return "I don't have access to your Fortnite stats yet. Please make sure your Epic account is linked and stats are loaded.";
    }

    // Access the correct properties from FortniteStats
    const overallStats = stats.overall;
    const soloStats = stats.solo;
    const duoStats = stats.duo;
    const squadStats = stats.squad;
    const arenaStats = stats.arena;
    const tournamentStats = stats.tournaments;
    const weaponStats = stats.weapons;
    const buildingStats = stats.building;
    const performanceStats = stats.performance;
    const metadata = stats.metadata;

    // Build a comprehensive response based on available stats
    let response = `Based on your Fortnite stats, here's my analysis:\n\n`;
    
    if (overallStats) {
      response += `**Overall Performance:**\n`;
      response += `• K/D Ratio: ${overallStats.kd.toFixed(2)}\n`;
      response += `• Win Rate: ${(overallStats.winRate * 100).toFixed(1)}%\n`;
      response += `• Matches Played: ${overallStats.matches}\n`;
      response += `• Average Placement: ${overallStats.avgPlace.toFixed(1)}\n\n`;
    }

    // Add mode-specific insights
    if (soloStats && soloStats.matches > 0) {
      response += `**Solo Mode:**\n`;
      response += `• Solo K/D: ${soloStats.kd.toFixed(2)}\n`;
      response += `• Solo Win Rate: ${(soloStats.winRate * 100).toFixed(1)}%\n\n`;
    }

    if (duoStats && duoStats.matches > 0) {
      response += `**Duo Mode:**\n`;
      response += `• Duo K/D: ${duoStats.kd.toFixed(2)}\n`;
      response += `• Duo Win Rate: ${(duoStats.winRate * 100).toFixed(1)}%\n\n`;
    }

    if (squadStats && squadStats.matches > 0) {
      response += `**Squad Mode:**\n`;
      response += `• Squad K/D: ${squadStats.kd.toFixed(2)}\n`;
      response += `• Squad Win Rate: ${(squadStats.winRate * 100).toFixed(1)}%\n\n`;
    }

    // Add specific coaching based on the question
    const question = userQuestion.toLowerCase();
    
    if (question.includes('kd') || question.includes('kill') || question.includes('death')) {
      response += `**K/D Improvement Tips:**\n`;
      if (overallStats && overallStats.kd < 1.0) {
        response += `• Focus on survival over kills initially\n`;
        response += `• Practice building for protection\n`;
        response += `• Choose landing spots with fewer players\n`;
      } else if (overallStats && overallStats.kd < 2.0) {
        response += `• Work on mid-game positioning\n`;
        response += `• Practice editing and building techniques\n`;
        response += `• Focus on end-game rotations\n`;
      } else {
        response += `• Excellent K/D! Focus on tournament play\n`;
        response += `• Work on advanced building techniques\n`;
        response += `• Practice scrims and arena mode\n`;
      }
    }

    if (question.includes('win') || question.includes('victory') || question.includes('placement')) {
      response += `**Victory Royale Tips:**\n`;
      if (overallStats && overallStats.winRate < 0.05) {
        response += `• Focus on survival and positioning\n`;
        response += `• Avoid unnecessary fights early game\n`;
        response += `• Practice building for protection\n`;
      } else if (overallStats && overallStats.winRate < 0.15) {
        response += `• Work on mid-game rotations\n`;
        response += `• Practice end-game building\n`;
        response += `• Focus on zone awareness\n`;
      } else {
        response += `• Great win rate! Focus on tournament play\n`;
        response += `• Practice advanced techniques\n`;
        response += `• Work on competitive strategies\n`;
      }
    }

    if (question.includes('build') || question.includes('building') || question.includes('structure')) {
      response += `**Building Tips:**\n`;
      if (buildingStats) {
        response += `• You've built ${buildingStats.totalStructuresBuilt} structures\n`;
        response += `• Building efficiency: ${buildingStats.buildingEfficiency}%\n`;
        response += `• Edit speed: ${buildingStats.editSpeed}ms\n`;
      }
      response += `• Practice 90s and ramps\n`;
      response += `• Work on editing speed\n`;
      response += `• Learn advanced building techniques\n`;
    }

    if (question.includes('weapon') || question.includes('aim') || question.includes('accuracy')) {
      response += `**Weapon & Aim Tips:**\n`;
      if (weaponStats) {
        response += `• Favorite weapon: ${weaponStats.favoriteWeapon}\n`;
        response += `• Weapon accuracy: ${weaponStats.weaponAccuracy}%\n`;
        response += `• Headshot percentage: ${weaponStats.headshotPercentage}%\n`;
      }
      response += `• Practice aim training maps\n`;
      response += `• Work on crosshair placement\n`;
      response += `• Learn weapon recoil patterns\n`;
    }

    // Add general tips if no specific area was asked about
    if (!question.includes('kd') && !question.includes('win') && !question.includes('build') && !question.includes('weapon')) {
      response += `**General Improvement Tips:**\n`;
      response += `• Practice building in creative mode\n`;
      response += `• Work on game sense and positioning\n`;
      response += `• Learn from your replays\n`;
      response += `• Focus on one skill at a time\n`;
    }

    return response;
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Add local storage functionality
  const saveMessageToLocalStorage = (message: { role: 'user' | 'assistant'; content: string; timestamp: Date }) => {
    try {
      const existingMessages = localStorage.getItem(`chat_${currentChatId}`);
      const messages = existingMessages ? JSON.parse(existingMessages) : [];
      messages.push(message);
      localStorage.setItem(`chat_${currentChatId}`, JSON.stringify(messages));
    } catch (error) {
      console.error('Error saving message to local storage:', error);
    }
  };

  const loadMessagesFromLocalStorage = () => {
    try {
      if (!currentChatId) return [];
      const storageKey = `pathgen-chat-${currentChatId}`;
      const savedMessages = localStorage.getItem(storageKey);
      if (savedMessages) {
        const parsed = JSON.parse(savedMessages);
        console.log('✅ Loaded messages from local storage:', parsed.length);
        return parsed.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.savedAt || msg.timestamp)
        }));
      }
    } catch (error) {
      console.warn('⚠️ Could not load from local storage:', error);
    }
    return [];
  };

  // Load messages from local storage when chat changes
  useEffect(() => {
    if (currentChatId) {
      const localMessages = loadMessagesFromLocalStorage();
      if (localMessages.length > 0) {
        setMessages(localMessages);
      }
    }
  }, [currentChatId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-dark flex items-center justify-center">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-black">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-4">🤖 PathGen AI</h1>
            <p className="text-xl text-gray-300">
              Your AI Fortnite Coach & Strategy Assistant
            </p>
            
            {/* Drone Spawn Info Panel */}
            <div className="mt-6 bg-[#1A1A1A] rounded-lg p-4 border border-[#2A2A2A] max-w-4xl mx-auto">
              <h3 className="text-lg font-semibold text-white mb-3">🤖 Drone Spawn Locations</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-2">
                    <span className="text-white font-bold text-lg">S</span>
                  </div>
                  <p className="text-white font-medium">Supernova</p>
                  <p className="text-gray-400 text-xs">Epic+ Loot</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-2">
                    <span className="text-white font-bold text-lg">S</span>
                  </div>
                  <p className="text-white font-medium">Shogun</p>
                  <p className="text-gray-400 text-xs">Epic+ Loot</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-yellow-500 rounded-full flex items-center justify-center mx-auto mb-2">
                    <span className="text-white font-bold text-lg">K</span>
                  </div>
                  <p className="text-white font-medium">Kappa Kappa</p>
                  <p className="text-gray-400 text-xs">Epic+ Loot</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-2">
                    <span className="text-white font-bold text-lg">C</span>
                  </div>
                  <p className="text-white font-medium">Canyon</p>
                  <p className="text-gray-400 text-xs">Epic+ Loot</p>
                </div>
              </div>
              <div className="mt-3 text-center">
                <p className="text-gray-300 text-sm">
                  <span className="text-green-400 font-medium">✓</span> All locations spawn once per game
                </p>
                <p className="text-gray-300 text-sm">
                  <span className="text-blue-400 font-medium">⚡</span> Same spawn rate across all locations
                </p>
                <p className="text-gray-300 text-sm">
                  <span className="text-yellow-400 font-medium">🏆</span> High strategic value for tournaments
                </p>
              </div>
            </div>
            
            {/* Tournament Info Panel */}
            <div className="mt-4 bg-[#1A1A1A] rounded-lg p-4 border border-[#2A2A2A] max-w-4xl mx-auto">
              <h3 className="text-lg font-semibold text-white mb-3">🏆 EU FNCS Division Cups - Week 2</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                <div className="text-center">
                  <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-2">
                    <span className="text-white font-bold text-lg">1</span>
                  </div>
                  <p className="text-white font-medium">Division 1</p>
                  <p className="text-gray-400 text-xs">Top 33: 675 pts</p>
                  <p className="text-green-400 text-xs">Day 1: 669 pts</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-2">
                    <span className="text-white font-bold text-lg">2</span>
                  </div>
                  <p className="text-white font-medium">Division 2</p>
                  <p className="text-gray-400 text-xs">Top 40: 685 pts</p>
                  <p className="text-green-400 text-xs">Day 1: 698 pts</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-2">
                    <span className="text-white font-bold text-lg">3</span>
                  </div>
                  <p className="text-white font-medium">Division 3</p>
                  <p className="text-gray-400 text-xs">Top 300: 560 pts</p>
                  <p className="text-green-400 text-xs">Day 1: 573 pts</p>
                </div>
              </div>
              <div className="mt-3 text-center">
                <p className="text-gray-400 text-sm">
                  <span className="text-yellow-400 font-medium">⏰</span> 30min extension had varying impact per division
                </p>
                <p className="text-gray-400 text-sm">
                  <span className="text-blue-400 font-medium">🔄</span> Elo resets - all players start at 0 points
                </p>
                <p className="text-gray-400 text-sm">
                  <span className="text-green-400 font-medium">📊</span> Live updates every hour during play
                </p>
              </div>
            </div>
          </div>

          {/* Fortnite Account Section */}
          <div className="bg-[#1A1A1A] rounded-lg p-6 mb-6 border border-[#2A2A2A]">
            <h2 className="text-2xl font-bold text-white mb-4">Fortnite Account</h2>
            <div className="flex space-x-2 mb-4">
              <button className="px-4 py-2 bg-[#2A2A2A] text-white rounded-lg border border-[#2A2A2A]">Epic Account</button>
              <button className="px-4 py-2 bg-[#1A1A1A] text-[#BFBFBF] rounded-lg hover:bg-[#2A2A2A] transition-colors">Manual Input</button>
              <button className="px-4 py-2 bg-[#1A1A1A] text-[#BFBFBF] rounded-lg hover:bg-[#2A2A2A] transition-colors">Tracker Link</button>
            </div>
            <div className="flex items-center space-x-4">
              <input
                type="text"
                placeholder="Connect Epic Account"
                className="flex-1 px-4 py-3 bg-white text-black rounded-lg border border-white focus:outline-none focus:border-blue-500 placeholder-center text-center"
              />
              <div className="text-right">
                <div className="bg-[#1A1A1A] border border-[#6A7C8D] rounded-full px-3 py-1">
                  <p className="text-[#6A7C8D] text-sm">Not Connected</p>
                </div>
              </div>
                    </div>
                  </div>

          {/* Player Stats Section */}
          {fortniteStats && (
            <div className="bg-[#1A1A1A] rounded-lg p-6 mb-6 border border-[#2A2A2A]">
              <h2 className="text-2xl font-bold text-white mb-4">📊 Your Performance Stats</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-white font-bold text-xl">🎮</span>
                  </div>
                  <p className="text-[#BFBFBF] text-sm mb-1">Total Matches</p>
                  <p className="text-white font-bold text-2xl">{fortniteStats.overall.matches}</p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-white font-bold text-xl">🏆</span>
                  </div>
                  <p className="text-[#BFBFBF] text-sm mb-1">Wins</p>
                  <p className="text-white font-bold text-2xl">{fortniteStats.overall.top1}</p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-yellow-500 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-white font-bold text-xl">⚔️</span>
                  </div>
                  <p className="text-[#BFBFBF] text-sm mb-1">K/D Ratio</p>
                  <p className="text-white font-bold text-2xl">{fortniteStats.overall.kd?.toFixed(2) || '0.00'}</p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-white font-bold text-xl">🎯</span>
                  </div>
                  <p className="text-[#BFBFBF] text-sm mb-1">Top 10 Rate</p>
                  <p className="text-white font-bold text-2xl">{((fortniteStats.overall.top10 / Math.max(fortniteStats.overall.matches, 1)) * 100).toFixed(1)}%</p>
                </div>
              </div>
            </div>
          )}

          {/* Chat Controls */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <button className="px-4 py-2 bg-[#2A2A2A] text-[#BFBFBF] rounded-lg hover:bg-[#1A1A1A] transition-colors">
                Show Chat Log
              </button>
              <span className="text-[#BFBFBF]">1/5 chats</span>
              <button 
                onClick={async () => {
                  try {
                    // First check if OpenAI API key is configured
                    if (!process.env.NEXT_PUBLIC_OPENAI_API_KEY) {
                      alert('⚠️ Warning: OpenAI API key not configured!\n\nPlease add OPENAI_API_KEY to your .env file.');
                      return;
                    }
                    
                    // Check Firebase Admin SDK credentials
                    const hasFirebaseAdmin = process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY;
                    if (!hasFirebaseAdmin) {
                      alert('⚠️ Warning: Firebase Admin SDK not configured!\n\nPlease add to your .env file:\nFIREBASE_CLIENT_EMAIL=your_service_account_email\nFIREBASE_PRIVATE_KEY="your_private_key"\n\nGet these from Firebase Console > Project Settings > Service Accounts');
                      return;
                    }
                    
                    // Test create-conversation endpoint
                    const testData = {
                      conversation: {
                        id: 'test-chat-' + Date.now(),
                        epicName: 'TestUser',
                        createdAt: new Date().toISOString()
                      },
                      userId: 'test-user-id'
                    };
                    
                    console.log('🧪 Testing create-conversation endpoint...');
                    console.log('📋 Test data:', testData);
                    console.log('🔑 Firebase Admin configured:', !!hasFirebaseAdmin);
                    
                    const createResponse = await fetch('/api/ai/create-conversation', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(testData)
                    });
                    
                    if (createResponse.ok) {
                      const result = await createResponse.json();
                      console.log('✅ create-conversation API working:', result);
                      
                      // Now test the chat endpoint
                      console.log('🧪 Testing chat endpoint...');
                      const chatResponse = await fetch('/api/chat', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ 
                          message: 'Hello, this is a test message',
                          context: 'You are PathGen AI, a Fortnite coach.'
                        })
                      });
                      
                      if (chatResponse.ok) {
                        const chatResult = await chatResponse.json();
                        console.log('✅ Chat API working:', chatResult);
                        alert('✅ All APIs are working!\n\n• create-conversation: OK\n• chat: OK\n\nCheck console for details.');
                      } else {
                        const chatError = await chatResponse.json().catch(() => ({}));
                        console.error('❌ Chat API error:', chatResponse.status, chatError);
                        alert('⚠️ Partial success:\n\n✅ create-conversation: Working\n❌ chat: Error ' + chatResponse.status + '\n\nCheck console for details.');
                      }
                    } else {
                      const errorData = await createResponse.json().catch(() => ({}));
                      console.error('❌ create-conversation API error:', createResponse.status, errorData);
                      alert('❌ create-conversation API error: ' + createResponse.status + '\n\nDetails: ' + JSON.stringify(errorData, null, 2) + '\n\nCheck console for full error details.');
                    }
                  } catch (error) {
                    console.error('❌ API test failed:', error);
                    alert('❌ API test failed: ' + error);
                  }
                }}
                className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
              >
                Test API
              </button>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-green-400 text-xs">API Online</span>
              </div>
              <button 
                onClick={() => {
                  if (currentChatId) {
                    const storageKey = `pathgen-chat-${currentChatId}`;
                    localStorage.removeItem(storageKey);
                    setMessages([]);
                    alert('✅ Local chat history cleared!');
                  }
                }}
                className="px-2 py-1 bg-gray-600 text-white text-xs rounded hover:bg-gray-500 transition-colors"
                title="Clear local chat history"
              >
                Clear Local
              </button>
            </div>
            <button className="px-4 py-2 bg-white text-black border border-white rounded-lg hover:bg-gray-100 transition-colors">
              + New Chat
            </button>
            </div>

            {/* Chat Panel */}
          <div className="bg-[#1A1A1A] rounded-lg p-6 border border-[#2A2A2A]">
            <h2 className="text-2xl font-bold text-white mb-4">PathGen AI Coach</h2>
              
              {/* Messages */}
              <div className="h-96 overflow-y-auto mb-4 space-y-3">
              {/* Always show welcome message */}
              <div className="flex justify-start">
                <div className="bg-[#2A2A2A] text-white px-4 py-2 rounded-lg max-w-md">
                  <p className="text-sm">Hello! I'm your PathGen AI assistant. I can help you optimize your Fortnite gameplay, analyze strategies, and provide personalized coaching. What would you like to know?</p>
                  <p className="text-xs text-[#BFBFBF] mt-1">Welcome</p>
                </div>
                  </div>

              {/* Show messages if any exist */}
              {messages.length > 0 && messages.map((message, index) => (
                    <div
                      key={index}
                      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                          message.role === 'user'
                        ? 'bg-white text-black'
                        : 'bg-[#2A2A2A] text-white'
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    <p className="text-xs text-[#BFBFBF] mt-1">
                          {message.timestamp.toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
              ))}
              
                {isLoadingResponse && (
                  <div className="flex justify-start">
                  <div className="bg-[#2A2A2A] text-white px-4 py-2 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span className="text-sm">AI is thinking...</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Input */}
            <div className="flex space-x-2 mb-4">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                placeholder="Type your question..."
                className="flex-1 px-4 py-3 bg-[#2A2A2A] text-white rounded-lg border border-[#2A2A2A] focus:outline-none focus:border-blue-500 placeholder-[#BFBFBF]"
                  disabled={isLoadingResponse}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!inputMessage.trim() || isLoadingResponse}
                className="px-6 py-3 bg-[#BFBFBF] hover:bg-[#6A7C8D] disabled:bg-[#2A2A2A] text-[#1A1A1A] hover:text-white disabled:text-[#BFBFBF] rounded-lg transition-colors"
                >
                  Send
              </button>
            </div>

            {/* Quick Suggestions */}
            <div>
              <h3 className="text-white font-semibold mb-3">Quick Suggestions</h3>
              <div className="flex flex-wrap gap-2">
                <button 
                  onClick={() => setInputMessage('drone spawn locations')}
                  className="px-4 py-2 bg-[#2A2A2A] text-white rounded-full hover:bg-[#1A1A1A] transition-colors border border-[#2A2A2A]"
                >
                  🤖 Drone Spawn Locations
                </button>
                <button 
                  onClick={() => setInputMessage('drone strategy aggressive')}
                  className="px-4 py-2 bg-[#2A2A2A] text-white rounded-full hover:bg-[#1A1A1A] transition-colors border border-[#2A2A2A]"
                >
                  ⚔️ Aggressive Drone Strategy
                </button>
                <button 
                  onClick={() => setInputMessage('drone strategy passive')}
                  className="px-4 py-2 bg-[#2A2A2A] text-white rounded-full hover:bg-[#1A1A1A] transition-colors border border-[#2A2A2A]"
                >
                  🛡️ Passive Drone Strategy
                </button>
                <button 
                  onClick={() => setInputMessage('drop locations and POI analysis')}
                  className="px-4 py-2 bg-[#2A2A2A] text-white rounded-full hover:bg-[#1A1A1A] transition-colors border border-[#2A2A2A]"
                >
                  🗺️ POI Drop Analysis
                </button>
                <button 
                  onClick={() => setInputMessage('comprehensive analysis')}
                  className="px-4 py-2 bg-[#2A2A2A] text-white rounded-full hover:bg-[#1A1A1A] transition-colors border border-[#2A2A2A]"
                >
                  📊 Performance Analysis
                </button>
                <button 
                  onClick={() => setInputMessage('eu fncs division cups')}
                  className="px-4 py-2 bg-[#2A2A2A] text-white rounded-full hover:bg-[#1A1A1A] transition-colors border border-[#2A2A2A]"
                >
                  🏆 EU FNCS Division Cups
                </button>
                <button 
                  onClick={() => setInputMessage('division targets and qualification')}
                  className="px-4 py-2 bg-[#2A2A2A] text-white rounded-full hover:bg-[#1A1A1A] transition-colors border border-[#2A2A2A]"
                >
                  🎯 Division Targets
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
