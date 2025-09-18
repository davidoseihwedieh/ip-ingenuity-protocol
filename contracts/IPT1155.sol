// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract IPT1155 is ERC1155, Ownable, ReentrancyGuard {
    struct IPMetadata {
        bytes32 contentHash;
        uint256 royaltyPercent;
        address creator;
        uint256 totalSupply;
        bool exists;
    }
    
    mapping(uint256 => IPMetadata) public metadata;
    mapping(uint256 => mapping(address => uint256)) public royaltyBalances;
    
    constructor() ERC1155("https://api.ipingenuity.com/metadata/{id}.json") {}
    
    function mintWithMetadata(
        uint256 tokenId, 
        uint256 amount, 
        bytes32 contentHash, 
        uint256 royaltyPercent
    ) external {
        require(royaltyPercent <= 50, "Royalty too high");
        _mint(msg.sender, tokenId, amount, "");
        metadata[tokenId] = IPMetadata({
            contentHash: contentHash,
            royaltyPercent: royaltyPercent,
            creator: msg.sender,
            totalSupply: amount,
            exists: true
        });
    }
    
    function distributeRoyalty(uint256 tokenId) external payable nonReentrant {
        require(metadata[tokenId].exists, "Token does not exist");
        uint256 royaltyAmount = (msg.value * metadata[tokenId].royaltyPercent) / 100;
        royaltyBalances[tokenId][metadata[tokenId].creator] += royaltyAmount;
    }
}
