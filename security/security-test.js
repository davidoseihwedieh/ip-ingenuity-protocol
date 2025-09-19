const axios = require('axios');

class SecurityTester {
    constructor(baseUrl = 'http://localhost:3001') {
        this.baseUrl = baseUrl;
        this.results = [];
    }

    async runAllTests() {
        console.log('🔒 Running Security Tests...\n');

        await this.testRateLimiting();
        await this.testInputValidation();
        await this.testAuthentication();
        await this.testSecurityHeaders();

        this.printResults();
    }

    async testRateLimiting() {
        console.log('Testing rate limiting...');
        
        try {
            const requests = Array(12).fill().map(() => 
                axios.post(`${this.baseUrl}/api/auth/login`, {
                    email: 'test@test.com',
                    password: 'password'
                }).catch(err => err.response)
            );

            const responses = await Promise.all(requests);
            const rateLimited = responses.some(r => r?.status === 429);
            
            this.results.push({
                test: 'Rate Limiting',
                passed: rateLimited,
                message: rateLimited ? 'Rate limiting working' : 'Rate limiting failed'
            });
        } catch (error) {
            this.results.push({
                test: 'Rate Limiting',
                passed: false,
                message: 'Test failed: ' + error.message
            });
        }
    }

    async testInputValidation() {
        console.log('Testing input validation...');
        
        try {
            const response = await axios.post(`${this.baseUrl}/api/auth/register`, {
                email: 'invalid-email',
                password: '123',
                name: ''
            }).catch(err => err.response);

            const hasValidation = response?.status === 400;
            
            this.results.push({
                test: 'Input Validation',
                passed: hasValidation,
                message: hasValidation ? 'Input validation working' : 'Input validation failed'
            });
        } catch (error) {
            this.results.push({
                test: 'Input Validation',
                passed: false,
                message: 'Test failed: ' + error.message
            });
        }
    }

    async testAuthentication() {
        console.log('Testing authentication...');
        
        try {
            // Test protected route without token
            const response = await axios.get(`${this.baseUrl}/api/ip/portfolio`)
                .catch(err => err.response);

            const requiresAuth = response?.status === 401;
            
            this.results.push({
                test: 'Authentication Required',
                passed: requiresAuth,
                message: requiresAuth ? 'Authentication protection working' : 'Authentication bypass detected'
            });
        } catch (error) {
            this.results.push({
                test: 'Authentication Required',
                passed: false,
                message: 'Test failed: ' + error.message
            });
        }
    }

    async testSecurityHeaders() {
        console.log('Testing security headers...');
        
        try {
            const response = await axios.get(`${this.baseUrl}/api/health`)
                .catch(err => err.response || { headers: {} });

            const headers = response.headers || {};
            const hasSecurityHeaders = 
                headers['x-content-type-options'] === 'nosniff' ||
                headers['x-frame-options'] === 'DENY' ||
                headers['x-xss-protection'];

            this.results.push({
                test: 'Security Headers',
                passed: hasSecurityHeaders,
                message: hasSecurityHeaders ? 'Security headers present' : 'Missing security headers'
            });
        } catch (error) {
            this.results.push({
                test: 'Security Headers',
                passed: false,
                message: 'Test failed: ' + error.message
            });
        }
    }

    printResults() {
        console.log('\n📊 Security Test Results:');
        console.log('========================');
        
        this.results.forEach(result => {
            const status = result.passed ? '✅ PASS' : '❌ FAIL';
            console.log(`${status} ${result.test}: ${result.message}`);
        });

        const passedTests = this.results.filter(r => r.passed).length;
        const totalTests = this.results.length;
        
        console.log(`\nOverall: ${passedTests}/${totalTests} tests passed`);
        
        if (passedTests === totalTests) {
            console.log('🎉 All security tests passed!');
        } else {
            console.log('⚠️  Some security tests failed - review implementation');
        }
    }
}

// Run tests if called directly
if (require.main === module) {
    const tester = new SecurityTester();
    tester.runAllTests();
}

module.exports = SecurityTester;