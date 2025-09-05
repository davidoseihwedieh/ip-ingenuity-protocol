// API Configuration
// Replace these with your actual API keys

const API_CONFIG = {
    // Alpha Vantage - Free tier: 5 calls/minute, 500 calls/day
    // Get free key at: https://www.alphavantage.co/support/#api-key
    ALPHA_VANTAGE_KEY: 'CZWGBSS6TPQV5PRV',
    
    // IEX Cloud - Free tier: 50,000 calls/month
    // Get free key at: https://iexcloud.io/pricing/
    IEX_CLOUD_KEY: '8d54ac4b5f9842deb91de76917b8ecbc',
    
    // CoinGecko - Free, no API key required
    // Rate limit: 10-50 calls/minute depending on plan
    COINGECKO_BASE_URL: 'https://api.coingecko.com/api/v3',
    
    // Stripe - Payment processing
    STRIPE_PUBLISHABLE_KEY: 'pk_test_51S2EAZ2OL2Xc4Ho6jhzpVsFDxxBwzsBOToJI66pRX7jeqqt5qFxiCPkKP93bIZKOh5F5x6XXaSrzPtXDbUWuveTM00ZlMUzfeg',
    
    // USPTO Patent API - Free, no API key required
    // Rate limit: Reasonable use policy
    USPTO_BASE_URL: 'https://developer.uspto.gov/api',
    
    // Cache settings
    CACHE_DURATION: 5 * 60 * 1000, // 5 minutes
    
    // Refresh intervals
    DASHBOARD_REFRESH: 5 * 60 * 1000, // 5 minutes
    TRADING_REFRESH: 30 * 1000, // 30 seconds
    
    // Demo mode (set to false when you have real API keys)
    DEMO_MODE: false // Set to false once you paste real keys above
};

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = API_CONFIG;
} else {
    window.API_CONFIG = API_CONFIG;
}