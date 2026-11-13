"""Scheduler orbital: elige el nodo por exposición a la Anomalía (saaBps) y llama a assignNode/reassign.

Nodos simulados con órbitas reales (TLE de CelesTrak, ver orbit/saa.py):
  ORBIT-07 → NOAA 20, el que "ve Salta" en el guion (preferido)
  ORBIT-03 → NOAA 21

Política del caso (modo normal):
  1. Calcula saaBps de cada candidato en la ventana de ejecución.
  2. Si el preferido está bajo el umbral de la política, va él.
  3. Si no: releva al primer candidato bajo el umbral; si ninguno sirve, difiere la ventana
     hasta que el preferido salga de la Anomalía.
  4. En reassign excluye al nodo que acaba de ser rechazado.

Modo --demo: asigna primero ORBIT-07 aunque esté en la Anomalía (dentro de maxSaaBps del job)
para mostrar el rechazo; la reasignación ya sigue la política.

  python -m orbit.scheduler --job 5 --dry-run       # muestra la decisión sin mandar tx
  python -m orbit.scheduler --job 5 --demo          # assignNode con ORBIT-07
  python -m orbit.scheduler --job 5                 # reassign según la política (si el job está Rejected)
"""
from __future__ import annotations

import argparse
import os
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from pathlib import Path

from .saa import orbit_hash, read_tle, saa_bps

ROOT = Path(__file__).resolve().parents[1]
WINDOW = datetime(2026, 11, 12, 15, 30, tzinfo=timezone.utc)  # ventana de la demo
WINDOW_MIN = 9
POLICY_MAX_SAA_BPS = 2_000  # umbral de la política (más estricto que el maxSaaBps on-chain del job)


@dataclass(frozen=True)
class Node:
    name: str
    agent_env: str
    tle: Path


NODES = [  # en orden de preferencia: el primero es el que ve Salta
    Node("ORBIT-07", "AGENT_ID_A", ROOT / "sample-data" / "tle" / "orbit07.tle"),
    Node("ORBIT-03", "AGENT_ID_B", ROOT / "sample-data" / "tle" / "orbit03.tle"),
]


@dataclass(frozen=True)
class Decision:
    node: Node
    agent_id: int
    saa_bps: int
    orbit_hash: bytes
    start: datetime
    reason: str


NORAD = {"ORBIT-07": 43013, "ORBIT-03": 54234}  # NOAA 20, NOAA 21
LIVE_TLE: dict[str, tuple[str, str]] = {}  # TLE bajados en vivo (use_live_tles); si no, los de sample-data/


def tle_of(node: Node) -> tuple[str, str]:
    return LIVE_TLE.get(node.name) or read_tle(node.tle)


def use_live_tles(start: datetime = WINDOW) -> list[str]:
    """Baja de CelesTrak el TLE vigente de cada nodo. Se usa si deja al nodo del mismo lado de la
    Anomalía que el TLE guardado en la ventana (si no, el guion cambiaría: se avisa y se usa el guardado)."""
    from .live import fetch_tle, tle_epoch

    log = []
    for n in NODES:
        l1s, l2s = read_tle(n.tle)
        try:
            name, l1, l2 = fetch_tle(NORAD[n.name])
        except Exception as e:  # noqa: BLE001
            log.append(f"▲ {n.name}: CelesTrak no respondió ({e}); TLE guardado")
            continue
        live_s, saved_s = saa_bps(l1, l2, start, WINDOW_MIN), saa_bps(l1s, l2s, start, WINDOW_MIN)
        if (live_s > POLICY_MAX_SAA_BPS) == (saved_s > POLICY_MAX_SAA_BPS):
            LIVE_TLE[n.name] = (l1, l2)
            log.append(f"✓ {n.name} ← {name} (NORAD {NORAD[n.name]}) TLE en vivo de CelesTrak, época {tle_epoch(l1)}")
        else:
            log.append(f"▲ {n.name}: el TLE vivo da saaBps {live_s} y el guardado {saved_s}; uso el guardado")
    return log


def exposure(node: Node, start: datetime, minutes: float = WINDOW_MIN) -> tuple[int, bytes]:
    l1, l2 = tle_of(node)
    return saa_bps(l1, l2, start, minutes), orbit_hash(l1, l2, start, minutes)


def next_clear_window(node: Node, start: datetime, threshold: int, horizon_h: int = 6) -> datetime | None:
    t = start
    while t < start + timedelta(hours=horizon_h):
        t += timedelta(minutes=1)
        if exposure(node, t)[0] <= threshold:
            return t
    return None


def decide(start: datetime = WINDOW, *, exclude_agent: int | None = None, demo_first: bool = False,
           threshold: int = POLICY_MAX_SAA_BPS, agent_ids: dict[str, int] | None = None) -> Decision:
    ids = agent_ids or {n.name: int(os.environ[n.agent_env]) for n in NODES}
    cands = [n for n in NODES if ids[n.name] != exclude_agent]
    if not cands:
        raise RuntimeError("no quedan nodos candidatos")
    scored = [(n, *exposure(n, start)) for n in cands]
    for n, s, _ in scored:
        print(f"  {n.name} (agentId {ids[n.name]}): saaBps {s} en {start:%Y-%m-%d %H:%M}Z +{WINDOW_MIN} min")

    pref, pref_saa, pref_hash = scored[0]
    if demo_first:
        return Decision(pref, ids[pref.name], pref_saa, pref_hash, start,
                        "guion de la demo: se asigna el nodo que ve Salta aunque esté en la Anomalía")
    if pref_saa <= threshold:
        return Decision(pref, ids[pref.name], pref_saa, pref_hash, start, f"preferido bajo el umbral ({threshold} bps)")
    for n, s, h in scored[1:]:
        if s <= threshold:
            return Decision(n, ids[n.name], s, h, start,
                            f"{pref.name} está en la Anomalía ({pref_saa} bps): releva {n.name}")
    later = next_clear_window(pref, start, threshold)
    if later is None:
        raise RuntimeError("ningún nodo sale de la Anomalía en el horizonte")
    s, h = exposure(pref, later)
    return Decision(pref, ids[pref.name], s, h, later, f"todos en la Anomalía: se difiere a {later:%H:%M}Z")


def apply(w3, esc, job_id: int, decision: Decision, scheduler_acct):
    import onchain

    job = onchain.get_job(esc, job_id)
    fn = esc.functions.reassign if job["stateName"] == "Rejected" else esc.functions.assignNode
    return onchain.send(w3, f"{fn.fn_name} {decision.node.name} saaBps {decision.saa_bps} (scheduler)",
                        fn(job_id, decision.agent_id, decision.saa_bps, decision.orbit_hash), scheduler_acct)


def main() -> None:
    import onchain

    ap = argparse.ArgumentParser()
    ap.add_argument("--job", type=int, required=True)
    ap.add_argument("--demo", action="store_true", help="primera asignación a ORBIT-07 aunque esté en la Anomalía")
    ap.add_argument("--start", default=WINDOW.strftime("%Y-%m-%dT%H:%M:%SZ"))
    ap.add_argument("--dry-run", action="store_true")
    a = ap.parse_args()

    w3 = onchain.w3()
    esc = onchain.escrow(w3)
    job = onchain.get_job(esc, a.job)
    start = datetime.fromisoformat(a.start.replace("Z", "+00:00"))
    exclude = job["agentId"] if job["stateName"] == "Rejected" else None
    print(f"job {a.job}: estado {job['stateName']}, maxSaaBps {job['maxSaaBps']}"
          + (f", excluye al agente rechazado {exclude}" if exclude else ""))
    d = decide(start, exclude_agent=exclude, demo_first=a.demo and job["stateName"] == "Created")
    print(f"→ {d.node.name} (agentId {d.agent_id}), saaBps {d.saa_bps}: {d.reason}")
    if d.saa_bps > job["maxSaaBps"]:
        print(f"  ojo: supera maxSaaBps {job['maxSaaBps']} del job → assignNode va a revertir (SaaTooHigh)")
    if not a.dry_run:
        apply(w3, esc, a.job, d, w3.eth.account.from_key(os.environ["SCHEDULER_PK"]))


if __name__ == "__main__":
    main()
