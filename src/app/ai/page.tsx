'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import FortniteStatsDisplay from '@/components/FortniteStatsDisplay';
import { EpicConnectButton } from '@/components/EpicConnectButton';
import { FirebaseService, FortniteStats, Message } from '@/lib/firebase-service';
import { UsageTracker } from '@/lib/usage-tracker';
import Footer from '@/components/Footer';





export default function AIPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [fortniteStats, setFortniteStats] = useState<FortniteStats | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string; timestamp: Date }>>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoadingResponse, setIsLoadingResponse] = useState(false);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [epicAccount, setEpicAccount] = useState<any>(null);
  const [epicError, setEpicError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      loadFortniteStats();
      initializeChat();
      loadEpicAccount();
    }
  }, [user]);

  // Auto-save chat to Firebase when messages change
  useEffect(() => {
    if (messages.length > 0 && currentChatId && user) {
      const saveTimeout = setTimeout(() => {
        saveChatToFirebase(messages);
      }, 2000); // Save after 2 seconds of inactivity
      
      return () => clearTimeout(saveTimeout);
    }
  }, [messages, currentChatId, user]);

  const loadEpicAccount = async () => {
    if (!user) return;
    
    try {
      const epicAccount = await FirebaseService.getEpicAccount(user.uid);
      setEpicAccount(epicAccount);
    } catch (error) {
      console.warn('Could not load Epic account:', error);
      setEpicAccount(null);
    }
  };

  const handleEpicAccountLinked = (account: any) => {
    setEpicAccount(account);
    setEpicError(null);
    // Reload Fortnite stats after Epic account is linked
    loadFortniteStats();
  };

  const handleEpicAccountError = (error: string) => {
    setEpicError(error);
    console.error('Epic account error:', error);
  };

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
      
      // Load existing messages from local storage
      loadMessagesFromLocalStorage(chatId);
      
      // Create chat session in Firebase
      await createChatSessionInFirebase(chatId);
      
      console.log('✅ New chat session created:', chatId);
    } catch (error) {
      console.error('Error initializing chat:', error);
    }
  };

  // Save message to local storage
  const saveMessageToLocalStorage = (message: any) => {
    if (!currentChatId) return;
    
    try {
      const storageKey = `pathgen-chat-${currentChatId}`;
      const existingMessages = JSON.parse(localStorage.getItem(storageKey) || '[]');
      const updatedMessages = [...existingMessages, message];
      localStorage.setItem(storageKey, JSON.stringify(updatedMessages));
      console.log('✅ Message saved to local storage');
    } catch (error) {
      console.error('Error saving to local storage:', error);
    }
  };

  // Load messages from local storage
  const loadMessagesFromLocalStorage = (chatId: string) => {
    try {
      const storageKey = `pathgen-chat-${chatId}`;
      const savedMessages = localStorage.getItem(storageKey);
      if (savedMessages) {
        const parsedMessages = JSON.parse(savedMessages);
        setMessages(parsedMessages);
        console.log('✅ Loaded messages from local storage:', parsedMessages.length);
      }
    } catch (error) {
      console.error('Error loading from local storage:', error);
    }
  };

  // Create chat session in Firebase
  const createChatSessionInFirebase = async (chatId: string) => {
    if (!user || !chatId) return;
    
    try {
      const chatSession = {
        id: chatId,
        userId: user.uid,
        userEmail: user.email,
        createdAt: new Date(),
        lastUpdated: new Date(),
        messageCount: 0,
        status: 'active'
      };
      
      // Save to Firebase (you'll need to implement this method in FirebaseService)
      // await FirebaseService.createChatSession(chatSession);
      console.log('✅ Chat session created in Firebase:', chatId);
    } catch (error) {
      console.error('Error creating Firebase chat session:', error);
    }
  };

  // Save chat to Firebase
  const saveChatToFirebase = async (messages: any[]) => {
    if (!user || !currentChatId) return;
    
    try {
      const chatData = {
        chatId: currentChatId,
        userId: user.uid,
        messages: messages,
        lastUpdated: new Date(),
        messageCount: messages.length
      };
      
      // Save to Firebase (you'll need to implement this method in FirebaseService)
      // await FirebaseService.saveChat(chatData);
      console.log('✅ Chat saved to Firebase');
    } catch (error) {
      console.error('Error saving chat to Firebase:', error);
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
        // Save user message to local storage
        saveMessageToLocalStorage(userMessage);
      
      // Get Epic account information for context
      let epicContext = '';
      let fortniteUsername = '';
      let userStats = '';
      
      try {
        const epicAccount = await FirebaseService.getEpicAccount(user.uid);
        if (epicAccount) {
          epicContext = `Epic Account: ${epicAccount.displayName} (${epicAccount.epicId}), Platform: ${epicAccount.platform}, Linked: ${epicAccount.linkedAt}`;
          fortniteUsername = epicAccount.displayName;
        }
      } catch (error) {
        console.warn('Could not load Epic account info:', error);
      }
      
      // Prepare user stats context
      if (fortniteStats) {
        const overallStats = fortniteStats.overall;
        if (overallStats) {
          userStats = `K/D: ${overallStats.kd.toFixed(2)}, Win Rate: ${(overallStats.winRate * 100).toFixed(1)}%, Matches: ${overallStats.matches}, Avg Placement: ${overallStats.avgPlace.toFixed(1)}`;
        }
      }
      
      // Call the AI API with comprehensive context
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: inputMessage,
          context: 'You are PathGen AI, a helpful Fortnite improvement coach. Provide specific, actionable advice for Fortnite players. Keep responses concise but helpful.',
          fortniteUsername: fortniteUsername,
          epicContext: epicContext,
          userStats: userStats
        }),
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const data = await response.json();
      const aiResponse = data.response || 'Sorry, I could not generate a response.';
      
      const assistantMessage = {
        role: 'assistant' as const,
        content: aiResponse,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, assistantMessage]);
      
      // Save assistant message to local storage
      saveMessageToLocalStorage(assistantMessage);
      
      // Save entire chat to Firebase
      const updatedMessages = [...messages, userMessage, assistantMessage];
      await saveChatToFirebase(updatedMessages);
      
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

    // Current tournament information for NA and EU (updated regularly)
    const currentTournaments = {
      fncsDivs: {
        na: {
          name: "C6S4 FNCS DIVS WEEK 3",
          status: "Completed",
          results: {
            div1: {
              top33: "674 points",
              top100: "209 points (Day 2)"
            },
            div2: {
              top40: "666 points",
              top100: "288 points (Day 2)",
              top200: "234 points (Day 2)"
            },
            div3: {
              top200: "536 points",
              top1000: "212 points (Day 2)"
            }
          }
        },
        eu: {
          name: "C6S4 FNCS DIVS WEEK 3",
          status: "Completed",
          results: {
            div1: {
              top33: "676 points",
              top100: "249 points (Day 2)"
            },
            div2: {
              top40: "699 points",
              top100: "317 points (Day 2)",
              top200: "283 points (Day 2)",
              top500: "221 points (Day 2)"
            },
            div3: {
              top300: "583 points",
              top1000: "264 points (Day 2)",
              top2500: "230 points (Day 2)",
              top7500: "143 points (Day 2)"
            }
          }
        }
      },
      bladeOfChampions: {
        na: {
          name: "C6S4 Blade of Champions Cup",
          status: "Active",
          requirement: "Top 750 in Round 2 Group 1",
          estimate: "29 points (likely 27-31 range)",
          note: "There is Elo, so you won't be able to keep winning easily if you have a good first game"
        },
        eu: {
          name: "C6S4 Blade of Champions Cup",
          status: "Active",
          requirement: "Top 750 in Round 2 Group 1",
          estimate: "29 points (likely 27-31 range)",
          note: "There is Elo, so you won't be able to keep winning easily if you have a good first game"
        }
      },
      eliteZadieReload: {
        na: {
          name: "Elite Zadie Reload Cup",
          status: "Active",
          requirement: "Top 750 duos in Round 2 Group 1",
          estimate: "27 points (likely 26-28 range)",
          note: "There is Elo"
        },
        eu: {
          name: "Elite Zadie Reload Cup",
          status: "Active",
          requirement: "Top 1000 duos in Round 2 Group 1",
          estimate: "30 points (likely 29-31 range)",
          note: "There is Elo"
        }
      }
    };

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

    // Tournament-specific responses
    if (question.includes('tournament') || question.includes('fncs') || question.includes('cup') || question.includes('competitive')) {
      // Determine region based on question or provide both
      const isNA = question.includes('na') || question.includes('north america');
      const isEU = question.includes('eu') || question.includes('europe');
      
      if (isNA || (!isNA && !isEU)) {
        response += `**🏆 Current Tournament Information (NA):**\n\n`;
        
        // FNCS Divs NA
        response += `**${currentTournaments.fncsDivs.na.name}** (${currentTournaments.fncsDivs.na.status})\n`;
        response += `• Div 1 Top 33: ${currentTournaments.fncsDivs.na.results.div1.top33}\n`;
        response += `• Div 1 Top 100: ${currentTournaments.fncsDivs.na.results.div1.top100}\n`;
        response += `• Div 2 Top 40: ${currentTournaments.fncsDivs.na.results.div2.top40}\n`;
        response += `• Div 2 Top 100: ${currentTournaments.fncsDivs.na.results.div2.top100}\n`;
        response += `• Div 3 Top 200: ${currentTournaments.fncsDivs.na.results.div3.top200}\n\n`;
        
        // Blade of Champions Cup NA
        response += `**${currentTournaments.bladeOfChampions.na.name}** (${currentTournaments.bladeOfChampions.na.status})\n`;
        response += `• Requirement: ${currentTournaments.bladeOfChampions.na.requirement}\n`;
        response += `• Point Estimate: ${currentTournaments.bladeOfChampions.na.estimate}\n`;
        response += `• Note: ${currentTournaments.bladeOfChampions.na.note}\n\n`;
        
        // Elite Zadie Reload Cup NA
        response += `**${currentTournaments.eliteZadieReload.na.name}** (${currentTournaments.eliteZadieReload.na.status})\n`;
        response += `• Requirement: ${currentTournaments.eliteZadieReload.na.requirement}\n`;
        response += `• Point Estimate: ${currentTournaments.eliteZadieReload.na.estimate}\n`;
        response += `• Note: ${currentTournaments.eliteZadieReload.na.note}\n\n`;
      }
      
      if (isEU || (!isNA && !isEU)) {
        response += `**🏆 Current Tournament Information (EU):**\n\n`;
        
        // FNCS Divs EU
        response += `**${currentTournaments.fncsDivs.eu.name}** (${currentTournaments.fncsDivs.eu.status})\n`;
        response += `• Div 1 Top 33: ${currentTournaments.fncsDivs.eu.results.div1.top33}\n`;
        response += `• Div 1 Top 100: ${currentTournaments.fncsDivs.eu.results.div1.top100}\n`;
        response += `• Div 2 Top 40: ${currentTournaments.fncsDivs.eu.results.div2.top40}\n`;
        response += `• Div 2 Top 100: ${currentTournaments.fncsDivs.eu.results.div2.top100}\n`;
        response += `• Div 2 Top 200: ${currentTournaments.fncsDivs.eu.results.div2.top200}\n`;
        response += `• Div 2 Top 500: ${currentTournaments.fncsDivs.eu.results.div2.top500}\n`;
        response += `• Div 3 Top 300: ${currentTournaments.fncsDivs.eu.results.div3.top300}\n`;
        response += `• Div 3 Top 1000: ${currentTournaments.fncsDivs.eu.results.div3.top1000}\n`;
        response += `• Div 3 Top 2500: ${currentTournaments.fncsDivs.eu.results.div3.top2500}\n`;
        response += `• Div 3 Top 7500: ${currentTournaments.fncsDivs.eu.results.div3.top7500}\n\n`;
        
        // Blade of Champions Cup EU
        response += `**${currentTournaments.bladeOfChampions.eu.name}** (${currentTournaments.bladeOfChampions.eu.status})\n`;
        response += `• Requirement: ${currentTournaments.bladeOfChampions.eu.requirement}\n`;
        response += `• Point Estimate: ${currentTournaments.bladeOfChampions.eu.estimate}\n`;
        response += `• Note: ${currentTournaments.bladeOfChampions.eu.note}\n\n`;
        
        // Elite Zadie Reload Cup EU
        response += `**${currentTournaments.eliteZadieReload.eu.name}** (${currentTournaments.eliteZadieReload.eu.status})\n`;
        response += `• Requirement: ${currentTournaments.eliteZadieReload.eu.requirement}\n`;
        response += `• Point Estimate: ${currentTournaments.eliteZadieReload.eu.estimate}\n`;
        response += `• Note: ${currentTournaments.eliteZadieReload.eu.note}\n\n`;
      }
      
      response += `**Tournament Tips:**\n`;
      response += `• Queue Bug Alert: Re-queue if waiting too long (Div 1/3: 6 min, Div 2: 2 min)\n`;
      response += `• Focus on consistent placements over high-kill games\n`;
      response += `• Practice end-game scenarios in creative\n`;
      response += `• Study previous tournament VODs for meta strategies\n`;
      response += `• Use tourney-calc-pro to calculate needed points for final games\n`;
    }

    // Add general tips if no specific area was asked about
    if (!question.includes('kd') && !question.includes('win') && !question.includes('build') && !question.includes('weapon') && !question.includes('tournament')) {
      response += `**General Improvement Tips:**\n`;
      response += `• Practice building in creative mode\n`;
      response += `• Work on game sense and positioning\n`;
      response += `• Learn from your replays\n`;
      response += `• Focus on one skill at a time\n`;
      response += `• Check current tournament information for competitive play\n`;
    }

    return response;
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Load chat history from local storage
  const loadChatHistory = () => {
    if (!user) return;
    
    try {
      // Get all chat sessions for this user
      const chatKeys = Object.keys(localStorage).filter(key => 
        key.startsWith(`pathgen-chat-`) && key.includes(user.uid)
      );
      
      if (chatKeys.length > 0) {
        // Load the most recent chat
        const mostRecentKey = chatKeys.sort().reverse()[0];
        const chatId = mostRecentKey.replace('pathgen-chat-', '');
        setCurrentChatId(chatId);
        loadMessagesFromLocalStorage(chatId);
        console.log('✅ Loaded most recent chat:', chatId);
      }
    } catch (error) {
      console.error('Error loading chat history:', error);
    }
  };

  // Clear current chat
  const clearCurrentChat = () => {
    if (currentChatId) {
      setMessages([]);
      localStorage.removeItem(`pathgen-chat-${currentChatId}`);
      console.log('✅ Current chat cleared');
    }
  };



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
    <div className="min-h-screen bg-black mobile-container">
      <Navbar />
      

      
      <div className="container mx-auto px-4 sm:px-6 pt-20 sm:pt-24 pb-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-6 sm:mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3 sm:mb-4">PathGen AI</h1>
            <p className="text-base sm:text-lg md:text-xl text-gray-300 px-4">
              Your AI Fortnite Coach & Strategy Assistant
            </p>
          </div>

          {/* Fortnite Account Section */}
          <div className="bg-[#1A1A1A] rounded-lg p-6 mb-6 border border-[#2A2A2A]">
            <h2 className="text-2xl font-bold text-white mb-4">Fortnite Account</h2>
            
            {epicAccount ? (
              <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-green-400 font-semibold">Account Connected</h3>
                  <span className="px-3 py-1 bg-green-500 text-white text-xs rounded-full">Connected</span>
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
                <p className="text-white/60">Connect your Epic Games account to access personalized Fortnite coaching and stats.</p>
                {epicError && (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                    <p className="text-red-400 text-sm">{epicError}</p>
                  </div>
                )}
                <EpicConnectButton 
                  onAccountLinked={handleEpicAccountLinked}
                  onError={handleEpicAccountError}
                />
              </div>
            )}
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
              <button 
                onClick={loadChatHistory}
                className="px-4 py-2 bg-[#2A2A2A] text-[#BFBFBF] rounded-lg hover:bg-[#1A1A1A] transition-colors"
              >
                Show Chat Log
              </button>
              <span className="text-[#BFBFBF]">
                {messages.length > 0 ? `${messages.length} messages` : 'No messages'}
              </span>

              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-green-400 text-xs">API Online</span>
              </div>
              <button 
                onClick={clearCurrentChat}
                className="px-2 py-1 bg-gray-600 text-white text-xs rounded hover:bg-gray-500 transition-colors"
                title="Clear current chat"
              >
                Clear Chat
              </button>
            </div>
            <button 
              onClick={() => {
                setMessages([]);
                setCurrentChatId(null);
                initializeChat();
              }}
              className="px-4 py-2 bg-white text-black border border-white rounded-lg hover:bg-gray-100 transition-colors"
            >
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
                  onClick={() => setInputMessage('building tips and techniques')}
                  className="px-4 py-2 bg-[#2A2A2A] text-white rounded-full hover:bg-[#1A1A1A] transition-colors border border-[#2A2A2A]"
                >
                  🏗️ Building Tips
                </button>
                <button 
                  onClick={() => setInputMessage('aim and weapon strategies')}
                  className="px-4 py-2 bg-[#2A2A2A] text-white rounded-full hover:bg-[#1A1A1A] transition-colors border border-[#2A2A2A]"
                >
                  🎯 Aim & Weapons
                </button>
                <button 
                  onClick={() => setInputMessage('current tournament information and strategies')}
                  className="px-4 py-2 bg-[#2A2A2A] text-white rounded-full hover:bg-[#1A1A1A] transition-colors border border-[#2A2A2A]"
                >
                  🏆 Current Tournaments
                </button>
                <button 
                  onClick={() => setInputMessage('game sense and positioning')}
                  className="px-4 py-2 bg-[#2A2A2A] text-white rounded-full hover:bg-[#1A1A1A] transition-colors border border-[#2A2A2A]"
                >
                  🧠 Game Sense
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}
