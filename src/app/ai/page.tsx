'use client';

import React, { useState, useRef, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { FortniteStats } from '@/types';
import { SUBSCRIPTION_TIERS, UsageTracker } from '@/lib/osirion';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getFullDocumentation, getDocumentationSummary } from '@/lib/ai-docs';
import ReactMarkdown from 'react-markdown';

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
  const [fortniteStats, setFortniteStats] = useState<FortniteStats | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [showChatLog, setShowChatLog] = useState(false);
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualUsername, setManualUsername] = useState('');
  const [trackerLink, setTrackerLink] = useState('');
  const [inputMethod, setInputMethod] = useState<'manual' | 'tracker'>('manual');
  const [currentUsage, setCurrentUsage] = useState<any>(null);
  const [subscriptionTier, setSubscriptionTier] = useState<any>(null);
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
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

  // Check subscription and usage
  const checkSubscription = async () => {
    if (!user) return;
    
    try {
      const response = await fetch('/api/check-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: user.uid }),
      });

      if (response.ok) {
        const data = await response.json();
        setSubscriptionTier(data.tier);
        setCurrentUsage(data.usage);
      }
    } catch (error) {
      console.error('Error checking subscription:', error);
    }
  };

  // Check subscription on mount
  useEffect(() => {
    checkSubscription();
  }, [user]);

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
      // Load any existing manual username from localStorage
      const savedUsername = localStorage.getItem('pathgen_manual_username');
      if (savedUsername) {
        setManualUsername(savedUsername);
        setInputMethod('manual');
      }
      
      // Load AI training preferences from localStorage
      const savedAITraining = localStorage.getItem('pathgen_ai_training');
      if (savedAITraining) {
        try {
          const training = JSON.parse(savedAITraining);
          setAiCoachingStyle(training.coachingStyle || 'aggressive');
          setAiFocusArea(training.focusArea || 'all');
          setCustomKnowledge(training.customKnowledge || '');
          setPersonalGoals(training.personalGoals || '');
          console.log('Loaded AI training preferences:', training);
        } catch (error) {
          console.error('Error loading AI training preferences:', error);
        }
      }
    }
  }, [user]);

  // Fetch Fortnite stats when Epic account changes or manual input is provided
  useEffect(() => {
    if (manualUsername) {
      fetchFortniteStats(manualUsername);
    } else {
      setFortniteStats(null);
    }
  }, [manualUsername]);

  const fetchFortniteStats = async (username: string) => {
    console.log('fetchFortniteStats called with username:', username);
    setIsLoadingStats(true);
    try {
      // Note: Osirion API requires Epic ID, not username
      // For now, using a placeholder Epic ID for testing
      // In production, users would need to provide their actual Epic ID
      const epicId = '37da09eb8b574968ad36da5adc02232b'; // Placeholder Epic ID
      
      // Use the new Osirion API route
      const response = await fetch('/api/osirion/stats', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          epicId,
          userId: user?.uid || 'test-user',
          platform: 'pc'
        }),
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

  const handleManualUsernameSubmit = () => {
    if (manualUsername.trim()) {
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
        setInputMethod('tracker');
        setShowManualInput(false);
        // Save to localStorage for persistence
        localStorage.setItem('pathgen_manual_username', username);
      } else {
        alert('Please enter a valid Osirion link (e.g., https://osirion.com/profile/username)');
      }
    }
  };

  const clearAccountInfo = () => {
    console.log('clearAccountInfo called!');
    alert('Clearing account info...');
    setManualUsername('');
    setTrackerLink('');
    setInputMethod('manual');
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

  const canSendMessage = () => {
    if (!subscriptionTier || !currentUsage) return true;
    
    const limit = subscriptionTier.limits.ai.messagesPerMonth;
    if (limit === -1) return true; // Unlimited
    
    return currentUsage.ai.messagesUsed < limit;
  };

  const handleSendMessage = async (text: string) => {
    if (!text.trim()) return;
    
    // Check message limit
    if (!canSendMessage()) {
      setShowUpgradePrompt(true);
      return;
    }

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
      console.log('AI Training Data:', { aiCoachingStyle, aiFocusArea, customKnowledge, personalGoals });
      
      // Check if OpenAI API key is available (client-side check)
      if (typeof window !== 'undefined' && !process.env.NEXT_PUBLIC_OPENAI_API_KEY) {
        console.warn('OpenAI API key not found, using fallback responses');
        return getFallbackResponse(userInput);
      }

      // Get developer documentation automatically
      const developerDocs = getFullDocumentation();
      const developerSummary = getDocumentationSummary();
      
      console.log('Developer docs length:', developerDocs.length);
      console.log('Developer summary length:', developerSummary.length);
      console.log('Docs contain zone data:', developerDocs.includes('Double Pull'));
      console.log('Summary contains zone data:', developerSummary.includes('Double Pull'));
      
      // Build personalized context
      let personalizedContext = `
${developerSummary}

${developerDocs}

Coaching Style: ${aiCoachingStyle}
Focus Area: ${aiFocusArea}
Custom Knowledge: ${customKnowledge}
Personal Goals: ${personalGoals}
`;
      
      // Add stats context
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
      
      personalizedContext += 'Focus on practical tips they can implement immediately.';

      console.log('Sending personalized context length:', personalizedContext.length);
      console.log('Context contains zone data:', personalizedContext.includes('Double Pull'));
      console.log('Context contains POI data:', personalizedContext.includes('Martial Maneuvers'));
      console.log('Context contains tournament data:', personalizedContext.includes('FNCS'));
      console.log('Context preview (first 500 chars):', personalizedContext.substring(0, 500));

      console.log('Calling OpenAI API...');
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userInput,
          context: personalizedContext,
          fortniteUsername: manualUsername || 'Manual Input User'
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
        manualCheckUrl: 'https://osirion.com',
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

  // AI Training & Customization State
  const [showAITraining, setShowAITraining] = useState(false);
  const [aiCoachingStyle, setAiCoachingStyle] = useState('aggressive');
  const [aiFocusArea, setAiFocusArea] = useState('all');
  const [customKnowledge, setCustomKnowledge] = useState('');
  const [personalGoals, setPersonalGoals] = useState('');
  const [aiTrainingSaved, setAiTrainingSaved] = useState(false);
  const [bulkDocumentation, setBulkDocumentation] = useState('');

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result && typeof event.target.result === 'string') {
          setBulkDocumentation(event.target.result);
          console.log('File uploaded. Character count:', event.target.result.length);
        }
      };
      reader.readAsText(file);
    }
  };

  const importZoneDocumentation = () => {
    const exampleZoneDoc = `
Zone: Misty Meadows
- Loot: Excellent, including rare items
- Rotation: Excellent, with multiple paths and cover
- Storm: Good, but can be tricky to predict
- Drop: Excellent, with multiple options
- Building: High ground control, quick edits
- Combat: Stealthy, use natural cover
- Strategy: Rotate through the mountain to avoid fights
`;
    setBulkDocumentation(exampleZoneDoc);
    console.log('Imported Zone Documentation example.');
  };

  const importMechanicsDocumentation = () => {
    const exampleMechanicsDoc = `
Mechanic: Building Speed
- Keybind: E (Edit)
- Tips: Practice simple ramps first, then complex builds
- Example: 90s (90-degree turn)
- Practice: 15 minutes daily

Mechanic: Aiming
- Crosshair Placement: Center for most weapons
- Recoil Control: Practice with recoil-heavy weapons
- Example: 1000ms (1 second)
- Practice: 1000ms for 100 shots
`;
    setBulkDocumentation(exampleMechanicsDoc);
    console.log('Imported Mechanics Documentation example.');
  };

  const importStrategyDocumentation = () => {
    const exampleStrategyDoc = `
Strategy: Endgame Positioning
- Storm: Always try to be in the safe zone or on high ground
- Rotation: Rotate to the storm to avoid fights
- Building: Use high ground control to defend
- Combat: Stealthy, use natural cover
- Example: 1000ms (1 second)
- Practice: 1000ms for 100 shots
`;
    setBulkDocumentation(exampleStrategyDoc);
    console.log('Imported Strategy Documentation example.');
  };

  const importBulkDocumentation = () => {
    if (bulkDocumentation.trim()) {
      // Check character limit
      if (bulkDocumentation.length > 10000) {
        alert('Documentation is too long (max 10,000 characters). Please split it into smaller sections.');
        return;
      }
      
      // Append to existing knowledge or replace
      const newKnowledge = customKnowledge.trim() 
        ? `${customKnowledge}\n\n--- NEW DOCUMENTATION ---\n\n${bulkDocumentation}`
        : bulkDocumentation;
      
      setCustomKnowledge(newKnowledge);
      setBulkDocumentation(''); // Clear the bulk input
      setAiTrainingSaved(true);
      setTimeout(() => setAiTrainingSaved(false), 3000);
      console.log('Imported bulk documentation to AI training. Total length:', newKnowledge.length);
      alert(`Bulk documentation imported to AI training! Total knowledge length: ${newKnowledge.length} characters`);
    } else {
      alert('Please paste or upload documentation first.');
    }
  };

  const saveAITraining = () => {
    console.log('Saving AI training preferences:', {
      aiCoachingStyle,
      aiFocusArea,
      customKnowledge,
      personalGoals
    });
    // In a real app, you'd send this to your backend API
    // For now, we'll just simulate saving and show a message
    setAiTrainingSaved(true);
    setTimeout(() => setAiTrainingSaved(false), 3000); // Hide message after 3 seconds
    // Save to localStorage
    localStorage.setItem('pathgen_ai_training', JSON.stringify({
      coachingStyle: aiCoachingStyle,
      focusArea: aiFocusArea,
      customKnowledge: customKnowledge,
      personalGoals: personalGoals
    }));
  };

  const resetAITraining = () => {
    console.log('Resetting AI training preferences to default');
    setAiCoachingStyle('aggressive');
    setAiFocusArea('all');
    setCustomKnowledge('');
    setPersonalGoals('');
    setAiTrainingSaved(false); // Hide message if resetting
    // Clear from localStorage
    localStorage.removeItem('pathgen_ai_training');
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
                {manualUsername ? (
                  <div className="flex items-center gap-3">
                    <div className="px-4 py-2 bg-green-500/20 border border-green-500/30 rounded-lg text-green-400 text-sm">
                      ✓ {manualUsername}
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
                          placeholder="https://osirion.com/profile/username"
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
                {/* Usage Display */}
                {subscriptionTier && currentUsage && (
                  <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                    <h4 className="text-sm font-semibold text-blue-400 mb-2">
                      📊 {subscriptionTier.name} Plan Usage
                    </h4>
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <p className="text-gray-300">AI Messages</p>
                        <p className="text-white font-semibold">
                          {currentUsage.ai.messagesUsed} / {subscriptionTier.limits.ai.messagesPerMonth === -1 ? '∞' : subscriptionTier.limits.ai.messagesPerMonth}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-300">Osirion Matches</p>
                        <p className="text-white font-semibold">
                          {currentUsage.osirion.matchesUsed} / {subscriptionTier.limits.osirion.matchesPerMonth === -1 ? '∞' : subscriptionTier.limits.osirion.matchesPerMonth}
                        </p>
                      </div>
                      {subscriptionTier.limits.osirion.replayUploadsPerMonth > 0 && (
                        <div>
                          <p className="text-gray-300">Replay Uploads</p>
                          <p className="text-white font-semibold">
                            {currentUsage.osirion.replayUploadsUsed} / {subscriptionTier.limits.osirion.replayUploadsPerMonth}
                          </p>
                        </div>
                      )}
                      {subscriptionTier.limits.osirion.computeRequestsPerMonth > 0 && (
                        <div>
                          <p className="text-gray-300">Compute Requests</p>
                          <p className="text-white font-semibold">
                            {currentUsage.osirion.computeRequestsUsed} / {subscriptionTier.limits.osirion.computeRequestsPerMonth}
                          </p>
                        </div>
                      )}
                    </div>
                    <div className="mt-3 text-xs text-gray-400">
                      Resets on {currentUsage.resetDate.toLocaleDateString()}
                    </div>
                  </div>
                )}
                {/* Fallback Message - Show when API is blocked */}
                {fortniteStats?.fallback && (
                  <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                    <h4 className="text-sm font-semibold text-yellow-400 mb-2">⚠️ Osirion API Temporarily Unavailable</h4>
                    <p className="text-xs text-yellow-300 mb-3">
                      Osirion API is currently unavailable. You can still get personalized AI coaching by entering your stats manually.
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
                          🔗 Check your stats on Osirion
                        </a>
                      </div>
                    )}
                    
                    {/* Instructions */}
                    {fortniteStats.fallback.instructions && fortniteStats.fallback.instructions.length > 0 && (
                      <div className="text-xs text-yellow-200 space-y-1 mb-3">
                                                    {fortniteStats.fallback.instructions.map((instruction: string, index: number) => (
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
                                                  {fortniteStats.recentMatches.slice(0, 5).map((match: any, index: number) => (
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

            {manualUsername && !fortniteStats && !isLoadingStats && (
              <p className="text-xs text-red-400 mt-2">
                Username not found. Please check the spelling or try a different username.
              </p>
            )}

            {manualUsername && !fortniteStats && (
              <p className="text-xs text-secondary-text mt-2">
                AI will provide general Fortnite advice without personalized coaching.
              </p>
            )}
          </div>

          {/* AI Training & Customization */}
          <div className="p-6 bg-white/5 border border-white/10 rounded-xl mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">AI Training & Customization</h3>
              <button
                onClick={() => setShowAITraining(!showAITraining)}
                className="px-3 py-1 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm transition-colors cursor-pointer border border-white/20 hover:border-white/30"
              >
                {showAITraining ? 'Hide' : 'Show'}
              </button>
            </div>
            
            {showAITraining && (
              <div className="space-y-4">
                {/* Developer Documentation Notice */}
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                  <p className="text-blue-300 text-sm">
                    <strong>Developer Documentation:</strong> Comprehensive Fortnite knowledge including zone guides, mechanics, strategies, meta analysis, and pro tips is automatically included in every AI response.
                  </p>
                  <div className="mt-2">
                    <a 
                      href="/admin/docs" 
                      target="_blank"
                      className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 rounded-lg text-blue-300 hover:text-blue-200 text-xs transition-all duration-200"
                    >
                      📝 Manage Documentation
                    </a>
                  </div>
                </div>
                
                {/* AI Personality & Expertise */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      AI Coaching Style
                    </label>
                    <select
                      value={aiCoachingStyle}
                      onChange={(e) => setAiCoachingStyle(e.target.value)}
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm"
                    >
                      <option value="aggressive">Aggressive & Competitive</option>
                      <option value="patient">Patient & Strategic</option>
                      <option value="technical">Technical & Detailed</option>
                      <option value="motivational">Motivational & Encouraging</option>
                      <option value="analytical">Analytical & Data-Driven</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      Focus Areas
                    </label>
                    <select
                      value={aiFocusArea}
                      onChange={(e) => setAiFocusArea(e.target.value)}
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm"
                    >
                      <option value="all">All Aspects</option>
                      <option value="building">Building & Editing</option>
                      <option value="positioning">Positioning & Rotation</option>
                      <option value="aim">Aim & Combat</option>
                      <option value="game-sense">Game Sense & Decision Making</option>
                      <option value="mechanics">Mechanical Skills</option>
                    </select>
                  </div>
                </div>

                {/* Custom Knowledge Base */}
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Your Personal Strategies & Knowledge
                  </label>
                  <textarea
                    value={customKnowledge}
                    onChange={(e) => setCustomKnowledge(e.target.value)}
                    placeholder="Add your own personal strategies, tips, or knowledge that you want the AI to consider..."
                    rows={4}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 text-sm resize-none"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    This is in addition to the comprehensive developer documentation that's automatically included
                  </p>
                </div>

                {/* Bulk Documentation Import */}
                <div className="bg-gradient-to-r from-green-900/20 to-blue-900/20 p-4 rounded-lg border border-green-500/20">
                  <h4 className="text-sm font-semibold text-green-400 mb-3">📖 Bulk Documentation Import</h4>
                  
                  {/* File Upload */}
                  <div className="mb-3">
                    <label className="block text-xs text-green-300 mb-2">
                      Upload Documentation File (.txt, .md, .json)
                    </label>
                    <input
                      type="file"
                      accept=".txt,.md,.json"
                      onChange={handleFileUpload}
                      className="w-full text-xs text-green-300 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-green-500 file:text-white hover:file:bg-green-600"
                    />
                    <p className="text-xs text-green-400 mt-1">
                      Upload zone guides, mechanics documentation, or any Fortnite text files
                    </p>
                  </div>

                  {/* Quick Import Templates */}
                  <div className="mb-3">
                    <label className="block text-xs text-green-300 mb-2">
                      Quick Import Templates
                    </label>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => importZoneDocumentation()}
                        className="px-3 py-1 bg-green-500 hover:bg-green-600 text-white text-xs rounded transition-colors"
                      >
                        Import Zone Guide
                      </button>
                      <button
                        onClick={() => importMechanicsDocumentation()}
                        className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white text-xs rounded transition-colors"
                      >
                        Import Mechanics
                      </button>
                      <button
                        onClick={() => importStrategyDocumentation()}
                        className="px-3 py-1 bg-purple-500 hover:bg-purple-600 text-white text-xs rounded transition-colors"
                      >
                        Import Strategies
                      </button>
                    </div>
                  </div>

                  {/* Bulk Text Import */}
                  <div>
                    <label className="block text-xs text-green-300 mb-2">
                      Paste Large Documentation (Zones, Mechanics, etc.)
                    </label>
                    <textarea
                      value={bulkDocumentation}
                      onChange={(e) => setBulkDocumentation(e.target.value)}
                      placeholder="Paste your zone documentation, mechanics guides, or any large text here..."
                      rows={6}
                      className="w-full px-3 py-2 bg-white/10 border border-green-500/30 rounded-lg text-white placeholder-green-400/50 text-xs resize-none"
                    />
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={importBulkDocumentation}
                        disabled={!bulkDocumentation.trim()}
                        className="px-3 py-1 bg-green-500 hover:bg-green-600 disabled:bg-gray-500 text-white text-xs rounded transition-colors"
                      >
                        Import to AI Training
                      </button>
                      <button
                        onClick={() => setBulkDocumentation('')}
                        className="px-3 py-1 bg-white/10 hover:bg-white/20 text-white text-xs rounded transition-colors"
                      >
                        Clear
                      </button>
                    </div>
                    <p className="text-xs text-green-400 mt-1">
                      Character count: {bulkDocumentation.length} | Max: 10,000
                    </p>
                  </div>
                </div>

                {/* Personal Goals */}
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Your Fortnite Goals
                  </label>
                  <textarea
                    value={personalGoals}
                    onChange={(e) => setPersonalGoals(e.target.value)}
                    placeholder="What do you want to improve? (e.g., 'Get to Champion League', 'Improve building speed', 'Better endgame positioning')"
                    rows={2}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 text-sm resize-none"
                  />
                </div>

                {/* Save Training */}
                <div className="flex justify-between items-center">
                  <button
                    onClick={saveAITraining}
                    className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-semibold transition-colors"
                  >
                    Save AI Training
                  </button>
                  <button
                    onClick={resetAITraining}
                    className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm transition-colors"
                  >
                    Reset to Default
                  </button>
                </div>

                {/* Training Status */}
                {aiTrainingSaved && (
                  <div className="p-3 bg-green-500/20 border border-green-500/30 rounded-lg">
                    <p className="text-green-400 text-sm">✅ AI training saved! Your customizations will be used in future conversations.</p>
                  </div>
                )}

                {/* Documentation Management */}
                {customKnowledge.trim() && (
                  <div className="bg-gradient-to-r from-orange-900/20 to-red-900/20 p-3 rounded-lg border border-orange-500/20">
                    <h4 className="text-sm font-semibold text-orange-400 mb-2">📚 Current Documentation ({customKnowledge.length} chars)</h4>
                    <div className="max-h-32 overflow-y-auto bg-black/20 p-2 rounded text-xs text-orange-200">
                      <pre className="whitespace-pre-wrap break-words">{customKnowledge}</pre>
                    </div>
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={() => setCustomKnowledge('')}
                        className="px-2 py-1 bg-red-500 hover:bg-red-600 text-white text-xs rounded transition-colors"
                      >
                        Clear All
                      </button>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(customKnowledge);
                          alert('Documentation copied to clipboard!');
                        }}
                        className="px-2 py-1 bg-orange-500 hover:bg-orange-600 text-white text-xs rounded transition-colors"
                      >
                        Copy to Clipboard
                      </button>
                    </div>
                  </div>
                )}

                {/* Help Section */}
                <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                  <h4 className="text-sm font-semibold text-blue-400 mb-2">💡 How to Train Your AI Coach</h4>
                  <div className="text-xs text-blue-300 space-y-1">
                    <p><strong>Coaching Style:</strong> Choose how the AI communicates with you</p>
                    <p><strong>Focus Areas:</strong> Tell the AI what skills you want to improve most</p>
                    <p><strong>Custom Knowledge:</strong> Share your own strategies, drop spots, or techniques</p>
                    <p><strong>Personal Goals:</strong> Set specific targets like "Reach Champion League" or "Improve building speed"</p>
                  </div>
                </div>

                {/* Example Training Data */}
                <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                  <h4 className="text-sm font-semibold text-purple-400 mb-2">📚 Example Training Data</h4>
                  <div className="text-xs text-purple-300 space-y-2">
                    <div>
                      <p className="font-semibold">Custom Knowledge Example:</p>
                      <p>"My favorite drop is Misty Meadows because it has good loot and rotation options. I always rotate through the mountain to avoid early fights. My building strategy focuses on high ground control and quick edits."</p>
                    </div>
                    <div>
                      <p className="font-semibold">Personal Goals Example:</p>
                      <p>"I want to improve my endgame positioning, get better at reading the storm, and increase my win rate from 5% to 10%."</p>
                    </div>
                  </div>
                </div>
              </div>
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
            <div className="flex items-center gap-4">
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
                    {message.isUser ? (
                      <p className="text-sm">{message.text}</p>
                    ) : (
                      <div className="text-sm prose prose-invert prose-sm max-w-none">
                        <ReactMarkdown>
                          {message.text}
                        </ReactMarkdown>
                      </div>
                    )}
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', justifyContent: 'center', alignItems: 'center' }}>
            <button
              onClick={() => {
                window.location.href = '/dashboard';
              }}
              style={{ 
                padding: '12px 24px', 
                backgroundColor: 'transparent', 
                color: 'white', 
                borderRadius: '8px', 
                fontWeight: 'bold',
                fontSize: '18px',
                border: '2px solid white',
                cursor: 'pointer',
                zIndex: 9999,
                position: 'relative',
                width: '280px'
              }}
            >
              ← Back to Dashboard
            </button>
            <button
              onClick={() => {
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
                position: 'relative',
                width: '280px'
              }}
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
      
      {/* Upgrade Prompt Modal */}
      {showUpgradePrompt && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-dark-charcoal p-6 rounded-lg max-w-md mx-4">
            <h3 className="text-xl font-bold text-white mb-4">Upgrade Required</h3>
            <p className="text-gray-300 mb-6">
              You've reached your monthly limit. Upgrade to continue using PathGen's AI coaching and Osirion analytics.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowUpgradePrompt(false)}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
              >
                Maybe Later
              </button>
              <Link
                href="/pricing"
                className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded hover:from-blue-600 hover:to-purple-700"
              >
                View Plans
              </Link>
            </div>
          </div>
        </div>
      )}
      
      <Footer />
      
    </div>
  );
}
