// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract SecurityAudit {
    struct AuditResult {
        bool passed;
        string[] issues;
        uint256 riskScore;
        uint256 timestamp;
    }

    mapping(address => AuditResult) public auditResults;
    mapping(address => bool) public authorizedAuditors;
    
    address public owner;
    uint256 public constant MAX_RISK_SCORE = 100;
    uint256 public constant ACCEPTABLE_RISK = 30;

    event ContractAudited(address indexed contractAddr, bool passed, uint256 riskScore);
    event AuditorAuthorized(address indexed auditor);
    event AuditorRevoked(address indexed auditor);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }

    modifier onlyAuditor() {
        require(authorizedAuditors[msg.sender], "Only authorized auditor");
        _;
    }

    constructor() {
        owner = msg.sender;
        authorizedAuditors[msg.sender] = true;
    }

    function authorizeAuditor(address auditor) public onlyOwner {
        authorizedAuditors[auditor] = true;
        emit AuditorAuthorized(auditor);
    }

    function revokeAuditor(address auditor) public onlyOwner {
        authorizedAuditors[auditor] = false;
        emit AuditorRevoked(auditor);
    }

    function auditContract(
        address contractAddr,
        string[] memory issues,
        uint256 riskScore
    ) public onlyAuditor {
        require(contractAddr != address(0), "Invalid contract address");
        require(riskScore <= MAX_RISK_SCORE, "Risk score too high");

        bool passed = riskScore <= ACCEPTABLE_RISK && issues.length == 0;

        auditResults[contractAddr] = AuditResult({
            passed: passed,
            issues: issues,
            riskScore: riskScore,
            timestamp: block.timestamp
        });

        emit ContractAudited(contractAddr, passed, riskScore);
    }

    function getAuditResult(address contractAddr) public view returns (
        bool passed,
        string[] memory issues,
        uint256 riskScore,
        uint256 timestamp
    ) {
        AuditResult memory result = auditResults[contractAddr];
        return (result.passed, result.issues, result.riskScore, result.timestamp);
    }

    function isContractSafe(address contractAddr) public view returns (bool) {
        AuditResult memory result = auditResults[contractAddr];
        return result.passed && (block.timestamp - result.timestamp) < 365 days;
    }

    // Automated security checks
    function performBasicChecks(address contractAddr) public view returns (string[] memory) {
        string[] memory issues = new string[](10);
        uint256 issueCount = 0;

        // Check if contract has code
        uint256 codeSize;
        assembly {
            codeSize := extcodesize(contractAddr)
        }
        if (codeSize == 0) {
            issues[issueCount] = "Contract has no code";
            issueCount++;
        }

        // Check if contract is verified (placeholder - would need external verification)
        // This would typically integrate with Etherscan API or similar

        // Return only the issues found
        string[] memory foundIssues = new string[](issueCount);
        for (uint256 i = 0; i < issueCount; i++) {
            foundIssues[i] = issues[i];
        }
        
        return foundIssues;
    }
}