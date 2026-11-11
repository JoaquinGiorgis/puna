from datetime import datetime, timezone

from orbit.saa import orbit_hash, read_tle, saa_bps

# Ventana de la demo (ver orbit/saa.py): ORBIT-07 dentro de la Anomalía, ORBIT-03 fuera.
START = datetime(2026, 11, 12, 15, 30, tzinfo=timezone.utc)


def test_demo_window_orbit07_inside_saa():
    assert saa_bps(*read_tle("sample-data/tle/orbit07.tle"), START, 9) == 10_000


def test_demo_window_orbit03_outside_saa():
    assert saa_bps(*read_tle("sample-data/tle/orbit03.tle"), START, 9) == 0


def test_orbit_hash_binds_tle_and_window():
    l1, l2 = read_tle("sample-data/tle/orbit07.tle")
    h = orbit_hash(l1, l2, START, 9)
    assert len(h) == 32 and h == orbit_hash(l1, l2, START, 9)
    assert h != orbit_hash(l1, l2, START, 10)
    assert h != orbit_hash(*read_tle("sample-data/tle/orbit03.tle"), START, 9)
