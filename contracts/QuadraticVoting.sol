// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract QuadraticVoting is Ownable, ReentrancyGuard {
    struct Proposal {
        string description;
        uint256 endTime;
        mapping(address => uint256) votes;
        mapping(address => uint256) voteCosts;
        uint256 totalVotes;
        bool executed;
        bool exists;
    }
    
    mapping(uint256 => Proposal) public proposals;
    uint256 public proposalCount;
    
    event ProposalCreated(uint256 indexed proposalId, string description, uint256 endTime);
    event VoteCast(uint256 indexed proposalId, address indexed voter, uint256 votes, uint256 cost);
    
    function createProposal(string memory description, uint256 duration) external onlyOwner {
        uint256 proposalId = proposalCount++;
        Proposal storage proposal = proposals[proposalId];
        proposal.description = description;
        proposal.endTime = block.timestamp + duration;
        proposal.exists = true;
        
        emit ProposalCreated(proposalId, description, proposal.endTime);
    }
    
    function voteCost(uint256 votes) public pure returns (uint256) {
        return votes * votes;
    }
    
    function castVote(uint256 proposalId, uint256 votes) external payable nonReentrant {
        Proposal storage proposal = proposals[proposalId];
        require(proposal.exists, "Proposal does not exist");
        require(block.timestamp < proposal.endTime, "Voting period ended");
        require(votes > 0, "Must vote at least 1");
        
        uint256 cost = voteCost(votes);
        require(msg.value >= cost, "Insufficient payment");
        
        proposal.votes[msg.sender] = votes;
        proposal.voteCosts[msg.sender] = cost;
        proposal.totalVotes += votes;
        
        // Refund excess payment
        if (msg.value > cost) {
            payable(msg.sender).transfer(msg.value - cost);
        }
        
        emit VoteCast(proposalId, msg.sender, votes, cost);
    }
    
    function getVotes(uint256 proposalId, address voter) external view returns (uint256) {
        return proposals[proposalId].votes[voter];
    }
    
    function getTotalVotes(uint256 proposalId) external view returns (uint256) {
        return proposals[proposalId].totalVotes;
    }
    
    function withdrawFunds() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }
}