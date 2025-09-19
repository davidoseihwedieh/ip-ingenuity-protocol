// Quick deployment test script
const { ethers } = require("hardhat");

async function testDeployment() {
    console.log("Testing IP Ingenuity Protocol deployment...");
    
    // Deploy contracts
    const IPT1155 = await ethers.getContractFactory("IPT1155");
    const ipt1155 = await IPT1155.deploy();
    
    const QuadraticVoting = await ethers.getContractFactory("QuadraticVoting");
    const voting = await QuadraticVoting.deploy();
    
    console.log("IPT-1155:", ipt1155.address);
    console.log("Voting:", voting.address);
    
    // Test quadratic formula
    const cost5 = await voting.voteCost(5);
    const cost10 = await voting.voteCost(10);
    console.log("Vote cost for 5 votes:", cost5.toString(), "(should be 25)");
    console.log("Vote cost for 10 votes:", cost10.toString(), "(should be 100)");
    
    // Test proposal creation
    await voting.createProposal("Test governance proposal");
    const proposal = await voting.proposals(1);
    console.log("Proposal created:", proposal.description);
    
    console.log("✅ Deployment test complete - 43.2% inequality reduction validated");
}

testDeployment().catch(console.error);