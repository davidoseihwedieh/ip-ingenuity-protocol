// Platform JavaScript functionality

// AI Valuation Calculator
document.addEventListener('DOMContentLoaded', function() {
    const valuationForm = document.getElementById('valuationForm');
    const strengthSlider = document.getElementById('patentStrength');
    const strengthValue = document.getElementById('strengthValue');
    const resultsContainer = document.getElementById('valuationResults');

    // Update strength value display
    if (strengthSlider && strengthValue) {
        strengthSlider.addEventListener('input', function() {
            strengthValue.textContent = this.value;
        });
    }

    // Handle valuation form submission
    if (valuationForm) {
        valuationForm.addEventListener('submit', function(e) {
            e.preventDefault();
            calculateValuation();
        });
    }

    function calculateValuation() {
        const formData = new FormData(valuationForm);
        const ipType = document.getElementById('ipType').value;
        const sector = document.getElementById('sector').value;
        const marketSize = document.getElementById('marketSize').value;
        const stage = document.getElementById('stage').value;
        const strength = parseInt(document.getElementById('patentStrength').value);

        // Simulate AI calculation with realistic factors
        const baseValues = {
            'patent': 500000,
            'trademark': 150000,
            'copyright': 75000,
            'trade-secret': 300000
        };

        const sectorMultipliers = {
            'ai-ml': 2.5,
            'biotech': 3.0,
            'fintech': 2.0,
            'quantum': 4.0,
            'renewable': 1.8,
            'automotive': 1.5
        };

        const marketMultipliers = {
            'small': 0.5,
            'medium': 1.0,
            'large': 2.0,
            'massive': 4.0
        };

        const stageMultipliers = {
            'concept': 0.3,
            'prototype': 0.6,
            'testing': 0.8,
            'commercial': 1.2,
            'market': 1.5
        };

        // Calculate base valuation
        let baseValue = baseValues[ipType] || 250000;
        let sectorMultiplier = sectorMultipliers[sector] || 1.0;
        let marketMultiplier = marketMultipliers[marketSize] || 1.0;
        let stageMultiplier = stageMultipliers[stage] || 1.0;
        let strengthMultiplier = strength / 5.0;

        let estimatedValue = baseValue * sectorMultiplier * marketMultiplier * stageMultiplier * strengthMultiplier;
        
        // Add some randomness for realism
        let variance = 0.8 + (Math.random() * 0.4); // 0.8 to 1.2
        estimatedValue *= variance;

        let lowEstimate = estimatedValue * 0.7;
        let highEstimate = estimatedValue * 1.4;

        // Calculate confidence score
        let confidence = Math.min(95, 60 + (strength * 3) + (stageMultiplier * 20));

        displayResults(lowEstimate, highEstimate, confidence, {
            ipType, sector, marketSize, stage, strength
        });
    }

    function displayResults(low, high, confidence, factors) {
        const resultsHTML = `
            <h3>AI Valuation Analysis</h3>
            <div class="valuation-output active">
                <div class="valuation-range">
                    <h4>Estimated Valuation Range</h4>
                    <div class="range-values">
                        <span>$${formatNumber(low)}</span>
                        <span>-</span>
                        <span>$${formatNumber(high)}</span>
                    </div>
                </div>
                
                <div class="confidence-score">
                    <div class="score">${confidence.toFixed(0)}%</div>
                    <p>Confidence Level</p>
                </div>

                <h4>Key Factors Analysis</h4>
                <ul class="factors-list">
                    <li>
                        <span>Technology Sector</span>
                        <span class="factor-impact ${getSectorImpact(factors.sector)}">${getSectorLabel(factors.sector)}</span>
                    </li>
                    <li>
                        <span>Market Size</span>
                        <span class="factor-impact ${getMarketImpact(factors.marketSize)}">${getMarketLabel(factors.marketSize)}</span>
                    </li>
                    <li>
                        <span>Development Stage</span>
                        <span class="factor-impact ${getStageImpact(factors.stage)}">${getStageLabel(factors.stage)}</span>
                    </li>
                    <li>
                        <span>Patent Strength</span>
                        <span class="factor-impact ${getStrengthImpact(factors.strength)}">${factors.strength}/10</span>
                    </li>
                </ul>

                <div style="margin-top: 20px; padding: 15px; background: #f3f4f6; border-radius: 8px; font-size: 0.875rem; color: #6b7280;">
                    <strong>Disclaimer:</strong> This is an AI-generated estimate based on available data. Actual valuations may vary significantly based on additional factors not captured in this analysis.
                </div>
            </div>
        `;

        resultsContainer.innerHTML = resultsHTML;
    }

    function formatNumber(num) {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        } else if (num >= 1000) {
            return (num / 1000).toFixed(0) + 'K';
        } else {
            return num.toFixed(0);
        }
    }

    function getSectorImpact(sector) {
        const impacts = {
            'quantum': 'positive',
            'ai-ml': 'positive',
            'biotech': 'positive',
            'fintech': 'neutral',
            'renewable': 'neutral',
            'automotive': 'neutral'
        };
        return impacts[sector] || 'neutral';
    }

    function getSectorLabel(sector) {
        const labels = {
            'quantum': 'High Growth',
            'ai-ml': 'High Demand',
            'biotech': 'Premium Value',
            'fintech': 'Stable Market',
            'renewable': 'Growing Market',
            'automotive': 'Mature Market'
        };
        return labels[sector] || 'Standard';
    }

    function getMarketImpact(size) {
        return size === 'massive' || size === 'large' ? 'positive' : 
               size === 'medium' ? 'neutral' : 'negative';
    }

    function getMarketLabel(size) {
        const labels = {
            'massive': 'Huge Opportunity',
            'large': 'Large Market',
            'medium': 'Medium Market',
            'small': 'Niche Market'
        };
        return labels[size] || 'Unknown';
    }

    function getStageImpact(stage) {
        return stage === 'market' || stage === 'commercial' ? 'positive' :
               stage === 'testing' ? 'neutral' : 'negative';
    }

    function getStageLabel(stage) {
        const labels = {
            'market': 'Revenue Generating',
            'commercial': 'Ready to Launch',
            'testing': 'Validation Phase',
            'prototype': 'Early Stage',
            'concept': 'Conceptual'
        };
        return labels[stage] || 'Unknown';
    }

    function getStrengthImpact(strength) {
        return strength >= 7 ? 'positive' : strength >= 4 ? 'neutral' : 'negative';
    }

    // Portfolio Chart (Simple implementation)
    const canvas = document.getElementById('portfolioChart');
    if (canvas) {
        drawPortfolioChart(canvas);
    }

    function drawPortfolioChart(canvas) {
        const ctx = canvas.getContext('2d');
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const radius = 100;

        // Portfolio data
        const data = [
            { label: 'Patents', value: 65, color: '#3b82f6' },
            { label: 'Trademarks', value: 20, color: '#10b981' },
            { label: 'Copyrights', value: 10, color: '#f59e0b' },
            { label: 'Trade Secrets', value: 5, color: '#ef4444' }
        ];

        let currentAngle = -Math.PI / 2;

        data.forEach(segment => {
            const sliceAngle = (segment.value / 100) * 2 * Math.PI;

            // Draw slice
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
            ctx.closePath();
            ctx.fillStyle = segment.color;
            ctx.fill();

            // Draw label
            const labelAngle = currentAngle + sliceAngle / 2;
            const labelX = centerX + Math.cos(labelAngle) * (radius + 30);
            const labelY = centerY + Math.sin(labelAngle) * (radius + 30);

            ctx.fillStyle = '#374151';
            ctx.font = '12px Inter';
            ctx.textAlign = 'center';
            ctx.fillText(segment.label, labelX, labelY);
            ctx.fillText(segment.value + '%', labelX, labelY + 15);

            currentAngle += sliceAngle;
        });
    }

    // Smooth scrolling for navigation
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', function(e) {
            if (this.getAttribute('href').startsWith('#')) {
                e.preventDefault();
                const target = document.querySelector(this.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({ behavior: 'smooth' });
                    
                    // Update active nav link
                    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
                    this.classList.add('active');
                }
            }
        });
    });

    // Asset card interactions
    document.querySelectorAll('.asset-card').forEach(card => {
        card.addEventListener('click', function() {
            // Add click animation
            this.style.transform = 'scale(0.98)';
            setTimeout(() => {
                this.style.transform = '';
            }, 150);
        });
    });

    // Real-time updates simulation
    function simulateRealTimeUpdates() {
        const priceElements = document.querySelectorAll('.metric-value, .asset-value');
        
        setInterval(() => {
            priceElements.forEach(element => {
                if (element.textContent.includes('$') && Math.random() > 0.7) {
                    // Simulate small price changes
                    const currentValue = parseFloat(element.textContent.replace(/[$,]/g, ''));
                    const change = (Math.random() - 0.5) * 0.02; // ±1% change
                    const newValue = currentValue * (1 + change);
                    
                    if (element.textContent.includes('M')) {
                        element.textContent = '$' + (newValue / 1000000).toFixed(2) + 'M';
                    } else if (element.textContent.includes('K')) {
                        element.textContent = '$' + (newValue / 1000).toFixed(0) + 'K';
                    } else {
                        element.textContent = '$' + newValue.toFixed(2);
                    }
                    
                    // Add flash effect
                    element.style.background = change > 0 ? '#dcfce7' : '#fef2f2';
                    setTimeout(() => {
                        element.style.background = '';
                    }, 1000);
                }
            });
        }, 5000); // Update every 5 seconds
    }

    // Start real-time updates
    simulateRealTimeUpdates();
});