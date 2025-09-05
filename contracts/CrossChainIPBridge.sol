// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

interface ICCIP {
    function sendMessage(uint256 destinationChain, bytes calldata message) external returns (bytes32);
}

interface IIPT1155 {
    function safeTransferFrom(address from, address to, uint256 id, uint256 amount, bytes calldata data) external;
    function balanceOf(address account, uint256 id) external view returns (uint256);
    function getIPAsset(uint256 tokenId) external view returns (
        bytes32 immutableHash,
        address creator,
        uint256 creationTimestamp,
        bytes32 parentIP,
        uint256 aiValuation,
        uint256 confidenceScore,
        string memory metadataURI,
        bool isActive
    );
}

contract CrossChainIPBridge is ReentrancyGuard, AccessControl, Pausable {
    bytes32 public constant VALIDATOR_ROLE = keccak256("VALIDATOR_ROLE");
    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");
    
    uint256 public constant REQUIRED_VALIDATORS = 3;
    uint256 public constant TIME_LOCK_DURATION = 24 hours;
    
    struct BridgeRequest {
        uint256 tokenId;
        address sourceOwner;
        uint256 sourceChain;
        uint256 destinationChain;
        address destinationAddress;
        uint256 amount;
        bytes32 requestHash;
        uint256 timestamp;
        bool executed;
        uint256 validatorCount;
        mapping(address => bool) validatorApprovals;
    }
    
    struct ChainConfig {
        bool isSupported;
        address bridgeContract;
        uint256 minConfirmations;
        bool requiresCompliance;
    }
    
    mapping(bytes32 => BridgeRequest) public bridgeRequests;
    mapping(uint256 => ChainConfig) public supportedChains;
    mapping(uint256 => mapping(uint256 => address)) public wrappedContracts;
    mapping(bytes32 => bool) public processedMessages;
    
    IIPT1155 public immutable ipt1155Contract;
    ICCIP public immutable ccipContract;
    
    event BridgeRequestCreated(bytes32 indexed requestHash, uint256 indexed tokenId, uint256 destinationChain);
    event ValidatorApproval(bytes32 indexed requestHash, address indexed validator);
    event AssetBridged(bytes32 indexed requestHash, uint256 indexed tokenId, address indexed recipient);
    event EmergencyWithdraw(uint256 indexed tokenId, address indexed owner, uint256 amount);
    
    modifier onlyValidator() {
        require(hasRole(VALIDATOR_ROLE, msg.sender), "Not a validator");
        _;
    }
    
    modifier onlyOperator() {
        require(hasRole(OPERATOR_ROLE, msg.sender), "Not an operator");
        _;
    }
    
    constructor(address _ipt1155Contract, address _ccipContract) {
        ipt1155Contract = IIPT1155(_ipt1155Contract);
        ccipContract = ICCIP(_ccipContract);
        
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(VALIDATOR_ROLE, msg.sender);
        _grantRole(OPERATOR_ROLE, msg.sender);
    }
    
    function bridgeIPAsset(
        uint256 tokenId,
        uint256 destinationChain,
        address destinationAddress,
        uint256 amount
    ) external nonReentrant whenNotPaused {
        require(supportedChains[destinationChain].isSupported, "Destination chain not supported");
        require(destinationAddress != address(0), "Invalid destination address");
        require(amount > 0, "Amount must be greater than 0");
        require(
            ipt1155Contract.balanceOf(msg.sender, tokenId) >= amount,
            "Insufficient token balance"
        );
        
        // Generate unique request hash
        bytes32 requestHash = keccak256(
            abi.encodePacked(
                tokenId,
                msg.sender,
                block.chainid,
                destinationChain,
                destinationAddress,
                amount,
                block.timestamp
            )
        );
        
        // Lock the asset
        ipt1155Contract.safeTransferFrom(msg.sender, address(this), tokenId, amount, "");
        
        // Create bridge request
        BridgeRequest storage request = bridgeRequests[requestHash];
        request.tokenId = tokenId;
        request.sourceOwner = msg.sender;
        request.sourceChain = block.chainid;
        request.destinationChain = destinationChain;
        request.destinationAddress = destinationAddress;
        request.amount = amount;
        request.requestHash = requestHash;
        request.timestamp = block.timestamp;
        request.executed = false;
        request.validatorCount = 0;
        
        emit BridgeRequestCreated(requestHash, tokenId, destinationChain);
    }
    
    function validateBridgeRequest(bytes32 requestHash) external onlyValidator {
        BridgeRequest storage request = bridgeRequests[requestHash];
        require(request.requestHash == requestHash, "Request does not exist");
        require(!request.executed, "Request already executed");
        require(!request.validatorApprovals[msg.sender], "Already validated by this validator");
        
        // Perform compliance checks if required
        if (supportedChains[request.destinationChain].requiresCompliance) {
            require(_performComplianceCheck(request), "Compliance check failed");
        }
        
        request.validatorApprovals[msg.sender] = true;
        request.validatorCount++;
        
        emit ValidatorApproval(requestHash, msg.sender);
        
        // Execute if enough validators approved and time lock passed
        if (request.validatorCount >= REQUIRED_VALIDATORS && 
            block.timestamp >= request.timestamp + TIME_LOCK_DURATION) {
            _executeBridgeRequest(requestHash);
        }
    }
    
    function _executeBridgeRequest(bytes32 requestHash) internal {
        BridgeRequest storage request = bridgeRequests[requestHash];
        require(!request.executed, "Already executed");
        
        request.executed = true;
        
        // Get IP asset metadata
        (
            bytes32 immutableHash,
            address creator,
            uint256 creationTimestamp,
            bytes32 parentIP,
            uint256 aiValuation,
            uint256 confidenceScore,
            string memory metadataURI,
            bool isActive
        ) = ipt1155Contract.getIPAsset(request.tokenId);
        
        // Prepare cross-chain message
        bytes memory message = abi.encode(
            request.tokenId,
            request.destinationAddress,
            request.amount,
            immutableHash,
            creator,
            creationTimestamp,
            parentIP,
            aiValuation,
            confidenceScore,
            metadataURI,
            isActive
        );
        
        // Send cross-chain message
        ccipContract.sendMessage(request.destinationChain, message);
        
        emit AssetBridged(requestHash, request.tokenId, request.destinationAddress);
    }
    
    function _performComplianceCheck(BridgeRequest storage request) internal view returns (bool) {
        // Simplified compliance check - in production, this would integrate with
        // regulatory APIs and perform KYC/AML checks
        
        // Check if asset is active
        (, , , , , , , bool isActive) = ipt1155Contract.getIPAsset(request.tokenId);
        if (!isActive) return false;
        
        // Check destination address is not blacklisted (simplified)
        if (request.destinationAddress == address(0)) return false;
        
        // Additional compliance checks would go here
        return true;
    }
    
    function emergencyWithdraw(uint256 tokenId, uint256 amount) external onlyOperator {
        // Emergency function to return locked assets
        require(amount > 0, "Amount must be greater than 0");
        
        // In production, this would have additional safeguards and governance
        ipt1155Contract.safeTransferFrom(address(this), msg.sender, tokenId, amount, "");
        
        emit EmergencyWithdraw(tokenId, msg.sender, amount);
    }
    
    function addSupportedChain(
        uint256 chainId,
        address bridgeContract,
        uint256 minConfirmations,
        bool requiresCompliance
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        supportedChains[chainId] = ChainConfig({
            isSupported: true,
            bridgeContract: bridgeContract,
            minConfirmations: minConfirmations,
            requiresCompliance: requiresCompliance
        });
    }
    
    function removeSupportedChain(uint256 chainId) external onlyRole(DEFAULT_ADMIN_ROLE) {
        delete supportedChains[chainId];
    }
    
    function setWrappedContract(
        uint256 sourceChain,
        uint256 destinationChain,
        address wrappedContract
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        wrappedContracts[sourceChain][destinationChain] = wrappedContract;
    }
    
    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }
    
    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }
    
    function getBridgeRequest(bytes32 requestHash) external view returns (
        uint256 tokenId,
        address sourceOwner,
        uint256 sourceChain,
        uint256 destinationChain,
        address destinationAddress,
        uint256 amount,
        uint256 timestamp,
        bool executed,
        uint256 validatorCount
    ) {
        BridgeRequest storage request = bridgeRequests[requestHash];
        return (
            request.tokenId,
            request.sourceOwner,
            request.sourceChain,
            request.destinationChain,
            request.destinationAddress,
            request.amount,
            request.timestamp,
            request.executed,
            request.validatorCount
        );
    }
    
    function isValidatorApproved(bytes32 requestHash, address validator) external view returns (bool) {
        return bridgeRequests[requestHash].validatorApprovals[validator];
    }
}