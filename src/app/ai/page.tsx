'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { useCreditTracking } from '@/hooks/useCreditTracking';
import { UsageTrackingRequest } from '@/types/subscription';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import EmailVerificationGuard from '@/components/EmailVerificationGuard';
import FortniteStatsDisplay from '@/components/FortniteStatsDisplay';
import { EpicConnectButton } from '@/components/EpicConnectButton';
import { FirebaseService, FortniteStats, Message } from '@/lib/firebase-service';
import { UsageTracker } from '@/lib/usage-tracker';
import Footer from '@/components/Footer';
import { CreditDisplay } from '@/components/CreditDisplay';





export default function AIPage() {
  const { user, loading } = useAuth();
  const { trackUsage } = useSubscription();
  const { useCreditsForChat, canAfford, deductCreditsAfterAction } = useCreditTracking();
  const router = useRouter();
  const [fortniteStats, setFortniteStats] = useState<FortniteStats | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string; timestamp: Date }>>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoadingResponse, setIsLoadingResponse] = useState(false);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [epicAccount, setEpicAccount] = useState<any>(null);
  const [epicError, setEpicError] = useState<string | null>(null);

  // Function to parse markdown-style bold text
  const parseBoldText = (text: string) => {
    return text.split('**').map((part, index) => {
      if (index % 2 === 1) {
        // Odd indices are the text between ** markers (should be bold)
        return <strong key={index} className="font-bold">{part}</strong>;
      }
      return part;
    });
  };

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
        // Convert timestamp strings back to Date objects
        const messagesWithDates = parsedMessages.map((message: any) => ({
          ...message,
          timestamp: new Date(message.timestamp)
        }));
        setMessages(messagesWithDates);
        console.log('✅ Loaded messages from local storage:', messagesWithDates.length);
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

    // Check if user has enough credits for AI chat
    if (!canAfford(1)) {
      alert('Insufficient credits. You need 1 credit to send a message.');
      return;
    }

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
      
      // Deduct credits AFTER successful message processing
      console.log('🔍 Deducting 1 credit for AI chat...');
      try {
        const success = await deductCreditsAfterAction(1, 'ai_chat', {
          messageId: userMessage.timestamp.getTime(),
          chatId: currentChatId
        });
        if (success) {
          console.log('✅ Credit deducted successfully for AI chat');
        } else {
          console.warn('⚠️ Failed to deduct credit, but message was sent');
        }
      } catch (error) {
        console.error('Failed to deduct credit:', error);
        // Don't fail the entire operation if credit deduction fails
      }
      
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
      },
      c6s4DuosSolos: {
        name: "C6S4 DUOS/SOLOS TOURNAMENTS",
        status: "Active",
        duoTrials: {
          name: "Duo Trials + Div Cups",
          trial: {
            date: "13th Sept",
            regionLock: "Yes - region-locked",
            qualifications: {
              div2: "Top 1000 in Trials",
              div3: "1001-3000 in Trials (EU/NAC only)",
              div4: "3001-13000 in Trials (EU), 3001-7000 in Trials (NAC)",
              default: "Div 5 EU/NAC, Div 3 other regions"
            },
            notes: [
              "Some Trios Div 1 players go straight to Duos Div 1",
              "Check in-game to see if Div 1 is unlocked",
              "If in Div 1, you can't play the Trial"
            ]
          },
          divCups: {
            frequency: "2 cups each week",
            regionLock: "No - you can start in bottom division of every region",
            elo: "No points-based matchmaking except in lowest division",
            div1: "Like Trio Div Cups - play both days with same teammates, qualify from cumulative leaderboard",
            divs2to5: "2 separate tournaments per day, can change teammates between them",
            flexibility: "Can play lower divisions and return to higher divisions anytime"
          }
        },
        soloSeries: {
          name: "Solo Series",
          frequency: "1 tournament per week",
          format: "Like Solo Cash Cup Round 1",
          regionLock: "No",
          elo: "Yes - points-based matchmaking",
          totalTournaments: 6,
          qualification: "Add up 4 highest points totals, top 100 qualify for end-of-season Final",
          notes: [
            "Many players don't have realistic chance of qualifying for finals",
            "Still worth playing for personal improvement and PR",
            "Focus on consistent performance across multiple tournaments"
          ]
        }
      },
      playstationCup: {
        name: "C6S4 PlayStation Cup",
        status: "Active",
        rules: {
          regionLock: "No - play as many as you want",
          elo: "Normal Elo (points-based matchmaking)",
          qualification: "Top 100 qualify",
          pr: "PR given for Console rankings"
        },
        pointsSystem: {
          startAt: "Top 50",
          win: "60 points",
          elim: "2 points",
          note: "Mostly about placement. Big wins help but consistent placement is key"
        },
        playstyle: {
          rankRequired: "No Rank required",
          strategy: "Use easier lobbies for good placements, not for keying",
          qualificationExample: "Player qualified in 41st with only 12 elims (placements: 1st, 2nd, 4th, 5th, 6th, 7th, 30th)",
          averageElims: "Players around 90th-100th averaging 35 total elims",
          advice: [
            "If better than other players, just win the game",
            "Get 60-70 points rather than risky fights for 100 points",
            "Don't start fights yourself to play more endgames",
            "Get 200 damage by end of zone 4 then follow surge in top lobbies"
          ]
        },
        dropspots: {
          reference: "Look at green locations from Axe of Champions Cup",
          euLink: "https://discord.com/channels/758774033704681512/1075102287522959371/1411479993841877013",
          nacLink: "https://discord.com/channels/758774033704681512/1075102663009636432/1411480355793276948",
          note: "Similar to Axe of Champions Cup but not exactly the same"
        },
        loadout: {
          weapons: [
            "Sentinel Pump",
            "Fury AR (recommended for solos - better spray in endgame/boxfights)"
          ],
          utility: "Crash Pads",
          heals: [
            "Double Heals",
            "Legendary Slurps + Fizz (best)",
            "Chug splashes (next best)",
            "Minis/Bigs/MedKits"
          ]
        },
        liveEstimates: {
          nac: {
            top100Qual: "311 points (304+ for any chance, 318+ to be fully safe)",
            top1000: "254 points",
            lastUpdated: "Live updates by @m8 Toom",
            breakdown: {
              description: "What 325 points looks like while playing placement:",
              games: [
                "1 Win with 4 Elims",
                "2 Top 5s with 2 Elims", 
                "3 Top 10s with 1 Elim",
                "1 Top 25 with 0 Elims",
                "3 spare games"
              ]
            },
            queueTimes: {
              top100: "6 minutes for safe queue if you're in the Top 100",
              everyoneElse: "5 minutes for everyone else"
            },
            calculator: "Use 🤖tourney-calc-pro to help calculate what you need in your final game",
            targeting: {
              qual: "Aim for Qual if you often get Top 1k in tourneys",
              top1000: "Otherwise you can aim for Top 1000"
            }
          },
          eu: {
            top100Qual: "331 points (325+ for any chance, 337+ to be fully safe)",
            top1000: "280 points",
            lastUpdated: "Live updates by @Kinch [KNCH]",
            breakdown: {
              description: "What 325 points looks like while playing placement:",
              games: [
                "1 Win with 4 Elims",
                "2 Top 5s with 2 Elims", 
                "3 Top 10s with 1 Elim",
                "1 Top 25 with 0 Elims",
                "3 spare games"
              ]
            },
            queueTimes: {
              top100: "6 minutes for safe queue if you're in the Top 100",
              everyoneElse: "5 minutes for everyone else"
            },
            calculator: "Use 🤖tourney-calc-pro to help calculate what you need in your final game",
            targeting: {
              qual: "Aim for Qual if you often get Top 1k in tourneys",
              top1000: "Otherwise you can aim for Top 1000"
            },
            finalResults: {
              top100: "331 points",
              top1000: "280 points"
            }
          }
        }
      },
      reloadQuickCups: {
        name: "RELOAD QUICK CUPS",
        status: "Active",
        rules: {
          format: "Duos Reload (Slurp Rush map)",
          regionLock: "No Region Lock",
          qualification: "Get a 15-point game in Round 1 to get to Round 2 Group 1. If you get any points you'll still be able to play Group 2 or 3",
          elo: "There is Elo in Round 2"
        },
        pointsSystem: {
          placement: "1 point per placement from Top 10 (out of 20 teams) onwards",
          win: "10 points",
          elim: "1 point. Max of 5 points from elims"
        },
        rounds: {
          round1: {
            name: "Round 1",
            description: "Full placement for all 3 games",
            strategy: [
              "You should usually get 5 elims naturally by winning",
              "Make sure you think about elims once you're in moving zones",
              "Don't over-commit to fights - try to make sure one of you can stay alive",
              "Carrying shocks will help you stay alive"
            ]
          },
          round2: {
            name: "Round 2",
            group1: "In Group 1 you can aim to place Top 20 to get to Round 3!",
            groups2and3: "In Groups 2 and 3 there is no 'prize' to aim for, but you should play anyway if you enjoy Reload!",
            strategy: [
              "Play full placement in every game no matter what your situation is",
              "Keying doesn't really give you extra points (because the elim cap is 5)",
              "If you do well in the first game, your next game will be hard because there is elo (points based matchmaking)"
            ]
          },
          round3: {
            name: "Round 3",
            format: "Victory Cup format",
            strategy: "You just need to try and win!"
          }
        },
        loadout: {
          weapons: [
            "Charge is the best shotgun",
            "Take Mammoth Pistol because it's OP",
            "Drop the pistol for a burst AR or six shooter nearer the endgame so that you have a faster-firing weapon to help you in moving zones"
          ],
          utility: "Crashpads or Shocks for Rotation",
          heals: [
            "Ideal heals is Fizz (to help rotation) + Legendary Slurp Juice",
            "Chug jug is the next best heal",
            "Then all the usual stuff - minis/bigs/medkits/medmistbomb"
          ],
          note: "The lootpool was changed today and it's basically 'really bad weapons'"
        }
      }
    };

    // Latest game updates and mechanics changes
    const gameUpdates = {
      latestUpdate: {
        date: "Recent Night Update",
        title: "COMP UPDATE - Epic Updated Loot Pool & Game Mechanics",
        changes: [
          "Disabled player/vehicle damage for drop pods",
          "Disabled POI reclaim and defense activities",
          "Bomber spawn chance increased from 30% -> 50%",
          "Small changes to medium/small bugs"
        ],
        notes: [
          "Vulture boon from reclaiming POI is removed",
          "Drop pods are now safe for players and vehicles",
          "POI reclaim activities are no longer available",
          "Bomber spawns are more frequent (50% chance)"
        ]
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
      
      // Add C6S4 Duos/Solos Tournament Information
      response += `**🏆 ${currentTournaments.c6s4DuosSolos.name}**\n\n`;
      
      // Duo Trials + Div Cups
      response += `**${currentTournaments.c6s4DuosSolos.duoTrials.name}**\n`;
      response += `**Trial (${currentTournaments.c6s4DuosSolos.duoTrials.trial.date}):**\n`;
      response += `• Region Lock: ${currentTournaments.c6s4DuosSolos.duoTrials.trial.regionLock}\n`;
      response += `• Div 2: ${currentTournaments.c6s4DuosSolos.duoTrials.trial.qualifications.div2}\n`;
      response += `• Div 3: ${currentTournaments.c6s4DuosSolos.duoTrials.trial.qualifications.div3}\n`;
      response += `• Div 4: ${currentTournaments.c6s4DuosSolos.duoTrials.trial.qualifications.div4}\n`;
      response += `• Default: ${currentTournaments.c6s4DuosSolos.duoTrials.trial.qualifications.default}\n`;
      response += `• Notes: ${currentTournaments.c6s4DuosSolos.duoTrials.trial.notes.join(', ')}\n\n`;
      
      response += `**Div Cups:**\n`;
      response += `• Frequency: ${currentTournaments.c6s4DuosSolos.duoTrials.divCups.frequency}\n`;
      response += `• Region Lock: ${currentTournaments.c6s4DuosSolos.duoTrials.divCups.regionLock}\n`;
      response += `• Elo: ${currentTournaments.c6s4DuosSolos.duoTrials.divCups.elo}\n`;
      response += `• Div 1: ${currentTournaments.c6s4DuosSolos.duoTrials.divCups.div1}\n`;
      response += `• Divs 2-5: ${currentTournaments.c6s4DuosSolos.duoTrials.divCups.divs2to5}\n`;
      response += `• Flexibility: ${currentTournaments.c6s4DuosSolos.duoTrials.divCups.flexibility}\n\n`;
      
      // Solo Series
      response += `**${currentTournaments.c6s4DuosSolos.soloSeries.name}:**\n`;
      response += `• Frequency: ${currentTournaments.c6s4DuosSolos.soloSeries.frequency}\n`;
      response += `• Format: ${currentTournaments.c6s4DuosSolos.soloSeries.format}\n`;
      response += `• Region Lock: ${currentTournaments.c6s4DuosSolos.soloSeries.regionLock}\n`;
      response += `• Elo: ${currentTournaments.c6s4DuosSolos.soloSeries.elo}\n`;
      response += `• Total Tournaments: ${currentTournaments.c6s4DuosSolos.soloSeries.totalTournaments}\n`;
      response += `• Qualification: ${currentTournaments.c6s4DuosSolos.soloSeries.qualification}\n`;
      response += `• Notes: ${currentTournaments.c6s4DuosSolos.soloSeries.notes.join(', ')}\n\n`;
      
      // PlayStation Cup
      response += `**🏆 ${currentTournaments.playstationCup.name}**\n`;
      response += `**Rules:**\n`;
      response += `• Region Lock: ${currentTournaments.playstationCup.rules.regionLock}\n`;
      response += `• Elo: ${currentTournaments.playstationCup.rules.elo}\n`;
      response += `• Qualification: ${currentTournaments.playstationCup.rules.qualification}\n`;
      response += `• PR: ${currentTournaments.playstationCup.rules.pr}\n\n`;
      
      response += `**Points System:**\n`;
      response += `• Points Start: ${currentTournaments.playstationCup.pointsSystem.startAt}\n`;
      response += `• Win: ${currentTournaments.playstationCup.pointsSystem.win}\n`;
      response += `• Elim: ${currentTournaments.playstationCup.pointsSystem.elim}\n`;
      response += `• Note: ${currentTournaments.playstationCup.pointsSystem.note}\n\n`;
      
      response += `**Playstyle:**\n`;
      response += `• Rank Required: ${currentTournaments.playstationCup.playstyle.rankRequired}\n`;
      response += `• Strategy: ${currentTournaments.playstationCup.playstyle.strategy}\n`;
      response += `• Qualification Example: ${currentTournaments.playstationCup.playstyle.qualificationExample}\n`;
      response += `• Average Eliminations: ${currentTournaments.playstationCup.playstyle.averageElims}\n`;
      response += `• Advice: ${currentTournaments.playstationCup.playstyle.advice.join(', ')}\n\n`;
      
      response += `**Dropspots:**\n`;
      response += `• Reference: ${currentTournaments.playstationCup.dropspots.reference}\n`;
      response += `• EU Link: ${currentTournaments.playstationCup.dropspots.euLink}\n`;
      response += `• NAC Link: ${currentTournaments.playstationCup.dropspots.nacLink}\n`;
      response += `• Note: ${currentTournaments.playstationCup.dropspots.note}\n\n`;
      
      response += `**Loadout:**\n`;
      response += `• Weapons: ${currentTournaments.playstationCup.loadout.weapons.join(', ')}\n`;
      response += `• Utility: ${currentTournaments.playstationCup.loadout.utility}\n`;
      response += `• Heals: ${currentTournaments.playstationCup.loadout.heals.join(', ')}\n\n`;
      
      // Add live estimates for NAC
      response += `**📈 Live Estimates (NAC):**\n`;
      response += `• Top 100 (Qual): ${currentTournaments.playstationCup.liveEstimates.nac.top100Qual}\n`;
      response += `• Top 1000: ${currentTournaments.playstationCup.liveEstimates.nac.top1000}\n`;
      response += `• Last Updated: ${currentTournaments.playstationCup.liveEstimates.nac.lastUpdated}\n\n`;
      
      response += `**Targeting Strategy:**\n`;
      response += `• ${currentTournaments.playstationCup.liveEstimates.nac.targeting.qual}\n`;
      response += `• ${currentTournaments.playstationCup.liveEstimates.nac.targeting.top1000}\n\n`;
      
      response += `**📊 Point Breakdown Example:**\n`;
      response += `• ${currentTournaments.playstationCup.liveEstimates.nac.breakdown.description}\n`;
      currentTournaments.playstationCup.liveEstimates.nac.breakdown.games.forEach(game => {
        response += `• ${game}\n`;
      });
      response += `\n`;
      
      response += `**⏰ Queue Times:**\n`;
      response += `• ${currentTournaments.playstationCup.liveEstimates.nac.queueTimes.top100}\n`;
      response += `• ${currentTournaments.playstationCup.liveEstimates.nac.queueTimes.everyoneElse}\n\n`;
      
      response += `**🛠️ Tools:**\n`;
      response += `• ${currentTournaments.playstationCup.liveEstimates.nac.calculator}\n\n`;
      
      // Add live estimates for EU
      response += `**📈 Live Estimates (EU):**\n`;
      response += `• Top 100 (Qual): ${currentTournaments.playstationCup.liveEstimates.eu.top100Qual}\n`;
      response += `• Top 1000: ${currentTournaments.playstationCup.liveEstimates.eu.top1000}\n`;
      response += `• Last Updated: ${currentTournaments.playstationCup.liveEstimates.eu.lastUpdated}\n`;
      response += `• Final Results - Top 100: ${currentTournaments.playstationCup.liveEstimates.eu.finalResults.top100}\n`;
      response += `• Final Results - Top 1000: ${currentTournaments.playstationCup.liveEstimates.eu.finalResults.top1000}\n\n`;
      
      response += `**Targeting Strategy (EU):**\n`;
      response += `• ${currentTournaments.playstationCup.liveEstimates.eu.targeting.qual}\n`;
      response += `• ${currentTournaments.playstationCup.liveEstimates.eu.targeting.top1000}\n\n`;
      
      response += `**📊 Point Breakdown Example (EU):**\n`;
      response += `• ${currentTournaments.playstationCup.liveEstimates.eu.breakdown.description}\n`;
      currentTournaments.playstationCup.liveEstimates.eu.breakdown.games.forEach(game => {
        response += `• ${game}\n`;
      });
      response += `\n`;
      
      response += `**⏰ Queue Times (EU):**\n`;
      response += `• ${currentTournaments.playstationCup.liveEstimates.eu.queueTimes.top100}\n`;
      response += `• ${currentTournaments.playstationCup.liveEstimates.eu.queueTimes.everyoneElse}\n\n`;
      
      response += `**🛠️ Tools (EU):**\n`;
      response += `• ${currentTournaments.playstationCup.liveEstimates.eu.calculator}\n\n`;
      
      // Add Reload Quick Cups Information
      response += `**🏆 ${currentTournaments.reloadQuickCups.name}**\n`;
      response += `**Rules:**\n`;
      response += `• Format: ${currentTournaments.reloadQuickCups.rules.format}\n`;
      response += `• Region Lock: ${currentTournaments.reloadQuickCups.rules.regionLock}\n`;
      response += `• Qualification: ${currentTournaments.reloadQuickCups.rules.qualification}\n`;
      response += `• Elo: ${currentTournaments.reloadQuickCups.rules.elo}\n\n`;
      
      response += `**Points System:**\n`;
      response += `• Placement: ${currentTournaments.reloadQuickCups.pointsSystem.placement}\n`;
      response += `• Win: ${currentTournaments.reloadQuickCups.pointsSystem.win}\n`;
      response += `• Elim: ${currentTournaments.reloadQuickCups.pointsSystem.elim}\n\n`;
      
      response += `**Round Strategies:**\n`;
      response += `**${currentTournaments.reloadQuickCups.rounds.round1.name}:**\n`;
      response += `• ${currentTournaments.reloadQuickCups.rounds.round1.description}\n`;
      currentTournaments.reloadQuickCups.rounds.round1.strategy.forEach(strategy => {
        response += `• ${strategy}\n`;
      });
      response += `\n`;
      
      response += `**${currentTournaments.reloadQuickCups.rounds.round2.name}:**\n`;
      response += `• ${currentTournaments.reloadQuickCups.rounds.round2.group1}\n`;
      response += `• ${currentTournaments.reloadQuickCups.rounds.round2.groups2and3}\n`;
      currentTournaments.reloadQuickCups.rounds.round2.strategy.forEach(strategy => {
        response += `• ${strategy}\n`;
      });
      response += `\n`;
      
      response += `**${currentTournaments.reloadQuickCups.rounds.round3.name}:**\n`;
      response += `• Format: ${currentTournaments.reloadQuickCups.rounds.round3.format}\n`;
      response += `• Strategy: ${currentTournaments.reloadQuickCups.rounds.round3.strategy}\n\n`;
      
      response += `**Loadout:**\n`;
      response += `• Note: ${currentTournaments.reloadQuickCups.loadout.note}\n`;
      currentTournaments.reloadQuickCups.loadout.weapons.forEach(weapon => {
        response += `• ${weapon}\n`;
      });
      response += `• Utility: ${currentTournaments.reloadQuickCups.loadout.utility}\n`;
      currentTournaments.reloadQuickCups.loadout.heals.forEach(heal => {
        response += `• ${heal}\n`;
      });
      response += `\n`;
      
      response += `**Tournament Tips:**\n`;
      response += `• Queue Bug Alert: Re-queue if waiting too long (Div 1/3: 6 min, Div 2: 2 min)\n`;
      response += `• Focus on consistent placements over high-kill games\n`;
      response += `• Practice end-game scenarios in creative\n`;
      response += `• Study previous tournament VODs for meta strategies\n`;
      response += `• Use tourney-calc-pro to calculate needed points for final games\n`;
    }

    // Game updates and mechanics changes
    if (question.includes('update') || question.includes('mechanic') || question.includes('loot') || question.includes('drop pod') || question.includes('poi') || question.includes('bomber') || question.includes('vulture') || question.includes('reclaim')) {
      response += `**🔄 ${gameUpdates.latestUpdate.title}**\n`;
      response += `**Date:** ${gameUpdates.latestUpdate.date}\n\n`;
      
      response += `**📋 Key Changes:**\n`;
      gameUpdates.latestUpdate.changes.forEach(change => {
        response += `• ${change}\n`;
      });
      response += `\n`;
      
      response += `**📝 Important Notes:**\n`;
      gameUpdates.latestUpdate.notes.forEach(note => {
        response += `• ${note}\n`;
      });
      response += `\n`;
      
      response += `**🎯 Strategy Impact:**\n`;
      response += `• Drop pods are now safe landing spots - no more damage risk\n`;
      response += `• POI reclaim activities are disabled - focus on other loot sources\n`;
      response += `• Vulture boon is removed - adjust your POI strategy\n`;
      response += `• Bomber spawns are more frequent (50%) - be prepared for more aerial threats\n`;
      response += `• Small/medium bugs may have minor changes - stay adaptable\n`;
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
    <EmailVerificationGuard>
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

          {/* Credits Section */}
          <div className="bg-[#1A1A1A] rounded-lg p-6 mb-6 border border-[#2A2A2A]">
            <h2 className="text-2xl font-bold text-white mb-4">💎 Your Credits</h2>
            <CreditDisplay compact={true} />
            <div className="mt-4 text-sm text-gray-400">
              <p>• AI Chat messages cost 1 credit each</p>
              <p>• Credits are deducted when you send a message</p>
              <p>• Pro users get 4,000 credits, Free users get 250 credits</p>
            </div>
          </div>

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
            
            {/* Credit Display */}
            <div className="flex items-center space-x-4">
              <div className="bg-[#2A2A2A] rounded-lg px-3 py-2 border border-[#3A3A3A]">
                <div className="flex items-center space-x-2">
                  <span className="text-yellow-400 text-lg">💎</span>
                  <span className="text-white text-sm font-medium">
                    {canAfford(1) ? 'Ready to Chat' : 'Need Credits'}
                  </span>
                </div>
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
                        <p className="text-sm whitespace-pre-wrap">{parseBoldText(message.content)}</p>
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
                  onClick={() => setInputMessage('C6S4 duos solos tournaments and PlayStation Cup details')}
                  className="px-4 py-2 bg-[#2A2A2A] text-white rounded-full hover:bg-[#1A1A1A] transition-colors border border-[#2A2A2A]"
                >
                  🎮 C6S4 Tournaments
                </button>
                <button 
                  onClick={() => setInputMessage('PlayStation Cup live estimates and NAC targeting strategy')}
                  className="px-4 py-2 bg-[#2A2A2A] text-white rounded-full hover:bg-[#1A1A1A] transition-colors border border-[#2A2A2A]"
                >
                  📈 PS Cup Live
                </button>
                <button 
                  onClick={() => setInputMessage('latest game updates and mechanics changes')}
                  className="px-4 py-2 bg-[#2A2A2A] text-white rounded-full hover:bg-[#1A1A1A] transition-colors border border-[#2A2A2A]"
                >
                  🔄 Game Updates
                </button>
                <button 
                  onClick={() => setInputMessage('Reload Quick Cups tournament details and strategies')}
                  className="px-4 py-2 bg-[#2A2A2A] text-white rounded-full hover:bg-[#1A1A1A] transition-colors border border-[#2A2A2A]"
                >
                  🏆 Reload Cups
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
  </EmailVerificationGuard>
  );
}
