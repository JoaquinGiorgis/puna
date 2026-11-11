"""Exporta a web/public/data/demo.json los datos REALES que muestra Mission Control.

- Eventos on-chain del job (PunaEscrow + Validation + Reputation de ERC-8004) con hash, bloque, hora y gas.
- Certificados del validador por intento (bajados de responseURI, verificados por sha256).
- Grilla FIRMS del Lote 14, celdas quemadas según el modelo y focos VIIRS dentro del lote.
- Órbitas: saaBps de cada nodo en la ventana; reputación de cada agente leída de Reputation.

  .venv/bin/python scripts/export_web.py --job 7 --from-block 60904995 --to-block 60905060
"""
from __future__ import annotations

import argparse
import csv
import json
import os
import sys
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

import numpy as np  # noqa: E402
from web3 import Web3  # noqa: E402

import onchain  # noqa: E402
from node.job import run_job  # noqa: E402
from node.model import burned_mask, default_model  # noqa: E402
from node.publish import fetch  # noqa: E402
from orbit import scheduler  # noqa: E402

LOT_BBOX = (-62.9370, -25.0760, -62.9020, -25.0410)  # w, s, e, n (sample-data/README.md)
REPUTATION_ABI = [
    {"type": "function", "name": "getSummary", "stateMutability": "view",
     "inputs": [{"name": "agentId", "type": "uint256"}, {"name": "clientAddresses", "type": "address[]"},
                {"name": "tag1", "type": "string"}, {"name": "tag2", "type": "string"}],
     "outputs": [{"name": "count", "type": "uint64"}, {"name": "summaryValue", "type": "int128"},
                 {"name": "summaryValueDecimals", "type": "uint8"}]},
    {"type": "event", "name": "NewFeedback", "anonymous": False, "inputs": [
        {"name": "agentId", "type": "uint256", "indexed": True},
        {"name": "clientAddress", "type": "address", "indexed": True},
        {"name": "feedbackIndex", "type": "uint64", "indexed": False},
        {"name": "value", "type": "int128", "indexed": False},
        {"name": "valueDecimals", "type": "uint8", "indexed": False},
        {"name": "indexedTag1", "type": "string", "indexed": True},
        {"name": "tag1", "type": "string", "indexed": False},
        {"name": "tag2", "type": "string", "indexed": False},
        {"name": "endpoint", "type": "string", "indexed": False},
        {"name": "feedbackURI", "type": "string", "indexed": False},
        {"name": "feedbackHash", "type": "bytes32", "indexed": False}]},
]
ESCROW_EVENTS = ["JobCreated", "NodeAssigned", "ResultSubmitted", "JobRejected", "PayoutTriggered", "NoPayout",
                 "Refunded", "FeedbackFailed"]


def hx(v) -> str:
    return "0x" + bytes(v).hex() if isinstance(v, (bytes, bytearray)) else str(v)


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--job", type=int, required=True)
    ap.add_argument("--from-block", type=int, required=True)
    ap.add_argument("--to-block", type=int, required=True)
    ap.add_argument("--out", default=str(ROOT / "web" / "public" / "data" / "demo.json"))
    a = ap.parse_args()

    w3 = onchain.w3()
    esc, reg = onchain.escrow(w3), onchain.validation(w3)
    rep = w3.eth.contract(address=onchain.REPUTATION, abi=REPUTATION_ABI)
    job = onchain.get_job(esc, a.job)

    # ---- logs del rango (de a 100 bloques por el límite de la RPC)
    logs = []
    for f in range(a.from_block, a.to_block + 1, onchain.LOGS_MAX_RANGE):
        logs += w3.eth.get_logs({"fromBlock": f, "toBlock": min(a.to_block, f + onchain.LOGS_MAX_RANGE - 1),
                                 "address": [esc.address, reg.address, rep.address]})
    decoded = []
    for log in logs:
        addr = log["address"].lower()
        events = ([getattr(esc.events, n)() for n in ESCROW_EVENTS] if addr == esc.address.lower() else
                  [reg.events.ValidationRequest()] if addr == reg.address.lower() else [rep.events.NewFeedback()])
        if addr == reg.address.lower():
            from onchain import VALIDATION_ABI  # ValidationResponse no está en el ABI mínimo
            extra = w3.eth.contract(address=reg.address, abi=VALIDATION_ABI + [{
                "type": "event", "name": "ValidationResponse", "anonymous": False, "inputs": [
                    {"name": "validatorAddress", "type": "address", "indexed": True},
                    {"name": "agentId", "type": "uint256", "indexed": True},
                    {"name": "requestHash", "type": "bytes32", "indexed": True},
                    {"name": "response", "type": "uint8", "indexed": False},
                    {"name": "responseURI", "type": "string", "indexed": False},
                    {"name": "responseHash", "type": "bytes32", "indexed": False},
                    {"name": "tag", "type": "string", "indexed": False}]}])
            events.append(extra.events.ValidationResponse())
        for ev in events:
            try:
                decoded.append(ev.process_log(log))
                break
            except Exception:
                continue

    # solo lo de este job: eventos del escrow con jobId, y ERC-8004 ligados a sus requestHash / txs
    job_txs, request_hashes = set(), set()
    for e in decoded:
        if e.address.lower() == esc.address.lower() and e.args.get("jobId") == a.job:
            job_txs.add(e.transactionHash)
            if e.event == "ResultSubmitted":
                request_hashes.add(bytes(e.args.requestHash))
    mine = [e for e in decoded if e.transactionHash in job_txs
            or (e.event in ("ValidationRequest", "ValidationResponse") and bytes(e.args.requestHash) in request_hashes)]

    txs, events, certs = {}, [], {}
    for e in sorted(mine, key=lambda e: (e.blockNumber, e.logIndex)):
        th = e.transactionHash.to_0x_hex()
        if th not in txs:
            r = w3.eth.get_transaction_receipt(th)
            b = w3.eth.get_block(r.blockNumber)
            txs[th] = {"hash": th, "block": r.blockNumber, "timestamp": b.timestamp, "from": r["from"],
                       "gasUsed": r.gasUsed, "feeWei": str(r.gasUsed * r.effectiveGasPrice)}
        args = {k: (hx(v) if isinstance(v, (bytes, bytearray)) else (str(v) if isinstance(v, int) and v > 2**53 else v))
                for k, v in e.args.items()}
        events.append({"event": e.event, "contract": "escrow" if e.address.lower() == esc.address.lower()
                       else "validation" if e.address.lower() == reg.address.lower() else "reputation",
                       "tx": th, "block": e.blockNumber, "logIndex": e.logIndex, "args": args})
        if e.event == "ValidationResponse":
            try:
                certs[hx(e.args.requestHash)] = json.loads(fetch(e.args.responseURI))
            except Exception as ex:
                print("no pude bajar el certificado", e.args.responseURI, ex)

    # intentos: NodeAssigned → ResultSubmitted → ValidationResponse → settle
    attempts = []
    for e in events:
        if e["event"] == "NodeAssigned":
            attempts.append({"attempt": e["args"]["attempt"], "agentId": e["args"]["agentId"],
                             "saaBps": e["args"]["saaBps"]})
        elif e["event"] == "ResultSubmitted":
            attempts[-1].update(indexBps=e["args"]["indexBps"], requestHash=e["args"]["requestHash"])
        elif e["event"] == "ValidationResponse" and attempts and attempts[-1].get("requestHash") == e["args"]["requestHash"]:
            attempts[-1].update(score=e["args"]["response"], certificate=certs.get(e["args"]["requestHash"]))
        elif e["event"] in ("JobRejected", "PayoutTriggered", "NoPayout") and attempts:
            attempts[-1]["outcome"] = {"JobRejected": "Rejected", "PayoutTriggered": "Paid", "NoPayout": "NoPayout"}[e["event"]]

    # ---- lote: grilla, quemado según el modelo, focos FIRMS
    lot = np.load(ROOT / "sample-data" / "lot14_grid.npz")
    grid, mask = lot["grid"], lot["lot_mask"]
    res = run_job(default_model(), grid, mask)
    burned = burned_mask(res.traces[-1].y) & mask
    w_, s_, e_, n_ = LOT_BBOX
    foci = []
    for row in csv.DictReader(open(ROOT / "sample-data" / "firms_anta.csv")):
        lat, lon = float(row["latitude"]), float(row["longitude"])
        if w_ <= lon < e_ and s_ <= lat < n_:
            foci.append({"x": (lon - w_) / (e_ - w_), "y": (n_ - lat) / (n_ - s_), "frp": float(row["frp"] or 0),
                         "date": row["acq_date"], "time": row["acq_time"], "sat": row["satellite"],
                         "confidence": row["confidence"]})
    dates = sorted({f["date"] for f in foci})

    # ---- nodos: órbita + reputación
    agent_ids = {"ORBIT-07": int(os.environ["AGENT_ID_A"]), "ORBIT-03": int(os.environ["AGENT_ID_B"])}
    norad = {"ORBIT-07": ("NOAA 20", 43013), "ORBIT-03": ("NOAA 21", 54234)}
    nodes = []
    for n in scheduler.NODES:
        saa, oh = scheduler.exposure(n, scheduler.WINDOW)
        cnt, val, dec = rep.functions.getSummary(agent_ids[n.name], [esc.address], "puna", "").call()
        nodes.append({"name": n.name, "agentId": agent_ids[n.name], "proxy": norad[n.name][0], "norad": norad[n.name][1],
                      "saaBps": saa, "orbitHash": "0x" + oh.hex(),
                      "reputation": {"count": cnt, "average": (val / 10**dec) if cnt else None}})

    out = {
        "generatedAt": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "chain": {"id": onchain.CHAIN_ID, "name": "Avalanche Fuji", "explorer": "https://testnet.snowtrace.io"},
        "contracts": {"escrow": esc.address, "identity": onchain.IDENTITY, "validation": onchain.VALIDATION,
                      "reputation": onchain.REPUTATION},
        "job": {
            "id": a.job, "state": job["stateName"], "insurer": job["insurer"], "beneficiary": job["beneficiary"],
            "validator": job["validator"], "inputHash": hx(job["inputHash"]), "modelHash": hx(job["modelHash"]),
            "outputHash": hx(job["outputHash"]), "merkleRoot": hx(job["merkleRoot"]),
            "triggerBps": job["triggerBps"], "minScore": job["minScore"], "maxSaaBps": job["maxSaaBps"],
            "indexBps": job["indexBps"], "indemnityWei": str(job["indemnity"]), "computeFeeWei": str(job["computeFee"]),
            "validatorFeeWei": str(job["validatorFeePerAttempt"]), "attempt": job["attempt"],
        },
        "attempts": attempts,
        "events": events,
        "txs": list(txs.values()),
        "window": {"start": scheduler.WINDOW.isoformat(), "minutes": scheduler.WINDOW_MIN},
        "nodes": nodes,
        "lot": {"name": "Lote 14", "place": "Anta, Salta", "bbox": LOT_BBOX, "cells": int(mask.sum()),
                "mask": mask.astype(int).tolist(), "burned": burned.astype(int).tolist(),
                "detections": (grid[..., 1] > 0).astype(int).tolist(), "foci": foci,
                "fociDates": [dates[0], dates[-1]] if dates else None, "source": "NASA FIRMS VIIRS (NOAA-20/21) 375 m"},
        "bench": json.loads((ROOT / "bench" / "results.json").read_text()),
    }
    Path(a.out).parent.mkdir(parents=True, exist_ok=True)
    Path(a.out).write_text(json.dumps(out, indent=1, ensure_ascii=False))
    print(f"ok {a.out}: {len(events)} eventos, {len(txs)} txs, {len(attempts)} intentos, {len(foci)} focos, "
          f"certificados {len(certs)}")


if __name__ == "__main__":
    main()
