const http = require('http');
const url = require('url');

class APIGateway {
    constructor() {
        this.services = new Map();
        this.rateLimits = new Map();
        this.apiKeys = new Map();
        this.analytics = { requests: 0, errors: 0, responseTime: [] };
        
        this.setupServices();
        this.setupAPIKeys();
    }

    setupServices() {
        this.services.set('/api/auth', { host: 'localhost', port: 3001 });
        this.services.set('/api/search', { host: 'localhost', port: 3002 });
        this.services.set('/api/portfolio', { host: 'localhost', port: 3002 });
        this.services.set('/api/valuations', { host: 'localhost', port: 3002 });
        this.services.set('/api/ip', { host: 'localhost', port: 3002 });
        this.services.set('/health', { host: 'localhost', port: 3002 });
        this.services.set('/metrics', { host: 'localhost', port: 3002 });
    }

    setupAPIKeys() {
        // Enterprise API keys with different rate limits
        this.apiKeys.set('enterprise-key-1', { 
            name: 'Enterprise Client', 
            rateLimit: 10000, 
            tier: 'enterprise' 
        });
        this.apiKeys.set('premium-key-1', { 
            name: 'Premium Client', 
            rateLimit: 1000, 
            tier: 'premium' 
        });
        this.apiKeys.set('basic-key-1', { 
            name: 'Basic Client', 
            rateLimit: 100, 
            tier: 'basic' 
        });
    }

    validateAPIKey(req) {
        const apiKey = req.headers['x-api-key'] || req.headers['authorization']?.replace('Bearer ', '');
        
        if (!apiKey) {
            return { valid: false, error: 'API key required' };
        }

        const keyData = this.apiKeys.get(apiKey);
        if (!keyData) {
            return { valid: false, error: 'Invalid API key' };
        }

        return { valid: true, keyData };
    }

    checkRateLimit(apiKey, keyData) {
        const now = Date.now();
        const windowStart = now - 60000; // 1 minute window
        
        if (!this.rateLimits.has(apiKey)) {
            this.rateLimits.set(apiKey, []);
        }

        const requests = this.rateLimits.get(apiKey);
        
        // Remove old requests
        const recentRequests = requests.filter(time => time > windowStart);
        this.rateLimits.set(apiKey, recentRequests);

        if (recentRequests.length >= keyData.rateLimit) {
            return { allowed: false, remaining: 0 };
        }

        recentRequests.push(now);
        return { 
            allowed: true, 
            remaining: keyData.rateLimit - recentRequests.length 
        };
    }

    routeRequest(req) {
        const parsedUrl = url.parse(req.url);
        const path = parsedUrl.pathname;

        for (const [route, service] of this.services) {
            if (path.startsWith(route)) {
                return service;
            }
        }

        return null;
    }

    async proxyRequest(req, res, service) {
        const startTime = Date.now();
        
        const options = {
            hostname: service.host,
            port: service.port,
            path: req.url,
            method: req.method,
            headers: { ...req.headers }
        };

        delete options.headers['x-api-key']; // Remove API key before forwarding

        return new Promise((resolve) => {
            const proxyReq = http.request(options, (proxyRes) => {
                const responseTime = Date.now() - startTime;
                this.analytics.responseTime.push(responseTime);
                
                // Keep only last 1000 response times
                if (this.analytics.responseTime.length > 1000) {
                    this.analytics.responseTime = this.analytics.responseTime.slice(-1000);
                }

                res.writeHead(proxyRes.statusCode, proxyRes.headers);
                proxyRes.pipe(res);
                
                proxyRes.on('end', () => {
                    this.analytics.requests++;
                    resolve();
                });
            });

            proxyReq.on('error', (error) => {
                this.analytics.errors++;
                res.writeHead(502);
                res.end(JSON.stringify({ error: 'Service unavailable' }));
                resolve();
            });

            if (req.method === 'POST' || req.method === 'PUT') {
                req.pipe(proxyReq);
            } else {
                proxyReq.end();
            }
        });
    }

    handleRequest(req, res) {
        // CORS headers
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Key');

        if (req.method === 'OPTIONS') {
            res.writeHead(200);
            res.end();
            return;
        }

        // Handle gateway endpoints
        const parsedUrl = url.parse(req.url, true);
        if (parsedUrl.pathname === '/gateway/health') {
            this.handleHealthCheck(req, res);
            return;
        }

        if (parsedUrl.pathname === '/gateway/analytics') {
            this.handleAnalytics(req, res);
            return;
        }

        // Validate API key
        const keyValidation = this.validateAPIKey(req);
        if (!keyValidation.valid) {
            res.writeHead(401);
            res.end(JSON.stringify({ error: keyValidation.error }));
            return;
        }

        // Check rate limit
        const rateLimit = this.checkRateLimit(req.headers['x-api-key'] || req.headers['authorization']?.replace('Bearer ', ''), keyValidation.keyData);
        if (!rateLimit.allowed) {
            res.writeHead(429);
            res.end(JSON.stringify({ error: 'Rate limit exceeded' }));
            return;
        }

        // Add rate limit headers
        res.setHeader('X-RateLimit-Limit', keyValidation.keyData.rateLimit);
        res.setHeader('X-RateLimit-Remaining', rateLimit.remaining);

        // Route to appropriate service
        const service = this.routeRequest(req);
        if (!service) {
            res.writeHead(404);
            res.end(JSON.stringify({ error: 'Service not found' }));
            return;
        }

        this.proxyRequest(req, res, service);
    }

    handleHealthCheck(req, res) {
        const avgResponseTime = this.analytics.responseTime.length > 0 
            ? this.analytics.responseTime.reduce((a, b) => a + b, 0) / this.analytics.responseTime.length 
            : 0;

        const health = {
            status: 'healthy',
            services: this.services.size,
            apiKeys: this.apiKeys.size,
            analytics: {
                totalRequests: this.analytics.requests,
                totalErrors: this.analytics.errors,
                avgResponseTime: Math.round(avgResponseTime),
                errorRate: this.analytics.requests > 0 ? this.analytics.errors / this.analytics.requests : 0
            },
            timestamp: Date.now()
        };

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(health));
    }

    handleAnalytics(req, res) {
        const analytics = {
            requests: this.analytics.requests,
            errors: this.analytics.errors,
            errorRate: this.analytics.requests > 0 ? this.analytics.errors / this.analytics.requests : 0,
            avgResponseTime: this.analytics.responseTime.length > 0 
                ? this.analytics.responseTime.reduce((a, b) => a + b, 0) / this.analytics.responseTime.length 
                : 0,
            services: Array.from(this.services.keys()),
            apiKeyTiers: Array.from(this.apiKeys.values()).reduce((acc, key) => {
                acc[key.tier] = (acc[key.tier] || 0) + 1;
                return acc;
            }, {}),
            timestamp: Date.now()
        };

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(analytics));
    }

    start(port = 3000) {
        const server = http.createServer((req, res) => {
            this.handleRequest(req, res);
        });

        server.listen(port, () => {
            console.log(`🚪 API Gateway running on port ${port}`);
            console.log(`📊 Analytics: http://localhost:${port}/gateway/analytics`);
            console.log(`🔍 Health: http://localhost:${port}/gateway/health`);
            console.log(`🔑 API Keys configured: ${this.apiKeys.size}`);
        });

        return server;
    }
}

if (require.main === module) {
    const gateway = new APIGateway();
    gateway.start();
}

module.exports = APIGateway;