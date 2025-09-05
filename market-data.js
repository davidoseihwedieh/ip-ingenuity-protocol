// Real Market Data Integration
class MarketDataService {
    constructor() {
        // API keys from config
        this.alphaVantageKey = API_CONFIG.ALPHA_VANTAGE_KEY;
        this.iexCloudKey = API_CONFIG.IEX_CLOUD_KEY;
        
        // Cache for API responses (5 minute cache)
        this.cache = new Map();
        this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
    }

    // Get cached data or fetch new
    async getCachedData(key, fetchFunction) {
        const cached = this.cache.get(key);
        if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
            return cached.data;
        }
        
        try {
            const data = await fetchFunction();
            this.cache.set(key, { data, timestamp: Date.now() });
            return data;
        } catch (error) {
            console.error(`Error fetching ${key}:`, error);
            return cached ? cached.data : null;
        }
    }

    // Fetch real stock data from Alpha Vantage
    async getStockData(symbol) {
        return this.getCachedData(`stock_${symbol}`, async () => {
            const response = await fetch(
                `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${this.alphaVantageKey}`
            );
            const data = await response.json();
            
            if (data['Global Quote']) {
                const quote = data['Global Quote'];
                return {
                    symbol: quote['01. symbol'],
                    price: parseFloat(quote['05. price']),
                    change: parseFloat(quote['09. change']),
                    changePercent: parseFloat(quote['10. change percent'].replace('%', '')),
                    volume: parseInt(quote['06. volume']),
                    lastUpdated: quote['07. latest trading day']
                };
            }
            return null;
        });
    }

    // Fetch crypto data from CoinGecko (free, no API key needed)
    async getCryptoData(coinId = 'bitcoin') {
        return this.getCachedData(`crypto_${coinId}`, async () => {
            const response = await fetch(
                `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd&include_24hr_change=true&include_24hr_vol=true`
            );
            const data = await response.json();
            
            if (data[coinId]) {
                const coin = data[coinId];
                return {
                    symbol: coinId.toUpperCase(),
                    price: coin.usd,
                    change24h: coin.usd_24h_change || 0,
                    volume24h: coin.usd_24h_vol || 0
                };
            }
            return null;
        });
    }

    // Fetch market overview data
    async getMarketOverview() {
        return this.getCachedData('market_overview', async () => {
            // Fetch multiple data points
            const [btc, eth, sp500] = await Promise.all([
                this.getCryptoData('bitcoin'),
                this.getCryptoData('ethereum'),
                this.getStockData('SPY') // S&P 500 ETF
            ]);

            return {
                crypto: { btc, eth },
                traditional: { sp500 },
                lastUpdated: new Date().toISOString()
            };
        });
    }

    // Simulate IP asset data (until real IP APIs are integrated)
    generateIPAssetData() {
        const assets = [
            { name: 'AEGIS-Q Quantum Algorithm', symbol: 'AEGIS-Q', sector: 'quantum' },
            { name: 'Gene Therapy Patent', symbol: 'GENE-THER', sector: 'biotech' },
            { name: 'AI Training Algorithm', symbol: 'AI-TRAIN', sector: 'ai' },
            { name: 'Solar Panel Innovation', symbol: 'SOLAR-X', sector: 'renewable' },
            { name: 'Blockchain Protocol', symbol: 'CHAIN-P', sector: 'fintech' }
        ];

        return assets.map(asset => {
            // Generate realistic but simulated data
            const basePrice = Math.random() * 100000 + 10000;
            const change = (Math.random() - 0.5) * 20; // -10% to +10%
            
            return {
                ...asset,
                price: Math.round(basePrice),
                change: Math.round(change * 100) / 100,
                changePercent: Math.round(change * 100) / 100,
                volume: Math.round(Math.random() * 1000000),
                marketCap: Math.round(basePrice * (Math.random() * 1000 + 100)),
                lastUpdated: new Date().toISOString()
            };
        });
    }

    // Format currency values
    formatCurrency(value, currency = 'USD') {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
        }).format(value);
    }

    // Format percentage values
    formatPercent(value) {
        const sign = value >= 0 ? '+' : '';
        return `${sign}${value.toFixed(2)}%`;
    }

    // Format large numbers (K, M, B)
    formatLargeNumber(value) {
        if (value >= 1e9) return `$${(value / 1e9).toFixed(1)}B`;
        if (value >= 1e6) return `$${(value / 1e6).toFixed(1)}M`;
        if (value >= 1e3) return `$${(value / 1e3).toFixed(1)}K`;
        return `$${value.toFixed(0)}`;
    }
}

// Initialize market data service
const marketData = new MarketDataService();

// Update dashboard with real data
async function updateDashboardData() {
    try {
        // Show loading state
        showLoadingState();

        // Fetch real market data
        const [overview, ipAssets] = await Promise.all([
            marketData.getMarketOverview(),
            Promise.resolve(marketData.generateIPAssetData())
        ]);

        // Update portfolio value (simulate based on IP assets)
        const totalPortfolioValue = ipAssets.reduce((sum, asset) => sum + asset.price * 0.1, 0);
        updatePortfolioMetrics(totalPortfolioValue, ipAssets);

        // Update market metrics
        updateMarketMetrics(overview);

        // Update asset cards
        updateAssetCards(ipAssets.slice(0, 3));

        // Update last refresh time
        updateLastRefreshTime();

        hideLoadingState();
    } catch (error) {
        console.error('Error updating dashboard:', error);
        showErrorState();
    }
}

// Update portfolio metrics in the dashboard
function updatePortfolioMetrics(totalValue, assets) {
    const portfolioElement = document.querySelector('.user-balance');
    if (portfolioElement) {
        portfolioElement.textContent = marketData.formatCurrency(totalValue);
    }

    // Update quick stats
    const statCards = document.querySelectorAll('.stat-card');
    if (statCards.length >= 4) {
        // Portfolio value
        const portfolioStat = statCards[0].querySelector('.stat-info h3');
        if (portfolioStat) portfolioStat.textContent = marketData.formatCurrency(totalValue);

        // Number of assets
        const assetsStat = statCards[1].querySelector('.stat-info h3');
        if (assetsStat) assetsStat.textContent = assets.length.toString();

        // Average change
        const avgChange = assets.reduce((sum, asset) => sum + asset.changePercent, 0) / assets.length;
        const changeStat = statCards[0].querySelector('.stat-change');
        if (changeStat) {
            changeStat.textContent = marketData.formatPercent(avgChange);
            changeStat.className = `stat-change ${avgChange >= 0 ? 'positive' : 'negative'}`;
        }
    }
}

// Update market metrics
function updateMarketMetrics(overview) {
    if (!overview) return;

    // Update market cap and volume in metrics section
    const metricCards = document.querySelectorAll('.metric-card');
    metricCards.forEach((card, index) => {
        const valueElement = card.querySelector('.metric-large');
        if (!valueElement) return;

        switch (index) {
            case 1: // Market cap simulation
                if (overview.crypto.btc) {
                    valueElement.textContent = marketData.formatLargeNumber(overview.crypto.btc.price * 19000000);
                }
                break;
            case 4: // Token price simulation
                if (overview.crypto.eth) {
                    const tokenPrice = overview.crypto.eth.price * 0.001; // Simulate token price
                    valueElement.textContent = marketData.formatCurrency(tokenPrice);
                }
                break;
        }
    });
}

// Update asset cards with real data
function updateAssetCards(assets) {
    const assetCards = document.querySelectorAll('.asset-card');
    
    assets.forEach((asset, index) => {
        if (index < assetCards.length) {
            const card = assetCards[index];
            
            // Update asset name
            const nameElement = card.querySelector('h3');
            if (nameElement) nameElement.textContent = asset.name;

            // Update price
            const priceElements = card.querySelectorAll('.metric-value');
            if (priceElements.length >= 1) {
                priceElements[0].textContent = marketData.formatCurrency(asset.price);
            }

            // Update change percentage
            if (priceElements.length >= 2) {
                priceElements[1].textContent = marketData.formatPercent(asset.changePercent);
                priceElements[1].className = `metric-value ${asset.changePercent >= 0 ? 'positive' : 'negative'}`;
            }
        }
    });
}

// Show loading state
function showLoadingState() {
    const loadingElements = document.querySelectorAll('.stat-info h3, .metric-large');
    loadingElements.forEach(el => {
        if (!el.dataset.originalText) {
            el.dataset.originalText = el.textContent;
        }
        el.innerHTML = '<div class="pro-loading"></div>';
    });
}

// Hide loading state
function hideLoadingState() {
    const loadingElements = document.querySelectorAll('.pro-loading');
    loadingElements.forEach(el => el.remove());
}

// Show error state
function showErrorState() {
    console.log('Using cached/demo data due to API error');
    hideLoadingState();
}

// Update last refresh time
function updateLastRefreshTime() {
    const now = new Date();
    const timeString = now.toLocaleTimeString('en-US', { 
        hour12: false, 
        hour: '2-digit', 
        minute: '2-digit' 
    });
    
    // Add refresh indicator to dashboard
    let refreshIndicator = document.querySelector('.refresh-indicator');
    if (!refreshIndicator) {
        refreshIndicator = document.createElement('div');
        refreshIndicator.className = 'refresh-indicator';
        refreshIndicator.style.cssText = `
            position: fixed;
            top: 70px;
            right: 20px;
            background: #00b894;
            color: white;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 11px;
            z-index: 1000;
        `;
        document.body.appendChild(refreshIndicator);
    }
    
    refreshIndicator.textContent = `Updated: ${timeString}`;
    
    // Hide after 3 seconds
    setTimeout(() => {
        if (refreshIndicator) refreshIndicator.style.opacity = '0';
    }, 3000);
}

// Auto-refresh data every 5 minutes
setInterval(updateDashboardData, 5 * 60 * 1000);

// Initial load when page loads
document.addEventListener('DOMContentLoaded', () => {
    // Wait a bit for page to fully load
    setTimeout(updateDashboardData, 1000);
});

// Manual refresh function
window.refreshMarketData = updateDashboardData;