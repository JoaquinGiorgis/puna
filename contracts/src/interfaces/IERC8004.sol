// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @notice Subconjunto mínimo de los registros ERC-8004 que usa PunaEscrow.
/// @dev Firmas tomadas de erc-8004/erc-8004-contracts (Upgradeable). ERC-8004 es borrador:
///      verificar contra los contratos desplegados en Fuji en el smoke test H0 (ver docs/erc8004.md).

/// Identity Registry: ERC-721, un token por agente.
interface IIdentityRegistry {
    function ownerOf(uint256 agentId) external view returns (address);
}

/// Validation Registry. Solo el dueño del agente llama a validationRequest;
/// solo el validador nombrado llama a validationResponse. La respuesta se puede pisar.
interface IValidationRegistry {
    function validationRequest(
        address validatorAddress,
        uint256 agentId,
        string calldata requestURI,
        bytes32 requestHash
    ) external;

    function validationResponse(
        bytes32 requestHash,
        uint8 response,
        string calldata responseURI,
        bytes32 responseHash,
        string calldata tag
    ) external;

    function getValidationStatus(bytes32 requestHash)
        external
        view
        returns (
            address validatorAddress,
            uint256 agentId,
            uint8 response,
            bytes32 responseHash,
            string memory tag,
            uint256 lastUpdate
        );
}

/// Reputation Registry. Revierte si el dueño del agente se califica a sí mismo.
/// @dev value/valueDecimals según la versión v1 (int128 + decimales). Confirmar en H0.
interface IReputationRegistry {
    function giveFeedback(
        uint256 agentId,
        int128 value,
        uint8 valueDecimals,
        string calldata tag1,
        string calldata tag2,
        string calldata endpoint,
        string calldata feedbackURI,
        bytes32 feedbackHash
    ) external;
}
