// hardhat.config.js
require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

const PRIVATE_KEY = process.env.PRIVATE_KEY || "0x" + "0".repeat(64);
const ALCHEMY_API_KEY = process.env.ALCHEMY_API_KEY || "";
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY || "";
const POLYGONSCAN_API_KEY = process.env.POLYGONSCAN_API_KEY || "";

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.19",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    // Local development
    hardhat: {
      chainId: 31337,
    },
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 31337,
    },
    
    // Testnets (Recommended for initial deployment)
    sepolia: {
      url: `https://eth-sepolia.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
      accounts: [PRIVATE_KEY],
      chainId: 11155111,
      gasPrice: 20000000000, // 20 gwei
    },
    mumbai: {
      url: `https://polygon-mumbai.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
      accounts: [PRIVATE_KEY],
      chainId: 80001,
      gasPrice: 8000000000, // 8 gwei
    },
    
    // Mainnets (Production deployment)
    mainnet: {
      url: `https://eth-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
      accounts: [PRIVATE_KEY],
      chainId: 1,
      gasPrice: 25000000000, // 25 gwei
    },
    polygon: {
      url: `https://polygon-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
      accounts: [PRIVATE_KEY],
      chainId: 137,
      gasPrice: 40000000000, // 40 gwei
    },
    
    // Alternative L2s
    arbitrum: {
      url: "https://arb1.arbitrum.io/rpc",
      accounts: [PRIVATE_KEY],
      chainId: 42161,
    },
    optimism: {
      url: "https://mainnet.optimism.io",
      accounts: [PRIVATE_KEY],
      chainId: 10,
    },
  },
  etherscan: {
    apiKey: {
      mainnet: ETHERSCAN_API_KEY,
      sepolia: ETHERSCAN_API_KEY,
      polygon: POLYGONSCAN_API_KEY,
      polygonMumbai: POLYGONSCAN_API_KEY,
    },
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    currency: "USD",
  },
};

// package.json for smart contract development
const packageJson = {
  "name": "ip-ingenuity-smart-contracts",
  "version": "1.0.0",
  "description": "Smart contracts for IP Ingenuity Protocol",
  "scripts": {
    "compile": "hardhat compile",
    "test": "hardhat test",
    "deploy:local": "hardhat run scripts/deploy.js --network localhost",
    "deploy:sepolia": "hardhat run scripts/deploy.js --network sepolia",
    "deploy:mumbai": "hardhat run scripts/deploy.js --network mumbai", 
    "deploy:polygon": "hardhat run scripts/deploy.js --network polygon",
    "verify:sepolia": "hardhat verify --network sepolia",
    "verify:polygon": "hardhat verify --network polygon",
    "node": "hardhat node",
    "clean": "hardhat clean"
  },
  "devDependencies": {
    "@nomicfoundation/hardhat-toolbox": "^3.0.2",
    "@nomicfoundation/hardhat-network-helpers": "^1.0.8",
    "@nomicfoundation/hardhat-chai-matchers": "^2.0.2",
    "@nomiclabs/hardhat-ethers": "^2.2.3",
    "@nomiclabs/hardhat-etherscan": "^3.1.7",
    "@typechain/ethers-v5": "^10.2.1",
    "@typechain/hardhat": "^6.1.6",
    "chai": "^4.3.7",
    "ethers": "^5.7.2",
    "hardhat": "^2.17.1",
    "hardhat-gas-reporter": "^1.0.9",
    "solidity-coverage": "^0.8.4",
    "typechain": "^8.3.1",
    "dotenv": "^16.3.1"
  },
  "dependencies": {
    "@openzeppelin/contracts": "^4.9.3"
  }
};

// .env template
const envTemplate = `# Private key for deployment (DO NOT COMMIT TO GIT)
PRIVATE_KEY=your_private_key_here

# Alchemy API keys
ALCHEMY_API_KEY=your_alchemy_api_key

# Etherscan API keys for verification  
ETHERSCAN_API_KEY=your_etherscan_api_key
POLYGONSCAN_API_KEY=your_polygonscan_api_key

# Gas reporting
REPORT_GAS=true

# Frontend configuration
REACT_APP_CHAIN_ID=80001
REACT_APP_CREATOR_BONDS_ADDRESS=
REACT_APP_IP_REGISTRY_ADDRESS=
`;

// Export configurations
module.exports.packageJson = packageJson;
module.exports.envTemplate = envTemplate;