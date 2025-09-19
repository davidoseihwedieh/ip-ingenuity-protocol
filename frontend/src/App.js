import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import './App.css';

const IPT1155_ABI = [
  "function mintWithMetadata(uint256 tokenId, uint256 amount, bytes32 contentHash, uint256 royaltyPercent) external",
  "function distributeRoyalty(uint256 tokenId) external payable",
  "function metadata(uint256) external view returns (bytes32, uint256, address, uint256, bool)"
];

const VOTING_ABI = [
  "function createProposal(string memory _description) external",
  "function voteCost(uint256 votes) public pure returns (uint256)",
  "function castVote(uint256 proposalId, uint256 votes, bool support) external"
];

function App() {
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [account, setAccount] = useState('');
  const [valuation, setValuation] = useState(null);

  const IPT1155_ADDRESS = '0xYOUR_IPT1155_ADDRESS'; // Update after deployment
  const VOTING_ADDRESS = '0xYOUR_VOTING_ADDRESS';   // Update after deployment

  useEffect(() => {
    if (window.ethereum) {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      setProvider(provider);
    }
  }, []);

  const connectWallet = async () => {
    if (provider) {
      await provider.send("eth_requestAccounts", []);
      const signer = provider.getSigner();
      setSigner(signer);
      const address = await signer.getAddress();
      setAccount(address);
    }
  };

  const predictValue = async (features) => {
    try {
      const response = await fetch('https://ip-ingenuity-backend.herokuapp.com/api/predict', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(features)
      });
      return await response.json();
    } catch (error) {
      console.error('Prediction failed:', error);
      return null;
    }
  };

  const handleValuation = async (e) => {
    e.preventDefault();
    const features = {
      numClaims: parseInt(e.target.numClaims.value),
      numCitations: parseInt(e.target.numCitations.value),
      techComplex: parseFloat(e.target.techComplex.value),
      marketSent: parseFloat(e.target.marketSent.value),
      marketAdopt: parseFloat(e.target.marketAdopt.value),
      citDensity: parseFloat(e.target.citDensity.value)
    };
    
    const result = await predictValue(features);
    if (result) {
      setValuation(result);
    }
  };

  const mintToken = async (e) => {
    e.preventDefault();
    if (!signer) return alert('Connect wallet first');
    
    const contract = new ethers.Contract(IPT1155_ADDRESS, IPT1155_ABI, signer);
    try {
      const tx = await contract.mintWithMetadata(
        parseInt(e.target.tokenId.value),
        parseInt(e.target.amount.value),
        ethers.utils.formatBytes32String('hash'),
        parseInt(e.target.royalty.value)
      );
      console.log('Minted:', tx.hash);
    } catch (error) {
      console.error('Minting failed:', error);
    }
  };

  const castVote = async (e) => {
    e.preventDefault();
    if (!signer) return alert('Connect wallet first');
    
    const contract = new ethers.Contract(VOTING_ADDRESS, VOTING_ABI, signer);
    try {
      const votes = parseInt(e.target.votes.value);
      const tx = await contract.castVote(1, votes, true);
      console.log('Voted:', tx.hash);
    } catch (error) {
      console.error('Voting failed:', error);
    }
  };

  return (
    <div className="App">
      <header>
        <h1>IP Ingenuity Protocol</h1>
        <p>87.5% Patent Claims Validated | 0.648 AI Correlation</p>
        <button onClick={connectWallet}>
          {account ? `Connected: ${account.slice(0,6)}...` : 'Connect Wallet'}
        </button>
      </header>

      <section>
        <h2>AI Patent Valuation</h2>
        <form onSubmit={handleValuation}>
          <input name="numClaims" type="number" placeholder="Claims" defaultValue="10" />
          <input name="numCitations" type="number" placeholder="Citations" defaultValue="50" />
          <input name="techComplex" type="number" placeholder="Complexity" defaultValue="5" />
          <input name="marketSent" type="range" min="-1" max="1" step="0.1" defaultValue="0" />
          <input name="marketAdopt" type="range" min="0" max="1" step="0.1" defaultValue="0.5" />
          <input name="citDensity" type="number" placeholder="Density" defaultValue="2.5" step="0.1" />
          <button type="submit">Valuate</button>
        </form>
        {valuation && (
          <div className="result">
            <p>Value: ${valuation.value?.toLocaleString()}</p>
            <p>Correlation: {valuation.correlation}</p>
          </div>
        )}
      </section>

      <section>
        <h2>IPT-1155 Tokenization</h2>
        <form onSubmit={mintToken}>
          <input name="tokenId" type="number" placeholder="Token ID" defaultValue="1" />
          <input name="amount" type="number" placeholder="Amount" defaultValue="100" />
          <input name="royalty" type="number" placeholder="Royalty %" defaultValue="10" />
          <button type="submit">Mint Token</button>
        </form>
      </section>

      <section>
        <h2>Quadratic Voting</h2>
        <form onSubmit={castVote}>
          <input name="votes" type="number" placeholder="Votes" defaultValue="5" />
          <button type="submit">Cast Vote (Cost = Votes²)</button>
        </form>
      </section>
    </div>
  );
}

export default App;