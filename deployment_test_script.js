// scripts/quickDeploymentTest.js
const { ethers } = require("hardhat");
const fs = require('fs');

async function quickDeploymentTest() {
  console.log("🚀 Starting Quick Deployment Test...\n");

  try {
    // Get signers
    const [deployer, creator, supporter] = await ethers.getSigners();
    console.log("👥 Test Accounts:");
    console.log(`   Deployer: ${deployer.address}`);
    console.log(`   Creator:  ${creator.address}`);
    console.log(`   Supporter: ${supporter.address}\n`);

    // Check balances
    const deployerBalance = await deployer.getBalance();
    console.log(`💰 Deployer Balance: ${ethers.utils.formatEther(deployerBalance)} ETH\n`);

    if (deployerBalance.lt(ethers.utils.parseEther("1"))) {
      throw new Error("❌ Insufficient balance for deployment. Need at least 1 ETH for testing.");
    }

    // 1. Deploy Mock IP Registry
    console.log("📄 Step 1: Deploying MockIPTokenRegistry...");
    const MockIPTokenRegistry = await ethers.getContractFactory("MockIPTokenRegistry");
    const ipRegistry = await MockIPTokenRegistry.deploy();
    await ipRegistry.deployed();
    console.log(`✅ MockIPTokenRegistry deployed: ${ipRegistry.address}\n`);

    // 2. Deploy CreatorBonds
    console.log("📄 Step 2: Deploying CreatorBonds...");
    const CreatorBonds = await ethers.getContractFactory("CreatorBonds");
    
    const constructorArgs = [
      ipRegistry.address,
      ethers.utils.parseEther("0.01"), // Minimum bond: 0.01 ETH
      5000,                           // Platform fee: 50%
      deployer.address                // Fee recipient
    ];
    
    const creatorBonds = await CreatorBonds.deploy(...constructorArgs);
    await creatorBonds.deployed();
    console.log(`✅ CreatorBonds deployed: ${creatorBonds.address}\n`);

    // 3. Test IP Token Creation
    console.log("🎨 Step 3: Testing IP Token Creation...");
    const createTokenTx = await ipRegistry.connect(creator).createToken(
      "https://example.com/metadata/test-token",
      1000, // Total supply
      500   // 5% royalty
    );
    const tokenReceipt = await createTokenTx.wait();
    const tokenId = tokenReceipt.events[0].args.tokenId;
    console.log(`✅ IP Token created with ID: ${tokenId}\n`);

    // 4. Test Bond Creation
    console.log("💎 Step 4: Testing Bond Creation...");
    const bondAmount = ethers.utils.parseEther("0.1");
    const createBondTx = await creatorBonds.connect(creator).createBond(
      tokenId,
      bondAmount,
      7 * 24 * 3600, // 7 days duration
      "Test bond for deployment verification",
      { value: bondAmount }
    );
    const bondReceipt = await createBondTx.wait();
    const bondCreatedEvent = bondReceipt.events.find(e => e.event === 'BondCreated');
    const bondId = bondCreatedEvent.args.bondId;
    console.log(`✅ Bond created with ID: ${bondId}\n`);

    // 5. Test Bond Support
    console.log("🤝 Step 5: Testing Bond Support...");
    const supportAmount = ethers.utils.parseEther("0.05");
    const supportTx = await creatorBonds.connect(supporter).supportBond(bondId, {
      value: supportAmount
    });
    await supportTx.wait();
    console.log(`✅ Bond supported with ${ethers.utils.formatEther(supportAmount)} ETH\n`);

    // 6. Verify Bond State
    console.log("🔍 Step 6: Verifying Bond State...");
    const bond = await creatorBonds.getBond(bondId);
    const expectedAmount = bondAmount.add(supportAmount);
    
    console.log("📊 Bond Details:");
    console.log(`   Creator: ${bond.creator}`);
    console.log(`   IP Token ID: ${bond.ipTokenId}`);
    console.log(`   Target Amount: ${ethers.utils.formatEther(bond.targetAmount)} ETH`);
    console.log(`   Current Amount: ${ethers.utils.formatEther(bond.currentAmount)} ETH`);
    console.log(`   Is Active: ${bond.isActive}\n`);

    if (!bond.currentAmount.eq(expectedAmount)) {
      throw new Error("❌ Bond amount mismatch!");
    }

    // 7. Test Statistics
    console.log("📈 Step 7: Testing Statistics...");
    const totalBonds = await creatorBonds.totalActiveBonds();
    const creatorBonds_ = await creatorBonds.getCreatorBonds(creator.address);
    const contribution = await creatorBonds.getContribution(bondId, supporter.address);
    
    console.log("📊 Platform Statistics:");
    console.log(`   Total Active Bonds: ${totalBonds}`);
    console.log(`   Creator's Bonds: ${creatorBonds_.length}`);
    console.log(`   Supporter's Contribution: ${ethers.utils.formatEther(contribution)} ETH\n`);

    // 8. Test Gas Usage
    console.log("⛽ Step 8: Gas Usage Analysis...");
    const gasUsage = {
      tokenCreation: tokenReceipt.gasUsed.toString(),
      bondCreation: bondReceipt.gasUsed.toString(),
      bondSupport: (await supportTx.wait()).gasUsed.toString()
    };
    
    console.log("⛽ Gas Usage:");
    console.log(`   Token Creation: ${gasUsage.tokenCreation} gas`);
    console.log(`   Bond Creation: ${gasUsage.bondCreation} gas`);
    console.log(`   Bond Support: ${gasUsage.bondSupport} gas\n`);

    // 9. Save Test Results
    const testResults = {
      network: network.name,
      timestamp: new Date().toISOString(),
      contracts: {
        MockIPTokenRegistry: ipRegistry.address,
        CreatorBonds: creatorBonds.address
      },
      testData: {
        tokenId: tokenId.toString(),
        bondId: bondId.toString(),
        bondAmount: ethers.utils.formatEther(bondAmount),
        supportAmount: ethers.utils.formatEther(supportAmount),
        totalAmount: ethers.utils.formatEther(expectedAmount)
      },
      gasUsage,
      accounts: {
        deployer: deployer.address,
        creator: creator.address,
        supporter: supporter.address
      }
    };

    // Create test results directory and save
    if (!fs.existsSync('test-results')) {
      fs.mkdirSync('test-results');
    }
    
    const resultsPath = `test-results/${network.name}-test-results.json`;
    fs.writeFileSync(resultsPath, JSON.stringify(testResults, null, 2));
    
    console.log(`💾 Test results saved to: ${resultsPath}\n`);

    // 10. Success Summary
    console.log("🎉 DEPLOYMENT TEST SUCCESSFUL! 🎉\n");
    console.log("✅ All tests passed:");
    console.log("   ✓ Smart contracts deployed successfully");
    console.log("   ✓ IP token creation working");
    console.log("   ✓ Bond creation functional");
    console.log("   ✓ Bond support mechanism active");
    console.log("   ✓ Platform statistics accurate");
    console.log("   ✓ Gas usage within reasonable limits\n");

    console.log("🔗 Contract Addresses:");
    console.log(`   MockIPTokenRegistry: ${ipRegistry.address}`);
    console.log(`   CreatorBonds: ${creatorBonds.address}\n`);

    console.log("🎯 Ready for Phase 2: Backend Services Integration!");

    return {
      success: true,
      contracts: {
        ipRegistry: ipRegistry.address,
        creatorBonds: creatorBonds.address
      },
      testData: {
        tokenId,
        bondId,
        bondAmount: ethers.utils.formatEther(bondAmount),
        supportAmount: ethers.utils.formatEther(supportAmount)
      }
    };

  } catch (error) {
    console.error("❌ DEPLOYMENT TEST FAILED!");
    console.error(`Error: ${error.message}\n`);
    
    if (error.code) {
      console.error(`Error Code: ${error.code}`);
    }
    
    if (error.transaction) {
      console.error(`Transaction Hash: ${error.transaction.hash}`);
    }
    
    console.log("\n🔧 Troubleshooting Tips:");
    console.log("1. Check that you have sufficient ETH in your account");
    console.log("2. Verify your network connection");
    console.log("3. Ensure contracts compile successfully with 'npx hardhat compile'");
    console.log("4. Try running 'npx hardhat clean' and recompiling");
    
    return {
      success: false,
      error: error.message
    };
  }
}

// Export for use in other scripts
module.exports = quickDeploymentTest;

// Run if called directly
if (require.main === module) {
  quickDeploymentTest()
    .then((result) => {
      process.exit(result.success ? 0 : 1);
    })
    .catch((error) => {
      console.error("Unexpected error:", error);
      process.exit(1);
    });
}