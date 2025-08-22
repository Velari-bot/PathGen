'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import FortniteStatsDisplay from '@/components/FortniteStatsDisplay';
import { FirebaseService, FortniteData, ChatMessage } from '@/lib/firebase-service';
import { UsageTracker } from '@/lib/usage-tracker';
import { DRONE_SPAWN_DATA, getDroneSpawnInfo, getDroneStrategyByPlaystyle } from '@/lib/drone-spawn-data';



export default function AIPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [fortniteStats, setFortniteStats] = useState<FortniteData | null>(null);
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
      const stats = await FirebaseService.getFortniteData(user!.uid);
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
      
      // Create chat document in Firebase
      await FirebaseService.createChat({
        userId: user.uid,
        title: 'AI Coaching Session',
        messageCount: 0,
        type: 'coaching',
        status: 'active',
        tags: ['fortnite', 'coaching', 'ai']
      });
      
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
      // Try to save user message to Firebase, but don't fail if it doesn't work
      try {
        await FirebaseService.addMessage(currentChatId, {
          chatId: currentChatId,
          userId: user.uid,
          role: 'user',
          content: inputMessage,
          type: 'text'
        });
        console.log('✅ User message saved to Firebase');
      } catch (firebaseError) {
        console.warn('⚠️ Could not save user message to Firebase:', firebaseError);
        // Save to local storage as fallback
        saveMessageToLocalStorage(userMessage);
      }

      // Track usage for AI messages (optional)
      try {
        await UsageTracker.incrementUsage(user.uid, 'messagesUsed');
      } catch (usageError) {
        console.warn('⚠️ Could not track usage:', usageError);
      }

      // Get AI response from API
      const aiResponse = await generateAIResponse(inputMessage, fortniteStats);
      
      const assistantMessage = {
        role: 'assistant' as const,
        content: aiResponse,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Try to save AI response to Firebase, but don't fail if it doesn't work
      try {
        await FirebaseService.addMessage(currentChatId, {
          chatId: currentChatId,
          userId: user.uid,
          role: 'assistant',
          content: aiResponse,
          type: 'text',
          aiResponse: {
            model: 'pathgen-ai',
            confidence: 0.9,
            suggestions: [],
            relatedTopics: ['fortnite', 'coaching'],
            followUpQuestions: [],
            tokensUsed: Math.ceil(aiResponse.length / 4) // Rough estimate
          }
        });
        console.log('✅ AI message saved to Firebase');
      } catch (firebaseError) {
        console.warn('⚠️ Could not save AI message to Firebase:', firebaseError);
        // Save to local storage as fallback
        saveMessageToLocalStorage(assistantMessage);
      }

      // Try to update chat message count, but don't fail if it doesn't work
      try {
        await FirebaseService.updateChat(currentChatId, {
          messageCount: messages.length + 2, // +2 for user and AI message
          updatedAt: new Date()
        });
      } catch (updateError) {
        console.warn('⚠️ Could not update chat count:', updateError);
      }

    } catch (error) {
      console.error('Error generating AI response:', error);
      
      // Create a more informative error message
      let errorContent = 'Sorry, I encountered an error while processing your request. Please try again.';
      
      if (error instanceof Error) {
        if (error.message.includes('OpenAI API')) {
          errorContent = 'Sorry, there was an issue with the AI service. Please check your connection and try again.';
        } else if (error.message.includes('Firebase') || error.message.includes('permissions')) {
          errorContent = 'Sorry, there was an issue saving your message, but I can still help you! The chat will work, but messages won\'t be saved.';
        } else if (error.message.includes('usage limit')) {
          errorContent = 'Sorry, you have reached your monthly message limit. Please upgrade your plan to continue.';
        }
      }
      
      const errorMessage = {
        role: 'assistant' as const,
        content: errorContent,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
      
      // Also show error in console for debugging
      console.error('Full error details:', error);
    } finally {
      setIsLoadingResponse(false);
    }
  };

  const generateAIResponse = async (userQuestion: string, stats: FortniteData | null): Promise<string> => {
    // Enhanced AI coaching logic using comprehensive data
    if (!stats) {
      return "I don't see any Fortnite stats yet. Connect your Epic account first to get personalized coaching!";
    }

    const question = userQuestion.toLowerCase();
    const { stats: playerStats, modes, rawOsirionData } = stats;



    // Analyze performance and provide coaching
    if (question.includes('kd') || question.includes('kill') || question.includes('death')) {
      const kd = playerStats.kd || 0;
      if (kd < 1.0) {
        return `Your current K/D ratio is ${kd.toFixed(2)}. To improve this:\n\n• Focus on survival over aggressive plays\n• Practice building for protection\n• Choose your fights wisely\n• Land in less populated areas to start\n\n**Tournament Context:** For competitive play, you'll need to balance aggression with survival. A 1.5+ K/D is typically needed for higher divisions.\n\nWould you like specific strategies for any of these areas?`;
      } else if (kd < 2.0) {
        return `Your K/D ratio of ${kd.toFixed(2)} shows solid fundamentals! To reach the next level:\n\n• Work on advanced building techniques\n• Improve your editing speed\n• Practice piece control\n• Analyze your VODs for positioning mistakes\n\n**Tournament Context:** You're in a good range for Division 2-3. Focus on consistent placements to qualify!`;
      } else {
        return `Excellent K/D ratio of ${kd.toFixed(2)}! You're clearly a skilled player. Consider:\n\n• Competitive play and tournaments\n• Coaching other players\n• Advanced strategies like box fighting\n• Optimizing your loadout for your playstyle\n\n**Tournament Context:** With this K/D, you should aim for Division 1! Focus on endgame positioning and rotation strategies.`;
      }
    }

    if (question.includes('win') || question.includes('victory') || question.includes('placement')) {
      const winRate = (playerStats.top1 / Math.max(playerStats.matches, 1)) * 100;
      if (winRate < 5) {
        return `Your win rate is ${winRate.toFixed(1)}%. To increase wins:\n\n• Focus on endgame positioning\n• Practice rotation strategies\n• Improve your building for late-game\n• Work on decision making under pressure\n\n**Tournament Context:** For competitive play, focus on consistent top 25s rather than wins. Top 25s with 1-2 elims are often better than risky plays for wins.`;
      } else if (winRate < 15) {
        return `Good win rate of ${winRate.toFixed(1)}%! To improve further:\n\n• Analyze your endgame VODs\n• Practice specific scenarios\n• Work on team coordination (if playing squads)\n• Optimize your loadout for different zones\n\n**Tournament Context:** This win rate suggests you can compete in Division 2-3. Focus on maintaining consistency across all games.`;
      } else {
        return `Impressive win rate of ${winRate.toFixed(1)}%! You're clearly doing something right. Consider:\n\n• Competitive play\n• Advanced strategies\n• Coaching others\n• Analyzing your gameplay for fine-tuning\n\n**Tournament Context:** With this win rate, you're ready for Division 1! Focus on optimizing your rotations and endgame strategies.`;
      }
    }

    if (question.includes('build') || question.includes('building')) {
      return `Building is crucial in Fortnite! Based on your stats:\n\n• Practice 90s and ramps consistently\n• Work on editing speed and accuracy\n• Learn piece control techniques\n• Practice building under pressure\n\n**Tournament Context:** In competitive play, building efficiency is key. You need to build quickly while conserving materials for endgame. Practice piece control and editing under pressure.\n\nWould you like specific building drills or techniques?`;
    }

    if (question.includes('rotation') || question.includes('position')) {
      return `Good rotations are key to consistent placements:\n\n• Always be aware of the storm\n• Plan your route before moving\n• Use natural cover and builds\n• Avoid open areas when possible\n• Practice different rotation strategies for each map\n\n**Tournament Context:** Tournament rotations are more predictable. Study common rotation patterns and practice them. Remember: safe rotations often beat aggressive ones in competitive play.`;
    }

    if (question.includes('drop') || question.includes('land') || question.includes('poi') || question.includes('location')) {
      return `🗺️ **POI Drop Analysis** 🗺️\n\n**Best Competitive Drops (Low Rating = Better):**\n• **SuperNova (Rating 13):** High metal (7,700), decent loot, 2.1 teams - Great for building practice\n• **Shogun's (Rating 14):** High loot (48), low metal (200), 1.66 teams - Good for early game fights\n• **Demon's (Rating 19):** High loot (74), low metal (500), 1.73 teams - Balanced option\n• **Outlaw Oasis (Rating 28):** Low teams (0.87), good survival (67%), decent metal (1,900)\n\n**High Survival Rate Drops:**\n• **Superman Icy Biome (81% survival):** Very low teams (0.54), good metal (5,300)\n• **FO Split Drop (79% survival):** Low teams (0.99), good loot (61)\n• **Bottom Right Split (71% survival):** Very low teams (0.23), low metal (200)\n\n**High Metal Locations:**\n• **O.X.R HQ:** 10,000 metal, 1.23 teams, 61% survival\n• **Rebel Base:** 8,300 metal, 1.31 teams, 55% survival\n• **SuperNova:** 7,700 metal, 2.1 teams, 57% survival\n\n**Tournament Strategy:** Choose based on your goals:\n• **Aggressive:** Shogun's, Demon's (higher loot, more fights)\n• **Survival:** Superman Icy Biome, FO Split Drop (higher survival rates)\n• **Building Practice:** O.X.R HQ, Rebel Base (high metal)\n• **Balanced:** SuperNova, Outlaw Oasis (good mix of all factors)\n\nWhat's your playstyle? I can recommend specific POIs!`;
    }

    if (question.includes('drone') || question.includes('spawn') || question.includes('supernova') || question.includes('shogun') || question.includes('kappa') || question.includes('canyon')) {
      const droneInfo = DRONE_SPAWN_DATA;
      let response = `🤖 **DRONE SPAWN LOCATIONS** 🤖\n\n`;
      
      response += `**Guaranteed Spawns (Once Per Game):**\n`;
      droneInfo.locations.forEach(location => {
        response += `• **${location.name}:** ${location.lootTier} loot, ${location.strategicValue} strategic value\n`;
        response += `  - ${location.notes[0]}\n`;
        response += `  - ${location.notes[1]}\n`;
      });
      
      response += `\n**Spawn Mechanics:**\n`;
      response += `• **Timing:** ${droneInfo.spawnMechanics.timing}\n`;
      response += `• **Frequency:** ${droneInfo.spawnMechanics.frequency}\n`;
      response += `• **Loot Quality:** ${droneInfo.spawnMechanics.lootQuality}\n`;
      response += `• **Strategic Advantage:** ${droneInfo.spawnMechanics.strategicAdvantage}\n`;
      
      response += `\n**Tournament Strategy:**\n`;
      response += `• **Early Game:** ${droneInfo.tournamentStrategy.earlyGame}\n`;
      response += `• **Mid Game:** ${droneInfo.tournamentStrategy.midGame}\n`;
      response += `• **End Game:** ${droneInfo.tournamentStrategy.endGame}\n`;
      response += `• **Risk Assessment:** ${droneInfo.tournamentStrategy.riskAssessment}\n`;
      
      response += `\n**Quick Suggestions:**\n`;
      response += `• Ask for "drone strategy aggressive" for aggressive playstyle tips\n`;
      response += `• Ask for "drone strategy passive" for survival-focused approach\n`;
      response += `• Ask for "drone strategy balanced" for hybrid strategies\n`;
      
      return response;
    }

    if (question.includes('drone strategy') && (question.includes('aggressive') || question.includes('w-key') || question.includes('frag'))) {
      const strategy = getDroneStrategyByPlaystyle('aggressive');
      let response = `⚔️ **AGGRESSIVE DRONE STRATEGY** ⚔️\n\n`;
      response += `**Recommended Locations:** ${strategy.recommendedLocations.join(', ')}\n`;
      response += `**Strategy:** ${strategy.strategy}\n\n`;
      response += `**Key Tips:**\n`;
      strategy.tips.forEach(tip => {
        response += `• ${tip}\n`;
      });
      response += `\n**Tournament Impact:** High elim potential but increased early game risk. Perfect for players confident in their mechanical skills and early game fighting ability.`;
      return response;
    }

    if (question.includes('drone strategy') && (question.includes('passive') || question.includes('survival') || question.includes('placement'))) {
      const strategy = getDroneStrategyByPlaystyle('passive');
      let response = `🛡️ **PASSIVE DRONE STRATEGY** 🛡️\n\n`;
      response += `**Recommended Locations:** ${strategy.recommendedLocations.join(', ')}\n`;
      response += `**Strategy:** ${strategy.strategy}\n\n`;
      response += `**Key Tips:**\n`;
      strategy.tips.forEach(tip => {
        response += `• ${tip}\n`;
      });
      response += `\n**Tournament Impact:** Consistent loot quality with lower early game risk. Ideal for players prioritizing placement points and consistent performance.`;
      return response;
    }

    if (question.includes('drone strategy') && (question.includes('balanced') || question.includes('hybrid') || question.includes('mixed'))) {
      const strategy = getDroneStrategyByPlaystyle('balanced');
      let response = `⚖️ **BALANCED DRONE STRATEGY** ⚖️\n\n`;
      response += `**Recommended Locations:** ${strategy.recommendedLocations.join(', ')}\n`;
      response += `**Strategy:** ${strategy.strategy}\n\n`;
      response += `**Key Tips:**\n`;
      strategy.tips.forEach(tip => {
        response += `• ${tip}\n`;
      });
      response += `\n**Tournament Impact:** Flexible approach that adapts to lobby strength and tournament situation. Best for experienced players who can read the game state.`;
      return response;
    }

    // EU Tournament Information Handler
    if (question.includes('eu') || question.includes('europe') || question.includes('fncs') || question.includes('division') || question.includes('div')) {
      let response = `🏆 **EU FNCS DIVISIONAL CUPS - WEEK 2** 🏆\n\n`;
      
      response += `**📅 Day 1 Results (Complete):**\n`;
      response += `• **Division 1:** Top 33 - 669 points (was 660, +30min extension had limited impact)\n`;
      response += `• **Division 2:** Top 40 - 698 points (was 675, +30min extension matched predictions)\n`;
      response += `• **Division 3:** Top 300 - 573 points (was 560, +30min extension minimal impact)\n\n`;
      
      response += `**⏰ 30-Minute Extension Analysis:**\n`;
      response += `• **Div 1:** Many teams exhausted games, extension had low impact\n`;
      response += `• **Div 2:** ~50% of teams had extra games, extension worked as expected\n`;
      response += `• **Div 3:** Only ~25% of teams had games left, minimal impact\n\n`;
      
      response += `**🎯 Day 2 Targets (Current):**\n`;
      response += `• **Division 1:** Cumulative Top 33 - 675 points (estimate: 655-695)\n`;
      response += `• **Division 2:** Cumulative Top 40 - 685 points (estimate: 675-695)\n`;
      response += `• **Division 3:** Cumulative Top 300 - 560 points (estimate: 553-567)\n\n`;
      
      response += `**📊 Point Inflation Patterns:**\n`;
      response += `• **Div 1:** +50 points per 30 minutes (when teams have games)\n`;
      response += `• **Div 2:** +50 points per 30 minutes (when teams have games)\n`;
      response += `• **Div 3:** +40 points per 30 minutes (when teams have games)\n\n`;
      
      response += `**🔄 Current Status:**\n`;
      response += `• **Elo Resets:** All players start at 0 points for matchmaking\n`;
      response += `• **Queue Times:** Div 1 (6min), Div 2 (2min), Div 3 (6min)\n`;
      response += `• **Live Updates:** Coming every hour during play\n\n`;
      
      response += `**💡 Strategic Insights:**\n`;
      response += `• **Drone spawns** provide guaranteed high-tier loot for consistent performance\n`;
      response += `• **Extension impact** varies by division based on remaining games\n`;
      response += `• **Point targets** are dynamic - monitor live updates during play\n`;
      response += `• **Queue management** is critical - re-queue if waiting too long\n\n`;
      
      response += `**🤖 Ask me about:**\n`;
      response += `• "drone spawn locations" for guaranteed loot strategies\n`;
      response += `• "tournament calculator" to track your progress\n`;
      response += `• "division targets" for specific qualification goals\n`;
      
      return response;
    }

    // Division Targets and Qualification Handler
    if (question.includes('division target') || question.includes('qualification') || question.includes('points needed') || question.includes('how many points')) {
      let response = `🎯 **DIVISION QUALIFICATION TARGETS** 🎯\n\n`;
      
      response += `**🏆 EU FNCS Division Cups - Week 2**\n\n`;
      
      response += `**Division 1 (Top 33):**\n`;
      response += `• **Current Target:** 675 points\n`;
      response += `• **Safe Range:** 690-700 points\n`;
      response += `• **Day 1 Result:** 669 points\n`;
      response += `• **Points Needed:** 6+ points to qualify\n\n`;
      
      response += `**Division 2 (Top 40):**\n`;
      response += `• **Current Target:** 685 points\n`;
      response += `• **Safe Range:** 700-710 points\n`;
      response += `• **Day 1 Result:** 698 points\n`;
      response += `• **Points Needed:** Already qualified!\n\n`;
      
      response += `**Division 3 (Top 300):**\n`;
      response += `• **Current Target:** 560 points\n`;
      response += `• **Safe Range:** 570-580 points\n`;
      response += `• **Day 1 Result:** 573 points\n`;
      response += `• **Points Needed:** Already qualified!\n\n`;
      
      response += `**📊 Point Inflation:**\n`;
      response += `• **Div 1 & 2:** +50 points per 30 minutes\n`;
      response += `• **Div 3:** +40 points per 30 minutes\n`;
      response += `• **Note:** Only applies when teams have games remaining\n\n`;
      
      response += `**💡 Strategy Tips:**\n`;
      response += `• **Drone spawns** provide guaranteed high-tier loot for consistent performance\n`;
      response += `• **Monitor live updates** - targets change during play\n`;
      response += `• **Queue management** - re-queue if waiting too long\n`;
      response += `• **Use tournament calculator** to track your progress\n\n`;
      
      response += `**🤖 Ask me about:**\n`;
      response += `• "eu fncs division cups" for complete tournament info\n`;
      response += `• "drone spawn locations" for guaranteed loot strategies\n`;
      response += `• "tournament calculator" to calculate your needs\n`;
      
      return response;
    }

    if (question.includes('loadout') || question.includes('weapon') || question.includes('inventory')) {
      return `Your loadout should complement your playstyle:\n\n• AR for medium range\n• Shotgun for close combat\n• SMG for building fights\n• Healing items (shields, medkits)\n• Mobility items (shockwaves, launch pads)\n\n**Tournament Context:** In tournaments, prioritize healing over mobility. You'll often need to heal multiple times per game. Carry at least 6 shield potions and 3 medkits.\n\nWhat's your preferred playstyle? I can suggest specific loadouts.`;
    }

    // New comprehensive analysis using raw data
    if (question.includes('analysis') || question.includes('detailed') || question.includes('breakdown') || question.includes('comprehensive')) {
      let response = `📊 **Comprehensive Performance Analysis**\n\n`;
      response += `**Core Statistics:**\n`;
      response += `• ${playerStats.matches} total matches\n`;
      response += `• ${playerStats.top1} wins (${((playerStats.top1 / playerStats.matches) * 100).toFixed(1)}% win rate)\n`;
      response += `• K/D ratio: ${playerStats.kd.toFixed(2)}\n`;
      response += `• Average placement: ${playerStats.placement.toFixed(1)}\n`;
      response += `• Top 10 rate: ${((playerStats.top10 / playerStats.matches) * 100).toFixed(1)}%\n`;
      response += `• Total assists: ${playerStats.assists || 0}\n`;
      response += `• Average survival time: ${Math.round((playerStats.timeAlive || 0) / 60)} minutes\n\n`;
      
      if (rawOsirionData?.preferences) {
        response += `**Player Insights:**\n`;
        response += `• Preferred drop: ${rawOsirionData.preferences.preferredDrop || 'Unknown'}\n`;
        response += `• Weakest zone: ${rawOsirionData.preferences.weakestZone || 'Unknown'}\n`;
        response += `• Best weapon: ${rawOsirionData.preferences.bestWeapon || 'Unknown'}\n`;
        response += `• Average survival time: ${Math.round((rawOsirionData.preferences.avgSurvivalTime || 0) / 60)} minutes\n\n`;
      }
      
      if (rawOsirionData?.matches && rawOsirionData.matches.length > 0) {
        response += `**Recent Performance:**\n`;
        const recentMatches = rawOsirionData.matches.slice(0, 5);
        response += `Last 5 matches:\n`;
        recentMatches.forEach((match: any, index: number) => {
          response += `• Match ${index + 1}: #${match.placement} | ${match.kills || 0} kills | ${Math.round(match.damage || 0)} damage\n`;
        });
        response += `\n`;
      }
      
      response += `**Recommendations:**\n`;
      if (playerStats.kd < 1.0) {
        response += `• Focus on improving K/D ratio through better positioning\n`;
      }
      if ((playerStats.top1 / playerStats.matches) < 0.1) {
        response += `• Work on endgame strategies to increase win rate\n`;
      }
      if (playerStats.placement > 15) {
        response += `• Improve early game survival and rotation strategies\n`;
      }
      
      return response;
    }

    if (question.includes('matches') || question.includes('games') || question.includes('history') || question.includes('recent')) {
      if (rawOsirionData?.matches && rawOsirionData.matches.length > 0) {
        let response = `🎮 **Match History Analysis**\n\n`;
        response += `You've played ${rawOsirionData.matches.length} matches recently.\n\n`;
        
        // Calculate insights from match data
        const placements = rawOsirionData.matches.map((m: any) => m.placement);
        const kills = rawOsirionData.matches.map((m: any) => m.kills || 0);
        const damage = rawOsirionData.matches.map((m: any) => m.damage || 0);
        
        const bestPlacement = Math.min(...placements);
        const worstPlacement = Math.max(...placements);
        const totalKills = kills.reduce((a: number, b: number) => a + b, 0);
        const totalDamage = damage.reduce((a: number, b: number) => a + b, 0);
        const avgDamage = totalDamage / rawOsirionData.matches.length;
        
        response += `**Performance Range:**\n`;
        response += `• Best placement: #${bestPlacement}\n`;
        response += `• Worst placement: #${worstPlacement}\n`;
        response += `• Total kills: ${totalKills}\n`;
        response += `• Total damage: ${Math.round(totalDamage)}\n`;
        response += `• Average damage per match: ${Math.round(avgDamage)}\n\n`;
        
        response += `**Consistency Analysis:**\n`;
        const top10Count = placements.filter((p: number) => p <= 10).length;
        const top25Count = placements.filter((p: number) => p <= 25).length;
        response += `• Top 10 finishes: ${top10Count} (${((top10Count / placements.length) * 100).toFixed(1)}%)\n`;
        response += `• Top 25 finishes: ${top25Count} (${((top25Count / placements.length) * 100).toFixed(1)}%)\n`;
        
        // Identify patterns
        const highKillGames = kills.filter((k: number) => k >= 5).length;
        const lowKillGames = kills.filter((k: number) => k <= 1).length;
        response += `• High kill games (5+): ${highKillGames} (${((highKillGames / kills.length) * 100).toFixed(1)}%)\n`;
        response += `• Low kill games (0-1): ${lowKillGames} (${((lowKillGames / kills.length) * 100).toFixed(1)}%)\n`;
        
        return response;
      }
    }

    // Default response
    return `I can help you improve your Fortnite skills! I can see you have:\n\n• ${playerStats.matches} total matches\n• ${playerStats.top1} victories\n• ${playerStats.kd?.toFixed(2)} K/D ratio\n• ${((playerStats.top10 / Math.max(playerStats.matches, 1)) * 100).toFixed(1)}% top 10 rate\n\n**Ask me about:**\n• Improving your K/D ratio\n• Building techniques\n• Win strategies\n• Loadout optimization\n• Rotation strategies\n• **Drop locations and POI analysis**\n• **🤖 Drone spawn locations and strategies**\n• **Tournament strategies and qualification targets**\n• **📊 Comprehensive performance analysis**\n• **🎮 Match history breakdown**\n• **📈 Detailed statistics**\n\n**🏆 Tournament Information:**\n• **Icon Reload Cups** (Lachlan, Loserfruit, Bugha, Clix)\n• **EU FNCS Division Cups** - Week 2 Day 2 (Live Updates)\n• **Champion Crystal Cup** - Final Results\n• **Tournament Calculator** - Track your progress!\n\n**🤖 Drone Spawn Locations:**\n• **Supernova, Shogun, Kappa Kappa, Canyon** - Guaranteed epic+ loot\n• **Once per game** - Same spawn rate across all locations\n• **High strategic value** for tournament play\n\n**Current Info:** Check the panels for:\n• Live tournament results and division targets\n• Complete POI drop analysis with ratings, loot, metal, and survival rates\n• Interactive tournament calculator\n\n**New Features:**\n• Ask for "comprehensive analysis" for detailed breakdown\n• Ask for "match history" for recent performance insights\n• Ask about specific tournaments (icon reload, division, champion cup)\n• Ask for "drone spawn locations" for detailed drone strategies\n• Ask for "drone strategy aggressive/passive/balanced" for playstyle-specific tips\n• Ask for "eu fncs division cups" for live tournament updates
• Ask for "division targets and qualification" for qualification goals
• Use the tournament calculator to track your progress\n\nWhat would you like to work on?`;
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Add local storage functionality
  const saveMessageToLocalStorage = (message: any) => {
    try {
      const storageKey = `pathgen-chat-${currentChatId}`;
      const existingMessages = JSON.parse(localStorage.getItem(storageKey) || '[]');
      existingMessages.push({
        ...message,
        id: Date.now() + Math.random(), // Simple unique ID
        savedAt: new Date().toISOString()
      });
      localStorage.setItem(storageKey, JSON.stringify(existingMessages));
      console.log('✅ Message saved to local storage');
    } catch (error) {
      console.warn('⚠️ Could not save to local storage:', error);
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
                  <p className="text-white font-bold text-2xl">{fortniteStats.stats.matches}</p>
                    </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-white font-bold text-xl">🏆</span>
                  </div>
                  <p className="text-[#BFBFBF] text-sm mb-1">Wins</p>
                  <p className="text-white font-bold text-2xl">{fortniteStats.stats.top1}</p>
                    </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-yellow-500 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-white font-bold text-xl">⚔️</span>
                  </div>
                  <p className="text-[#BFBFBF] text-sm mb-1">K/D Ratio</p>
                  <p className="text-white font-bold text-2xl">{fortniteStats.stats.kd?.toFixed(2) || '0.00'}</p>
                    </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-white font-bold text-xl">🎯</span>
                  </div>
                  <p className="text-[#BFBFBF] text-sm mb-1">Top 10 Rate</p>
                  <p className="text-white font-bold text-2xl">{((fortniteStats.stats.top10 / Math.max(fortniteStats.stats.matches, 1)) * 100).toFixed(1)}%</p>
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
