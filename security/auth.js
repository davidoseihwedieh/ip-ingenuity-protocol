const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const rateLimit = require('express-rate-limit');

class AuthManager {
    constructor() {
        this.JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key-change-in-production';
        this.REFRESH_SECRET = process.env.REFRESH_SECRET || 'your-refresh-secret-key';
        this.ACCESS_TOKEN_EXPIRY = '15m';
        this.REFRESH_TOKEN_EXPIRY = '7d';
    }

    getAuthLimiter() {
        return rateLimit({
            windowMs: 15 * 60 * 1000,
            max: 5,
            message: { error: 'Too many authentication attempts' },
            standardHeaders: true,
            legacyHeaders: false,
        });
    }

    generateTokens(userId, email) {
        const payload = { userId, email };
        
        const accessToken = jwt.sign(payload, this.JWT_SECRET, {
            expiresIn: this.ACCESS_TOKEN_EXPIRY,
            issuer: 'ip-ingenuity'
        });

        const refreshToken = jwt.sign(payload, this.REFRESH_SECRET, {
            expiresIn: this.REFRESH_TOKEN_EXPIRY,
            issuer: 'ip-ingenuity'
        });

        return { accessToken, refreshToken };
    }

    verifyAccessToken(token) {
        return jwt.verify(token, this.JWT_SECRET);
    }

    verifyRefreshToken(token) {
        return jwt.verify(token, this.REFRESH_SECRET);
    }

    async hashPassword(password) {
        return await bcrypt.hash(password, 12);
    }

    async verifyPassword(password, hash) {
        return await bcrypt.compare(password, hash);
    }

    authenticateToken(req, res, next) {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({ error: 'Access token required' });
        }

        try {
            const decoded = this.verifyAccessToken(token);
            req.user = decoded;
            next();
        } catch (error) {
            return res.status(403).json({ error: 'Invalid or expired token' });
        }
    }
}

module.exports = new AuthManager();