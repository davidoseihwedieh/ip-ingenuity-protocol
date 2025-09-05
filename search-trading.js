// Search & Discovery Functionality
function initializeSearch() {
    const searchInput = document.getElementById('searchInput');
    const filterInputs = ['filterType', 'filterSector', 'filterPrice', 'filterStatus', 'sortBy'];
    const resultsContainer = document.getElementById('searchResults');
    const resultsCount = document.getElementById('resultsCount');

    // Sample IP assets data
    const sampleAssets = [
        {
            id: 1,
            title: 'AEGIS-Q Quantum Algorithm',
            creator: 'Dr. Sarah Chen',
            type: 'patent',
            sector: 'quantum',
            price: 47730,
            status: 'active',
            description: 'Revolutionary quantum-resistant cryptographic algorithm for secure communications.',
            date: '2024-01-15'
        },
        {
            id: 2,
            title: 'Gene Therapy Patent',
            creator: 'BioTech Labs',
            type: 'patent',
            sector: 'biotech',
            price: 125000,
            status: 'active',
            description: 'Novel gene therapy approach for treating inherited genetic disorders.',
            date: '2024-02-20'
        },
        {
            id: 3,
            title: 'AI Training Algorithm',
            creator: 'Neural Networks Inc',
            type: 'patent',
            sector: 'ai-ml',
            price: 89500,
            status: 'active',
            description: 'Advanced machine learning algorithm for efficient neural network training.',
            date: '2024-01-30'
        },
        {
            id: 4,
            title: 'FinTech Security Protocol',
            creator: 'SecureBank Solutions',
            type: 'patent',
            sector: 'fintech',
            price: 67200,
            status: 'pending',
            description: 'Multi-layer security protocol for financial transaction processing.',
            date: '2024-03-05'
        },
        {
            id: 5,
            title: 'Renewable Energy Storage',
            creator: 'GreenTech Innovations',
            type: 'patent',
            sector: 'renewable',
            price: 156000,
            status: 'active',
            description: 'Efficient battery technology for renewable energy storage systems.',
            date: '2024-02-10'
        },
        {
            id: 6,
            title: 'Autonomous Vehicle Navigation',
            creator: 'AutoDrive Corp',
            type: 'patent',
            sector: 'automotive',
            price: 234000,
            status: 'active',
            description: 'Advanced navigation system for autonomous vehicle path planning.',
            date: '2024-01-25'
        }
    ];

    let filteredAssets = [...sampleAssets];

    function renderResults(assets) {
        resultsCount.textContent = assets.length;
        
        resultsContainer.innerHTML = assets.map(asset => `
            <div class="search-result-card" data-asset-id="${asset.id}">
                <div class="result-header">
                    <h3 class="result-title">${asset.title}</h3>
                    <span class="result-type">${asset.type}</span>
                </div>
                <div class="result-creator">${asset.creator}</div>
                <div class="result-description">${asset.description}</div>
                <div class="result-metrics">
                    <span class="result-price">$${asset.price.toLocaleString()}</span>
                    <span class="result-status ${asset.status}">${asset.status}</span>
                </div>
            </div>
        `).join('');

        // Add click handlers to result cards
        document.querySelectorAll('.search-result-card').forEach(card => {
            card.addEventListener('click', function() {
                const assetId = this.dataset.assetId;
                alert(`Opening details for asset ID: ${assetId}`);
            });
        });
    }

    function applyFilters() {
        const searchTerm = searchInput.value.toLowerCase();
        const filters = {};
        
        filterInputs.forEach(filterId => {
            const element = document.getElementById(filterId);
            if (element && element.value) {
                filters[filterId.replace('filter', '').toLowerCase()] = element.value;
            }
        });

        filteredAssets = sampleAssets.filter(asset => {
            if (searchTerm && !asset.title.toLowerCase().includes(searchTerm) && 
                !asset.creator.toLowerCase().includes(searchTerm) &&
                !asset.description.toLowerCase().includes(searchTerm)) {
                return false;
            }

            if (filters.type && asset.type !== filters.type) {
                return false;
            }

            if (filters.sector && asset.sector !== filters.sector) {
                return false;
            }

            if (filters.price) {
                const [min, max] = filters.price.split('-').map(p => parseInt(p) || Infinity);
                if (asset.price < min || (max !== Infinity && asset.price > max)) {
                    return false;
                }
            }

            if (filters.status && asset.status !== filters.status) {
                return false;
            }

            return true;
        });

        const sortBy = document.getElementById('sortBy').value;
        switch (sortBy) {
            case 'price-high':
                filteredAssets.sort((a, b) => b.price - a.price);
                break;
            case 'price-low':
                filteredAssets.sort((a, b) => a.price - b.price);
                break;
            case 'date-new':
                filteredAssets.sort((a, b) => new Date(b.date) - new Date(a.date));
                break;
        }

        renderResults(filteredAssets);
    }

    searchInput.addEventListener('input', applyFilters);
    filterInputs.forEach(filterId => {
        const element = document.getElementById(filterId);
        if (element) {
            element.addEventListener('change', applyFilters);
        }
    });

    renderResults(filteredAssets);
}

// Trading Interface Functionality
function initializeTrading() {
    const orderTabs = document.querySelectorAll('.order-tab');
    const orderPrice = document.getElementById('orderPrice');
    const orderQuantity = document.getElementById('orderQuantity');
    const orderTotal = document.getElementById('orderTotal');
    const tradingFee = document.getElementById('tradingFee');
    const totalCost = document.getElementById('totalCost');
    const submitOrder = document.getElementById('submitOrder');
    const assetItems = document.querySelectorAll('.asset-item');
    const canvas = document.getElementById('tradingChart');

    let currentOrderType = 'buy';
    let currentAsset = 'AEGIS-Q';

    orderTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            orderTabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            currentOrderType = this.dataset.tab;
            
            submitOrder.textContent = `Place ${currentOrderType.charAt(0).toUpperCase() + currentOrderType.slice(1)} Order`;
            submitOrder.className = `order-submit-btn ${currentOrderType}-btn`;
        });
    });

    assetItems.forEach(item => {
        item.addEventListener('click', function() {
            assetItems.forEach(i => i.classList.remove('active'));
            this.classList.add('active');
            currentAsset = this.dataset.asset;
            
            const assetName = this.querySelector('.asset-name').textContent;
            const assetPrice = this.querySelector('.asset-price').textContent;
            
            document.getElementById('currentAssetName').textContent = assetName;
            document.getElementById('currentPrice').textContent = assetPrice;
            
            orderPrice.value = parseFloat(assetPrice.replace(/[$,]/g, ''));
            calculateTotal();
        });
    });

    function calculateTotal() {
        const price = parseFloat(orderPrice.value) || 0;
        const quantity = parseFloat(orderQuantity.value) || 0;
        const subtotal = price * quantity;
        const fee = subtotal * 0.0025;
        const total = subtotal + fee;

        orderTotal.value = subtotal.toFixed(2);
        tradingFee.textContent = `$${fee.toFixed(2)}`;
        totalCost.textContent = `$${total.toFixed(2)}`;
    }

    [orderPrice, orderQuantity].forEach(input => {
        input.addEventListener('input', calculateTotal);
    });

    submitOrder.addEventListener('click', function() {
        const price = parseFloat(orderPrice.value);
        const quantity = parseFloat(orderQuantity.value);
        const total = parseFloat(totalCost.textContent.replace('$', ''));

        if (!price || !quantity) {
            alert('Please enter valid price and quantity');
            return;
        }

        const confirmation = confirm(
            `Confirm ${currentOrderType.toUpperCase()} order:\n` +
            `Asset: ${currentAsset}\n` +
            `Quantity: ${quantity}\n` +
            `Price: $${price.toLocaleString()}\n` +
            `Total: $${total.toLocaleString()}`
        );

        if (confirmation) {
            alert('Order placed successfully!');
            orderQuantity.value = '0.1';
            calculateTotal();
        }
    });

    if (canvas) {
        drawTradingChart(canvas);
    }

    calculateTotal();
}

function drawTradingChart(canvas) {
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    const dataPoints = 50;
    const basePrice = 47730;
    const priceData = [];
    
    for (let i = 0; i < dataPoints; i++) {
        const variation = (Math.random() - 0.5) * 2000;
        const price = basePrice + variation + (Math.sin(i / 10) * 1000);
        priceData.push(price);
    }

    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;
    
    for (let i = 0; i <= 10; i++) {
        const x = (width / 10) * i;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
    }
    
    for (let i = 0; i <= 5; i++) {
        const y = (height / 5) * i;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
    }

    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 2;
    ctx.beginPath();
    
    const minPrice = Math.min(...priceData);
    const maxPrice = Math.max(...priceData);
    const priceRange = maxPrice - minPrice;
    
    priceData.forEach((price, index) => {
        const x = (width / (dataPoints - 1)) * index;
        const y = height - ((price - minPrice) / priceRange) * height;
        
        if (index === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    });
    
    ctx.stroke();

    ctx.fillStyle = '#6b7280';
    ctx.font = '12px Inter';
    ctx.textAlign = 'right';
    
    for (let i = 0; i <= 5; i++) {
        const price = minPrice + (priceRange / 5) * i;
        const y = height - (height / 5) * i;
        ctx.fillText(`$${Math.round(price).toLocaleString()}`, width - 5, y - 5);
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeSearch();
    initializeTrading();
});