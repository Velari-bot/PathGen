'use client';

import React, { useState } from 'react';
import { FirebaseService } from '@/lib/firebase-service';

interface OnboardingModalProps {
  isOpen: boolean;
  onComplete: () => void;
  userId: string;
  userEmail: string;
  userDisplayName: string;
}

interface OnboardingData {
  // Basic Info
  displayName: string;
  timezone: string;
  language: string;
  
  // Gaming Preferences
  favoriteGame: string;
  skillLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  playStyle: 'aggressive' | 'passive' | 'balanced';
  teamSize: 'solo' | 'duo' | 'squad' | 'any';
  preferredModes: string[];
  
  // Goals
  goals: string[];
  
  // Preferences
  theme: 'light' | 'dark' | 'auto';
  notifications: {
    email: boolean;
    push: boolean;
    sms: boolean;
    discord: boolean;
  };
}

const SKILL_LEVELS = [
  { value: 'beginner', label: 'Beginner', description: 'New to gaming or Fortnite' },
  { value: 'intermediate', label: 'Intermediate', description: 'Some experience, still learning' },
  { value: 'advanced', label: 'Advanced', description: 'Experienced player, good skills' },
  { value: 'expert', label: 'Expert', description: 'High-level competitive player' }
];

const PLAY_STYLES = [
  { value: 'aggressive', label: 'Aggressive', description: 'High action, seek fights, push players' },
  { value: 'passive', label: 'Passive', description: 'Survival focused, avoid early fights' },
  { value: 'balanced', label: 'Balanced', description: 'Mix of both approaches' }
];

const TEAM_SIZES = [
  { value: 'solo', label: 'Solo', description: 'Prefer playing alone' },
  { value: 'duo', label: 'Duo', description: 'Like playing with one partner' },
  { value: 'squad', label: 'Squad', description: 'Enjoy team play with 3-4 players' },
  { value: 'any', label: 'Any', description: 'Flexible with team size' }
];

const GAME_MODES = [
  'Battle Royale',
  'Team Rumble',
  'Creative',
  'Save the World',
  'Arena',
  'Custom Games'
];

const GOAL_OPTIONS = [
  'Improve K/D ratio',
  'Increase win rate',
  'Better building skills',
  'Improve editing speed',
  'Learn advanced strategies',
  'Master specific weapons',
  'Improve game sense',
  'Better rotation timing',
  'Learn new drop spots',
  'Improve communication'
];

export default function OnboardingModal({ isOpen, onComplete, userId, userEmail, userDisplayName }: OnboardingModalProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [data, setData] = useState<OnboardingData>({
    displayName: userDisplayName || '',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    language: 'en-US',
    favoriteGame: 'Fortnite',
    skillLevel: 'beginner',
    playStyle: 'balanced',
    teamSize: 'any',
    preferredModes: ['Battle Royale'],
    goals: ['Improve K/D ratio', 'Increase win rate'],
    theme: 'dark', // Default theme
    notifications: {
      email: true, // Default to email only
      push: false,
      sms: false,
      discord: false
    }
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateData = (field: keyof OnboardingData, value: any) => {
    setData(prev => ({ ...prev, [field]: value }));
  };

  const updateNestedData = (parent: keyof OnboardingData, field: string, value: any) => {
    setData(prev => {
      const parentData = prev[parent];
      if (typeof parentData === 'object' && parentData !== null) {
        return {
          ...prev,
          [parent]: { ...parentData, [field]: value }
        };
      }
      return prev;
    });
  };

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      // Update user profile
      await FirebaseService.saveUserProfile({
        id: userId,
        email: userEmail,
        displayName: data.displayName,
        createdAt: new Date(),
        lastLogin: new Date(),
        profile: {
          language: data.language,
          timezone: data.timezone
        },
        gaming: {
          favoriteGame: data.favoriteGame,
          skillLevel: data.skillLevel,
          playStyle: data.playStyle,
          preferredModes: data.preferredModes,
          teamSize: data.teamSize,
          goals: data.goals
        },
        subscription: {
          status: 'free',
          tier: 'free',
          startDate: new Date(),
          autoRenew: false
        },
        settings: {
          notifications: data.notifications,
          privacy: {
            profilePublic: false,
            statsPublic: false,
            allowFriendRequests: true,
            showOnlineStatus: true
          },
          preferences: {
            theme: data.theme,
            language: data.language,
            timezone: data.timezone,
            dateFormat: 'MM/DD/YYYY',
            timeFormat: '12h'
          }
        },
        statistics: {
          totalSessions: 0,
          totalTime: 0,
          lastActivity: new Date(),
          favoriteFeatures: [],
          mostUsedTools: [],
          improvementAreas: []
        }
      });

      // Initialize usage tracking
      await FirebaseService.initializeUserUsage(userId);

      console.log('✅ Onboarding completed successfully');
      onComplete();
    } catch (error) {
      console.error('❌ Error during onboarding:', error);
      alert('There was an error saving your preferences. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-gray-900 backdrop-blur-md rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-700 shadow-2xl">
        <div className="p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-white mb-2">Welcome to PathGen AI! 🎮</h2>
            <p className="text-gray-300">Let's personalize your experience with a few quick questions</p>
            
            {/* Progress Bar */}
            <div className="mt-6">
              <div className="flex justify-between text-sm text-gray-400 mb-2">
                <span>Step {currentStep} of 3</span>
                <span>{Math.round((currentStep / 3) * 100)}%</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(currentStep / 3) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Step 1: Basic Information */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-white mb-4">Basic Information</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Display Name
                </label>
                <input
                  type="text"
                  value={data.displayName}
                  onChange={(e) => updateData('displayName', e.target.value)}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your display name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Timezone
                </label>
                <select
                  value={data.timezone}
                  onChange={(e) => updateData('timezone', e.target.value)}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="America/New_York">Eastern Time (ET)</option>
                  <option value="America/Chicago">Central Time (CT)</option>
                  <option value="America/Denver">Mountain Time (MT)</option>
                  <option value="America/Los_Angeles">Pacific Time (PT)</option>
                  <option value="Europe/London">London (GMT)</option>
                  <option value="Europe/Paris">Paris (CET)</option>
                  <option value="Asia/Tokyo">Tokyo (JST)</option>
                  <option value="Australia/Sydney">Sydney (AEST)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Language
                </label>
                <select
                  value={data.language}
                  onChange={(e) => updateData('language', e.target.value)}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="en-US">English (US)</option>
                  <option value="en-GB">English (UK)</option>
                  <option value="es-ES">Spanish</option>
                  <option value="fr-FR">French</option>
                  <option value="de-DE">German</option>
                  <option value="ja-JP">Japanese</option>
                  <option value="ko-KR">Korean</option>
                  <option value="zh-CN">Chinese (Simplified)</option>
                </select>
              </div>
            </div>
          )}

          {/* Step 2: Gaming Preferences */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-white mb-4">Gaming Preferences</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Favorite Game
                </label>
                <input
                  type="text"
                  value={data.favoriteGame}
                  onChange={(e) => updateData('favoriteGame', e.target.value)}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="What's your favorite game?"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Skill Level
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {SKILL_LEVELS.map((level) => (
                    <button
                      key={level.value}
                      onClick={() => updateData('skillLevel', level.value)}
                      className={`p-4 rounded-lg border transition-all duration-200 text-left ${
                        data.skillLevel === level.value
                          ? 'border-blue-500 bg-blue-500/20 text-blue-400'
                          : 'border-gray-700 bg-gray-800 text-gray-300 hover:border-gray-600'
                      }`}
                    >
                      <div className="font-semibold">{level.label}</div>
                      <div className="text-sm opacity-80">{level.description}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Play Style
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {PLAY_STYLES.map((style) => (
                    <button
                      key={style.value}
                      onClick={() => updateData('playStyle', style.value)}
                      className={`p-4 rounded-lg border transition-all duration-200 text-center ${
                        data.playStyle === style.value
                          ? 'border-blue-500 bg-blue-500/20 text-blue-400'
                          : 'border-gray-700 bg-gray-800 text-gray-300 hover:border-gray-600'
                      }`}
                    >
                      <div className="font-semibold">{style.label}</div>
                      <div className="text-sm opacity-80">{style.description}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Preferred Team Size
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {TEAM_SIZES.map((size) => (
                    <button
                      key={size.value}
                      onClick={() => updateData('teamSize', size.value)}
                      className={`p-4 rounded-lg border transition-all duration-200 text-center ${
                        data.teamSize === size.value
                          ? 'border-blue-500 bg-blue-500/20 text-blue-400'
                          : 'border-gray-700 bg-gray-800 text-gray-300 hover:border-gray-600'
                      }`}
                    >
                      <div className="font-semibold">{size.label}</div>
                      <div className="text-sm opacity-80">{size.description}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Goals & Modes */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-white mb-4">Goals & Game Modes</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  What are your gaming goals? (Select up to 5)
                </label>
                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                  {GOAL_OPTIONS.map((goal) => (
                    <button
                      key={goal}
                      onClick={() => {
                        const currentGoals = data.goals;
                        if (currentGoals.includes(goal)) {
                          updateData('goals', currentGoals.filter(g => g !== goal));
                        } else if (currentGoals.length < 5) {
                          updateData('goals', [...currentGoals, goal]);
                        }
                      }}
                      className={`p-3 rounded-lg border transition-all duration-200 text-sm ${
                        data.goals.includes(goal)
                          ? 'border-green-500 bg-green-500/20 text-green-400'
                          : 'border-gray-700 bg-gray-800 text-gray-300 hover:border-gray-600'
                      }`}
                    >
                      {goal}
                    </button>
                  ))}
                </div>
                <div className="text-xs text-gray-400 mt-2">
                  Selected: {data.goals.length}/5
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Preferred Game Modes (Select all that apply)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {GAME_MODES.map((mode) => (
                    <button
                      key={mode}
                      onClick={() => {
                        const currentModes = data.preferredModes;
                        if (currentModes.includes(mode)) {
                          updateData('preferredModes', currentModes.filter(m => m !== mode));
                        } else {
                          updateData('preferredModes', [...currentModes, mode]);
                        }
                      }}
                      className={`p-3 rounded-lg border transition-all duration-200 text-sm ${
                        data.preferredModes.includes(mode)
                          ? 'border-blue-500 bg-blue-500/20 text-blue-400'
                          : 'border-gray-700 bg-gray-800 text-gray-300 hover:border-gray-600'
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                <h4 className="text-blue-400 font-semibold mb-2">🎯 Your Profile Summary</h4>
                <div className="text-sm text-gray-300 space-y-1">
                  <p><span className="text-gray-400">Name:</span> {data.displayName}</p>
                  <p><span className="text-gray-400">Game:</span> {data.favoriteGame}</p>
                  <p><span className="text-gray-400">Skill:</span> {data.skillLevel}</p>
                  <p><span className="text-gray-400">Style:</span> {data.playStyle}</p>
                  <p><span className="text-gray-400">Goals:</span> {data.goals.length} selected</p>
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between mt-8">
            <button
              onClick={handleBack}
              disabled={currentStep === 1}
              className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
                currentStep === 1
                  ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                  : 'bg-gray-700 text-white hover:bg-gray-600'
              }`}
            >
              ← Back
            </button>

            {currentStep < 3 ? (
              <button
                onClick={handleNext}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
              >
                Next →
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className={`px-8 py-3 rounded-lg font-semibold transition-colors ${
                  isSubmitting
                    ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                    : 'bg-green-600 hover:bg-green-700 text-white'
                }`}
              >
                {isSubmitting ? 'Saving...' : 'Complete Setup 🚀'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
