const http = require('http');
const fs = require('fs');

class HealthMonitor {
    constructor() {
        this.checks = new Map();
        this.alerts = [];
        this.thresholds = {
            responseTime: 1000,
            errorRate: 0.05,
            memoryUsage: 0.8,
            diskUsage: 0.9
        };
    }

    async checkEndpoint(name, url) {
        const start = Date.now();
        
        return new Promise((resolve) => {
            http.get(url, (res) => {
                const duration = Date.now() - start;
                const healthy = res.statusCode === 200 && duration < this.thresholds.responseTime;
                
                resolve({
                    name,
                    healthy,
                    statusCode: res.statusCode,
                    responseTime: duration,
                    timestamp: Date.now()
                });
            }).on('error', () => {
                resolve({
                    name,
                    healthy: false,
                    error: 'Connection failed',
                    timestamp: Date.now()
                });
            });
        });
    }

    async checkSystemHealth() {
        const mem = process.memoryUsage();
        const memUsage = mem.heapUsed / mem.heapTotal;
        
        return {
            memory: {
                usage: memUsage,
                healthy: memUsage < this.thresholds.memoryUsage,
                heapUsed: Math.round(mem.heapUsed / 1024 / 1024),
                heapTotal: Math.round(mem.heapTotal / 1024 / 1024)
            },
            uptime: process.uptime(),
            pid: process.pid,
            timestamp: Date.now()
        };
    }

    async runHealthChecks() {
        const endpoints = [
            { name: 'API Server', url: 'http://localhost:3002/health' },
            { name: 'Security Server', url: 'http://localhost:3001/health' },
            { name: 'Performance Server', url: 'http://localhost:3002/metrics' }
        ];

        const endpointChecks = await Promise.all(
            endpoints.map(ep => this.checkEndpoint(ep.name, ep.url))
        );

        const systemHealth = await this.checkSystemHealth();

        const report = {
            overall: endpointChecks.every(c => c.healthy) && systemHealth.memory.healthy,
            endpoints: endpointChecks,
            system: systemHealth,
            timestamp: Date.now()
        };

        this.logHealthReport(report);
        this.checkAlerts(report);

        return report;
    }

    logHealthReport(report) {
        const logEntry = {
            timestamp: new Date().toISOString(),
            status: report.overall ? 'HEALTHY' : 'UNHEALTHY',
            endpoints: report.endpoints.length,
            healthyEndpoints: report.endpoints.filter(e => e.healthy).length,
            memoryUsage: report.system.memory.usage
        };

        console.log(`[${logEntry.timestamp}] ${logEntry.status} - ${logEntry.healthyEndpoints}/${logEntry.endpoints} endpoints healthy`);
        
        // Write to log file
        fs.appendFileSync('/tmp/health.log', JSON.stringify(logEntry) + '\n');
    }

    checkAlerts(report) {
        if (!report.overall) {
            this.sendAlert('CRITICAL', 'System health check failed', report);
        }

        report.endpoints.forEach(endpoint => {
            if (!endpoint.healthy) {
                this.sendAlert('WARNING', `Endpoint ${endpoint.name} is unhealthy`, endpoint);
            }
        });

        if (report.system.memory.usage > this.thresholds.memoryUsage) {
            this.sendAlert('WARNING', 'High memory usage detected', report.system.memory);
        }
    }

    sendAlert(level, message, data) {
        const alert = {
            level,
            message,
            data,
            timestamp: Date.now()
        };

        this.alerts.push(alert);
        console.log(`🚨 ${level}: ${message}`);

        // Keep only last 100 alerts
        if (this.alerts.length > 100) {
            this.alerts = this.alerts.slice(-100);
        }
    }

    startMonitoring(interval = 30000) {
        console.log('🔍 Starting health monitoring...');
        
        setInterval(async () => {
            await this.runHealthChecks();
        }, interval);

        // Initial check
        this.runHealthChecks();
    }

    getStatus() {
        return {
            alerts: this.alerts.slice(-10),
            thresholds: this.thresholds,
            lastCheck: this.lastCheck
        };
    }
}

if (require.main === module) {
    const monitor = new HealthMonitor();
    monitor.startMonitoring();
}

module.exports = HealthMonitor;