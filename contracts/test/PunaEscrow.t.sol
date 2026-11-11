// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {PunaEscrow} from "../src/PunaEscrow.sol";
import {MockIdentity, MockValidation, MockReputation} from "./mocks/MockERC8004.sol";

contract PunaEscrowTest is Test {
    PunaEscrow escrow;
    MockIdentity identity;
    MockValidation validation;
    MockReputation reputation;

    address insurer = makeAddr("insurer");
    address farmer = makeAddr("farmer");
    address scheduler = makeAddr("scheduler");
    address validator = makeAddr("validator");
    address nodeA = makeAddr("orbit07");
    address nodeB = makeAddr("orbit03");

    uint256 agentA;
    uint256 agentB;

    uint256 constant INDEMNITY = 2.5 ether;
    uint256 constant COMPUTE_FEE = 0.05 ether;
    uint256 constant V_FEE = 0.01 ether;
    uint32 constant TRIGGER = 3000; // 30,0 %
    bytes32 constant INPUT = keccak256("grid");
    bytes32 constant MODEL = keccak256("cnn-int8-v1");

    function setUp() public {
        identity = new MockIdentity();
        validation = new MockValidation(identity);
        reputation = new MockReputation();
        escrow = new PunaEscrow(address(identity), address(validation), address(reputation), scheduler, V_FEE);
        escrow.setValidatorAllowed(validator, true);
        agentA = identity.register(nodeA);
        agentB = identity.register(nodeB);
        vm.deal(insurer, 10 ether);
    }

    // ------------------------------------------------------------ helpers

    function _create() internal returns (uint256) {
        vm.prank(insurer);
        return escrow.createJob{value: INDEMNITY + COMPUTE_FEE + V_FEE * 3}(
            INPUT, MODEL, validator, farmer, TRIGGER, 80, 5000, uint64(block.timestamp + 1 days), COMPUTE_FEE
        );
    }

    function _submitAndValidate(uint256 jobId, address node, uint256 agentId, uint32 indexBps, uint8 score)
        internal
        returns (bytes32 rh)
    {
        vm.prank(node);
        rh = escrow.submitResult(jobId, indexBps, keccak256(abi.encode("out", indexBps)), keccak256("root"));
        vm.prank(node);
        validation.validationRequest(validator, agentId, "ipfs://req", rh);
        vm.prank(validator);
        validation.validationResponse(rh, score, "ipfs://cert", keccak256("cert"), "freivalds");
    }

    // -------------------------------------------------------------- tests

    function test_HappyPath_Paid() public {
        uint256 id = _create();
        vm.prank(scheduler);
        escrow.assignNode(id, agentB, 0, keccak256("orbit"));
        _submitAndValidate(id, nodeB, agentB, 3740, 100);

        uint256 insurerBefore = insurer.balance;
        escrow.settle(id);

        assertEq(uint256(escrow.getJob(id).state), uint256(PunaEscrow.State.Paid));
        assertEq(farmer.balance, INDEMNITY);
        assertEq(nodeB.balance, COMPUTE_FEE);
        assertEq(validator.balance, V_FEE);
        assertEq(insurer.balance - insurerBefore, V_FEE * 2); // fees no usados
        assertEq(address(escrow).balance, 0);
        assertEq(reputation.count(), 1);
    }

    function test_NoPayout_BelowTrigger() public {
        uint256 id = _create();
        vm.prank(scheduler);
        escrow.assignNode(id, agentB, 0, bytes32(0));
        _submitAndValidate(id, nodeB, agentB, 1200, 100);
        uint256 insurerBefore = insurer.balance;
        escrow.settle(id);
        assertEq(uint256(escrow.getJob(id).state), uint256(PunaEscrow.State.NoPayout));
        assertEq(farmer.balance, 0);
        assertEq(nodeB.balance, COMPUTE_FEE);
        assertEq(insurer.balance - insurerBefore, INDEMNITY + V_FEE * 2);
        assertEq(address(escrow).balance, 0);
    }

    /// Guion de la demo: ORBIT-07 en la Anomalía devuelve 0 %, se rechaza, se reasigna a ORBIT-03 y paga.
    function test_DemoScript_RejectReassignPay() public {
        uint256 id = _create();
        vm.prank(scheduler);
        escrow.assignNode(id, agentA, 4200, keccak256("orbit07"));
        _submitAndValidate(id, nodeA, agentA, 0, 12);

        escrow.settle(id);
        assertEq(uint256(escrow.getJob(id).state), uint256(PunaEscrow.State.Rejected));
        assertEq(farmer.balance, 0);
        assertEq(nodeA.balance, 0);
        assertEq(validator.balance, V_FEE);

        vm.prank(scheduler);
        escrow.reassign(id, agentB, 0, keccak256("orbit03"));
        _submitAndValidate(id, nodeB, agentB, 3740, 100);
        escrow.settle(id);

        assertEq(uint256(escrow.getJob(id).state), uint256(PunaEscrow.State.Paid));
        assertEq(farmer.balance, INDEMNITY);
        assertEq(nodeB.balance, COMPUTE_FEE);
        assertEq(validator.balance, V_FEE * 2);
        assertEq(address(escrow).balance, 0);
        assertEq(escrow.getJob(id).attempt, 2);
    }

    function test_Revert_SaaTooHigh() public {
        uint256 id = _create();
        vm.prank(scheduler);
        vm.expectRevert(abi.encodeWithSelector(PunaEscrow.SaaTooHigh.selector, uint16(6400), uint16(5000)));
        escrow.assignNode(id, agentA, 6400, bytes32(0));
    }

    function test_Revert_SubmitByNonOwner() public {
        uint256 id = _create();
        vm.prank(scheduler);
        escrow.assignNode(id, agentB, 0, bytes32(0));
        vm.prank(nodeA);
        vm.expectRevert(PunaEscrow.NotAgentOwner.selector);
        escrow.submitResult(id, 3740, keccak256("o"), keccak256("r"));
    }

    function test_Revert_SettleBeforeResponse() public {
        uint256 id = _create();
        vm.prank(scheduler);
        escrow.assignNode(id, agentB, 0, bytes32(0));
        vm.prank(nodeB);
        bytes32 rh = escrow.submitResult(id, 3740, keccak256("o"), keccak256("r"));
        vm.prank(nodeB);
        validation.validationRequest(validator, agentB, "", rh);
        vm.expectRevert(PunaEscrow.NotResponded.selector);
        escrow.settle(id);
    }

    function test_Revert_WrongValidatorNamed() public {
        address other = makeAddr("other-validator");
        uint256 id = _create();
        vm.prank(scheduler);
        escrow.assignNode(id, agentB, 0, bytes32(0));
        vm.prank(nodeB);
        bytes32 rh = escrow.submitResult(id, 3740, keccak256("o"), keccak256("r"));
        vm.prank(nodeB);
        validation.validationRequest(other, agentB, "", rh); // el nodo nombra a un validador amigo
        vm.prank(other);
        validation.validationResponse(rh, 100, "", keccak256("c"), "");
        vm.expectRevert(PunaEscrow.ValidationMismatch.selector);
        escrow.settle(id);
    }

    function test_Revert_DoubleSettle() public {
        uint256 id = _create();
        vm.prank(scheduler);
        escrow.assignNode(id, agentB, 0, bytes32(0));
        _submitAndValidate(id, nodeB, agentB, 3740, 100);
        escrow.settle(id);
        vm.expectRevert(abi.encodeWithSelector(PunaEscrow.BadState.selector, PunaEscrow.State.Paid));
        escrow.settle(id);
    }

    function test_Revert_ValidatorNotAllowed() public {
        vm.prank(insurer);
        vm.expectRevert(PunaEscrow.ValidatorNotAllowed.selector);
        escrow.createJob{value: 3 ether}(INPUT, MODEL, nodeA, farmer, TRIGGER, 80, 5000, uint64(block.timestamp + 1), 0);
    }

    function test_ReputationDownDoesNotBlockSettle() public {
        reputation.setRevert(true);
        uint256 id = _create();
        vm.prank(scheduler);
        escrow.assignNode(id, agentB, 0, bytes32(0));
        _submitAndValidate(id, nodeB, agentB, 3740, 100);
        escrow.settle(id);
        assertEq(farmer.balance, INDEMNITY);
    }

    function test_Refund_AfterDeadline_AfterOneRejection() public {
        uint256 id = _create();
        vm.prank(scheduler);
        escrow.assignNode(id, agentA, 100, bytes32(0));
        _submitAndValidate(id, nodeA, agentA, 0, 10);
        escrow.settle(id);

        uint256 before = insurer.balance;
        vm.warp(block.timestamp + 2 days);
        escrow.refund(id);
        assertEq(insurer.balance - before, INDEMNITY + COMPUTE_FEE + V_FEE * 2);
        assertEq(address(escrow).balance, 0);
    }

    function test_Revert_ReassignLimit() public {
        uint256 id = _create();
        for (uint256 i = 0; i < 3; i++) {
            vm.prank(scheduler);
            if (i == 0) escrow.assignNode(id, agentA, 0, bytes32(i));
            else escrow.reassign(id, agentA, 0, bytes32(i));
            _submitAndValidate(id, nodeA, agentA, uint32(i), 0);
            escrow.settle(id);
        }
        vm.prank(scheduler);
        vm.expectRevert(PunaEscrow.TooManyAttempts.selector);
        escrow.reassign(id, agentB, 0, bytes32(0));
    }

    function testFuzz_SettleConservesFunds(uint32 indexBps, uint8 score) public {
        indexBps = uint32(bound(indexBps, 0, 10_000));
        score = uint8(bound(score, 0, 100));
        uint256 id = _create();
        vm.prank(scheduler);
        escrow.assignNode(id, agentB, 0, bytes32(0));
        _submitAndValidate(id, nodeB, agentB, indexBps, score);
        uint256 total = address(escrow).balance;
        uint256 before = insurer.balance + farmer.balance + nodeB.balance + validator.balance;
        escrow.settle(id);
        uint256 afterSum = insurer.balance + farmer.balance + nodeB.balance + validator.balance;
        assertEq(afterSum - before + address(escrow).balance, total);
    }
}
