const http = require('http');

class SimpleLoadTester {
    constructor(baseUrl = 'http://localhost:3002') {
        this.baseUrl = baseUrl;
    }

    async makeRequest(path) {
        return new Promise((resolve, reject) => {
            const start = Date.now();
            
            http.get(`${this.baseUrl}${path}`, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    const duration = Date.now() - start;
                    resolve({ 
                        status: res.statusCode, 
                        duration, 
                        size: data.length,
                        success: res.statusCode === 200
                    });
                });
            }).on('error', reject);
        });
    }

    async runConcurrentRequests(path, concurrency, totalRequests) {
        console.log(`🔥 Testing ${path} with ${concurrency} concurrent requests...`);
        
        const results = [];
        const startTime = Date.now();
        
        for (let i = 0; i < totalRequests; i += concurrency) {
            const batch = Math.min(concurrency, totalRequests - i);
            const promises = Array.from({ length: batch }, () => 
                this.makeRequest(path)
            );
            
            const batchResults = await Promise.allSettled(promises);
            results.push(...batchResults.map(r => r.value || { success: false }));
        }
        
        const totalTime = Date.now() - startTime;
        const successful = results.filter(r => r && r.success).length;
        const avgDuration = results.reduce((sum, r) => sum + (r?.duration || 0), 0) / results.length;
        
        console.log(`✅ Results for ${path}:`);
        console.log(`   Total requests: ${totalRequests}`);
        console.log(`   Successful: ${successful}`);
        console.log(`   Success rate: ${(successful/totalRequests*100).toFixed(1)}%`);
        console.log(`   Avg response time: ${avgDuration.toFixed(1)}ms`);
        console.log(`   Requests/sec: ${(totalRequests/(totalTime/1000)).toFixed(1)}`);
        
        return { successful, avgDuration, requestsPerSec: totalRequests/(totalTime/1000) };
    }

    async testEndpoints() {
        const tests = [
            { path: '/health', concurrency: 50, requests: 500 },
            { path: '/api/search?q=patent', concurrency: 20, requests: 200 },
            { path: '/api/portfolio?userId=test', concurrency: 10, requests: 100 },
            { path: '/metrics', concurrency: 5, requests: 50 }
        ];

        console.log('🚀 Starting load tests...\n');
        
        for (const test of tests) {
            await this.runConcurrentRequests(test.path, test.concurrency, test.requests);
            console.log('');
            
            // Brief pause between tests
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }

    async testCachePerformance() {
        console.log('🧠 Testing cache performance...\n');
        
        // First request (cache miss)
        const miss = await this.makeRequest('/api/search?q=cache-test');
        console.log(`Cache MISS: ${miss.duration}ms`);
        
        // Second request (cache hit)
        const hit = await this.makeRequest('/api/search?q=cache-test');
        console.log(`Cache HIT: ${hit.duration}ms`);
        
        const improvement = ((miss.duration - hit.duration) / miss.duration * 100);
        console.log(`Cache improvement: ${improvement.toFixed(1)}%\n`);
    }

    async runAllTests() {
        try {
            await this.testCachePerformance();
            await this.testEndpoints();
            
            // Get final metrics
            const metrics = await this.makeRequest('/metrics');
            if (metrics.success) {
                console.log('📊 Final Server Metrics:');
                const data = JSON.parse(metrics.data || '{}');
                console.log(`   Total requests: ${data.requests || 0}`);
                console.log(`   Cache hit rate: ${((data.cacheHitRate || 0) * 100).toFixed(1)}%`);
                console.log(`   Memory usage: ${data.memory?.heapUsed || 0}MB`);
            }
            
            console.log('\n🎉 Load testing completed!');
            
        } catch (error) {
            console.error('❌ Load test failed:', error.message);
        }
    }
}

if (require.main === module) {
    const tester = new SimpleLoadTester();
    
    // Wait a bit for server to start, then run tests
    setTimeout(() => {
        tester.runAllTests();
    }, 2000);
}

module.exports = SimpleLoadTester;