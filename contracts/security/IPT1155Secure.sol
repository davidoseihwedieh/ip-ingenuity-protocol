// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract IPT1155Secure is ERC1155, AccessControl, Pausable, ReentrancyGuard {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");

    struct IPToken {
        string title;
        string description;
        string ipType;
        uint256 valuation;
        uint256 confidenceScore;
        address creator;
        uint256 royaltyPercentage;
        bool frozen;
        uint256 createdAt;
    }

    mapping(uint256 => IPToken) public ipTokens;
    mapping(uint256 => mapping(address => uint256)) public royaltyBalances;
    mapping(address => bool) public authorizedMinters;
    
    uint256 private _currentTokenId;
    uint256 public constant MAX_ROYALTY = 1000; // 10%
    uint256 public constant MIN_CONFIDENCE = 5000; // 50%
    
    address public multiSigWallet;
    address public timeLock;
    
    event IPTokenMinted(uint256 indexed tokenId, address indexed creator, string title, uint256 valuation);
    event RoyaltyDistributed(uint256 indexed tokenId, address indexed recipient, uint256 amount);
    event TokenFrozen(uint256 indexed tokenId, string reason);
    event EmergencyWithdraw(address indexed token, uint256 amount);

    modifier onlyMultiSig() {
        require(msg.sender == multiSigWallet, "Only MultiSig can call this");
        _;
    }

    modifier onlyTimeLock() {
        require(msg.sender == timeLock, "Only TimeLock can call this");
        _;
    }

    modifier tokenExists(uint256 tokenId) {
        require(tokenId <= _currentTokenId && tokenId > 0, "Token does not exist");
        _;
    }

    modifier notFrozen(uint256 tokenId) {
        require(!ipTokens[tokenId].frozen, "Token is frozen");
        _;
    }

    constructor(
        string memory uri,
        address _multiSigWallet,
        address _timeLock
    ) ERC1155(uri) {
        require(_multiSigWallet != address(0), "Invalid MultiSig address");
        require(_timeLock != address(0), "Invalid TimeLock address");
        
        _grantRole(DEFAULT_ADMIN_ROLE, _multiSigWallet);
        _grantRole(MINTER_ROLE, msg.sender);
        _grantRole(PAUSER_ROLE, _multiSigWallet);
        _grantRole(UPGRADER_ROLE, _timeLock);
        
        multiSigWallet = _multiSigWallet;
        timeLock = _timeLock;
    }

    function mintIPToken(
        address to,
        string memory title,
        string memory description,
        string memory ipType,
        uint256 valuation,
        uint256 confidenceScore,
        uint256 royaltyPercentage,
        uint256 amount
    ) public onlyRole(MINTER_ROLE) whenNotPaused nonReentrant returns (uint256) {
        require(to != address(0), "Cannot mint to zero address");
        require(bytes(title).length > 0, "Title cannot be empty");
        require(valuation > 0, "Valuation must be positive");
        require(confidenceScore >= MIN_CONFIDENCE, "Confidence too low");
        require(royaltyPercentage <= MAX_ROYALTY, "Royalty too high");
        require(amount > 0, "Amount must be positive");

        _currentTokenId++;
        uint256 tokenId = _currentTokenId;

        ipTokens[tokenId] = IPToken({
            title: title,
            description: description,
            ipType: ipType,
            valuation: valuation,
            confidenceScore: confidenceScore,
            creator: to,
            royaltyPercentage: royaltyPercentage,
            frozen: false,
            createdAt: block.timestamp
        });

        _mint(to, tokenId, amount, "");
        
        emit IPTokenMinted(tokenId, to, title, valuation);
        return tokenId;
    }

    function safeTransferFrom(
        address from,
        address to,
        uint256 id,
        uint256 amount,
        bytes memory data
    ) public override tokenExists(id) notFrozen(id) {
        super.safeTransferFrom(from, to, id, amount, data);
        
        // Distribute royalties
        _distributeRoyalty(id, amount);
    }

    function safeBatchTransferFrom(
        address from,
        address to,
        uint256[] memory ids,
        uint256[] memory amounts,
        bytes memory data
    ) public override {
        for (uint256 i = 0; i < ids.length; i++) {
            require(ids[i] <= _currentTokenId && ids[i] > 0, "Token does not exist");
            require(!ipTokens[ids[i]].frozen, "Token is frozen");
        }
        
        super.safeBatchTransferFrom(from, to, ids, amounts, data);
        
        // Distribute royalties for each token
        for (uint256 i = 0; i < ids.length; i++) {
            _distributeRoyalty(ids[i], amounts[i]);
        }
    }

    function _distributeRoyalty(uint256 tokenId, uint256 amount) internal {
        IPToken storage token = ipTokens[tokenId];
        if (token.royaltyPercentage > 0) {
            uint256 royaltyAmount = (amount * token.royaltyPercentage) / 10000;
            royaltyBalances[tokenId][token.creator] += royaltyAmount;
            
            emit RoyaltyDistributed(tokenId, token.creator, royaltyAmount);
        }
    }

    function freezeToken(uint256 tokenId, string memory reason) public onlyRole(PAUSER_ROLE) tokenExists(tokenId) {
        ipTokens[tokenId].frozen = true;
        emit TokenFrozen(tokenId, reason);
    }

    function unfreezeToken(uint256 tokenId) public onlyMultiSig tokenExists(tokenId) {
        ipTokens[tokenId].frozen = false;
    }

    function pause() public onlyRole(PAUSER_ROLE) {
        _pause();
    }

    function unpause() public onlyMultiSig {
        _unpause();
    }

    function emergencyWithdraw(address token, uint256 amount) public onlyMultiSig {
        if (token == address(0)) {
            payable(multiSigWallet).transfer(amount);
        } else {
            IERC20(token).transfer(multiSigWallet, amount);
        }
        emit EmergencyWithdraw(token, amount);
    }

    function updateMultiSig(address newMultiSig) public onlyTimeLock {
        require(newMultiSig != address(0), "Invalid address");
        multiSigWallet = newMultiSig;
        _grantRole(DEFAULT_ADMIN_ROLE, newMultiSig);
        _grantRole(PAUSER_ROLE, newMultiSig);
    }

    function getIPToken(uint256 tokenId) public view tokenExists(tokenId) returns (IPToken memory) {
        return ipTokens[tokenId];
    }

    function getCurrentTokenId() public view returns (uint256) {
        return _currentTokenId;
    }

    function supportsInterface(bytes4 interfaceId) public view virtual override(ERC1155, AccessControl) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}