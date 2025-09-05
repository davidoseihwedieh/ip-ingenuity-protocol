async function main() {
  console.log("🚀 Deploying IP Ingenuity Protocol...");

  // Deploy IPT1155 Token
  const IPT1155 = await ethers.getContractFactory("IPT1155");
  const ipt1155 = await IPT1155.deploy();
  await ipt1155.deployed();
  console.log("✅ IPT1155 deployed to:", ipt1155.address);

  // Deploy Cross-Chain Bridge
  const CrossChainBridge = await ethers.getContractFactory("CrossChainIPBridge");
  const bridge = await CrossChainBridge.deploy(ipt1155.address, "0x0000000000000000000000000000000000000000");
  await bridge.deployed();
  console.log("✅ CrossChainBridge deployed to:", bridge.address);

  // Deploy DAO Governance
  const DAO = await ethers.getContractFactory("IPGovernanceDAO");
  const dao = await DAO.deploy("0x0000000000000000000000000000000000000000");
  await dao.deployed();
  console.log("✅ IPGovernanceDAO deployed to:", dao.address);

  console.log("\n🎯 Deployment Summary:");
  console.log("IPT1155 Token:", ipt1155.address);
  console.log("Cross-Chain Bridge:", bridge.address);
  console.log("DAO Governance:", dao.address);
  console.log("\n✨ IP Ingenuity Protocol deployed successfully!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });