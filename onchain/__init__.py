"""Acceso compartido a Fuji: web3, contratos (PunaEscrow + ERC-8004) y envío de transacciones.

Lee FUJI_RPC_URL y PUNA_ESCROW de .env. Las claves privadas las pasa cada agente (nunca se loguean).
"""
from __future__ import annotations

import json
import os
from pathlib import Path

from dotenv import load_dotenv
from web3 import Web3

ROOT = Path(__file__).resolve().parents[1]
load_dotenv(ROOT / ".env")

CHAIN_ID = 43113
EXPLORER_TX = "https://testnet.snowtrace.io/tx/"
IDENTITY = "0x8004A818BFB912233c491871b3d84c89A494BD9e"
REPUTATION = "0x8004B663056A597Dffe9eCcC1965A193B7388713"
VALIDATION = "0x8004Cb1BF31DAf7788923b405b754f57acEB4272"
# La RPC pública de Fuji limita eth_getLogs a 100 bloques por pedido.
LOGS_MAX_RANGE = 100

STATES = ["None", "Created", "Assigned", "Submitted", "Paid", "NoPayout", "Rejected", "Refunded"]

ESCROW_ABI = json.loads((Path(__file__).parent / "abi" / "PunaEscrow.json").read_text())

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
    {"type": "event", "name": "ValidationRequest", "anonymous": False, "inputs": [
        {"name": "validatorAddress", "type": "address", "indexed": True},
        {"name": "agentId", "type": "uint256", "indexed": True},
        {"name": "requestURI", "type": "string", "indexed": False},
        {"name": "requestHash", "type": "bytes32", "indexed": True}]},
    # misma firma que web/lib/live.ts
    {"type": "event", "name": "ValidationResponse", "anonymous": False, "inputs": [
        {"name": "validatorAddress", "type": "address", "indexed": True},
        {"name": "agentId", "type": "uint256", "indexed": True},
        {"name": "requestHash", "type": "bytes32", "indexed": True},
        {"name": "response", "type": "uint8", "indexed": False},
        {"name": "responseURI", "type": "string", "indexed": False},
        {"name": "responseHash", "type": "bytes32", "indexed": False},
        {"name": "tag", "type": "string", "indexed": False}]},
]


def w3() -> Web3:
    w = Web3(Web3.HTTPProvider(os.environ["FUJI_RPC_URL"]))
    if w.eth.chain_id != CHAIN_ID:
        raise SystemExit(f"chain inesperada: {w.eth.chain_id}")
    return w


def escrow(w: Web3, address: str | None = None):
    return w.eth.contract(address=Web3.to_checksum_address(address or os.environ["PUNA_ESCROW"]), abi=ESCROW_ABI)


def validation(w: Web3):
    return w.eth.contract(address=VALIDATION, abi=VALIDATION_ABI)


def get_job(esc, job_id: int) -> dict:
    """getJob como dict con los nombres del struct (web3 devuelve una tupla)."""
    fn_abi = next(f for f in ESCROW_ABI if f.get("name") == "getJob")
    names = [c["name"] for c in fn_abi["outputs"][0]["components"]]
    job = dict(zip(names, esc.functions.getJob(job_id).call()))
    job["stateName"] = STATES[job["state"]]
    return job


def send(w: Web3, label: str, fn, acct, value: int = 0):
    """Firma y manda la tx; imprime hash y link. Corta si revierte."""
    tx = fn.build_transaction({
        "from": acct.address,
        # "pending": la RPC pública balancea entre nodos y uno atrasado puede devolver un nonce viejo
        "nonce": w.eth.get_transaction_count(acct.address, "pending"),
        "chainId": CHAIN_ID,
        "value": value,
    })
    # La estimación queda justa cuando se escriben strings en storage (validationResponse se
    # quedó sin gas en Fuji con el valor estimado): margen de 30 %.
    tx["gas"] = tx["gas"] * 13 // 10
    h = w.eth.send_raw_transaction(acct.sign_transaction(tx).raw_transaction)
    rcpt = w.eth.wait_for_transaction_receipt(h, timeout=180)
    hx = h.to_0x_hex()
    print(f"[{'ok' if rcpt.status == 1 else 'REVERT'}] {label}\n      {EXPLORER_TX}{hx}", flush=True)
    if rcpt.status != 1:
        raise SystemExit(f"falló: {label}")
    return rcpt
