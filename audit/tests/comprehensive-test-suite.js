const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");

describe("IP Ingenuity Comprehensive Audit Tests", function () {
    async function deployContractsFixture() {
        const [owner, addr1, addr2, addr3, attacker] = await ethers.getSigners();

        // Deploy MultiSig
        const MultiSigWallet = await ethers.getContractFactory("MultiSigWallet");
        const multiSig = await MultiSigWallet.deploy([owner.address, addr1.address, addr2.address], 2);

        // Deploy TimeLock
        const TimeLock = await ethers.getContractFactory("TimeLock");
        const timeLock = await TimeLock.deploy(multiSig.address, 2 * 24 * 60 * 60);

        // Deploy Security Audit
        const SecurityAudit = await ethers.getContractFactory("SecurityAudit");
        const securityAudit = await SecurityAudit.deploy();

        // Deploy IP Token
        const IPT1155Secure = await ethers.getContractFactory("IPT1155Secure");
        const ipToken = await IPT1155Secure.deploy("https://api.test.com/{id}.json", multiSig.address, timeLock.address);

        return { multiSig, timeLock, securityAudit, ipToken, owner, addr1, addr2, addr3, attacker };
    }

    describe("Access Control Security", function () {
        it("Should enforce multi-sig requirements for admin functions", async function () {
            const { ipToken, multiSig, owner, addr1, attacker } = await loadFixture(deployContractsFixture);

            // Attacker cannot directly call admin functions
            await expect(
                ipToken.connect(attacker).pause()
            ).to.be.revertedWith("AccessControl");

            // Single owner cannot execute without multi-sig
            const PAUSER_ROLE = await ipToken.PAUSER_ROLE();
            await expect(
                ipToken.connect(owner).grantRole(PAUSER_ROLE, attacker.address)
            ).to.be.revertedWith("AccessControl");
        });

        it("Should prevent unauthorized token minting", async function () {
            const { ipToken, attacker } = await loadFixture(deployContractsFixture);

            await expect(
                ipToken.connect(attacker).mintIPToken(
                    attacker.address, "Malicious Token", "Desc", "Patent", 1000, 7500, 500, 1
                )
            ).to.be.revertedWith("AccessControl");
        });

        it("Should validate role hierarchy", async function () {
            const { ipToken, multiSig, owner } = await loadFixture(deployContractsFixture);

            const DEFAULT_ADMIN_ROLE = await ipToken.DEFAULT_ADMIN_ROLE();
            const hasAdminRole = await ipToken.hasRole(DEFAULT_ADMIN_ROLE, multiSig.address);
            expect(hasAdminRole).to.be.true;

            const ownerHasAdmin = await ipToken.hasRole(DEFAULT_ADMIN_ROLE, owner.address);
            expect(ownerHasAdmin).to.be.false;
        });
    });

    describe("Reentrancy Protection", function () {
        it("Should prevent reentrancy in minting", async function () {
            const { ipToken, owner } = await loadFixture(deployContractsFixture);

            // Deploy malicious contract that attempts reentrancy
            const MaliciousContract = await ethers.getContractFactory("MaliciousReentrancy");
            const malicious = await MaliciousContract.deploy(ipToken.address);

            await expect(
                malicious.attemptReentrancy()
            ).to.be.revertedWith("ReentrancyGuard");
        });

        it("Should prevent reentrancy in transfers", async function () {
            const { ipToken, owner, addr1 } = await loadFixture(deployContractsFixture);

            // Mint a token first
            await ipToken.mintIPToken(addr1.address, "Test", "Desc", "Patent", 1000, 7500, 500, 1);

            // Attempt reentrancy during transfer should fail
            const MaliciousReceiver = await ethers.getContractFactory("MaliciousReceiver");
            const maliciousReceiver = await MaliciousReceiver.deploy(ipToken.address);

            await expect(
                ipToken.connect(addr1).safeTransferFrom(addr1.address, maliciousReceiver.address, 1, 1, "0x")
            ).to.be.revertedWith("ReentrancyGuard");
        });
    });

    describe("Input Validation", function () {
        it("Should validate minting parameters", async function () {
            const { ipToken, owner } = await loadFixture(deployContractsFixture);

            // Zero address
            await expect(
                ipToken.mintIPToken(ethers.constants.AddressZero, "Test", "Desc", "Patent", 1000, 7500, 500, 1)
            ).to.be.revertedWith("Cannot mint to zero address");

            // Empty title
            await expect(
                ipToken.mintIPToken(owner.address, "", "Desc", "Patent", 1000, 7500, 500, 1)
            ).to.be.revertedWith("Title cannot be empty");

            // Zero valuation
            await expect(
                ipToken.mintIPToken(owner.address, "Test", "Desc", "Patent", 0, 7500, 500, 1)
            ).to.be.revertedWith("Valuation must be positive");

            // Low confidence
            await expect(
                ipToken.mintIPToken(owner.address, "Test", "Desc", "Patent", 1000, 4000, 500, 1)
            ).to.be.revertedWith("Confidence too low");

            // High royalty
            await expect(
                ipToken.mintIPToken(owner.address, "Test", "Desc", "Patent", 1000, 7500, 1500, 1)
            ).to.be.revertedWith("Royalty too high");

            // Zero amount
            await expect(
                ipToken.mintIPToken(owner.address, "Test", "Desc", "Patent", 1000, 7500, 500, 0)
            ).to.be.revertedWith("Amount must be positive");
        });

        it("Should validate transfer parameters", async function () {
            const { ipToken, owner, addr1 } = await loadFixture(deployContractsFixture);

            // Mint token first
            await ipToken.mintIPToken(owner.address, "Test", "Desc", "Patent", 1000, 7500, 500, 1);

            // Transfer to zero address should fail
            await expect(
                ipToken.safeTransferFrom(owner.address, ethers.constants.AddressZero, 1, 1, "0x")
            ).to.be.revertedWith("ERC1155: transfer to the zero address");

            // Transfer non-existent token
            await expect(
                ipToken.safeTransferFrom(owner.address, addr1.address, 999, 1, "0x")
            ).to.be.revertedWith("ERC1155: insufficient balance");
        });
    });

    describe("Integer Overflow Protection", function () {
        it("Should handle large valuations safely", async function () {
            const { ipToken, owner } = await loadFixture(deployContractsFixture);

            const maxUint256 = ethers.constants.MaxUint256;
            
            // Should not overflow with large valuation
            await expect(
                ipToken.mintIPToken(owner.address, "Test", "Desc", "Patent", maxUint256, 7500, 500, 1)
            ).to.not.be.reverted;
        });

        it("Should handle royalty calculations safely", async function () {
            const { ipToken, owner, addr1 } = await loadFixture(deployContractsFixture);

            // Mint with maximum royalty
            await ipToken.mintIPToken(owner.address, "Test", "Desc", "Patent", 1000, 7500, 1000, 1000);

            // Transfer should not overflow royalty calculation
            await expect(
                ipToken.safeTransferFrom(owner.address, addr1.address, 1, 500, "0x")
            ).to.not.be.reverted;
        });
    });

    describe("Emergency Controls", function () {
        it("Should allow emergency pause by authorized role", async function () {
            const { ipToken, multiSig, owner } = await loadFixture(deployContractsFixture);

            // Grant pauser role through multi-sig (simplified for test)
            const PAUSER_ROLE = await ipToken.PAUSER_ROLE();
            
            // Simulate multi-sig granting role
            await ipToken.grantRole(PAUSER_ROLE, owner.address);
            
            // Pause contract
            await ipToken.connect(owner).pause();
            
            // Minting should fail when paused
            await expect(
                ipToken.mintIPToken(owner.address, "Test", "Desc", "Patent", 1000, 7500, 500, 1)
            ).to.be.revertedWith("Pausable: paused");
        });

        it("Should allow token freezing", async function () {
            const { ipToken, owner, addr1 } = await loadFixture(deployContractsFixture);

            // Mint token
            await ipToken.mintIPToken(owner.address, "Test", "Desc", "Patent", 1000, 7500, 500, 1);

            // Grant pauser role and freeze token
            const PAUSER_ROLE = await ipToken.PAUSER_ROLE();
            await ipToken.grantRole(PAUSER_ROLE, owner.address);
            await ipToken.freezeToken(1, "Security concern");

            // Transfer should fail for frozen token
            await expect(
                ipToken.safeTransferFrom(owner.address, addr1.address, 1, 1, "0x")
            ).to.be.revertedWith("Token is frozen");
        });
    });

    describe("Business Logic Validation", function () {
        it("Should calculate royalties correctly", async function () {
            const { ipToken, owner, addr1 } = await loadFixture(deployContractsFixture);

            // Mint token with 5% royalty
            await ipToken.mintIPToken(owner.address, "Test", "Desc", "Patent", 1000, 7500, 500, 1000);

            const initialBalance = await ipToken.royaltyBalances(1, owner.address);
            
            // Transfer 100 tokens (should generate 5 royalty tokens)
            await ipToken.safeTransferFrom(owner.address, addr1.address, 1, 100, "0x");

            const finalBalance = await ipToken.royaltyBalances(1, owner.address);
            expect(finalBalance.sub(initialBalance)).to.equal(5);
        });

        it("Should maintain token metadata integrity", async function () {
            const { ipToken, owner } = await loadFixture(deployContractsFixture);

            await ipToken.mintIPToken(owner.address, "Test Patent", "Description", "Patent", 50000, 8500, 750, 1);

            const tokenData = await ipToken.getIPToken(1);
            expect(tokenData.title).to.equal("Test Patent");
            expect(tokenData.description).to.equal("Description");
            expect(tokenData.ipType).to.equal("Patent");
            expect(tokenData.valuation).to.equal(50000);
            expect(tokenData.confidenceScore).to.equal(8500);
            expect(tokenData.royaltyPercentage).to.equal(750);
            expect(tokenData.creator).to.equal(owner.address);
        });
    });

    describe("Gas Optimization Tests", function () {
        it("Should use reasonable gas for minting", async function () {
            const { ipToken, owner } = await loadFixture(deployContractsFixture);

            const tx = await ipToken.mintIPToken(owner.address, "Test", "Desc", "Patent", 1000, 7500, 500, 1);
            const receipt = await tx.wait();
            
            // Should use less than 200k gas for minting
            expect(receipt.gasUsed).to.be.lt(200000);
        });

        it("Should optimize batch operations", async function () {
            const { ipToken, owner, addr1 } = await loadFixture(deployContractsFixture);

            // Mint multiple tokens
            await ipToken.mintIPToken(owner.address, "Test1", "Desc", "Patent", 1000, 7500, 500, 100);
            await ipToken.mintIPToken(owner.address, "Test2", "Desc", "Patent", 1000, 7500, 500, 100);

            // Batch transfer should be more efficient than individual transfers
            const batchTx = await ipToken.safeBatchTransferFrom(
                owner.address, addr1.address, [1, 2], [50, 50], "0x"
            );
            const batchReceipt = await batchTx.wait();

            // Should use less than 150k gas for batch transfer
            expect(batchReceipt.gasUsed).to.be.lt(150000);
        });
    });
});

// Malicious contracts for reentrancy testing
contract("MaliciousReentrancy", function () {
    constructor(address _target) {
        target = _target;
    }
    
    function attemptReentrancy() external {
        // This should fail due to reentrancy guard
        IPT1155Secure(target).mintIPToken(address(this), "Malicious", "Desc", "Patent", 1000, 7500, 500, 1);
    }
});

contract("MaliciousReceiver", function () {
    constructor(address _target) {
        target = _target;
    }
    
    function onERC1155Received(address, address, uint256, uint256, bytes memory) external returns (bytes4) {
        // Attempt reentrancy during transfer
        IPT1155Secure(target).mintIPToken(address(this), "Malicious", "Desc", "Patent", 1000, 7500, 500, 1);
        return this.onERC1155Received.selector;
    }
});