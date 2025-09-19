const { ethers } = require("hardhat");
const fs = require('fs');

async function main() {
    console.log("🚀 Deploying IP Ingenuity to Sepolia Testnet...");

    const [deployer] = await ethers.getSigners();
    console.log("Deploying with account:", deployer.address);
    console.log("Account balance:", (await deployer.getBalance()).toString());

    // Deployment configuration
    const config = {
        multiSigOwners: [
            deployer.address,
            "0x70997970C51812dc3A010C7d01b50e0d17dc79C8", // Test address 1
            "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC"  // Test address 2
        ],
        requiredConfirmations: 2,
        timeLockDelay: 2 * 24 * 60 * 60, // 2 days
        baseURI: "https://testnet-api.ipingenuity.com/metadata/{id}.json"
    };

    console.log("\n📋 Deployment Configuration:");
    console.log("Multi-sig owners:", config.multiSigOwners);
    console.log("Required confirmations:", config.requiredConfirmations);
    console.log("Time-lock delay:", config.timeLockDelay, "seconds");

    // 1. Deploy MultiSig Wallet
    console.log("\n1️⃣ Deploying MultiSig Wallet...");
    const MultiSigWallet = await ethers.getContractFactory("MultiSigWallet");
    const multiSig = await MultiSigWallet.deploy(config.multiSigOwners, config.requiredConfirmations);
    await multiSig.deployed();
    console.log("✅ MultiSig deployed to:", multiSig.address);

    // 2. Deploy TimeLock
    console.log("\n2️⃣ Deploying TimeLock...");
    const TimeLock = await ethers.getContractFactory("TimeLock");
    const timeLock = await TimeLock.deploy(multiSig.address, config.timeLockDelay);
    await timeLock.deployed();
    console.log("✅ TimeLock deployed to:", timeLock.address);

    // 3. Deploy Security Audit
    console.log("\n3️⃣ Deploying Security Audit...");
    const SecurityAudit = await ethers.getContractFactory("SecurityAudit");
    const securityAudit = await SecurityAudit.deploy();
    await securityAudit.deployed();
    console.log("✅ Security Audit deployed to:", securityAudit.address);

    // 4. Deploy IP Token Contract
    console.log("\n4️⃣ Deploying IP Token Contract...");
    const IPT1155Secure = await ethers.getContractFactory("IPT1155Secure");
    const ipToken = await IPT1155Secure.deploy(config.baseURI, multiSig.address, timeLock.address);
    await ipToken.deployed();
    console.log("✅ IP Token deployed to:", ipToken.address);

    // 5. Verify deployment
    console.log("\n🔍 Verifying Deployment...");
    
    // Check MultiSig configuration
    const owners = await multiSig.getOwners();
    const requiredConf = await multiSig.numConfirmationsRequired();
    console.log("MultiSig owners:", owners);
    console.log("Required confirmations:", requiredConf.toString());

    // Check TimeLock configuration
    const delay = await timeLock.delay();
    const admin = await timeLock.admin();
    console.log("TimeLock delay:", delay.toString(), "seconds");
    console.log("TimeLock admin:", admin);

    // Check IP Token configuration
    const DEFAULT_ADMIN_ROLE = await ipToken.DEFAULT_ADMIN_ROLE();
    const hasAdminRole = await ipToken.hasRole(DEFAULT_ADMIN_ROLE, multiSig.address);
    console.log("MultiSig has admin role:", hasAdminRole);

    // 6. Initial setup transactions
    console.log("\n⚙️ Initial Setup...");
    
    // Grant minter role to deployer for testing
    const MINTER_ROLE = await ipToken.MINTER_ROLE();
    await ipToken.grantRole(MINTER_ROLE, deployer.address);
    console.log("✅ Granted MINTER_ROLE to deployer");

    // 7. Test minting
    console.log("\n🧪 Test Token Minting...");
    const mintTx = await ipToken.mintIPToken(
        deployer.address,
        "Test Patent #1",
        "First test patent on Sepolia testnet",
        "Patent",
        ethers.utils.parseEther("100"), // 100 ETH valuation
        7500, // 75% confidence
        500,  // 5% royalty
        1     // 1 token
    );
    await mintTx.wait();
    console.log("✅ Test token minted successfully");

    // 8. Save deployment info
    const deploymentInfo = {
        network: "sepolia",
        chainId: 11155111,
        deployer: deployer.address,
        timestamp: new Date().toISOString(),
        contracts: {
            multiSigWallet: multiSig.address,
            timeLock: timeLock.address,
            securityAudit: securityAudit.address,
            ipToken: ipToken.address
        },
        configuration: config,
        testToken: {
            tokenId: 1,
            title: "Test Patent #1",
            owner: deployer.address
        }
    };

    // Save to file
    fs.writeFileSync(
        './testnet-deployment/sepolia-deployment.json',
        JSON.stringify(deploymentInfo, null, 2)
    );

    console.log("\n🎉 Sepolia Deployment Complete!");
    console.log("\n📋 Contract Addresses:");
    console.log("MultiSig Wallet:", multiSig.address);
    console.log("TimeLock:", timeLock.address);
    console.log("Security Audit:", securityAudit.address);
    console.log("IP Token:", ipToken.address);

    console.log("\n🔗 Etherscan Links:");
    console.log(`MultiSig: https://sepolia.etherscan.io/address/${multiSig.address}`);
    console.log(`TimeLock: https://sepolia.etherscan.io/address/${timeLock.address}`);
    console.log(`Security Audit: https://sepolia.etherscan.io/address/${securityAudit.address}`);
    console.log(`IP Token: https://sepolia.etherscan.io/address/${ipToken.address}`);

    console.log("\n🧪 Test Commands:");
    console.log(`npx hardhat verify --network sepolia ${multiSig.address} '${JSON.stringify(config.multiSigOwners)}' ${config.requiredConfirmations}`);
    console.log(`npx hardhat verify --network sepolia ${timeLock.address} ${multiSig.address} ${config.timeLockDelay}`);
    console.log(`npx hardhat verify --network sepolia ${securityAudit.address}`);
    console.log(`npx hardhat verify --network sepolia ${ipToken.address} "${config.baseURI}" ${multiSig.address} ${timeLock.address}`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Deployment failed:", error);
        process.exit(1);
    });