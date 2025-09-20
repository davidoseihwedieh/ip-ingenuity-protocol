/**
 * CreatorFi Real-Time Analytics & Monitoring System
 * Advanced real-time data processing, alerts, and performance monitoring
 */

const WebSocket = require('ws');
const Redis = require('redis');
const EventEmitter = require('events');
const { Kafka } = require('kafkajs');
const InfluxDB = require('@influxdata/influxdb-client');

class RealTimeAnalytics extends EventEmitter {
    constructor(config) {
        super();
        this.config = config;
        this.redis = Redis.createClient(config.redis);
        this.wsServer = null;
        this.clients = new Map();
        this.metrics = new Map();
        this.alerts = new Map();
        this.streamProcessors = new Map();
        
        // Initialize InfluxDB for time-series data
        this.influxDB = new InfluxDB.InfluxDB({
            url: config.influxdb.url,
            token: config.influxdb.token,
        });
        this.writeAPI = this.influxDB.getWriteApi(
            config.influxdb.org,
            config.influxdb.bucket
        );
        
        // Initialize Kafka for event streaming
        this.kafka = Kafka({
            clientId: 'creatorfi-analytics',
            brokers: config.kafka.brokers,
        });
        this.producer = this.kafka.producer();
        this.consumer = this.kafka.consumer({ groupId: 'analytics-group' });
        
        this.initializeWebSocket();
        this.initializeKafka();
        this.setupMetricProcessors();
        this.setupAlertSystem();
    }

    async initializeWebSocket() {
        this.wsServer = new WebSocket.Server({
            port: this.config.websocket.port,
            verifyClient: this.authenticateClient.bind(this)
        });

        this.wsServer.on('connection', (ws, request) => {
            const clientId = this.extractClientId(request);
            const clientType = this.extractClientType(request); // 'creator', 'investor', 'admin'
            
            this.clients.set(clientId, {
                ws,
                type: clientType,
                subscriptions: new Set(),
                lastActivity: Date.now()
            });

            ws.on('message', (message) => {
                this.handleClientMessage(clientId, JSON.parse(message));
            });

            ws.on('close', () => {
                this.clients.delete(clientId);
            });

            // Send initial data
            this.sendInitialData(clientId);
        });

        console.log(`WebSocket server started on port ${this.config.websocket.port}`);
    }

    async initializeKafka() {
        await this.producer.connect();
        await this.consumer.connect();

        // Subscribe to relevant topics
        await this.consumer.subscribe({
            topics: [
                'creator.revenue.updated',
                'investment.created',
                'token.purchased',
                'user.activity',
                'platform.metrics'
            ]
        });

        // Start consuming messages
        await this.consumer.run({
            eachMessage: async ({ topic, partition, message }) => {
                await this.processKafkaMessage(topic, message);
            },
        });
    }

    setupMetricProcessors() {
        // Revenue metrics processor
        this.streamProcessors.set('revenue', {
            process: (data) => this.processRevenueMetrics(data),
            aggregationWindow: 60000, // 1 minute
            retentionPeriod: 30 * 24 * 60 * 60 * 1000 // 30 days
        });

        // Investment metrics processor
        this.streamProcessors.set('investment', {
            process: (data) => this.processInvestmentMetrics(data),
            aggregationWindow: 60000,
            retentionPeriod: 90 * 24 * 60 * 60 * 1000 // 90 days
        });

        // Platform performance processor
        this.streamProcessors.set('platform', {
            process: (data) => this.processPlatformMetrics(data),
            aggregationWindow: 30000, // 30 seconds
            retentionPeriod: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        // User activity processor
        this.streamProcessors.set('activity', {
            process: (data) => this.processActivityMetrics(data),
            aggregationWindow: 5000, // 5 seconds
            retentionPeriod: 24 * 60 * 60 * 1000 // 24 hours
        });
    }

    setupAlertSystem() {
        // Revenue anomaly alerts
        this.alerts.set('revenue_anomaly', {
            condition: (current, historical) => {
                const avgRevenue = historical.reduce((sum, val) => sum + val, 0) / historical.length;
                const threshold = avgRevenue * 0.3; // 30% deviation
                return Math.abs(current - avgRevenue) > threshold;
            },
            severity: 'medium',
            cooldown: 3600000 // 1 hour
        });

        // Large investment alerts
        this.alerts.set('large_investment', {
            condition: (amount) => amount > 10000, // $10k threshold
            severity: 'high',
            cooldown: 0 // No cooldown
        });

        // Platform performance alerts
        this.alerts.set('platform_performance', {
            condition: (metrics) => {
                return metrics.responseTime > 2000 || // 2s response time
                       metrics.errorRate > 0.05 || // 5% error rate
                       metrics.cpuUsage > 0.8; // 80% CPU usage
            },
            severity: 'critical',
            cooldown: 300000 // 5 minutes
        });

        // Token price volatility alerts
        this.alerts.set('token_volatility', {
            condition: (priceChange) => Math.abs(priceChange) > 0.15, // 15% change
            severity: 'medium',
            cooldown: 1800000 // 30 minutes
        });
    }

    async processKafkaMessage(topic, message) {
        const data = JSON.parse(message.value.toString());
        const timestamp = Date.now();

        switch (topic) {
            case 'creator.revenue.updated':
                await this.handleRevenueUpdate(data, timestamp);
                break;
            case 'investment.created':
                await this.handleNewInvestment(data, timestamp);
                break;
            case 'token.purchased':
                await this.handleTokenPurchase(data, timestamp);
                break;
            case 'user.activity':
                await this.handleUserActivity(data, timestamp);
                break;
            case 'platform.metrics':
                await this.handlePlatformMetrics(data, timestamp);
                break;
        }
    }

    async handleRevenueUpdate(data, timestamp) {
        const { creatorId, platform, amount, previousAmount } = data;
        
        // Calculate metrics
        const change = amount - (previousAmount || 0);
        const changePercent = previousAmount ? (change / previousAmount) * 100 : 0;

        // Store in time-series database
        const point = new InfluxDB.Point('revenue')
            .tag('creator_id', creatorId)
            .tag('platform', platform)
            .floatField('amount', amount)
            .floatField('change', change)
            .floatField('change_percent', changePercent)
            .timestamp(new Date(timestamp));
        
        this.writeAPI.writePoint(point);

        // Check for alerts
        await this.checkRevenueAlerts(creatorId, amount, changePercent);

        // Broadcast to relevant clients
        await this.broadcastToSubscribers('revenue_update', {
            creatorId,
            platform,
            amount,
            change,
            changePercent,
            timestamp
        });

        // Update real-time dashboard metrics
        await this.updateDashboardMetrics('revenue', {
            totalRevenue: await this.getTotalPlatformRevenue(),
            avgCreatorRevenue: await this.getAverageCreatorRevenue(),
            topPerformers: await this.getTopPerformingCreators(5)
        });
    }

    async handleNewInvestment(data, timestamp) {
        const { investorId, creatorId, amount, tokenAmount } = data;

        // Store investment data
        const point = new InfluxDB.Point('investment')
            .tag('investor_id', investorId)
            .tag('creator_id', creatorId)
            .floatField('amount', amount)
            .floatField('token_amount', tokenAmount)
            .timestamp(new Date(timestamp));
        
        this.writeAPI.writePoint(point);

        // Check for large investment alerts
        if (amount > 10000) {
            await this.triggerAlert('large_investment', {
                investorId,
                creatorId,
                amount,
                timestamp
            });
        }

        // Update real-time metrics
        await this.updateInvestmentMetrics(creatorId, amount);

        // Broadcast to creator and relevant investors
        await this.broadcastToCreator(creatorId, 'new_investment', {
            amount,
            tokenAmount,
            totalInvestors: await this.getCreatorInvestorCount(creatorId),
            totalRaised: await this.getCreatorTotalRaised(creatorId)
        });
    }

    async handleTokenPurchase(data, timestamp) {
        const { creatorId, purchaserId, tokenAmount, price } = data;

        // Calculate token metrics
        const totalSupply = await this.getTokenTotalSupply(creatorId);
        const marketCap = totalSupply * price;
        const priceChange = await this.calculatePriceChange(creatorId, price);

        // Store token data
        const point = new InfluxDB.Point('token_activity')
            .tag('creator_id', creatorId)
            .tag('purchaser_id', purchaserId)
            .floatField('token_amount', tokenAmount)
            .floatField('price', price)
            .floatField('market_cap', marketCap)
            .floatField('price_change', priceChange)
            .timestamp(new Date(timestamp));
        
        this.writeAPI.writePoint(point);

        // Check for volatility alerts
        if (Math.abs(priceChange) > 0.15) {
            await this.triggerAlert('token_volatility', {
                creatorId,
                price,
                priceChange,
                timestamp
            });
        }

        // Broadcast price update
        await this.broadcastToSubscribers('token_price_update', {
            creatorId,
            price,
            priceChange