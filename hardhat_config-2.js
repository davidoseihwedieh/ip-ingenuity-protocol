// hardhat.config.js
require("@nomicfoundation/hardhat-toolbox");
require("@nomiclabs/hardhat-etherscan");
require("dotenv").config();

const PRIVATE_KEY = process.env.PRIVATE_KEY || "0x" + "0".repeat(64);
const ALCHEMY_API_KEY = process.env.ALCHEMY_API_KEY || "";
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY || "";
const POLYGONSCAN_API_KEY = process.env.POLYGONSCAN_API_KEY || "";

module.exports = {
  solidity: {
    version: "0.8.19",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    // Local development
    hardhat: {
      chainId: 31337,
      accounts: {
        count: 20,
        accountsBalance: "10000000000000000000000" // 10,000 ETH
      }
    },
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 31337
    },

    // Testnets
    sepolia: {
      url: `https://eth-sepolia.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
      chainId: 11155111,
      gasPrice: 20000000000 // 20 gwei
    },
    goerli: {
      url: `https://eth-goerli.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
      chainId: 5,
      gasPrice: 20000000000
    },
    mumbai: {
      url: `https://polygon-mumbai.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
      chainId: 80001,
      gasPrice: 35000000000 // 35 gwei
    },

    // Mainnets
    mainnet: {
      url: `https://eth-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
      chainId: 1,
      gasPrice: "auto"
    },
    polygon: {
      url: `https://polygon-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
      chainId: 137,
      gasPrice: 35000000000
    },
    arbitrum: {
      url: "https://arb1.arbitrum.io/rpc",
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
      chainId: 42161
    },
    optimism: {
      url: "https://mainnet.optimism.io",
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
      chainId: 10
    }
  },
  etherscan: {
    apiKey: {
      mainnet: ETHERSCAN_API_KEY,
      sepolia: ETHERSCAN_API_KEY,
      goerli: ETHERSCAN_API_KEY,
      polygon: POLYGONSCAN_API_KEY,
      polygonMumbai: POLYGONSCAN_API_KEY
    }
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    currency: "USD",
    gasPrice: 21,
    coinmarketcap: process.env.COINMARKETCAP_API_KEY
  },
  mocha: {
    timeout: 300000 // 5 minutes
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  }
};

// ===========================
// package.json
// ===========================

{
  "name": "creatorbonds-enhanced",
  "version": "1.0.0",
  "description": "Enhanced CreatorBonds smart contract system",
  "main": "index.js",
  "scripts": {
    "compile": "hardhat compile",
    "test": "hardhat test",
    "test:gas": "REPORT_GAS=true hardhat test",
    "deploy:local": "hardhat run deployment/deploy.js --network localhost",
    "deploy:sepolia": "hardhat run deployment/deploy.js --network sepolia",
    "deploy:mumbai": "hardhat run deployment/deploy.js --network mumbai",
    "deploy:polygon": "hardhat run deployment/deploy.js --network polygon",
    "node": "hardhat node",
    "clean": "hardhat clean",
    "size": "hardhat size-contracts",
    "verify:sepolia": "hardhat verify --network sepolia",
    "verify:mumbai": "hardhat verify --network mumbai",
    "flatten": "hardhat flatten contracts/CreatorBonds.sol > CreatorBonds-flattened.sol"
  },
  "devDependencies": {
    "@nomicfoundation/hardhat-toolbox": "^3.0.2",
    "@nomiclabs/hardhat-etherscan": "^3.1.7",
    "@openzeppelin/contracts": "^4.9.3",
    "chai": "^4.3.7",
    "dotenv": "^16.3.1",
    "hardhat": "^2.17.1",
    "hardhat-contract-sizer": "^2.10.0",
    "hardhat-gas-reporter": "^1.0.9"
  },
  "keywords": [
    "ethereum",
    "smart-contracts",
    "hardhat",
    "creator-economy",
    "bonds"
  ],
  "author": "Your Name",
  "license": "MIT"
}

// ===========================
// .env.example
// ===========================

# Private key for deployment (without 0x prefix)
PRIVATE_KEY=your_private_key_here

# Alchemy API keys
ALCHEMY_API_KEY=your_alchemy_api_key

# Etherscan API keys for contract verification
ETHERSCAN_API_KEY=your_etherscan_api_key
POLYGONSCAN_API_KEY=your_polygonscan_api_key

# Optional: Gas reporting
REPORT_GAS=true
COINMARKETCAP_API_KEY=your_coinmarketcap_key

# Optional: Custom RPC URLs
CUSTOM_MAINNET_RPC=https://your-custom-rpc.com
CUSTOM_POLYGON_RPC=https://your-custom-polygon-rpc.com