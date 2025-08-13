'use client';

import React, { useState, useRef, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { FortniteStats } from '@/lib/fortnite';
import { epicService, EpicAccount } from '@/lib/epic';
import EpicAccountModal from '@/components/EpicAccountModal';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
}

export default function AIPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([
    {
      id: Date.now().toString(),
      title: 'New Chat',
      messages: [
        {
          id: '1',
          text: "Hello! I'm your PathGen AI assistant. I can help you optimize your Fortnite gameplay, analyze strategies, and provide personalized coaching. What would you like to know?",
          isUser: false,
          timestamp: new Date('2024-01-01T12:00:00'),
        }
      ],
      createdAt: new Date('2024-01-01T12:00:00'),
    }
  ]);
  const [currentConversationId, setCurrentConversationId] = useState<string>('');
  const [inputText, setInputText] = useState('');
  const [linkedEpicAccount, setLinkedEpicAccount] = useState<EpicAccount | null>(null);
  const [fortniteStats, setFortniteStats] = useState<FortniteStats | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [showChatLog, setShowChatLog] = useState(false);
  const [showEpicModal, setShowEpicModal] = useState(false);
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualUsername, setManualUsername] = useState('');
  const [trackerLink, setTrackerLink] = useState('');
  const [inputMethod, setInputMethod] = useState<'epic' | 'manual' | 'tracker'>('epic');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Set the current conversation ID after the component mounts
  useEffect(() => {
    console.log('useEffect triggered - conversations:', conversations.length, 'currentConversationId:', currentConversationId);
    if (conversations.length > 0 && !currentConversationId) {
      console.log('Setting currentConversationId to:', conversations[0].id);
      setCurrentConversationId(conversations[0].id);
    }
  }, [conversations, currentConversationId]);

  const currentConversation = conversations.find(c => c.id === currentConversationId);
  const messages = currentConversation?.messages || [];

  // Debug logging
  useEffect(() => {
    console.log('Current conversation state:', {
      currentConversationId,
      currentConversation: currentConversation?.id,
      messagesCount: messages.length,
      conversationsCount: conversations.length
    });
  }, [currentConversationId, currentConversation, messages, conversations]);

  const quickSuggestions = [
    "Generate fastest route",
    "Optimize for stealth",
    "Avoid high-traffic areas",
    "Improve building speed",
    "Analyze recent gameplay",
    "Get positioning tips"
  ];

  useEffect(() => {
    // Only scroll within the chat container when new messages are added
    if (messages.length > 0 && messagesEndRef.current) {
      const chatContainer = messagesEndRef.current.closest('.overflow-y-auto');
      if (chatContainer) {
        chatContainer.scrollTop = chatContainer.scrollHeight;
      }
    }
  }, [messages.length]); // Changed from [messages] to [messages.length]

  const scrollToBottom = () => {
    const chatContainer = messagesEndRef.current?.closest('.overflow-y-auto');
    if (chatContainer) {
      chatContainer.scrollTop = chatContainer.scrollHeight;
    }
  };

  const createNewChat = () => {
    // Check if we're at the 5 chat limit
    if (conversations.length >= 5) {
      alert('You have reached the maximum of 5 chats. Please delete an old chat to create a new one.');
      return;
    }

    const newChat: Conversation = {
      id: Date.now().toString(),
      title: 'New Chat',
      messages: [
        {
          id: '1',
          text: "Hello! I'm your PathGen AI assistant. I can help you optimize your Fortnite gameplay, analyze strategies, and provide personalized coaching. What would you like to know?",
          isUser: false,
          timestamp: new Date(),
        }
      ],
      createdAt: new Date(),
    };
    
    setConversations(prev => [newChat, ...prev]);
    setCurrentConversationId(newChat.id);
    setInputText('');
  };

  const deleteChat = (conversationId: string) => {
    if (conversations.length <= 1) {
      alert('You must keep at least one chat open.');
      return;
    }

    setConversations(prev => {
      const filtered = prev.filter(c => c.id !== conversationId);
      // If we're deleting the current chat, switch to the first available one
      if (conversationId === currentConversationId && filtered.length > 0) {
        setCurrentConversationId(filtered[0].id);
      }
      return filtered;
    });
  };

  const cleanupExpiredChats = () => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    setConversations(prev => {
      const validChats = prev.filter(c => c.createdAt > thirtyDaysAgo);
      // If all chats expired, create a new one
      if (validChats.length === 0) {
        const newChat: Conversation = {
          id: Date.now().toString(),
          title: 'New Chat',
          messages: [
            {
              id: '1',
              text: "Hello! I'm your PathGen AI assistant. I can help you optimize your Fortnite gameplay, analyze strategies, and provide personalized coaching. What would you like to know?",
              isUser: false,
              timestamp: new Date(),
            }
          ],
          createdAt: new Date(),
        };
        setCurrentConversationId(newChat.id);
        return [newChat];
      }
      // If current chat was deleted, switch to first available
      if (!validChats.find(c => c.id === currentConversationId) && validChats.length > 0) {
        setCurrentConversationId(validChats[0].id);
      }
      return validChats;
    });
  };

  // Clean up expired chats on component mount
  useEffect(() => {
    cleanupExpiredChats();
  }, []);

  // Load linked Epic account on component mount
  useEffect(() => {
    if (user) {
      loadLinkedEpicAccount();
      // Load manual username if it exists
      const savedUsername = localStorage.getItem('pathgen_manual_username');
      if (savedUsername) {
        setManualUsername(savedUsername);
        setInputMethod('manual');
      }
    }
  }, [user]);

  // Fetch Fortnite stats when Epic account changes or manual input is provided
  useEffect(() => {
    if (linkedEpicAccount) {
      fetchFortniteStats(linkedEpicAccount.displayName);
    } else if (manualUsername) {
      fetchFortniteStats(manualUsername);
    } else {
      setFortniteStats(null);
    }
  }, [linkedEpicAccount, manualUsername]);

  const loadLinkedEpicAccount = async () => {
    if (!user) return;

    try {
      const response = await fetch(`/api/user/get-epic-account?userId=${user.uid}`);
      if (response.ok) {
        const data = await response.json();
        setLinkedEpicAccount(data.epicAccount);
      }
    } catch (error) {
      console.error('Error loading linked Epic account:', error);
    }
  };

  const fetchFortniteStats = async (username: string) => {
    console.log('fetchFortniteStats called with username:', username);
    setIsLoadingStats(true);
    try {
      // Use the new server-side API route
      const response = await fetch('/api/fortnite/stats', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Failed to fetch Fortnite stats:', errorData);
        setFortniteStats(null);
        return;
      }

      const data = await response.json();
      console.log('Fortnite stats response:', data);
      
      if (data.success) {
        // API worked, set the stats
        setFortniteStats(data);
      } else if (data.blocked) {
        // API is blocked, show fallback options
        console.log('API blocked, showing fallback options');
        setFortniteStats({
          account: {
            id: 'fallback',
            name: username,
            platform: 'pc'
          },
          stats: {
            all: {
              wins: 0,
              top10: 0,
              kills: 0,
              kd: 0,
              matches: 0,
              winRate: 0,
              avgPlace: 0,
              avgKills: 0
            }
          },
          recentMatches: [],
          preferences: {
            preferredDrop: 'Unknown',
            weakestZone: 'Unknown',
            bestWeapon: 'Unknown',
            avgSurvivalTime: 0
          },
          fallback: data.fallback
        });
      } else {
        // Other error
        setFortniteStats(null);
      }
    } catch (error) {
      console.error('Error fetching Fortnite stats:', error);
      setFortniteStats(null);
    } finally {
      setIsLoadingStats(false);
    }
  };

  const handleEpicAccountLinked = (account: EpicAccount) => {
    setLinkedEpicAccount(account);
    setShowEpicModal(false);
    setInputMethod('epic');
  };

  const handleManualUsernameSubmit = () => {
    if (manualUsername.trim()) {
      setLinkedEpicAccount(null);
      setInputMethod('manual');
      setShowManualInput(false);
      // Save to localStorage for persistence
      localStorage.setItem('pathgen_manual_username', manualUsername.trim());
    }
  };

  const handleTrackerLinkSubmit = () => {
    if (trackerLink.trim()) {
      // Extract username from tracker link
      const usernameMatch = trackerLink.match(/fortnitetracker\.com\/profile\/([^\/\?]+)/);
      if (usernameMatch) {
        const username = usernameMatch[1];
        setManualUsername(username);
        setLinkedEpicAccount(null);
        setInputMethod('tracker');
        setShowManualInput(false);
        // Save to localStorage for persistence
        localStorage.setItem('pathgen_manual_username', username);
      } else {
        alert('Please enter a valid Fortnite Tracker link (e.g., https://fortnitetracker.com/profile/username)');
      }
    }
  };

  const clearAccountInfo = () => {
    console.log('clearAccountInfo called!');
    alert('Clearing account info...');
    setLinkedEpicAccount(null);
    setManualUsername('');
    setTrackerLink('');
    setInputMethod('epic');
    setFortniteStats(null);
    // Clear from localStorage
    localStorage.removeItem('pathgen_manual_username');
    console.log('Account info cleared successfully');
  };

  const switchConversation = (conversationId: string) => {
    setCurrentConversationId(conversationId);
    setInputText('');
  };

  const updateConversationTitle = (conversationId: string, title: string) => {
    setConversations(prev => 
      prev.map(c => c.id === conversationId ? { ...c, title } : c)
    );
  };

  const handleSendMessage = async (text: string) => {
    if (!text.trim()) return;

    console.log('=== SENDING MESSAGE ===');
    console.log('Text:', text);
    console.log('Current fortniteStats:', fortniteStats);
    console.log('Current conversation ID:', currentConversationId);

    const userMessage: Message = {
      id: Date.now().toString(),
      text: text.trim(),
      isUser: true,
      timestamp: new Date(),
    };

    // Update current conversation with user message
    setConversations(prev => 
      prev.map(c => 
        c.id === currentConversationId 
          ? { 
              ...c, 
              messages: [...c.messages, userMessage],
              title: c.title === 'New Chat' ? text.trim().slice(0, 30) + '...' : c.title
            }
          : c
      )
    );

    setInputText('');
    setIsTyping(true);

    try {
      console.log('Generating AI response...');
      // Get AI response (now async)
      const aiResponseText = await generateAIResponse(text);
      console.log('AI response received:', aiResponseText);
      
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: aiResponseText,
        isUser: false,
        timestamp: new Date(),
      };
      
      // Update conversation with AI response
      setConversations(prev => 
        prev.map(c => 
          c.id === currentConversationId 
            ? { ...c, messages: [...c.messages, aiResponse] }
            : c
        )
      );
    } catch (error) {
      console.error('Error generating AI response:', error);
      // Fallback response on error
      const fallbackResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: "I'm having trouble connecting right now. Please try again in a moment. If the problem persists, check your OpenAI API key configuration.",
        isUser: false,
        timestamp: new Date(),
      };
      
      setConversations(prev => 
        prev.map(c => 
          c.id === currentConversationId 
            ? { ...c, messages: [...c.messages, fallbackResponse] }
            : c
        )
      );
    } finally {
      setIsTyping(false);
      console.log('Message handling completed');
    }
  };

  const generateAIResponse = async (userInput: string): Promise<string> => {
    try {
      console.log('generateAIResponse called with:', userInput);
      console.log('Current fortniteStats:', fortniteStats);
      
      // Check if OpenAI API key is available (client-side check)
      if (typeof window !== 'undefined' && !process.env.NEXT_PUBLIC_OPENAI_API_KEY) {
        console.warn('OpenAI API key not found, using fallback responses');
        return getFallbackResponse(userInput);
      }

      // Build personalized context with user's stats
      let personalizedContext = 'You are PathGen AI, a Fortnite improvement coach. ';
      
      if (fortniteStats && fortniteStats.stats && fortniteStats.stats.all) {
        const stats = fortniteStats.stats.all;
        personalizedContext += `The player's current stats are: K/D Ratio: ${stats.kd || 'N/A'}, Win Rate: ${stats.winRate || 'N/A'}%, Matches Played: ${stats.matches || 'N/A'}, Average Placement: ${stats.avgPlace || 'N/A'}. `;
        personalizedContext += `Provide specific, actionable advice based on these exact stats. `;
      } else if (fortniteStats && fortniteStats.stats && fortniteStats.stats.all) {
        // This handles manually entered stats that are stored in fortniteStats
        const stats = fortniteStats.stats.all;
        personalizedContext += `The player's manually entered stats are: K/D Ratio: ${stats.kd}, Win Rate: ${stats.winRate}%, Matches Played: ${stats.matches}, Average Placement: ${stats.avgPlace}. `;
        personalizedContext += `Provide specific, actionable advice based on these exact stats. `;
      }
      
      personalizedContext += 'Focus on practical tips they can implement immediately. Keep responses under 200 words.';

      console.log('Sending personalized context:', personalizedContext);

      console.log('Calling OpenAI API...');
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userInput,
          context: personalizedContext,
          fortniteUsername: linkedEpicAccount?.displayName || manualUsername || 'Manual Input User'
        }),
      });

      if (!response.ok) {
        throw new Error(`API call failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('OpenAI API response:', data);

      if (data.error) {
        throw new Error(data.error);
      }

      return data.response || 'I apologize, but I encountered an error generating a response. Please try again.';
    } catch (error) {
      console.error('Error generating AI response:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return `I apologize, but I encountered an error: ${errorMessage}. Using fallback response instead.`;
    }
  };

  const getFallbackResponse = (userInput: string): string => {
    const responses = [
      "Based on your question, I recommend focusing on high ground positioning and building efficiency. Try practicing 90s in Creative mode for 15 minutes daily.",
      "For stealth gameplay, consider using natural cover, avoiding open areas, and timing your movements with the storm. Sound cues are crucial!",
      "To avoid high-traffic areas, stay away from named locations during the first few minutes. Focus on edge rotations and use vehicles strategically.",
      "Your building speed can be improved by practicing keybinds and building patterns. Start with simple ramps and gradually increase complexity.",
      "Great question! Let me analyze your recent gameplay patterns and provide specific recommendations for improvement.",
      "Positioning is key in Fortnite. Always try to maintain high ground advantage and use natural cover effectively."
    ];
    
    return responses[Math.floor(Math.random() * responses.length)];
  };

  const handleQuickSuggestion = (suggestion: string) => {
    console.log('Quick suggestion clicked:', suggestion);
    handleSendMessage(suggestion);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('Input change event fired:', e.target.value);
    setInputText(e.target.value);
  };

  const handleSendClick = () => {
    console.log('Send clicked, current inputText:', inputText);
    handleSendMessage(inputText);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      console.log('Enter key pressed, inputText:', inputText);
      handleSendMessage(inputText);
    }
  };

  const saveManualStats = (kd: number, winRate: number, matches: number, avgPlace: number) => {
    console.log('Saving manual stats:', { kd, winRate, matches, avgPlace });
    
    const manualStats: FortniteStats = {
      account: {
        id: 'manual',
        name: manualUsername || 'Manual Input User',
        platform: 'pc'
      },
      stats: {
        all: {
          kd: kd,
          winRate: winRate,
          matches: matches,
          avgPlace: avgPlace,
          kills: 0,
          wins: 0,
          top10: 0,
          avgKills: 0
        }
      },
      fallback: {
        manualCheckUrl: 'https://fortnitetracker.com',
        instructions: ['Enter your stats manually above for personalized coaching'],
        manualStatsForm: {
          kd: kd,
          winRate: winRate,
          matches: matches,
          avgPlace: avgPlace
        }
      },
      recentMatches: [],
      preferences: {
        preferredDrop: 'Custom Landing',
        weakestZone: 'Mid Game',
        bestWeapon: 'Assault Rifle',
        avgSurvivalTime: 15
      }
    };
    
    console.log('Setting fortniteStats to:', manualStats);
    setFortniteStats(manualStats);
  };

  return (
    <div className="min-h-screen bg-gradient-dark flex flex-col">
      <Navbar />
      
      {/* Main Content Container */}
      <div className="flex-1 relative z-10 max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-20">
        {/* Animated Background */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-20 w-32 h-32 bg-white/5 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-20 w-40 h-40 bg-white/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
          <div className="absolute top-1/2 left-1/2 w-24 h-24 bg-white/5 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '2s' }}></div>
          
          {/* Moving Lines */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white to-transparent animate-pulse"></div>
            <div className="absolute top-1/4 left-0 w-full h-px bg-gradient-to-r from-transparent via-white to-transparent animate-pulse" style={{ animationDelay: '1s' }}></div>
            <div className="absolute top-1/2 left-0 w-full h-px bg-gradient-to-r from-transparent via-white to-transparent animate-pulse" style={{ animationDelay: '2s' }}></div>
            <div className="absolute top-3/4 left-0 w-full h-px bg-gradient-to-r from-transparent via-white to-transparent animate-pulse" style={{ animationDelay: '3s' }}></div>
          </div>
        </div>

        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
            <span className="text-primary-text">PathGen</span>
            <br />
            <span className="text-gradient">AI Assistant</span>
          </h1>
          <p className="text-xl text-secondary-text">
            Your personal Fortnite improvement coach powered by AI
          </p>
        </div>

        {/* Chat Interface */}
        <div className="max-w-5xl mx-auto space-y-8">
          {/* Fortnite Account Input */}
          <div className="p-6 bg-white/5 border border-white/10 rounded-xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-white mb-2">
                  Fortnite Account
                </label>
                
                {/* Account Status Display */}
                {(linkedEpicAccount || manualUsername) ? (
                  <div className="flex items-center gap-3">
                    <div className="px-4 py-2 bg-green-500/20 border border-green-500/30 rounded-lg text-green-400 text-sm">
                      ✓ {linkedEpicAccount?.displayName || manualUsername}
                      {inputMethod === 'manual' && ' (Manual)'}
                      {inputMethod === 'tracker' && ' (Tracker)'}
                    </div>
                    <button
                      onClick={clearAccountInfo}
                      style={{ 
                        padding: '8px 12px', 
                        backgroundColor: 'rgba(255, 255, 255, 0.1)', 
                        color: 'white', 
                        borderRadius: '8px', 
                        fontSize: '14px',
                        border: 'none',
                        cursor: 'pointer',
                        zIndex: 9999,
                        position: 'relative'
                      }}
                    >
                      Change
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* Input Method Selection */}
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => {
                          console.log('Epic Account method selected!');
                          setInputMethod('epic');
                        }}
                        style={{ 
                          padding: '8px 12px', 
                          backgroundColor: inputMethod === 'epic' ? 'white' : 'rgba(255, 255, 255, 0.1)', 
                          color: inputMethod === 'epic' ? 'black' : 'white', 
                          borderRadius: '8px', 
                          fontSize: '14px',
                          border: 'none',
                          cursor: 'pointer',
                          zIndex: 9999,
                          position: 'relative'
                        }}
                      >
                        Epic Account
                      </button>
                      <button
                        onClick={() => {
                          console.log('Manual Input method selected!');
                          setInputMethod('manual');
                        }}
                        style={{ 
                          padding: '8px 12px', 
                          backgroundColor: inputMethod === 'manual' ? 'white' : 'rgba(255, 255, 255, 0.1)', 
                          color: inputMethod === 'manual' ? 'black' : 'white', 
                          borderRadius: '8px', 
                          fontSize: '14px',
                          border: 'none',
                          cursor: 'pointer',
                          zIndex: 9999,
                          position: 'relative'
                        }}
                      >
                        Manual Input
                      </button>
                      <button
                        onClick={() => {
                          console.log('Tracker Link method selected!');
                          setInputMethod('tracker');
                        }}
                        style={{ 
                          padding: '8px 12px', 
                          backgroundColor: inputMethod === 'tracker' ? 'white' : 'rgba(255, 255, 255, 0.1)', 
                          color: inputMethod === 'tracker' ? 'black' : 'white', 
                          borderRadius: '8px', 
                          fontSize: '14px',
                          border: 'none',
                          cursor: 'pointer',
                          zIndex: 9999,
                          position: 'relative'
                        }}
                      >
                        Tracker Link
                      </button>
                    </div>

                    {/* Epic Account Method */}
                    {inputMethod === 'epic' && (
                      <div className="flex items-center justify-between">
                        <button
                          onClick={() => {
                            console.log('Connect Epic Account clicked!');
                            alert('Epic Account button clicked!');
                            setShowEpicModal(true);
                          }}
                          style={{ 
                            padding: '8px 16px', 
                            backgroundColor: 'white', 
                            color: 'black', 
                            borderRadius: '8px', 
                            fontWeight: 'bold',
                            border: 'none',
                            cursor: 'pointer',
                            zIndex: 9999,
                            position: 'relative'
                          }}
                        >
                          Connect Epic Account
                        </button>
                        
                        {/* Status aligned with button */}
                        <div className="text-center">
                          <p className="text-xs text-secondary-text mb-1">Status</p>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            (linkedEpicAccount || manualUsername)
                              ? isLoadingStats
                                ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-400/30'
                                : fortniteStats
                                  ? 'bg-green-500/20 text-green-400 border border-green-400/30'
                                  : 'bg-red-500/20 text-red-400 border border-red-400/30'
                              : 'bg-gray-500/20 text-gray-400 border border-gray-400/30'
                          }`}>
                            {(linkedEpicAccount || manualUsername)
                              ? isLoadingStats
                                ? 'Loading...'
                                : fortniteStats
                                  ? 'Connected'
                                  : 'Not Found'
                              : 'Not Connected'
                            }
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Manual Username Method */}
                    {inputMethod === 'manual' && (
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <input
                          type="text"
                          value={manualUsername}
                          onChange={(e) => setManualUsername(e.target.value)}
                          placeholder="Enter Fortnite username"
                          style={{ 
                            flex: '1',
                            padding: '8px 12px',
                            backgroundColor: 'rgba(255, 255, 255, 0.1)',
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                            borderRadius: '8px',
                            color: 'white',
                            fontSize: '14px',
                            outline: 'none',
                            zIndex: 9999,
                            position: 'relative'
                          }}
                        />
                        <button
                          onClick={handleManualUsernameSubmit}
                          disabled={!manualUsername.trim()}
                          style={{ 
                            padding: '8px 16px', 
                            backgroundColor: 'white', 
                            color: 'black', 
                            borderRadius: '8px', 
                            fontWeight: 'bold',
                            border: 'none',
                            cursor: 'pointer',
                            zIndex: 9999,
                            position: 'relative',
                            opacity: manualUsername.trim() ? 1 : 0.5
                          }}
                        >
                          Submit
                        </button>
                      </div>
                    )}

                    {/* Tracker Link Method */}
                    {inputMethod === 'tracker' && (
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <input
                          type="url"
                          value={trackerLink}
                          onChange={(e) => setTrackerLink(e.target.value)}
                          placeholder="https://fortnitetracker.com/profile/username"
                          style={{ 
                            flex: '1',
                            padding: '8px 12px',
                            backgroundColor: 'rgba(255, 255, 255, 0.1)',
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                            borderRadius: '8px',
                            color: 'white',
                            fontSize: '14px',
                            outline: 'none',
                            zIndex: 9999,
                            position: 'relative'
                          }}
                        />
                        <button
                          onClick={handleTrackerLinkSubmit}
                          disabled={!trackerLink.trim()}
                          style={{ 
                            padding: '8px 16px', 
                            backgroundColor: 'white', 
                            color: 'black', 
                            borderRadius: '8px', 
                            fontWeight: 'bold',
                            border: 'none',
                            cursor: 'pointer',
                            zIndex: 9999,
                            position: 'relative',
                            opacity: trackerLink.trim() ? 1 : 0.5
                          }}
                        >
                          Submit
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Stats Display */}
            {fortniteStats && (
              <div className="space-y-4">
                {/* Fallback Message - Show when API is blocked */}
                {fortniteStats?.fallback && (
                  <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                    <h4 className="text-sm font-semibold text-yellow-400 mb-2">⚠️ API Temporarily Unavailable</h4>
                    <p className="text-xs text-yellow-300 mb-3">
                      Fortnite Tracker is currently blocking automated requests. You can still get personalized AI coaching by entering your stats manually.
                    </p>
                    
                    {/* Manual Check Link */}
                    {fortniteStats.fallback.manualCheckUrl && (
                      <div className="mb-3">
                        <a 
                          href={fortniteStats.fallback.manualCheckUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 rounded-lg text-blue-300 hover:text-blue-200 text-sm transition-all duration-200 cursor-pointer"
                          style={{ zIndex: 9999, position: 'relative' }}
                        >
                          🔗 Check your stats on Fortnite Tracker
                        </a>
                      </div>
                    )}
                    
                    {/* Instructions */}
                    {fortniteStats.fallback.instructions && fortniteStats.fallback.instructions.length > 0 && (
                      <div className="text-xs text-yellow-200 space-y-1 mb-3">
                        {fortniteStats.fallback.instructions.map((instruction, index) => (
                          <p key={index}>• {instruction}</p>
                        ))}
                      </div>
                    )}
                    
                    {/* Manual Stats Input Form */}
                    <div className="bg-white/5 p-3 rounded-lg">
                      <h5 className="text-xs font-semibold text-white mb-2">Enter Your Stats Manually:</h5>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-xs text-gray-300">K/D Ratio</label>
                          <input
                            type="number"
                            step="0.1"
                            min="0"
                            placeholder="2.5"
                            defaultValue={fortniteStats?.stats?.all?.kd || 0}
                            className="w-full px-2 py-1 text-xs bg-white/10 border border-white/20 rounded text-white"
                            tabIndex={0}
                            style={{ zIndex: 9999, position: 'relative' }}
                            onFocus={() => console.log('K/D input focused')}
                            onBlur={() => console.log('K/D input blurred')}
                            onChange={(e) => {
                              const value = parseFloat(e.target.value) || 0;
                              console.log('K/D input changed to:', value);
                              // Save the stats immediately
                              const currentStats = fortniteStats?.stats?.all;
                              if (currentStats) {
                                saveManualStats(
                                  value,
                                  currentStats.winRate || 0,
                                  currentStats.matches || 0,
                                  currentStats.avgPlace || 0
                                );
                              }
                            }}
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-300">Win Rate %</label>
                          <input
                            type="number"
                            step="0.1"
                            min="0"
                            max="100"
                            placeholder="15.2"
                            defaultValue={fortniteStats?.stats?.all?.winRate || 0}
                            className="w-full px-2 py-1 text-xs bg-white/10 border border-white/20 rounded text-white"
                            tabIndex={0}
                            style={{ zIndex: 9999, position: 'relative' }}
                            onFocus={() => console.log('Win Rate input focused')}
                            onBlur={() => console.log('Win Rate input blurred')}
                            onChange={(e) => {
                              const value = parseFloat(e.target.value) || 0;
                              console.log('Win Rate input changed to:', value);
                              // Save the stats immediately
                              const currentStats = fortniteStats?.stats?.all;
                              if (currentStats) {
                                saveManualStats(
                                  currentStats.kd || 0,
                                  value,
                                  currentStats.matches || 0,
                                  currentStats.avgPlace || 0
                                );
                              }
                            }}
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-300">Matches</label>
                          <input
                            type="number"
                            min="0"
                            placeholder="150"
                            defaultValue={fortniteStats?.stats?.all?.matches || 0}
                            className="w-full px-2 py-1 text-xs bg-white/10 border border-white/20 rounded text-white"
                            tabIndex={0}
                            style={{ zIndex: 9999, position: 'relative' }}
                            onFocus={() => console.log('Matches input focused')}
                            onBlur={() => console.log('Matches input blurred')}
                            onChange={(e) => {
                              const value = parseInt(e.target.value) || 0;
                              console.log('Matches input changed to:', value);
                              // Save the stats immediately
                              const currentStats = fortniteStats?.stats?.all;
                              if (currentStats) {
                                saveManualStats(
                                  currentStats.kd || 0,
                                  currentStats.winRate || 0,
                                  value,
                                  currentStats.avgPlace || 0
                                );
                              }
                            }}
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-300">Avg Place</label>
                          <input
                            type="number"
                            min="1"
                            max="100"
                            placeholder="25"
                            defaultValue={fortniteStats?.stats?.all?.avgPlace || 0}
                            className="w-full px-2 py-1 text-xs bg-white/10 border border-white/20 rounded text-white"
                            tabIndex={0}
                            style={{ zIndex: 9999, position: 'relative' }}
                            onFocus={() => console.log('Avg Place input focused')}
                            onBlur={() => console.log('Avg Place input blurred')}
                            onChange={(e) => {
                              const value = parseInt(e.target.value) || 0;
                              console.log('Avg Place input changed to:', value);
                              // Save the stats immediately
                              const currentStats = fortniteStats?.stats?.all;
                              if (currentStats) {
                                saveManualStats(
                                  currentStats.kd || 0,
                                  currentStats.winRate || 0,
                                  currentStats.matches || 0,
                                  value
                                );
                              }
                            }}
                          />
                        </div>
                      </div>
                      <div className="mt-3 flex justify-between items-center">
                        <p className="text-green-300 text-xs">🎯 AI will provide personalized advice based on your manual stats!</p>
                        <button
                          onClick={() => {
                            const currentStats = fortniteStats?.stats?.all;
                            if (currentStats) {
                              saveManualStats(
                                currentStats.kd || 0,
                                currentStats.winRate || 0,
                                currentStats.matches || 0,
                                currentStats.avgPlace || 0
                              );
                              alert('Stats saved! You can now ask the AI for personalized advice.');
                            }
                          }}
                          className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white text-xs rounded transition-colors"
                        >
                          Save Stats
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Regular Stats Display */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-3 bg-white/5 rounded-lg">
                    <p className="text-2xl font-bold text-white">{fortniteStats?.stats?.all?.kd?.toFixed(1) || '0.0'}</p>
                    <p className="text-xs text-secondary-text">K/D Ratio</p>
                  </div>
                  <div className="text-center p-3 bg-white/5 rounded-lg">
                    <p className="text-2xl font-bold text-white">{fortniteStats?.stats?.all?.winRate?.toFixed(1) || '0.0'}%</p>
                    <p className="text-xs text-secondary-text">Win Rate</p>
                  </div>
                  <div className="text-center p-3 bg-white/5 rounded-lg">
                    <p className="text-2xl font-bold text-white">{fortniteStats?.stats?.all?.avgPlace?.toFixed(1) || '0.0'}</p>
                    <p className="text-xs text-secondary-text">Avg Place</p>
                  </div>
                  <div className="text-center p-3 bg-white/5 rounded-lg">
                    <p className="text-2xl font-bold text-white">{fortniteStats?.stats?.all?.matches || '0'}</p>
                    <p className="text-xs text-secondary-text">Matches</p>
                  </div>
                </div>

                {/* AI Coaching Context */}
                <div className="bg-gradient-to-r from-purple-900/20 to-blue-900/20 p-4 rounded-lg border border-white/10">
                  <h3 className="text-lg font-semibold text-white mb-3">AI Coaching Context</h3>
                  
                  {fortniteStats?.fallback ? (
                    <div className="text-sm text-gray-300">
                      <p className="text-yellow-400 mb-2">⚠️ Using Fallback Mode (Fortnite Tracker API Blocked)</p>
                      <p><span className="text-blue-400">K/D Ratio:</span> {fortniteStats?.stats?.all?.kd?.toFixed(1) || 'N/A'}</p>
                      <p><span className="text-blue-400">Win Rate:</span> {fortniteStats?.stats?.all?.winRate?.toFixed(1) || 'N/A'}%</p>
                      <p><span className="text-blue-400">Matches Played:</span> {fortniteStats?.stats?.all?.matches || 'N/A'}</p>
                      <p><span className="text-blue-400">Average Placement:</span> {fortniteStats?.stats?.all?.avgPlace?.toFixed(1) || 'N/A'}</p>
                      <p className="text-yellow-400 mt-2">Tip: Update your stats above for more accurate coaching</p>
                    </div>
                  ) : fortniteStats?.preferences ? (
                    <div className="text-sm text-gray-300">
                      <p><span className="text-blue-400">Preferred Drop:</span> {fortniteStats.preferences.preferredDrop}</p>
                      <p><span className="text-blue-400">Weakest Zone:</span> {fortniteStats.preferences.weakestZone}</p>
                      <p><span className="text-blue-400">Survival Time:</span> {fortniteStats.preferences.avgSurvivalTime} minutes avg</p>
                    </div>
                  ) : (
                    <div className="text-sm text-gray-300">
                      <p>AI will provide personalized advice based on your stats!</p>
                      <p className="text-yellow-400 mt-2">Tip: Update your stats above for more accurate coaching</p>
                    </div>
                  )}
                </div>

                {/* Recent Matches */}
                <div className="bg-white/5 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-white mb-3">Recent Matches</h3>
                  
                  {fortniteStats?.fallback ? (
                    <p className="text-gray-400">Match history not available in fallback mode</p>
                  ) : fortniteStats?.recentMatches && fortniteStats.recentMatches.length > 0 ? (
                    <div className="space-y-2">
                      {fortniteStats.recentMatches.slice(0, 5).map((match, index) => (
                        <div key={index} className="text-sm text-gray-300">
                          <span className="text-blue-400">#{match.placement}</span> - {match.mode} - {match.date}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-400">Match history not available in manual mode</p>
                  )}
                  
                  <p className="text-gray-400 mt-2">AI coaching will focus on your overall performance stats</p>
                </div>
              </div>
            )}

            {(linkedEpicAccount || manualUsername) && !fortniteStats && !isLoadingStats && (
              <p className="text-xs text-red-400 mt-2">
                Username not found. Please check the spelling or try a different username.
              </p>
            )}

            {(linkedEpicAccount || manualUsername) && !fortniteStats && (
              <p className="text-xs text-secondary-text mt-2">
                AI will provide general Fortnite advice without personalized coaching.
              </p>
            )}
          </div>

          {/* Chat Controls */}
          <div className="flex items-center justify-between relative z-20">
            <div className="flex items-center gap-4">
              <button
                onClick={() => {
                  console.log('Show Chat Log button clicked!');
                  setShowChatLog(!showChatLog);
                }}
                className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white hover:bg-white/20 transition-all duration-300"
                style={{ zIndex: 1000, position: 'relative' }}
              >
                {showChatLog ? 'Hide Chat Log' : 'Show Chat Log'}
              </button>
              <span className="text-sm text-secondary-text">
                {conversations.length}/5 chats
              </span>
            </div>
            <button
              onClick={() => {
                console.log('New Chat button clicked!');
                createNewChat();
              }}
              disabled={conversations.length >= 5}
              className="px-6 py-2 bg-white text-dark-charcoal rounded-lg font-semibold hover:bg-gray-100 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ zIndex: 1000, position: 'relative' }}
            >
              + New Chat
            </button>
          </div>

          {/* Chat Log Sidebar */}
          {showChatLog && (
            <div className="p-6 bg-white/5 border border-white/10 rounded-xl relative z-20">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Chat History</h3>
                <span className="text-xs text-secondary-text">{conversations.length}/5 chats</span>
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {conversations.map((conversation) => (
                  <div
                    key={conversation.id}
                    className={`p-3 rounded-lg transition-all duration-300 ${
                      conversation.id === currentConversationId
                        ? 'bg-white/20 border border-white/30'
                        : 'bg-white/5 hover:bg-white/10 border border-transparent'
                    }`}
                    style={{ zIndex: 1000, position: 'relative' }}
                  >
                    <div className="flex items-center justify-between">
                      <div 
                        className="flex-1 cursor-pointer"
                        onClick={() => switchConversation(conversation.id)}
                      >
                        <div className="flex items-center justify-between">
                          <p className="text-white text-sm truncate">{conversation.title}</p>
                          <span className="text-xs text-secondary-text">
                            {conversation.createdAt.toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-xs text-secondary-text mt-1">
                          {conversation.messages.length} messages
                        </p>
                      </div>
                      {conversations.length > 1 && (
                        <button
                          onClick={() => deleteChat(conversation.id)}
                          className="ml-2 p-1 text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded transition-colors"
                          title="Delete chat"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Chat Container */}
          <div className="glass-card p-8 h-96 overflow-y-auto mb-6">
            <div className="space-y-4">
              {/* Debug info */}
              <div className="text-xs text-gray-400 mb-2">
                Debug: {messages.length} messages, Conversation ID: {currentConversationId}
              </div>
              
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl ${
                      message.isUser
                        ? 'bg-white text-dark-charcoal ml-auto'
                        : 'bg-white/10 text-white'
                    }`}
                  >
                    <p className="text-sm">{message.text}</p>
                    <p className={`text-xs mt-2 ${message.isUser ? 'text-gray-600' : 'text-gray-400'}`}>
                      {message.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
              
              {/* Typing Indicator */}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-white/10 text-white px-4 py-3 rounded-2xl">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-white rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Input Area */}
          <div className="flex gap-4 mb-8">
            <input
              type="text"
              value={inputText}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              placeholder="Type your question..."
              className="flex-1 px-6 py-4 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent"
              style={{ zIndex: 1000, position: 'relative' }}
            />
            <button
              onClick={handleSendClick}
              disabled={!inputText.trim() || isTyping}
              className="px-8 py-4 bg-white text-dark-charcoal rounded-lg font-semibold hover:bg-gray-100 transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ 
                zIndex: 1000, 
                position: 'relative',
                pointerEvents: 'auto',
                cursor: 'pointer'
              }}
            >
              Send
            </button>
          </div>

          {/* Quick Suggestions - Moved to bottom */}
          <div className="relative z-20">
            <h3 className="text-lg font-semibold text-white text-center mb-6">Quick Suggestions</h3>
            <div className="flex flex-wrap gap-4 justify-center">
              {quickSuggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => {
                    console.log(`Quick suggestion "${suggestion}" clicked!`);
                    handleQuickSuggestion(suggestion);
                  }}
                  className="px-6 py-3 bg-white/10 border border-white/20 rounded-full text-white hover:bg-white/20 transition-all duration-300 hover:scale-105"
                  style={{ zIndex: 1000, position: 'relative' }}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>

          {/* Model Tag */}
          <div className="text-center">
            <span className="text-xs text-secondary-text bg-white/5 px-4 py-2 rounded-full">
              Powered by GPT-4o-mini
            </span>
            {typeof window !== 'undefined' && !process.env.NEXT_PUBLIC_OPENAI_API_KEY && (
              <div className="mt-2">
                <span className="text-xs text-white bg-white/10 px-3 py-1 rounded-full border border-white/20">
                  ⚠️ Using Fallback Mode (No API Key)
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <div style={{ textAlign: 'center', marginTop: '48px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', justifyContent: 'center' }}>
            <button
              onClick={() => {
                console.log('Back to Dashboard clicked!');
                alert('Dashboard button clicked!');
                window.location.href = '/dashboard';
              }}
              style={{ 
                padding: '12px 24px', 
                backgroundColor: 'white', 
                color: 'black', 
                borderRadius: '8px', 
                fontWeight: 'bold',
                fontSize: '18px',
                border: 'none',
                cursor: 'pointer',
                zIndex: 9999,
                position: 'relative'
              }}
            >
              ← Back to Dashboard
            </button>
            <button
              onClick={() => {
                console.log('Back to Home clicked!');
                alert('Home button clicked!');
                window.location.href = '/';
              }}
              style={{ 
                padding: '12px 24px', 
                backgroundColor: 'white', 
                color: 'black', 
                borderRadius: '8px', 
                fontWeight: 'bold',
                fontSize: '18px',
                border: 'none',
                cursor: 'pointer',
                zIndex: 9999,
                position: 'relative'
              }}
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
      
      <Footer />
      
      {/* Epic Account Modal */}
      {showEpicModal && (
        <EpicAccountModal
          isOpen={showEpicModal}
          onClose={() => setShowEpicModal(false)}
          onAccountLinked={handleEpicAccountLinked}
        />
      )}
    </div>
  );
}
