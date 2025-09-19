// Web3 Integration for IP Ingenuity Protocol
const CONTRACT_ADDRESSES = {
    IPT1155: '0x742d35Cc6634C0532925a3b8D0C9e3e0C8b4C8eB',
    QuadraticVoting: '0x8ba1f109551bD432803012645Hac136c0c8b4C8eB'
};

const IPT1155_ABI = [
    {
        "inputs": [
            {"internalType": "uint256", "name": "tokenId", "type": "uint256"},
            {"internalType": "uint256", "name": "amount", "type": "uint256"},
            {"internalType": "bytes32", "name": "contentHash", "type": "bytes32"},
            {"internalType": "uint256", "name": "royaltyPercent", "type": "uint256"}
        ],
        "name": "mintWithMetadata",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    }
];

async function initWeb3() {
    if (typeof window.ethereum !== 'undefined') {
        const web3 = new Web3(window.ethereum);
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        
        const contract = new web3.eth.Contract(IPT1155_ABI, CONTRACT_ADDRESSES.IPT1155);
        return { web3, contract };
    }
    return null;
}

async function mintToken(tokenId, amount, contentHash, royaltyPercent) {
    const { web3, contract } = await initWeb3();
    const accounts = await web3.eth.getAccounts();
    
    return contract.methods.mintWithMetadata(tokenId, amount, contentHash, royaltyPercent)
        .send({ from: accounts[0] });
}
