"""Smoke test H0 (#1): flujo ERC-8004 contra los registros reales de Fuji.

a) nodeA y nodeB se registran en Identity → agentId
b) nodeA: validationRequest(validator, agentIdA, "ipfs://smoke", requestHash)
c) validator: validationResponse(requestHash, 100, "ipfs://cert", keccak("cert"), "smoke")
d) getValidationStatus(requestHash) se compara campo por campo

Uso (desde la raíz):  .venv/bin/python scripts/smoke_erc8004.py [--skip-register]
Lee claves de .env y guarda AGENT_ID_A / AGENT_ID_B en .env.
"""
from __future__ import annotations

import os
import secrets
import sys
from pathlib import Path

from dotenv import load_dotenv, set_key
from web3 import Web3
from web3.logs import DISCARD

ROOT = Path(__file__).resolve().parents[1]
ENV = ROOT / ".env"
load_dotenv(ENV)

IDENTITY = "0x8004A818BFB912233c491871b3d84c89A494BD9e"
VALIDATION = "0x8004Cb1BF31DAf7788923b405b754f57acEB4272"
EXPLORER = "https://testnet.snowtrace.io/tx/"

IDENTITY_ABI = [
    {"type": "function", "name": "register", "stateMutability": "nonpayable",
     "inputs": [{"name": "agentURI", "type": "string"}],
     "outputs": [{"name": "agentId", "type": "uint256"}]},
    {"type": "function", "name": "ownerOf", "stateMutability": "view",
     "inputs": [{"name": "tokenId", "type": "uint256"}],
     "outputs": [{"name": "", "type": "address"}]},
    {"type": "event", "name": "Registered", "anonymous": False, "inputs": [
        {"name": "agentId", "type": "uint256", "indexed": True},
        {"name": "agentURI", "type": "string", "indexed": False},
        {"name": "owner", "type": "address", "indexed": True}]},
]
VALIDATION_ABI = [
    {"type": "function", "name": "validationRequest", "stateMutability": "nonpayable", "outputs": [],
     "inputs": [{"name": "validatorAddress", "type": "address"}, {"name": "agentId", "type": "uint256"},
                {"name": "requestURI", "type": "string"}, {"name": "requestHash", "type": "bytes32"}]},
    {"type": "function", "name": "validationResponse", "stateMutability": "nonpayable", "outputs": [],
     "inputs": [{"name": "requestHash", "type": "bytes32"}, {"name": "response", "type": "uint8"},
                {"name": "responseURI", "type": "string"}, {"name": "responseHash", "type": "bytes32"},
                {"name": "tag", "type": "string"}]},
    {"type": "function", "name": "getValidationStatus", "stateMutability": "view",
     "inputs": [{"name": "requestHash", "type": "bytes32"}],
     "outputs": [{"name": "validatorAddress", "type": "address"}, {"name": "agentId", "type": "uint256"},
                 {"name": "response", "type": "uint8"}, {"name": "responseHash", "type": "bytes32"},
                 {"name": "tag", "type": "string"}, {"name": "lastUpdate", "type": "uint256"}]},
]

w3 = Web3(Web3.HTTPProvider(os.environ["FUJI_RPC_URL"]))
assert w3.eth.chain_id == 43113, f"chain inesperada: {w3.eth.chain_id}"
identity = w3.eth.contract(address=IDENTITY, abi=IDENTITY_ABI)
validation = w3.eth.contract(address=VALIDATION, abi=VALIDATION_ABI)

node_a = w3.eth.account.from_key(os.environ["NODE_A_PK"])
node_b = w3.eth.account.from_key(os.environ["NODE_B_PK"])
validator = w3.eth.account.from_key(os.environ["VALIDATOR_PK"])


def send(label: str, fn, acct):
    tx = fn.build_transaction({
        "from": acct.address,
        "nonce": w3.eth.get_transaction_count(acct.address),
        "chainId": 43113,
    })
    signed = acct.sign_transaction(tx)
    h = w3.eth.send_raw_transaction(signed.raw_transaction)
    rcpt = w3.eth.wait_for_transaction_receipt(h, timeout=120)
    ok = "ok" if rcpt.status == 1 else "REVERT"
    print(f"[{ok}] {label}\n      tx {h.to_0x_hex()}\n      {EXPLORER}{h.to_0x_hex()}")
    if rcpt.status != 1:
        sys.exit(f"falló: {label}")
    return rcpt


def register(label: str, acct, uri: str) -> int:
    rcpt = send(f"Identity.register ({label})", identity.functions.register(uri), acct)
    # el receipt trae Transfer/MetadataSet además de Registered: descartamos lo que no matchea
    ev = identity.events.Registered().process_receipt(rcpt, errors=DISCARD)[0]
    agent_id = ev.args.agentId
    assert identity.functions.ownerOf(agent_id).call() == acct.address
    print(f"      agentId {label} = {agent_id} (owner {acct.address})")
    return agent_id


def main() -> None:
    skip = "--skip-register" in sys.argv and os.getenv("AGENT_ID_A") and os.getenv("AGENT_ID_B")
    if skip:
        agent_a, agent_b = int(os.environ["AGENT_ID_A"]), int(os.environ["AGENT_ID_B"])
        print(f"usando agentId existentes: A={agent_a} B={agent_b}")
    else:
        # a) registro
        agent_a = register("ORBIT-07", node_a, "ipfs://puna/agents/orbit-07")
        agent_b = register("ORBIT-03", node_b, "ipfs://puna/agents/orbit-03")
        set_key(str(ENV), "AGENT_ID_A", str(agent_a), quote_mode="never")
        set_key(str(ENV), "AGENT_ID_B", str(agent_b), quote_mode="never")

    # b) pedido de validación desde el dueño del agente
    request_hash = "0x" + secrets.token_hex(32)
    print(f"requestHash = {request_hash}")
    send("Validation.validationRequest (nodeA)",
         validation.functions.validationRequest(validator.address, agent_a, "ipfs://smoke", request_hash), node_a)

    # c) respuesta del validador nombrado
    cert_hash = Web3.keccak(text="cert")
    send("Validation.validationResponse (validator)",
         validation.functions.validationResponse(request_hash, 100, "ipfs://cert", cert_hash, "smoke"), validator)

    # d) lectura y comparación campo por campo
    got = validation.functions.getValidationStatus(request_hash).call()
    expected = {
        "validatorAddress": validator.address,
        "agentId": agent_a,
        "response": 100,
        "responseHash": bytes(cert_hash),
        "tag": "smoke",
    }
    names = ["validatorAddress", "agentId", "response", "responseHash", "tag", "lastUpdate"]
    fails = 0
    for name, value in zip(names, got):
        if name == "lastUpdate":
            print(f"  {name:17} {value} ({'ok' if value > 0 else 'FALLA'})")
            fails += value == 0
            continue
        ok = value == expected[name]
        fails += not ok
        shown = "0x" + value.hex() if isinstance(value, bytes) else value
        print(f"  {name:17} {shown} ({'ok' if ok else 'FALLA, esperaba ' + str(expected[name])})")
    if fails:
        sys.exit(f"getValidationStatus: {fails} campo(s) no coinciden")
    print("SMOKE OK: Identity + Validation de ERC-8004 funcionan en Fuji.")


if __name__ == "__main__":
    main()
