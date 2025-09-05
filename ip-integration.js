// IP Ingenuity Integration Module
class IPIngenuityAPI {
    constructor(baseUrl = 'http://localhost:5001/api') {
        this.baseUrl = baseUrl;
    }

    async evaluateIP(ipData) {
        try {
            const response = await fetch(`${this.baseUrl}/valuation`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(ipData)
            });
            return await response.json();
        } catch (error) {
            console.error('Valuation error:', error);
            return { success: false, error: error.message };
        }
    }

    async searchIP(query) {
        try {
            const response = await fetch(`${this.baseUrl}/search`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ query })
            });
            return await response.json();
        } catch (error) {
            console.error('Search error:', error);
            return { success: false, error: error.message };
        }
    }

    async mintIPToken(tokenData) {
        try {
            const response = await fetch(`${this.baseUrl}/mint`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(tokenData)
            });
            return await response.json();
        } catch (error) {
            console.error('Minting error:', error);
            return { success: false, error: error.message };
        }
    }

    async getPortfolio() {
        try {
            const response = await fetch(`${this.baseUrl}/portfolio`);
            return await response.json();
        } catch (error) {
            console.error('Portfolio error:', error);
            return { success: false, error: error.message };
        }
    }
}

// Initialize API
const ipAPI = new IPIngenuityAPI();

// Enhanced IP Asset Creation
function createIPAsset() {
    const title = document.getElementById('ip-title')?.value || '';
    const description = document.getElementById('ip-description')?.value || '';
    const claims = document.getElementById('ip-claims')?.value.split('\n').filter(c => c.trim()) || [];
    
    const ipData = {
        title,
        description,
        claims,
        industry: 'software',
        technology_area: 'ai blockchain',
        base_valuation: 1000000
    };

    // Show loading state
    showLoadingState('Creating IP asset...');

    // Evaluate IP first
    ipAPI.evaluateIP(ipData).then(result => {
        if (result.success) {
            // Display valuation results
            displayValuationResults(result);
            
            // Mint token with valuation data
            const tokenData = {
                ...ipData,
                valuation: result.valuation,
                confidence: result.confidence
            };
            
            return ipAPI.mintIPToken(tokenData);
        } else {
            throw new Error(result.error);
        }
    }).then(mintResult => {
        if (mintResult.success) {
            displayMintingResults(mintResult);
            updatePortfolio();
        } else {
            throw new Error(mintResult.error);
        }
    }).catch(error => {
        showError('Failed to create IP asset: ' + error.message);
    }).finally(() => {
        hideLoadingState();
    });
}

function displayValuationResults(result) {
    const container = document.getElementById('valuation-results') || createValuationContainer();
    
    container.innerHTML = `
        <div class="valuation-card">
            <h3>AI Valuation Results</h3>
            <div class="valuation-main">
                <span class="valuation-amount">$${result.valuation.toLocaleString()}</span>
                <span class="confidence-score">${result.confidence.toFixed(1)}% confidence</span>
            </div>
            <div class="valuation-breakdown">
                <div class="breakdown-item">
                    <span>Technical Score:</span>
                    <span>${(result.breakdown.technical * 100).toFixed(1)}%</span>
                </div>
                <div class="breakdown-item">
                    <span>Market Score:</span>
                    <span>${(result.breakdown.market * 100).toFixed(1)}%</span>
                </div>
                <div class="breakdown-item">
                    <span>Financial Score:</span>
                    <span>${(result.breakdown.financial * 100).toFixed(1)}%</span>
                </div>
            </div>
        </div>
    `;
}

function displayMintingResults(result) {
    const container = document.getElementById('minting-results') || createMintingContainer();
    
    container.innerHTML = `
        <div class="minting-card">
            <h3>Token Minted Successfully</h3>
            <div class="token-details">
                <p><strong>Token ID:</strong> ${result.token.token_id}</p>
                <p><strong>Transaction Hash:</strong> ${result.token.transaction_hash}</p>
                <p><strong>Block Number:</strong> ${result.token.block_number}</p>
                <p><strong>Gas Used:</strong> ${result.token.gas_used.toLocaleString()}</p>
            </div>
        </div>
    `;
}

function createValuationContainer() {
    const container = document.createElement('div');
    container.id = 'valuation-results';
    container.className = 'results-container';
    document.querySelector('.main-content').appendChild(container);
    return container;
}

function createMintingContainer() {
    const container = document.createElement('div');
    container.id = 'minting-results';
    container.className = 'results-container';
    document.querySelector('.main-content').appendChild(container);
    return container;
}

function showLoadingState(message) {
    const loader = document.getElementById('loading-overlay') || createLoader();
    loader.querySelector('.loading-message').textContent = message;
    loader.style.display = 'flex';
}

function hideLoadingState() {
    const loader = document.getElementById('loading-overlay');
    if (loader) loader.style.display = 'none';
}

function createLoader() {
    const loader = document.createElement('div');
    loader.id = 'loading-overlay';
    loader.className = 'loading-overlay';
    loader.innerHTML = `
        <div class="loading-content">
            <div class="spinner"></div>
            <div class="loading-message">Processing...</div>
        </div>
    `;
    document.body.appendChild(loader);
    return loader;
}

function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    document.querySelector('.main-content').appendChild(errorDiv);
    
    setTimeout(() => errorDiv.remove(), 5000);
}

function updatePortfolio() {
    ipAPI.getPortfolio().then(result => {
        if (result.success) {
            displayPortfolio(result.portfolio);
        }
    });
}

function displayPortfolio(portfolio) {
    const container = document.getElementById('portfolio-container') || createPortfolioContainer();
    
    container.innerHTML = `
        <div class="portfolio-summary">
            <h3>Your IP Portfolio</h3>
            <div class="portfolio-stats">
                <div class="stat">
                    <span class="stat-label">Total Assets</span>
                    <span class="stat-value">${portfolio.total_assets}</span>
                </div>
                <div class="stat">
                    <span class="stat-label">Total Value</span>
                    <span class="stat-value">$${portfolio.total_value.toLocaleString()}</span>
                </div>
            </div>
        </div>
        <div class="portfolio-assets">
            ${portfolio.assets.map(asset => `
                <div class="asset-card">
                    <h4>${asset.title}</h4>
                    <p>Token ID: ${asset.token_id}</p>
                    <p>Valuation: $${asset.valuation.toLocaleString()}</p>
                    <p>Confidence: ${asset.confidence}%</p>
                    <span class="status ${asset.status}">${asset.status}</span>
                </div>
            `).join('')}
        </div>
    `;
}

function createPortfolioContainer() {
    const container = document.createElement('div');
    container.id = 'portfolio-container';
    container.className = 'portfolio-container';
    document.querySelector('.main-content').appendChild(container);
    return container;
}

// Enhanced search functionality
function searchSimilarIP() {
    const query = document.getElementById('search-query')?.value || '';
    if (!query.trim()) return;
    
    showLoadingState('Searching similar IP assets...');
    
    ipAPI.searchIP(query).then(result => {
        if (result.success) {
            displaySearchResults(result.results);
        } else {
            showError('Search failed: ' + result.error);
        }
    }).finally(() => {
        hideLoadingState();
    });
}

function displaySearchResults(results) {
    const container = document.getElementById('search-results') || createSearchContainer();
    
    container.innerHTML = `
        <div class="search-results">
            <h3>Similar IP Assets Found</h3>
            ${results.map(result => `
                <div class="search-result-card">
                    <h4>${result.metadata.title}</h4>
                    <p>Similarity: ${(result.similarity_score * 100).toFixed(1)}%</p>
                    <p>Creator: ${result.metadata.creator}</p>
                    <p>Date: ${result.metadata.creation_date}</p>
                    <span class="asset-type">${result.asset_type}</span>
                </div>
            `).join('')}
        </div>
    `;
}

function createSearchContainer() {
    const container = document.createElement('div');
    container.id = 'search-results';
    container.className = 'search-container';
    document.querySelector('.main-content').appendChild(container);
    return container;
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    // Add event listeners to existing buttons
    const createButton = document.querySelector('[onclick*="createIPAsset"]');
    if (createButton) {
        createButton.onclick = createIPAsset;
    }
    
    const searchButton = document.querySelector('[onclick*="searchIP"]');
    if (searchButton) {
        searchButton.onclick = searchSimilarIP;
    }
    
    // Load initial portfolio
    updatePortfolio();
});

// Export for global use
window.IPIngenuity = {
    api: ipAPI,
    createIPAsset,
    searchSimilarIP,
    updatePortfolio
};