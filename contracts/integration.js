// Contract Integration Script - Connect deployed contracts to frontend
const contractAddresses = {
    // Update these after deployment
    IPT1155: "0x...", // Replace with deployed IPT-1155 address
    QuadraticVoting: "0x...", // Replace with deployed QuadraticVoting address
};

// ABI exports for frontend integration
const IPT1155_ABI = [
    "function mintWithMetadata(uint256 tokenId, uint256 amount, bytes32 contentHash, uint256 royaltyPercent) external",
    "function distributeRoyalty(uint256 tokenId) external payable",
    "function metadata(uint256) external view returns (bytes32, uint256, address, uint256, bool)",
    "function balanceOf(address account, uint256 id) external view returns (uint256)"
];

const QUADRATIC_VOTING_ABI = [
    "function createProposal(string memory _description) external",
    "function voteCost(uint256 votes) public pure returns (uint256)",
    "function castVote(uint256 proposalId, uint256 votes, bool support) external",
    "function proposals(uint256) external view returns (string, uint256, uint256, bool)",
    "function votesCast(uint256, address) external view returns (uint256)"
];

// Frontend integration example
const integrateContracts = async (web3) => {
    const ipt1155 = new web3.eth.Contract(IPT1155_ABI, contractAddresses.IPT1155);
    const voting = new web3.eth.Contract(QUADRATIC_VOTING_ABI, contractAddresses.QuadraticVoting);
    
    return { ipt1155, voting };
};

// Export for use in frontend
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { contractAddresses, IPT1155_ABI, QUADRATIC_VOTING_ABI, integrateContracts };
}