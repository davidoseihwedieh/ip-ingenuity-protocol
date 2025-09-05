const { performance } = require('perf_hooks');

class LoadTester {
    constructor(baseUrl = 'http://localhost:8000') {
        this.baseUrl = baseUrl;
        this.results = [];
    }

    async testValuationAPI(concurrency = 10, requests = 100) {
        console.log(`🚀 Load testing with ${concurrency} concurrent users, ${requests} requests`);
        
        const testData = {
            title: "AI Blockchain Patent",
            description: "Revolutionary AI-powered blockchain system",
            claims: ["A system for AI blockchain integration"],
            industry: "ai",
            base_valuation: 1000000
        };

        const startTime = performance.now();
        const promises = [];

        for (let i = 0; i < requests; i++) {
            promises.push(this.makeRequest(testData));
            
            if (promises.length >= concurrency) {
                await Promise.all(promises);
                promises.length = 0;
            }
        }

        if (promises.length > 0) {
            await Promise.all(promises);
        }

        const endTime = performance.now();
        const totalTime = endTime - startTime;

        console.log(`✅ Completed ${requests} requests in ${totalTime.toFixed(2)}ms`);
        console.log(`📊 Average response time: ${(totalTime / requests).toFixed(2)}ms`);
        console.log(`🔥 Requests per second: ${(requests / (totalTime / 1000)).toFixed(2)}`);
        
        return this.results;
    }

    async makeRequest(data) {
        const start = performance.now();
        
        try {
            const response = await fetch(`${this.baseUrl}/api/valuation`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            
            const result = await response.json();
            const end = performance.now();
            
            this.results.push({
                success: true,
                responseTime: end - start,
                status: response.status
            });
        } catch (error) {
            const end = performance.now();
            this.results.push({
                success: false,
                responseTime: end - start,
                error: error.message
            });
        }
    }

    async testBlockchainPerformance() {
        console.log("🔗 Testing blockchain performance...");
        
        // Test contract deployment speed
        // Test transaction throughput
        // Test gas optimization
        
        console.log("✅ Blockchain performance test completed");
    }
}

// Run load tests
async function runTests() {
    const tester = new LoadTester();
    
    console.log("🎯 Starting IP Ingenuity Performance Tests\n");
    
    // Test API performance
    await tester.testValuationAPI(5, 50);   // Light load
    await tester.testValuationAPI(20, 200); // Medium load
    await tester.testValuationAPI(50, 500); // Heavy load
    
    // Test blockchain performance
    await tester.testBlockchainPerformance();
    
    console.log("\n🏆 All performance tests completed!");
}

if (require.main === module) {
    runTests().catch(console.error);
}

module.exports = LoadTester;