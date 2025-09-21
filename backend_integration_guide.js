// server/routes/bonds.js - Bond Management API
const express = require('express');
const router = express.Router();

// GET /api/bonds - List bonds with filtering and pagination
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      category,
      creator,
      status = 'active',
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const offset = (page - 1) * limit;
    const where = {};

    // Apply filters
    if (status === 'active') where.isActive = true;
    if (status === 'completed') where.isCompleted = true;
    if (category) where.ipToken = { category };
    if (creator) where.creatorId = creator;

    const bonds = await req.services.prisma.bond.findMany({
      where,
      include: {
        creator: {
          select: { id: true, displayName: true, avatar: true, isVerified: true }
        },
        ipToken: {
          select: { id: true, title: true, category: true, metadataURI: true }
        },
        supporters: {
          select: { id: true, amount: true, createdAt: true },
          orderBy: { createdAt: 'desc' },
          take: 5
        },
        _count: { select: { supporters: true } }
      },
      orderBy: { [sortBy]: sortOrder },
      take: parseInt(limit),
      skip: offset
    });

    // Get total count for pagination
    const total = await req.services.prisma.bond.count({ where });

    // Track analytics
    await req.services.analytics.trackEvent('bonds_list_viewed', req.user.id, {
      filters: { category, creator, status },
      resultCount: bonds.length
    });

    res.json({
      success: true,
      data: bonds,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Bonds list error:', error);
    res.status(500).json({ error: 'Failed to fetch bonds' });
  }
});

// POST /api/bonds - Create new bond
router.post('/', async (req, res) => {
  try {
    const {
      title,
      description,
      targetAmount,
      ipTokenId,
      duration,
      minContribution
    } = req.body;

    // Validate IP token ownership
    if (ipTokenId) {
      const token = await req.services.prisma.iPToken.findUnique({
        where: { id: ipTokenId }
      });

      if (!token || token.creatorId !== req.user.id) {
        return res.status(403).json({ error: 'Invalid IP token' });
      }
    }

    // Create bond
    const bond = await req.services.prisma.bond.create({
      data: {
        title,
        description,
        targetAmount: parseFloat(targetAmount),
        creatorId: req.user.id,
        ipTokenId,
        duration,
        minContribution: minContribution ? parseFloat(minContribution) : null,
        endsAt: duration ? new Date(Date.now() + duration * 1000) : null
      },
      include: {
        creator: true,
        ipToken: true
      }
    });

    // Track analytics
    await req.services.analytics.trackEvent('bond_created', req.user.id, {
      bondId: bond.id,
      targetAmount: bond.targetAmount,
      category: bond.ipToken?.category
    });

    // Send notification to followers
    const followers = await req.services.prisma.user.findMany({
      where: {
        // Assuming you have a followers relationship
        following: { some: { followingId: req.user.id } }
      },
      select: { id: true }
    });

    const notification = await req.services.notifications.createNotificationTemplate('BOND_CREATED', {
      creatorName: req.user.displayName,
      bondTitle: bond.title,
      bondId: bond.id,
      creatorId: req.user.id
    });

    await req.services.notifications.bulkNotify(
      followers.map(f => f.id),
      notification,
      { platforms: ['WEB', 'MOBILE_IOS', 'MOBILE_ANDROID'] }
    );

    // Sync across platforms
    await req.services.sync.syncUserData(req.user.id, 'WEB', {
      bonds: [bond]
    });

    res.status(201).json({
      success: true,
      data: bond
    });

  } catch (error) {
    console.error('Bond creation error:', error);
    res.status(500).json({ error: 'Failed to create bond' });
  }
});

// POST /api/bonds/:id/support - Support a bond
router.post('/:id/support', async (req, res) => {
  try {
    const { amount, txHash } = req.body;
    const bondId = req.params.id;

    // Validate bond exists and is active
    const bond = await req.services.prisma.bond.findUnique({
      where: { id: bondId },
      include: { creator: true }
    });

    if (!bond) {
      return res.status(404).json({ error: 'Bond not found' });
    }

    if (!bond.isActive) {
      return res.status(400).json({ error: 'Bond is not active' });
    }

    // Check minimum contribution
    if (bond.minContribution && parseFloat(amount) < bond.minContribution) {
      return res.status(400).json({ 
        error: `Minimum contribution is ${bond.minContribution} ETH` 
      });
    }

    // Create support record
    const support = await req.services.prisma.bondSupport.create({
      data: {
        bondId,
        supporterId: req.user.id,
        amount: parseFloat(amount),
        txHash
      }
    });

    // Update bond current amount
    await req.services.prisma.bond.update({
      where: { id: bondId },
      data: {
        currentAmount: {
          increment: parseFloat(amount)
        }
      }
    });

    // Check if bond is now completed
    const updatedBond = await req.services.prisma.bond.findUnique({
      where: { id: bondId }
    });

    if (updatedBond.currentAmount >= updatedBond.targetAmount && !updatedBond.isCompleted) {
      await req.services.prisma.bond.update({
        where: { id: bondId },
        data: { isCompleted: true }
      });

      // Send completion notification to creator
      const completionNotification = await req.services.notifications.createNotificationTemplate('BOND_COMPLETED', {
        bondTitle: bond.title,
        bondId: bond.id,
        finalAmount: updatedBond.currentAmount
      });

      await req.services.notifications.sendNotification(
        bond.creatorId,
        completionNotification,
        { priority: 'HIGH' }
      );
    }

    // Send support notification to creator
    const supportNotification = await req.services.notifications.createNotificationTemplate('BOND_SUPPORTED', {
      bondTitle: bond.title,
      bondId: bond.id,
      supporterId: req.user.id,
      amount: amount
    });

    await req.services.notifications.sendNotification(
      bond.creatorId,
      supportNotification
    );

    // Track analytics
    await req.services.analytics.trackEvent('bond_supported', req.user.id, {
      bondId,
      amount: parseFloat(amount),
      creatorId: bond.creatorId
    });

    // Real-time sync
    await req.services.sync.syncUserData(req.user.id, 'WEB', {
      supportedBonds: [{ bondId, amount, timestamp: new Date() }]
    });

    res.json({
      success: true,
      data: support
    });

  } catch (error) {
    console.error('Bond support error:', error);
    res.status(500).json({ error: 'Failed to support bond' });
  }
});

module.exports = router;

// ================================
// server/routes/analytics.js - Analytics API
// ================================

const analyticsRouter = express.Router();

// GET /api/analytics/dashboard - User dashboard analytics
analyticsRouter.get('/dashboard', async (req, res) => {
  try {
    const { timeRange = '30d' } = req.query;
    
    const analytics = await req.services.analytics.getUserAnalytics(req.user.id, timeRange);
    const recommendations = await req.services.analytics.generateRecommendations(req.user.id, 'mixed', 5);

    res.json({
      success: true,
      data: {
        analytics,
        recommendations,
        generatedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Dashboard analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

//