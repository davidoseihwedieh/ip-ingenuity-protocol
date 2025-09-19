const express = require('express');
const cors = require('cors');
const SecurityMiddleware = require('./security-middleware');
const AuthManager = require('./auth');

class SecureServer {
    constructor() {
        this.app = express();
        this.setupSecurity();
        this.setupRoutes();
    }

    setupSecurity() {
        // Security headers
        this.app.use(SecurityMiddleware.getHelmetConfig());
        
        // CORS
        this.app.use(cors(SecurityMiddleware.getCorsConfig()));
        
        // Body parsing with size limits
        this.app.use(express.json({ limit: '10mb' }));
        this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));
        
        // Global rate limiting
        this.app.use('/api/', SecurityMiddleware.getApiLimiter());
        
        // Input sanitization
        this.app.use(SecurityMiddleware.sanitizeInput);
    }

    setupRoutes() {
        // Auth routes with strict rate limiting
        this.app.post('/api/auth/login', 
            AuthManager.getAuthLimiter(),
            SecurityMiddleware.validateInput({
                email: { required: true, type: 'email' },
                password: { required: true, minLength: 8 }
            }),
            this.handleLogin.bind(this)
        );

        this.app.post('/api/auth/register',
            AuthManager.getAuthLimiter(),
            SecurityMiddleware.validateInput({
                email: { required: true, type: 'email' },
                password: { required: true, minLength: 8, pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/ },
                name: { required: true, minLength: 2, maxLength: 50 }
            }),
            this.handleRegister.bind(this)
        );

        this.app.post('/api/auth/refresh',
            AuthManager.getAuthLimiter(),
            this.handleRefresh.bind(this)
        );

        // Protected IP routes
        this.app.post('/api/ip/mint',
            AuthManager.authenticateToken.bind(AuthManager),
            SecurityMiddleware.getStrictLimiter(),
            SecurityMiddleware.validateInput({
                title: { required: true, minLength: 3, maxLength: 100 },
                description: { required: true, minLength: 10, maxLength: 1000 },
                ipType: { required: true }
            }),
            this.handleIPMint.bind(this)
        );

        this.app.get('/api/ip/portfolio',
            AuthManager.authenticateToken.bind(AuthManager),
            this.handlePortfolio.bind(this)
        );
    }

    async handleLogin(req, res) {
        try {
            const { email, password } = req.body;
            
            // Simulate user lookup and password verification
            // Replace with actual database logic
            const user = { id: 1, email, password: 'hashed_password' };
            
            if (!user || !await AuthManager.verifyPassword(password, user.password)) {
                return res.status(401).json({ error: 'Invalid credentials' });
            }

            const tokens = AuthManager.generateTokens(user.id, user.email);
            
            res.json({
                message: 'Login successful',
                accessToken: tokens.accessToken,
                refreshToken: tokens.refreshToken
            });
        } catch (error) {
            res.status(500).json({ error: 'Login failed' });
        }
    }

    async handleRegister(req, res) {
        try {
            const { email, password, name } = req.body;
            
            // Check if user exists
            // Replace with actual database logic
            const existingUser = null; // await db.findUserByEmail(email);
            
            if (existingUser) {
                return res.status(409).json({ error: 'User already exists' });
            }

            const hashedPassword = await AuthManager.hashPassword(password);
            
            // Create user in database
            // const newUser = await db.createUser({ email, password: hashedPassword, name });
            const newUser = { id: Date.now(), email, name };

            const tokens = AuthManager.generateTokens(newUser.id, newUser.email);
            
            res.status(201).json({
                message: 'Registration successful',
                accessToken: tokens.accessToken,
                refreshToken: tokens.refreshToken
            });
        } catch (error) {
            res.status(500).json({ error: 'Registration failed' });
        }
    }

    async handleRefresh(req, res) {
        try {
            const { refreshToken } = req.body;
            
            if (!refreshToken) {
                return res.status(401).json({ error: 'Refresh token required' });
            }

            const decoded = AuthManager.verifyRefreshToken(refreshToken);
            const tokens = AuthManager.generateTokens(decoded.userId, decoded.email);
            
            res.json({
                accessToken: tokens.accessToken,
                refreshToken: tokens.refreshToken
            });
        } catch (error) {
            res.status(403).json({ error: 'Invalid refresh token' });
        }
    }

    async handleIPMint(req, res) {
        try {
            const { title, description, ipType } = req.body;
            const userId = req.user.userId;
            
            // IP minting logic here
            const ipToken = {
                id: Date.now(),
                title,
                description,
                ipType,
                owner: userId,
                createdAt: new Date()
            };
            
            res.json({
                message: 'IP token minted successfully',
                token: ipToken
            });
        } catch (error) {
            res.status(500).json({ error: 'Minting failed' });
        }
    }

    async handlePortfolio(req, res) {
        try {
            const userId = req.user.userId;
            
            // Fetch user's IP portfolio
            const portfolio = []; // await db.getUserPortfolio(userId);
            
            res.json({ portfolio });
        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch portfolio' });
        }
    }

    start(port = 3001) {
        this.app.listen(port, () => {
            console.log(`Secure IP Ingenuity server running on port ${port}`);
        });
    }
}

module.exports = SecureServer;