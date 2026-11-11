"""E2E on-chain en Fuji: createJob → assignNode → job + submitResult + validationRequest → agente validador → settle.

Cada rol firma con su propia wallet de .env; el validador corre como proceso aparte (python -m validator.agent).

  .venv/bin/python scripts/e2e.py                          # camino feliz: ORBIT-03 honesto → Paid
  .venv/bin/python scripts/e2e.py --node 07 --fault weight:2:2:7   # falla de la demo → Rejected
  .venv/bin/python scripts/e2e.py --job 5 --node 03        # reassign de un job rechazado
"""
from __future__ import annotations

import argparse
import os
import subprocess
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

import numpy as np  # noqa: E402
from web3 import Web3  # noqa: E402
from web3.logs import DISCARD  # noqa: E402

import onchain  # noqa: E402
from node.job import _parse_fault, run_job, save_artifacts  # noqa: E402
from node.model import default_model, tensor_hash  # noqa: E402
from node.publish import publish_file  # noqa: E402
from orbit.saa import orbit_hash, read_tle, saa_bps  # noqa: E402

GRID = ROOT / "sample-data" / "lot14_grid.npz"
WINDOW = datetime(2026, 11, 12, 15, 30, tzinfo=timezone.utc)  # ventana de la demo (orbit/saa.py)
WINDOW_MIN = 9
NODES = {  # ORBIT-xx → (clave del dueño, agentId, TLE)
    "07": ("NODE_A_PK", "AGENT_ID_A", ROOT / "sample-data" / "tle" / "orbit07.tle"),
    "03": ("NODE_B_PK", "AGENT_ID_B", ROOT / "sample-data" / "tle" / "orbit03.tle"),
}


def ether(w3, wei: int) -> str:
    return f"{Web3.from_wei(wei, 'ether'):.4f} AVAX"


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--node", choices=NODES, default="03")
    ap.add_argument("--fault", help="kind:layer:seed[:bits] (ej. weight:2:2:7)")
    ap.add_argument("--job", type=int, help="job existente en Rejected: hace reassign en vez de createJob")
    ap.add_argument("--value", default="0.02", help="AVAX que deposita la aseguradora")
    ap.add_argument("--compute-fee", default="0.002")
    ap.add_argument("--min-score", type=int, default=80)
    ap.add_argument("--trigger-bps", type=int, default=3000)
    ap.add_argument("--max-saa-bps", type=int, default=10_000)
    ap.add_argument("--no-settle", action="store_true")
    a = ap.parse_args()

    w3 = onchain.w3()
    esc, reg = onchain.escrow(w3), onchain.validation(w3)
    acct = lambda k: w3.eth.account.from_key(os.environ[k])  # noqa: E731
    insurer, scheduler, validator = acct("INSURER_PK"), acct("SCHEDULER_PK"), acct("VALIDATOR_PK")
    pk_env, id_env, tle = NODES[a.node]
    node, agent_id = acct(pk_env), int(os.environ[id_env])
    producer = Web3.to_checksum_address(os.environ["PRODUCER_ADDR"])
    print(f"escrow {esc.address} · ORBIT-{a.node} (agentId {agent_id}) · fault {a.fault or 'ninguna'}\n", flush=True)

    model = default_model()
    lot = np.load(GRID)
    grid, mask = lot["grid"], lot["lot_mask"]

    # 1. aseguradora crea la póliza (o se reusa un job rechazado)
    if a.job is None:
        deadline = int(time.time()) + 6 * 3600
        rcpt = onchain.send(w3, "1. createJob (aseguradora)", esc.functions.createJob(
            tensor_hash(grid), model.model_hash(), validator.address, producer,
            a.trigger_bps, a.min_score, a.max_saa_bps, deadline, Web3.to_wei(a.compute_fee, "ether"),
        ), insurer, value=Web3.to_wei(a.value, "ether"))
        job_id = esc.events.JobCreated().process_receipt(rcpt, errors=DISCARD)[0].args.jobId
    else:
        job_id = a.job
    job = onchain.get_job(esc, job_id)
    print(f"      jobId {job_id} · estado {job['stateName']} · indemnización {ether(w3, job['indemnity'])}", flush=True)

    # 2. scheduler asigna el nodo con su exposición a la Anomalía
    l1, l2 = read_tle(tle)
    saa, ohash = saa_bps(l1, l2, WINDOW, WINDOW_MIN), orbit_hash(l1, l2, WINDOW, WINDOW_MIN)
    fn = esc.functions.reassign if job["stateName"] == "Rejected" else esc.functions.assignNode
    onchain.send(w3, f"2. {fn.fn_name} ORBIT-{a.node} saaBps {saa} (scheduler)",
                 fn(job_id, agent_id, saa, ohash), scheduler)
    job = onchain.get_job(esc, job_id)

    # 3. nodo: corre la CNN, publica artefactos, submitResult y validationRequest
    res = run_job(model, grid, mask, _parse_fault(a.fault))
    art = ROOT / "out" / "e2e" / f"job{job_id}-a{job['attempt']}.npz"
    save_artifacts(res, mask, art)
    request_uri = publish_file(art, {"escrow": esc.address, "job": job_id})
    print(f"      nodo: indexBps {res.index_bps} · requestURI {request_uri}", flush=True)
    rcpt = onchain.send(w3, f"3a. submitResult (ORBIT-{a.node})", esc.functions.submitResult(
        job_id, res.index_bps, res.output_hash, res.merkle_root), node)
    request_hash = esc.events.ResultSubmitted().process_receipt(rcpt, errors=DISCARD)[0].args.requestHash
    rcpt = onchain.send(w3, f"3b. validationRequest ERC-8004 (ORBIT-{a.node})", reg.functions.validationRequest(
        validator.address, agent_id, request_uri, request_hash), node)
    print(f"      requestHash 0x{bytes(request_hash).hex()}", flush=True)

    # 4. validador: proceso separado, con su propia clave
    print("4. agente validador (proceso aparte):", flush=True)
    subprocess.run([sys.executable, "-m", "validator.agent", "--once", "--from-block", str(rcpt.blockNumber)],
                   cwd=ROOT, check=True)
    st = reg.functions.getValidationStatus(request_hash).call()
    print(f"      getValidationStatus → validador {st[0]}, agentId {st[1]}, score {st[2]}, tag {st[4]}", flush=True)

    # 5. cualquiera liquida
    if a.no_settle:
        return
    before = w3.eth.get_balance(producer)
    onchain.send(w3, "5. settle (cualquiera)", esc.functions.settle(job_id), scheduler)
    job = onchain.get_job(esc, job_id)
    print(f"\nRESULTADO job {job_id}: {job['stateName']} · índice {job['indexBps']} bps vs disparador {job['triggerBps']}"
          f" · productor +{ether(w3, w3.eth.get_balance(producer) - before)}", flush=True)


if __name__ == "__main__":
    main()
