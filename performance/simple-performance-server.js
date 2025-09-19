const http = require('http');
const url = require('url');

class SimplePerformanceServer {
    constructor() {
        this.cache = new Map();
        this.stats = { requests: 0, cacheHits: 0 };
    }

    handleRequest(req, res) {
        this.stats.requests++;
        
        const parsedUrl = url.parse(req.url, true);
        const path = parsedUrl.pathname;
        const query = parsedUrl.query;

        // CORS headers
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Content-Type', 'application/json');

        // Cache check
        const cacheKey = `${path}:${JSON.stringify(query)}`;
        if (this.cache.has(cacheKey)) {
            this.stats.cacheHits++;
            res.writeHead(200);
            res.end(JSON.stringify(this.cache.get(cacheKey)));
            return;
        }

        let response;
        
        switch (path) {
            case '/api/valuations/batch':
                response = this.handleBatchValuations(req);
                break;
            case '/api/search':
                response = this.handleSearch(query);
                break;
            case '/api/portfolio':
                response = this.handlePortfolio(query);
                break;
            case '/health':
                response = { status: 'healthy', uptime: process.uptime() };
                break;
            case '/metrics':
                response = this.getMetrics();
                break;
            default:
                res.writeHead(404);
                res.end(JSON.stringify({ error: 'Not found' }));
                return;
        }

        // Cache response
        this.cache.set(cacheKey, response);
        setTimeout(() => this.cache.delete(cacheKey), 300000); // 5min TTL

        res.writeHead(200);
        res.end(JSON.stringify(response));
    }

    handleBatchValuations(req) {
        const count = Math.floor(Math.random() * 50) + 10;
        return {
            valuations: Array.from({ length: count }, (_, i) => ({
                tokenId: `token_${i}`,
                value: Math.floor(Math.random() * 1000000),
                confidence: 0.75 + Math.random() * 0.2
            }))
        };
    }

    handleSearch(query) {
        const q = query.q || 'patent';
        return {
            results: Array.from({ length: 5 }, (_, i) => ({
                id: `result_${i}`,
                title: `IP Result ${i} for "${q}"`,
                relevance: Math.random()
            })),
            query: q
        };
    }

    handlePortfolio(query) {
        const userId = query.userId || 'user123';
        return {
            tokens: Array.from({ length: 10 }, (_, i) => ({
                id: `token_${i}`,
                title: `IP Token ${i}`,
                value: Math.floor(Math.random() * 500000)
            })),
            userId
        };
    }

    getMetrics() {
        const mem = process.memoryUsage();
        return {
            requests: this.stats.requests,
            cacheHits: this.stats.cacheHits,
            cacheHitRate: this.stats.cacheHits / this.stats.requests,
            memory: {
                rss: Math.round(mem.rss / 1024 / 1024),
                heapUsed: Math.round(mem.heapUsed / 1024 / 1024)
            },
            uptime: process.uptime()
        };
    }

    start(port = 3002) {
        const server = http.createServer((req, res) => {
            this.handleRequest(req, res);
        });

        server.listen(port, () => {
            console.log(`🚀 Simple Performance Server running on port ${port}`);
            console.log(`📊 Metrics: http://localhost:${port}/metrics`);
            console.log(`🔍 Search: http://localhost:${port}/api/search?q=patent`);
        });

        return server;
    }
}

if (require.main === module) {
    const server = new SimplePerformanceServer();
    server.start();
}

module.exports = SimplePerformanceServer;