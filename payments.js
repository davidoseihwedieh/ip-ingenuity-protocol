// Payment Processing with Stripe
class PaymentService {
    constructor() {
        this.stripe = null;
        this.publishableKey = API_CONFIG.STRIPE_PUBLISHABLE_KEY || 'pk_test_demo';
        this.init();
    }

    async init() {
        // Load Stripe.js
        if (!window.Stripe) {
            await this.loadStripe();
        }
        
        if (this.publishableKey && !this.publishableKey.includes('demo')) {
            this.stripe = Stripe(this.publishableKey);
        }
    }

    // Load Stripe.js library
    loadStripe() {
        return new Promise((resolve) => {
            const script = document.createElement('script');
            script.src = 'https://js.stripe.com/v3/';
            script.onload = resolve;
            document.head.appendChild(script);
        });
    }

    // Process investment payment
    async processInvestment(amount, assetId, paymentMethod = 'card') {
        try {
            if (!this.stripe || this.publishableKey.includes('demo')) {
                return this.simulatePayment(amount, assetId);
            }

            // Create payment intent (would be done on your backend)
            const paymentIntent = await this.createPaymentIntent(amount, assetId);
            
            // Confirm payment
            const result = await this.stripe.confirmCardPayment(paymentIntent.client_secret, {
                payment_method: {
                    card: this.cardElement,
                    billing_details: {
                        name: auth.getCurrentUser()?.name || 'Anonymous'
                    }
                }
            });

            if (result.error) {
                throw new Error(result.error.message);
            }

            // Payment successful
            await this.handleSuccessfulPayment(result.paymentIntent, assetId, amount);
            return result.paymentIntent;

        } catch (error) {
            console.error('Payment failed:', error);
            this.showPaymentError(error.message);
            throw error;
        }
    }

    // Simulate payment for demo (when no real Stripe key)
    async simulatePayment(amount, assetId) {
        return new Promise((resolve, reject) => {
            // Show payment processing
            this.showPaymentProcessing();
            
            setTimeout(() => {
                // Simulate 90% success rate
                if (Math.random() > 0.1) {
                    const mockPayment = {
                        id: 'pi_demo_' + Date.now(),
                        amount: amount * 100, // Stripe uses cents
                        currency: 'usd',
                        status: 'succeeded',
                        created: Math.floor(Date.now() / 1000)
                    };
                    
                    this.handleSuccessfulPayment(mockPayment, assetId, amount);
                    resolve(mockPayment);
                } else {
                    const error = new Error('Payment declined by bank');
                    this.showPaymentError(error.message);
                    reject(error);
                }
            }, 2000); // 2 second delay to simulate processing
        });
    }

    // Create payment intent (backend simulation)
    async createPaymentIntent(amount, assetId) {
        // In production, this would call your backend
        return {
            client_secret: 'pi_demo_' + Date.now() + '_secret_demo',
            amount: amount * 100,
            currency: 'usd'
        };
    }

    // Handle successful payment
    async handleSuccessfulPayment(paymentIntent, assetId, amount) {
        // Update user portfolio
        if (auth.isAuthenticated()) {
            const user = auth.getCurrentUser();
            const newAsset = {
                id: assetId,
                name: `IP Asset ${assetId}`,
                purchasePrice: amount,
                currentValue: amount,
                shares: amount / 1000, // $1000 per share simulation
                purchaseDate: new Date().toISOString(),
                paymentId: paymentIntent.id
            };

            const updatedPortfolio = {
                ...user.portfolio,
                balance: user.portfolio.balance - amount,
                assets: [...user.portfolio.assets, newAsset],
                totalValue: user.portfolio.totalValue // Will be recalculated
            };

            auth.updatePortfolio(updatedPortfolio);
        }

        // Show success message
        this.showPaymentSuccess(amount, assetId);
        
        // Update UI
        if (window.refreshMarketData) {
            window.refreshMarketData();
        }
    }

    // Setup Stripe Elements (for real payments)
    setupStripeElements() {
        if (!this.stripe) return;

        const elements = this.stripe.elements();
        this.cardElement = elements.create('card', {
            style: {
                base: {
                    fontSize: '16px',
                    color: '#424770',
                    '::placeholder': {
                        color: '#aab7c4',
                    },
                },
            },
        });

        // Mount card element
        const cardContainer = document.getElementById('card-element');
        if (cardContainer) {
            this.cardElement.mount('#card-element');
        }
    }

    // Show payment modal
    showPaymentModal(assetData) {
        const modal = document.getElementById('paymentModal') || this.createPaymentModal();
        
        modal.innerHTML = `
            <div class="modal-overlay" onclick="closePaymentModal()"></div>
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Complete Investment</h3>
                    <button class="modal-close" onclick="closePaymentModal()">×</button>
                </div>
                <div class="modal-body">
                    <div class="investment-summary">
                        <h4>${assetData.name}</h4>
                        <div class="price-breakdown">
                            <div class="price-row">
                                <span>Investment Amount:</span>
                                <span>$${assetData.amount.toLocaleString()}</span>
                            </div>
                            <div class="price-row">
                                <span>Platform Fee (2.5%):</span>
                                <span>$${(assetData.amount * 0.025).toLocaleString()}</span>
                            </div>
                            <div class="price-row total">
                                <span><strong>Total:</strong></span>
                                <span><strong>$${(assetData.amount * 1.025).toLocaleString()}</strong></span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="payment-methods">
                        <h4>Payment Method</h4>
                        <div class="payment-tabs">
                            <button class="payment-tab active" onclick="selectPaymentMethod('card')">
                                💳 Credit Card
                            </button>
                            <button class="payment-tab" onclick="selectPaymentMethod('crypto')">
                                ₿ Cryptocurrency
                            </button>
                        </div>
                        
                        <div id="card-payment" class="payment-form">
                            <div id="card-element" class="card-input">
                                <!-- Stripe Elements will create form elements here -->
                            </div>
                            <div class="demo-notice">
                                <p><strong>Demo Mode:</strong> Use test card 4242 4242 4242 4242</p>
                            </div>
                        </div>
                        
                        <div id="crypto-payment" class="payment-form" style="display: none;">
                            <div class="crypto-options">
                                <button class="crypto-btn" onclick="payWithCrypto('ETH')">
                                    Pay with ETH
                                </button>
                                <button class="crypto-btn" onclick="payWithCrypto('USDC')">
                                    Pay with USDC
                                </button>
                            </div>
                        </div>
                    </div>
                    
                    <button onclick="processPayment('${assetData.id}', ${assetData.amount * 1.025})" 
                            class="pro-btn pro-btn-primary" 
                            style="width: 100%; margin-top: 20px;"
                            id="paymentSubmitBtn">
                        Complete Investment
                    </button>
                </div>
            </div>
        `;
        
        modal.classList.add('active');
        
        // Setup Stripe elements after modal is shown
        setTimeout(() => this.setupStripeElements(), 100);
    }

    createPaymentModal() {
        const modal = document.createElement('div');
        modal.id = 'paymentModal';
        modal.className = 'modal';
        document.body.appendChild(modal);
        return modal;
    }

    // Show payment processing state
    showPaymentProcessing() {
        const btn = document.getElementById('paymentSubmitBtn');
        if (btn) {
            btn.innerHTML = '<div class="pro-loading"></div> Processing...';
            btn.disabled = true;
        }
    }

    // Show payment success
    showPaymentSuccess(amount, assetId) {
        this.closePaymentModal();
        
        const alert = document.createElement('div');
        alert.className = 'pro-alert pro-alert-success';
        alert.innerHTML = `
            <strong>Investment Successful!</strong><br>
            You've invested $${amount.toLocaleString()} in asset ${assetId}
        `;
        alert.style.cssText = 'position: fixed; top: 80px; right: 20px; z-index: 1001; min-width: 300px;';
        document.body.appendChild(alert);
        setTimeout(() => alert.remove(), 5000);
    }

    // Show payment error
    showPaymentError(message) {
        const btn = document.getElementById('paymentSubmitBtn');
        if (btn) {
            btn.innerHTML = 'Complete Investment';
            btn.disabled = false;
        }
        
        const alert = document.createElement('div');
        alert.className = 'pro-alert pro-alert-error';
        alert.innerHTML = `<strong>Payment Failed:</strong><br>${message}`;
        alert.style.cssText = 'position: fixed; top: 80px; right: 20px; z-index: 1001; min-width: 300px;';
        document.body.appendChild(alert);
        setTimeout(() => alert.remove(), 5000);
    }

    closePaymentModal() {
        const modal = document.getElementById('paymentModal');
        if (modal) modal.classList.remove('active');
    }
}

// Initialize payment service
const paymentService = new PaymentService();

// Global functions
function showPaymentModal(assetData) {
    if (!auth.isAuthenticated()) {
        showLoginModal();
        return;
    }
    paymentService.showPaymentModal(assetData);
}

function closePaymentModal() {
    paymentService.closePaymentModal();
}

function selectPaymentMethod(method) {
    // Update active tab
    document.querySelectorAll('.payment-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    event.target.classList.add('active');
    
    // Show/hide payment forms
    document.getElementById('card-payment').style.display = method === 'card' ? 'block' : 'none';
    document.getElementById('crypto-payment').style.display = method === 'crypto' ? 'block' : 'none';
}

function processPayment(assetId, amount) {
    paymentService.processInvestment(amount, assetId);
}

function payWithCrypto(currency) {
    if (!web3Service.isConnected()) {
        web3Service.connectWallet().then(() => {
            alert(`Crypto payment with ${currency} - Feature coming soon!`);
        });
    } else {
        alert(`Crypto payment with ${currency} - Feature coming soon!`);
    }
}

// Add payment buttons to asset cards
document.addEventListener('DOMContentLoaded', () => {
    // Add invest buttons to existing asset cards
    setTimeout(() => {
        const assetCards = document.querySelectorAll('.asset-card');
        assetCards.forEach((card, index) => {
            const actionsDiv = card.querySelector('.asset-actions');
            if (actionsDiv && !actionsDiv.querySelector('.invest-btn')) {
                const investBtn = document.createElement('button');
                investBtn.className = 'pro-btn pro-btn-success btn-sm invest-btn';
                investBtn.textContent = 'Invest';
                investBtn.onclick = () => {
                    const assetName = card.querySelector('h3')?.textContent || 'IP Asset';
                    const assetValue = 50000 + Math.random() * 100000; // Random investment amount
                    showPaymentModal({
                        id: `asset_${index}`,
                        name: assetName,
                        amount: Math.round(assetValue)
                    });
                };
                actionsDiv.appendChild(investBtn);
            }
        });
    }, 2000);
});