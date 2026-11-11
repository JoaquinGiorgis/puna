"""Lógica del agente validador y de la publicación, sin red."""
import numpy as np
import pytest

from node.inject import Fault
from node.job import run_job, save_artifacts
from node.model import default_model
from node.publish import fetch, fragment, publish_file
from validator.agent import audit_artifacts


@pytest.fixture()
def published(tmp_path, monkeypatch):
    monkeypatch.setenv("ARTIFACTS_DIR", str(tmp_path / "pub"))
    monkeypatch.delenv("ARTIFACTS_BASE_URL", raising=False)
    d = np.load("sample-data/lot14_grid.npz")

    def make(fault=None):
        res = run_job(default_model(), d["grid"], d["lot_mask"], fault)
        save_artifacts(res, d["lot_mask"], tmp_path / "job.npz")
        uri = publish_file(tmp_path / "job.npz", {"escrow": "0xabc", "job": 7})
        onchain_job = {"inputHash": res.input_hash, "modelHash": res.model_hash, "outputHash": res.output_hash,
                       "merkleRoot": res.merkle_root, "indexBps": res.index_bps}
        return uri, onchain_job

    return make


def test_honest_artifacts_score_100(published):
    uri, job = published()
    assert fragment(uri) == {"escrow": "0xabc", "job": "7"}
    assert audit_artifacts(job, fetch(uri)).score == 100


def test_validator_uses_onchain_index_not_the_nodes_json(published):
    uri, job = published()
    job["indexBps"] += 1  # el nodo declaró on-chain un índice que no sale de sus tensores
    assert audit_artifacts(job, fetch(uri)).score < 50


def test_demo_fault_is_rejected(published):
    uri, job = published(Fault("weight", 2, 2, (7,)))
    assert job["indexBps"] == 0 and audit_artifacts(job, fetch(uri)).score < 50


def test_fetch_rejects_tampered_content(published):
    uri, _ = published()
    import os
    path = os.path.join(os.environ["ARTIFACTS_DIR"], uri.split("#")[0].split("://")[1])
    with open(path, "ab") as f:
        f.write(b"x")
    with pytest.raises(ValueError):
        fetch(uri)


def test_uri_never_contains_a_local_path(published):
    uri, _ = published()
    assert uri.startswith("puna-artifacts://") and "/Users/" not in uri and "file:" not in uri
