"""Crea labels, milestones e issues desde scripts/issues.json con `gh api` (REST). Idempotente por título.

  python scripts/create_issues.py JoaquinGiorgis/puna
"""
import json
import subprocess
import sys
from pathlib import Path

repo = sys.argv[1]
spec = json.loads((Path(__file__).parent / "issues.json").read_text())


def gh(method, path, payload=None):
    cmd = ["gh", "api", "-X", method, f"repos/{repo}/{path}"]
    if payload is not None:
        cmd += ["--input", "-"]
    r = subprocess.run(cmd, input=json.dumps(payload) if payload is not None else None, capture_output=True, text=True)
    if r.returncode != 0:
        raise RuntimeError(f"{method} {path}: {r.stdout} {r.stderr}")
    return json.loads(r.stdout or "null")


existing_labels = {l["name"] for l in gh("GET", "labels?per_page=100")}
for name, color in spec["labels"].items():
    if name not in existing_labels:
        gh("POST", "labels", {"name": name, "color": color})

ms = {m["title"]: m["number"] for m in gh("GET", "milestones?state=all&per_page=100")}
for m in spec["milestones"]:
    if m["title"] not in ms:
        ms[m["title"]] = gh("POST", "milestones", m)["number"]

titles = {i["title"] for i in gh("GET", "issues?state=all&per_page=100")}
for it in spec["issues"]:
    if it["title"] in titles:
        continue
    n = gh("POST", "issues", {"title": it["title"], "body": it["body"], "labels": it["labels"],
                             "milestone": ms[it["milestone"]]})["number"]
    print(f"#{n} {it['title']}")
