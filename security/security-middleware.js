const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const validator = require('validator');

class SecurityMiddleware {
    // Security headers
    static getHelmetConfig() {
        return helmet({
            contentSecurityPolicy: {
                directives: {
                    defaultSrc: ["'self'"],
                    styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
                    fontSrc: ["'self'", "https://fonts.gstatic.com"],
                    scriptSrc: ["'self'"],
                    imgSrc: ["'self'", "data:", "https:"],
                    connectSrc: ["'self'", "https://api.coingecko.com"]
                }
            },
            hsts: {
                maxAge: 31536000,
                includeSubDomains: true,
                preload: true
            }
        });
    }

    // API rate limiting
    static getApiLimiter() {
        return rateLimit({
            windowMs: 15 * 60 * 1000,
            max: 100,
            message: { error: 'Too many requests' },
            standardHeaders: true,
            legacyHeaders: false,
        });
    }

    // Strict rate limiting for sensitive endpoints
    static getStrictLimiter() {
        return rateLimit({
            windowMs: 60 * 60 * 1000,
            max: 10,
            message: { error: 'Rate limit exceeded for sensitive operation' }
        });
    }

    // Input validation middleware
    static validateInput(schema) {
        return (req, res, next) => {
            const errors = [];

            for (const [field, rules] of Object.entries(schema)) {
                const value = req.body[field];

                if (rules.required && !value) {
                    errors.push(`${field} is required`);
                    continue;
                }

                if (value) {
                    if (rules.type === 'email' && !validator.isEmail(value)) {
                        errors.push(`${field} must be a valid email`);
                    }
                    if (rules.minLength && value.length < rules.minLength) {
                        errors.push(`${field} must be at least ${rules.minLength} characters`);
                    }
                    if (rules.maxLength && value.length > rules.maxLength) {
                        errors.push(`${field} must be less than ${rules.maxLength} characters`);
                    }
                    if (rules.pattern && !rules.pattern.test(value)) {
                        errors.push(`${field} format is invalid`);
                    }
                }
            }

            if (errors.length > 0) {
                return res.status(400).json({ errors });
            }

            next();
        };
    }

    // SQL injection prevention
    static sanitizeInput(req, res, next) {
        const sanitize = (obj) => {
            for (const key in obj) {
                if (typeof obj[key] === 'string') {
                    obj[key] = validator.escape(obj[key]);
                } else if (typeof obj[key] === 'object') {
                    sanitize(obj[key]);
                }
            }
        };

        if (req.body) sanitize(req.body);
        if (req.query) sanitize(req.query);
        if (req.params) sanitize(req.params);

        next();
    }

    // CORS configuration
    static getCorsConfig() {
        return {
            origin: process.env.NODE_ENV === 'production' 
                ? ['https://ipingenuity.com', 'https://www.ipingenuity.com']
                : ['http://localhost:3000', 'http://127.0.0.1:3000'],
            credentials: true,
            methods: ['GET', 'POST', 'PUT', 'DELETE'],
            allowedHeaders: ['Content-Type', 'Authorization']
        };
    }
}

module.exports = SecurityMiddleware;