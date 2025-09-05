const redis = require('redis');

class RedisCache {
    constructor() {
        this.client = redis.createClient({
            url: process.env.REDIS_URL || 'redis://localhost:6379'
        });
        
        this.client.on('error', (err) => console.error('Redis error:', err));
        this.client.connect();
    }

    async get(key) {
        try {
            const value = await this.client.get(key);
            return value ? JSON.parse(value) : null;
        } catch (error) {
            console.error('Cache get error:', error);
            return null;
        }
    }

    async set(key, value, ttl = 3600) {
        try {
            await this.client.setEx(key, ttl, JSON.stringify(value));
            return true;
        } catch (error) {
            console.error('Cache set error:', error);
            return false;
        }
    }

    async del(key) {
        try {
            await this.client.del(key);
            return true;
        } catch (error) {
            console.error('Cache delete error:', error);
            return false;
        }
    }

    async flush() {
        try {
            await this.client.flushAll();
            return true;
        } catch (error) {
            console.error('Cache flush error:', error);
            return false;
        }
    }

    // IP-specific caching methods
    async cacheValuation(ipId, valuation, ttl = 1800) {
        return await this.set(`valuation:${ipId}`, valuation, ttl);
    }

    async getValuation(ipId) {
        return await this.get(`valuation:${ipId}`);
    }

    async cacheSearchResults(query, results, ttl = 600) {
        const key = `search:${Buffer.from(query).toString('base64')}`;
        return await this.set(key, results, ttl);
    }

    async getSearchResults(query) {
        const key = `search:${Buffer.from(query).toString('base64')}`;
        return await this.get(key);
    }

    async cacheUserPortfolio(userId, portfolio, ttl = 300) {
        return await this.set(`portfolio:${userId}`, portfolio, ttl);
    }

    async getUserPortfolio(userId) {
        return await this.get(`portfolio:${userId}`);
    }
}

module.exports = new RedisCache();