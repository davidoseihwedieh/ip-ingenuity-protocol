// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract IPT1155 is ERC1155, AccessControl, ReentrancyGuard {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant VALUER_ROLE = keccak256("VALUER_ROLE");
    
    struct IPAsset {
        bytes32 immutableHash;
        address creator;
        uint256 creationTimestamp;
        bytes32 parentIP;
        uint256 aiValuation;
        uint256 confidenceScore;
        string metadataURI;
        bool isActive;
    }
    
    struct RoyaltyInfo {
        address recipient;
        uint256 percentage; // Basis points (10000 = 100%)
    }
    
    mapping(uint256 => IPAsset) public ipAssets;
    mapping(uint256 => mapping(address => uint256)) public royaltyShares;
    mapping(uint256 => RoyaltyInfo[]) public royaltyRecipients;
    mapping(uint256 => address) public governanceContracts;
    
    uint256 private _currentTokenId;
    
    event IPAssetCreated(uint256 indexed tokenId, address indexed creator, bytes32 immutableHash);
    event ValuationUpdated(uint256 indexed tokenId, uint256 newValuation, uint256 confidence);
    event RoyaltyDistributed(uint256 indexed tokenId, address indexed recipient, uint256 amount);
    
    constructor() ERC1155("https://api.ipingenuity.com/metadata/{id}.json") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
        _grantRole(VALUER_ROLE, msg.sender);
    }
    
    function createIPAsset(
        bytes32 _immutableHash,
        bytes32 _parentIP,
        string memory _metadataURI,
        uint256 _initialSupply,
        RoyaltyInfo[] memory _royalties
    ) external returns (uint256) {
        require(_immutableHash != bytes32(0), "Invalid hash");
        
        uint256 tokenId = ++_currentTokenId;
        
        ipAssets[tokenId] = IPAsset({
            immutableHash: _immutableHash,
            creator: msg.sender,
            creationTimestamp: block.timestamp,
            parentIP: _parentIP,
            aiValuation: 0,
            confidenceScore: 0,
            metadataURI: _metadataURI,
            isActive: true
        });
        
        // Set royalty recipients
        for (uint i = 0; i < _royalties.length; i++) {
            royaltyRecipients[tokenId].push(_royalties[i]);
            royaltyShares[tokenId][_royalties[i].recipient] = _royalties[i].percentage;
        }
        
        _mint(msg.sender, tokenId, _initialSupply, "");
        
        emit IPAssetCreated(tokenId, msg.sender, _immutableHash);
        return tokenId;
    }
    
    function updateValuation(
        uint256 _tokenId,
        uint256 _valuation,
        uint256 _confidence
    ) external onlyRole(VALUER_ROLE) {
        require(ipAssets[_tokenId].isActive, "Asset not active");
        require(_confidence <= 100, "Invalid confidence score");
        
        ipAssets[_tokenId].aiValuation = _valuation;
        ipAssets[_tokenId].confidenceScore = _confidence;
        
        emit ValuationUpdated(_tokenId, _valuation, _confidence);
    }
    
    function distributeRoyalties(uint256 _tokenId) external payable nonReentrant {
        require(msg.value > 0, "No payment provided");
        require(ipAssets[_tokenId].isActive, "Asset not active");
        
        RoyaltyInfo[] memory recipients = royaltyRecipients[_tokenId];
        
        for (uint i = 0; i < recipients.length; i++) {
            uint256 amount = (msg.value * recipients[i].percentage) / 10000;
            if (amount > 0) {
                payable(recipients[i].recipient).transfer(amount);
                emit RoyaltyDistributed(_tokenId, recipients[i].recipient, amount);
            }
        }
    }
    
    function getIPAsset(uint256 _tokenId) external view returns (IPAsset memory) {
        return ipAssets[_tokenId];
    }
    
    function supportsInterface(bytes4 interfaceId) public view virtual override(ERC1155, AccessControl) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}