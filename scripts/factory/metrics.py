#!/usr/bin/env python3
"""Generate docs/dashboard/metrics.json and docs/dashboard/index.md from factory state.

Reads .factory/state.yaml, .factory/decisions.yaml, and findings files under
docs/security/findings and docs/design/findings. Writes a small human-readable dashboard.
"""
from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
DASHBOARD_DIR = REPO_ROOT / "docs" / "dashboard"


def load_yaml(path: Path):
    try:
        import yaml  # type: ignore
    except ImportError:
        return None
    if not path.exists():
        return None
    return yaml.safe_load(path.read_text(encoding="utf-8"))


def count_findings(subdir: str) -> dict[str, int]:
    findings_dir = REPO_ROOT / "docs" / subdir / "findings"
    counts = {"total": 0, "open": 0, "fixed": 0, "verified": 0}
    if not findings_dir.exists():
        return counts
    for f in findings_dir.glob("*.md"):
        counts["total"] += 1
        text = f.read_text(encoding="utf-8", errors="ignore")
        if "Status: OPEN" in text or "Status: IN_PROGRESS" in text:
            counts["open"] += 1
        if "Status: FIXED" in text:
            counts["fixed"] += 1
        if "Verified: yes" in text or "Verified: Yes" in text:
            counts["verified"] += 1
    return counts


def main() -> None:
    DASHBOARD_DIR.mkdir(parents=True, exist_ok=True)

    state = load_yaml(REPO_ROOT / ".factory" / "state.yaml") or {}
    decisions = load_yaml(REPO_ROOT / ".factory" / "decisions.yaml") or []

    open_decisions = [d for d in decisions if isinstance(d, dict) and d.get("status") == "OPEN"]

    metrics = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "product": state.get("product", {}),
        "metrics": state.get("metrics", {}),
        "health": state.get("health", {}),
        "open_decisions": len(open_decisions),
        "security_findings": count_findings("security"),
        "design_findings": count_findings("design"),
    }

    (DASHBOARD_DIR / "metrics.json").write_text(json.dumps(metrics, indent=2) + "\n", encoding="utf-8")

    lines = [
        "# RepoGrove factory dashboard",
        "",
        f"_Generated {metrics['generated_at']}_",
        "",
        "## Product",
        f"- Version: {metrics['product'].get('current_version', 'unknown')}",
        f"- Focus: {metrics['product'].get('current_focus', 'unknown')}",
        "",
        "## Metrics",
    ]
    for k, v in metrics["metrics"].items():
        lines.append(f"- {k}: {v}")
    lines += [
        "",
        "## Health",
    ]
    for k, v in metrics["health"].items():
        lines.append(f"- {k}: {v}")
    lines += [
        "",
        f"## Open owner decisions: {metrics['open_decisions']}",
        "",
        "## Findings",
        f"- Security: {metrics['security_findings']}",
        f"- Design: {metrics['design_findings']}",
        "",
    ]
    (DASHBOARD_DIR / "index.md").write_text("\n".join(lines), encoding="utf-8")
    print(f"Wrote {DASHBOARD_DIR / 'metrics.json'} and {DASHBOARD_DIR / 'index.md'}")


if __name__ == "__main__":
    main()
