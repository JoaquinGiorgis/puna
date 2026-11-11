// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IIdentityRegistry, IValidationRegistry, IReputationRegistry} from "./interfaces/IERC8004.sol";

/// @title PunaEscrow
/// @notice Seguro paramétrico de incendio: paga la indemnización solo si un validador elegido
///         por el cliente aprobó el cálculo del índice (ERC-8004 Validation) y el índice supera el disparador.
/// @dev Liquidación de tres salidas: Paid (validado y >= disparador), NoPayout (validado y < disparador),
///      Rejected (no validado → se reasigna). Sin slashing económico en el MVP.
contract PunaEscrow {
    // ------------------------------------------------------------------ tipos

    enum State {
        None,
        Created,
        Assigned,
        Submitted,
        Paid,
        NoPayout,
        Rejected,
        Refunded
    }

    struct Job {
        // partes
        address insurer;
        address beneficiary;
        address validator;
        // compromiso del cálculo
        bytes32 inputHash;
        bytes32 modelHash;
        // parámetros de la póliza
        uint32 triggerBps;
        uint8 minScore;
        uint16 maxSaaBps;
        uint64 deadline;
        // dinero
        uint256 indemnity;
        uint256 computeFee;
        uint256 validatorFeePerAttempt;
        // ejecución
        State state;
        uint8 attempt;
        uint256 agentId;
        uint16 saaBps;
        bytes32 orbitHash;
        address nodePayee;
        uint32 indexBps;
        bytes32 outputHash;
        bytes32 merkleRoot;
        bytes32 requestHash;
    }

    // ------------------------------------------------------------- constantes

    uint8 public constant MAX_ATTEMPTS = 3;
    uint32 public constant BPS = 10_000;

    // ------------------------------------------------------------------ estado

    IIdentityRegistry public immutable identity;
    IValidationRegistry public immutable validation;
    IReputationRegistry public immutable reputation;

    address public owner;
    address public scheduler;
    uint256 public validatorFee;
    uint256 public nextJobId = 1;

    mapping(uint256 => Job) internal _jobs;
    mapping(address => bool) public validatorAllowed;
    mapping(bytes32 => bool) public requestHashUsed;

    uint256 private _lock = 1;

    // ------------------------------------------------------------------ eventos

    event JobCreated(uint256 indexed jobId, address indexed insurer, address beneficiary, uint256 indemnity);
    event NodeAssigned(uint256 indexed jobId, uint256 indexed agentId, uint8 attempt, uint16 saaBps);
    event ResultSubmitted(uint256 indexed jobId, bytes32 requestHash, uint32 indexBps);
    event PayoutTriggered(uint256 indexed jobId, address beneficiary, uint32 indexBps, uint256 amount);
    event NoPayout(uint256 indexed jobId, uint32 indexBps);
    event JobRejected(uint256 indexed jobId, uint256 indexed agentId, uint8 score);
    event Refunded(uint256 indexed jobId, uint256 amount);
    event FeedbackFailed(uint256 indexed jobId, uint256 indexed agentId);
    event ValidatorAllowed(address indexed validator, bool allowed);
    event SchedulerSet(address indexed scheduler);
    event ValidatorFeeSet(uint256 fee);

    // ------------------------------------------------------------------ errores

    error NotOwner();
    error NotScheduler();
    error NotAgentOwner();
    error BadState(State current);
    error ValidatorNotAllowed();
    error BadParams();
    error SaaTooHigh(uint16 saaBps, uint16 maxSaaBps);
    error DeadlinePassed();
    error DeadlineNotPassed();
    error TooManyAttempts();
    error RequestHashReused();
    error ValidationMismatch();
    error NotResponded();
    error TransferFailed();
    error Reentrancy();

    // ---------------------------------------------------------------- modifiers

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    modifier onlyScheduler() {
        if (msg.sender != scheduler) revert NotScheduler();
        _;
    }

    modifier nonReentrant() {
        if (_lock != 1) revert Reentrancy();
        _lock = 2;
        _;
        _lock = 1;
    }

    constructor(address identity_, address validation_, address reputation_, address scheduler_, uint256 validatorFee_) {
        identity = IIdentityRegistry(identity_);
        validation = IValidationRegistry(validation_);
        reputation = IReputationRegistry(reputation_);
        owner = msg.sender;
        scheduler = scheduler_;
        validatorFee = validatorFee_;
        emit SchedulerSet(scheduler_);
        emit ValidatorFeeSet(validatorFee_);
    }

    // -------------------------------------------------------------------- admin

    function setValidatorAllowed(address validator_, bool allowed) external onlyOwner {
        validatorAllowed[validator_] = allowed;
        emit ValidatorAllowed(validator_, allowed);
    }

    function setScheduler(address scheduler_) external onlyOwner {
        scheduler = scheduler_;
        emit SchedulerSet(scheduler_);
    }

    function setValidatorFee(uint256 fee) external onlyOwner {
        validatorFee = fee;
        emit ValidatorFeeSet(fee);
    }

    // --------------------------------------------------------------------- flujo

    /// @notice La aseguradora crea la póliza y deposita.
    /// @dev msg.value = indemnización + computeFee + validatorFee * MAX_ATTEMPTS.
    ///      Lo que no se usa de fees del validador vuelve a la aseguradora al cerrar.
    function createJob(
        bytes32 inputHash,
        bytes32 modelHash,
        address validator_,
        address beneficiary,
        uint32 triggerBps,
        uint8 minScore,
        uint16 maxSaaBps,
        uint64 deadline,
        uint256 computeFee
    ) external payable returns (uint256 jobId) {
        if (!validatorAllowed[validator_]) revert ValidatorNotAllowed();
        if (beneficiary == address(0) || triggerBps == 0 || triggerBps > BPS || minScore == 0 || minScore > 100) {
            revert BadParams();
        }
        if (maxSaaBps > BPS || deadline <= block.timestamp) revert BadParams();
        uint256 vFees = validatorFee * MAX_ATTEMPTS;
        if (msg.value <= computeFee + vFees) revert BadParams();

        jobId = nextJobId++;
        Job storage j = _jobs[jobId];
        j.insurer = msg.sender;
        j.beneficiary = beneficiary;
        j.validator = validator_;
        j.inputHash = inputHash;
        j.modelHash = modelHash;
        j.triggerBps = triggerBps;
        j.minScore = minScore;
        j.maxSaaBps = maxSaaBps;
        j.deadline = deadline;
        j.computeFee = computeFee;
        j.validatorFeePerAttempt = validatorFee;
        j.indemnity = msg.value - computeFee - vFees;
        j.state = State.Created;

        emit JobCreated(jobId, msg.sender, beneficiary, j.indemnity);
    }

    /// @notice El scheduler asigna un nodo con su exposición a la Anomalía (saaBps).
    function assignNode(uint256 jobId, uint256 agentId, uint16 saaBps, bytes32 orbitHash) external onlyScheduler {
        Job storage j = _jobs[jobId];
        if (j.state != State.Created) revert BadState(j.state);
        _assign(jobId, j, agentId, saaBps, orbitHash);
    }

    /// @notice Tras un rechazo, el scheduler reasigna a otro nodo (otro intento).
    function reassign(uint256 jobId, uint256 newAgentId, uint16 saaBps, bytes32 orbitHash) external onlyScheduler {
        Job storage j = _jobs[jobId];
        if (j.state != State.Rejected) revert BadState(j.state);
        if (j.attempt >= MAX_ATTEMPTS) revert TooManyAttempts();
        _assign(jobId, j, newAgentId, saaBps, orbitHash);
    }

    function _assign(uint256 jobId, Job storage j, uint256 agentId, uint16 saaBps, bytes32 orbitHash) internal {
        if (block.timestamp > j.deadline) revert DeadlinePassed();
        if (saaBps > j.maxSaaBps) revert SaaTooHigh(saaBps, j.maxSaaBps);
        j.agentId = agentId;
        j.saaBps = saaBps;
        j.orbitHash = orbitHash;
        j.attempt += 1;
        j.nodePayee = address(0);
        j.indexBps = 0;
        j.outputHash = bytes32(0);
        j.merkleRoot = bytes32(0);
        j.requestHash = bytes32(0);
        j.state = State.Assigned;
        emit NodeAssigned(jobId, agentId, j.attempt, saaBps);
    }

    /// @notice El dueño del agente asignado publica el resultado y obtiene el requestHash
    ///         que debe usar en ValidationRegistry.validationRequest (nombrando al validador del job).
    function submitResult(uint256 jobId, uint32 indexBps, bytes32 outputHash, bytes32 merkleRoot)
        external
        returns (bytes32 requestHash)
    {
        Job storage j = _jobs[jobId];
        if (j.state != State.Assigned) revert BadState(j.state);
        if (block.timestamp > j.deadline) revert DeadlinePassed();
        if (identity.ownerOf(j.agentId) != msg.sender) revert NotAgentOwner();
        if (indexBps > BPS || outputHash == bytes32(0) || merkleRoot == bytes32(0)) revert BadParams();

        requestHash = computeRequestHash(jobId, j.attempt, j.agentId, j.inputHash, j.modelHash, indexBps, outputHash, merkleRoot);
        if (requestHashUsed[requestHash]) revert RequestHashReused();
        requestHashUsed[requestHash] = true;

        j.nodePayee = msg.sender;
        j.indexBps = indexBps;
        j.outputHash = outputHash;
        j.merkleRoot = merkleRoot;
        j.requestHash = requestHash;
        j.state = State.Submitted;

        emit ResultSubmitted(jobId, requestHash, indexBps);
    }

    /// @notice Cualquiera liquida una vez que el validador respondió en ERC-8004.
    /// @dev Lee la validación una sola vez: la respuesta en el registro es mutable, la liquidación no.
    function settle(uint256 jobId) external nonReentrant {
        Job storage j = _jobs[jobId];
        if (j.state != State.Submitted) revert BadState(j.state);

        (address vAddr, uint256 vAgent, uint8 score, bytes32 responseHash,,) = validation.getValidationStatus(j.requestHash);
        if (vAddr != j.validator || vAgent != j.agentId) revert ValidationMismatch();
        if (responseHash == bytes32(0)) revert NotResponded();

        uint256 vFee = j.validatorFeePerAttempt;
        address validator_ = j.validator;

        if (score < j.minScore) {
            // Rechazado: no se mueve la indemnización ni el fee del nodo. Se paga al validador y baja la reputación.
            j.state = State.Rejected;
            emit JobRejected(jobId, j.agentId, score);
            _feedback(jobId, j.agentId, 0, "rejected");
            _pay(validator_, vFee);
            return;
        }

        uint256 unusedVFees = vFee * (MAX_ATTEMPTS - j.attempt);
        address node = j.nodePayee;
        address insurer = j.insurer;
        uint256 indemnity = j.indemnity;
        uint256 computeFee = j.computeFee;

        if (j.indexBps >= j.triggerBps) {
            j.state = State.Paid;
            emit PayoutTriggered(jobId, j.beneficiary, j.indexBps, indemnity);
            _feedback(jobId, j.agentId, 100, "validated");
            _pay(j.beneficiary, indemnity);
            _pay(node, computeFee);
            _pay(validator_, vFee);
            _pay(insurer, unusedVFees);
        } else {
            j.state = State.NoPayout;
            emit NoPayout(jobId, j.indexBps);
            _feedback(jobId, j.agentId, 100, "validated");
            _pay(node, computeFee);
            _pay(validator_, vFee);
            _pay(insurer, indemnity + unusedVFees);
        }
    }

    /// @notice Tras el deadline, si el job no cerró, la aseguradora recupera lo que queda.
    function refund(uint256 jobId) external nonReentrant {
        Job storage j = _jobs[jobId];
        State s = j.state;
        if (s == State.None || s == State.Paid || s == State.NoPayout || s == State.Refunded) revert BadState(s);
        if (block.timestamp <= j.deadline) revert DeadlineNotPassed();
        // fees del validador ya pagados por intentos rechazados no vuelven
        uint256 rejectedAttempts = s == State.Rejected ? j.attempt : (j.attempt == 0 ? 0 : j.attempt - 1);
        uint256 amount = j.indemnity + j.computeFee + j.validatorFeePerAttempt * (MAX_ATTEMPTS - rejectedAttempts);
        j.state = State.Refunded;
        emit Refunded(jobId, amount);
        _pay(j.insurer, amount);
    }

    // ------------------------------------------------------------------ lectura

    function getJob(uint256 jobId) external view returns (Job memory) {
        return _jobs[jobId];
    }

    function computeRequestHash(
        uint256 jobId,
        uint8 attempt,
        uint256 agentId,
        bytes32 inputHash,
        bytes32 modelHash,
        uint32 indexBps,
        bytes32 outputHash,
        bytes32 merkleRoot
    ) public view returns (bytes32) {
        return keccak256(
            abi.encode(block.chainid, address(this), jobId, attempt, agentId, inputHash, modelHash, indexBps, outputHash, merkleRoot)
        );
    }

    // ---------------------------------------------------------------- internos

    function _feedback(uint256 jobId, uint256 agentId, int128 value, string memory tag) internal {
        if (address(reputation) == address(0)) return;
        try reputation.giveFeedback(agentId, value, 0, "puna", tag, "", "", bytes32(jobId)) {}
        catch {
            emit FeedbackFailed(jobId, agentId);
        }
    }

    function _pay(address to, uint256 amount) internal {
        if (amount == 0) return;
        (bool ok,) = to.call{value: amount}("");
        if (!ok) revert TransferFailed();
    }
}
