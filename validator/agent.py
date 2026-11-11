"""Agente validador: proceso propio, wallet propia (VALIDATOR_PK). Otro operador que el nodo.

Escucha ValidationRequest(validatorAddress = yo) en el Validation Registry de ERC-8004, y para cada uno:
  1. Ubica el job en el escrow (pista #job=… del requestURI) y exige job.requestHash == requestHash,
     job.validator == yo y estado Submitted. Si no, no responde: no es un pedido válido para mí.
  2. Baja los tensores del requestURI (sha256 del contenido = nombre del archivo).
  3. No confía en ningún JSON del nodo: audita contra los compromisos ON-CHAIN del job
     (inputHash, modelHash, outputHash, merkleRoot, indexBps) con su propia copia del modelo.
  4. Publica el certificado JSON (responseURI) y responde con su sha256 (responseHash).

  python -m validator.agent --once --from-block 12345678   # un barrido y termina
  python -m validator.agent                                 # sigue escuchando
"""
from __future__ import annotations

import argparse
import io
import json
import os
import time

from web3 import Web3

import onchain
from node.model import default_model
from node.publish import fetch, fragment, publish_bytes

from .verify import Certificate, Check, audit, load_traces

TAG = "puna-freivalds"


def audit_artifacts(job: dict, npz: bytes) -> Certificate:
    model = default_model()
    traces, lot_mask = load_traces(io.BytesIO(npz), model)
    return audit(
        model, traces, lot_mask,
        input_hash=bytes(job["inputHash"]), model_hash=bytes(job["modelHash"]),
        output_hash=bytes(job["outputHash"]), merkle_root=bytes(job["merkleRoot"]),
        claimed_index_bps=job["indexBps"],
    )


def handle(w3, esc, reg, acct, request_hash: bytes, agent_id: int, request_uri: str) -> bool:
    """True si respondió este pedido."""
    rh = "0x" + request_hash.hex()
    status = reg.functions.getValidationStatus(request_hash).call()
    if status[3] != b"\x00" * 32:
        print(f"· {rh[:12]}… ya respondido (score {status[2]}), salteo", flush=True)
        return False
    hint = fragment(request_uri)
    if Web3.to_checksum_address(hint.get("escrow", "0x" + "0" * 40)) != esc.address or "job" not in hint:
        print(f"· {rh[:12]}… no es de este escrow ({request_uri}), salteo", flush=True)
        return False
    job_id = int(hint["job"])
    job = onchain.get_job(esc, job_id)
    if bytes(job["requestHash"]) != request_hash or job["validator"] != acct.address or job["agentId"] != agent_id:
        print(f"· {rh[:12]}… no coincide con el job {job_id} on-chain, salteo", flush=True)
        return False
    if job["stateName"] != "Submitted":
        print(f"· job {job_id} en estado {job['stateName']}, salteo", flush=True)
        return False

    print(f"→ job {job_id} intento {job['attempt']} agente {agent_id}: audito {request_uri}", flush=True)
    try:
        cert = audit_artifacts(job, fetch(request_uri))
    except Exception as e:  # artefactos ausentes o adulterados: el nodo no probó nada
        cert = Certificate(0, [Check("artifacts", False, f"{type(e).__name__}: {e}")])
    print(f"  score {cert.score} — {cert.summary}", flush=True)

    body = json.loads(cert.to_json())
    body.update({"jobId": job_id, "attempt": job["attempt"], "agentId": agent_id, "requestHash": rh,
                 "escrow": esc.address, "validator": acct.address})
    cert_bytes = json.dumps(body, ensure_ascii=False, indent=2).encode()
    response_uri = publish_bytes(cert_bytes, "json")
    response_hash = Web3.keccak(cert_bytes)
    onchain.send(w3, f"validationResponse job {job_id} (score {cert.score})",
                 reg.functions.validationResponse(request_hash, cert.score, response_uri, response_hash, TAG), acct)
    print(f"  responseURI {response_uri}\n  responseHash {response_hash.to_0x_hex()}", flush=True)
    return True


def scan(w3, esc, reg, acct, frm: int, to: int) -> int:
    topic_me = "0x" + "00" * 12 + acct.address[2:].lower()
    ev = reg.events.ValidationRequest()
    handled = 0
    for a in range(frm, to + 1, onchain.LOGS_MAX_RANGE):
        b = min(to, a + onchain.LOGS_MAX_RANGE - 1)
        logs = w3.eth.get_logs({"address": reg.address, "fromBlock": a, "toBlock": b,
                                "topics": [ev.topic, topic_me]})
        for log in logs:
            e = ev.process_log(log)
            handled += handle(w3, esc, reg, acct, bytes(e.args.requestHash), e.args.agentId, e.args.requestURI)
    return handled


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--from-block", type=int, help="por defecto, los últimos 300 bloques")
    ap.add_argument("--once", action="store_true",
                    help="espera hasta responder al menos un pedido desde --from-block (o --timeout) y termina")
    ap.add_argument("--timeout", type=float, default=90.0)
    ap.add_argument("--poll", type=float, default=4.0)
    a = ap.parse_args()

    w3 = onchain.w3()
    acct = w3.eth.account.from_key(os.environ["VALIDATOR_PK"])
    esc, reg = onchain.escrow(w3), onchain.validation(w3)
    head = w3.eth.block_number
    frm = a.from_block if a.from_block is not None else max(0, head - 300)
    print(f"validador {acct.address} · escrow {esc.address} · desde bloque {frm}", flush=True)
    if a.once:
        # La RPC pública balancea entre nodos: uno atrasado puede no tener todavía el bloque o el log.
        # Re-barremos el mismo rango hasta responder algo o agotar el timeout.
        deadline = time.time() + a.timeout
        while time.time() < deadline:
            head = w3.eth.block_number
            if head >= frm and scan(w3, esc, reg, acct, frm, head):
                return
            time.sleep(a.poll)
        raise SystemExit(f"timeout: ningún pedido pendiente para {acct.address} desde el bloque {frm}")
    while True:
        head = w3.eth.block_number
        if head >= frm:
            scan(w3, esc, reg, acct, frm, head)
            frm = head + 1
        time.sleep(a.poll)


if __name__ == "__main__":
    main()
