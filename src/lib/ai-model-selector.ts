/**
 * PathGen AI Model Selection Logic
 * Automatically selects the most cost-effective AI model based on request complexity
 */

export type AIModel = '4o-mini' | '4-turbo-mini' | '5-mini';

export interface ModelConfig {
  name: AIModel;
  costPerToken: number;
  capabilities: string[];
  maxTokens: number;
  responseSpeed: 'fast' | 'medium' | 'slow';
}

export const MODEL_CONFIGS: Record<AIModel, ModelConfig> = {
  '4o-mini': {
    name: '4o-mini',
    costPerToken: 0.000001, // Very low cost
    capabilities: ['basic_responses', 'simple_queries', 'quick_feedback'],
    maxTokens: 4096,
    responseSpeed: 'fast'
  },
  '4-turbo-mini': {
    name: '4-turbo-mini',
    costPerToken: 0.000005, // Medium cost
    capabilities: ['analysis', 'multi_step', 'comparisons', 'recommendations'],
    maxTokens: 8192,
    responseSpeed: 'medium'
  },
  '5-mini': {
    name: '5-mini',
    costPerToken: 0.00001, // Higher cost
    capabilities: ['advanced_analysis', 'predictions', 'complex_patterns', 'strategic_planning'],
    maxTokens: 16384,
    responseSpeed: 'slow'
  }
};

export interface RequestAnalysis {
  complexity: 'simple' | 'medium' | 'complex';
  requiresAnalysis: boolean;
  requiresPrediction: boolean;
  requiresMultiStep: boolean;
  requiresPersonalization: boolean;
  wordCount: number;
  requestType: RequestType;
}

export type RequestType = 
  | 'quick_query'
  | 'stats_request' 
  | 'skill_update'
  | 'feedback_request'
  | 'analysis_request'
  | 'strategy_request'
  | 'prediction_request'
  | 'complex_coaching';

/**
 * Analyzes user request to determine complexity and requirements
 */
export function analyzeRequest(userMessage: string, conversationHistory?: string[]): RequestAnalysis {
  const message = userMessage.toLowerCase().trim();
  const wordCount = userMessage.split(/\s+/).length;
  
  // Quick patterns for simple requests
  const simplePatterns = [
    /^(hi|hello|hey|thanks|ok|yes|no)$/,
    /^how many (wins|losses|games|matches)/,
    /^what('s| is) my (rank|level|score|kd)/,
    /^show me my (stats|progress)/,
    /^(good|great|nice|cool|awesome)$/,
    /^update my (skill|progress|level)/
  ];

  // Patterns requiring analysis
  const analysisPatterns = [
    /how (can|do) i improve/,
    /what should i (focus|work) on/,
    /analyze my (performance|gameplay|stats)/,
    /compare my (performance|stats) (with|to)/,
    /why (am i|do i keep)/,
    /what('s| is) wrong with my/,
    /help me (get better|improve)/,
    /(strategy|tactics|approach) for/
  ];

  // Patterns requiring prediction/advanced analysis
  const complexPatterns = [
    /predict my (future|next|upcoming)/,
    /trend analysis/,
    /pattern in my/,
    /over (the last|multiple) (week|month|games)/,
    /long.term (plan|strategy|improvement)/,
    /advanced (coaching|analysis|insights)/,
    /meta analysis/,
    /competitive (strategy|analysis)/,
    /tournament (preparation|strategy)/
  ];

  // Multi-step indicators
  const multiStepIndicators = [
    /first.+(then|next|after)/,
    /step by step/,
    /multiple (ways|approaches|strategies)/,
    /both.+and/,
    /not only.+but also/,
    /several (things|areas|aspects)/
  ];

  // Check for simple patterns first
  if (simplePatterns.some(pattern => pattern.test(message)) || wordCount <= 5) {
    return {
      complexity: 'simple',
      requiresAnalysis: false,
      requiresPrediction: false,
      requiresMultiStep: false,
      requiresPersonalization: false,
      wordCount,
      requestType: getSimpleRequestType(message)
    };
  }

  // Check for complex patterns
  const hasComplexPattern = complexPatterns.some(pattern => pattern.test(message));
  const hasAnalysisPattern = analysisPatterns.some(pattern => pattern.test(message));
  const hasMultiStep = multiStepIndicators.some(pattern => pattern.test(message));
  const requiresPersonalization = /my (playstyle|preferences|goals|weaknesses|strengths)/.test(message);

  if (hasComplexPattern || wordCount > 50 || 
      (hasAnalysisPattern && hasMultiStep) ||
      (requiresPersonalization && hasAnalysisPattern)) {
    return {
      complexity: 'complex',
      requiresAnalysis: true,
      requiresPrediction: hasComplexPattern,
      requiresMultiStep: hasMultiStep,
      requiresPersonalization,
      wordCount,
      requestType: getComplexRequestType(message, hasComplexPattern)
    };
  }

  // Medium complexity
  if (hasAnalysisPattern || hasMultiStep || wordCount > 20) {
    return {
      complexity: 'medium',
      requiresAnalysis: hasAnalysisPattern,
      requiresPrediction: false,
      requiresMultiStep: hasMultiStep,
      requiresPersonalization,
      wordCount,
      requestType: getMediumRequestType(message, hasAnalysisPattern)
    };
  }

  // Default to simple
  return {
    complexity: 'simple',
    requiresAnalysis: false,
    requiresPrediction: false,
    requiresMultiStep: false,
    requiresPersonalization: false,
    wordCount,
    requestType: 'quick_query'
  };
}

function getSimpleRequestType(message: string): RequestType {
  if (/stats|score|rank|level/.test(message)) return 'stats_request';
  if (/update|progress/.test(message)) return 'skill_update';
  if (/thanks|good|great|nice/.test(message)) return 'feedback_request';
  return 'quick_query';
}

function getMediumRequestType(message: string, hasAnalysis: boolean): RequestType {
  if (hasAnalysis) return 'analysis_request';
  if (/strategy|tactics/.test(message)) return 'strategy_request';
  return 'analysis_request';
}

function getComplexRequestType(message: string, hasComplexPattern: boolean): RequestType {
  if (hasComplexPattern) return 'prediction_request';
  if (/tournament|competitive|advanced/.test(message)) return 'complex_coaching';
  return 'strategy_request';
}

/**
 * Selects the optimal AI model based on request analysis
 */
export function selectModel(analysis: RequestAnalysis, conversationContext?: {
  messageCount: number;
  hasGameData: boolean;
  userTier: 'free' | 'pro';
}): AIModel {
  
  // Pro users get access to better models more liberally
  const isProUser = conversationContext?.userTier === 'pro';
  
  // Simple requests always use 4o-mini
  if (analysis.complexity === 'simple') {
    return '4o-mini';
  }
  
  // Complex requests with prediction/advanced analysis
  if (analysis.complexity === 'complex' || 
      analysis.requiresPrediction ||
      analysis.requestType === 'complex_coaching' ||
      analysis.requestType === 'prediction_request') {
    
    // Pro users get 5-mini, free users get 4-turbo-mini for complex requests
    return isProUser ? '5-mini' : '4-turbo-mini';
  }
  
  // Medium complexity requests
  if (analysis.complexity === 'medium' ||
      analysis.requiresAnalysis ||
      analysis.requiresMultiStep ||
      analysis.wordCount > 30) {
    
    // Use 4-turbo-mini for medium complexity
    return '4-turbo-mini';
  }
  
  // Default fallback
  return '4o-mini';
}

/**
 * Estimates cost for a request based on model and expected tokens
 */
export function estimateCost(model: AIModel, estimatedInputTokens: number, estimatedOutputTokens: number): number {
  const config = MODEL_CONFIGS[model];
  const totalTokens = estimatedInputTokens + estimatedOutputTokens;
  return totalTokens * config.costPerToken;
}

/**
 * Main function to get model recommendation
 */
export function getModelRecommendation(
  userMessage: string, 
  conversationHistory?: string[],
  userContext?: {
    messageCount: number;
    hasGameData: boolean;
    userTier: 'free' | 'pro';
  }
): {
  model: AIModel;
  analysis: RequestAnalysis;
  estimatedCost: number;
  reasoning: string;
} {
  const analysis = analyzeRequest(userMessage, conversationHistory);
  const model = selectModel(analysis, userContext);
  
  // Estimate tokens (rough approximation)
  const estimatedInputTokens = userMessage.length / 4; // ~4 chars per token
  const estimatedOutputTokens = analysis.complexity === 'simple' ? 50 : 
                                analysis.complexity === 'medium' ? 200 : 500;
  
  const estimatedCost = estimateCost(model, estimatedInputTokens, estimatedOutputTokens);
  
  const reasoning = generateReasoning(analysis, model, userContext?.userTier || 'free');
  
  return {
    model,
    analysis,
    estimatedCost,
    reasoning
  };
}

function generateReasoning(analysis: RequestAnalysis, model: AIModel, userTier: string): string {
  const reasons = [];
  
  if (analysis.complexity === 'simple') {
    reasons.push('Simple request detected');
  } else if (analysis.complexity === 'complex') {
    reasons.push('Complex analysis required');
  } else {
    reasons.push('Medium complexity request');
  }
  
  if (analysis.requiresPrediction) reasons.push('prediction needed');
  if (analysis.requiresMultiStep) reasons.push('multi-step reasoning');
  if (analysis.requiresPersonalization) reasons.push('personalized response');
  
  if (userTier === 'pro') reasons.push('Pro user - premium model access');
  
  return `Selected ${model}: ${reasons.join(', ')}`;
}

/**
 * Usage tracking for analytics
 */
export interface ModelUsage {
  model: AIModel;
  requestType: RequestType;
  complexity: 'simple' | 'medium' | 'complex';
  cost: number;
  timestamp: Date;
  userId: string;
  userTier: 'free' | 'pro';
}

export class ModelUsageTracker {
  private usage: ModelUsage[] = [];
  
  track(usage: ModelUsage) {
    this.usage.push(usage);
    
    // Log to console for debugging
    console.log(`🤖 AI Model: ${usage.model} | Type: ${usage.requestType} | Cost: $${usage.cost.toFixed(6)}`);
  }
  
  getDailyStats(userId: string) {
    const today = new Date().toDateString();
    const todayUsage = this.usage.filter(u => 
      u.userId === userId && u.timestamp.toDateString() === today
    );
    
    return {
      totalRequests: todayUsage.length,
      totalCost: todayUsage.reduce((sum, u) => sum + u.cost, 0),
      modelBreakdown: this.getModelBreakdown(todayUsage),
      complexityBreakdown: this.getComplexityBreakdown(todayUsage)
    };
  }
  
  private getModelBreakdown(usage: ModelUsage[]) {
    return usage.reduce((acc, u) => {
      acc[u.model] = (acc[u.model] || 0) + 1;
      return acc;
    }, {} as Record<AIModel, number>);
  }
  
  private getComplexityBreakdown(usage: ModelUsage[]) {
    return usage.reduce((acc, u) => {
      acc[u.complexity] = (acc[u.complexity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }
}

// Global tracker instance
export const modelUsageTracker = new ModelUsageTracker();
