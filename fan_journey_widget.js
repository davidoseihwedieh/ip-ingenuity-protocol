document.addEventListener('DOMContentLoaded', function() {
    // Simulated fan data (replace with API call to Flask backend)
    const fanData = [
        { address: '0x123...', level: 1, progress: 20, subscriptionMonths: 2, tokensHeld: 10 },
        { address: '0x456...', level: 3, progress: 60, subscriptionMonths: 6, tokensHeld: 50 },
        { address: '0x789...', level: 5, progress: 100, subscriptionMonths: 12, tokensHeld: 100 }
    ];

    // Fan Journey Levels
    const levels = [
        { level: 1, name: 'Supporter', minTokens: 0, minMonths: 0 },
        { level: 2, name: 'Fan', minTokens: 20, minMonths: 3 },
        { level: 3, name: 'True Fan', minTokens: 40, minMonths: 6 },
        { level: 4, name: 'Patron', minTokens: 60, minMonths: 9 },
        { level: 5, name: 'Superfan', minTokens: 80, minMonths: 12 }
    ];

    // Render widget in the dashboard
    const widgetContainer = document.createElement('div');
    widgetContainer.className = 'fan-journey-widget';
    widgetContainer.innerHTML = `
        <h3>Fan Journey</h3>
        <div id="fan-list"></div>
    `;

    // Append to dashboard (adjust selector to match your HTML structure)
    document.querySelector('.dashboard-container').appendChild(widgetContainer);

    const fanList = document.getElementById('fan-list');
    fanData.forEach(fan => {
        const levelInfo = levels.find(l => l.level === fan.level);
        const progressBar = `
            <div class="fan-item">
                <p><strong>Address:</strong> ${fan.address}</p>
                <p><strong>Level:</strong> ${levelInfo.name} (Level ${fan.level})</p>
                <div class="progress-bar">
                    <div class="progress" style="width: ${fan.progress}%"></div>
                </div>
                <p><strong>Tokens Held:</strong> ${fan.tokensHeld} | <strong>Months Subscribed:</strong> ${fan.subscriptionMonths}</p>
            </div>
        `;
        fanList.innerHTML += progressBar;
    });
});

// Basic CSS for the widget (add to your existing CSS file or style tag)
const styles = `
.fan-journey-widget {
    background: #1a1a1a;
    padding: 20px;
    border-radius: 8px;
    margin-top: 20px;
}
.fan-item {
    margin-bottom: 15px;
}
.progress-bar {
    background: #333;
    height: 10px;
    border-radius: 5px;
    overflow: hidden;
}
.progress {
    background: #4caf50;
    height: 100%;
    transition: width 0.3s ease;
}
`;
const styleSheet = document.createElement('style');
styleSheet.textContent = styles;
document.head.appendChild(styleSheet);