// Simple User Authentication System
class AuthService {
    constructor() {
        this.users = JSON.parse(localStorage.getItem('users') || '{}');
        this.currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
        this.initAuth();
    }

    // Initialize authentication state
    initAuth() {
        if (this.currentUser) {
            this.showAuthenticatedState();
        } else {
            this.showUnauthenticatedState();
        }
    }

    // Register new user
    register(email, password, name) {
        if (this.users[email]) {
            throw new Error('User already exists');
        }

        const user = {
            id: Date.now().toString(),
            email,
            name,
            password: this.hashPassword(password), // Simple hash
            createdAt: new Date().toISOString(),
            portfolio: {
                balance: 50000, // Demo starting balance
                assets: [],
                totalValue: 50000
            },
            kyc: { verified: false, level: 'basic' }
        };

        this.users[email] = user;
        localStorage.setItem('users', JSON.stringify(this.users));
        
        return this.login(email, password);
    }

    // Login user
    login(email, password) {
        const user = this.users[email];
        if (!user || user.password !== this.hashPassword(password)) {
            throw new Error('Invalid credentials');
        }

        // Remove password from session
        const sessionUser = { ...user };
        delete sessionUser.password;
        
        this.currentUser = sessionUser;
        localStorage.setItem('currentUser', JSON.stringify(sessionUser));
        
        this.showAuthenticatedState();
        return sessionUser;
    }

    // Logout user
    logout() {
        this.currentUser = null;
        localStorage.removeItem('currentUser');
        this.showUnauthenticatedState();
    }

    // Simple password hashing (use proper hashing in production)
    hashPassword(password) {
        return btoa(password + 'salt123'); // Basic encoding
    }

    // Show authenticated UI state
    showAuthenticatedState() {
        // Update navigation
        const navMenu = document.querySelector('.nav-menu');
        if (navMenu) {
            const authLinks = `
                <a href="#dashboard" class="nav-link">Dashboard</a>
                <a href="#portfolio" class="nav-link">Portfolio</a>
                <a href="#trading" class="nav-link">Trading</a>
                <div class="user-dropdown">
                    <span class="user-name">${this.currentUser.name}</span>
                    <button onclick="auth.logout()" class="logout-btn">Logout</button>
                </div>
            `;
            navMenu.innerHTML = authLinks;
        }

        // Update user info in dashboard
        const userInfo = document.querySelector('.user-info');
        if (userInfo) {
            userInfo.innerHTML = `
                <span class="user-name">Welcome, ${this.currentUser.name}</span>
                <div class="user-balance">$${this.currentUser.portfolio.totalValue.toLocaleString()}</div>
            `;
        }

        // Show authenticated sections
        document.querySelectorAll('.auth-required').forEach(el => {
            el.style.display = 'block';
        });
    }

    // Show unauthenticated UI state
    showUnauthenticatedState() {
        // Update navigation
        const navMenu = document.querySelector('.nav-menu');
        if (navMenu) {
            const publicLinks = `
                <a href="#home" class="nav-link">Home</a>
                <a href="#platform" class="nav-link">Platform</a>
                <a href="#metrics" class="nav-link">Metrics</a>
                <button onclick="showLoginModal()" class="nav-link login-btn">Login</button>
                <button onclick="showRegisterModal()" class="nav-link register-btn">Sign Up</button>
            `;
            navMenu.innerHTML = publicLinks;
        }

        // Hide authenticated sections
        document.querySelectorAll('.auth-required').forEach(el => {
            el.style.display = 'none';
        });

        // Show login prompt in dashboard
        const userInfo = document.querySelector('.user-info');
        if (userInfo) {
            userInfo.innerHTML = `
                <button onclick="showLoginModal()" class="pro-btn pro-btn-primary">Login to View Portfolio</button>
            `;
        }
    }

    // Get current user
    getCurrentUser() {
        return this.currentUser;
    }

    // Check if user is authenticated
    isAuthenticated() {
        return !!this.currentUser;
    }

    // Update user portfolio
    updatePortfolio(updates) {
        if (!this.currentUser) return;
        
        this.currentUser.portfolio = { ...this.currentUser.portfolio, ...updates };
        localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
        
        // Update in users storage
        this.users[this.currentUser.email].portfolio = this.currentUser.portfolio;
        localStorage.setItem('users', JSON.stringify(this.users));
    }
}

// Initialize auth service
const auth = new AuthService();

// Modal functions
function showLoginModal() {
    const modal = document.getElementById('authModal') || createAuthModal();
    modal.innerHTML = `
        <div class="modal-overlay" onclick="closeAuthModal()"></div>
        <div class="modal-content">
            <div class="modal-header">
                <h3>Login to Provenance Protocol</h3>
                <button class="modal-close" onclick="closeAuthModal()">×</button>
            </div>
            <div class="modal-body">
                <form onsubmit="handleLogin(event)">
                    <div class="pro-form-group">
                        <label class="pro-form-label">Email</label>
                        <input type="email" class="pro-form-input" name="email" required>
                    </div>
                    <div class="pro-form-group">
                        <label class="pro-form-label">Password</label>
                        <input type="password" class="pro-form-input" name="password" required>
                    </div>
                    <button type="submit" class="pro-btn pro-btn-primary" style="width: 100%">Login</button>
                </form>
                <p style="text-align: center; margin-top: 16px;">
                    Don't have an account? <a href="#" onclick="showRegisterModal()">Sign up</a>
                </p>
            </div>
        </div>
    `;
    modal.classList.add('active');
}

function showRegisterModal() {
    const modal = document.getElementById('authModal') || createAuthModal();
    modal.innerHTML = `
        <div class="modal-overlay" onclick="closeAuthModal()"></div>
        <div class="modal-content">
            <div class="modal-header">
                <h3>Create Account</h3>
                <button class="modal-close" onclick="closeAuthModal()">×</button>
            </div>
            <div class="modal-body">
                <form onsubmit="handleRegister(event)">
                    <div class="pro-form-group">
                        <label class="pro-form-label">Full Name</label>
                        <input type="text" class="pro-form-input" name="name" required>
                    </div>
                    <div class="pro-form-group">
                        <label class="pro-form-label">Email</label>
                        <input type="email" class="pro-form-input" name="email" required>
                    </div>
                    <div class="pro-form-group">
                        <label class="pro-form-label">Password</label>
                        <input type="password" class="pro-form-input" name="password" required minlength="6">
                    </div>
                    <button type="submit" class="pro-btn pro-btn-primary" style="width: 100%">Create Account</button>
                </form>
                <p style="text-align: center; margin-top: 16px;">
                    Already have an account? <a href="#" onclick="showLoginModal()">Login</a>
                </p>
            </div>
        </div>
    `;
    modal.classList.add('active');
}

function createAuthModal() {
    const modal = document.createElement('div');
    modal.id = 'authModal';
    modal.className = 'modal';
    document.body.appendChild(modal);
    return modal;
}

function closeAuthModal() {
    const modal = document.getElementById('authModal');
    if (modal) modal.classList.remove('active');
}

function handleLogin(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    
    try {
        auth.login(formData.get('email'), formData.get('password'));
        closeAuthModal();
        showSuccessMessage('Login successful!');
        
        // Refresh data for authenticated user
        if (window.refreshMarketData) window.refreshMarketData();
        if (window.refreshPatentData) window.refreshPatentData();
        
    } catch (error) {
        showErrorMessage(error.message);
    }
}

function handleRegister(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    
    try {
        auth.register(
            formData.get('email'),
            formData.get('password'),
            formData.get('name')
        );
        closeAuthModal();
        showSuccessMessage('Account created successfully!');
        
    } catch (error) {
        showErrorMessage(error.message);
    }
}

function showSuccessMessage(message) {
    const alert = document.createElement('div');
    alert.className = 'pro-alert pro-alert-success';
    alert.textContent = message;
    alert.style.cssText = 'position: fixed; top: 80px; right: 20px; z-index: 1001; min-width: 300px;';
    document.body.appendChild(alert);
    setTimeout(() => alert.remove(), 3000);
}

function showErrorMessage(message) {
    const alert = document.createElement('div');
    alert.className = 'pro-alert pro-alert-error';
    alert.textContent = message;
    alert.style.cssText = 'position: fixed; top: 80px; right: 20px; z-index: 1001; min-width: 300px;';
    document.body.appendChild(alert);
    setTimeout(() => alert.remove(), 5000);
}

// Demo users for testing
if (Object.keys(auth.users).length === 0) {
    try {
        auth.register('demo@provenanceprotocol.com', 'demo123', 'Demo Investor');
        auth.logout(); // Start logged out
    } catch (e) {
        // User already exists
    }
}