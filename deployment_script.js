// deployment/deploy.js
const { ethers } = require("hardhat");

async function main() {
  console.log("Starting Enhanced CreatorBonds deployment...");
  
  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  
  const balance = await deployer.getBalance();
  console.log("Account balance:", ethers.utils.formatEther(balance), "ETH");

  // Deploy Mock IP Token Registry first (for testing)
  console.log("\n1. Deploying MockIPTokenRegistry...");
  const MockIPTokenRegistry = await ethers.getContractFactory("MockIPTokenRegistry");
  const ipRegistry = await MockIPTokenRegistry.deploy();
  await ipRegistry.deployed();
  console.log("MockIPTokenRegistry deployed to:", ipRegistry.address);

  // Deploy Enhanced CreatorBonds
  console.log("\n2. Deploying Enhanced CreatorBonds...");
  const CreatorBonds = await ethers.getContractFactory("CreatorBonds");
  
  // Constructor parameters
  const constructorArgs = [
    ipRegistry.address,           // IP Token Registry address
    ethers.utils.parseEther("0.01"), // Minimum bond amount (0.01 ETH)
    5000,                        // Platform fee (50.00% in basis points)
    deployer.address             // Fee recipient
  ];
  
  const creatorBonds = await CreatorBonds.deploy(...constructorArgs);
  await creatorBonds.deployed();
  console.log("CreatorBonds deployed to:", creatorBonds.address);

  // Verify deployment
  console.log("\n3. Verifying deployment...");
  const registryAddress = await creatorBonds.ipTokenRegistry();
  const minBond = await creatorBonds.minimumBondAmount();
  const platformFee = await creatorBonds.platformFee();
  
  console.log("✓ IP Registry linked:", registryAddress === ipRegistry.address);
  console.log("✓ Minimum bond amount:", ethers.utils.formatEther(minBond), "ETH");
  console.log("✓ Platform fee:", platformFee.toString(), "basis points");

  // Save deployment info
  const deploymentInfo = {
    network: network.name,
    timestamp: new Date().toISOString(),
    deployer: deployer.address,
    contracts: {
      MockIPTokenRegistry: ipRegistry.address,
      CreatorBonds: creatorBonds.address
    },
    constructorArgs,
    gasUsed: {
      MockIPTokenRegistry: (await ipRegistry.deployTransaction.wait()).gasUsed.toString(),
      CreatorBonds: (await creatorBonds.deployTransaction.wait()).gasUsed.toString()
    }
  };

  // Write deployment info to file
  const fs = require('fs');
  const deploymentPath = `deployments/${network.name}-deployment.json`;
  fs.mkdirSync('deployments', { recursive: true });
  fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
  
  console.log(`\n✅ Deployment complete! Info saved to: ${deploymentPath}`);
  
  // Contract verification commands (for later use)
  console.log("\n📝 Contract Verification Commands:");
  console.log(`npx hardhat verify --network ${network.name} ${ipRegistry.address}`);
  console.log(`npx hardhat verify --network ${network.name} ${creatorBonds.address} "${ipRegistry.address}" "${ethers.utils.parseEther("0.01")}" 5000 "${deployer.address}"`);
  
  return { creatorBonds, ipRegistry };
}

// Handle deployment
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Deployment failed:", error);
    process.exit(1);
  });