// test/CreatorBonds.test.js
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Enhanced CreatorBonds", function () {
    let creatorBonds;
    let ipRegistry;
    let owner;
    let creator1;
    let creator2;
    let fan1;
    let fan2;
    let investor1;

    beforeEach(async function () {
        [owner, creator1, creator2, fan1, fan2, investor1] = await ethers.getSigners();

        // Deploy Mock IP Registry
        const IPRegistry = await ethers.getContractFactory("MockIPTokenRegistry");
        ipRegistry = await IPRegistry.deploy();
        await ipRegistry.deployed();

        // Deploy CreatorBonds
        const CreatorBonds = await ethers.getContractFactory("CreatorBonds");
        creatorBonds = await CreatorBonds.deploy(ipRegistry.address);
        await creatorBonds.deployed();

        // Setup test data
        await ipRegistry.addIPHolder(investor1.address, ethers.utils.parseEther("50"));
    });

    describe("Creator Bond Creation", function () {
        it("Should create a new creator bond", async function () {
            const monthlyPrice = ethers.utils.parseEther("0.01");
            const metadataURI = "https://example.com/metadata/1";

            await expect(
                creatorBonds.connect(creator1).createBondToken(monthlyPrice, metadataURI)
            ).to.emit(creatorBonds, "BondCreated");

            const bond = await creatorBonds.getCreatorBond(1);
            expect(bond.creator).to.equal(creator1.address);
            expect(bond.monthlyPrice).to.equal(monthlyPrice);
            expect(bond.metadataURI).to.equal(metadataURI);
        });

        it("Should mint creator tokens to creator", async function () {
            const monthlyPrice = ethers.utils.parseEther("0.01");
            await creatorBonds.connect(creator1).createBondToken(monthlyPrice, "metadata");

            const balance = await creatorBonds.balanceOf(creator1.address, 1);
            expect(balance).to.equal(1000); // 1000 creator tokens minted
        });
    });

    describe("Fan Subscriptions", function () {
        beforeEach(async function () {
            // Create a creator bond
            await creatorBonds.connect(creator1).createBondToken(
                ethers.utils.parseEther("0.01"), 
                "metadata"
            );
        });

        it("Should allow fan to subscribe to creator", async function () {
            const subscriptionPrice = ethers.utils.parseEther("0.01");

            await expect(
                creatorBonds.connect(fan1).subscribe(1, { value: subscriptionPrice })
            ).to.emit(creatorBonds, "SubscriptionCreated");

            const subscription = await creatorBonds.subscriptions(fan1.address, 1);
            expect(subscription.active).to.be.true;
            expect(subscription.monthlyAmount).to.equal(subscriptionPrice);
        });

        it("Should give discount to IP investors", async function () {
            const basePrice = ethers.utils.parseEther("0.01");
            
            // Regular fan price
            const fanPrice = await creatorBonds.calculateSubscriptionPrice(1, fan1.address);
            expect(fanPrice).to.equal(basePrice);

            // IP investor price (should have 15% discount)
            const investorPrice = await creatorBonds.calculateSubscriptionPrice(1, investor1.address);
            const expectedPrice = basePrice.mul(85).div(100); // 15% discount
            expect(investorPrice).to.equal(expectedPrice);
        });

        it("Should award fan tokens on subscription", async function () {
            const subscriptionPrice = ethers.utils.parseEther("0.01");
            
            await creatorBonds.connect(fan1).subscribe(1, { value: subscriptionPrice });
            
            const fanTokens = await creatorBonds.balanceOf(fan1.address, 1);
            expect(fanTokens).to.equal(10); // 10 fan tokens awarded
        });

        it("Should calculate fan level correctly", async function () {
            // Subscribe and get tokens
            await creatorBonds.connect(fan1).subscribe(1, { 
                value: ethers.utils.parseEther("0.01") 
            });

            const [level, levelName] = await creatorBonds.getUserFanLevel(fan1.address);
            expect(level).to.equal(1); // Should be level 1 (Supporter) with 10 tokens
            expect(levelName).to.equal("Supporter");
        });

        it("Should prevent double subscription", async function () {
            const subscriptionPrice = ethers.utils.parseEther("0.01");
            
            await creatorBonds.connect(fan1).subscribe(1, { value: subscriptionPrice });
            
            await expect(
                creatorBonds.connect(fan1).subscribe(1, { value: subscriptionPrice })
            ).to.be.revertedWith("Already subscribed");
        });
    });

    describe("Subscription Renewal", function () {
        beforeEach(async function () {
            await creatorBonds.connect(creator1).createBondToken(
                ethers.utils.parseEther("0.01"), 
                "metadata"
            );
            await creatorBonds.connect(fan1).subscribe(1, { 
                value: ethers.utils.parseEther("0.01") 
            });
        });

        it("Should allow subscription renewal", async function () {
            await expect(
                creatorBonds.connect(fan1).renewSubscription(1, { 
                    value: ethers.utils.parseEther("0.01") 
                })
            ).to.emit(creatorBonds, "SubscriptionRenewed");

            // Should get additional fan tokens
            const fanTokens = await creatorBonds.balanceOf(fan1.address, 1);
            expect(fanTokens).to.equal(15); // 10 + 5 renewal bonus
        });

        it("Should update fan level on renewal with more tokens", async function () {
            // Manually increase fan's token balance to trigger level up
            await creatorBonds.connect(owner).safeTransferFrom(
                creator1.address, 
                fan1.address, 
                1, 
                25, 
                "0x"
            );

            await creatorBonds.connect(fan1).renewSubscription(1, { 
                value: ethers.utils.parseEther("0.01") 
            });

            const [level, levelName] = await creatorBonds.getUserFanLevel(fan1.address);
            expect(level).to.be.greaterThan(1);
        });
    });

    describe("Cross-Platform Integration", function () {
        beforeEach(async function () {
            await creatorBonds.connect(creator1).createBondToken(
                ethers.utils.parseEther("0.01"), 
                "metadata"
            );
        });

        it("Should give IP investors bonus in fan level calculation", async function () {
            // Make user an IP investor first
            await ipRegistry.addIPHolder(fan1.address, ethers.utils.parseEther("10"));

            const [level, levelName] = await creatorBonds.getUserFanLevel(fan1.address);
            
            // Should get bonus tokens for being IP investor
            expect(level).to.be.greaterThan(0);
        });

        it("Should track cross-platform fan score", async function () {
            await creatorBonds.connect(fan1).subscribe(1, { 
                value: ethers.utils.parseEther("0.01") 
            });

            const fanScore = await creatorBonds.userFanScores(fan1.address);
            expect(fanScore).to.equal(100); // Initial subscription gives 100 points
        });

        it("Should unlock IP investor benefits at 1000 points", async function () {
            // Simulate high fan activity
            for (let i = 0; i < 10; i++) {
                await creatorBonds.connect(fan1).renewSubscription(1, { 
                    value: ethers.utils.parseEther("0.01") 
                });
            }

            const hasDiscount = await creatorBonds.ipInvestorDiscounts(fan1.address);
            expect(hasDiscount).to.be.true;
        });
    });

    describe("Batch Operations", function () {
        beforeEach(async function () {
            // Create multiple creator bonds
            await creatorBonds.connect(creator1).createBondToken(
                ethers.utils.parseEther("0.01"), 
                "metadata1"
            );
            await creatorBonds.connect(creator2).createBondToken(
                ethers.utils.parseEther("0.02"), 
                "metadata2"
            );

            // Subscribe to both
            await creatorBonds.connect(fan1).subscribe(1, { 
                value: ethers.utils.parseEther("0.01") 
            });
            await creatorBonds.connect(fan1).subscribe(2, { 
                value: ethers.utils.parseEther("0.02") 
            });
        });

        it("Should allow batch renewal of subscriptions", async function () {
            const totalCost = ethers.utils.parseEther("0.03"); // 0.01 + 0.02

            await expect(
                creatorBonds.connect(fan1).batchRenewSubscriptions([1, 2], { 
                    value: totalCost 
                })
            ).to.emit(creatorBonds, "SubscriptionRenewed");
        });

        it("Should revert batch renewal with insufficient payment", async function () {
            const insufficientPayment = ethers.utils.parseEther("0.02");

            await expect(
                creatorBonds.connect(fan1).batchRenewSubscriptions([1, 2], { 
                    value: insufficientPayment 
                })
            ).to.be.revertedWith("Insufficient payment for batch renewal");
        });
    });

    describe("Revenue Distribution", function () {
        beforeEach(async function () {
            await creatorBonds.connect(creator1).createBondToken(
                ethers.utils.parseEther("0.01"), 
                "metadata"
            );
        });

        it("Should distribute revenue correctly on subscription", async function () {
            const initialCreatorBalance = await ethers.provider.getBalance(creator1.address);
            const initialOwnerBalance = await ethers.provider.getBalance(owner.address);

            await creatorBonds.connect(fan1).subscribe(1, { 
                value: ethers.utils.parseEther("0.01") 
            });

            const finalCreatorBalance = await ethers.provider.getBalance(creator1.address);
            const finalOwnerBalance = await ethers.provider.getBalance(owner.address);

            // Creator should receive 70% = 0.007 ETH
            const creatorIncrease = finalCreatorBalance.sub(initialCreatorBalance);
            expect(creatorIncrease).to.equal(ethers.utils.parseEther("0.007"));

            // Platform should receive 10% = 0.001 ETH
            const ownerIncrease = finalOwnerBalance.sub(initialOwnerBalance);
            expect(ownerIncrease).to.equal(ethers.utils.parseEther("0.001"));
        });
    });

    describe("Admin Functions", function () {
        it("Should allow owner to update fee structure", async function () {
            await creatorBonds.updateFeeStructure(15, 25, 60);

            expect(await creatorBonds.platformFeePercent()).to.equal(15);
            expect(await creatorBonds.holderFeePercent()).to.equal(25);
            expect(await creatorBonds.creatorFeePercent()).to.equal(60);
        });

        it("Should reject invalid fee structure", async function () {
            await expect(
                creatorBonds.updateFeeStructure(50, 50, 50)
            ).to.be.revertedWith("Fees must sum to 100");
        });

        it("Should allow emergency pause", async function () {
            await creatorBonds.connect(creator1).createBondToken(
                ethers.utils.parseEther("0.01"), 
                "metadata"
            );

            await creatorBonds.emergencyPause(1);

            const bond = await creatorBonds.getCreatorBond(1);
            expect(bond.active).to.be.false;
        });
    });
});

// Additional integration tests
describe("Cross-Platform Integration Tests", function () {
    // ... more comprehensive integration tests
});