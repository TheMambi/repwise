#!/usr/bin/env python3
"""Block commits that contain credential-looking strings or secret-bearing files.

Runs on staged files by default; `--all` scans every tracked file (used in CI).
Bypass for a confirmed false positive: `git commit --no-verify`, then add the value to ALLOW below.
"""
import re
import subprocess
import sys

ALLOW: list[str] = [  # exact substrings that are known-safe false positives
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
SKIP = re.compile(r"(package-lock\.json|yarn\.lock|pnpm-lock\.yaml|\.min\.(js|css)$|\.map$|\.svg$|\.(png|jpe?g|gif|ico|woff2?|ttf|pdf|zip)$|^\.githooks/scan-secrets\.py$)")


def staged() -> list[str]:
    out = subprocess.run(["git", "diff", "--cached", "--name-only", "--diff-filter=ACMR", "-z"], capture_output=True, text=True).stdout
    return [p for p in out.split("\0") if p]


def tracked() -> list[str]:
    out = subprocess.run(["git", "ls-files", "-z"], capture_output=True, text=True).stdout
    return [p for p in out.split("\0") if p]


def content(path: str, use_index: bool) -> bytes:
    if use_index:
        return subprocess.run(["git", "show", f":{path}"], capture_output=True).stdout
    try:
        return open(path, "rb").read()
    except OSError:
        return b""


all_mode = "--all" in sys.argv
files = tracked() if all_mode else staged()
problems: list[str] = []
for p in files:
    if FORBIDDEN_PATHS.search(p):
        problems.append(f"{p}: this file type must never be committed")
        continue
    if SKIP.search(p):
        continue
    data = content(p, use_index=not all_mode)
    if b"\0" in data[:8000] or len(data) > 5_000_000:
        continue
    txt = data.decode("utf-8", "ignore")
    for name, rx in PATTERNS.items():
        for m in re.finditer(rx, txt):
            s = m.group(0)
            if any(a in s for a in ALLOW):
                continue
            line = txt.count("\n", 0, m.start()) + 1
            problems.append(f"{p}:{line}: {name}: {s[:12]}…")

if problems:
    print("\n✖ Secret scan blocked this commit:\n  " + "\n  ".join(problems))
    print("\n  Real secret? Remove it, rotate it, never commit it."
          "\n  False positive? Add the value to ALLOW in .githooks/scan-secrets.py, or use --no-verify once.")
    sys.exit(1)
print(f"✔ secret scan clean ({len(files)} file{'s' if len(files) != 1 else ''})")
