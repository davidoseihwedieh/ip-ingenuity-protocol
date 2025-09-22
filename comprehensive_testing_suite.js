// tests/integration/api.test.js - Comprehensive API Integration Tests
const request = require('supertest');
const { PrismaClient } = require('@prisma/client');
const app = require('../../server/index');

describe('CreatorBonds API Integration Tests', () => {
  let prisma;
  let authToken;
  let testUser;
  let testBond;
  let testToken;

  beforeAll(async () => {
    prisma = new PrismaClient();
    await prisma.$connect();
    
    // Create test user and get auth token
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        walletAddress: '0x1234567890123456789012345678901234567890',
        email: 'test@example.com',
        displayName: 'Test Creator'
      });
    
    testUser = response.body.data.user;
    authToken = response.body.data.token;
  });

  afterAll(async () => {
    // Cleanup test data
    await prisma.user.deleteMany({
      where: { email: { contains: 'test' } }
    });
    await prisma.$disconnect();
  });

  describe('Authentication Flow', () => {
    test('should register new user successfully', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          walletAddress: '0x0987654321098765432109876543210987654321',
          email: 'newuser@example.com',
          displayName: 'New User'
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.token).toBeDefined();
      expect(response.body.data.user.email).toBe('newuser@example.com');
    });

    test('should login existing user', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          walletAddress: testUser.walletAddress
        });

      expect(response.status).toBe(200);
      expect(response.body.data.token).toBeDefined();
    });

    test('should reject invalid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          walletAddress: '0xinvalidaddress'
        });

      expect(response.status).toBe(401);
    });
  });

  describe('Bond Management', () => {
    test('should create bond successfully', async () => {
      const bondData = {
        title: 'Test Creative Bond',
        description: 'A test bond for creative project',
        targetAmount: '1.5',
        duration: 30 * 24 * 3600 // 30 days
      };

      const response = await request(app)
        .post('/api/bonds')
        .set('Authorization', `Bearer ${authToken}`)
        .send(bondData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe(bondData.title);
      expect(response.body.data.creatorId).toBe(testUser.id);
      
      testBond = response.body.data;
    });

    test('should list bonds with pagination', async () => {
      const response = await request(app)
        .get('/api/bonds?page=1&limit=10')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.pagination).toBeDefined();
      expect(response.body.pagination.page).toBe(1);
    });

    test('should support bond successfully', async () => {
      const supportData = {
        amount: '0.1',
        txHash: '0xabcdef1234567890abcdef1234567890abcdef12'
      };

      const response = await request(app)
        .post(`/api/bonds/${testBond.id}/support`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(supportData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.amount).toBe(supportData.amount);
    });

    test('should reject support below minimum', async () => {
      const response = await request(app)
        .post(`/api/bonds/${testBond.id}/support`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ amount: '0.001' });

      expect(response.status).toBe(400);
    });
  });

  describe('Notifications System', () => {
    test('should subscribe to push notifications', async () => {
      const subscription = {
        endpoint: 'https://fcm.googleapis.com/fcm/send/test',
        keys: {
          p256dh: 'test-key',
          auth: 'test-auth'
        }
      };

      const response = await request(app)
        .post('/api/notifications/subscribe')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ subscription, platform: 'WEB' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    test('should fetch user notifications', async () => {
      const response = await request(app)
        .get('/api/notifications')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
    });

    test('should mark notification as read', async () => {
      // First create a notification (simplified)
      const notification = await prisma.notification.create({
        data: {
          userId: testUser.id,
          type: 'BOND_CREATED',
          title: 'Test Notification',
          message: 'Test message',
          platforms: ['WEB']
        }
      });

      const response = await request(app)
        .post(`/api/notifications/${notification.id}/read`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('Analytics & Recommendations', () => {
    test('should track analytics event', async () => {
      const eventData = {
        eventType: 'bond_view',
        data: { bondId: testBond.id },
        metadata: { platform: 'WEB' }
      };

      const response = await request(app)
        .post('/api/analytics/track')
        .set('Authorization', `Bearer ${authToken}`)
        .send(eventData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.eventId).toBeDefined();
    });

    test('should fetch user analytics dashboard', async () => {
      const response = await request(app)
        .get('/api/analytics/dashboard?timeRange=30d')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.analytics).toBeDefined();
      expect(response.body.data.recommendations).toBeDefined();
    });

    test('should generate personalized recommendations', async () => {
      const response = await request(app)
        .get('/api/analytics/recommendations?type=bonds&limit=5')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBeLessThanOrEqual(5);
    });

    test('should generate comprehensive analytics report', async () => {
      const response = await request(app)
        .get('/api/analytics/report?timeRange=30d&reportType=comprehensive')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.summary).toBeDefined();
      expect(response.body.data.insights).toBeDefined();
      expect(response.body.data.actionableItems).toBeDefined();
    });
  });

  describe('Cross-Platform Sync', () => {
    test('should sync user data successfully', async () => {
      const syncData = {
        platform: 'MOBILE_IOS',
        data: {
          profile: { bio: 'Updated bio from mobile' },
          preferences: { theme: 'dark' }
        },
        strategy: 'merge'
      };

      const response = await request(app)
        .post('/api/sync')
        .set('Authorization', `Bearer ${authToken}`)
        .send(syncData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
    });

    test('should handle sync conflicts', async () => {
      const conflictData = {
        platform: 'WEB',
        data: {
          profile: { bio: 'Different bio from web' }
        },
        strategy: 'user_choice'
      };

      const response = await request(app)
        .post('/api/sync')
        .set('Authorization', `Bearer ${authToken}`)
        .send(conflictData);

      expect(response.status).toBe(200);
      // Should either succeed or indicate conflicts need resolution
      expect(response.body.success || response.body.requiresResolution).toBe(true);
    });

    test('should get sync status', async () => {
      const response = await request(app)
        .get('/api/sync/status?platform=WEB')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.lastSync).toBeDefined();
    });
  });

  describe('Security Tests', () => {
    test('should reject requests without authentication', async () => {
      const response = await request(app)
        .get('/api/bonds');

      expect(response.status).toBe(401);
    });

    test('should reject requests with invalid token', async () => {
      const response = await request(app)
        .get('/api/bonds')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(401);
    });

    test('should enforce rate limiting', async () => {
      const requests = [];
      
      // Make many requests quickly to trigger rate limit
      for (let i = 0; i < 110; i++) {
        requests.push(
          request(app)
            .get('/api/bonds')
            .set('Authorization', `Bearer ${authToken}`)
        );
      }

      const responses = await Promise.allSettled(requests);
      const rateLimited = responses.some(r => 
        r.status === 'fulfilled' && r.value.status === 429
      );

      expect(rateLimited).toBe(true);
    });
  });
});

// ================================
// tests/performance/load.test.js - Performance & Load Testing
// ================================

const autocannon = require('autocannon');
const { spawn } = require('child_process');

describe('Performance & Load Tests', () => {
  let serverProcess;
  const SERVER_URL = 'http://localhost:3001';

  beforeAll(async () => {
    // Start server for testing
    serverProcess = spawn('node', ['server/startup.js'], {
      env: { ...process.env, NODE_ENV: 'test' }
    });
    
    // Wait for server to start
    await new Promise(resolve => setTimeout(resolve, 3000));
  });

  afterAll(() => {
    if (serverProcess) {
      serverProcess.kill();
    }
  });

  test('should handle concurrent connections', async () => {
    const result = await autocannon({
      url: `${SERVER_URL}/health`,
      connections: 50,
      duration: 10,
      pipelining: 1
    });

    expect(result.errors).toBe(0);
    expect(result.timeouts).toBe(0);
    expect(result.latency.average).toBeLessThan(100); // Average < 100ms
    expect(result.requests.average).toBeGreaterThan(100); // > 100 req/sec
  });

  test('should handle API endpoint load', async () => {
    const result = await autocannon({
      url: `${SERVER_URL}/api/bonds`,
      connections: 25,
      duration: 15,
      headers: {
        'Authorization': 'Bearer test-token'
      }
    });

    expect(result.latency.p95).toBeLessThan(500); // 95th percentile < 500ms
    expect(result.throughput.average).toBeGreaterThan(1000000); // > 1MB/sec
  });

  test('should handle WebSocket connections', async () => {
    const io = require('socket.io-client');
    const connections = [];
    
    // Create 100 WebSocket connections
    for (let i = 0; i < 100; i++) {
      const socket = io(SERVER_URL);
      connections.push(socket);
    }

    // Wait for connections
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Check all connections are established
    const connectedCount = connections.filter(socket => socket.connected).length;
    expect(connectedCount).toBeGreaterThan(90); // At least 90% connected

    // Cleanup
    connections.forEach(socket => socket.disconnect());
  });

  test('should handle database query performance', async () => {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();

    const startTime = Date.now();
    
    // Simulate complex query
    await prisma.bond.findMany({
      include: {
        creator: true,
        supporters: true,
        ipToken: true
      },
      take: 50
    });

    const queryTime = Date.now() - startTime;
    expect(queryTime).toBeLessThan(200); // Query < 200ms

    await prisma.$disconnect();
  });
});

// ================================
// tests/e2e/user-journey.test.js - End-to-End User Journey Tests
// ================================

const puppeteer = require('puppeteer');

describe('End-to-End User Journey Tests', () => {
  let browser;
  let page;

  beforeAll(async () => {
    browser = await puppeteer.launch({
      headless: process.env.CI === 'true',
      slowMo: 50
    });
    page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 720 });
  });

  afterAll(async () => {
    if (browser) {
      await browser.close();
    }
  });

  test('Complete Creator Journey: Register → Create Bond → Get Support', async () => {
    // 1. Navigate to app
    await page.goto('http://localhost:3000');
    await page.waitForSelector('[data-testid="landing-page"]');

    // 2. Register new user
    await page.click('[data-testid="register-button"]');
    await page.waitForSelector('[data-testid="register-form"]');
    
    await page.type('[data-testid="wallet-address"]', '0x1234567890123456789012345678901234567890');
    await page.type('[data-testid="email"]', 'e2e-test@example.com');
    await page.type('[data-testid="display-name"]', 'E2E Test Creator');
    
    await page.click('[data-testid="submit-registration"]');
    await page.waitForSelector('[data-testid="dashboard"]', { timeout: 5000 });

    // 3. Navigate to create bond
    await page.click('[data-testid="nav-bonds"]');
    await page.click('[data-testid="create-bond-button"]');
    await page.waitForSelector('[data-testid="bond-form"]');

    // 4. Fill bond creation form
    await page.type('[data-testid="bond-title"]', 'E2E Test Creative Project');
    await page.type('[data-testid="bond-description"]', 'Testing the complete bond creation flow');
    await page.type('[data-testid="target-amount"]', '2.5');
    
    await page.click('[data-testid="submit-bond"]');
    await page.waitForSelector('[data-testid="bond-created-success"]');

    // 5. Verify bond appears in list
    await page.goto('http://localhost:3000/bonds');
    await page.waitForSelector('[data-testid="bonds-list"]');
    
    const bondTitle = await page.$eval(
      '[data-testid="bond-item"]:first-child [data-testid="bond-title"]',
      el => el.textContent
    );
    expect(bondTitle).toBe('E2E Test Creative Project');

    // 6. Support the bond (simulate second user)
    await page.click('[data-testid="bond-item"]:first-child');
    await page.waitForSelector('[data-testid="bond-details"]');
    
    await page.click('[data-testid="support-bond-button"]');
    await page.waitForSelector('[data-testid="support-form"]');
    
    await page.type('[data-testid="support-amount"]', '0.5');
    await page.click('[data-testid="submit-support"]');
    
    // 7. Verify support was recorded
    await page.waitForSelector('[data-testid="support-success"]');
    const currentAmount = await page.$eval(
      '[data-testid="current-amount"]',
      el => el.textContent
    );
    expect(currentAmount).toContain('0.5');
  });

  test('Notification Flow: Real-time updates', async () => {
    // Open two browser contexts to simulate real-time notifications
    const context1 = await browser.createIncognitoBrowserContext();
    const context2 = await browser.createIncognitoBrowserContext();
    
    const page1 = await context1.newPage();
    const page2 = await context2.newPage();

    // User 1: Creator
    await page1.goto('http://localhost:3000');
    await page1.waitForSelector('[data-testid="dashboard"]');

    // User 2: Supporter
    await page2.goto('http://localhost:3000');
    await page2.waitForSelector('[data-testid="dashboard"]');

    // User 1 creates a bond
    await page1.click('[data-testid="create-bond-button"]');
    await page1.type('[data-testid="bond-title"]', 'Real-time Test Bond');
    await page1.click('[data-testid="submit-bond"]');

    // User 2 should receive notification
    await page2.waitForSelector('[data-testid="notification"]', { timeout: 5000 });
    const notificationText = await page2.$eval(
      '[data-testid="notification"]',
      el => el.textContent
    );
    expect(notificationText).toContain('Real-time Test Bond');

    await context1.close();
    await context2.close();
  });

  test('Cross-Platform Sync: Data consistency', async () => {
    // Simulate mobile and web platforms syncing data
    await page.goto('http://localhost:3000');
    await page.waitForSelector('[data-testid="dashboard"]');

    // Update profile on "web"
    await page.click('[data-testid="profile-menu"]');
    await page.click('[data-testid="edit-profile"]');
    await page.clear('[data-testid="bio-field"]');
    await page.type('[data-testid="bio-field"]', 'Updated bio from web platform');
    await page.click('[data-testid="save-profile"]');

    // Simulate sync from mobile platform
    const syncResponse = await page.evaluate(async () => {
      return fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform: 'MOBILE_IOS',
          data: { profile: { bio: 'Updated bio from mobile' } },
          strategy: 'latest_wins'
        })
      }).then(r => r.json());
    });

    expect(syncResponse.success).toBe(true);

    // Verify sync notification appears
    await page.waitForSelector('[data-testid="sync-notification"]');
  });

  test('Analytics Dashboard: Data visualization', async () => {
    await page.goto('http://localhost:3000/analytics');
    await page.waitForSelector('[data-testid="analytics-dashboard"]');

    // Check key metrics are displayed
    await page.waitForSelector('[data-testid="total-bonds"]');
    await page.waitForSelector('[data-testid="total-revenue"]');
    await page.waitForSelector('[data-testid="engagement-rate"]');

    // Check charts are rendered
    await page.waitForSelector('[data-testid="revenue-chart"]');
    await page.waitForSelector('[data-testid="bond-performance-chart"]');

    // Test time range filtering
    await page.click('[data-testid="time-range-select"]');
    await page.click('[data-testid="time-range-7d"]');
    
    // Verify data updates
    await page.waitForFunction(
      () => document.querySelector('[data-testid="analytics-loading"]') === null,
      { timeout: 5000 }
    );
  });

  test('Error Handling: Network failures and recovery', async () => {
    // Simulate network failure
    await page.setOfflineMode(true);
    
    await page.goto('http://localhost:3000');
    await page.waitForSelector('[data-testid="offline-indicator"]');

    // Try to create bond while offline
    await page.click('[data-testid="create-bond-button"]');
    await page.type('[data-testid="bond-title"]', 'Offline Bond');
    await page.click('[data-testid="submit-bond"]');

    // Should show offline message
    await page.waitForSelector('[data-testid="offline-message"]');

    // Restore connection
    await page.setOfflineMode(false);
    await page.reload();

    // Should sync pending changes
    await page.waitForSelector('[data-testid="sync-recovery"]');
  });
});

module.exports = {
  testSetup: {
    testTimeout: 30000,
    setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
    testEnvironment: 'node'
  }
};