from pathlib import Path

import numpy as np
import pytest

from node.inject import Fault
from node.job import run_job
from node.merkle import leaf, proof, root, verify_proof
from node.model import default_model, im2col
from orbit.firms import lot_mask
from validator.freivalds import freivalds
from validator.verify import audit

# Falla del guion de la demo: peso corrupto en L3 → el nodo devuelve 0 % quemado
DEMO_FAULT = Fault("weight", 2, 2, (7,))


# Grilla real: focos VIIRS (NOAA-20/21) de un incendio en Anta, Salta, 8–11/11/2026 (sample-data/firms_anta.csv)
LOT14 = Path(__file__).resolve().parents[1] / "sample-data" / "lot14_grid.npz"


@pytest.fixture(scope="module")
def setup():
    d = np.load(LOT14)
    return default_model(), d["grid"], d["lot_mask"]


def _audit(model, res, mask):
    return audit(
        model, res.traces, mask,
        input_hash=res.input_hash, model_hash=res.model_hash,
        output_hash=res.output_hash, merkle_root=res.merkle_root,
        claimed_index_bps=res.index_bps, rng=np.random.default_rng(0),
    )


def test_honest_index_is_about_37_percent(setup):
    model, grid, mask = setup
    res = run_job(model, grid, mask)
    assert 3500 <= res.index_bps <= 4000


def test_honest_job_scores_100(setup):
    model, grid, mask = setup
    cert = _audit(model, run_job(model, grid, mask), mask)
    assert cert.passed and cert.score == 100


def test_demo_fault_returns_zero_and_is_rejected(setup):
    model, grid, mask = setup
    res = run_job(model, grid, mask, DEMO_FAULT)
    assert res.index_bps == 0
    cert = _audit(model, res, mask)
    assert not cert.passed and cert.score < 50


@pytest.mark.parametrize("kind", ["seu", "weight", "multibit"])
@pytest.mark.parametrize("layer", [0, 1, 2, 3])
def test_every_fault_family_is_caught(setup, kind, layer):
    model, grid, mask = setup
    res = run_job(model, grid, mask, Fault(kind, layer, seed=layer + 1, bits=(30,) if kind != "weight" else (6,)))
    assert not _audit(model, res, mask).passed


def test_freivalds_catches_single_entry_change():
    rng = np.random.default_rng(1)
    A = rng.integers(-128, 128, (144, 36))
    B = rng.integers(-128, 128, (36, 4))
    C = A @ B
    assert freivalds(A, B, C, rng=rng)
    C[17, 2] += 1
    assert not freivalds(A, B, C, rng=rng)


def test_im2col_matches_direct_convolution():
    rng = np.random.default_rng(2)
    x = rng.integers(-5, 6, (5, 5, 2)).astype(np.int8)
    w = rng.integers(-3, 4, (3, 3, 2, 1))
    got = (im2col(x, 3) @ w.reshape(-1, 1)).reshape(5, 5)
    xp = np.pad(x.astype(np.int64), ((1, 1), (1, 1), (0, 0)))
    want = np.array([[np.sum(xp[i : i + 3, j : j + 3] * w[..., 0]) for j in range(5)] for i in range(5)])
    assert np.array_equal(got, want)


def test_merkle_proofs(setup):
    model, grid, mask = setup
    res = run_job(model, grid, mask)
    leaves = [leaf(i, t) for i, t in enumerate(res.traces)]
    r = root(leaves)
    assert r == res.merkle_root
    for i, lf in enumerate(leaves):
        assert verify_proof(lf, proof(leaves, i), r)
    assert not verify_proof(leaves[0], proof(leaves, 1), r)


def test_saa_polygon_and_subpoint():
    from datetime import datetime, timezone
    from orbit.saa import _point_in_poly, saa_bps

    assert _point_in_poly(-50, -27)       # centro de la Anomalía
    assert not _point_in_poly(-65, 20)    # Caribe
    # ISS (TLE de ejemplo de la doc de sgp4) — solo chequea que corre y da un valor válido
    l1 = "1 25544U 98067A   19343.69339541  .00001764  00000-0  38792-4 0  9991"
    l2 = "2 25544  51.6439 211.2001 0007417  17.6667  85.6398 15.50103472202482"
    v = saa_bps(l1, l2, datetime(2019, 12, 9, 16, 0, tzinfo=timezone.utc), 95)
    assert 0 <= v <= 10_000


def test_cli_fault_parses_bits():
    from node.job import _parse_fault

    assert _parse_fault("weight:2:2:7") == DEMO_FAULT
    assert _parse_fault("multibit:1:3:28,30").bits == (28, 30)
