const cluster = require('cluster');
const os = require('os');
const HighPerformanceServer = require('./api/high-performance-server');

class LoadBalancer {
    constructor() {
        this.numCPUs = os.cpus().length;
        this.workers = new Map();
    }

    start() {
        if (cluster.isMaster) {
            console.log(`🔄 Master process ${process.pid} starting...`);
            console.log(`🖥️  Spawning ${this.numCPUs} worker processes`);

            // Fork workers
            for (let i = 0; i < this.numCPUs; i++) {
                this.forkWorker();
            }

            // Handle worker exit
            cluster.on('exit', (worker, code, signal) => {
                console.log(`💀 Worker ${worker.process.pid} died (${signal || code})`);
                this.workers.delete(worker.id);
                
                if (!worker.exitedAfterDisconnect) {
                    console.log('🔄 Restarting worker...');
                    this.forkWorker();
                }
            });

            // Graceful shutdown
            process.on('SIGTERM', () => this.shutdown());
            process.on('SIGINT', () => this.shutdown());

            console.log('✅ Load balancer started successfully');
        } else {
            // Worker process
            this.startWorker();
        }
    }

    forkWorker() {
        const worker = cluster.fork();
        this.workers.set(worker.id, {
            worker,
            startTime: Date.now(),
            requests: 0
        });

        worker.on('message', (msg) => {
            if (msg.type === 'request') {
                this.workers.get(worker.id).requests++;
            }
        });
    }

    async startWorker() {
        const server = new HighPerformanceServer();
        const port = 3002 + cluster.worker.id;
        
        try {
            await server.start(port);
            console.log(`👷 Worker ${process.pid} started on port ${port}`);
            
            // Report requests to master
            setInterval(() => {
                process.send({ type: 'request' });
            }, 1000);
            
        } catch (error) {
            console.error(`Worker ${process.pid} failed to start:`, error);
            process.exit(1);
        }
    }

    async shutdown() {
        console.log('🛑 Shutting down load balancer...');
        
        for (const [id, workerInfo] of this.workers) {
            workerInfo.worker.disconnect();
        }

        setTimeout(() => {
            for (const [id, workerInfo] of this.workers) {
                workerInfo.worker.kill();
            }
            process.exit(0);
        }, 5000);
    }

    getStats() {
        const stats = {
            master: process.pid,
            workers: [],
            totalRequests: 0
        };

        for (const [id, workerInfo] of this.workers) {
            const workerStats = {
                id,
                pid: workerInfo.worker.process.pid,
                uptime: Date.now() - workerInfo.startTime,
                requests: workerInfo.requests
            };
            stats.workers.push(workerStats);
            stats.totalRequests += workerInfo.requests;
        }

        return stats;
    }
}

// Start if called directly
if (require.main === module) {
    const balancer = new LoadBalancer();
    balancer.start();
}

module.exports = LoadBalancer;