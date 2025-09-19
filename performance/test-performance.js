const autocannon = require('autocannon');
const HighPerformanceServer = require('./api/high-performance-server');
const BatchProcessor = require('./batch-processor');

class PerformanceTester {
    constructor() {
        this.server = null;
        this.batchProcessor = new BatchProcessor();
    }

    async startServer() {
        this.server = new HighPerformanceServer();
        await this.server.start(3003);
        console.log('🚀 Test server started on port 3003');
    }

    async stopServer() {
        if (this.server) {
            await this.server.stop();
            console.log('🛑 Test server stopped');
        }
    }

    async testAPIPerformance() {
        console.log('\n🔥 Testing API Performance...');

        const tests = [
            {
                name: 'Health Check',
                url: 'http://localhost:3003/health',
                connections: 100,
                duration: 10
            },
            {
                name: 'Search Endpoint',
                url: 'http://localhost:3003/api/search?q=patent',
                connections: 50,
                duration: 10
            },
            {
                name: 'Portfolio Endpoint',
                url: 'http://localhost:3003/api/portfolio/user123',
                connections: 30,
                duration: 10
            }
        ];

        for (const test of tests) {
            console.log(`\n📊 Testing ${test.name}...`);
            
            const result = await autocannon({
                url: test.url,
                connections: test.connections,
                duration: test.duration,
                pipelining: 1
            });

            console.log(`✅ ${test.name} Results:`);
            console.log(`   Requests/sec: ${result.requests.average}`);
            console.log(`   Latency avg: ${result.latency.average}ms`);
            console.log(`   Throughput: ${result.throughput.average} bytes/sec`);
            console.log(`   Errors: ${result.errors}`);
        }
    }

    async testBatchProcessing() {
        console.log('\n⚡ Testing Batch Processing...');

        const startTime = Date.now();
        
        // Test valuation batching
        const valuationPromises = Array.from({ length: 250 }, (_, i) => 
            this.batchProcessor.addToBatch('valuations', { 
                tokenId: `token_${i}`,
                title: `IP Token ${i}`,
                type: 'Patent'
            })
        );

        // Test search batching
        const searchPromises = Array.from({ length: 100 }, (_, i) => 
            this.batchProcessor.addToBatch('searches', { 
                query: `search query ${i}`,
                userId: `user_${i}`
            })
        );

        console.log('📤 Submitted 350 batch operations...');

        const [valuationResults, searchResults] = await Promise.all([
            Promise.all(valuationPromises),
            Promise.all(searchPromises)
        ]);

        const endTime = Date.now();
        const duration = endTime - startTime;

        console.log(`✅ Batch Processing Results:`);
        console.log(`   Total operations: 350`);
        console.log(`   Duration: ${duration}ms`);
        console.log(`   Operations/sec: ${Math.round(350 / (duration / 1000))}`);
        console.log(`   Successful valuations: ${valuationResults.filter(r => r.success).length}`);
        console.log(`   Successful searches: ${searchResults.filter(r => r.success).length}`);
    }

    async testMemoryUsage() {
        console.log('\n🧠 Testing Memory Usage...');

        const initialMemory = process.memoryUsage();
        console.log('Initial memory usage:', {
            rss: Math.round(initialMemory.rss / 1024 / 1024) + 'MB',
            heapUsed: Math.round(initialMemory.heapUsed / 1024 / 1024) + 'MB'
        });

        // Simulate heavy load
        const operations = Array.from({ length: 1000 }, (_, i) => 
            this.batchProcessor.addToBatch('valuations', { 
                tokenId: `stress_${i}`,
                data: new Array(1000).fill(`data_${i}`)
            })
        );

        await Promise.all(operations);

        const finalMemory = process.memoryUsage();
        console.log('Final memory usage:', {
            rss: Math.round(finalMemory.rss / 1024 / 1024) + 'MB',
            heapUsed: Math.round(finalMemory.heapUsed / 1024 / 1024) + 'MB'
        });

        const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
        console.log(`Memory increase: ${Math.round(memoryIncrease / 1024 / 1024)}MB`);
    }

    async runAllTests() {
        try {
            await this.startServer();
            
            await this.testAPIPerformance();
            await this.testBatchProcessing();
            await this.testMemoryUsage();
            
            console.log('\n🎉 All performance tests completed!');
            
        } catch (error) {
            console.error('❌ Performance test failed:', error);
        } finally {
            await this.stopServer();
        }
    }
}

// Run tests if called directly
if (require.main === module) {
    const tester = new PerformanceTester();
    tester.runAllTests();
}

module.exports = PerformanceTester;