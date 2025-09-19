// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract TimeLock {
    event QueueTransaction(bytes32 indexed txHash, address indexed target, uint value, string signature, bytes data, uint eta);
    event ExecuteTransaction(bytes32 indexed txHash, address indexed target, uint value, string signature, bytes data, uint eta);
    event CancelTransaction(bytes32 indexed txHash, address indexed target, uint value, string signature, bytes data, uint eta);

    uint public constant GRACE_PERIOD = 14 days;
    uint public constant MINIMUM_DELAY = 2 days;
    uint public constant MAXIMUM_DELAY = 30 days;

    address public admin;
    uint public delay;
    mapping(bytes32 => bool) public queuedTransactions;

    modifier onlyAdmin() {
        require(msg.sender == admin, "TimeLock: Call must come from admin");
        _;
    }

    constructor(address _admin, uint _delay) {
        require(_delay >= MINIMUM_DELAY, "TimeLock: Delay must exceed minimum delay");
        require(_delay <= MAXIMUM_DELAY, "TimeLock: Delay must not exceed maximum delay");

        admin = _admin;
        delay = _delay;
    }

    function setDelay(uint _delay) public onlyAdmin {
        require(_delay >= MINIMUM_DELAY, "TimeLock: Delay must exceed minimum delay");
        require(_delay <= MAXIMUM_DELAY, "TimeLock: Delay must not exceed maximum delay");
        delay = _delay;
    }

    function queueTransaction(address target, uint value, string memory signature, bytes memory data, uint eta) public onlyAdmin returns (bytes32) {
        require(eta >= getBlockTimestamp() + delay, "TimeLock: Estimated execution block must satisfy delay");

        bytes32 txHash = keccak256(abi.encode(target, value, signature, data, eta));
        queuedTransactions[txHash] = true;

        emit QueueTransaction(txHash, target, value, signature, data, eta);
        return txHash;
    }

    function cancelTransaction(address target, uint value, string memory signature, bytes memory data, uint eta) public onlyAdmin {
        bytes32 txHash = keccak256(abi.encode(target, value, signature, data, eta));
        queuedTransactions[txHash] = false;

        emit CancelTransaction(txHash, target, value, signature, data, eta);
    }

    function executeTransaction(address target, uint value, string memory signature, bytes memory data, uint eta) public payable onlyAdmin returns (bytes memory) {
        bytes32 txHash = keccak256(abi.encode(target, value, signature, data, eta));
        require(queuedTransactions[txHash], "TimeLock: Transaction hasn't been queued");
        require(getBlockTimestamp() >= eta, "TimeLock: Transaction hasn't surpassed time lock");
        require(getBlockTimestamp() <= eta + GRACE_PERIOD, "TimeLock: Transaction is stale");

        queuedTransactions[txHash] = false;

        bytes memory callData;

        if (bytes(signature).length == 0) {
            callData = data;
        } else {
            callData = abi.encodePacked(bytes4(keccak256(bytes(signature))), data);
        }

        (bool success, bytes memory returnData) = target.call{value: value}(callData);
        require(success, "TimeLock: Transaction execution reverted");

        emit ExecuteTransaction(txHash, target, value, signature, data, eta);

        return returnData;
    }

    function getBlockTimestamp() internal view returns (uint) {
        return block.timestamp;
    }
}