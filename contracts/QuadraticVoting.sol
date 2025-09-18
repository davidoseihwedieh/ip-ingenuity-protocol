// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";

contract QuadraticVoting is Ownable {
    struct Proposal {
        string description;
        uint256 yesVotes;
        uint256 noVotes;
        bool executed;
    }
    
    mapping(uint256 => Proposal) public proposals;
    mapping(uint256 => mapping(address => uint256)) public votesCast;
    uint256 public proposalCount;
    
    event ProposalCreated(uint256 indexed proposalId, string description);
    event VoteCast(uint256 indexed proposalId, address voter, uint256 votes, bool support);
    
    function createProposal(string memory _description) external onlyOwner {
        proposalCount++;
        proposals[proposalCount] = Proposal({description: _description, yesVotes: 0, noVotes: 0, executed: false});
        emit ProposalCreated(proposalCount, _description);
    }
    
    function voteCost(uint256 votes) public pure returns (uint256) {
        return votes * votes;  // Quadratic cost
    }
    
    function castVote(uint256 proposalId, uint256 votes, bool support) external {
        require(proposals[proposalId].executed == false, "Proposal executed");
        uint256 cost = voteCost(votes);
        // Assume token transfer/burn logic here (integrate with ERC20)
        // For demo, just record
        if (support) {
            proposals[proposalId].yesVotes += votes;
        } else {
            proposals[proposalId].noVotes += votes;
        }
        votesCast[proposalId][msg.sender] = votes;
        emit VoteCast(proposalId, msg.sender, votes, support);
    }
}