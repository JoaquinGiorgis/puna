// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IIdentityRegistry, IValidationRegistry, IReputationRegistry} from "../../src/interfaces/IERC8004.sol";

contract MockIdentity is IIdentityRegistry {
    mapping(uint256 => address) public owners;
    uint256 public next = 1;

    function register(address to) external returns (uint256 id) {
        id = next++;
        owners[id] = to;
    }

    function ownerOf(uint256 agentId) external view returns (address) {
        return owners[agentId];
    }
}

/// Replica las reglas relevantes: solo el dueño pide, solo el validador nombrado responde, requestHash único.
contract MockValidation is IValidationRegistry {
    struct Status {
        address validatorAddress;
        uint256 agentId;
        uint8 response;
        bytes32 responseHash;
        string tag;
        uint256 lastUpdate;
    }

    MockIdentity public immutable identity;
    mapping(bytes32 => Status) public statuses;
    mapping(bytes32 => bool) public exists;

    constructor(MockIdentity identity_) {
        identity = identity_;
    }

    function validationRequest(address validatorAddress, uint256 agentId, string calldata, bytes32 requestHash) external {
        require(identity.ownerOf(agentId) == msg.sender, "not agent owner");
        require(!exists[requestHash], "requestHash used");
        exists[requestHash] = true;
        statuses[requestHash] = Status(validatorAddress, agentId, 0, bytes32(0), "", block.timestamp);
    }

    function validationResponse(bytes32 requestHash, uint8 response, string calldata, bytes32 responseHash, string calldata tag)
        external
    {
        require(exists[requestHash], "unknown request");
        Status storage s = statuses[requestHash];
        require(s.validatorAddress == msg.sender, "not validator");
        require(response <= 100, "response > 100");
        s.response = response;
        s.responseHash = responseHash;
        s.tag = tag;
        s.lastUpdate = block.timestamp;
    }

    function getValidationStatus(bytes32 requestHash)
        external
        view
        returns (address, uint256, uint8, bytes32, string memory, uint256)
    {
        Status storage s = statuses[requestHash];
        return (s.validatorAddress, s.agentId, s.response, s.responseHash, s.tag, s.lastUpdate);
    }
}

contract MockReputation is IReputationRegistry {
    struct Fb {
        uint256 agentId;
        int128 value;
        string tag2;
    }

    Fb[] public feedback;
    bool public shouldRevert;

    function setRevert(bool v) external {
        shouldRevert = v;
    }

    function count() external view returns (uint256) {
        return feedback.length;
    }

    function giveFeedback(
        uint256 agentId,
        int128 value,
        uint8,
        string calldata,
        string calldata tag2,
        string calldata,
        string calldata,
        bytes32
    ) external {
        require(!shouldRevert, "reputation down");
        feedback.push(Fb(agentId, value, tag2));
    }
}
