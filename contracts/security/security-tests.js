const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Security Contracts", function () {
    let multiSig, timeLock, ipToken, securityAudit;
    let owner, addr1, addr2, addr3;

    beforeEach(async function () {
        [owner, addr1, addr2, addr3] = await ethers.getSigners();

        // Deploy MultiSig
        const MultiSigWallet = await ethers.getContractFactory("MultiSigWallet");
        multiSig = await MultiSigWallet.deploy([owner.address, addr1.address, addr2.address], 2);

        // Deploy TimeLock
        const TimeLock = await ethers.getContractFactory("TimeLock");
        timeLock = await TimeLock.deploy(multiSig.address, 2 * 24 * 60 * 60);

        // Deploy Security Audit
        const SecurityAudit = await ethers.getContractFactory("SecurityAudit");
        securityAudit = await SecurityAudit.deploy();

        // Deploy IP Token
        const IPT1155Secure = await ethers.getContractFactory("IPT1155Secure");
        ipToken = await IPT1155Secure.deploy("https://api.test.com/{id}.json", multiSig.address, timeLock.address);
    });

    describe("MultiSig Wallet", function () {
        it("Should require multiple confirmations", async function () {
            // Submit transaction
            await multiSig.submitTransaction(addr3.address, ethers.utils.parseEther("1"), "0x");
            
            // First confirmation
            await multiSig.confirmTransaction(0);
            
            // Should not execute with only 1 confirmation
            await expect(multiSig.executeTransaction(0)).to.be.revertedWith("cannot execute tx");
            
            // Second confirmation
            await multiSig.connect(addr1).confirmTransaction(0);
            
            // Now should execute (but will fail due to insufficient balance)
            await expect(multiSig.executeTransaction(0)).to.be.revertedWith("tx failed");
        });

        it("Should prevent non-owners from submitting transactions", async function () {
            await expect(
                multiSig.connect(addr3).submitTransaction(addr3.address, 0, "0x")
            ).to.be.revertedWith("not owner");
        });
    });

    describe("TimeLock", function () {
        it("Should enforce delay period", async function () {
            const eta = Math.floor(Date.now() / 1000) + (2 * 24 * 60 * 60) + 100; // 2 days + buffer
            
            // Queue transaction
            await multiSig.submitTransaction(
                timeLock.address,
                0,
                ethers.utils.id("queueTransaction(address,uint256,string,bytes,uint256)").slice(0, 10)
            );
            
            // Confirm and execute to queue in TimeLock
            await multiSig.confirmTransaction(0);
            await multiSig.connect(addr1).confirmTransaction(0);
        });

        it("Should prevent execution before delay", async function () {
            const eta = Math.floor(Date.now() / 1000) + 100; // Too soon
            
            await expect(
                timeLock.executeTransaction(addr3.address, 0, "", "0x", eta)
            ).to.be.revertedWith("Transaction hasn't surpassed time lock");
        });
    });

    describe("Secure IP Token", function () {
        it("Should mint tokens with proper validation", async function () {
            await expect(
                ipToken.mintIPToken(
                    addr1.address,
                    "Test Patent",
                    "Test Description",
                    "Patent",
                    ethers.utils.parseEther("100"),
                    7500, // 75% confidence
                    500,  // 5% royalty
                    1
                )
            ).to.emit(ipToken, "IPTokenMinted");
        });

        it("Should reject low confidence tokens", async function () {
            await expect(
                ipToken.mintIPToken(
                    addr1.address,
                    "Test Patent",
                    "Test Description",
                    "Patent",
                    ethers.utils.parseEther("100"),
                    3000, // 30% confidence - too low
                    500,
                    1
                )
            ).to.be.revertedWith("Confidence too low");
        });

        it("Should freeze tokens when needed", async function () {
            // Mint token first
            await ipToken.mintIPToken(addr1.address, "Test", "Desc", "Patent", 100, 7500, 500, 1);
            
            // Freeze token
            const PAUSER_ROLE = await ipToken.PAUSER_ROLE();
            await ipToken.grantRole(PAUSER_ROLE, owner.address);
            await ipToken.freezeToken(1, "Security concern");
            
            // Should prevent transfers
            await expect(
                ipToken.connect(addr1).safeTransferFrom(addr1.address, addr2.address, 1, 1, "0x")
            ).to.be.revertedWith("Token is frozen");
        });

        it("Should pause contract in emergency", async function () {
            const PAUSER_ROLE = await ipToken.PAUSER_ROLE();
            await ipToken.grantRole(PAUSER_ROLE, owner.address);
            
            await ipToken.pause();
            
            await expect(
                ipToken.mintIPToken(addr1.address, "Test", "Desc", "Patent", 100, 7500, 500, 1)
            ).to.be.revertedWith("Pausable: paused");
        });
    });

    describe("Security Audit", function () {
        it("Should record audit results", async function () {
            const issues = ["Issue 1", "Issue 2"];
            
            await securityAudit.auditContract(ipToken.address, issues, 25);
            
            const result = await securityAudit.getAuditResult(ipToken.address);
            expect(result.passed).to.be.true;
            expect(result.riskScore).to.equal(25);
        });

        it("Should fail contracts with high risk", async function () {
            const issues = ["Critical vulnerability"];
            
            await securityAudit.auditContract(ipToken.address, issues, 80);
            
            const result = await securityAudit.getAuditResult(ipToken.address);
            expect(result.passed).to.be.false;
        });
    });
});