#!/usr/bin/env python3
"""Block commits that contain credential-looking strings or secret-bearing files.

Runs on staged files by default; `--all` scans every tracked file (used in CI).
Bypass for a confirmed false positive: `git commit --no-verify`, then add the value to ALLOW below.
"""
from __future__ import annotations

import re
from pathlib import Path
import subprocess
import sys

ALLOW: list[str] = [  # exact matches that are known-safe false positives
]
FORBIDDEN_PATHS = re.compile(
    r"(^|/)\.env(\.(?!example$|sample$)[^/]*)?$"
    r"|\.(pem|key|p12|pfx|jks|keystore|ppk)$"
    r"|(^|/)id_(rsa|dsa|ecdsa|ed25519)$"
    r"|(^|/)\.DS_Store$"
    r"|service[-_]?account.*\.json$"
    r"|(^|/)credentials\.json$"
)
PATTERNS = {
    "AWS access key": r"(?<![A-Z0-9])(AKIA|ASIA)[0-9A-Z]{16}(?![A-Z0-9])",
    "Google API key": r"AIza[0-9A-Za-z_\-]{35}",
    "GitHub token": r"\b(gh[pousr]_[A-Za-z0-9]{36,}|github_pat_[A-Za-z0-9_]{80,})\b",
    "OpenAI/Anthropic key": r"\bsk-(ant-)?[A-Za-z0-9_\-]{20,}\b",
    "Slack token/webhook": r"\bxox[baprs]-[0-9A-Za-z\-]{10,}\b|hooks\.slack\.com/services/T[A-Za-z0-9]+/B[A-Za-z0-9]+/",
    "Stripe key": r"\b[sr]k_(live|test)_[0-9a-zA-Z]{20,}\b|\bwhsec_[A-Za-z0-9]{20,}\b",
    "Vercel token": r"\bvercel_[A-Za-z0-9]{20,}\b",
    "Supabase key": r"\bsb[pa]_[A-Za-z0-9_]{20,}\b",
    "npm token": r"\bnpm_[A-Za-z0-9]{36}\b",
    "Private key block": r"-----BEGIN [A-Z ]*PRIVATE KEY( BLOCK)?-----",
    "DB URL with password": r"\b(postgres(ql)?|mysql|mongodb(\+srv)?|redis|rediss|amqp|mssql)://[^\s\"'/@]+:[^\s\"'@]+@",
    "JWT": r"\beyJ[A-Za-z0-9_\-]{10,}\.eyJ[A-Za-z0-9_\-]{10,}\.[A-Za-z0-9_\-]{10,}\b",
    "Hardcoded secret assignment": r"(?i)\b(api[_-]?key|api[_-]?secret|secret[_-]?key|client[_-]?secret|access[_-]?token|auth[_-]?token|private[_-]?key|password|passwd)\b[\"']?\s*[:=]\s*[\"'][^\"'\s]{8,}[\"']",
}
def git(*args: str, cwd: Path | None = None) -> bytes:
    return subprocess.run(
        ["git", *args], cwd=cwd, capture_output=True, check=True
    ).stdout


def main() -> int:
    all_mode = "--all" in sys.argv
    try:
        root = Path(git("rev-parse", "--show-toplevel").decode().strip())
        args = ("ls-files", "-z") if all_mode else (
            "diff", "--cached", "--name-only", "--diff-filter=ACMR", "-z"
        )
        files = [p for p in git(*args, cwd=root).decode().split("\0") if p]
        problems: list[str] = []
        binary_files = 0
        for p in files:
            if FORBIDDEN_PATHS.search(p):
                problems.append(f"{p}: this file type must never be committed")
                continue
            # Inspect text regardless of extension (including lockfiles, SVGs,
            # source maps and minified code). Never silently pass a read error.
            data = (root / p).read_bytes() if all_mode else git("show", f":{p}", cwd=root)
            if b"\0" in data[:8000]:
                binary_files += 1
                continue
            txt = data.decode("utf-8", "ignore")
            for name, rx in PATTERNS.items():
                for m in re.finditer(rx, txt):
                    if m.group(0) in ALLOW:
                        continue
                    line = txt.count("\n", 0, m.start()) + 1
                    # Do not copy any part of a credential into CI logs.
                    problems.append(f"{p}:{line}: {name} (value redacted)")
    except (OSError, UnicodeError, subprocess.CalledProcessError):
        print("✖ Secret scan could not read the repository or a tracked file; scan incomplete.", file=sys.stderr)
        return 2

    if problems:
        print("\n✖ Secret scan blocked this commit:\n  " + "\n  ".join(problems))
        print("\n  Real secret? Remove it, rotate it, never commit it."
              "\n  False positive? Review it before adding an exact match to ALLOW.")
        return 1
    print(f"✔ secret scan clean ({len(files)} files; {binary_files} binary files not inspected)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
