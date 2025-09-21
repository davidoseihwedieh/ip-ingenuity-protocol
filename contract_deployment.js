// deployment/deploy.js
const { ethers } = require("hardhat");

async function main() {
    console.log("Starting Enhanced CreatorBonds deployment...");
    
    // Get the deployer account
    const [deployer] = await ethers.getSigners();
    console.log("Deploying contracts with account:", deployer.address);
    console.log("Account balance:", (await deployer.getBalance()).toString());

    // Deploy IP Token Registry first (mock for now)
    console.log("\n1. Deploying IP Token Registry...");
    const IPTokenRegistry = await ethers.getContractFactory("MockIPTokenRegistry");
    const ipTokenRegistry = await IPTokenRegistry.deploy();
    await ipTokenRegistry.deployed();
    console.log("IP Token Registry deployed to:", ipTokenRegistry.address);

    // Deploy Enhanced CreatorBonds
    console.log("\n2. Deploying Enhanced CreatorBonds...");
    const CreatorBonds = await ethers.getContractFactory("CreatorBonds");
    const creatorBonds = await CreatorBonds.deploy(ipTokenRegistry.address);
    await creatorBonds.deployed();
    console.log("CreatorBonds deployed to:", creatorBonds.address);

    // Initialize the contract with some test data
    console.log("\n3. Initializing contract...");
    
    // Create sample creator bonds for testing
    const tx1 = await creatorBonds.createBondToken(
        ethers.utils.parseEther("0.01"), // 0.01 ETH monthly
        "https://ip-ingenuity-protocol.vercel.app/api/creator-metadata/ai-music.json"
    );
    await tx1.wait();
    console.log("Created AI Music Creator bond (Token ID: 1)");

    const tx2 = await creatorBonds.createBondToken(
        ethers.utils.parseEther("0.02"), // 0.02 ETH monthly  
        "https://ip-ingenuity-protocol.vercel.app/api/creator-metadata/digital-artist.json"
    );
    await tx2.wait();
    console.log("Created Digital Artist bond (Token ID: 2)");

    // Verify deployment
    console.log("\n4. Verification...");
    const tokenCount = await creatorBonds._tokenIdCounter();
    console.log("Total tokens created:", tokenCount.toString());

    // Save deployment info
    const deploymentInfo = {
        network: hre.network.name,
        chainId: (await ethers.provider.getNetwork()).chainId,
        deployer: deployer.address,
        contracts: {
            IPTokenRegistry: {
                address: ipTokenRegistry.address,
                tx: ipTokenRegistry.deployTransaction.hash
            },
            CreatorBonds: {
                address: creatorBonds.address,
                tx: creatorBonds.deployTransaction.hash
            }
        },
        deployedAt: new Date().toISOString()
    };

    // Write to file
    const fs = require("fs");
    fs.writeFileSync(
        `./deployments/${hre.network.name}.json`,
        JSON.stringify(deploymentInfo, null, 2)
    );

    console.log("\n✅ Deployment Complete!");
    console.log("📄 Deployment info saved to:", `./deployments/${hre.network.name}.json`);
    console.log("\n📋 Contract Addresses:");
    console.log("IP Token Registry:", ipTokenRegistry.address);
    console.log("Creator Bonds:", creatorBonds.address);
    console.log("\n🔗 Add these to your frontend configuration!");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });