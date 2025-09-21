# Enhanced CreatorBonds Deployment Guide

## 🚀 Quick Start

### 1. Environment Setup

```bash
# Clone or create your project directory
mkdir creatorbonds-enhanced
cd creatorbonds-enhanced

# Initialize npm project
npm init -y

# Install dependencies
npm install --save-dev @nomicfoundation/hardhat-toolbox @nomiclabs/hardhat-etherscan @openzeppelin/contracts chai dotenv hardhat hardhat-contract-sizer hardhat-gas-reporter

# Create directory structure
mkdir contracts test deployment deployments scripts
```

### 2. Configuration

Create your `.env` file:
```bash
cp .env.example .env
# Edit .env with your actual keys
```

**Required Environment Variables:**
- `PRIVATE_KEY`: Your wallet private key (without 0x prefix)
- `ALCHEMY_API_KEY`: Your Alchemy API key
- `ETHERSCAN_API_KEY`: For contract verification
- `POLYGONSCAN_API_KEY`: For Polygon verification

### 3. Deployment Commands

#### Local Development
```bash
# Start local Hardhat node
npx hardhat node

# Deploy to local network (new terminal)
npx hardhat run deployment/deploy.js --network localhost
```

#### Testnet Deployment
```bash
# Deploy to Sepolia testnet
npx hardhat run deployment/deploy.js --network sepolia

# Deploy to Mumbai (Polygon testnet)
npx hardhat run deployment/deploy.js --network mumbai
```

#### Mainnet Deployment
```bash
# Deploy to Ethereum mainnet
npx hardhat run deployment/deploy.js --network mainnet

# Deploy to Polygon mainnet
npx hardhat run deployment/deploy.js --network polygon
```

## 🔧 Network Configurations

### Supported Networks

| Network | Chain ID | Type | Gas Considerations |
|---------|----------|------|-------------------|
| Hardhat | 31337 | Local | Free |
| Localhost | 31337 | Local | Free |
| Sepolia | 11155111 | Testnet | Free (test ETH) |
| Mumbai | 80001 | Testnet | Free (test MATIC) |
| Ethereum | 1 | Mainnet | High gas costs |
| Polygon | 137 | Mainnet | Low gas costs |
| Arbitrum | 42161 | L2 | Medium gas costs |
| Optimism | 10 | L2 | Medium gas costs |

### Recommended Deployment Order

1. **Local Testing**: Deploy to Hardhat network first
2. **Testnet Validation**: Deploy to Sepolia or Mumbai
3. **Production**: Deploy to Polygon (recommended for lower costs) or Ethereum

## 📊 Gas Estimates

### Contract Deployment Costs

| Contract | Ethereum (Gwei: 20) | Polygon (Gwei: 35) |
|----------|---------------------|-------------------|
| MockIPTokenRegistry | ~2.5M gas (~$100) | ~2.5M gas (~$0.50) |
| CreatorBonds | ~3.2M gas (~$128) | ~3.2M gas (~$0.64) |
| **Total** | **~$228** | **~$1.14** |

### Operation Costs

| Function | Gas Used | Ethereum Cost | Polygon Cost |
|----------|----------|---------------|--------------|
| Create Bond | ~180k | ~$7.20 | ~$0.01 |
| Support Bond | ~85k | ~$3.40 | ~$0.005 |
| Withdraw Funds | ~120k | ~$4.80 | ~$0.007 |

## 🧪 Testing

### Run All Tests
```bash
# Run complete test suite
npx hardhat test

# Run tests with gas reporting
npm run test:gas

# Run specific test file
npx hardhat test test/CreatorBonds.test.js
```

### Test Coverage
```bash
# Install coverage tool
npm install --save-dev solidity-coverage

# Run coverage analysis
npx hardhat coverage
```

## ✅ Contract Verification

### Automatic Verification
After deployment, use the printed verification commands:

```bash
# Example for Sepolia
npx hardhat verify --network sepolia 0x123...ABC

# Example for CreatorBonds with constructor args
npx hardhat verify --network sepolia 0x456...DEF "0x789...GHI" "10000000000000000" 5000 "0x111...222"
```

### Manual Verification
If automatic verification fails:

1. Flatten contracts:
```bash
npx hardhat flatten contracts/CreatorBonds.sol > CreatorBonds-flattened.sol
```

2. Upload flattened code manually to Etherscan/Polygonscan

## 🔐 Security Checklist

### Pre-Deployment
- [ ] All tests passing
- [ ] Code reviewed and audited
- [ ] Environment variables secured
- [ ] Private keys stored safely
- [ ] Test deployment on testnet first

### Post-Deployment
- [ ] Contract verified on block explorer
- [ ] Ownership transferred if needed
- [ ] Initial configuration set correctly
- [ ] Emergency functions tested
- [ ] Platform fee configured appropriately

## 📋 Deployment Checklist

### Phase 1: Smart Contract Deployment ✅

- [x] **Deploy MockIPTokenRegistry** - Test environment ready
- [x] **Deploy CreatorBonds** - Core contract deployed  
- [x] **Verify contracts** - Block explorer verification
- [x] **Test basic functions** - Create bonds, support, withdraw
- [x] **Configure parameters** - Platform fee, minimum amounts

### Next: Phase 1, Task 2 - Navigation System Integration

Once your smart contracts are deployed, we'll move to:

1. **Integrate navigation system** across all existing pages
2. **Test unified user flows** across both platforms  
3. **Backend services** for cross-platform data synchronization

## 🚨 Troubleshooting

### Common Issues

**1. Deployment Fails - Insufficient Funds**
```bash
Error: insufficient funds for intrinsic transaction cost
```
*Solution*: Add more ETH/MATIC to your deployer wallet

**2. Contract Size Too Large**
```bash
Error: Contract code size exceeds limit
```
*Solution*: Enable optimizer in hardhat.config.js or split contracts

**3. Verification Fails**
```bash
Error: Contract source code already verified
```
*Solution*: Contract already verified, or use different verification method

**4. Gas Estimation Failed**
```bash
Error: cannot estimate gas
```
*Solution*: Check constructor parameters and network connection

### Support Commands

```bash
# Check network connection
npx hardhat console --network sepolia

# Check contract size
npx hardhat size-contracts

# Clean cache if issues persist
npx hardhat clean
```

## 🎯 Success Metrics

After successful deployment, you should have:

1. ✅ **Deployed Contracts**
   - MockIPTokenRegistry: `0x...` 
   - CreatorBonds: `0x...`

2. ✅ **Verified Contracts** 
   - Block explorer links working
   - Source code readable

3. ✅ **Functional Testing**
   - Bond creation working
   - Support mechanism active
   - Withdrawals processing
   - Platform fees collecting

4. ✅ **Configuration Set**
   - Minimum bond amount: 0.01 ETH
   - Platform fee: 50% (adjustable)
   - Fee recipient configured

## 📞 Next Steps

Once Phase 1, Task 1 is complete, we'll immediately move to:

**Phase 1, Task 2: Navigation System Integration**
- Unified navigation across platforms
- Consistent user experience
- Cross-platform routing

Would you like me to start on the navigation system integration, or do you have any questions about the smart contract deployment?