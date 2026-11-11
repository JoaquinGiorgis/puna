"""E2E on-chain en Fuji: createJob → scheduler (assignNode) → nodo (submitResult + validationRequest)
→ agente validador (proceso aparte) → settle. Cada rol firma con su propia wallet de .env.

  .venv/bin/python scripts/e2e.py                 # camino feliz: el scheduler elige por la política → Paid
  .venv/bin/python scripts/e2e.py --demo          # guion: ORBIT-07 en la Anomalía + falla → Rejected
                                                  #        → reassign a ORBIT-03 → Paid
  .venv/bin/python scripts/e2e.py --job 5         # retoma un job (Created o Rejected) con la política
"""
from __future__ import annotations

import argparse
import os
import subprocess
import sys
import time
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
from orbit import scheduler  # noqa: E402

GRID = ROOT / "sample-data" / "lot14_grid.npz"
NODE_KEYS = {"ORBIT-07": "NODE_A_PK", "ORBIT-03": "NODE_B_PK"}
DEMO_FAULT = "weight:2:2:7"


def ether(wei: int) -> str:
    return f"{Web3.from_wei(wei, 'ether'):.4f} AVAX"


class Run:
    def __init__(self, a):
        self.a = a
        self.w3 = onchain.w3()
        self.esc, self.reg = onchain.escrow(self.w3), onchain.validation(self.w3)
        acct = lambda k: self.w3.eth.account.from_key(os.environ[k])  # noqa: E731
        self.acct = acct
        self.insurer, self.sched, self.validator = acct("INSURER_PK"), acct("SCHEDULER_PK"), acct("VALIDATOR_PK")
        self.producer = Web3.to_checksum_address(os.environ["PRODUCER_ADDR"])
        self.model = default_model()
        lot = np.load(GRID)
        self.grid, self.mask = lot["grid"], lot["lot_mask"]

    def step(self, label: str):
        print(f"\n── {label}", flush=True)

    def create_job(self) -> int:
        a = self.a
        rcpt = onchain.send(self.w3, "createJob (aseguradora)", self.esc.functions.createJob(
            tensor_hash(self.grid), self.model.model_hash(), self.validator.address, self.producer,
            a.trigger_bps, a.min_score, a.max_saa_bps, int(time.time()) + 6 * 3600,
            Web3.to_wei(a.compute_fee, "ether"),
        ), self.insurer, value=Web3.to_wei(a.value, "ether"))
        job_id = self.esc.events.JobCreated().process_receipt(rcpt, errors=DISCARD)[0].args.jobId
        job = onchain.get_job(self.esc, job_id)
        print(f"      jobId {job_id} · indemnización {ether(job['indemnity'])} · maxSaaBps {job['maxSaaBps']}")
        return job_id

    def assign(self, job_id: int, demo_first: bool = False) -> scheduler.Decision:
        job = onchain.get_job(self.esc, job_id)
        exclude = job["agentId"] if job["stateName"] == "Rejected" else None
        d = scheduler.decide(scheduler.WINDOW, exclude_agent=exclude, demo_first=demo_first)
        print(f"  → {d.node.name}: {d.reason}")
        scheduler.apply(self.w3, self.esc, job_id, d, self.sched)
        return d

    def node_and_validate(self, job_id: int, d: scheduler.Decision, fault_cli: str | None) -> None:
        node = self.acct(NODE_KEYS[d.node.name])
        job = onchain.get_job(self.esc, job_id)
        fault = _parse_fault(fault_cli)
        res = run_job(self.model, self.grid, self.mask, fault)
        art = ROOT / "out" / "e2e" / f"job{job_id}-a{job['attempt']}.npz"
        save_artifacts(res, self.mask, art, fault)
        uri = publish_file(art, {"escrow": self.esc.address, "job": job_id})
        print(f"      {d.node.name}: indexBps {res.index_bps}" + (f" · falla simulada {fault.describe()}" if fault else ""))
        rcpt = onchain.send(self.w3, f"submitResult ({d.node.name})", self.esc.functions.submitResult(
            job_id, res.index_bps, res.output_hash, res.merkle_root), node)
        rh = self.esc.events.ResultSubmitted().process_receipt(rcpt, errors=DISCARD)[0].args.requestHash
        rcpt = onchain.send(self.w3, f"validationRequest ERC-8004 ({d.node.name})",
                            self.reg.functions.validationRequest(self.validator.address, d.agent_id, uri, rh), node)
        print("      agente validador (proceso aparte, wallet propia):", flush=True)
        subprocess.run([sys.executable, "-m", "validator.agent", "--once", "--from-block", str(rcpt.blockNumber)],
                       cwd=ROOT, check=True)

    def settle(self, job_id: int) -> dict:
        before = self.w3.eth.get_balance(self.producer)
        onchain.send(self.w3, "settle (cualquiera)", self.esc.functions.settle(job_id), self.sched)
        job = onchain.get_job(self.esc, job_id)
        print(f"  RESULTADO intento {job['attempt']}: {job['stateName']} · índice {job['indexBps']} bps "
              f"vs disparador {job['triggerBps']} · productor +{ether(self.w3.eth.get_balance(self.producer) - before)}",
              flush=True)
        return job


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--demo", action="store_true", help="guion completo: rechazo → reassign → Paid")
    ap.add_argument("--fault", help="falla para el primer intento (kind:layer:seed[:bits])")
    ap.add_argument("--job", type=int, help="retomar un job existente (Created o Rejected)")
    ap.add_argument("--value", default="0.02", help="AVAX que deposita la aseguradora")
    ap.add_argument("--compute-fee", default="0.002")
    ap.add_argument("--min-score", type=int, default=80)
    ap.add_argument("--trigger-bps", type=int, default=3000)
    ap.add_argument("--max-saa-bps", type=int, default=10_000)
    ap.add_argument("--no-settle", action="store_true")
    a = ap.parse_args()

    r = Run(a)
    print(f"escrow {r.esc.address} · modo {'demo' if a.demo else 'política'}")
    r.step("1. aseguradora")
    job_id = a.job if a.job is not None else r.create_job()

    r.step("2. scheduler orbital")
    d = r.assign(job_id, demo_first=a.demo)
    r.step(f"3. nodo {d.node.name} → 4. validador")
    r.node_and_validate(job_id, d, a.fault or (DEMO_FAULT if a.demo else None))
    if a.no_settle:
        return
    r.step("5. liquidación")
    job = r.settle(job_id)

    if a.demo and job["stateName"] == "Rejected":
        r.step("6. scheduler reasigna (política)")
        d = r.assign(job_id)
        r.step(f"7. nodo {d.node.name} → 8. validador")
        r.node_and_validate(job_id, d, None)
        r.step("9. liquidación")
        r.settle(job_id)


if __name__ == "__main__":
    main()
