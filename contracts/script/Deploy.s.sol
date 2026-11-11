// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console2} from "forge-std/Script.sol";
import {PunaEscrow} from "../src/PunaEscrow.sol";

/// forge script script/Deploy.s.sol --rpc-url fuji --broadcast --verify
/// Variables en .env (nunca en el repo): DEPLOYER_PK, SCHEDULER_ADDR, VALIDATOR_ADDR, VALIDATOR_FEE_WEI
contract Deploy is Script {
    // ERC-8004 en Avalanche testnet (Fuji) — github.com/erc-8004/erc-8004-contracts
    address constant IDENTITY = 0x8004A818BFB912233c491871b3d84c89A494BD9e;
    address constant REPUTATION = 0x8004B663056A597Dffe9eCcC1965A193B7388713;
    // Validation no figura en el README para Avalanche testnet: confirmar en H0 (scripts/smoke_erc8004.py)
    address constant VALIDATION = 0x8004Cb1BF31DAf7788923b405b754f57acEB4272;

    function run() external returns (PunaEscrow escrow) {
        uint256 pk = vm.envUint("DEPLOYER_PK");
        address scheduler = vm.envAddress("SCHEDULER_ADDR");
        address validator = vm.envAddress("VALIDATOR_ADDR");
        uint256 vFee = vm.envOr("VALIDATOR_FEE_WEI", uint256(0.01 ether));

        vm.startBroadcast(pk);
        escrow = new PunaEscrow(IDENTITY, VALIDATION, REPUTATION, scheduler, vFee);
        escrow.setValidatorAllowed(validator, true);
        vm.stopBroadcast();

        console2.log("PunaEscrow:", address(escrow));
    }
}
