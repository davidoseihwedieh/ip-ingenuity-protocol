# CreatorFi - Creator Token Platform

🚀 **The first platform where creators can tokenize their work and fans can invest in their success.**

CreatorFi democratizes the creator economy by enabling content creators to tokenize their intellectual property and future revenue streams, while allowing fans and investors to participate in their success through fractional ownership.

## 🌟 Features

### For Creators
- **Tokenize Revenue Streams**: Convert your YouTube, TikTok, Instagram, and other platform earnings into investable assets
- **Raise Capital**: Fund equipment, team expansion, and creative projects without traditional gatekeepers
- **Automated Distribution**: Smart contracts automatically share revenue with token holders
- **Multi-Platform Integration**: Connect all your social media accounts for comprehensive revenue tracking
- **Professional Analytics**: Track performance, investor relationships, and reputation scores

### For Investors
- **Discover Creators**: Browse and invest in emerging and established content creators
- **Fractional Ownership**: Start investing with as little as $50
- **Automated Returns**: Receive your share of creator revenue automatically
- **Portfolio Management**: Track your investments across multiple creators
- **Transparent Metrics**: Real-time performance data and creator analytics

### Platform Features
- **SEC Compliant**: Full regulatory compliance with KYC/AML procedures
- **Quadratic Voting**: Community governance with reputation-based voting power
- **Smart Contracts**: Audited blockchain technology for transparent operations
- **Mobile Responsive**: Beautiful, intuitive interface across all devices

## 🛠 Tech Stack

### Frontend
- **React 18** with functional components and hooks
- **Tailwind CSS** for responsive, modern styling
- **Recharts** for data visualization
- **Lucide React** for icons
- **Web3 Integration** for blockchain connectivity

### Backend
- **Node.js** with Express framework
- **PostgreSQL** database with comprehensive schema
- **JWT Authentication** with bcrypt password hashing
- **Rate Limiting** and security middleware
- **RESTful API** with input validation

### Blockchain
- **Solidity** smart contracts
- **Ethereum/Polygon** network compatibility
- **OpenZeppelin** contracts for security standards
- **Hardhat** development environment

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- MetaMask or Web3 wallet
- Git

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/creator-token-platform.git
cd creator-token-platform
```

2. **Install dependencies**
```bash
npm install
cd client && npm install && cd ..
```

3. **Environment Setup**
```bash
cp .env.example .env
```

Edit `.env` with your configuration:
```env
# Database
DATABASE_URL=postgresql://username:password@localhost:5432/creator_tokens

# JWT
JWT_SECRET=your_super_secret_jwt_key

# Blockchain
POLYGON_RPC_URL=https://polygon-rpc.com
PRIVATE_KEY=your_wallet_private_key
ETHERSCAN_API_KEY=your_etherscan_api_key

# API Keys
YOUTUBE_API_KEY=your_youtube_api_key
TIKTOK_CLIENT_KEY=your_tiktok_client_key
INSTAGRAM_CLIENT_ID=your_instagram_client_id
```

4. **Database Setup**
```bash
# Create database
createdb creator_tokens

# Run migrations
npm run migrate

# Seed with sample data (optional)
npm run seed
```

5. **Deploy Smart Contracts** (Testnet)
```bash
npm run deploy:contracts
```

6. **Start Development Server**
```bash
npm run dev
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001

## 📁 Project Structure

```
creator-token-platform/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/         # Page components
│   │   ├── hooks/         # Custom React hooks
│   │   ├── utils/         # Utility functions
│   │   └── styles/        # Global styles
│   └── public/            # Static assets
├── server/                # Node.js backend
│   ├── routes/           # API route handlers
│   ├── middleware/       # Express middleware
│   ├── models/          # Database models
│   ├── utils/           # Server utilities
│   └── server.js        # Main server file
├── contracts/            # Solidity smart contracts
│   ├── CreatorToken.sol # Main token contract
│   └── tests/           # Contract tests
├── scripts/             # Deployment and utility scripts
├── docs/               # Documentation
└── README.md
```

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login

### Creators
- `GET /api/creators/profile` - Get creator profile
- `POST /api/creators/revenue` - Add revenue stream
- `GET /api/creators/revenue` - Get revenue history
- `POST /api/creators/connect-platform` - Connect social platform

### Investors
- `GET /api/creators/discover` - Discover creators
- `POST /api/investments` - Make investment
- `GET /api/investments/portfolio` - Get investment portfolio

### Platform
- `GET /api/health` - Health check
- `GET /api/metrics` - Platform metrics

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run specific test file
npm test -- --testNamePattern="Creator Profile"
```

## 🚀 Deployment

### Production Environment Setup

1. **Database Migration**
```bash
NODE_ENV=production npm run migrate
```

2. **Build Frontend**
```bash
npm run build
```

3. **Deploy Smart Contracts** (Mainnet)
```bash
npm run deploy:contracts -- --network polygon
```

4. **Start Production Server**
```bash
NODE_ENV=production npm start
```

### Docker Deployment

```bash
# Build and run with Docker Compose
docker-compose up --build
```

## 🔐 Security Considerations

- **Smart Contract Auditing**: All contracts should be professionally audited before mainnet deployment
- **KYC/AML Compliance**: Implement proper identity verification procedures
- **Rate Limiting**: API endpoints are protected against abuse
- **Input Validation**: All user inputs are validated and sanitized
- **Secure Storage**: Sensitive data is encrypted and securely stored

## 📊 Database Schema

Key tables include:
- `users` - Creator and investor profiles
- `creator_profiles` - Extended creator information
- `platform_connections` - Social media integrations
- `revenue_streams` - Creator earnings tracking
- `investments` - Investment records
- `revenue_distributions` - Automated payouts
- `governance_proposals` - Platform voting
- `reputation_events` - Reputation scoring

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow ESLint configuration
- Write tests for new features
- Update documentation
- Ensure smart contract tests pass
- Follow conventional commit messages

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔗 Links

- **Website**: [https://creatorfi.com](https://creatorfi.com)
- **Documentation**: [https://docs.creatorfi.com](https://docs.creatorfi.com)
- **Discord**: [https://discord.gg/creatorfi](https://discord.gg/creatorfi)
- **Twitter**: [@CreatorFi](https://twitter.com/creatorfi)

## ⚠️ Disclaimer

This platform deals with financial securities and investments. Users should:
- Understand the risks involved in investing
- Comply with local securities laws
- Consult with financial advisors when needed
- Only invest amounts they can afford to lose

CreatorFi is not a licensed financial advisor. All investments carry risk.

## 📞 Support

- **Email**: support@creatorfi.com
- **Discord**: Join our community server
- **GitHub Issues**: Report bugs and request features
- **Documentation**: Comprehensive guides and API docs

---

**Built with ❤️ by the CreatorFi team**

*Democratizing the creator economy, one token at a time.*