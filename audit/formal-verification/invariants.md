# Formal Verification Invariants

## Critical System Invariants

### 1. Access Control Invariants

#### INV-AC-001: Multi-Sig Admin Control
```
∀ admin_function ∈ {pause, unpause, freezeToken, emergencyWithdraw}:
  admin_function.caller ∈ {multiSigWallet} ∨ 
  (admin_function.caller.hasRole(REQUIRED_ROLE) ∧ multiSigWallet.approved(admin_function))
```

#### INV-AC-002: Role Hierarchy
```
∀ address a:
  hasRole(DEFAULT_ADMIN_ROLE, a) ⟹ a = multiSigWallet ∨ a = timeLock
```

#### INV-AC-003: Minter Role Restriction
```
∀ mint_call:
  mint_call.success ⟹ hasRole(MINTER_ROLE, mint_call.caller)
```

### 2. Token Supply Invariants

#### INV-TS-001: Total Supply Conservation
```
∀ tokenId, ∀ time t1, t2 where t2 > t1:
  totalSupply(tokenId, t2) ≥ totalSupply(tokenId, t1)
  (Supply can only increase through minting)
```

#### INV-TS-002: Balance Conservation
```
∀ tokenId, ∀ transfer(from, to, amount):
  balanceOf(from, tokenId).before = balanceOf(from, tokenId).after + amount ∧
  balanceOf(to, tokenId).after = balanceOf(to, tokenId).before + amount
```

#### INV-TS-003: Non-Zero Token ID
```
∀ tokenId ∈ validTokens:
  tokenId > 0 ∧ tokenId ≤ currentTokenId
```

### 3. Business Logic Invariants

#### INV-BL-001: Confidence Score Bounds
```
∀ tokenId ∈ validTokens:
  ipTokens[tokenId].confidenceScore ≥ MIN_CONFIDENCE ∧
  ipTokens[tokenId].confidenceScore ≤ 10000
```

#### INV-BL-002: Royalty Percentage Bounds
```
∀ tokenId ∈ validTokens:
  ipTokens[tokenId].royaltyPercentage ≤ MAX_ROYALTY ∧
  ipTokens[tokenId].royaltyPercentage ≥ 0
```

#### INV-BL-003: Valuation Positivity
```
∀ tokenId ∈ validTokens:
  ipTokens[tokenId].valuation > 0
```

#### INV-BL-004: Creator Immutability
```
∀ tokenId ∈ validTokens, ∀ time t1, t2:
  ipTokens[tokenId].creator(t1) = ipTokens[tokenId].creator(t2)
```

### 4. Security State Invariants

#### INV-SS-001: Pause State Consistency
```
paused() ⟹ ∀ state_changing_function:
  state_changing_function.reverts_with("Pausable: paused")
```

#### INV-SS-002: Frozen Token Restrictions
```
∀ tokenId where ipTokens[tokenId].frozen = true:
  ∀ transfer_function(tokenId):
    transfer_function.reverts_with("Token is frozen")
```

#### INV-SS-003: Reentrancy Protection
```
∀ external_call ∈ {mint, transfer, batch_transfer}:
  reentrancy_guard.locked = true during external_call.execution
```

### 5. Mathematical Invariants

#### INV-MA-001: Royalty Calculation Accuracy
```
∀ transfer(amount), ∀ tokenId:
  royalty_amount = (amount × ipTokens[tokenId].royaltyPercentage) ÷ 10000
  ∧ royalty_amount ≤ amount
```

#### INV-MA-002: Overflow Protection
```
∀ arithmetic_operation ∈ {addition, multiplication}:
  result < 2^256 ∨ operation.reverts
```

#### INV-MA-003: Balance Arithmetic
```
∀ address a, ∀ tokenId:
  balanceOf(a, tokenId) ≤ totalSupply(tokenId)
```

### 6. Time-Lock Invariants

#### INV-TL-001: Delay Enforcement
```
∀ time_locked_function:
  execution_time ≥ queue_time + MINIMUM_DELAY
```

#### INV-TL-002: Grace Period Compliance
```
∀ queued_transaction:
  execution_time ≤ queue_time + MINIMUM_DELAY + GRACE_PERIOD ∨
  transaction.cancelled = true
```

### 7. Multi-Sig Invariants

#### INV-MS-001: Confirmation Threshold
```
∀ transaction ∈ multiSig.transactions:
  transaction.executed ⟹ 
  transaction.confirmations ≥ multiSig.numConfirmationsRequired
```

#### INV-MS-002: Owner Uniqueness
```
∀ i, j ∈ [0, multiSig.owners.length):
  i ≠ j ⟹ multiSig.owners[i] ≠ multiSig.owners[j]
```

## Verification Methods

### Static Analysis Properties
- **Slither**: Automated vulnerability detection
- **Mythril**: Symbolic execution analysis  
- **Manticore**: Dynamic symbolic execution

### Formal Verification Tools
- **Certora Prover**: Specification-based verification
- **KEVM**: K framework verification
- **Dafny**: Specification language verification

### Property Testing
- **Echidna**: Fuzzing-based property testing
- **Foundry**: Property-based testing framework

## Verification Checklist

### ✅ Access Control
- [ ] Multi-sig requirements enforced
- [ ] Role hierarchy maintained
- [ ] Unauthorized access prevented

### ✅ Arithmetic Safety
- [ ] Overflow/underflow protection
- [ ] Division by zero prevention
- [ ] Precision loss minimization

### ✅ State Consistency
- [ ] Invariants maintained across transactions
- [ ] State transitions valid
- [ ] Emergency states handled correctly

### ✅ External Interactions
- [ ] Reentrancy protection active
- [ ] External call safety
- [ ] Gas limit considerations

### ✅ Business Logic
- [ ] Token metadata integrity
- [ ] Royalty calculations accurate
- [ ] Transfer mechanics correct

## Automated Verification Commands

```bash
# Run Slither analysis
slither contracts/security/IPT1155Secure.sol

# Run Mythril analysis  
myth analyze contracts/security/IPT1155Secure.sol

# Run Echidna property testing
echidna-test contracts/security/IPT1155Secure.sol

# Run Certora verification
certoraRun IPT1155Secure.sol --verify IPT1155Secure.spec
```

## Verification Results Template

```
Invariant: INV-XX-XXX
Status: ✅ VERIFIED / ❌ VIOLATED / ⚠️ PARTIAL
Tool: [Verification Tool Used]
Confidence: HIGH / MEDIUM / LOW
Notes: [Additional observations]
```