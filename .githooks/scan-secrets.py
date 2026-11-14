#!/usr/bin/env python3
"""Block commits that contain credential-looking strings or secret-bearing files.

Runs on staged files by default; `--all` scans every tracked file (used in CI).
Bypass for a confirmed false positive: `git commit --no-verify`, then add the value to ALLOW below.
"""
from __future__ import annotations

import codecs
import re
from pathlib import Path
import subprocess
import sys

ALLOW: list[str] = [  # exact matches that are known-safe false positives
]
FORBIDDEN_PATHS = re.compile(
    r"(^|/)\.env(\.(?!example$|sample$|template$)[^/]*)?$"
    r"|(^|/)[^/]*\.env$"
    r"|(^|/)\.envrc$"
    r"|\.(pem|key|p12|pfx|jks|keystore|ppk)$"
    r"|(^|/)id_(rsa|dsa|ecdsa|ed25519)(?![^/]*\.pub$)[^/]*$"
    r"|(^|/)[^/]*deploy[_-]?key(?![^/]*\.pub$)[^/]*$"
    r"|(^|/)\.(netrc|pypirc|git-credentials|htpasswd)$"
    r"|(^|/)\.?aws/credentials$"
    r"|(^|/)(kubeconfig|\.kube/config)$"
    r"|(^|/)\.vercel/"
    r"|\.(tfstate|tfvars)(\.[^/]*)?$"
    r"|(^|/)secrets?\.(ya?ml|json|toml)$"
    r"|\.sqlite3?$"
    r"|(^|/)\.DS_Store$"
    r"|service[-_]?account.*\.json$"
    r"|client_secret[^/]*\.json$"
    r"|(^|/)credentials\.json$",
    re.I,
)
PATTERNS = {
    "AWS access key": r"(?<![A-Z0-9])(AKIA|ASIA)[0-9A-Z]{16}(?![A-Z0-9])",
    "Google API key": r"AIza[0-9A-Za-z_\-]{35}",
    "Google OAuth client secret": r"\bGOCSPX-[A-Za-z0-9_\-]{20,}",
    "GitHub token": r"\b(gh[pousr]_[A-Za-z0-9]{36,}|github_pat_[A-Za-z0-9_]{80,})\b",
    "GitLab token": r"\bglpat-[A-Za-z0-9_\-]{20,}",
    "OpenAI/Anthropic key": r"\bsk-(ant-)?[A-Za-z0-9_\-]{20,}\b",
    "Slack token/webhook": r"\bxox[baprs]-[0-9A-Za-z\-]{10,}\b|\bxapp-[0-9]-[0-9A-Za-z\-]{20,}\b|hooks\.slack\.com/services/T[A-Za-z0-9]+/B[A-Za-z0-9]+/",
    "Stripe key": r"\b[sr]k_(live|test)_[0-9a-zA-Z]{20,}\b|\bwhsec_[A-Za-z0-9]{20,}\b",
    "Vercel token": r"\bvercel_[A-Za-z0-9_]{20,}\b",
    "Vercel project link": r"[\"'](orgId|projectId)[\"']\s*:\s*[\"'](team|prj)_[A-Za-z0-9]{16,}",
    "Supabase key": r"\bsb[pa]_[A-Za-z0-9_]{20,}\b|\bsb_secret_[A-Za-z0-9_\-]{20,}",
    "npm token": r"\bnpm_[A-Za-z0-9]{36}\b|_authToken\s*=\s*[\"']?(?!\$)[^\s\"']{8,}",
    "PyPI token": r"\bpypi-AgEIcHlwaS5vcmc[A-Za-z0-9_\-]{50,}",
    "Hugging Face token": r"\bhf_[A-Za-z0-9]{30,}\b",
    "SendGrid key": r"\bSG\.[A-Za-z0-9_\-]{16,}\.[A-Za-z0-9_\-]{30,}",
    "Twilio API key": r"\bSK[0-9a-fA-F]{32}\b",
    "Discord webhook": r"discord(app)?\.com/api/webhooks/[0-9]+/[A-Za-z0-9_\-]{30,}",
    "Telegram bot token": r"(?<![0-9])[0-9]{8,10}:AA[A-Za-z0-9_\-]{33}(?![A-Za-z0-9_\-])",
    "Mapbox secret token": r"\bsk\.eyJ[A-Za-z0-9_\-]{20,}\.[A-Za-z0-9_\-]{10,}",
    "DigitalOcean token": r"\bdo[opr]_v1_[a-f0-9]{64}\b",
    "Groq key": r"\bgsk_[A-Za-z0-9]{40,}\b",
    "Tavily key": r"\btvly-[A-Za-z0-9_\-]{20,}",
    "Apify token": r"\bapify_api_[A-Za-z0-9]{30,}",
    "Figma token": r"\bfigd_[A-Za-z0-9_\-]{30,}",
    "Notion token": r"\bntn_[A-Za-z0-9]{40,}",
    "Private key block": r"-----BEGIN [A-Z ]*PRIVATE KEY( BLOCK)?-----",
    # Any scheme, so web addresses and driver forms such as postgresql+asyncpg count too.
    # A password that starts with $, < or { is a reference, not a value.
    "URL with password": r"\b[A-Za-z][A-Za-z0-9+.\-]*://[^\s\"'/@:]+:(?![$<{])[^\s\"'/@]+@",
    "JWT": r"\beyJ[A-Za-z0-9_\-]{10,}\.eyJ[A-Za-z0-9_\-]{10,}\.[A-Za-z0-9_\-]{10,}\b",
    "Raw 64 hex key": r"(?i)(key|secret|priv|mnemonic)[A-Za-z0-9_]*[\"']?\s*[:=]\s*[\"']?(0x)?[0-9a-f]{64}\b",
}

# The generic rule: a name that contains a secret word, then a value.
# Longer words come first so SECRET_KEY counts as one word with no suffix.
SECRET_WORD = (
    r"(?:api[_-]?key|secret[_-]?key|private[_-]?key|access[_-]?key"
    r"|service[_-]?role[_-]?key|encryption[_-]?key|signing[_-]?key"
    r"|secret|token|password|passwd)"
)
ASSIGNMENT = re.compile(
    r"(?im)(?P<lead>^[ \t]*(?:export[ \t]+)?)?"
    r"(?<![A-Za-z0-9_])(?P<name>[A-Za-z0-9_]*" + SECRET_WORD + r"(?P<suffix>[A-Za-z0-9_\-]*))"
    r"[\"']?(?P<op>[ \t]*(?:=>|:=|[:=])[ \t]*)"
    r"(?:(?P<quote>[\"'`])(?P<quoted>[^\"'`\s]{8,})(?P=quote)"
    r"|(?P<bare>[^\s\"'`,;(){}\[\]<>$]{8,})(?=[ \t,;]|\r?$))"
)
BEARER = re.compile(r"(?i)\bbearer[ \t]+(?P<value>[A-Za-z0-9_\-.~+/=]{20,})")
PLACEHOLDER = re.compile(
    r"(?i)change[_-]?me|example|placeholder|dummy|redacted|your[_-]|xxxx|\*\*\*\*"
    r"|^[\^~<>=v]*[0-9]+\.[0-9]+"  # a version range, as in a lockfile entry for js-tokens
    r"|^(true|false|null|none|undefined)$"
)
REFERENCE = re.compile(r"[A-Za-z_][A-Za-z0-9_]*(\.[A-Za-z_][A-Za-z0-9_]*)+$")  # process.env.API_KEY_2


def mixed(value: str) -> bool:
    return bool(re.search(r"[0-9]", value) and re.search(r"[A-Za-z]", value))


def assignment_is_secret(m: re.Match[str]) -> bool:
    value = m.group("quoted") or m.group("bare")
    if PLACEHOLDER.search(value):
        return False
    if m.group("quoted"):
        # passwordInputId = "password-input" is a label; a random value has digits.
        return not m.group("suffix") or mixed(value)
    # Unquoted: code such as `token = sessionToken` looks the same as a value,
    # so ask for a random-looking value unless the line is a dotenv entry.
    dotenv = (
        m.group("lead") is not None and m.group("op") == "="
        and m.group("name").isupper() and not m.group("suffix")
    )
    return dotenv or (len(value) >= 12 and mixed(value) and not REFERENCE.match(value))


def bearer_is_secret(m: re.Match[str]) -> bool:
    value = m.group("value")
    return mixed(value) and not PLACEHOLDER.search(value)


RULES = [(name, re.compile(rx), None) for name, rx in PATTERNS.items()] + [
    ("Hardcoded secret assignment", ASSIGNMENT, assignment_is_secret),
    ("Bearer token", BEARER, bearer_is_secret),
]


def git(*args: str, cwd: Path | None = None) -> bytes:
    return subprocess.run(
        ["git", *args], cwd=cwd, capture_output=True, check=True
    ).stdout


def to_text(data: bytes) -> tuple[str, bool]:
    """Return the text to search and whether the file looks binary."""
    for bom, encoding in (
        (codecs.BOM_UTF32_LE, "utf-32"), (codecs.BOM_UTF32_BE, "utf-32"),
        (codecs.BOM_UTF16_LE, "utf-16"), (codecs.BOM_UTF16_BE, "utf-16"),
    ):
        if data.startswith(bom):
            return data.decode(encoding, "ignore"), False
    # Dropping NUL bytes turns UTF-16 without a byte order mark back into
    # readable text, and stops one stray NUL from hiding the rest of a file.
    return data.replace(b"\0", b"").decode("utf-8", "ignore"), b"\0" in data[:8000]


def scan_text(path: str, txt: str) -> list[str]:
    problems: list[str] = []
    for name, rx, is_secret in RULES:
        for m in rx.finditer(txt):
            if m.group(0) in ALLOW or (is_secret and not is_secret(m)):
                continue
            line = txt.count("\n", 0, m.start()) + 1
            # Do not copy any part of a credential into CI logs.
            problems.append(f"{path}:{line}: {name} (value redacted)")
    return problems


def staged_blobs(root: Path) -> list[tuple[str, str]]:
    """Path and blob id of every staged file, whatever its change type."""
    raw = git("diff", "--cached", "--raw", "-z", "--no-renames", "--no-abbrev",
              "--diff-filter=d", cwd=root).decode().split("\0")
    blobs = []
    for meta, path in zip(raw[0::2], raw[1::2]):
        _, new_mode, _, new_id, _ = meta.split(" ")
        if new_mode != "160000":  # a submodule pointer has no content here
            blobs.append((path, new_id))
    return blobs


def main() -> int:
    # A Windows pipe may not take the marks below; never crash on printing.
    for stream in (sys.stdout, sys.stderr):
        stream.reconfigure(errors="backslashreplace")
    all_mode = "--all" in sys.argv
    try:
        root = Path(git("rev-parse", "--show-toplevel").decode().strip())
        if all_mode:
            files = [(p, "") for p in git("ls-files", "-z", cwd=root).decode().split("\0") if p]
        else:
            files = staged_blobs(root)
        problems: list[str] = []
        binary_files: list[str] = []
        for p, blob_id in files:
            if FORBIDDEN_PATHS.search(p):
                problems.append(f"{p}: this file type must never be committed")
                continue
            # Inspect text regardless of extension (including lockfiles, SVGs,
            # source maps and minified code). Never silently pass a read error.
            data = (root / p).read_bytes() if all_mode else git("cat-file", "blob", blob_id, cwd=root)
            txt, binary = to_text(data)
            if binary:
                binary_files.append(p)
            problems += scan_text(p, txt)
    except (OSError, UnicodeError, ValueError, subprocess.CalledProcessError):
        print("✖ Secret scan could not read the repository or a tracked file; scan incomplete.", file=sys.stderr)
        return 2

    if problems:
        print("\n✖ Secret scan blocked this commit:\n  " + "\n  ".join(problems))
        print("\n  Real secret? Remove it, rotate it, never commit it."
              "\n  False positive? Review it before adding an exact match to ALLOW.")
        return 1
    print(f"✔ secret scan clean ({len(files)} files; {len(binary_files)} binary files searched as raw bytes only)")
    for p in binary_files:
        print(f"  binary, look yourself if it should be text: {p}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
