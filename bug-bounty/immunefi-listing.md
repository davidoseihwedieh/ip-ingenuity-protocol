# Immunefi Bug Bounty Listing - IP Ingenuity

## Project Information

### Basic Details
- **Project Name**: IP Ingenuity Protocol
- **Website**: https://ipingenuity.com
- **Category**: DeFi, NFT, Intellectual Property
- **Blockchain**: Ethereum
- **Language**: Solidity

### Project Description
IP Ingenuity is an enterprise-grade intellectual property tokenization platform that enables the creation, trading, and management of IP assets as ERC1155 tokens with automated AI valuation, multi-signature security, and cross-chain functionality.

## Rewards

### Smart Contracts
- **Critical**: $25,000
- **High**: $10,000  
- **Medium**: $2,500
- **Low**: $500

### Web/App
- **Critical**: $10,000
- **High**: $5,000
- **Medium**: $1,000
- **Low**: $250

## Assets in Scope

### Smart Contracts (Ethereum Mainnet - Coming Soon)
```
IPT1155Secure: [Mainnet address TBD]
MultiSigWallet: [Mainnet address TBD]
TimeLock: [Mainnet address TBD]
SecurityAudit: [Mainnet address TBD]
```

### Testnet Contracts (Sepolia)
```
IPT1155Secure: [Sepolia address after deployment]
MultiSigWallet: [Sepolia address after deployment]
TimeLock: [Sepolia address after deployment]
SecurityAudit: [Sepolia address after deployment]
```

### Web Applications
- **Main App**: https://app.ipingenuity.com
- **API Gateway**: https://api.ipingenuity.com
- **Documentation**: https://docs.ipingenuity.com

## Impacts in Scope

### Critical
- Direct theft of any user funds
- Permanent freezing of funds
- Protocol insolvency
- Unauthorized minting of tokens

### High  
- Theft of unclaimed yield/royalties
- Permanent freezing of unclaimed yield/royalties
- Temporary freezing of funds for at least 1 hour

### Medium
- Smart contract unable to operate due to lack of token funds
- Block stuffing for profit
- Griefing (e.g. no profit motive for an attacker, but damage to the users or the protocol)

### Low
- Contract fails to deliver promised returns, but doesn't lose value

## Out of Scope & Rules

### Out of Scope
- Attacks that the reporter has already exploited themselves
- Attacks requiring access to leaked keys/credentials
- Attacks requiring access to privileged addresses (governance, strategist)
- Incorrect data supplied by third party oracles (not to exclude oracle manipulation/flash loan attacks)
- Basic economic governance attacks (e.g. 51% attack)
- Lack of liquidity
- Best practice critiques
- Sybil attacks
- Centralization risks

### Prohibited Activities
- Any testing with mainnet or public testnet contracts; all testing should be done on private testnets
- Any testing with pricing oracles or third party smart contracts
- Attempting phishing or other social engineering attacks against our employees and/or customers
- Any testing with third party systems and applications (e.g. browser extensions) as well as websites (e.g. SSO providers, advertising networks)
- Any denial of service attacks
- Automated testing of services that generates significant amounts of traffic
- Public disclosure of an unpatched vulnerability in an embargoed bounty

## Smart Contract Details

### IPT1155Secure.sol
**Purpose**: Core IP tokenization with security features
**Key Functions**:
- `mintIPToken()` - Create IP tokens with validation
- `safeTransferFrom()` - Secure transfers with royalties  
- `freezeToken()` - Emergency token freezing
- `pause()` - Contract-wide emergency pause

**Security Features**:
- Multi-signature admin controls
- Time-lock integration
- Reentrancy protection
- Role-based access control

### MultiSigWallet.sol  
**Purpose**: Multi-signature governance wallet
**Key Functions**:
- `submitTransaction()` - Propose transactions
- `confirmTransaction()` - Multi-party confirmation
- `executeTransaction()` - Execute approved transactions

### TimeLock.sol
**Purpose**: Time-delayed execution for critical operations
**Key Functions**:
- `queueTransaction()` - Queue delayed transactions
- `executeTransaction()` - Execute after delay
- `cancelTransaction()` - Cancel queued transactions

## Known Issues

### Acknowledged Risks
1. **Centralization**: Admin roles have significant power
   - Mitigated by multi-sig + time-lock requirements
2. **Oracle Dependency**: AI valuation system reliance  
   - Mitigated by confidence score thresholds
3. **Upgrade Risk**: Contract upgrade capabilities
   - Mitigated by time-locked upgrade process

## Proof of Concept Requirements

### For Smart Contract Vulnerabilities
- Runnable proof of concept
- Clear explanation of the vulnerability
- Impact assessment with potential loss calculation
- Suggested remediation approach

### For Web/App Vulnerabilities  
- Step-by-step reproduction instructions
- Screenshots or video demonstration
- Impact on user security or data
- Recommended fixes

## Contact Information

### Primary Contact
- **Email**: security@ipingenuity.com
- **Response Time**: 48 hours maximum
- **Escalation**: Critical issues get immediate attention

### Program Details
- **Program Start**: [Date after testnet deployment]
- **KYC Required**: Yes, for rewards over $5,000
- **Rewards Payment**: USDC on Ethereum mainnet
- **Payment Timeline**: 30 days after fix verification

## Additional Information

### Audit Status
- **Audit Firm**: OpenZeppelin (scheduled)
- **Audit Timeline**: 4 weeks
- **Previous Audits**: None (new protocol)

### Documentation
- **Technical Docs**: https://docs.ipingenuity.com
- **GitHub**: Private repository (access upon request)
- **Whitepaper**: Available on website

### Team
- **Security Team**: Dedicated security engineers
- **Response Team**: 24/7 monitoring for critical issues
- **Development Team**: Full-time Solidity developers

---

**Ready to help secure IP tokenization?**
**Join our bug bounty program today!** 🔍🛡️