// Risk Assessment Tool Functionality
function initializeRiskAssessment() {
    const categoryItems = document.querySelectorAll('.category-item');
    const riskPanels = document.querySelectorAll('.risk-panel');
    const calculateRiskBtn = document.getElementById('calculateRisk');
    const calcResults = document.getElementById('calcResults');

    // Category switching
    categoryItems.forEach(item => {
        item.addEventListener('click', function() {
            const category = this.dataset.category;
            
            // Update active category
            categoryItems.forEach(cat => cat.classList.remove('active'));
            this.classList.add('active');
            
            // Show corresponding panel
            riskPanels.forEach(panel => panel.classList.remove('active'));
            const targetPanel = document.getElementById(`${category}-panel`);
            if (targetPanel) {
                targetPanel.classList.add('active');
            }
            
            // Update overall risk score based on category
            updateOverallRiskScore(category);
        });
    });

    // Risk calculator
    if (calculateRiskBtn) {
        calculateRiskBtn.addEventListener('click', function() {
            calculateRiskProfile();
        });
    }

    // Initialize with portfolio risk
    updateOverallRiskScore('portfolio');
}

function updateOverallRiskScore(category) {
    const riskScoreValue = document.getElementById('overallRiskScore');
    const riskLevel = document.getElementById('riskLevel');
    
    // Risk scores for different categories
    const riskScores = {
        portfolio: { score: 7.2, level: 'Moderate Risk', class: 'moderate' },
        legal: { score: 4.1, level: 'Low Risk', class: 'low' },
        market: { score: 8.7, level: 'High Risk', class: 'high' },
        technical: { score: 6.8, level: 'Moderate Risk', class: 'moderate' },
        liquidity: { score: 6.5, level: 'Moderate Risk', class: 'moderate' }
    };
    
    const categoryRisk = riskScores[category] || riskScores.portfolio;
    
    // Animate score change
    animateScoreChange(riskScoreValue, categoryRisk.score);
    
    // Update risk level
    riskLevel.textContent = categoryRisk.level;
    riskLevel.className = `risk-level ${categoryRisk.class}`;
}

function animateScoreChange(element, targetScore) {
    const currentScore = parseFloat(element.textContent) || 0;
    const increment = (targetScore - currentScore) / 20;
    let currentValue = currentScore;
    
    const animation = setInterval(() => {
        currentValue += increment;
        
        if ((increment > 0 && currentValue >= targetScore) || 
            (increment < 0 && currentValue <= targetScore)) {
            currentValue = targetScore;
            clearInterval(animation);
        }
        
        element.textContent = currentValue.toFixed(1);
    }, 50);
}

function calculateRiskProfile() {
    const investmentAmount = parseFloat(document.getElementById('investmentAmount').value) || 10000;
    const timeHorizon = parseInt(document.getElementById('timeHorizon').value) || 5;
    const riskTolerance = document.getElementById('riskTolerance').value;
    const calcResults = document.getElementById('calcResults');
    
    // Risk tolerance multipliers
    const toleranceMultipliers = {
        conservative: { return: 0.7, risk: 0.6, allocation: '40% Patents, 60% Other' },
        moderate: { return: 1.0, risk: 1.0, allocation: '65% Patents, 35% Other' },
        aggressive: { return: 1.4, risk: 1.6, allocation: '85% Patents, 15% Other' }
    };
    
    const multiplier = toleranceMultipliers[riskTolerance] || toleranceMultipliers.moderate;
    
    // Calculate expected returns based on time horizon and risk tolerance
    const baseReturn = 15.5; // Base annual return percentage
    const expectedReturn = baseReturn * multiplier.return;
    const returnRange = expectedReturn * 0.3; // ±30% range
    
    const lowReturn = expectedReturn - returnRange;
    const highReturn = expectedReturn + returnRange;
    
    // Calculate maximum drawdown
    const baseDrawdown = 18.5; // Base drawdown percentage
    const maxDrawdown = baseDrawdown * multiplier.risk;
    
    // Update results
    const resultItems = calcResults.querySelectorAll('.calc-result-item');
    
    if (resultItems.length >= 3) {
        resultItems[0].querySelector('.calc-value').textContent = multiplier.allocation;
        resultItems[1].querySelector('.calc-value').textContent = `${lowReturn.toFixed(1)}% - ${highReturn.toFixed(1)}%`;
        resultItems[2].querySelector('.calc-value').textContent = `-${maxDrawdown.toFixed(1)}%`;
    }
    
    // Show results
    calcResults.classList.add('active');
    
    // Add animation effect
    calcResults.style.opacity = '0';
    calcResults.style.transform = 'translateY(10px)';
    
    setTimeout(() => {
        calcResults.style.transition = 'all 0.3s ease';
        calcResults.style.opacity = '1';
        calcResults.style.transform = 'translateY(0)';
    }, 100);
}

// Simulate real-time risk updates
function simulateRiskUpdates() {
    const riskMetrics = document.querySelectorAll('.metric-score');
    const alertList = document.querySelector('.alert-list');
    
    setInterval(() => {
        // Randomly update some risk metrics
        riskMetrics.forEach(metric => {
            if (Math.random() > 0.95) { // 5% chance of update
                const currentValue = parseFloat(metric.textContent);
                const change = (Math.random() - 0.5) * 0.4; // ±0.2 change
                const newValue = Math.max(0, Math.min(10, currentValue + change));
                
                // Animate the change
                metric.style.transition = 'all 0.3s ease';
                metric.textContent = newValue.toFixed(1);
                
                // Update color class if needed
                const oldClass = metric.className.split(' ').find(c => ['low', 'moderate', 'high'].includes(c));
                let newClass = 'moderate';
                
                if (newValue < 4) newClass = 'low';
                else if (newValue > 7) newClass = 'high';
                
                if (oldClass !== newClass) {
                    metric.classList.remove(oldClass);
                    metric.classList.add(newClass);
                }
                
                // Flash effect
                metric.style.background = '#dbeafe';
                setTimeout(() => {
                    metric.style.background = '';
                }, 1000);
            }
        });
        
        // Occasionally add new alerts
        if (Math.random() > 0.98 && alertList) { // 2% chance
            addNewRiskAlert(alertList);
        }
    }, 3000); // Check every 3 seconds
}

function addNewRiskAlert(alertList) {
    const alertTypes = [
        {
            level: 'moderate',
            icon: '⚠️',
            title: 'Volatility Spike Detected',
            description: 'Market volatility increased 8% in the last hour'
        },
        {
            level: 'low',
            icon: 'ℹ️',
            title: 'Diversification Opportunity',
            description: 'New biotech patents available for portfolio balance'
        },
        {
            level: 'high',
            icon: '🚨',
            title: 'Correlation Risk Alert',
            description: 'High correlation detected between quantum assets'
        }
    ];
    
    const randomAlert = alertTypes[Math.floor(Math.random() * alertTypes.length)];
    
    const alertElement = document.createElement('div');
    alertElement.className = `alert-item ${randomAlert.level}`;
    alertElement.innerHTML = `
        <span class="alert-icon">${randomAlert.icon}</span>
        <div class="alert-content">
            <div class="alert-title">${randomAlert.title}</div>
            <div class="alert-description">${randomAlert.description}</div>
        </div>
    `;
    
    // Add with animation
    alertElement.style.opacity = '0';
    alertElement.style.transform = 'translateX(-20px)';
    alertList.insertBefore(alertElement, alertList.firstChild);
    
    setTimeout(() => {
        alertElement.style.transition = 'all 0.3s ease';
        alertElement.style.opacity = '1';
        alertElement.style.transform = 'translateX(0)';
    }, 100);
    
    // Remove oldest alert if more than 5
    const alerts = alertList.querySelectorAll('.alert-item');
    if (alerts.length > 5) {
        const oldestAlert = alerts[alerts.length - 1];
        oldestAlert.style.transition = 'all 0.3s ease';
        oldestAlert.style.opacity = '0';
        oldestAlert.style.transform = 'translateX(20px)';
        
        setTimeout(() => {
            if (oldestAlert.parentNode) {
                oldestAlert.parentNode.removeChild(oldestAlert);
            }
        }, 300);
    }
}

// Stress testing visualization
function updateStressTestResults() {
    const scenarios = document.querySelectorAll('.scenario-item');
    
    scenarios.forEach(scenario => {
        const fillElement = scenario.querySelector('.scenario-fill');
        const impactElement = scenario.querySelector('.scenario-impact');
        
        if (fillElement && impactElement) {
            // Add pulse animation on update
            fillElement.style.animation = 'pulse 0.5s ease-in-out';
            impactElement.style.animation = 'pulse 0.5s ease-in-out';
            
            setTimeout(() => {
                fillElement.style.animation = '';
                impactElement.style.animation = '';
            }, 500);
        }
    });
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeRiskAssessment();
    simulateRiskUpdates();
    
    // Update stress test results periodically
    setInterval(updateStressTestResults, 10000); // Every 10 seconds
});

// Add CSS animation for pulse effect
const style = document.createElement('style');
style.textContent = `
    @keyframes pulse {
        0% { transform: scale(1); }
        50% { transform: scale(1.05); }
        100% { transform: scale(1); }
    }
    
    .risk-metric:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        transition: all 0.3s ease;
    }
    
    .category-item:hover .category-icon {
        transform: scale(1.1);
        transition: transform 0.2s ease;
    }
    
    .alert-item {
        transition: all 0.3s ease;
    }
    
    .alert-item:hover {
        transform: translateX(5px);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }
`;
document.head.appendChild(style);