const { Pool } = require('pg');

class DatabasePool {
    constructor() {
        this.pool = new Pool({
            host: process.env.DB_HOST || 'localhost',
            port: process.env.DB_PORT || 5432,
            database: process.env.DB_NAME || 'ip_ingenuity',
            user: process.env.DB_USER || 'postgres',
            password: process.env.DB_PASSWORD,
            max: 20,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 2000,
        });

        this.pool.on('error', (err) => {
            console.error('Database pool error:', err);
        });
    }

    async query(text, params) {
        const start = Date.now();
        try {
            const res = await this.pool.query(text, params);
            const duration = Date.now() - start;
            console.log('Query executed', { text, duration, rows: res.rowCount });
            return res;
        } catch (error) {
            console.error('Database query error:', error);
            throw error;
        }
    }

    async getClient() {
        return await this.pool.connect();
    }

    async transaction(callback) {
        const client = await this.getClient();
        try {
            await client.query('BEGIN');
            const result = await callback(client);
            await client.query('COMMIT');
            return result;
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    // Optimized IP queries
    async getIPTokens(userId, limit = 50, offset = 0) {
        const query = `
            SELECT id, token_id, title, description, ip_type, valuation, 
                   confidence_score, created_at
            FROM ip_tokens 
            WHERE owner_id = $1 
            ORDER BY created_at DESC 
            LIMIT $2 OFFSET $3
        `;
        return await this.query(query, [userId, limit, offset]);
    }

    async searchIPTokens(searchTerm, limit = 20) {
        const query = `
            SELECT id, token_id, title, description, ip_type, valuation, confidence_score
            FROM ip_tokens 
            WHERE to_tsvector('english', title || ' ' || description) @@ plainto_tsquery('english', $1)
            ORDER BY ts_rank(to_tsvector('english', title || ' ' || description), plainto_tsquery('english', $1)) DESC
            LIMIT $2
        `;
        return await this.query(query, [searchTerm, limit]);
    }

    async getTopValuedIPs(limit = 10) {
        const query = `
            SELECT token_id, title, valuation, confidence_score
            FROM ip_tokens 
            WHERE confidence_score > 0.7
            ORDER BY valuation DESC 
            LIMIT $1
        `;
        return await this.query(query, [limit]);
    }

    async close() {
        await this.pool.end();
    }
}

module.exports = new DatabasePool();