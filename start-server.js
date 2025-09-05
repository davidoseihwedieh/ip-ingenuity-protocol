const SecureServer = require('./security/secure-server');

// Set environment variables
process.env.JWT_SECRET = process.env.JWT_SECRET || 'dev-jwt-secret-key-change-in-production';
process.env.REFRESH_SECRET = process.env.REFRESH_SECRET || 'dev-refresh-secret-key-change-in-production';
process.env.NODE_ENV = process.env.NODE_ENV || 'development';

// Start server
const server = new SecureServer();
server.start(3001);

console.log('🔒 IP Ingenuity Security Server Started');
console.log('🌐 Server: http://localhost:3001');
console.log('📋 Available endpoints:');
console.log('  POST /api/auth/register - User registration');
console.log('  POST /api/auth/login - User login');
console.log('  POST /api/auth/refresh - Token refresh');
console.log('  POST /api/ip/mint - Mint IP token (requires auth)');
console.log('  GET /api/ip/portfolio - Get user portfolio (requires auth)');