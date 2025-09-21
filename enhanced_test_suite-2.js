// test/CreatorBonds.test.js
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Enhanced CreatorBonds", function () {
  let creatorBonds;
  let ipRegistry;
  let owner;
  let creator1;
  let creator2;
  let supporter1;
  let supporter2;
  let feeRecipient;

  const MINIMUM_BOND = ethers.utils.parseEther("0.01");
  const PLATFORM_FEE = 5000; // 50% in basis points
  const BOND_AMOUNT = ethers.utils.parseEther("1.0");
  
  beforeEach(async function () {
    [owner, creator1, creator2, supporter1, supporter2, feeRecipient] = await ethers.getSigners();

    // Deploy Mock IP Registry
    const MockIPTokenRegistry = await ethers.getContractFactory("MockIPTokenRegistry");
    ipRegistry = await MockIPTokenRegistry.deploy();
    await ipRegistry.deployed();

    // Deploy CreatorBonds
    const CreatorBonds = await ethers.getContractFactory("CreatorBonds");
    creatorBonds = await CreatorBonds.deploy(
      ipRegistry.address,
      MINIMUM_BOND,
      PLATFORM_FEE,
      feeRecipient.address
    );
    await creatorBonds.deployed();
  });

  describe("Deployment", function () {
    it("Should set the correct initial parameters", async function () {
      expect(await creatorBonds.ipTokenRegistry()).to.equal(ipRegistry.address);
      expect(await creatorBonds.minimumBondAmount()).to.equal(MINIMUM_BOND);
      expect(await creatorBonds.platformFee()).to.equal(PLATFORM_FEE);
      expect(await creatorBonds.feeRecipient()).to.equal(feeRecipient.address);
      expect(await creatorBonds.owner()).to.equal(owner.address);
    });

    it("Should start with no bonds", async function () {
      expect(await creatorBonds.nextBondId()).to.equal(1);
      expect(await creatorBonds.totalActiveBonds()).to.equal(0);
    });
  });

  describe("IP Token Integration", function () {
    let tokenId;

    beforeEach(async function () {
      // Create an IP token
      const tx = await ipRegistry.connect(creator1).createToken(
        "https://example.com/metadata/1",
        1000,
        500 // 5% royalty
      );
      const receipt = await tx.wait();
      tokenId = receipt.events[0].args.tokenId;
    });

    it("Should create bond for valid IP token", async function () {
      await expect(
        creatorBonds.connect(creator1).createBond(
          tokenId,
          BOND_AMOUNT,
          7 * 24 * 3600, // 7 days
          "Test bond description",
          { value: BOND_AMOUNT }
        )
      ).to.emit(creatorBonds, "BondCreated");
    });

    it("Should reject bond creation for non-existent token", async function () {
      await expect(
        creatorBonds.connect(creator1).createBond(
          999, // Non-existent token
          BOND_AMOUNT,
          7 * 24 * 3600,
          "Test bond",
          { value: BOND_AMOUNT }
        )
      ).to.be.revertedWith("IP token does not exist");
    });

    it("Should only allow token creator to create bonds", async function () {
      await expect(
        creatorBonds.connect(creator2).createBond(
          tokenId,
          BOND_AMOUNT,
          7 * 24 * 3600,
          "Test bond",
          { value: BOND_AMOUNT }
        )
      ).to.be.revertedWith("Only IP token creator can create bonds");
    });
  });

  describe("Bond Creation", function () {
    let tokenId;

    beforeEach(async function () {
      const tx = await ipRegistry.connect(creator1).createToken(
        "https://example.com/metadata/1",
        1000,
        500
      );
      const receipt = await tx.wait();
      tokenId = receipt.events[0].args.tokenId;
    });

    it("Should create bond with correct parameters", async function () {
      const duration = 7 * 24 * 3600;
      const description = "Test bond description";
      
      const tx = await creatorBonds.connect(creator1).createBond(
        tokenId,
        BOND_AMOUNT,
        duration,
        description,
        { value: BOND_AMOUNT }
      );

      const receipt = await tx.wait();
      const bondId = receipt.events[receipt.events.length - 1].args.bondId;
      
      const bond = await creatorBonds.getBond(bondId);
      expect(bond.creator).to.equal(creator1.address);
      expect(bond.ipTokenId).to.equal(tokenId);
      expect(bond.targetAmount).to.equal(BOND_AMOUNT);
      expect(bond.currentAmount).to.equal(BOND_AMOUNT);
      expect(bond.description).to.equal(description);
      expect(bond.isActive).to.be.true;
    });

    it("Should reject bonds below minimum amount", async function () {
      const smallAmount = ethers.utils.parseEther("0.005");
      
      await expect(
        creatorBonds.connect(creator1).createBond(
          tokenId,
          smallAmount,
          7 * 24 * 3600,
          "Small bond",
          { value: smallAmount }
        )
      ).to.be.revertedWith("Bond amount too small");
    });

    it("Should reject bonds with insufficient initial funding", async function () {
      await expect(
        creatorBonds.connect(creator1).createBond(
          tokenId,
          BOND_AMOUNT,
          7 * 24 * 3600,
          "Test bond",
          { value: BOND_AMOUNT.sub(ethers.utils.parseEther("0.1")) }
        )
      ).to.be.revertedWith("Insufficient initial funding");
    });

    it("Should update bond statistics", async function () {
      await creatorBonds.connect(creator1).createBond(
        tokenId,
        BOND_AMOUNT,
        7 * 24 * 3600,
        "Test bond",
        { value: BOND_AMOUNT }
      );

      expect(await creatorBonds.totalActiveBonds()).to.equal(1);
    });
  });

  describe("Bond Support", function () {
    let tokenId;
    let bondId;

    beforeEach(async function () {
      // Create IP token
      const createTokenTx = await ipRegistry.connect(creator1).createToken(
        "https://example.com/metadata/1",
        1000,
        500
      );
      const createTokenReceipt = await createTokenTx.wait();
      tokenId = createTokenReceipt.events[0].args.tokenId;

      // Create bond
      const createBondTx = await creatorBonds.connect(creator1).createBond(
        tokenId,
        BOND_AMOUNT,
        7 * 24 * 3600,
        "Test bond",
        { value: BOND_AMOUNT }
      );
      const createBondReceipt = await createBondTx.wait();
      bondId = createBondReceipt.events[createBondReceipt.events.length - 1].args.bondId;
    });

    it("Should allow supporters to contribute", async function () {
      const supportAmount = ethers.utils.parseEther("0.5");
      
      await expect(
        creatorBonds.connect(supporter1).supportBond(bondId, { value: supportAmount })
      ).to.emit(creatorBonds, "BondSupported")
        .withArgs(bondId, supporter1.address, supportAmount);

      const bond = await creatorBonds.getBond(bondId);
      expect(bond.currentAmount).to.equal(BOND_AMOUNT.add(supportAmount));
    });

    it("Should track supporter contributions", async function () {
      const supportAmount = ethers.utils.parseEther("0.3");
      
      await creatorBonds.connect(supporter1).supportBond(bondId, { value: supportAmount });
      
      const contribution = await creatorBonds.getContribution(bondId, supporter1.address);
      expect(contribution).to.equal(supportAmount);
    });

    it("Should reject contributions to inactive bonds", async function () {
      // Deactivate bond
      await creatorBonds.connect(creator1).deactivateBond(bondId);
      
      await expect(
        creatorBonds.connect(supporter1).supportBond(bondId, { value: ethers.utils.parseEther("0.1") })
      ).to.be.revertedWith("Bond is not active");
    });
  });

  describe("Bond Management", function () {
    let tokenId;
    let bondId;

    beforeEach(async function () {
      // Create IP token and bond
      const createTokenTx = await ipRegistry.connect(creator1).createToken(
        "https://example.com/metadata/1",
        1000,
        500
      );
      const createTokenReceipt = await createTokenTx.wait();
      tokenId = createTokenReceipt.events[0].args.tokenId;

      const createBondTx = await creatorBonds.connect(creator1).createBond(
        tokenId,
        BOND_AMOUNT,
        7 * 24 * 3600,
        "Test bond",
        { value: BOND_AMOUNT }
      );
      const createBondReceipt = await createBondTx.wait();
      bondId = createBondReceipt.events[createBondReceipt.events.length - 1].args.bondId;
    });

    it("Should allow creator to deactivate bond", async function () {
      await expect(creatorBonds.connect(creator1).deactivateBond(bondId))
        .to.emit(creatorBonds, "BondDeactivated")
        .withArgs(bondId);

      const bond = await creatorBonds.getBond(bondId);
      expect(bond.isActive).to.be.false;
    });

    it("Should not allow non-creator to deactivate bond", async function () {
      await expect(
        creatorBonds.connect(supporter1).deactivateBond(bondId)
      ).to.be.revertedWith("Only bond creator can deactivate");
    });

    it("Should allow creator to withdraw funds", async function () {
      const initialBalance = await creator1.getBalance();
      const bond = await creatorBonds.getBond(bondId);
      
      const tx = await creatorBonds.connect(creator1).withdrawBondFunds(bondId);
      const receipt = await tx.wait();
      const gasUsed = receipt.gasUsed.mul(receipt.effectiveGasPrice);
      
      const finalBalance = await creator1.getBalance();
      const expectedWithdrawal = bond.currentAmount.mul(10000 - PLATFORM_FEE).div(10000);
      
      expect(finalBalance).to.be.closeTo(
        initialBalance.add(expectedWithdrawal).sub(gasUsed),
        ethers.utils.parseEther("0.001")
      );
    });

    it("Should distribute platform fees correctly", async function () {
      const initialFeeRecipientBalance = await feeRecipient.getBalance();
      
      await creatorBonds.connect(creator1).withdrawBondFunds(bondId);
      
      const finalFeeRecipientBalance = await feeRecipient.getBalance();
      const expectedFee = BOND_AMOUNT.mul(PLATFORM_FEE).div(10000);
      
      expect(finalFeeRecipientBalance).to.equal(
        initialFeeRecipientBalance.add(expectedFee)
      );
    });
  });

  describe("Advanced Features", function () {
    let tokenId1, tokenId2;
    let bondId1, bondId2;

    beforeEach(async function () {
      // Create multiple IP tokens
      const createToken1Tx = await ipRegistry.connect(creator1).createToken(
        "https://example.com/metadata/1",
        1000,
        500
      );
      const createToken1Receipt = await createToken1Tx.wait();
      tokenId1 = createToken1Receipt.events[0].args.tokenId;

      const createToken2Tx = await ipRegistry.connect(creator2).createToken(
        "https://example.com/metadata/2",
        2000,
        750
      );
      const createToken2Receipt = await createToken2Tx.wait();
      tokenId2 = createToken2Receipt.events[0].args.tokenId;

      // Create multiple bonds
      const createBond1Tx = await creatorBonds.connect(creator1).createBond(
        tokenId1,
        BOND_AMOUNT,
        7 * 24 * 3600,
        "First bond",
        { value: BOND_AMOUNT }
      );
      const createBond1Receipt = await createBond1Tx.wait();
      bondId1 = createBond1Receipt.events[createBond1Receipt.events.length - 1].args.bondId;

      const createBond2Tx = await creatorBonds.connect(creator2).createBond(
        tokenId2,
        BOND_AMOUNT.mul(2),
        14 * 24 * 3600,
        "Second bond",
        { value: BOND_AMOUNT.mul(2) }
      );
      const createBond2Receipt = await createBond2Tx.wait();
      bondId2 = createBond2Receipt.events[createBond2Receipt.events.length - 1].args.bondId;
    });

    it("Should track multiple bonds correctly", async function () {
      expect(await creatorBonds.totalActiveBonds()).to.equal(2);
      
      const creatorBonds1 = await creatorBonds.getCreatorBonds(creator1.address);
      const creatorBonds2 = await creatorBonds.getCreatorBonds(creator2.address);
      
      expect(creatorBonds1.length).to.equal(1);
      expect(creatorBonds2.length).to.equal(1);
      expect(creatorBonds1[0]).to.equal(bondId1);
      expect(creatorBonds2[0]).to.equal(bondId2);
    });

    it("Should handle cross-bond support", async function () {
      const supportAmount = ethers.utils.parseEther("0.2");
      
      // Support both bonds from same supporter
      await creatorBonds.connect(supporter1).supportBond(bondId1, { value: supportAmount });
      await creatorBonds.connect(supporter1).supportBond(bondId2, { value: supportAmount });
      
      const contribution1 = await creatorBonds.getContribution(bondId1, supporter1.address);
      const contribution2 = await creatorBonds.getContribution(bondId2, supporter1.address);
      
      expect(contribution1).to.equal(supportAmount);
      expect(contribution2).to.equal(supportAmount);
    });

    it("Should calculate bond statistics correctly", async function () {
      // Add some support to bonds
      await creatorBonds.connect(supporter1).supportBond(bondId1, { 
        value: ethers.utils.parseEther("0.5") 
      });
      await creatorBonds.connect(supporter2).supportBond(bondId2, { 
        value: ethers.utils.parseEther("1.0") 
      });

      const bond1 = await creatorBonds.getBond(bondId1);
      const bond2 = await creatorBonds.getBond(bondId2);
      
      expect(bond1.currentAmount).to.equal(BOND_AMOUNT.add(ethers.utils.parseEther("0.5")));
      expect(bond2.currentAmount).to.equal(BOND_AMOUNT.mul(2).add(ethers.utils.parseEther("1.0")));
    });
  });

  describe("Emergency Functions", function () {
    let tokenId;
    let bondId;

    beforeEach(async function () {
      const createTokenTx = await ipRegistry.connect(creator1).createToken(
        "https://example.com/metadata/1",
        1000,
        500
      );
      const createTokenReceipt = await createTokenTx.wait();
      tokenId = createTokenReceipt.events[0].args.tokenId;

      const createBondTx = await creatorBonds.connect(creator1).createBond(
        tokenId,
        BOND_AMOUNT,
        7 * 24 * 3600,
        "Test bond",
        { value: BOND_AMOUNT }
      );
      const createBondReceipt = await createBondTx.wait();
      bondId = createBondReceipt.events[createBondReceipt.events.length - 1].args.bondId;
    });

    it("Should allow owner to pause contract", async function () {
      await creatorBonds.connect(owner).pause();
      expect(await creatorBonds.paused()).to.be.true;
      
      await expect(
        creatorBonds.connect(supporter1).supportBond(bondId, { 
          value: ethers.utils.parseEther("0.1") 
        })
      ).to.be.revertedWith("Pausable: paused");
    });

    it("Should allow owner to update platform fee", async function () {
      const newFee = 3000; // 30%
      
      await expect(creatorBonds.connect(owner).updatePlatformFee(newFee))
        .to.emit(creatorBonds, "PlatformFeeUpdated")
        .withArgs(PLATFORM_FEE, newFee);
        
      expect(await creatorBonds.platformFee()).to.equal(newFee);
    });

    it("Should reject invalid platform fee updates", async function () {
      await expect(
        creatorBonds.connect(owner).updatePlatformFee(10001) // >100%
      ).to.be.revertedWith("Fee too high");
    });
  });

  describe("View Functions", function () {
    let tokenId;
    let bondId;

    beforeEach(async function () {
      const createTokenTx = await ipRegistry.connect(creator1).createToken(
        "https://example.com/metadata/1",
        1000,
        500
      );
      const createTokenReceipt = await createTokenTx.wait();
      tokenId = createTokenReceipt.events[0].args.tokenId;

      const createBondTx = await creatorBonds.connect(creator1).createBond(
        tokenId,
        BOND_AMOUNT,
        7 * 24 * 3600,
        "Test bond",
        { value: BOND_AMOUNT }
      );
      const createBondReceipt = await createBondTx.wait();
      bondId = createBondReceipt.events[createBondReceipt.events.length - 1].args.bondId;
    });

    it("Should return bond details correctly", async function () {
      const bond = await creatorBonds.getBond(bondId);
      
      expect(bond.creator).to.equal(creator1.address);
      expect(bond.ipTokenId).to.equal(tokenId);
      expect(bond.targetAmount).to.equal(BOND_AMOUNT);
      expect(bond.currentAmount).to.equal(BOND_AMOUNT);
      expect(bond.isActive).to.be.true;
    });

    it("Should return creator's bonds", async function () {
      const bonds = await creatorBonds.getCreatorBonds(creator1.address);
      expect(bonds.length).to.equal(1);
      expect(bonds[0]).to.equal(bondId);
    });

    it("Should return supporter's contributions", async function () {
      const supportAmount = ethers.utils.parseEther("0.3");
      await creatorBonds.connect(supporter1).supportBond(bondId, { value: supportAmount });
      
      const contribution = await creatorBonds.getContribution(bondId, supporter1.address);
      expect(contribution).to.equal(supportAmount);
    });
  });

  describe("Gas Optimization Tests", function () {
    it("Should optimize gas for batch operations", async function () {
      // Test batch token creation
      const metadataURIs = [
        "https://example.com/1",
        "https://example.com/2", 
        "https://example.com/3"
      ];
      const supplies = [1000, 2000, 1500];
      const royalties = [500, 750, 600];
      
      const tx = await ipRegistry.connect(creator1).batchCreateTokens(
        metadataURIs,
        supplies,
        royalties
      );
      
      const receipt = await tx.wait();
      console.log(`Batch token creation gas used: ${receipt.gasUsed}`);
      
      // Should be more efficient than individual calls
      expect(receipt.gasUsed.toNumber()).to.be.lessThan(1000000);
    });
  });
});