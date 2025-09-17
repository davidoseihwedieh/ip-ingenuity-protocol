// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract IPT1155 is ERC1155, Ownable, ReentrancyGuard {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;

    struct IPAsset {
        string name;
        string description;
        bytes32 contentHash;
        uint256 royaltyPercent;
        address creator;
        uint256 totalSupply;
        uint256 tokenPrice;
        uint256 fundingTarget;
        uint256 fundsRaised;
        uint256 deadline;
        bool active;
        string[] milestones;
    }

    struct Investment {
        address investor;
        uint256 amount;
        uint256 timestamp;
    }

    mapping(uint256 => IPAsset) public ipAssets;
    mapping(uint256 => Investment[]) public investments;
    mapping(uint256 => mapping(address => uint256)) public royaltyBalances;
    mapping(address => uint256[]) public creatorAssets;
    mapping(address => uint256[]) public investorAssets;

    event IPAssetCreated(uint256 indexed tokenId, address indexed creator, string name);
    event TokensPurchased(uint256 indexed tokenId, address indexed investor, uint256 amount);
    event RoyaltyDistributed(uint256 indexed tokenId, uint256 amount);
    event MilestoneCompleted(uint256 indexed tokenId, string milestone);

    constructor() ERC1155("https://api.ipingenuity.com/metadata/{id}.json") {}

    function createIPAsset(
        string memory name,
        string memory description,
        bytes32 contentHash,
        uint256 royaltyPercent,
        uint256 totalSupply,
        uint256 tokenPrice,
        uint256 fundingTarget,
        uint256 durationDays,
        string[] memory milestones
    ) external returns (uint256) {
        require(royaltyPercent <= 50, "Royalty too high");
        require(totalSupply > 0, "Supply must be positive");
        require(tokenPrice > 0, "Price must be positive");

        _tokenIds.increment();
        uint256 tokenId = _tokenIds.current();

        ipAssets[tokenId] = IPAsset({
            name: name,
            description: description,
            contentHash: contentHash,
            royaltyPercent: royaltyPercent,
            creator: msg.sender,
            totalSupply: totalSupply,
            tokenPrice: tokenPrice,
            fundingTarget: fundingTarget,
            fundsRaised: 0,
            deadline: block.timestamp + (durationDays * 1 days),
            active: true,
            milestones: milestones
        });

        creatorAssets[msg.sender].push(tokenId);
        _mint(msg.sender, tokenId, totalSupply, "");

        emit IPAssetCreated(tokenId, msg.sender, name);
        return tokenId;
    }

    function purchaseTokens(uint256 tokenId, uint256 amount) external payable nonReentrant {
        IPAsset storage asset = ipAssets[tokenId];
        require(asset.active, "Asset not active");
        require(block.timestamp < asset.deadline, "Campaign ended");
        require(amount > 0, "Amount must be positive");
        
        uint256 cost = amount * asset.tokenPrice;
        require(msg.value >= cost, "Insufficient payment");

        require(balanceOf(asset.creator, tokenId) >= amount, "Insufficient tokens available");

        _safeTransferFrom(asset.creator, msg.sender, tokenId, amount, "");
        
        asset.fundsRaised += msg.value;
        investments[tokenId].push(Investment({
            investor: msg.sender,
            amount: amount,
            timestamp: block.timestamp
        }));

        if (investorAssets[msg.sender].length == 0 || 
            investorAssets[msg.sender][investorAssets[msg.sender].length - 1] != tokenId) {
            investorAssets[msg.sender].push(tokenId);
        }

        payable(asset.creator).transfer(msg.value);

        emit TokensPurchased(tokenId, msg.sender, amount);
    }

    function distributeRoyalty(uint256 tokenId) external payable nonReentrant {
        IPAsset storage asset = ipAssets[tokenId];
        require(msg.value > 0, "No royalty to distribute");

        uint256 totalTokens = asset.totalSupply;
        Investment[] memory tokenInvestments = investments[tokenId];

        for (uint i = 0; i < tokenInvestments.length; i++) {
            address investor = tokenInvestments[i].investor;
            uint256 investorTokens = balanceOf(investor, tokenId);
            
            if (investorTokens > 0) {
                uint256 royaltyShare = (msg.value * investorTokens) / totalTokens;
                royaltyBalances[tokenId][investor] += royaltyShare;
            }
        }

        emit RoyaltyDistributed(tokenId, msg.value);
    }

    function withdrawRoyalty(uint256 tokenId) external nonReentrant {
        uint256 amount = royaltyBalances[tokenId][msg.sender];
        require(amount > 0, "No royalty to withdraw");

        royaltyBalances[tokenId][msg.sender] = 0;
        payable(msg.sender).transfer(amount);
    }

    function getIPAsset(uint256 tokenId) external view returns (IPAsset memory) {
        return ipAssets[tokenId];
    }

    function getInvestments(uint256 tokenId) external view returns (Investment[] memory) {
        return investments[tokenId];
    }

    function getCreatorAssets(address creator) external view returns (uint256[] memory) {
        return creatorAssets[creator];
    }

    function getInvestorAssets(address investor) external view returns (uint256[] memory) {
        return investorAssets[investor];
    }

    function getCurrentTokenId() external view returns (uint256) {
        return _tokenIds.current();
    }
}