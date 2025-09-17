'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { trackPageView, trackAIInteraction } from '@/components/TwitterPixel'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import PremiumOnly from '@/components/PremiumOnly'

interface VideoAnalysis {
  id: string
  videoUrl: string
  platform: 'youtube' | 'tiktok'
  title: string
  summary: string
  keyTalkingPoints: string[]
  coachingTips: string[]
  strategicInsights: string[]
  technicalAdvice: string[]
  personalizedAdvice: string[]
  transcript?: string
  timestamp: Date
  processingTime: number
  duration: number
  creditsUsed: number
}

interface AnalysisResult {
  isFortnite: boolean
  confidence: number
  analysis?: VideoAnalysis
  error?: string
}

export default function VideoAnalysisPage() {
  const { user } = useAuth()
  const [videoUrl, setVideoUrl] = useState('')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysis, setAnalysis] = useState<VideoAnalysis | null>(null)
  const [error, setError] = useState('')
  const [recentAnalyses, setRecentAnalyses] = useState<VideoAnalysis[]>([])

  useEffect(() => {
    if (user) {
      loadRecentAnalyses()
      
      // Track video analysis page view for Twitter/X advertising
      try {
        trackPageView('Video Analysis')
      } catch (error) {
        console.warn('⚠️ Could not track video analysis page view:', error)
      }
    }
  }, [user])

  const loadRecentAnalyses = async () => {
    try {
      const response = await fetch('/api/video-analysis/history', {
        headers: {
          'user-email': user?.email || ''
        }
      })

      if (response.ok) {
        const data = await response.json()
        setRecentAnalyses(data.analyses || [])
      }
    } catch (error) {
      console.error('Failed to load recent analyses:', error)
    }
  }

  const isValidVideoUrl = (url: string): { valid: boolean; platform?: 'youtube' | 'tiktok' } => {
    const youtubeRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/
    const tiktokRegex = /(?:tiktok\.com\/@[^\/]+\/video\/|vm\.tiktok\.com\/|tiktok\.com\/t\/)([A-Za-z0-9]+)/
    
    if (youtubeRegex.test(url)) {
      return { valid: true, platform: 'youtube' }
    }
    if (tiktokRegex.test(url)) {
      return { valid: true, platform: 'tiktok' }
    }
    return { valid: false }
  }

  const handleAnalyzeVideo = async () => {
    if (!videoUrl.trim()) {
      setError('Please enter a YouTube or TikTok URL')
      return
    }

    const urlCheck = isValidVideoUrl(videoUrl)
    if (!urlCheck.valid) {
      setError('Please enter a valid YouTube or TikTok URL')
      return
    }

    setError('')
    setAnalysis(null)
    setIsAnalyzing(true)

    try {
      const response = await fetch('/api/video-analysis/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'user-email': user?.email || ''
        },
        body: JSON.stringify({
          videoUrl: videoUrl.trim(),
          platform: urlCheck.platform
        })
      })

      const result: AnalysisResult = await response.json()

      if (!response.ok) {
        if (response.status === 402) {
          // Payment required - insufficient credits
          throw new Error(`Insufficient credits. Need ${(result as any).requiredCredits} credits for this ${(result as any).videoDuration}min video, you have ${(result as any).userCredits} credits.`)
        }
        throw new Error(result.error || 'Analysis failed')
      }

      if (!result.isFortnite) {
        setError('⚠️ Please upload a Fortnite-related video so PathGen can analyze it. This video doesn\'t appear to contain Fortnite gameplay.')
        return
      }

      if (result.analysis) {
        setAnalysis(result.analysis)
        setRecentAnalyses(prev => [result.analysis!, ...prev.slice(0, 4)])
        
        // Track video analysis for Twitter/X advertising
        try {
          trackAIInteraction('video_analysis')
        } catch (error) {
          console.warn('⚠️ Could not track video analysis interaction:', error)
        }
      }

    } catch (error) {
      console.error('Video analysis failed:', error)
      setError(error instanceof Error ? error.message : 'Failed to analyze video. Please try again.')
    } finally {
      setIsAnalyzing(false)
    }
  }

  const formatTimeAgo = (date: Date | string | any) => {
    const now = new Date()
    
    // Convert date to Date object if it isn't already
    let dateObj: Date
    if (date instanceof Date) {
      dateObj = date
    } else if (typeof date === 'string') {
      dateObj = new Date(date)
    } else if (date && typeof date.toDate === 'function') {
      // Firestore Timestamp
      dateObj = date.toDate()
    } else if (date && date.seconds) {
      // Firestore Timestamp-like object
      dateObj = new Date(date.seconds * 1000)
    } else {
      // Fallback to current time if date is invalid
      dateObj = now
    }
    
    const diffInMinutes = Math.floor((now.getTime() - dateObj.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) return 'Just now'
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`
    return `${Math.floor(diffInMinutes / 1440)}d ago`
  }

  return (
    <PremiumOnly 
      pageName="Video Analysis" 
      description="Upload your Fortnite gameplay clips and get AI-powered coaching analysis with personalized improvement recommendations and detailed performance breakdown."
      showNavbar={false}
      showFooter={false}
    >
      <div className="min-h-screen bg-gradient-dark flex flex-col">
        <Navbar />
        
        <main className="flex-1 container mx-auto px-4 py-8 pt-20 sm:pt-24">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              🎥 <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Video Analysis
              </span>
            </h1>
            <p className="text-xl text-secondary-text max-w-3xl mx-auto">
              Upload your YouTube or TikTok Fortnite clips and get **AI-powered coaching analysis** 
              with personalized improvement recommendations
            </p>
          </div>

          {/* Video URL Input Section */}
          <div className="max-w-4xl mx-auto mb-12">
            <div className="bg-card-bg border border-card-border rounded-xl p-8">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                📹 Submit Your Clip
                <span className="ml-3 bg-gradient-to-r from-yellow-400 to-orange-500 text-black text-sm font-bold px-3 py-1 rounded-full">
                  PRO ONLY
                </span>
              </h2>
              
              <div className="space-y-6">
                <div>
                  <label htmlFor="videoUrl" className="block text-sm font-medium text-gray-300 mb-2">
                    YouTube or TikTok URL
                  </label>
                  <input
                    id="videoUrl"
                    type="url"
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    placeholder="https://youtube.com/watch?v=... or https://tiktok.com/@user/video/..."
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    disabled={isAnalyzing}
                  />
                </div>

                {error && (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                    <p className="text-red-400">{error}</p>
                  </div>
                )}

                <button
                  onClick={handleAnalyzeVideo}
                  disabled={isAnalyzing || !videoUrl.trim()}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white font-semibold py-4 px-6 rounded-lg transition-all duration-200 flex items-center justify-center"
                >
                  {isAnalyzing ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                      Analyzing Video...
                    </>
                  ) : (
                    <>
                      🧠 Analyze My Gameplay
                    </>
                  )}
                </button>

                <div className="text-sm text-gray-400 space-y-2">
                  <p><strong>Supported platforms:</strong> YouTube, TikTok</p>
                  <p><strong>Requirements:</strong> Video must contain Fortnite gameplay</p>
                  <p><strong>Analysis time:</strong> 30-60 seconds depending on video length</p>
                  <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                    <p className="text-blue-400 font-semibold mb-2">💳 Credit Pricing:</p>
                    <ul className="space-y-1 text-blue-300">
                      <li>• ≤5 minutes: <strong>150 credits</strong></li>
                      <li>• 6-12 minutes: <strong>170 credits</strong></li>
                      <li>• 13+ minutes: <strong>300 credits</strong></li>
                    </ul>
                    <p className="text-blue-300 text-xs mt-2">Credits are automatically calculated based on video duration</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Analysis Results */}
          {analysis && (
            <div className="max-w-4xl mx-auto mb-12">
              <div className="bg-card-bg border border-card-border rounded-xl p-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-white">📊 Analysis Results</h2>
                  <div className="text-sm text-gray-400">
                    Processed in {analysis.processingTime}s
                  </div>
                </div>

                <div className="space-y-8">
                  {/* Video Title */}
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">🎬 Video</h3>
                    <p className="text-gray-300">{analysis.title}</p>
                    <p className="text-sm text-green-400 mt-1">
                      💳 {analysis.creditsUsed} credits used ({Math.ceil(analysis.duration / 60)} minutes)
                    </p>
                  </div>

                  {/* Summary */}
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-3">📝 Summary</h3>
                    <div className="bg-gray-800/50 rounded-lg p-4">
                      <p className="text-gray-300">{analysis.summary}</p>
                    </div>
                  </div>

                  {/* Key Talking Points */}
                  {analysis.keyTalkingPoints.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-yellow-400 mb-3">💡 Key Talking Points</h3>
                      <div className="space-y-2">
                        {analysis.keyTalkingPoints.map((point, index) => (
                          <div key={index} className="flex items-start">
                            <span className="text-yellow-400 mr-3 mt-1">•</span>
                            <p className="text-gray-300">{point}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Coaching Tips */}
                  {analysis.coachingTips.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-green-400 mb-3">🎓 Coaching Tips</h3>
                      <div className="space-y-2">
                        {analysis.coachingTips.map((tip, index) => (
                          <div key={index} className="flex items-start">
                            <span className="text-green-400 mr-3 mt-1">✓</span>
                            <p className="text-gray-300">{tip}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Strategic Insights */}
                  {analysis.strategicInsights.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-blue-400 mb-3">🧠 Strategic Insights</h3>
                      <div className="space-y-2">
                        {analysis.strategicInsights.map((insight, index) => (
                          <div key={index} className="flex items-start">
                            <span className="text-blue-400 mr-3 mt-1">→</span>
                            <p className="text-gray-300">{insight}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Technical Advice */}
                  {analysis.technicalAdvice.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-purple-400 mb-3">⚙️ Technical Advice</h3>
                      <div className="space-y-2">
                        {analysis.technicalAdvice.map((advice, index) => (
                          <div key={index} className="flex items-start">
                            <span className="text-purple-400 mr-3 mt-1">⚡</span>
                            <p className="text-gray-300">{advice}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Personalized Advice */}
                  {analysis.personalizedAdvice && analysis.personalizedAdvice.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-orange-400 mb-3">🎯 Personalized For You</h3>
                      <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-4">
                        <div className="space-y-2">
                          {analysis.personalizedAdvice.map((advice, index) => (
                            <div key={index} className="flex items-start">
                              <span className="text-orange-400 mr-3 mt-1">🎯</span>
                              <p className="text-gray-300">{advice}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Transcript Display */}
                  {analysis.transcript && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-400 mb-3">📜 Full Transcript</h3>
                      <div className="bg-gray-800/50 rounded-lg p-4 max-h-60 overflow-y-auto">
                        <p className="text-gray-300 text-sm leading-relaxed">{analysis.transcript}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Recent Analyses */}
          {recentAnalyses.length > 0 && (
            <div className="max-w-4xl mx-auto">
              <h2 className="text-2xl font-bold text-white mb-6">📚 Recent Analyses</h2>
              <div className="grid gap-4">
                {recentAnalyses.map((recentAnalysis) => (
                  <div
                    key={recentAnalysis.id}
                    className="bg-card-bg border border-card-border rounded-lg p-6 cursor-pointer hover:border-blue-500/50 transition-colors"
                    onClick={() => setAnalysis(recentAnalysis)}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-white truncate">{recentAnalysis.title}</h3>
                      <div className="text-sm text-gray-400 flex items-center">
                        <span className="capitalize">{recentAnalysis.platform}</span>
                        <span className="mx-2">•</span>
                        <span>{formatTimeAgo(recentAnalysis.timestamp)}</span>
                      </div>
                    </div>
                    <p className="text-gray-400 text-sm line-clamp-2">{recentAnalysis.summary}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>

        <Footer />
      </div>
    </PremiumOnly>
  )
}
