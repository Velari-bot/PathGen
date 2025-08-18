'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import FortniteStatsDisplay from '@/components/FortniteStatsDisplay';
import { FirebaseService, FortniteData, ChatMessage } from '@/lib/firebase-service';
import { UsageTracker } from '@/lib/usage-tracker';

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
      // Save user message to Firebase
      await FirebaseService.addMessage(currentChatId, {
        chatId: currentChatId,
        userId: user.uid,
        role: 'user',
        content: inputMessage,
        type: 'text',
        aiResponse: undefined
      });

      // Track usage for AI messages
      await UsageTracker.incrementUsage(user.uid, 'messagesUsed');

      // Get AI response from API
      const aiResponse = await generateAIResponse(inputMessage, fortniteStats);
      
      const assistantMessage = {
        role: 'assistant' as const,
        content: aiResponse,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Save AI response to Firebase
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

      // Update chat message count
      await FirebaseService.updateChat(currentChatId, {
        messageCount: messages.length + 2, // +2 for user and AI message
        updatedAt: new Date()
      });

    } catch (error) {
      console.error('Error generating AI response:', error);
      const errorMessage = {
        role: 'assistant' as const,
        content: 'Sorry, I encountered an error while processing your request. Please try again.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
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

    // Tournament and competitive questions
    if (question.includes('tournament') || question.includes('fncs') || question.includes('competitive') || question.includes('qualify')) {
      return `🏆 **Tournament Information - NA Region** 🏆\n\n**Current FNCS Cup Results:**\n• Top 100: 332 points\n• Top 1800: 276 points\n\n**Division Targets:**\n• **Division 1:** 650+ points cumulative (6 min queue)\n• **Division 2:** 640+ points cumulative (2 min queue)\n• **Division 3:** 515+ points cumulative (6 min queue)\n\n**Tips for Tournament Success:**\n• Use 🤖tourney-calc-pro to calculate your targets\n• Re-queue after safe time to avoid bugs\n• Focus on consistent placements over high-elim games\n• Practice your drop spots and rotations\n• Stay calm under pressure - every point matters!\n\nWhat division are you aiming for? I can give you specific strategies!`;
    }

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
    return `I can help you improve your Fortnite skills! I can see you have:\n\n• ${playerStats.matches} total matches\n• ${playerStats.top1} victories\n• ${playerStats.kd?.toFixed(2)} K/D ratio\n• ${((playerStats.top10 / Math.max(playerStats.matches, 1)) * 100).toFixed(1)}% top 10 rate\n\n**Ask me about:**\n• Improving your K/D ratio\n• Building techniques\n• Win strategies\n• Loadout optimization\n• Rotation strategies\n• **Drop locations and POI analysis**\n• **Tournament strategies and qualification targets**\n• **📊 Comprehensive performance analysis**\n• **🎮 Match history breakdown**\n• **📈 Detailed statistics**\n\n**Current Info:** Check the left panels for:\n• Live NA tournament results and division targets\n• Complete POI drop analysis with ratings, loot, metal, and survival rates\n\n**New Features:**\n• Ask for "comprehensive analysis" for detailed breakdown\n• Ask for "match history" for recent performance insights\n• Use "Show More" buttons in stats for expanded view\n\nWhat would you like to work on?`;
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
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
    <div className="min-h-screen bg-gradient-dark">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-4">🤖 AI Fortnite Coach</h1>
            <p className="text-xl text-gray-300">
              Get personalized coaching based on your actual gameplay data
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Stats Panel */}
            <div className="space-y-6">
              <div className="bg-gray-800/50 rounded-lg p-6">
                <h2 className="text-2xl font-bold text-white mb-4">📊 Your Performance Stats</h2>
                <FortniteStatsDisplay 
                  stats={fortniteStats} 
                  isLoading={isLoadingStats}
                  showModes={true}
                  compact={true}
                />
              </div>

              <div className="bg-gray-800/50 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-white mb-4">💡 Coaching Tips</h3>
                <div className="space-y-3 text-sm text-gray-300">
                  <div className="flex items-start space-x-2">
                    <span className="text-blue-400">•</span>
                    <span>Ask me about specific areas you want to improve</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <span className="text-green-400">•</span>
                    <span>Get personalized advice based on your stats</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <span className="text-purple-400">•</span>
                    <span>Learn strategies for your skill level</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <span className="text-yellow-400">•</span>
                    <span>Practice drills and techniques</span>
                  </div>
                </div>
              </div>

              {/* Tournament Information */}
              <div className="bg-gray-800/50 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-white mb-4">🏆 Tournament Info - NA</h3>
                <div className="space-y-4 text-sm text-gray-300">
                  {/* FNCS Cup Results */}
                  <div className="bg-blue-600/10 border border-blue-600/20 rounded-lg p-3">
                    <h4 className="text-blue-400 font-semibold mb-2">🏆 C6S4 CHAMPION PJ FNCS CUP</h4>
                    <div className="space-y-1 text-xs">
                      <p><span className="text-blue-300">Top 100:</span> 332 points</p>
                      <p><span className="text-blue-300">Top 1800:</span> 276 points</p>
                    </div>
                  </div>

                  {/* Division 1 */}
                  <div className="bg-green-600/10 border border-green-600/20 rounded-lg p-3">
                    <h4 className="text-green-400 font-semibold mb-2">1️⃣ DIVISION 1</h4>
                    <div className="space-y-1 text-xs">
                      <p><span className="text-green-300">Day 1 Top 33:</span> 333 points</p>
                      <p><span className="text-green-300">Day 1 Top 100:</span> 214 points</p>
                      <p><span className="text-green-300">Cumulative Target:</span> 650+ points</p>
                      <p className="text-green-300/70">Queue: 6 min safe time</p>
                    </div>
                  </div>

                  {/* Division 2 */}
                  <div className="bg-yellow-600/10 border border-yellow-600/20 rounded-lg p-3">
                    <h4 className="text-yellow-400 font-semibold mb-2">2️⃣ DIVISION 2</h4>
                    <div className="space-y-1 text-xs">
                      <p><span className="text-yellow-300">Day 1 Top 40:</span> 333 points</p>
                      <p><span className="text-yellow-300">Day 1 Top 100:</span> 278 points</p>
                      <p><span className="text-yellow-300">Day 1 Top 200:</span> 229 points</p>
                      <p><span className="text-yellow-300">Day 2 Top 100:</span> 255+ points</p>
                      <p><span className="text-yellow-300">Day 2 Top 200:</span> 200+ points</p>
                      <p><span className="text-yellow-300">Cumulative Target:</span> 640+ points</p>
                      <p className="text-yellow-300/70">Queue: 2 min safe time</p>
                    </div>
                  </div>

                  {/* Division 3 */}
                  <div className="bg-purple-600/10 border border-purple-600/20 rounded-lg p-3">
                    <h4 className="text-purple-400 font-semibold mb-2">3️⃣ DIVISION 3</h4>
                    <div className="space-y-1 text-xs">
                      <p><span className="text-purple-300">Day 1 Top 200:</span> 268 points</p>
                      <p><span className="text-purple-300">Day 1 Top 1000:</span> 213 points</p>
                      <p><span className="text-purple-300">Day 1 Top 2500:</span> 139 points</p>
                      <p><span className="text-purple-300">Day 2 Top 200:</span> 255+ points</p>
                      <p><span className="text-purple-300">Day 2 Top 1000:</span> 200+ points</p>
                      <p><span className="text-purple-300">Cumulative Target:</span> 515+ points</p>
                      <p className="text-purple-300/70">Queue: 6 min safe time</p>
                    </div>
                  </div>

                  {/* Quick Reference */}
                  <div className="bg-gray-600/10 border border-gray-600/20 rounded-lg p-3">
                    <h4 className="text-gray-300 font-semibold mb-2">📊 Quick Reference</h4>
                    <div className="space-y-1 text-xs text-gray-400">
                      <p>• Use 🤖tourney-calc-pro for target calculations</p>
                      <p>• Re-queue after safe time to avoid bugs</p>
                      <p>• Play for experience even if not qualifying</p>
                      <p>• Elo resets on Day 2 for Division 3</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* POI Drop Data */}
            <div className="bg-gray-800/50 rounded-lg p-6">
              <h3 className="text-xl font-semibold text-white mb-4">🗺️ POI Drop Analysis</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-gray-300 border-collapse">
                  <thead>
                    <tr className="border-b border-gray-600">
                      <th className="text-left p-2 bg-gray-700/50">POI</th>
                      <th className="text-left p-2 bg-gray-700/50">Rating</th>
                      <th className="text-left p-2 bg-gray-700/50">Loot</th>
                      <th className="text-left p-2 bg-gray-700/50">Metal</th>
                      <th className="text-left p-2 bg-gray-700/50">Avg Teams</th>
                      <th className="text-left p-2 bg-gray-700/50">Survival</th>
                    </tr>
                  </thead>
                  <tbody className="space-y-1">
                    <tr className="border-b border-gray-600/30">
                      <td className="p-2 font-medium text-yellow-400">SuperNova</td>
                      <td className="p-2">13</td>
                      <td className="p-2">27</td>
                      <td className="p-2">7,700</td>
                      <td className="p-2">2.1</td>
                      <td className="p-2 text-green-400">57%</td>
                    </tr>
                    <tr className="border-b border-gray-600/30">
                      <td className="p-2 font-medium text-yellow-400">Shogun's</td>
                      <td className="p-2">14</td>
                      <td className="p-2">48</td>
                      <td className="p-2">200</td>
                      <td className="p-2">1.66</td>
                      <td className="p-2 text-green-400">59%</td>
                    </tr>
                    <tr className="border-b border-gray-600/30">
                      <td className="p-2 font-medium text-yellow-400">Demon's</td>
                      <td className="p-2">19</td>
                      <td className="p-2">74</td>
                      <td className="p-2">500</td>
                      <td className="p-2">1.73</td>
                      <td className="p-2 text-yellow-400">49%</td>
                    </tr>
                    <tr className="border-b border-gray-600/30">
                      <td className="p-2 font-medium text-yellow-400">Outlaw Oasis</td>
                      <td className="p-2">28</td>
                      <td className="p-2">24</td>
                      <td className="p-2">1,900</td>
                      <td className="p-2">0.87</td>
                      <td className="p-2 text-green-400">67%</td>
                    </tr>
                    <tr className="border-b border-gray-600/30">
                      <td className="p-2 font-medium text-yellow-400">Kappa</td>
                      <td className="p-2">30</td>
                      <td className="p-2">50</td>
                      <td className="p-2">6,000</td>
                      <td className="p-2">1.51</td>
                      <td className="p-2 text-green-400">55%</td>
                    </tr>
                    <tr className="border-b border-gray-600/30">
                      <td className="p-2 font-medium text-yellow-400">Outpost</td>
                      <td className="p-2">32</td>
                      <td className="p-2">57</td>
                      <td className="p-2">2,200</td>
                      <td className="p-2">1.48</td>
                      <td className="p-2 text-green-400">55%</td>
                    </tr>
                    <tr className="border-b border-gray-600/30">
                      <td className="p-2 font-medium text-yellow-400">Rebel Base</td>
                      <td className="p-2">33</td>
                      <td className="p-2">49</td>
                      <td className="p-2">8,300</td>
                      <td className="p-2">1.31</td>
                      <td className="p-2 text-green-400">55%</td>
                    </tr>
                    <tr className="border-b border-gray-600/30">
                      <td className="p-2 font-medium text-yellow-400">Top Left Split</td>
                      <td className="p-2">34</td>
                      <td className="p-2">78</td>
                      <td className="p-2">300</td>
                      <td className="p-2">1.31</td>
                      <td className="p-2 text-green-400">64%</td>
                    </tr>
                    <tr className="border-b border-gray-600/30">
                      <td className="p-2 font-medium text-yellow-400">The Hive</td>
                      <td className="p-2">35</td>
                      <td className="p-2">81</td>
                      <td className="p-2">600</td>
                      <td className="p-2">1.26</td>
                      <td className="p-2 text-green-400">53%</td>
                    </tr>
                    <tr className="border-b border-gray-600/30">
                      <td className="p-2 font-medium text-yellow-400">O.X.R HQ</td>
                      <td className="p-2">41</td>
                      <td className="p-2">50</td>
                      <td className="p-2">10,000</td>
                      <td className="p-2">1.23</td>
                      <td className="p-2 text-green-400">61%</td>
                    </tr>
                    <tr className="border-b border-gray-600/30">
                      <td className="p-2 font-medium text-yellow-400">Rainbow Fields</td>
                      <td className="p-2">41</td>
                      <td className="p-2">55</td>
                      <td className="p-2">2,400</td>
                      <td className="p-2">1.38</td>
                      <td className="p-2 text-green-400">65%</td>
                    </tr>
                    <tr className="border-b border-gray-600/30">
                      <td className="p-2 font-medium text-yellow-400">First Order</td>
                      <td className="p-2">42</td>
                      <td className="p-2">56</td>
                      <td className="p-2">7,500</td>
                      <td className="p-2">1.41</td>
                      <td className="p-2 text-green-400">62%</td>
                    </tr>
                    <tr className="border-b border-gray-600/30">
                      <td className="p-2 font-medium text-yellow-400">Top Middle Split</td>
                      <td className="p-2">44</td>
                      <td className="p-2">55</td>
                      <td className="p-2">700</td>
                      <td className="p-2">0.98</td>
                      <td className="p-2 text-green-400">69%</td>
                    </tr>
                    <tr className="border-b border-gray-600/30">
                      <td className="p-2 font-medium text-yellow-400">Swarm Stash</td>
                      <td className="p-2">46</td>
                      <td className="p-2">56</td>
                      <td className="p-2">3,000</td>
                      <td className="p-2">1.09</td>
                      <td className="p-2 text-green-400">58%</td>
                    </tr>
                    <tr className="border-b border-gray-600/30">
                      <td className="p-2 font-medium text-yellow-400">Wharf Split</td>
                      <td className="p-2">54</td>
                      <td className="p-2">47</td>
                      <td className="p-2">3,200</td>
                      <td className="p-2">1.06</td>
                      <td className="p-2 text-green-400">72%</td>
                    </tr>
                    <tr className="border-b border-gray-600/30">
                      <td className="p-2 font-medium text-yellow-400">Shining Span</td>
                      <td className="p-2">51</td>
                      <td className="p-2">40</td>
                      <td className="p-2">2,600</td>
                      <td className="p-2">0.68</td>
                      <td className="p-2 text-green-400">64%</td>
                    </tr>
                    <tr className="border-b border-gray-600/30">
                      <td className="p-2 font-medium text-yellow-400">Canyon</td>
                      <td className="p-2">56</td>
                      <td className="p-2">71</td>
                      <td className="p-2">3,300</td>
                      <td className="p-2">1.43</td>
                      <td className="p-2 text-green-400">65%</td>
                    </tr>
                    <tr className="border-b border-gray-600/30">
                      <td className="p-2 font-medium text-yellow-400">Foxy</td>
                      <td className="p-2">30</td>
                      <td className="p-2">38</td>
                      <td className="p-2">3,400</td>
                      <td className="p-2">1.3</td>
                      <td className="p-2 text-green-400">62%</td>
                    </tr>
                    <tr className="border-b border-gray-600/30">
                      <td className="p-2 font-medium text-yellow-400">Canyon Tunnel</td>
                      <td className="p-2">54</td>
                      <td className="p-2">40</td>
                      <td className="p-2">2,100</td>
                      <td className="p-2">0.74</td>
                      <td className="p-2 text-green-400">69%</td>
                    </tr>
                    <tr className="border-b border-gray-600/30">
                      <td className="p-2 font-medium text-yellow-400">Bottom Right Split</td>
                      <td className="p-2">60</td>
                      <td className="p-2">34</td>
                      <td className="p-2">200</td>
                      <td className="p-2">0.23</td>
                      <td className="p-2 text-green-400">71%</td>
                    </tr>
                    <tr className="border-b border-gray-600/30">
                      <td className="p-2 font-medium text-yellow-400">FO Split Drop</td>
                      <td className="p-2">85</td>
                      <td className="p-2">61</td>
                      <td className="p-2">3,500</td>
                      <td className="p-2">0.99</td>
                      <td className="p-2 text-green-400">79%</td>
                    </tr>
                    <tr className="border-b border-gray-600/30">
                      <td className="p-2 font-medium text-yellow-400">Ranger's Ruin</td>
                      <td className="p-2">64</td>
                      <td className="p-2">109</td>
                      <td className="p-2">9,300</td>
                      <td className="p-2">1.38</td>
                      <td className="p-2 text-green-400">52%</td>
                    </tr>
                    <tr className="border-b border-gray-600/30">
                      <td className="p-2 font-medium text-yellow-400">Shiny Shafts</td>
                      <td className="p-2">83</td>
                      <td className="p-2">55</td>
                      <td className="p-2">9,600</td>
                      <td className="p-2">0.71</td>
                      <td className="p-2 text-green-400">73%</td>
                    </tr>
                    <tr className="border-b border-gray-600/30">
                      <td className="p-2 font-medium text-yellow-400">Pumped Power</td>
                      <td className="p-2">97</td>
                      <td className="p-2">38</td>
                      <td className="p-2">1,600</td>
                      <td className="p-2">0.26</td>
                      <td className="p-2 text-green-400">75%</td>
                    </tr>
                    <tr className="border-b border-gray-600/30">
                      <td className="p-2 font-medium text-yellow-400">Construction Site</td>
                      <td className="p-2">102</td>
                      <td className="p-2">47</td>
                      <td className="p-2">2,000</td>
                      <td className="p-2">0.39</td>
                      <td className="p-2 text-green-400">75%</td>
                    </tr>
                    <tr className="border-b border-gray-600/30">
                      <td className="p-2 font-medium text-yellow-400">Superman Icy Biome</td>
                      <td className="p-2">109</td>
                      <td className="p-2">53</td>
                      <td className="p-2">5,300</td>
                      <td className="p-2">0.54</td>
                      <td className="p-2 text-green-400">81%</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="mt-4 text-xs text-gray-400">
                <p><span className="text-yellow-400">Rating:</span> Lower = Better (1-109 scale)</p>
                <p><span className="text-blue-400">Loot:</span> Number of chests/items</p>
                <p><span className="text-green-400">Metal:</span> Building materials available</p>
                <p><span className="text-purple-400">Avg Teams:</span> Average teams landing</p>
                <p><span className="text-orange-400">Survival:</span> Survival rate percentage</p>
              </div>
            </div>

            {/* Chat Panel */}
            <div className="bg-gray-800/50 rounded-lg p-6">
              <h2 className="text-2xl font-bold text-white mb-4">💬 AI Coaching Chat</h2>
              
              {/* Messages */}
              <div className="h-96 overflow-y-auto mb-4 space-y-3">
                {messages.length === 0 ? (
                  <div className="text-center text-gray-400 py-8">
                    <p>Start a conversation with your AI coach!</p>
                    <p className="text-sm">Ask about improving your K/D, building techniques, or any Fortnite strategy.</p>
                  </div>
                ) : (
                  messages.map((message, index) => (
                    <div
                      key={index}
                      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                          message.role === 'user'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-700 text-white'
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                        <p className="text-xs opacity-70 mt-1">
                          {message.timestamp.toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))
                )}
                {isLoadingResponse && (
                  <div className="flex justify-start">
                    <div className="bg-gray-700 text-white px-4 py-2 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span className="text-sm">AI is thinking...</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Input */}
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask me about improving your Fortnite skills..."
                  className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:border-blue-500"
                  disabled={isLoadingResponse}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!inputMessage.trim() || isLoadingResponse}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors"
                >
                  Send
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
