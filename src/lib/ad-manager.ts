export interface AdConfig {
  id: string;
  type: 'banner' | 'sidebar' | 'interstitial' | 'native';
  placement: 'top' | 'bottom' | 'sidebar' | 'content';
  frequency: 'always' | 'once_per_session' | 'once_per_day';
  maxImpressions: number;
  cpm: number; // Cost per 1000 impressions
  targetAudience: 'free' | 'all';
}

export interface AdImpression {
  adId: string;
  userId: string;
  timestamp: Date;
  userAgent: string;
  ipAddress?: string;
  blocked: boolean;
  clicked: boolean;
  revenue: number;
}

export class AdManager {
  private static instance: AdManager;
  private adConfigs: Map<string, AdConfig> = new Map();
  private impressions: AdImpression[] = [];
  private sessionImpressions: Set<string> = new Set();
  private dailyImpressions: Map<string, number> = new Map();

  private constructor() {
    this.initializeDefaultAds();
  }

  static getInstance(): AdManager {
    if (!AdManager.instance) {
      AdManager.instance = new AdManager();
    }
    return AdManager.instance;
  }

  private initializeDefaultAds() {
    // Banner ads - shown frequently
    this.addAdConfig({
      id: 'top_banner',
      type: 'banner',
      placement: 'top',
      frequency: 'always',
      maxImpressions: -1, // Unlimited
      cpm: 2.50, // $2.50 per 1000 impressions
      targetAudience: 'free'
    });

    this.addAdConfig({
      id: 'bottom_banner',
      type: 'banner',
      placement: 'bottom',
      frequency: 'always',
      maxImpressions: -1,
      cpm: 2.00,
      targetAudience: 'free'
    });

    // Sidebar ads - shown less frequently
    this.addAdConfig({
      id: 'sidebar_premium',
      type: 'sidebar',
      placement: 'sidebar',
      frequency: 'once_per_session',
      maxImpressions: -1,
      cpm: 4.00, // Higher CPM for sidebar placement
      targetAudience: 'free'
    });

    // Content ads - native integration
    this.addAdConfig({
      id: 'content_native',
      type: 'native',
      placement: 'content',
      frequency: 'once_per_day',
      maxImpressions: 3, // Max 3 per day
      cpm: 3.50,
      targetAudience: 'free'
    });

    // Interstitial ads - shown sparingly
    this.addAdConfig({
      id: 'interstitial_upgrade',
      type: 'interstitial',
      placement: 'content',
      frequency: 'once_per_session',
      maxImpressions: 1,
      cpm: 8.00, // High CPM for full-screen ads
      targetAudience: 'free'
    });
  }

  addAdConfig(config: AdConfig) {
    this.adConfigs.set(config.id, config);
  }

  getAdConfig(adId: string): AdConfig | undefined {
    return this.adConfigs.get(adId);
  }

  shouldShowAd(adId: string, userId: string): boolean {
    const config = this.getAdConfig(adId);
    if (!config) return false;

    // Check frequency limits
    switch (config.frequency) {
      case 'always':
        return true;
      
      case 'once_per_session':
        const sessionKey = `${adId}_${userId}`;
        if (this.sessionImpressions.has(sessionKey)) {
          return false;
        }
        break;
      
      case 'once_per_day':
        const today = new Date().toDateString();
        const dailyKey = `${adId}_${userId}_${today}`;
        const currentCount = this.dailyImpressions.get(dailyKey) || 0;
        if (currentCount >= config.maxImpressions) {
          return false;
        }
        break;
    }

    return true;
  }

  recordImpression(adId: string, userId: string, blocked: boolean = false): AdImpression {
    const config = this.getAdConfig(adId);
    if (!config) {
      throw new Error(`Ad config not found for ${adId}`);
    }

    // Calculate revenue
    const revenue = blocked ? 0 : (config.cpm / 1000);

    const impression: AdImpression = {
      adId,
      userId,
      timestamp: new Date(),
      userAgent: navigator.userAgent,
      blocked,
      clicked: false,
      revenue
    };

    this.impressions.push(impression);

    // Update frequency tracking
    const sessionKey = `${adId}_${userId}`;
    this.sessionImpressions.add(sessionKey);

    const today = new Date().toDateString();
    const dailyKey = `${adId}_${userId}_${today}`;
    const currentCount = this.dailyImpressions.get(dailyKey) || 0;
    this.dailyImpressions.set(dailyKey, currentCount + 1);

    return impression;
  }

  recordClick(adId: string, userId: string) {
    const impression = this.impressions.find(
      imp => imp.adId === adId && imp.userId === userId && !imp.clicked
    );
    
    if (impression) {
      impression.clicked = true;
      // Click-through rate bonus (typically 2-3x CPM)
      impression.revenue *= 2.5;
    }
  }

  getRevenueStats(userId?: string, timeframe: 'day' | 'week' | 'month' = 'day') {
    let filteredImpressions = this.impressions;
    
    if (userId) {
      filteredImpressions = filteredImpressions.filter(imp => imp.userId === userId);
    }

    const now = new Date();
    const cutoff = new Date();
    
    switch (timeframe) {
      case 'day':
        cutoff.setDate(now.getDate() - 1);
        break;
      case 'week':
        cutoff.setDate(now.getDate() - 7);
        break;
      case 'month':
        cutoff.setMonth(now.getMonth() - 1);
        break;
    }

    filteredImpressions = filteredImpressions.filter(imp => imp.timestamp > cutoff);

    const totalImpressions = filteredImpressions.length;
    const blockedImpressions = filteredImpressions.filter(imp => imp.blocked).length;
    const clickedImpressions = filteredImpressions.filter(imp => imp.clicked).length;
    const totalRevenue = filteredImpressions.reduce((sum, imp) => sum + imp.revenue, 0);

    return {
      totalImpressions,
      blockedImpressions,
      clickedImpressions,
      totalRevenue,
      ctr: totalImpressions > 0 ? (clickedImpressions / totalImpressions) * 100 : 0,
      blockedRate: totalImpressions > 0 ? (blockedImpressions / totalImpressions) * 100 : 0,
      avgCpm: totalImpressions > 0 ? (totalRevenue / totalImpressions) * 1000 : 0
    };
  }

  getOptimalAdPlacement(userId: string, currentPage: string): string[] {
    const availableAds: string[] = [];
    
    this.adConfigs.forEach((config, adId) => {
      if (this.shouldShowAd(adId, userId)) {
        availableAds.push(adId);
      }
    });

    // Sort by CPM (highest revenue first)
    return availableAds.sort((a, b) => {
      const configA = this.getAdConfig(a);
      const configB = this.getAdConfig(b);
      return (configB?.cpm || 0) - (configA?.cpm || 0);
    });
  }

  // Reset session data (call on logout or new session)
  resetSession() {
    this.sessionImpressions.clear();
  }

  // Export data for analytics
  exportData(): { impressions: AdImpression[], configs: AdConfig[] } {
    return {
      impressions: [...this.impressions],
      configs: Array.from(this.adConfigs.values())
    };
  }
}

// Global instance
export const adManager = AdManager.getInstance();
