const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3001;

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://localhost:5432/creator_tokens',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret', (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
};

// Creator registration and authentication
app.post('/api/auth/register', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }),
  body('name').isLength({ min: 2, max: 100 }),
  body('bio').optional().isLength({ max: 500 }),
  body('userType').isIn(['creator', 'investor'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, name, bio, userType, platforms } = req.body;

    // Check if user exists
    const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Insert user
    const result = await pool.query(
      `INSERT INTO users (email, password, name, bio, user_type, platforms, created_at) 
       VALUES ($1, $2, $3, $4, $5, $6, NOW()) RETURNING id, email, name, user_type`,
      [email, hashedPassword, name, bio, userType, JSON.stringify(platforms || [])]
    );

    const user = result.rows[0];
    const token = jwt.sign(
      { userId: user.id, email: user.email, userType: user.user_type },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '24h' }
    );

    res.status(201).json({
      message: 'User created successfully',
      token,
      user: { id: user.id, email: user.email, name: user.name, userType: user.user_type }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/auth/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').exists()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email, userType: user.user_type },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: { 
        id: user.id, 
        email: user.email, 
        name: user.name, 
        userType: user.user_type,
        bio: user.bio,
        platforms: user.platforms
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Creator profile management
app.get('/api/creators/profile', authenticateToken, async (req, res) => {
  try {
    if (req.user.userType !== 'creator') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const result = await pool.query(`
      SELECT u.*, 
             COALESCE(SUM(r.amount), 0) as total_revenue,
             COALESCE(AVG(r.amount), 0) as avg_monthly_revenue,
             COUNT(DISTINCT i.investor_id) as investor_count
      FROM users u
      LEFT JOIN revenue_streams r ON u.id = r.creator_id 
        AND r.created_at > NOW() - INTERVAL '30 days'
      LEFT JOIN investments i ON u.id = i.creator_id
      WHERE u.id = $1
      GROUP BY u.id
    `, [req.user.userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Creator not found' });
    }

    const creator = result.rows[0];
    res.json({
      id: creator.id,
      name: creator.name,
      bio: creator.bio,
      platforms: creator.platforms,
      reputationScore: creator.reputation_score || 100,
      totalRevenue: parseFloat(creator.total_revenue),
      avgMonthlyRevenue: parseFloat(creator.avg_monthly_revenue),
      investorCount: parseInt(creator.investor_count),
      verified: creator.verified || false
    });
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Revenue stream management
app.post('/api/creators/revenue', authenticateToken, [
  body('platform').isLength({ min: 1, max: 50 }),
  body('amount').isFloat({ min: 0 }),
  body('description').optional().isLength({ max: 500 })
], async (req, res) => {
  try {
    if (req.user.userType !== 'creator') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { platform, amount, description } = req.body;

    const result = await pool.query(`
      INSERT INTO revenue_streams (creator_id, platform, amount, description, created_at)
      VALUES ($1, $2, $3, $4, NOW())
      RETURNING *
    `, [req.user.userId, platform, amount, description]);

    // Update creator's reputation score based on consistent revenue
    await updateCreatorReputation(req.user.userId);

    res.status(201).json({
      message: 'Revenue added successfully',
      revenue: result.rows[0]
    });
  } catch (error) {
    console.error('Revenue add error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/creators/revenue', authenticateToken, async (req, res) => {
  try {
    if (req.user.userType !== 'creator') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const result = await pool.query(`
      SELECT * FROM revenue_streams 
      WHERE creator_id = $1 
      ORDER BY created_at DESC
      LIMIT 50
    `, [req.user.userId]);

    res.json({ revenueHistory: result.rows });
  } catch (error) {
    console.error('Revenue fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Creator discovery for investors
app.get('/api/creators/discover', async (req, res) => {
  try {
    const { category, search, sortBy = 'reputation', limit = 20, offset = 0 } = req.query;

    let query = `
      SELECT u.id, u.name, u.bio, u.platforms, u.reputation_score, u.verified,
             COALESCE(SUM(r.amount), 0) as monthly_revenue,
             COUNT(DISTINCT i.investor_id) as investor_count,
             COALESCE(SUM(i.amount), 0) as total_raised
      FROM users u
      LEFT JOIN revenue_streams r ON u.id = r.creator_id 
        AND r.created_at > NOW() - INTERVAL '30 days'
      LEFT JOIN investments i ON u.id = i.creator_id
      WHERE u.user_type = 'creator'
    `;

    const params = [];
    let paramCount = 0;

    if (category && category !== 'All') {
      paramCount++;
      query += ` AND u.category = $${paramCount}`;
      params.push(category);
    }

    if (search) {
      paramCount++;
      query += ` AND (u.name ILIKE $${paramCount} OR u.bio ILIKE $${paramCount})`;
      params.push(`%${search}%`);
    }

    query += ` GROUP BY u.id`;

    // Sorting
    switch (sortBy) {
      case 'reputation':
        query += ` ORDER BY u.reputation_score DESC`;
        break;
      case 'revenue':
        query += ` ORDER BY monthly_revenue DESC`;
        break;
      case 'investors':
        query += ` ORDER BY investor_count DESC`;
        break;
      default:
        query += ` ORDER BY u.reputation_score DESC`;
    }

    paramCount++;
    query += ` LIMIT $${paramCount}`;
    params.push(limit);

    paramCount++;
    query += ` OFFSET $${paramCount}`;
    params.push(offset);

    const result = await pool.query(query, params);

    const creators = result.rows.map(creator => ({
      id: creator.id,
      name: creator.name,
      bio: creator.bio,
      platforms: creator.platforms,
      reputationScore: creator.reputation_score || 100,
      verified: creator.verified || false,
      monthlyRevenue: parseFloat(creator.monthly_revenue),
      investorCount: parseInt(creator.investor_count),
      totalRaised: parseFloat(creator.total_raised),
      tokenPrice: calculateTokenPrice(creator)
    }));

    res.json({ creators });
  } catch (error) {
    console.error('Creator discovery error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Social media platform integrations
app.post('/api/creators/connect-platform', authenticateToken, [
  body('platform').isIn(['youtube', 'tiktok', 'instagram', 'twitch', 'patreon']),
  body('accessToken').exists(),
  body('platformUserId').exists()
], async (req, res) => {
  try {
    if (req.user.userType !== 'creator') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { platform, accessToken, platformUserId } = req.body;

    // Verify the platform connection
    const platformData = await verifyPlatformConnection(platform, accessToken, platformUserId);

    if (!platformData.verified) {
      return res.status(400).json({ error: 'Platform verification failed' });
    }

    // Store the connection
    await pool.query(`
      INSERT INTO platform_connections (creator_id, platform, platform_user_id, access_token, followers, created_at)
      VALUES ($1, $2, $3, $4, $5, NOW())
      ON CONFLICT (creator_id, platform) 
      DO UPDATE SET 
        platform_user_id = $3,
        access_token = $4,
        followers = $5,
        updated_at = NOW()
    `, [req.user.userId, platform, platformUserId, accessToken, platformData.followers]);

    res.json({
      message: 'Platform connected successfully',
      platform,
      followers: platformData.followers
    });
  } catch (error) {
    console.error('Platform connection error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Investment functionality
app.post('/api/investments', authenticateToken, [
  body('creatorId').isInt(),
  body('amount').isFloat({ min: 10 }),
  body('tokenAmount').isFloat({ min: 0.001 })
], async (req, res) => {
  try {
    if (req.user.userType !== 'investor') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { creatorId, amount, tokenAmount } = req.body;

    // Start transaction
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Verify creator exists
      const creatorResult = await client.query('SELECT id FROM users WHERE id = $1 AND user_type = $2', [creatorId, 'creator']);
      if (creatorResult.rows.length === 0) {
        throw new Error('Creator not found');
      }

      // Record investment
      const investmentResult = await client.query(`
        INSERT INTO investments (investor_id, creator_id, amount, token_amount, created_at)
        VALUES ($1, $2, $3, $4, NOW())
        RETURNING *
      `, [req.user.userId, creatorId, amount, tokenAmount]);

      // Update investor reputation
      await updateInvestorReputation(req.user.userId, client);

      await client.query('COMMIT');

      res.status(201).json({
        message: 'Investment successful',
        investment: investmentResult.rows[0]
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Investment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Utility functions
async function updateCreatorReputation(creatorId) {
  try {
    const result = await pool.query(`
      SELECT 
        COUNT(*) as revenue_entries,
        AVG(amount) as avg_revenue,
        EXTRACT(EPOCH FROM (MAX(created_at) - MIN(created_at))) / 86400 as days_active
      FROM revenue_streams 
      WHERE creator_id = $1 AND created_at > NOW() - INTERVAL '90 days'
    `, [creatorId]);

    const stats = result.rows[0];
    let reputationScore = 100; // Base score

    // Consistency bonus
    if (stats.revenue_entries > 5) reputationScore += 50;
    if (stats.revenue_entries > 10) reputationScore += 100;

    // Revenue amount bonus
    if (stats.avg_revenue > 1000) reputationScore += 100;
    if (stats.avg_revenue > 5000) reputationScore += 200;

    // Activity bonus
    if (stats.days_active > 30) reputationScore += 50;

    await pool.query('UPDATE users SET reputation_score = $1 WHERE id = $2', [reputationScore, creatorId]);
  } catch (error) {
    console.error('Reputation update error:', error);
  }
}

async function updateInvestorReputation(investorId, client = pool) {
  // Implementation for investor reputation based on successful investments
  // This would track returns and successful picks
}

function calculateTokenPrice(creator) {
  const basePrice = 0.01;
  const reputationMultiplier = (creator.reputation_score || 100) / 100;
  const revenueMultiplier = Math.log10((creator.monthly_revenue || 100) + 1);
  
  return basePrice * reputationMultiplier * revenueMultiplier;
}

async function verifyPlatformConnection(platform, accessToken, platformUserId) {
  // Mock verification - in production, this would make actual API calls
  // to YouTube, TikTok, Instagram, etc. to verify the connection
  
  try {
    switch (platform) {
      case 'youtube':
        // Mock YouTube API verification
        return { verified: true, followers: Math.floor(Math.random() * 100000) };
      case 'tiktok':
        // Mock TikTok API verification
        return { verified: true, followers: Math.floor(Math.random() * 50000) };
      case 'instagram':
        // Mock Instagram API verification
        return { verified: true, followers: Math.floor(Math.random() * 75000) };
      default:
        return { verified: false, followers: 0 };
    }
  } catch (error) {
    console.error('Platform verification error:', error);
    return { verified: false, followers: 0 };
  }
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`Creator Token Platform API running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});