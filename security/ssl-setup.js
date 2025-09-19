const https = require('https');
const fs = require('fs');
const path = require('path');

class SSLManager {
    static createSecureServer(app) {
        if (process.env.NODE_ENV !== 'production') {
            console.log('Development mode - using HTTP');
            return app;
        }

        try {
            const sslOptions = {
                key: fs.readFileSync(process.env.SSL_KEY_PATH || '/etc/ssl/private/private-key.pem'),
                cert: fs.readFileSync(process.env.SSL_CERT_PATH || '/etc/ssl/certs/certificate.pem'),
                // Additional security options
                secureProtocol: 'TLSv1_2_method',
                ciphers: [
                    'ECDHE-RSA-AES128-GCM-SHA256',
                    'ECDHE-RSA-AES256-GCM-SHA384',
                    'ECDHE-RSA-AES128-SHA256',
                    'ECDHE-RSA-AES256-SHA384'
                ].join(':'),
                honorCipherOrder: true
            };

            return https.createServer(sslOptions, app);
        } catch (error) {
            console.error('SSL setup failed:', error.message);
            console.log('Falling back to HTTP server');
            return app;
        }
    }

    static generateSelfSignedCert() {
        // For development only - use proper certificates in production
        const { execSync } = require('child_process');
        
        try {
            execSync(`
                openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes \
                -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"
            `);
            console.log('Self-signed certificate generated for development');
        } catch (error) {
            console.error('Failed to generate self-signed certificate:', error.message);
        }
    }

    static setupSecurityHeaders(app) {
        // Force HTTPS in production
        app.use((req, res, next) => {
            if (process.env.NODE_ENV === 'production' && !req.secure && req.get('x-forwarded-proto') !== 'https') {
                return res.redirect(301, `https://${req.get('host')}${req.url}`);
            }
            next();
        });

        // Additional security headers
        app.use((req, res, next) => {
            res.setHeader('X-Content-Type-Options', 'nosniff');
            res.setHeader('X-Frame-Options', 'DENY');
            res.setHeader('X-XSS-Protection', '1; mode=block');
            res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
            res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
            next();
        });
    }
}

module.exports = SSLManager;