// server/index.js - Main Express Server
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const morgan = require('morgan');
const { createServer } = require('http');
const { Server } = require('socket.io');
const Redis = require('redis');
const { PrismaClient } = require('@prisma/client');

// Route imports
const authRoutes = require('./routes/auth');
const bondsRoutes = require('./routes/bonds');
const ipTokensRoutes = require('./routes/ipTokens');
const usersRoutes = require('./routes/users');
const analyticsRoutes = require('./routes/analytics');
const syncRoutes = require('./routes/sync');

// Middleware imports
const authMiddleware = require('./middleware/auth');
const errorHandler = require('./middleware/errorHandler');
const requestLogger = require('./middleware/requestLogger');

// Services
const SyncService = require('./services/SyncService');
const NotificationService = require('./services/NotificationService');
const AnalyticsService = require('./services/AnalyticsService');

class CreatorBondsServer {
  constructor() {
    this.app = express();
    this.server = createServer(this.app);
    this.io = new Server(this.server, {
      cors: {
        origin: process.env.FRONTEND_URLS?.split(',') || ['http://localhost:3000'],
        methods: ['GET', 'POST', 'PUT', 'DELETE']
      }
    });
    
    this.prisma = new PrismaClient();
    this.redis = Redis.createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379'
    });
    
    this.syncService = new SyncService(this.prisma, this.redis);
    this.notificationService = new NotificationService(this.io, this.redis);
    this.analyticsService = new AnalyticsService(this.prisma, this.redis);
  }

  async initialize() {
    try {
      // Connect to databases
      await this.prisma.$connect();
      await this.redis.connect();
      
      // Setup middleware
      this.setupMiddleware();
      
      // Setup routes
      this.setupRoutes();
      
      // Setup WebSocket handlers
      this.setupWebSocketHandlers();
      
      // Setup error handling
      this.setupErrorHandling();
      
      console.log('✅ CreatorBonds server initialized successfully');
    } catch (error) {
      console.error('❌ Server initialization failed:', error);
      throw error;
    }
  }

  setupMiddleware() {
    // Security middleware
    this.app.use(helmet());
    this.app.use(cors({
      origin: process.env.FRONTEND_URLS?.split(',') || ['http://localhost:3000'],
      credentials: true
    }));

    // Rate limiting
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // limit each IP to 100 requests per windowMs
      message: 'Too many requests from this IP, please try again later'
    });
    this.app.use('/api/', limiter);

    // Body parsing and compression
    this.app.use(compression());
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Logging
    this.app.use(morgan('combined'));
    this.app.use(requestLogger);

    // Make services available to routes
    this.app.use((req, res, next) => {
      req.services = {
        sync: this.syncService,
        notifications: this.notificationService,
        analytics: this.analyticsService,
        prisma: this.prisma,
        redis: this.redis,
        io: this.io
      };
      next();
    });
  }

  setupRoutes() {
    // Health check
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || '1.0.0',
        services: {
          database: 'connected',
          redis: 'connected',
          websockets: 'active'
        }
      });
    });

    // API routes
    this.app.use('/api/auth', authRoutes);
    this.app.use('/api/bonds', authMiddleware, bondsRoutes);
    this.app.use('/api/ip-tokens', authMiddleware, ipTokensRoutes);
    this.app.use('/api/users', authMiddleware, usersRoutes);
    this.app.use('/api/analytics', authMiddleware, analyticsRoutes);
    this.app.use('/api/sync', authMiddleware, syncRoutes);

    // Platform-specific routes
    this.app.use('/api/mobile', authMiddleware, require('./routes/mobile'));
    this.app.use('/api/web', authMiddleware, require('./routes/web'));
    this.app.use('/api/webhook', require('./routes/webhooks'));
  }

  setupWebSocketHandlers() {
    this.io.on('connection', (socket) => {
      console.log(`✅ Client connected: ${socket.id}`);

      // Authentication
      socket.on('authenticate', async (token) => {
        try {
          const user = await this.authService.verifyToken(token);
          socket.userId = user.id;
          socket.join(`user_${user.id}`);
          
          // Send user their current data
          const userData = await this.syncService.getUserData(user.id);
          socket.emit('initial_data', userData);
          
          console.log(`🔐 User ${user.id} authenticated on socket ${socket.id}`);
        } catch (error) {
          socket.emit('auth_error', { message: 'Authentication failed' });
        }
      });

      // Handle real-time sync requests
      socket.on('sync_request', async (data) => {
        if (!socket.userId) return;
        
        try {
          const syncResult = await this.syncService.handleSyncRequest(
            socket.userId, 
            data
          );
          socket.emit('sync_response', syncResult);
        } catch (error) {
          socket.emit('sync_error', { message: error.message });
        }
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        console.log(`❌ Client disconnected: ${socket.id}`);
      });
    });
  }

  setupErrorHandling() {
    // 404 handler
    this.app.use('*', (req, res) => {
      res.status(404).json({
        error: 'Route not found',
        message: `Cannot ${req.method} ${req.originalUrl}`
      });
    });

    // Global error handler
    this.app.use(errorHandler);

    // Graceful shutdown
    process.on('SIGTERM', () => this.shutdown());
    process.on('SIGINT', () => this.shutdown());
  }

  async shutdown() {
    console.log('🔄 Shutting down server gracefully...');
    
    try {
      await this.prisma.$disconnect();
      await this.redis.quit();
      this.server.close(() => {
        console.log('✅ Server shutdown complete');
        process.exit(0);
      });
    } catch (error) {
      console.error('❌ Error during shutdown:', error);
      process.exit(1);
    }
  }

  start(port = process.env.PORT || 3001) {
    this.server.listen(port, () => {
      console.log(`🚀 CreatorBonds API server running on port ${port}`);
      console.log(`📊 Health check: http://localhost:${port}/health`);
      console.log(`🔗 WebSocket endpoint: ws://localhost:${port}`);
    });
  }
}

module.exports = CreatorBondsServer;

// ================================
// server/services/SyncService.js
// ================================

class SyncService {
  constructor(prisma, redis) {
    this.prisma = prisma;
    this.redis = redis;
    this.syncQueue = [];
    this.conflictResolutionStrategies = {
      'latest_wins': this.latestWinsStrategy.bind(this),
      'merge': this.mergeStrategy.bind(this),
      'user_choice': this.userChoiceStrategy.bind(this)
    };
  }

  async syncUserData(userId, platform, data, options = {}) {
    const { strategy = 'latest_wins', forceSync = false } = options;
    
    try {
      // Get current data state
      const currentData = await this.getUserData(userId);
      const lastSync = await this.getLastSyncTime(userId, platform);
      
      // Check for conflicts
      const conflicts = this.detectConflicts(currentData, data, lastSync);
      
      if (conflicts.length > 0 && !forceSync) {
        return {
          success: false,
          conflicts,
          requiresResolution: true
        };
      }

      // Apply sync strategy
      const resolvedData = await this.conflictResolutionStrategies[strategy](
        currentData, 
        data, 
        conflicts
      );

      // Update database
      await this.updateUserData(userId, resolvedData);
      
      // Update sync timestamp
      await this.updateSyncTime(userId, platform);
      
      // Broadcast changes to other platforms
      await this.broadcastSync(userId, resolvedData, platform);
      
      // Cache result
      await this.cacheUserData(userId, resolvedData);

      return {
        success: true,
        data: resolvedData,
        timestamp: new Date().toISOString(),
        conflicts: conflicts.length
      };

    } catch (error) {
      console.error('Sync error:', error);
      throw new Error(`Sync failed: ${error.message}`);
    }
  }

  async getUserData(userId) {
    // Try cache first
    const cached = await this.redis.get(`user_data_${userId}`);
    if (cached) {
      return JSON.parse(cached);
    }

    // Fetch from database
    const userData = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        bonds: {
          include: {
            ipToken: true,
            supporters: true
          }
        },
        ipTokens: true,
        notifications: {
          where: { read: false },
          orderBy: { createdAt: 'desc' },
          take: 50
        },
        analytics: {
          orderBy: { createdAt: 'desc' },
          take: 100
        }
      }
    });

    // Cache for 5 minutes
    await this.redis.setex(`user_data_${userId}`, 300, JSON.stringify(userData));
    
    return userData;
  }

  detectConflicts(currentData, incomingData, lastSync) {
    const conflicts = [];
    
    // Check bonds for conflicts
    if (incomingData.bonds) {
      incomingData.bonds.forEach(incomingBond => {
        const currentBond = currentData.bonds?.find(b => b.id === incomingBond.id);
        
        if (currentBond && currentBond.updatedAt > lastSync && 
            incomingBond.updatedAt > lastSync) {
          conflicts.push({
            type: 'bond',
            id: incomingBond.id,
            field: this.getConflictingFields(currentBond, incomingBond),
            current: currentBond,
            incoming: incomingBond
          });
        }
      });
    }

    // Check profile changes
    const profileFields = ['name', 'bio', 'avatar', 'socialLinks'];
    profileFields.forEach(field => {
      if (incomingData[field] && currentData[field] !== incomingData[field]) {
        if (currentData.updatedAt > lastSync) {
          conflicts.push({
            type: 'profile',
            field,
            current: currentData[field],
            incoming: incomingData[field]
          });
        }
      }
    });

    return conflicts;
  }

  async latestWinsStrategy(currentData, incomingData, conflicts) {
    // Simply take the most recent version
    return {
      ...currentData,
      ...incomingData,
      updatedAt: new Date()
    };
  }

  async mergeStrategy(currentData, incomingData, conflicts) {
    // Intelligent merging based on data type
    const merged = { ...currentData };

    // Merge arrays (bonds, tokens, etc.)
    if (incomingData.bonds) {
      merged.bonds = this.mergeArrays(
        currentData.bonds || [], 
        incomingData.bonds, 
        'id'
      );
    }

    if (incomingData.ipTokens) {
      merged.ipTokens = this.mergeArrays(
        currentData.ipTokens || [], 
        incomingData.ipTokens, 
        'id'
      );
    }

    // Merge object fields
    if (incomingData.socialLinks) {
      merged.socialLinks = {
        ...currentData.socialLinks,
        ...incomingData.socialLinks
      };
    }

    merged.updatedAt = new Date();
    return merged;
  }

  async userChoiceStrategy(currentData, incomingData, conflicts) {
    // Return data with conflict markers for user resolution
    return {
      ...currentData,
      _conflicts: conflicts,
      _requiresUserResolution: true
    };
  }

  mergeArrays(current, incoming, keyField) {
    const merged = [...current];
    
    incoming.forEach(incomingItem => {
      const existingIndex = merged.findIndex(
        item => item[keyField] === incomingItem[keyField]
      );
      
      if (existingIndex >= 0) {
        // Update existing item with latest data
        merged[existingIndex] = {
          ...merged[existingIndex],
          ...incomingItem,
          updatedAt: new Date()
        };
      } else {
        // Add new item
        merged.push(incomingItem);
      }
    });
    
    return merged;
  }

  async broadcastSync(userId, data, excludePlatform) {
    // Broadcast to WebSocket clients
    global.io?.to(`user_${userId}`).emit('data_sync', {
      data,
      timestamp: new Date().toISOString(),
      source: excludePlatform
    });

    // Queue for offline platforms
    await this.queueOfflineSync(userId, data, excludePlatform);
  }

  async queueOfflineSync(userId, data, excludePlatform) {
    const syncItem = {
      userId,
      data,
      excludePlatform,
      timestamp: new Date().toISOString(),
      attempts: 0,
      maxAttempts: 3
    };

    await this.redis.lpush('sync_queue', JSON.stringify(syncItem));
  }

  async processOfflineSync() {
    // Background job to process offline sync queue
    while (true) {
      try {
        const item = await this.redis.brpop('sync_queue', 30); // 30 second timeout
        
        if (item) {
          const syncItem = JSON.parse(item[1]);
          await this.attemptOfflineSync(syncItem);
        }
      } catch (error) {
        console.error('Offline sync processing error:', error);
        await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
      }
    }
  }

  async getLastSyncTime(userId, platform) {
    const syncRecord = await this.prisma.syncLog.findFirst({
      where: { userId, platform },
      orderBy: { timestamp: 'desc' }
    });
    
    return syncRecord?.timestamp || new Date(0);
  }

  async updateSyncTime(userId, platform) {
    await this.prisma.syncLog.create({
      data: {
        userId,
        platform,
        timestamp: new Date(),
        status: 'success'
      }
    });
  }

  async cacheUserData(userId, data) {
    await this.redis.setex(
      `user_data_${userId}`, 
      300, // 5 minutes
      JSON.stringify(data)
    );
  }

  getConflictingFields(obj1, obj2) {
    const conflicts = [];
    const fields = ['title', 'description', 'targetAmount', 'isActive'];
    
    fields.forEach(field => {
      if (obj1[field] !== obj2[field]) {
        conflicts.push(field);
      }
    });
    
    return conflicts;
  }
}

module.exports = SyncService;