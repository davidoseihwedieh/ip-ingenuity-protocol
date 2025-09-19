// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

interface IIngenuityToken is IERC20 {
    function burn(address from, uint256 amount) external;
    function mint(address to, uint256 amount) external;
}

contract IPGovernanceDAO is ReentrancyGuard, AccessControl {
    bytes32 public constant COMMITTEE_ROLE = keccak256("COMMITTEE_ROLE");
    bytes32 public constant EXECUTOR_ROLE = keccak256("EXECUTOR_ROLE");
    
    enum ProposalCategory {
        TECHNICAL,
        TREASURY,
        PARTNERSHIP,
        GOVERNANCE,
        EMERGENCY
    }
    
    enum ProposalStatus {
        PENDING,
        ACTIVE,
        SUCCEEDED,
        DEFEATED,
        EXECUTED,
        CANCELLED
    }
    
    struct Proposal {
        uint256 id;
        address proposer;
        string title;
        string description;
        ProposalCategory category;
        uint256 votingStart;
        uint256 votingEnd;
        uint256 executionDelay;
        uint256 forVotes;
        uint256 againstVotes;
        uint256 abstainVotes;
        ProposalStatus status;
        bytes executionData;
        address targetContract;
        mapping(address => Vote) votes;
        mapping(address => uint256) quadraticCosts;
    }
    
    struct Vote {
        bool hasVoted;
        uint8 support; // 0=against, 1=for, 2=abstain
        uint256 votes;
        uint256 quadraticCost;
    }
    
    struct UserReputation {
        uint256 votingAccuracy;      // Percentage of successful votes (0-100)
        uint256 proposalSuccessRate; // Percentage of successful proposals (0-100)
        uint256 engagementScore;     // Community participation level (0-100)
        uint256 technicalScore;      // Technical contribution assessment (0-100)
        uint256 totalProposals;
        uint256 successfulProposals;
        uint256 totalVotes;
        uint256 successfulVotes;
    }
    
    IIngenuityToken public immutable ingenuityToken;
    
    mapping(uint256 => Proposal) public proposals;
    mapping(address => UserReputation) public userReputations;
    mapping(ProposalCategory => uint256) public categoryThresholds;
    mapping(ProposalCategory => uint256) public categoryQuorums;
    
    uint256 public proposalCount;
    uint256 public votingPeriod = 7 days;
    uint256 public executionDelay = 2 days;
    uint256 public proposalThreshold = 100000 * 10**18; // 100k INGENUITY tokens
    uint256 public quorumPercentage = 10; // 10% of total supply
    
    event ProposalCreated(
        uint256 indexed proposalId,
        address indexed proposer,
        string title,
        ProposalCategory category
    );
    event VoteCast(
        uint256 indexed proposalId,
        address indexed voter,
        uint8 support,
        uint256 votes,
        uint256 quadraticCost
    );
    event ProposalExecuted(uint256 indexed proposalId);
    event ReputationUpdated(address indexed user, uint256 newScore);
    
    constructor(address _ingenuityToken) {
        ingenuityToken = IIngenuityToken(_ingenuityToken);
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(EXECUTOR_ROLE, msg.sender);
        
        // Set default category thresholds (in INGENUITY tokens)
        categoryThresholds[ProposalCategory.TECHNICAL] = 50000 * 10**18;
        categoryThresholds[ProposalCategory.TREASURY] = 200000 * 10**18;
        categoryThresholds[ProposalCategory.PARTNERSHIP] = 100000 * 10**18;
        categoryThresholds[ProposalCategory.GOVERNANCE] = 300000 * 10**18;
        categoryThresholds[ProposalCategory.EMERGENCY] = 500000 * 10**18;
        
        // Set default category quorums (percentage of total supply)
        categoryQuorums[ProposalCategory.TECHNICAL] = 5;
        categoryQuorums[ProposalCategory.TREASURY] = 15;
        categoryQuorums[ProposalCategory.PARTNERSHIP] = 10;
        categoryQuorums[ProposalCategory.GOVERNANCE] = 20;
        categoryQuorums[ProposalCategory.EMERGENCY] = 25;
    }
    
    function propose(
        string memory title,
        string memory description,
        ProposalCategory category,
        bytes memory executionData,
        address targetContract
    ) external returns (uint256) {
        uint256 proposerBalance = ingenuityToken.balanceOf(msg.sender);
        require(proposerBalance >= categoryThresholds[category], "Insufficient tokens to propose");
        
        uint256 proposalId = ++proposalCount;
        
        Proposal storage newProposal = proposals[proposalId];
        newProposal.id = proposalId;
        newProposal.proposer = msg.sender;
        newProposal.title = title;
        newProposal.description = description;
        newProposal.category = category;
        newProposal.votingStart = block.timestamp;
        newProposal.votingEnd = block.timestamp + votingPeriod;
        newProposal.executionDelay = executionDelay;
        newProposal.status = ProposalStatus.ACTIVE;
        newProposal.executionData = executionData;
        newProposal.targetContract = targetContract;
        
        // Update proposer reputation
        userReputations[msg.sender].totalProposals++;
        
        emit ProposalCreated(proposalId, msg.sender, title, category);
        return proposalId;
    }
    
    function castQuadraticVote(
        uint256 proposalId,
        uint8 support,
        uint256 voteAmount
    ) external nonReentrant {
        require(support <= 2, "Invalid support value");
        require(voteAmount > 0, "Vote amount must be positive");
        
        Proposal storage proposal = proposals[proposalId];
        require(proposal.status == ProposalStatus.ACTIVE, "Proposal not active");
        require(block.timestamp <= proposal.votingEnd, "Voting period ended");
        require(!proposal.votes[msg.sender].hasVoted, "Already voted");
        
        // Calculate quadratic cost
        uint256 quadraticCost = voteAmount * voteAmount;
        
        // Calculate influence based on reputation
        uint256 influence = calculateInfluence(msg.sender);
        uint256 adjustedCost = (quadraticCost * 10000) / (10000 + influence); // Reputation discount
        
        require(ingenuityToken.balanceOf(msg.sender) >= adjustedCost, "Insufficient INGENUITY tokens");
        
        // Burn tokens for quadratic voting
        ingenuityToken.burn(msg.sender, adjustedCost);
        
        // Record vote
        proposal.votes[msg.sender] = Vote({
            hasVoted: true,
            support: support,
            votes: voteAmount,
            quadraticCost: adjustedCost
        });
        
        proposal.quadraticCosts[msg.sender] = adjustedCost;
        
        // Update vote tallies
        if (support == 0) {
            proposal.againstVotes += voteAmount;
        } else if (support == 1) {
            proposal.forVotes += voteAmount;
        } else {
            proposal.abstainVotes += voteAmount;
        }
        
        // Update voter reputation
        userReputations[msg.sender].totalVotes++;
        
        emit VoteCast(proposalId, msg.sender, support, voteAmount, adjustedCost);
    }
    
    function executeProposal(uint256 proposalId) external {
        Proposal storage proposal = proposals[proposalId];
        require(proposal.status == ProposalStatus.SUCCEEDED, "Proposal not succeeded");
        require(
            block.timestamp >= proposal.votingEnd + proposal.executionDelay,
            "Execution delay not met"
        );
        
        proposal.status = ProposalStatus.EXECUTED;
        
        // Execute the proposal
        if (proposal.executionData.length > 0 && proposal.targetContract != address(0)) {
            (bool success, ) = proposal.targetContract.call(proposal.executionData);
            require(success, "Execution failed");
        }
        
        // Update reputation for proposer and voters
        _updateReputationAfterExecution(proposalId, true);
        
        emit ProposalExecuted(proposalId);
    }
    
    function updateProposalStatus(uint256 proposalId) external {
        Proposal storage proposal = proposals[proposalId];
        require(proposal.status == ProposalStatus.ACTIVE, "Proposal not active");
        require(block.timestamp > proposal.votingEnd, "Voting still active");
        
        uint256 totalVotes = proposal.forVotes + proposal.againstVotes + proposal.abstainVotes;
        uint256 requiredQuorum = (ingenuityToken.totalSupply() * categoryQuorums[proposal.category]) / 100;
        
        if (totalVotes >= requiredQuorum && proposal.forVotes > proposal.againstVotes) {
            proposal.status = ProposalStatus.SUCCEEDED;
            userReputations[proposal.proposer].successfulProposals++;
        } else {
            proposal.status = ProposalStatus.DEFEATED;
        }
        
        _updateReputationAfterExecution(proposalId, proposal.status == ProposalStatus.SUCCEEDED);
    }
    
    function _updateReputationAfterExecution(uint256 proposalId, bool succeeded) internal {
        Proposal storage proposal = proposals[proposalId];
        
        // Update proposer reputation
        UserReputation storage proposerRep = userReputations[proposal.proposer];
        if (proposerRep.totalProposals > 0) {
            proposerRep.proposalSuccessRate = (proposerRep.successfulProposals * 100) / proposerRep.totalProposals;
        }
        
        // Update voter reputations (simplified - would iterate through voters in production)
        // This is a placeholder for the reputation update logic
    }
    
    function calculateInfluence(address user) public view returns (uint256) {
        UserReputation memory rep = userReputations[user];
        uint256 baseInfluence = ingenuityToken.balanceOf(user);
        
        if (rep.totalVotes == 0 && rep.totalProposals == 0) {
            return baseInfluence / 10000; // Minimal influence for new users
        }
        
        uint256 reputationMultiplier = (
            rep.votingAccuracy + 
            rep.proposalSuccessRate + 
            rep.engagementScore + 
            rep.technicalScore
        ) / 4;
        
        return (baseInfluence * reputationMultiplier) / 100;
    }
    
    function updateTechnicalScore(address user, uint256 newScore) external onlyRole(COMMITTEE_ROLE) {
        require(newScore <= 100, "Score must be 0-100");
        userReputations[user].technicalScore = newScore;
        emit ReputationUpdated(user, newScore);
    }
    
    function updateEngagementScore(address user, uint256 newScore) external onlyRole(COMMITTEE_ROLE) {
        require(newScore <= 100, "Score must be 0-100");
        userReputations[user].engagementScore = newScore;
        emit ReputationUpdated(user, newScore);
    }
    
    function setCategoryThreshold(ProposalCategory category, uint256 threshold) external onlyRole(DEFAULT_ADMIN_ROLE) {
        categoryThresholds[category] = threshold;
    }
    
    function setCategoryQuorum(ProposalCategory category, uint256 quorum) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(quorum <= 100, "Quorum cannot exceed 100%");
        categoryQuorums[category] = quorum;
    }
    
    function setVotingPeriod(uint256 newPeriod) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(newPeriod >= 1 days && newPeriod <= 30 days, "Invalid voting period");
        votingPeriod = newPeriod;
    }
    
    function getProposal(uint256 proposalId) external view returns (
        uint256 id,
        address proposer,
        string memory title,
        string memory description,
        ProposalCategory category,
        uint256 votingStart,
        uint256 votingEnd,
        uint256 forVotes,
        uint256 againstVotes,
        uint256 abstainVotes,
        ProposalStatus status
    ) {
        Proposal storage proposal = proposals[proposalId];
        return (
            proposal.id,
            proposal.proposer,
            proposal.title,
            proposal.description,
            proposal.category,
            proposal.votingStart,
            proposal.votingEnd,
            proposal.forVotes,
            proposal.againstVotes,
            proposal.abstainVotes,
            proposal.status
        );
    }
    
    function getVote(uint256 proposalId, address voter) external view returns (
        bool hasVoted,
        uint8 support,
        uint256 votes,
        uint256 quadraticCost
    ) {
        Vote storage vote = proposals[proposalId].votes[voter];
        return (vote.hasVoted, vote.support, vote.votes, vote.quadraticCost);
    }
}