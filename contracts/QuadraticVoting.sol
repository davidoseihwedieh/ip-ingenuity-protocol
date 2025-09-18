// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract QuadraticVoting {
    struct Proposal {
        string description;
        uint256 endTime;
        mapping(address => uint256) votes;
        uint256 totalVotes;
        bool executed;
    }
    
    mapping(uint256 => Proposal) public proposals;
    uint256 public proposalCount;
    
    function voteCost(uint256 votes) public pure returns (uint256) {
        return votes * votes;
    }
    
    function createProposal(string memory description, uint256 duration) external {
        proposals[proposalCount].description = description;
        proposals[proposalCount].endTime = block.timestamp + duration;
        proposalCount++;
    }
    
    function castVote(uint256 proposalId, uint256 votes) external payable {
        require(block.timestamp < proposals[proposalId].endTime, "Voting ended");
        uint256 cost = voteCost(votes);
        require(msg.value >= cost, "Insufficient payment");
        
        proposals[proposalId].votes[msg.sender] = votes;
        proposals[proposalId].totalVotes += votes;
    }
    
    function getVotes(uint256 proposalId, address voter) external view returns (uint256) {
        return proposals[proposalId].votes[voter];
    }
}
