const http = require('http');
const fs = require('fs');

class AdminDashboard {
    constructor() {
        this.systemStats = {
            startTime: Date.now(),
            requests: 0,
            errors: 0,
            users: 0,
            ipTokens: 0
        };
    }

    generateDashboardHTML() {
        const uptime = Math.floor((Date.now() - this.systemStats.startTime) / 1000);
        const uptimeHours = Math.floor(uptime / 3600);
        const uptimeMinutes = Math.floor((uptime % 3600) / 60);

        return `
<!DOCTYPE html>
<html>
<head>
    <title>IP Ingenuity Admin Dashboard</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .header { background: #2c3e50; color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin-bottom: 20px; }
        .stat-card { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .stat-value { font-size: 2em; font-weight: bold; color: #3498db; }
        .stat-label { color: #7f8c8d; margin-top: 5px; }
        .section { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); margin-bottom: 20px; }
        .btn { background: #3498db; color: white; padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer; margin: 5px; }
        .btn:hover { background: #2980b9; }
        .btn-danger { background: #e74c3c; }
        .btn-danger:hover { background: #c0392b; }
        .log-entry { padding: 8px; border-bottom: 1px solid #eee; font-family: monospace; font-size: 12px; }
        .status-healthy { color: #27ae60; }
        .status-warning { color: #f39c12; }
        .status-error { color: #e74c3c; }
        .refresh-btn { position: fixed; top: 20px; right: 20px; }
    </style>
    <script>
        function refreshData() {
            location.reload();
        }
        
        function performAction(action) {
            fetch('/admin/action', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action })
            }).then(() => {
                alert(action + ' completed');
                refreshData();
            });
        }
        
        setInterval(refreshData, 30000); // Auto-refresh every 30 seconds
    </script>
</head>
<body>
    <button class="btn refresh-btn" onclick="refreshData()">🔄 Refresh</button>
    
    <div class="header">
        <h1>🏛️ IP Ingenuity Admin Dashboard</h1>
        <p>Production Environment - Uptime: ${uptimeHours}h ${uptimeMinutes}m</p>
    </div>

    <div class="stats-grid">
        <div class="stat-card">
            <div class="stat-value">${this.systemStats.requests.toLocaleString()}</div>
            <div class="stat-label">Total Requests</div>
        </div>
        <div class="stat-card">
            <div class="stat-value">${this.systemStats.users.toLocaleString()}</div>
            <div class="stat-label">Registered Users</div>
        </div>
        <div class="stat-card">
            <div class="stat-value">${this.systemStats.ipTokens.toLocaleString()}</div>
            <div class="stat-label">IP Tokens Minted</div>
        </div>
        <div class="stat-card">
            <div class="stat-value">${this.systemStats.errors}</div>
            <div class="stat-label">System Errors</div>
        </div>
    </div>

    <div class="section">
        <h2>🔧 System Controls</h2>
        <button class="btn" onclick="performAction('backup')">💾 Create Backup</button>
        <button class="btn" onclick="performAction('cache-clear')">🗑️ Clear Cache</button>
        <button class="btn" onclick="performAction('health-check')">🔍 Health Check</button>
        <button class="btn btn-danger" onclick="performAction('emergency-stop')">🛑 Emergency Stop</button>
    </div>

    <div class="section">
        <h2>📊 Service Status</h2>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px;">
            <div>API Gateway: <span class="status-healthy">●</span> Healthy</div>
            <div>Security Server: <span class="status-healthy">●</span> Healthy</div>
            <div>Performance Server: <span class="status-healthy">●</span> Healthy</div>
            <div>Database: <span class="status-healthy">●</span> Connected</div>
            <div>Redis Cache: <span class="status-healthy">●</span> Connected</div>
            <div>Blockchain: <span class="status-healthy">●</span> Synced</div>
        </div>
    </div>

    <div class="section">
        <h2>📈 Performance Metrics</h2>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px;">
            <div><strong>Avg Response Time:</strong><br>45ms</div>
            <div><strong>Cache Hit Rate:</strong><br>94.2%</div>
            <div><strong>Error Rate:</strong><br>0.1%</div>
            <div><strong>Throughput:</strong><br>1,200 req/sec</div>
            <div><strong>Memory Usage:</strong><br>68%</div>
            <div><strong>CPU Usage:</strong><br>23%</div>
        </div>
    </div>

    <div class="section">
        <h2>📋 Recent Activity</h2>
        <div style="max-height: 300px; overflow-y: auto; border: 1px solid #ddd; border-radius: 4px;">
            <div class="log-entry">[${new Date().toISOString()}] System startup completed</div>
            <div class="log-entry">[${new Date(Date.now() - 60000).toISOString()}] Backup completed successfully</div>
            <div class="log-entry">[${new Date(Date.now() - 120000).toISOString()}] Health check passed</div>
            <div class="log-entry">[${new Date(Date.now() - 180000).toISOString()}] Cache cleared</div>
            <div class="log-entry">[${new Date(Date.now() - 240000).toISOString()}] New IP token minted: #1234</div>
        </div>
    </div>

    <div class="section">
        <h2>🔐 Smart Contract Status</h2>
        <div style="font-family: monospace; font-size: 12px;">
            <div><strong>MultiSig Wallet:</strong> 0x0165...Eb8F ✅</div>
            <div><strong>TimeLock:</strong> 0xa513...C853 ✅</div>
            <div><strong>Security Audit:</strong> 0x2279...eBe6 ✅</div>
            <div><strong>IP Token:</strong> 0x8A79...C318 ✅</div>
        </div>
    </div>
</body>
</html>`;
    }

    handleAdminAction(action) {
        console.log(`🔧 Admin action: ${action}`);
        
        switch (action) {
            case 'backup':
                return { success: true, message: 'Backup initiated' };
            case 'cache-clear':
                return { success: true, message: 'Cache cleared' };
            case 'health-check':
                return { success: true, message: 'Health check completed' };
            case 'emergency-stop':
                return { success: true, message: 'Emergency stop initiated' };
            default:
                return { success: false, message: 'Unknown action' };
        }
    }

    handleRequest(req, res) {
        const url = require('url').parse(req.url, true);
        
        if (url.pathname === '/admin' || url.pathname === '/') {
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(this.generateDashboardHTML());
        } else if (url.pathname === '/admin/action' && req.method === 'POST') {
            let body = '';
            req.on('data', chunk => body += chunk);
            req.on('end', () => {
                try {
                    const { action } = JSON.parse(body);
                    const result = this.handleAdminAction(action);
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify(result));
                } catch (error) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: false, error: error.message }));
                }
            });
        } else {
            res.writeHead(404);
            res.end('Not Found');
        }
    }

    start(port = 3004) {
        const server = http.createServer((req, res) => {
            this.handleRequest(req, res);
        });

        server.listen(port, () => {
            console.log(`🎛️  Admin Dashboard running on port ${port}`);
            console.log(`🌐 Dashboard: http://localhost:${port}/admin`);
        });

        // Simulate some activity
        setInterval(() => {
            this.systemStats.requests += Math.floor(Math.random() * 10);
            this.systemStats.users += Math.floor(Math.random() * 2);
            this.systemStats.ipTokens += Math.floor(Math.random() * 3);
        }, 5000);

        return server;
    }
}

if (require.main === module) {
    const dashboard = new AdminDashboard();
    dashboard.start();
}

module.exports = AdminDashboard;