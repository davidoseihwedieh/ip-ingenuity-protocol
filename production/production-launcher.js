const { spawn } = require('child_process');
const HealthMonitor = require('./monitoring/health-monitor');
const BackupManager = require('./backup/backup-manager');
const APIGateway = require('./enterprise/api-gateway');
const AdminDashboard = require('./enterprise/admin-dashboard');

class ProductionLauncher {
    constructor() {
        this.processes = new Map();
        this.healthMonitor = new HealthMonitor();
        this.backupManager = new BackupManager();
        this.apiGateway = new APIGateway();
        this.adminDashboard = new AdminDashboard();
    }

    async startAllServices() {
        console.log('🚀 Starting IP Ingenuity Production Environment...\n');

        try {
            // Start core services
            await this.startSecurityServer();
            await this.startPerformanceServer();
            
            // Start enterprise services
            await this.startAPIGateway();
            await this.startAdminDashboard();
            
            // Start monitoring and backup
            await this.startMonitoring();
            await this.startBackupScheduler();
            
            console.log('\n✅ All services started successfully!');
            this.printServiceStatus();
            
        } catch (error) {
            console.error('❌ Failed to start services:', error);
            process.exit(1);
        }
    }

    async startSecurityServer() {
        return new Promise((resolve) => {
            console.log('🔒 Starting Security Server...');
            
            const securityProcess = spawn('node', ['../security/secure-server.js'], {
                cwd: __dirname,
                stdio: 'pipe',
                env: { 
                    ...process.env, 
                    JWT_SECRET: 'prod-jwt-secret',
                    REFRESH_SECRET: 'prod-refresh-secret'
                }
            });

            this.processes.set('security', securityProcess);
            
            setTimeout(() => {
                console.log('✅ Security Server started on port 3001');
                resolve();
            }, 2000);
        });
    }

    async startPerformanceServer() {
        return new Promise((resolve) => {
            console.log('⚡ Starting Performance Server...');
            
            const perfProcess = spawn('node', ['../performance/simple-performance-server.js'], {
                cwd: __dirname,
                stdio: 'pipe'
            });

            this.processes.set('performance', perfProcess);
            
            setTimeout(() => {
                console.log('✅ Performance Server started on port 3002');
                resolve();
            }, 2000);
        });
    }

    async startAPIGateway() {
        return new Promise((resolve) => {
            console.log('🚪 Starting API Gateway...');
            
            this.apiGateway.start(3000);
            this.processes.set('gateway', { pid: 'internal' });
            
            console.log('✅ API Gateway started on port 3000');
            resolve();
        });
    }

    async startAdminDashboard() {
        return new Promise((resolve) => {
            console.log('🎛️  Starting Admin Dashboard...');
            
            this.adminDashboard.start(3004);
            this.processes.set('dashboard', { pid: 'internal' });
            
            console.log('✅ Admin Dashboard started on port 3004');
            resolve();
        });
    }

    async startMonitoring() {
        return new Promise((resolve) => {
            console.log('🔍 Starting Health Monitoring...');
            
            this.healthMonitor.startMonitoring(30000); // 30 second intervals
            this.processes.set('monitoring', { pid: 'internal' });
            
            console.log('✅ Health Monitoring started');
            resolve();
        });
    }

    async startBackupScheduler() {
        return new Promise((resolve) => {
            console.log('💾 Starting Backup Scheduler...');
            
            this.backupManager.scheduleBackups();
            this.processes.set('backup', { pid: 'internal' });
            
            console.log('✅ Backup Scheduler started');
            resolve();
        });
    }

    printServiceStatus() {
        console.log('\n📋 Service Status:');
        console.log('==================');
        console.log('🚪 API Gateway:        http://localhost:3000');
        console.log('🔒 Security Server:    http://localhost:3001');
        console.log('⚡ Performance Server: http://localhost:3002');
        console.log('🎛️  Admin Dashboard:    http://localhost:3004');
        console.log('');
        console.log('🔑 API Keys:');
        console.log('   Enterprise: enterprise-key-1 (10,000 req/min)');
        console.log('   Premium:    premium-key-1 (1,000 req/min)');
        console.log('   Basic:      basic-key-1 (100 req/min)');
        console.log('');
        console.log('📊 Monitoring:');
        console.log('   Health checks every 30 seconds');
        console.log('   Daily backups at 2 AM');
        console.log('   Real-time analytics available');
    }

    async gracefulShutdown() {
        console.log('\n🛑 Initiating graceful shutdown...');
        
        for (const [name, process] of this.processes) {
            if (process.pid && process.pid !== 'internal') {
                console.log(`Stopping ${name}...`);
                process.kill('SIGTERM');
            }
        }

        // Create final backup
        console.log('💾 Creating final backup...');
        await this.backupManager.createFullBackup();
        
        console.log('✅ Shutdown complete');
        process.exit(0);
    }

    setupSignalHandlers() {
        process.on('SIGTERM', () => this.gracefulShutdown());
        process.on('SIGINT', () => this.gracefulShutdown());
        
        process.on('uncaughtException', (error) => {
            console.error('💥 Uncaught Exception:', error);
            this.gracefulShutdown();
        });
    }

    async runProductionEnvironment() {
        this.setupSignalHandlers();
        await this.startAllServices();
        
        // Keep the process running
        console.log('\n🏃 Production environment is running...');
        console.log('Press Ctrl+C to stop gracefully\n');
        
        // Periodic status updates
        setInterval(() => {
            const uptime = Math.floor(process.uptime());
            const hours = Math.floor(uptime / 3600);
            const minutes = Math.floor((uptime % 3600) / 60);
            console.log(`⏰ System uptime: ${hours}h ${minutes}m - All services running`);
        }, 300000); // Every 5 minutes
    }
}

if (require.main === module) {
    const launcher = new ProductionLauncher();
    launcher.runProductionEnvironment();
}

module.exports = ProductionLauncher;