import json
from datetime import datetime, timezone

import numpy as np

from node.model import tensor_hash
from orbit.firms import rasterize
from orbit.live import SAVED_GRID
from orbit.radiation import SAVED, _parse

WINDOW = datetime(2026, 11, 12, 15, 30, tzinfo=timezone.utc)


def test_goes_saved_has_window_measurement():
    p = _parse(json.loads(SAVED.read_text()), WINDOW)
    assert p.in_window and p.at == "2026-11-12T15:30:00Z"
    assert p.flux_pfu < 10 and p.storm.startswith("S0")


def test_rasterize_is_order_independent():
    import csv
    rows = list(csv.DictReader(open("sample-data/firms_anta.csv")))
    bbox = (-62.9370, -25.0760, -62.9020, -25.0410)
    g1, g2 = rasterize(rows, bbox), rasterize(rows[::-1], bbox)
    assert tensor_hash(g1) == tensor_hash(g2) == tensor_hash(np.load(SAVED_GRID)["grid"])
