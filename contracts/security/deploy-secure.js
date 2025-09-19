const { ethers } = require("hardhat");

async function main() {
    console.log("🔒 Deploying Secure IP Ingenuity Contracts...");

    const [deployer, owner1, owner2, owner3] = await ethers.getSigners();
    console.log("Deploying with account:", deployer.address);

    // 1. Deploy MultiSig Wallet (3 owners, 2 confirmations required)
    console.log("\n1. Deploying MultiSig Wallet...");
    const MultiSigWallet = await ethers.getContractFactory("MultiSigWallet");
    const multiSig = await MultiSigWallet.deploy(
        [deployer.address, owner1.address, owner2.address],
        2 // 2 out of 3 confirmations required
    );
    await multiSig.deployed();
    console.log("✅ MultiSig Wallet deployed to:", multiSig.address);

    // 2. Deploy TimeLock (2 day delay)
    console.log("\n2. Deploying TimeLock...");
    const TimeLock = await ethers.getContractFactory("TimeLock");
    const timeLock = await TimeLock.deploy(
        multiSig.address, // Admin is the MultiSig
        2 * 24 * 60 * 60 // 2 days in seconds
    );
    await timeLock.deployed();
    console.log("✅ TimeLock deployed to:", timeLock.address);

    // 3. Deploy Security Audit Contract
    console.log("\n3. Deploying Security Audit...");
    const SecurityAudit = await ethers.getContractFactory("SecurityAudit");
    const securityAudit = await SecurityAudit.deploy();
    await securityAudit.deployed();
    console.log("✅ Security Audit deployed to:", securityAudit.address);

    // 4. Deploy Secure IP Token Contract
    console.log("\n4. Deploying Secure IP Token...");
    const IPT1155Secure = await ethers.getContractFactory("IPT1155Secure");
    const ipToken = await IPT1155Secure.deploy(
        "https://api.ipingenuity.com/metadata/{id}.json",
        multiSig.address,
        timeLock.address
    );
    await ipToken.deployed();
    console.log("✅ Secure IP Token deployed to:", ipToken.address);

    // 5. Verify deployment
    console.log("\n🔍 Verifying Security Setup...");
    
    // Check MultiSig owners
    const owners = await multiSig.getOwners();
    console.log("MultiSig Owners:", owners);
    console.log("Required Confirmations:", await multiSig.numConfirmationsRequired());

    // Check TimeLock delay
    const delay = await timeLock.delay();
    console.log("TimeLock Delay:", delay.toString(), "seconds");

    // Check IP Token security roles
    const DEFAULT_ADMIN_ROLE = await ipToken.DEFAULT_ADMIN_ROLE();
    const hasAdminRole = await ipToken.hasRole(DEFAULT_ADMIN_ROLE, multiSig.address);
    console.log("MultiSig has admin role:", hasAdminRole);

    console.log("\n✅ Secure deployment complete!");
    console.log("\n📋 Contract Addresses:");
    console.log("MultiSig Wallet:", multiSig.address);
    console.log("TimeLock:", timeLock.address);
    console.log("Security Audit:", securityAudit.address);
    console.log("Secure IP Token:", ipToken.address);

    // Save deployment info
    const deploymentInfo = {
        network: await ethers.provider.getNetwork(),
        deployer: deployer.address,
        contracts: {
            multiSigWallet: multiSig.address,
            timeLock: timeLock.address,
            securityAudit: securityAudit.address,
            ipToken: ipToken.address
        },
        timestamp: new Date().toISOString()
    };

    console.log("\n💾 Deployment Info:", JSON.stringify(deploymentInfo, null, 2));
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });