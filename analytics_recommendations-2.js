// server/services/AnalyticsService.js
const EventEmitter = require('events');

class AnalyticsService extends EventEmitter {
  constructor(prisma, redis) {
    super();
    this.prisma = prisma;
    this.redis = redis;
    this.eventBuffer = [];
    this.bufferSize = 100;
    this.flushInterval = 30000; // 30 seconds
    
    // Machine learning models for recommendations
    this.models = {
      bondRecommendation: null,
      creatorRecommendation: null,
      contentRecommendation: null
    };
    
    // Start background processors
    this.startEventProcessor();
    this.startAnalyticsAggregator();
    this.loadRecommendationModels();
  }

  // ================================
  // Event Tracking
  // ================================

  async trackEvent(eventType, userId, data = {}, metadata = {}) {
    const event = {
      type: eventType,
      userId,
      data,
      metadata: {
        ...metadata,
        timestamp: new Date().toISOString(),
        userAgent: metadata.userAgent,
        platform: metadata.platform || 'WEB',
        sessionId: metadata.sessionId,
        ipAddress: metadata.ipAddress
      }
    };

    // Add to buffer for batch processing
    this.eventBuffer.push(event);

    // Real-time processing for critical events
    if (this.isCriticalEvent(eventType)) {
      await this.processEventImmediately(event);
    }

    // Flush buffer if it's full
    if (this.eventBuffer.length >= this.bufferSize) {
      await this.flushEventBuffer();
    }

    // Emit for real-time listeners
    this.emit('event_tracked', event);

    return event;
  }

  isCriticalEvent(eventType) {
    const criticalEvents = [
      'bond_created',
      'bond_supported',
      'bond_completed',
      'token_created',
      'user_registered',
      'payment_completed'
    ];
    return criticalEvents.includes(eventType);
  }

  async processEventImmediately(event) {
    try {
      // Update real-time metrics
      await this.updateRealTimeMetrics(event);
      
      // Trigger recommendations update
      if (event.type === 'bond_supported' || event.type === 'token_created') {
        await this.updateUserRecommendations(event.userId);
      }
      
      // Check for milestone achievements
      await this.checkMilestones(event);
      
    } catch (error) {
      console.error('Immediate event processing error:', error);
    }
  }

  // ================================
  // User Analytics
  // ================================

  async getUserAnalytics(userId, timeRange = '30d') {
    const cacheKey = `user_analytics_${userId}_${timeRange}`;
    
    // Try cache first
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    const dateRange = this.getDateRange(timeRange);
    
    const [
      userStats,
      bondStats,
      tokenStats,
      engagementStats,
      revenueStats
    ] = await Promise.all([
      this.getUserStats(userId, dateRange),
      this.getUserBondStats(userId, dateRange),
      this.getUserTokenStats(userId, dateRange),
      this.getUserEngagementStats(userId, dateRange),
      this.getUserRevenueStats(userId, dateRange)
    ]);

    const analytics = {
      user: userStats,
      bonds: bondStats,
      tokens: tokenStats,
      engagement: engagementStats,
      revenue: revenueStats,
      timeRange,
      generatedAt: new Date().toISOString()
    };

    // Cache for 1 hour
    await this.redis.setex(cacheKey, 3600, JSON.stringify(analytics));
    
    return analytics;
  }

  async getUserStats(userId, dateRange) {
    const events = await this.getEventsInRange(userId, dateRange, [
      'page_view',
      'profile_view',
      'login',
      'session_start'
    ]);

    const pageViews = events.filter(e => e.type === 'page_view').length;
    const profileViews = events.filter(e => e.type === 'profile_view').length;
    const sessions = new Set(events.map(e => e.sessionId)).size;
    const avgSessionDuration = this.calculateAvgSessionDuration(events);

    return {
      pageViews,
      profileViews,
      sessions,
      avgSessionDuration,
      totalEvents: events.length
    };
  }

  async getUserBondStats(userId, dateRange) {
    const bonds = await this.prisma.bond.findMany({
      where: {
        creatorId: userId,
        createdAt: {
          gte: dateRange.start,
          lte: dateRange.end
        }
      },
      include: {
        supporters: true,
        analytics: true
      }
    });

    const bondStats = {
      totalBonds: bonds.length,
      activeBonds: bonds.filter(b => b.isActive).length,
      completedBonds: bonds.filter(b => b.isCompleted).length,
      totalRaised: bonds.reduce((sum, b) => sum + parseFloat(b.currentAmount), 0),
      avgBondAmount: bonds.length > 0 ? bonds.reduce((sum, b) => sum + parseFloat(b.targetAmount), 0) / bonds.length : 0,
      totalSupporters: new Set(bonds.flatMap(b => b.supporters.map(s => s.supporterId))).size,
      avgSupportersPerBond: bonds.length > 0 ? bonds.reduce((sum, b) => sum + b.supporters.length, 0) / bonds.length : 0
    };

    return bondStats;
  }

  async getUserTokenStats(userId, dateRange) {
    const tokens = await this.prisma.iPToken.findMany({
      where: {
        creatorId: userId,
        createdAt: {
          gte: dateRange.start,
          lte: dateRange.end
        }
      },
      include: {
        analytics: true
      }
    });

    return {
      totalTokens: tokens.length,
      activeTokens: tokens.filter(t => t.isActive).length,
      featuredTokens: tokens.filter(t => t.isFeatured).length,
      totalViews: tokens.reduce((sum, t) => sum + t.viewCount, 0),
      totalLikes: tokens.reduce((sum, t) => sum + t.likeCount, 0),
      totalShares: tokens.reduce((sum, t) => sum + t.shareCount, 0),
      avgViewsPerToken: tokens.length > 0 ? tokens.reduce((sum, t) => sum + t.viewCount, 0) / tokens.length : 0,
      categoryBreakdown: this.getCategoryBreakdown(tokens)
    };
  }

  async getUserEngagementStats(userId, dateRange) {
    const engagementEvents = await this.getEventsInRange(userId, dateRange, [
      'bond_view',
      'token_view',
      'profile_view',
      'social_share',
      'comment_post',
      'like_action'
    ]);

    const engagement = {
      totalEngagements: engagementEvents.length,
      bondViews: engagementEvents.filter(e => e.type === 'bond_view').length,
      tokenViews: engagementEvents.filter(e => e.type === 'token_view').length,
      socialShares: engagementEvents.filter(e => e.type === 'social_share').length,
      comments: engagementEvents.filter(e => e.type === 'comment_post').length,
      likes: engagementEvents.filter(e => e.type === 'like_action').length,
      engagementRate: this.calculateEngagementRate(userId, engagementEvents, dateRange)
    };

    return engagement;
  }

  async getUserRevenueStats(userId, dateRange) {
    const revenueEvents = await this.getEventsInRange(userId, dateRange, [
      'bond_supported',
      'token_transfer',
      'royalty_payment'
    ]);

    const bondRevenue = revenueEvents
      .filter(e => e.type === 'bond_supported')
      .reduce((sum, e) => sum + parseFloat(e.data.amount || 0), 0);

    const royaltyRevenue = revenueEvents
      .filter(e => e.type === 'royalty_payment')
      .reduce((sum, e) => sum + parseFloat(e.data.amount || 0), 0);

    return {
      totalRevenue: bondRevenue + royaltyRevenue,
      bondRevenue,
      royaltyRevenue,
      avgRevenuePerBond: await this.getAvgRevenuePerBond(userId, dateRange),
      revenueGrowth: await this.calculateRevenueGrowth(userId, dateRange)
    };
  }

  // ================================
  // Platform Analytics
  // ================================

  async getPlatformAnalytics(timeRange = '30d') {
    const cacheKey = `platform_analytics_${timeRange}`;
    
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    const dateRange = this.getDateRange(timeRange);
    
    const [
      userMetrics,
      bondMetrics,
      tokenMetrics,
      revenueMetrics,
      engagementMetrics
    ] = await Promise.all([
      this.getPlatformUserMetrics(dateRange),
      this.getPlatformBondMetrics(dateRange),
      this.getPlatformTokenMetrics(dateRange),
      this.getPlatformRevenueMetrics(dateRange),
      this.getPlatformEngagementMetrics(dateRange)
    ]);

    const analytics = {
      users: userMetrics,
      bonds: bondMetrics,
      tokens: tokenMetrics,
      revenue: revenueMetrics,
      engagement: engagementMetrics,
      timeRange,
      generatedAt: new Date().toISOString()
    };

    // Cache for 30 minutes
    await this.redis.setex(cacheKey, 1800, JSON.stringify(analytics));
    
    return analytics;
  }

  // ================================
  // AI Recommendation Engine
  // ================================

  async generateRecommendations(userId, type = 'mixed', limit = 10) {
    const cacheKey = `recommendations_${userId}_${type}`;
    
    // Check cache first
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    const userProfile = await this.buildUserProfile(userId);
    let recommendations = [];

    switch (type) {
      case 'bonds':
        recommendations = await this.recommendBonds(userProfile, limit);
        break;
      case 'creators':
        recommendations = await this.recommendCreators(userProfile, limit);
        break;
      case 'tokens':
        recommendations = await this.recommendTokens(userProfile, limit);
        break;
      case 'mixed':
        recommendations = await this.generateMixedRecommendations(userProfile, limit);
        break;
    }

    // Add explanation for each recommendation
    recommendations = await this.addRecommendationExplanations(recommendations, userProfile);

    // Cache for 1 hour
    await this.redis.setex(cacheKey, 3600, JSON.stringify(recommendations));

    return recommendations;
  }

  async buildUserProfile(userId) {
    const [
      user,
      bondHistory,
      tokenHistory,
      engagementHistory,
      socialConnections
    ] = await Promise.all([
      this.prisma.user.findUnique({ where: { id: userId } }),
      this.getUserBondHistory(userId),
      this.getUserTokenHistory(userId),
      this.getUserEngagementHistory(userId),
      this.getUserSocialConnections(userId)
    ]);

    const profile = {
      userId,
      preferences: user.preferences || {},
      demographics: {
        role: user.role,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin
      },
      behavior: {
        bonds: this.analyzeBondBehavior(bondHistory),
        tokens: this.analyzeTokenBehavior(tokenHistory),
        engagement: this.analyzeEngagementBehavior(engagementHistory)
      },
      social: {
        connections: socialConnections,
        influence: await this.calculateUserInfluence(userId)
      },
      vectors: await this.generateUserVectors(userId)
    };

    return profile;
  }

  async recommendBonds(userProfile, limit) {
    // Collaborative filtering + content-based filtering
    const bonds = await this.prisma.bond.findMany({
      where: {
        isActive: true,
        creatorId: { not: userProfile.userId }
      },
      include: {
        creator: true,
        ipToken: true,
        supporters: true
      }
    });

    // Score each bond
    const scoredBonds = bonds.map(bond => ({
      ...bond,
      score: this.calculateBondScore(bond, userProfile),
      reasons: this.getBondRecommendationReasons(bond, userProfile)
    }));

    // Sort by score and return top recommendations
    return scoredBonds
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(bond => ({
        type: 'bond',
        id: bond.id,
        title: bond.title,
        description: bond.description,
        creator: bond.creator,
        targetAmount: bond.targetAmount,
        currentAmount: bond.currentAmount,
        score: bond.score,
        reasons: bond.reasons
      }));
  }

  calculateBondScore(bond, userProfile) {
    let score = 0;

    // Category preference
    if (userProfile.behavior.bonds.preferredCategories.includes(bond.ipToken?.category)) {
      score += 0.3;
    }

    // Amount range preference
    const targetAmount = parseFloat(bond.targetAmount);
    const userAvgAmount = userProfile.behavior.bonds.avgSupportAmount;
    if (targetAmount >= userAvgAmount * 0.5 && targetAmount <= userAvgAmount * 2) {
      score += 0.25;
    }

    // Creator similarity
    const creatorScore = this.calculateCreatorSimilarity(bond.creator, userProfile);
    score += creatorScore * 0.2;

    // Social proof
    const supporterCount = bond.supporters.length;
    if (supporterCount > 0) {
      score += Math.min(supporterCount / 50, 0.15); // Max 0.15 for social proof
    }

    // Trend factor
    const daysOld = (new Date() - bond.createdAt) / (1000 * 60 * 60 * 24);
    if (daysOld < 7) {
      score += 0.1; // Boost for new bonds
    }

    return Math.min(score, 1.0);
  }

  async recommendCreators(userProfile, limit) {
    const creators = await this.prisma.user.findMany({
      where: {
        role: 'CREATOR',
        id: { not: userProfile.userId },
        isActive: true
      },
      include: {
        bonds: { where: { isActive: true } },
        ipTokens: { where: { isActive: true } },
        analytics: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    });

    const scoredCreators = creators.map(creator => ({
      ...creator,
      score: this.calculateCreatorScore(creator, userProfile),
      reasons: this.getCreatorRecommendationReasons(creator, userProfile)
    }));

    return scoredCreators
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(creator => ({
        type: 'creator',
        id: creator.id,
        displayName: creator.displayName,
        bio: creator.bio,
        avatar: creator.avatar,
        bonds: creator.bonds.length,
        tokens: creator.ipTokens.length,
        score: creator.score,
        reasons: creator.reasons
      }));
  }

  async generateMixedRecommendations(userProfile, limit) {
    const bondLimit = Math.ceil(limit * 0.5);
    const creatorLimit = Math.ceil(limit * 0.3);
    const tokenLimit = Math.floor(limit * 0.2);

    const [bonds, creators, tokens] = await Promise.all([
      this.recommendBonds(userProfile, bondLimit),
      this.recommendCreators(userProfile, creatorLimit),
      this.recommendTokens(userProfile, tokenLimit)
    ]);

    // Interleave recommendations
    const mixed = [];
    const sources = [
      { items: bonds, weight: 0.5 },
      { items: creators, weight: 0.3 },
      { items: tokens, weight: 0.2 }
    ];

    while (mixed.length < limit && sources.some(s => s.items.length > 0)) {
      for (const source of sources) {
        if (source.items.length > 0 && Math.random() < source.weight) {
          mixed.push(source.items.shift());
          if (mixed.length >= limit) break;
        }
      }
    }

    return mixed.slice(0, limit);
  }

  async addRecommendationExplanations(recommendations, userProfile) {
    return recommendations.map(rec => ({
      ...rec,
      explanation: this.generateExplanation(rec, userProfile)
    }));
  }

  generateExplanation(recommendation, userProfile) {
    const reasons = recommendation.reasons || [];
    const explanations = {
      category_match: "Based on your interest in similar categories",
      creator_similarity: "From creators with similar content to ones you support",
      social_proof: "Popular among users with similar interests",
      trending: "Currently trending on the platform",
      amount_match: "Within your typical support range",
      recent_activity: "Based on your recent activity"
    };

    const primaryReason = reasons[0];
    return explanations[primaryReason] || "Recommended for you";
  }

  // ================================
  // Machine Learning Pipeline
  // ================================

  async trainRecommendationModels() {
    console.log('🤖 Training recommendation models...');

    try {
      // Prepare training data
      const [bondData, userInteractionData, contentFeatures] = await Promise.all([
        this.prepareBondTrainingData(),
        this.prepareUserInteractionData(),
        this.prepareContentFeatures()
      ]);

      // Train models (simplified - in production you'd use TensorFlow.js or external ML service)
      this.models.bondRecommendation = await this.trainBondModel(bondData, userInteractionData);
      this.models.creatorRecommendation = await this.trainCreatorModel(userInteractionData);
      this.models.contentRecommendation = await this.trainContentModel(contentFeatures);

      // Save models to Redis for persistence
      await this.saveModelsToCache();

      console.log('✅ Recommendation models trained successfully');
    } catch (error) {
      console.error('❌ Model training failed:', error);
    }
  }

  async predictUserPreferences(userId, items) {
    const userProfile = await this.buildUserProfile(userId);
    const predictions = [];

    for (const item of items) {
      const features = await this.extractItemFeatures(item);
      const userFeatures = userProfile.vectors;
      
      // Simple dot product similarity (in production, use trained models)
      const similarity = this.calculateCosineSimilarity(userFeatures, features);
      
      predictions.push({
        itemId: item.id,
        itemType: item.type,
        score: similarity,
        confidence: this.calculatePredictionConfidence(userProfile, item)
      });
    }

    return predictions.sort((a, b) => b.score - a.score);
  }

  // ================================
  // Real-time Analytics
  // ================================

  async updateRealTimeMetrics(event) {
    const date = new Date().toISOString().split('T')[0];
    const hour = new Date().getHours();

    // Update hourly metrics
    await this.redis.hincrby(`metrics_${date}_${hour}`, event.type, 1);
    
    // Update user-specific metrics
    await this.redis.hincrby(`user_metrics_${event.userId}_${date}`, event.type, 1);
    
    // Update global real-time counters
    await this.redis.incr(`realtime_${event.type}`);
    await this.redis.expire(`realtime_${event.type}`, 3600); // Expire after 1 hour
  }

  async getRealTimeMetrics() {
    const keys = await this.redis.keys('realtime_*');
    const metrics = {};

    for (const key of keys) {
      const eventType = key.replace('realtime_', '');
      const count = await this.redis.get(key);
      metrics[eventType] = parseInt(count) || 0;
    }

    return metrics;
  }

  // ================================
  // Reporting & Insights
  // ================================

  async generateAnalyticsReport(userId, reportType = 'comprehensive', timeRange = '30d') {
    const analytics = await this.getUserAnalytics(userId, timeRange);
    const recommendations = await this.generateRecommendations(userId, 'mixed', 5);
    const insights = await this.generateInsights(analytics);

    const report = {
      userId,
      reportType,
      timeRange,
      generatedAt: new Date().toISOString(),
      summary: {
        totalBonds: analytics.bonds.totalBonds,
        totalRevenue: analytics.revenue.totalRevenue,
        engagementRate: analytics.engagement.engagementRate,
        growthRate: insights.growthRate
      },
      analytics,
      insights,
      recommendations,
      actionableItems: this.generateActionableItems(analytics, insights)
    };

    return report;
  }

  async generateInsights(analytics) {
    const insights = [];

    // Revenue insights
    if (analytics.revenue.revenueGrowth > 0.2) {
      insights.push({
        type: 'positive',
        category: 'revenue',
        message: `Your revenue has grown by ${(analytics.revenue.revenueGrowth * 100).toFixed(1)}% - great progress!`,
        impact: 'high'
      });
    }

    // Engagement insights
    if (analytics.engagement.engagementRate < 0.05) {
      insights.push({
        type: 'improvement',
        category: 'engagement',
        message: 'Your engagement rate could be improved. Consider posting more updates and interacting with supporters.',
        impact: 'medium'
      });
    }

    // Bond performance insights
    const completionRate = analytics.bonds.completedBonds / analytics.bonds.totalBonds;
    if (completionRate > 0.8) {
      insights.push({
        type: 'positive',
        category: 'bonds',
        message: `Excellent! ${(completionRate * 100).toFixed(1)}% of your bonds reach their funding goals.`,
        impact: 'high'
      });
    }

    return insights;
  }

  generateActionableItems(analytics, insights) {
    const actions = [];

    // Based on low engagement
    if (analytics.engagement.engagementRate < 0.05) {
      actions.push({
        title: 'Increase Engagement',
        description: 'Post regular updates to your bonds and respond to supporter comments',
        priority: 'high',
        estimatedImpact: 'Increase engagement by 2-3x'
      });
    }

    // Based on bond performance
    if (analytics.bonds.avgSupportersPerBond < 5) {
      actions.push({
        title: 'Expand Your Reach',
        description: 'Share your bonds on social media to attract more supporters',
        priority: 'medium',
        estimatedImpact: 'Increase supporter count by 50%'
      });
    }

    return actions;
  }

  // ================================
  // Helper Methods
  // ================================

  startEventProcessor() {
    // Flush event buffer every 30 seconds
    setInterval(async () => {
      if (this.eventBuffer.length > 0) {
        await this.flushEventBuffer();
      }
    }, this.flushInterval);
  }

  async flushEventBuffer() {
    if (this.eventBuffer.length === 0) return;

    const events = this.eventBuffer.splice(0);
    
    try {
      // Batch insert events
      await this.batchInsertEvents(events);
      
      // Process for analytics
      await this.processEventsForAnalytics(events);
      
    } catch (error) {
      console.error('Event buffer flush error:', error);
      // Re-add events to buffer for retry
      this.eventBuffer.unshift(...events);
    }
  }

  startAnalyticsAggregator() {
    // Run aggregation every hour
    setInterval(async () => {
      await this.aggregateHourlyAnalytics();
    }, 60 * 60 * 1000);

    // Run daily aggregation at midnight
    setInterval(async () => {
      if (new Date().getHours() === 0) {
        await this.aggregateDailyAnalytics();
      }
    }, 60 * 60 * 1000);
  }

  getDateRange(timeRange) {
    const end = new Date();
    let start;

    switch (timeRange) {
      case '7d':
        start = new Date(end.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        start = new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        start = new Date(end.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case '1y':
        start = new Date(end.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        start = new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    return { start, end };
  }

  calculateCosineSimilarity(vectorA, vectorB) {
    const dotProduct = vectorA.reduce((sum, a, i) => sum + a * vectorB[i], 0);
    const magnitudeA = Math.sqrt(vectorA.reduce((sum, a) => sum + a * a, 0));
    const magnitudeB = Math.sqrt(vectorB.reduce((sum, b) => sum + b * b, 0));
    
    return dotProduct / (magnitudeA * magnitudeB);
  }

  async loadRecommendationModels() {
    // Load pre-trained models from cache or train new ones
    const cachedModels = await this.redis.get('recommendation_models');
    
    if (cachedModels) {
      this.models = JSON.parse(cachedModels);
      console.log('✅ Loaded cached recommendation models');
    } else {
      console.log('🔄 No cached models found, training new ones...');
      await this.trainRecommendationModels();
    }
  }
}

module.exports = AnalyticsService;