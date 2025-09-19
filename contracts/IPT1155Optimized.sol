// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract IPT1155Optimized is ERC1155, AccessControl, ReentrancyGuard {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant VALUER_ROLE = keccak256("VALUER_ROLE");
    
    struct IPAsset {
        bytes32 immutableHash;
        address creator;
        uint32 creationTimestamp;
        bytes32 parentIP;
        uint128 aiValuation;
        uint8 confidenceScore;
        bool isActive;
    }
    
    mapping(uint256 => IPAsset) public ipAssets;
    mapping(uint256 => mapping(address => uint16)) public royaltyShares; // Basis points
    
    uint256 private _currentTokenId;
    
    event IPAssetCreated(uint256 indexed tokenId, address indexed creator, bytes32 immutableHash);
    event ValuationUpdated(uint256 indexed tokenId, uint128 newValuation, uint8 confidence);
    
    constructor() ERC1155("https://api.ipingenuity.com/metadata/{id}.json") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
        _grantRole(VALUER_ROLE, msg.sender);
    }
    
    function batchCreateIPAssets(
        bytes32[] calldata _hashes,
        bytes32[] calldata _parentIPs,
        uint256[] calldata _supplies
    ) external returns (uint256[] memory tokenIds) {
        require(_hashes.length == _parentIPs.length && _hashes.length == _supplies.length, "Array length mismatch");
        
        tokenIds = new uint256[](_hashes.length);
        
        for (uint i = 0; i < _hashes.length; i++) {
            uint256 tokenId = ++_currentTokenId;
            tokenIds[i] = tokenId;
            
            ipAssets[tokenId] = IPAsset({
                immutableHash: _hashes[i],
                creator: msg.sender,
                creationTimestamp: uint32(block.timestamp),
                parentIP: _parentIPs[i],
                aiValuation: 0,
                confidenceScore: 0,
                isActive: true
            });
            
            _mint(msg.sender, tokenId, _supplies[i], "");
            emit IPAssetCreated(tokenId, msg.sender, _hashes[i]);
        }
    }
    
    function batchUpdateValuations(
        uint256[] calldata _tokenIds,
        uint128[] calldata _valuations,
        uint8[] calldata _confidences
    ) external onlyRole(VALUER_ROLE) {
        require(_tokenIds.length == _valuations.length && _tokenIds.length == _confidences.length, "Array length mismatch");
        
        for (uint i = 0; i < _tokenIds.length; i++) {
            require(ipAssets[_tokenIds[i]].isActive, "Asset not active");
            require(_confidences[i] <= 100, "Invalid confidence");
            
            ipAssets[_tokenIds[i]].aiValuation = _valuations[i];
            ipAssets[_tokenIds[i]].confidenceScore = _confidences[i];
            
            emit ValuationUpdated(_tokenIds[i], _valuations[i], _confidences[i]);
        }
    }
    
    function getIPAssetsBatch(uint256[] calldata _tokenIds) external view returns (IPAsset[] memory assets) {
        assets = new IPAsset[](_tokenIds.length);
        for (uint i = 0; i < _tokenIds.length; i++) {
            assets[i] = ipAssets[_tokenIds[i]];
        }
    }
    
    function supportsInterface(bytes4 interfaceId) public view virtual override(ERC1155, AccessControl) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}