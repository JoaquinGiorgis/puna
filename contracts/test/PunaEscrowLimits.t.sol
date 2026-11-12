// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {PunaEscrow} from "../src/PunaEscrow.sol";
import {MockIdentity, MockValidation, MockReputation} from "./mocks/MockERC8004.sol";

/// Beneficiario que rechaza AVAX (p. ej. un contrato sin receive).
contract RejectingBeneficiary {}

/// Límites conocidos del escrow desplegado (0xBcA4…F982, congelado y verificado).
/// No se corrigen en el MVP para no cambiar el fuente verificado; cada test fija el comportamiento
/// actual y docs/revision-avalanche.md describe el arreglo para la v2.
contract PunaEscrowLimitsTest is Test {
    PunaEscrow escrow;
    MockIdentity identity;
    MockValidation validation;

    address insurer = makeAddr("insurer");
    address farmer = makeAddr("farmer");
    address scheduler = makeAddr("scheduler");
    address validator = makeAddr("validator");
    address node = makeAddr("orbit03");
    uint256 agent;

    uint256 constant INDEMNITY = 1 ether;
    uint256 constant COMPUTE_FEE = 0.05 ether;
    uint256 constant V_FEE = 0.01 ether;

    function setUp() public {
        identity = new MockIdentity();
        validation = new MockValidation(identity);
        escrow = new PunaEscrow(address(identity), address(validation), address(new MockReputation()), scheduler, V_FEE);
        escrow.setValidatorAllowed(validator, true);
        agent = identity.register(node);
        vm.deal(insurer, 10 ether);
    }

    function _approvedJob(address beneficiary) internal returns (uint256 id) {
        vm.prank(insurer);
        id = escrow.createJob{value: INDEMNITY + COMPUTE_FEE + V_FEE * 3}(
            keccak256("grid"), keccak256("model"), validator, beneficiary, 3000, 80, 10_000,
            uint64(block.timestamp + 1 hours), COMPUTE_FEE
        );
        vm.prank(scheduler);
        escrow.assignNode(id, agent, 0, bytes32(0));
        vm.prank(node);
        bytes32 rh = escrow.submitResult(id, 3777, keccak256("out"), keccak256("root"));
        vm.prank(node);
        validation.validationRequest(validator, agent, "ipfs://req", rh);
        vm.prank(validator);
        validation.validationResponse(rh, 100, "ipfs://cert", keccak256("cert"), "puna-freivalds");
    }

    /// settle no tiene deadline: una validación aprobada se puede liquidar tarde si nadie pidió refund.
    function test_SettleAfterDeadlineStillPays() public {
        uint256 id = _approvedJob(farmer);
        vm.warp(block.timestamp + 2 hours);
        escrow.settle(id);
        assertEq(uint256(escrow.getJob(id).state), uint256(PunaEscrow.State.Paid));
        assertEq(farmer.balance, INDEMNITY);
    }

    /// LÍMITE 1: pasado el deadline, refund acepta un job Submitted aunque el validador ya haya aprobado.
    /// Si la aseguradora llama refund antes que alguien llame settle, el productor no cobra.
    /// Mitigación operativa: settle lo puede llamar cualquiera (el productor o un bot) apenas responde el validador.
    function test_Limit_RefundBeatsApprovedSettleAfterDeadline() public {
        uint256 id = _approvedJob(farmer);
        vm.warp(block.timestamp + 2 hours);
        escrow.refund(id);
        assertEq(uint256(escrow.getJob(id).state), uint256(PunaEscrow.State.Refunded));
        assertEq(farmer.balance, 0);
        vm.expectRevert(abi.encodeWithSelector(PunaEscrow.BadState.selector, PunaEscrow.State.Refunded));
        escrow.settle(id);
    }

    /// LÍMITE 2: pagos push. Si el beneficiario no acepta AVAX, settle revierte entero (TransferFailed)
    /// y la plata queda hasta el deadline, cuando vuelve a la aseguradora. v2: pull payments (withdraw).
    function test_Limit_RejectingBeneficiaryBlocksSettle() public {
        address bad = address(new RejectingBeneficiary());
        uint256 id = _approvedJob(bad);
        vm.expectRevert(PunaEscrow.TransferFailed.selector);
        escrow.settle(id);
        assertEq(uint256(escrow.getJob(id).state), uint256(PunaEscrow.State.Submitted));
    }
}
