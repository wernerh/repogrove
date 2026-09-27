#!/usr/bin/env python3
"""Factory guard-rail checker.

Verifies the invariants the RepoGrove autonomous factory depends on:
- PROJECT_STATE.md exists, has all required sections, and is <=60 lines.
- .factory/state.yaml parses as YAML and the lock isn't stale (>2h held).
- .factory/decisions.yaml parses as YAML.
- No data-export or secret-looking files are committed.
- Every security/design findings file has the required headers.

Prints PASS/WARN/FAIL per check. Exits 1 if any check FAILs.
"""
from __future__ import annotations

import re
import subprocess
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]

results: list[tuple[str, str, str]] = []  # (check_name, status, detail)


def record(name: str, status: str, detail: str = "") -> None:
    results.append((name, status, detail))


def check_project_state() -> None:
    path = REPO_ROOT / "PROJECT_STATE.md"
    if not path.exists():
        record("PROJECT_STATE.md exists", "FAIL", "file is missing")
        return
    record("PROJECT_STATE.md exists", "PASS")

    text = path.read_text(encoding="utf-8")
    lines = text.splitlines()
    if len(lines) > 60:
        record("PROJECT_STATE.md <=60 lines", "FAIL", f"{len(lines)} lines")
    else:
        record("PROJECT_STATE.md <=60 lines", "PASS", f"{len(lines)} lines")

    required_sections = [
        "## Goal and success test",
        "## Current phase",
        "## Next action",
        "## Decisions log",
        "## Assumptions",
        "## Not doing",
        "## Timebox",
        "## Blockers and attempts",
        "## Milestones",
    ]
    missing = [s for s in required_sections if s not in text]
    if missing:
        record("PROJECT_STATE.md required sections", "FAIL", f"missing: {missing}")
    else:
        record("PROJECT_STATE.md required sections", "PASS")


def check_state_yaml() -> None:
    try:
        import yaml  # type: ignore
    except ImportError:
        record("state.yaml parses", "WARN", "PyYAML not installed; skipping parse")
        return

    path = REPO_ROOT / ".factory" / "state.yaml"
    if not path.exists():
        record("state.yaml exists", "FAIL", "file is missing")
        return

    try:
        data = yaml.safe_load(path.read_text(encoding="utf-8"))
    except Exception as exc:  # noqa: BLE001
        record("state.yaml parses", "FAIL", str(exc))
        return
    record("state.yaml parses", "PASS")

    factory = (data or {}).get("factory", {})
    current_run = factory.get("current_run")
    if current_run:
        try:
            started = datetime.fromisoformat(str(current_run).replace("Z", "+00:00"))
            age = datetime.now(timezone.utc) - started
            if age > timedelta(hours=2):
                record("lock not stale", "FAIL", f"held for {age}")
            else:
                record("lock not stale", "PASS", f"held for {age}")
        except ValueError:
            record("lock not stale", "WARN", f"unparseable timestamp: {current_run}")
    else:
        record("lock not stale", "PASS", "no active lock")


def check_decisions_yaml() -> None:
    try:
        import yaml  # type: ignore
    except ImportError:
        record("decisions.yaml parses", "WARN", "PyYAML not installed; skipping parse")
        return

    path = REPO_ROOT / ".factory" / "decisions.yaml"
    if not path.exists():
        record("decisions.yaml exists", "FAIL", "file is missing")
        return
    try:
        data = yaml.safe_load(path.read_text(encoding="utf-8"))
    except Exception as exc:  # noqa: BLE001
        record("decisions.yaml parses", "FAIL", str(exc))
        return
    if data is not None and not isinstance(data, list):
        record("decisions.yaml is a list", "FAIL", f"got {type(data)}")
        return
    record("decisions.yaml parses", "PASS")


DISALLOWED_EXTENSIONS = {".xlsx", ".csv"}
SECRET_PATTERNS = [
    re.compile(r"AKIA[0-9A-Z]{16}"),
    re.compile(r"-----BEGIN [A-Z ]*PRIVATE KEY-----"),
    re.compile(r"(?i)api[_-]?key\s*[:=]\s*['\"][A-Za-z0-9_\-]{16,}['\"]"),
    re.compile(r"ghp_[A-Za-z0-9]{36,}"),
    re.compile(r"sk-[A-Za-z0-9]{20,}"),
]


def tracked_files() -> list[Path]:
    try:
        out = subprocess.run(
            ["git", "-C", str(REPO_ROOT), "ls-files"],
            check=True,
            capture_output=True,
            text=True,
        )
    except (subprocess.CalledProcessError, FileNotFoundError):
        return [p for p in REPO_ROOT.rglob("*") if p.is_file() and ".git" not in p.parts]
    return [REPO_ROOT / line for line in out.stdout.splitlines() if line]


def check_no_data_exports_or_secrets() -> None:
    bad_files: list[str] = []
    secret_hits: list[str] = []

    for f in tracked_files():
        if not f.exists() or not f.is_file():
            continue
        rel = f.relative_to(REPO_ROOT)
        name = f.name

        if f.suffix.lower() in DISALLOWED_EXTENSIONS:
            bad_files.append(str(rel))
        if name.startswith(".env") and name != ".env.example":
            bad_files.append(str(rel))
        if "secret" in name.lower() and f.suffix.lower() in {".json", ".yaml", ".yml", ".pem", ".key"}:
            bad_files.append(str(rel))

        if f.suffix.lower() in {".png", ".jpg", ".jpeg", ".gif", ".woff", ".woff2", ".ico", ".pdf"}:
            continue
        try:
            text = f.read_text(encoding="utf-8", errors="ignore")
        except OSError:
            continue
        for pattern in SECRET_PATTERNS:
            if pattern.search(text):
                secret_hits.append(str(rel))
                break

    if bad_files:
        record("no data-export/secret-named files committed", "FAIL", f"{bad_files}")
    else:
        record("no data-export/secret-named files committed", "PASS")

    if secret_hits:
        record("no secret-looking strings committed", "FAIL", f"{secret_hits}")
    else:
        record("no secret-looking strings committed", "PASS")


REQUIRED_FINDING_HEADERS = ["Status", "Severity", "Summary"]


def check_findings_headers() -> None:
    for subdir, prefix in (("security", "SEC-"), ("design", "UX-")):
        findings_dir = REPO_ROOT / "docs" / subdir / "findings"
        if not findings_dir.exists():
            continue
        for f in findings_dir.glob("*.md"):
            if f.name.startswith(prefix) or True:  # check all .md files present
                text = f.read_text(encoding="utf-8", errors="ignore")
                missing = [h for h in REQUIRED_FINDING_HEADERS if h not in text]
                if missing:
                    record(f"finding header check: {f.relative_to(REPO_ROOT)}", "FAIL", f"missing: {missing}")
                else:
                    record(f"finding header check: {f.relative_to(REPO_ROOT)}", "PASS")


def main() -> int:
    check_project_state()
    check_state_yaml()
    check_decisions_yaml()
    check_no_data_exports_or_secrets()
    check_findings_headers()

    any_fail = False
    for name, status, detail in results:
        line = f"[{status}] {name}"
        if detail:
            line += f" — {detail}"
        print(line)
        if status == "FAIL":
            any_fail = True

    return 1 if any_fail else 0


if __name__ == "__main__":
    sys.exit(main())
