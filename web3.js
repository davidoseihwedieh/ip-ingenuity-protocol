// Web3 Blockchain Integration
class Web3Service {
    constructor() {
        this.web3 = null;
        this.account = null;
        this.chainId = null;
        this.contracts = {};
        this.init();
    }

    async init() {
        if (typeof window.ethereum !== 'undefined') {
            this.web3 = new Web3(window.ethereum);
            await this.setupEventListeners();
        }
    }

    // Connect wallet (MetaMask)
    async connectWallet() {
        try {
            if (!window.ethereum) {
                throw new Error('MetaMask not installed. Please install MetaMask to continue.');
            }

            // Request account access
            const accounts = await window.ethereum.request({
                method: 'eth_requestAccounts'
            });

            this.account = accounts[0];
            this.chainId = await window.ethereum.request({ method: 'eth_chainId' });

            // Update UI
            this.updateWalletUI();
            
            // Show success
            this.showNotification('Wallet connected successfully!', 'success');
            
            return this.account;
        } catch (error) {
            console.error('Wallet connection failed:', error);
            this.showNotification(error.message, 'error');
            throw error;
        }
    }

    // Disconnect wallet
    async disconnectWallet() {
        this.account = null;
        this.chainId = null;
        this.updateWalletUI();
        this.showNotification('Wallet disconnected', 'info');
    }

    // Get wallet balance
    async getBalance() {
        if (!this.account || !this.web3) return '0';
        
        try {
            const balance = await this.web3.eth.getBalance(this.account);
            return this.web3.utils.fromWei(balance, 'ether');
        } catch (error) {
            console.error('Error getting balance:', error);
            return '0';
        }
    }

    // Switch to correct network (Polygon for lower fees)
    async switchToPolygon() {
        try {
            await window.ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: '0x89' }], // Polygon Mainnet
            });
        } catch (switchError) {
            // Network not added, add it
            if (switchError.code === 4902) {
                await window.ethereum.request({
                    method: 'wallet_addEthereumChain',
                    params: [{
                        chainId: '0x89',
                        chainName: 'Polygon Mainnet',
                        nativeCurrency: {
                            name: 'MATIC',
                            symbol: 'MATIC',
                            decimals: 18
                        },
                        rpcUrls: ['https://polygon-rpc.com/'],
                        blockExplorerUrls: ['https://polygonscan.com/']
                    }]
                });
            }
        }
    }

    // Simulate IP token minting (placeholder for smart contract)
    async mintIPToken(assetData) {
        if (!this.account) {
            throw new Error('Please connect your wallet first');
        }

        try {
            // Simulate transaction
            const txHash = '0x' + Math.random().toString(16).substr(2, 64);
            
            // Show transaction pending
            this.showNotification('Transaction submitted...', 'info');
            
            // Simulate network delay
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            // Simulate success
            const tokenId = Date.now();
            const token = {
                id: tokenId,
                name: assetData.name,
                symbol: assetData.symbol || 'IPT',
                owner: this.account,
                value: assetData.value,
                txHash: txHash,
                createdAt: new Date().toISOString(),
                metadata: assetData
            };

            // Store in localStorage (simulate blockchain)
            this.storeToken(token);
            
            this.showNotification(`IP Token minted successfully! Token ID: ${tokenId}`, 'success');
            return token;
            
        } catch (error) {
            console.error('Minting failed:', error);
            this.showNotification('Minting failed: ' + error.message, 'error');
            throw error;
        }
    }

    // Get user's IP tokens
    getUserTokens() {
        if (!this.account) return [];
        
        const tokens = JSON.parse(localStorage.getItem('ipTokens') || '{}');
        return Object.values(tokens).filter(token => 
            token.owner.toLowerCase() === this.account.toLowerCase()
        );
    }

    // Store token (simulate blockchain storage)
    storeToken(token) {
        const tokens = JSON.parse(localStorage.getItem('ipTokens') || '{}');
        tokens[token.id] = token;
        localStorage.setItem('ipTokens', JSON.stringify(tokens));
    }

    // Simulate staking
    async stakeTokens(amount) {
        if (!this.account) {
            throw new Error('Please connect your wallet first');
        }

        try {
            // Simulate staking transaction
            const txHash = '0x' + Math.random().toString(16).substr(2, 64);
            
            this.showNotification('Staking transaction submitted...', 'info');
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Store staking info
            const staking = {
                amount: amount,
                startDate: new Date().toISOString(),
                apy: 15, // 15% APY
                txHash: txHash,
                account: this.account
            };
            
            localStorage.setItem(`staking_${this.account}`, JSON.stringify(staking));
            
            this.showNotification(`Successfully staked ${amount} PROVE tokens!`, 'success');
            return staking;
            
        } catch (error) {
            this.showNotification('Staking failed: ' + error.message, 'error');
            throw error;
        }
    }

    // Get staking info
    getStakingInfo() {
        if (!this.account) return null;
        return JSON.parse(localStorage.getItem(`staking_${this.account}`) || 'null');
    }

    // Setup event listeners for wallet changes
    async setupEventListeners() {
        if (window.ethereum) {
            window.ethereum.on('accountsChanged', (accounts) => {
                if (accounts.length === 0) {
                    this.disconnectWallet();
                } else {
                    this.account = accounts[0];
                    this.updateWalletUI();
                }
            });

            window.ethereum.on('chainChanged', (chainId) => {
                this.chainId = chainId;
                this.updateWalletUI();
            });
        }
    }

    // Update wallet UI elements
    updateWalletUI() {
        // Update connect button
        const connectBtn = document.getElementById('connectWallet');
        if (connectBtn) {
            if (this.account) {
                connectBtn.textContent = `${this.account.slice(0, 6)}...${this.account.slice(-4)}`;
                connectBtn.onclick = () => this.disconnectWallet();
            } else {
                connectBtn.textContent = 'Connect Wallet';
                connectBtn.onclick = () => this.connectWallet();
            }
        }

        // Update wallet info in dashboard
        const walletInfo = document.querySelector('.wallet-info');
        if (walletInfo && this.account) {
            this.getBalance().then(balance => {
                walletInfo.innerHTML = `
                    <div class="wallet-address">
                        <strong>Wallet:</strong> ${this.account.slice(0, 10)}...${this.account.slice(-8)}
                    </div>
                    <div class="wallet-balance">
                        <strong>Balance:</strong> ${parseFloat(balance).toFixed(4)} ETH
                    </div>
                `;
            });
        }

        // Update user tokens display
        this.updateTokensDisplay();
    }

    // Update tokens display
    updateTokensDisplay() {
        const tokensContainer = document.getElementById('userTokens');
        if (!tokensContainer || !this.account) return;

        const tokens = this.getUserTokens();
        
        if (tokens.length === 0) {
            tokensContainer.innerHTML = '<p>No IP tokens found. Mint your first token!</p>';
            return;
        }

        tokensContainer.innerHTML = tokens.map(token => `
            <div class="token-card">
                <h4>${token.name}</h4>
                <p><strong>Token ID:</strong> ${token.id}</p>
                <p><strong>Value:</strong> $${token.value.toLocaleString()}</p>
                <p><strong>Created:</strong> ${new Date(token.createdAt).toLocaleDateString()}</p>
                <a href="https://polygonscan.com/tx/${token.txHash}" target="_blank" class="pro-btn pro-btn-secondary">View on Explorer</a>
            </div>
        `).join('');
    }

    // Show notification
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `pro-alert pro-alert-${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 80px;
            right: 20px;
            z-index: 1001;
            min-width: 300px;
            max-width: 400px;
        `;
        
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 5000);
    }

    // Format address for display
    formatAddress(address) {
        return `${address.slice(0, 6)}...${address.slice(-4)}`;
    }

    // Check if wallet is connected
    isConnected() {
        return !!this.account;
    }
}

// Initialize Web3 service
const web3Service = new Web3Service();

// Add Web3.js library if not present
if (typeof Web3 === 'undefined') {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/web3@1.8.0/dist/web3.min.js';
    script.onload = () => {
        web3Service.init();
    };
    document.head.appendChild(script);
}

// Global functions for UI interaction
window.connectWallet = () => web3Service.connectWallet();
window.mintIPToken = (assetData) => web3Service.mintIPToken(assetData);
window.stakeTokens = (amount) => web3Service.stakeTokens(amount);

// Auto-connect if previously connected
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        if (window.ethereum && window.ethereum.selectedAddress) {
            web3Service.connectWallet().catch(console.error);
        }
    }, 1000);
});