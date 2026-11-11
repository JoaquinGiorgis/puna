"""Política del scheduler orbital, sin red (TLE guardados, ventana de la demo)."""
from datetime import timedelta

from orbit.scheduler import WINDOW, decide

IDS = {"ORBIT-07": 300, "ORBIT-03": 301}


def test_policy_relieves_the_node_in_the_anomaly():
    d = decide(WINDOW, agent_ids=IDS)
    assert d.node.name == "ORBIT-03" and d.saa_bps == 0 and "releva" in d.reason


def test_demo_assigns_orbit07_first_even_in_the_anomaly():
    d = decide(WINDOW, agent_ids=IDS, demo_first=True)
    assert d.node.name == "ORBIT-07" and d.saa_bps == 10_000


def test_reassign_excludes_the_rejected_node():
    d = decide(WINDOW, agent_ids=IDS, exclude_agent=300)
    assert d.node.name == "ORBIT-03"


def test_defers_when_every_candidate_is_in_the_anomaly():
    # solo queda ORBIT-07 y está en la Anomalía: la política difiere la ventana
    d = decide(WINDOW, agent_ids=IDS, exclude_agent=301)
    assert d.node.name == "ORBIT-07" and d.start > WINDOW and d.saa_bps <= 2_000
    assert d.start - WINDOW < timedelta(hours=6) and "difiere" in d.reason
