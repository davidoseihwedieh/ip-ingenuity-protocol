const fastify = require('fastify')({ logger: true });
const cache = require('../caching/redis-cache');
const db = require('../database/connection-pool');

class HighPerformanceServer {
    constructor() {
        this.setupMiddleware();
        this.setupRoutes();
    }

    setupMiddleware() {
        // CORS
        fastify.register(require('@fastify/cors'), {
            origin: true,
            credentials: true
        });

        // Rate limiting
        fastify.register(require('@fastify/rate-limit'), {
            max: 100,
            timeWindow: '1 minute'
        });

        // Compression
        fastify.register(require('@fastify/compress'));

        // Caching
        fastify.addHook('preHandler', async (request, reply) => {
            if (request.method === 'GET') {
                const cacheKey = `api:${request.url}`;
                const cached = await cache.get(cacheKey);
                if (cached) {
                    reply.send(cached);
                    return;
                }
                request.cacheKey = cacheKey;
            }
        });

        fastify.addHook('onSend', async (request, reply, payload) => {
            if (request.cacheKey && reply.statusCode === 200) {
                await cache.set(request.cacheKey, JSON.parse(payload), 300);
            }
        });
    }

    setupRoutes() {
        // Batch valuation endpoint
        fastify.post('/api/valuations/batch', {
            schema: {
                body: {
                    type: 'object',
                    properties: {
                        ipTokens: {
                            type: 'array',
                            items: { type: 'string' },
                            maxItems: 50
                        }
                    },
                    required: ['ipTokens']
                }
            }
        }, async (request, reply) => {
            const { ipTokens } = request.body;
            
            const valuations = await Promise.all(
                ipTokens.map(async (tokenId) => {
                    let valuation = await cache.getValuation(tokenId);
                    if (!valuation) {
                        // Simulate AI valuation
                        valuation = {
                            tokenId,
                            value: Math.floor(Math.random() * 1000000),
                            confidence: 0.75 + Math.random() * 0.2,
                            timestamp: Date.now()
                        };
                        await cache.cacheValuation(tokenId, valuation);
                    }
                    return valuation;
                })
            );

            return { valuations };
        });

        // Optimized search endpoint
        fastify.get('/api/search', {
            schema: {
                querystring: {
                    type: 'object',
                    properties: {
                        q: { type: 'string', minLength: 1 },
                        limit: { type: 'integer', minimum: 1, maximum: 100, default: 20 }
                    },
                    required: ['q']
                }
            }
        }, async (request, reply) => {
            const { q, limit } = request.query;
            
            let results = await cache.getSearchResults(q);
            if (!results) {
                const dbResults = await db.searchIPTokens(q, limit);
                results = dbResults.rows;
                await cache.cacheSearchResults(q, results);
            }

            return { results, query: q };
        });

        // User portfolio with pagination
        fastify.get('/api/portfolio/:userId', {
            schema: {
                params: {
                    type: 'object',
                    properties: {
                        userId: { type: 'string' }
                    },
                    required: ['userId']
                },
                querystring: {
                    type: 'object',
                    properties: {
                        page: { type: 'integer', minimum: 1, default: 1 },
                        limit: { type: 'integer', minimum: 1, maximum: 100, default: 20 }
                    }
                }
            }
        }, async (request, reply) => {
            const { userId } = request.params;
            const { page, limit } = request.query;
            const offset = (page - 1) * limit;

            let portfolio = await cache.getUserPortfolio(`${userId}:${page}:${limit}`);
            if (!portfolio) {
                const dbResults = await db.getIPTokens(userId, limit, offset);
                portfolio = {
                    tokens: dbResults.rows,
                    page,
                    limit,
                    total: dbResults.rowCount
                };
                await cache.cacheUserPortfolio(`${userId}:${page}:${limit}`, portfolio);
            }

            return portfolio;
        });

        // Health check
        fastify.get('/health', async (request, reply) => {
            return { 
                status: 'healthy', 
                timestamp: Date.now(),
                uptime: process.uptime()
            };
        });

        // Metrics endpoint
        fastify.get('/metrics', async (request, reply) => {
            const memUsage = process.memoryUsage();
            return {
                memory: {
                    rss: Math.round(memUsage.rss / 1024 / 1024),
                    heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
                    heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024)
                },
                uptime: process.uptime(),
                timestamp: Date.now()
            };
        });
    }

    async start(port = 3002) {
        try {
            await fastify.listen({ port, host: '0.0.0.0' });
            console.log(`🚀 High-performance server running on port ${port}`);
        } catch (error) {
            console.error('Server start error:', error);
            process.exit(1);
        }
    }

    async stop() {
        await fastify.close();
    }
}

module.exports = HighPerformanceServer;