"""Exercise the hook against real, isolated Git indexes using synthetic values."""
import os
from pathlib import Path
import random
import shutil
import string
import subprocess
import sys
import tempfile
import unittest


HOOKS = Path(__file__).resolve().parents[1] / ".githooks"
SCANNER = HOOKS / "scan-secrets.py"
ALNUM = string.ascii_letters + string.digits
HEX = "0123456789abcdef"
Q = '"'


def rand(length, alphabet=ALNUM):
    """Random filler that has a digit and a letter, made fresh on every run."""
    while True:
        value = "".join(random.choice(alphabet) for _ in range(length))
        if any(c.isdigit() for c in value) and any(c.isalpha() for c in value):
            return value


# Assemble fixtures so this test file itself contains no credential-like value.
SYNTHETIC_TOKEN = "gh" + "p_" + rand(36)

# Every shape the audit found the old generic rule missed, as (file name, line).
GENERIC_SHAPES = [
    ("notes.txt", "MY_API" + "_KEY = " + Q + rand(24) + Q),
    ("notes.txt", "OPENAI_API" + "_KEY=" + Q + rand(40) + Q),
    ("notes.txt", "DB_PASS" + "WORD=" + Q + rand(16) + Q),
    ("notes.txt", "STRIPE_SECRET" + "_KEY='" + rand(30) + "'"),
    ("notes.txt", "SUPABASE_SERVICE_ROLE" + "_KEY=" + Q + rand(40) + Q),
    ("notes.txt", "VERCEL_ACCESS" + "_TOKEN=" + Q + rand(24) + Q),
    ("notes.txt", "const dbPass" + "word = " + Q + rand(16) + Q),
    ("notes.txt", "openaiApi" + "Key: " + Q + rand(30) + Q),
    ("notes.txt", "const myApi" + "Key = " + Q + rand(30) + Q),
    ("notes.txt", "API" + "_KEY_PROD = " + Q + rand(30) + Q),
    ("notes.txt", "API" + "_KEY=" + rand(32)),
    ("notes.txt", "pass" + "word=" + rand(16)),
    ("config.yaml", "pass" + "word: " + rand(16)),
    (".env.example", "API" + "_KEY=" + rand(32)),
    (".env.example", "DB_PASS" + "WORD=" + "".join(random.choice(string.ascii_lowercase) for _ in range(12))),
    ("notes.txt", "JWT_SEC" + "RET=" + Q + rand(48) + Q),
    ("notes.txt", "SEC" + "RET=" + Q + rand(32) + Q),
    ("notes.txt", "jwt_sec" + "ret = " + Q + rand(32) + Q),
    ("notes.txt", "sec" + "ret = " + Q + rand(32) + Q),
    ("notes.txt", "tok" + "en: " + Q + rand(32) + Q),
    ("notes.txt", "BOT_TOK" + "EN=" + Q + rand(32) + Q),
    ("notes.txt", "webhookSec" + "ret: " + Q + rand(32) + Q),
    ("notes.txt", "aws_secret_access" + "_key = " + Q + rand(40) + Q),
    ("notes.txt", "Authorization: Bear" + "er " + rand(40)),
    ("notes.txt", "PRIVATE" + "_KEY=0x" + rand(64, HEX)),
]

# Ordinary lines that name a secret without holding one. None may block a commit.
HARMLESS_LINES = [
    "const tok" + "en = getToken(session)",
    "const api" + "Key = process.env.API_KEY_V2",
    "pass" + "word: string;",
    "tok" + "en: PropTypes.string.isRequired,",
    "  GITHUB_TOK" + "EN: ${{ secrets.GITHUB_TOKEN }}",
    "API" + "_KEY=",
    "API" + "_KEY=your_api_key_here",
    "pass" + "word = " + Q + "changeme-please" + Q,
    "pass" + "wordInputId = " + Q + "password-input" + Q,
    "tok" + "enType: " + Q + "Bearer" + Q,
    '"js-tok' + 'ens": "^10.12.14"',
    '"js-tok' + 'ens": "1.0.0-beta.12"',
    "if (pass" + "word == " + Q + "longenoughvalue" + Q + ") {}",
    "Authorization: Bear" + "er <your token goes here>",
    "Authorization: `Bear" + "er ${session.accessToken}`",
    "//registry.npmjs.org/:_auth" + "Token=${NPM_TOKEN}",
    "postgres" + "ql://app:${DB_PASSWORD}@db.example.invalid/app",
    "See https://example.invalid:8080/docs and mailto:owner@example.invalid",
]

VENDOR_SHAPES = {
    "Vercel Blob": "ver" + "cel_" + "blob_rw_" + rand(16) + "_" + rand(30),
    "Vercel project link": '{"org' + 'Id":"te' + 'am_' + rand(24) + '","project' + 'Id":"pr' + 'j_' + rand(28) + '"}',
    "Supabase secret": "sb" + "_sec" + "ret_" + rand(31),
    "Slack app-level": "xa" + "pp-1-A0" + rand(9, string.digits + "A") + "-" + rand(13, string.digits + "A") + "-" + rand(64, HEX),
    "Google OAuth client secret": "GOC" + "SPX-" + rand(28),
    "GitLab": "gl" + "pat-" + rand(20),
    "Hugging Face": "h" + "f_" + rand(34),
    "SendGrid": "S" + "G." + rand(22) + "." + rand(43),
    "Twilio": "S" + "K" + rand(32, HEX),
    "Discord webhook": "https://discord" + ".com/api/web" + "hooks/" + "".join(random.choice(string.digits) for _ in range(18)) + "/" + rand(68),
    "Telegram": "".join(random.choice(string.digits) for _ in range(10)) + ":A" + "A" + rand(33),
    "Mapbox": "s" + "k." + "ey" + "J" + rand(60) + "." + rand(22),
    "PyPI": "py" + "pi-AgEIcHlwaS5vcmc" + rand(70),
    "DigitalOcean": "do" + "p_v1_" + rand(64, HEX),
    "Groq": "gs" + "k_" + rand(52),
    "Tavily": "tv" + "ly-" + rand(32),
    "Apify": "api" + "fy_api_" + rand(36),
    "Figma": "fi" + "gd_" + rand(40),
    "Notion": "nt" + "n_" + rand(46),
    "npm legacy": "//registry.npmjs.org/:_auth" + "Token=" + "-".join(rand(n, HEX) for n in (8, 4, 4, 4, 12)),
    "hex private key": "wallet" + "Key: " + Q + "0x" + rand(64, HEX) + Q,
    "basic-auth URL": "https://deploy:" + rand(20) + "@git.example.invalid/x.git",
    "driver database URL": "postgres" + "ql+asyncpg://app:" + rand(16) + "@db.example.invalid/app",
}

FORBIDDEN_NAMES = [
    ".env.production", ".ENV", ".envrc", "prod.env", "local.env", "secrets.env",
    "docker/app.env", ".netrc", ".pypirc", ".git-credentials", ".htpasswd",
    "aws/credentials", ".aws/credentials", "kubeconfig", "terraform.tfstate",
    "prod.tfvars", "secrets.yaml", "id_rsa_github", "deploy_key", "Server.PEM",
    "cert.P12", "client_secret_123.json", "dump.sqlite", ".vercel/project.json",
]
ALLOWED_NAMES = [".env.example", ".env.template", "id_rsa.pub", "deploy_key.pub", ".npmrc", "environment.ts"]


class SecretScannerTests(unittest.TestCase):
    def setUp(self):
        self.directory = tempfile.TemporaryDirectory()
        self.addCleanup(self.directory.cleanup)
        self.root = Path(self.directory.name)
        self.git("init", "-q")

    def git(self, *args):
        return subprocess.run(
            ["git", *args], cwd=self.root, capture_output=True, check=True
        )

    def commit(self):
        self.git("-c", "user.name=Test", "-c", "user.email=test@example.invalid",
                 "-c", "core.hooksPath=/dev/null", "-c", "commit.gpgsign=false",
                 "commit", "-qm", "fixture")

    def stage(self, name, text):
        file = self.root / name
        file.parent.mkdir(parents=True, exist_ok=True)
        if isinstance(text, bytes):
            file.write_bytes(text)
        else:
            file.write_text(text)
        self.git("add", "-f", "--", name)
        return file

    def scan(self, *args, cwd=None, env=None):
        return subprocess.run(
            [sys.executable, str(SCANNER), *args], cwd=cwd or self.root,
            capture_output=True, text=True, env=env,
        )

    def test_clean_index_passes(self):
        self.stage("safe.txt", "No credentials here.")
        self.assertEqual(self.scan().returncode, 0)

    def test_staged_secret_cannot_be_hidden_by_worktree_edit(self):
        file = self.stage("config.txt", SYNTHETIC_TOKEN)
        file.write_text("safe unstaged replacement")
        result = self.scan()
        self.assertEqual(result.returncode, 1)
        self.assertIn("GitHub token", result.stdout)
        self.assertNotIn(SYNTHETIC_TOKEN[:12], result.stdout + result.stderr)

    def test_text_extensions_and_lockfile_names_do_not_bypass_scan(self):
        for name in ("package-lock.json", "yarn.lock", "pnpm-lock.yaml",
                     "package-lock.json.credentials.txt", "asset.svg", "app.min.js",
                     "app.js.map", "fake.png"):
            with self.subTest(name=name):
                self.stage(name, SYNTHETIC_TOKEN)
                self.assertEqual(self.scan().returncode, 1)
                self.git("rm", "--cached", "--", name)

    def test_large_text_is_scanned(self):
        self.stage("large.txt", "x" * 5_000_001 + "\n" + SYNTHETIC_TOKEN)
        self.assertEqual(self.scan().returncode, 1)

    def test_generic_rule_catches_prefixed_unquoted_and_secret_or_token_names(self):
        for name, line in GENERIC_SHAPES:
            with self.subTest(shape=line.split("=")[0].split(":")[0]):
                self.stage(name, "# settings\n" + line + "\n")
                result = self.scan()
                self.assertEqual(result.returncode, 1)
                self.assertIn(f"{name}:2:", result.stdout)
                self.assertNotIn(line[-8:], result.stdout + result.stderr)
                self.git("rm", "-q", "--cached", "--", name)

    def test_ordinary_lines_that_name_a_secret_are_not_flagged(self):
        for line in HARMLESS_LINES:
            with self.subTest(line=line):
                self.stage("notes.txt", line + "\n")
                self.assertEqual(self.scan().returncode, 0)

    def test_vendor_formats_are_caught(self):
        for vendor, value in VENDOR_SHAPES.items():
            with self.subTest(vendor=vendor):
                self.stage("notes.txt", value + "\n")
                self.assertEqual(self.scan().returncode, 1)

    def test_forbidden_files_are_blocked_whatever_they_hold(self):
        for name in FORBIDDEN_NAMES:
            with self.subTest(name=name):
                self.stage(name, "")
                self.assertEqual(self.scan().returncode, 1)
                self.git("rm", "-q", "--cached", "--", name)

    def test_lookalike_file_names_are_allowed(self):
        for name in ALLOWED_NAMES:
            with self.subTest(name=name):
                self.stage(name, "nothing here\n")
                self.assertEqual(self.scan().returncode, 0)
                self.git("rm", "-q", "--cached", "--", name)

    def test_type_change_is_scanned(self):
        self.stage("target.txt", "safe\n")
        os.symlink("target.txt", self.root / "settings.conf")
        self.git("add", "--", "settings.conf")
        self.commit()
        (self.root / "settings.conf").unlink()
        self.stage("settings.conf", SYNTHETIC_TOKEN + "\n")
        self.assertEqual(self.scan().returncode, 1)

    def test_stage_prefixed_name_is_scanned(self):
        self.stage("safe.txt", "nothing here\n")
        self.stage("0:safe.txt", SYNTHETIC_TOKEN + "\n")
        result = self.scan()
        self.assertEqual(result.returncode, 1)
        self.assertIn("0:safe.txt:1:", result.stdout)

    def test_utf16_and_utf32_text_is_scanned(self):
        text = "notes\n" + SYNTHETIC_TOKEN + "\n"
        for encoding in ("utf-16", "utf-16-le", "utf-16-be", "utf-32"):
            for mark in ("﻿", ""):
                with self.subTest(encoding=encoding, mark=bool(mark)):
                    self.stage("notes.txt", (mark + text).encode(encoding))
                    self.assertEqual(self.scan().returncode, 1)

    def test_stray_nul_does_not_hide_a_file(self):
        self.stage("export.csv", b"id,name\0,x\n" + SYNTHETIC_TOKEN.encode() + b"\n")
        self.assertEqual(self.scan().returncode, 1)

    def test_missing_tracked_file_fails_closed(self):
        self.stage("config.txt", "safe").unlink()
        result = self.scan("--all")
        self.assertEqual(result.returncode, 2)
        self.assertNotIn("scan clean", result.stdout)

    def test_non_repository_fails_closed(self):
        with tempfile.TemporaryDirectory() as other:
            result = self.scan("--all", cwd=other)
        self.assertEqual(result.returncode, 2)
        self.assertNotIn("scan clean", result.stdout)

    def test_all_mode_works_from_subdirectory(self):
        self.stage("sub/config.txt", SYNTHETIC_TOKEN)
        self.assertEqual(self.scan("--all", cwd=self.root / "sub").returncode, 1)

    def test_staged_deletion_does_not_fail(self):
        self.stage("removed.txt", "safe")
        self.commit()
        self.git("rm", "removed.txt")
        self.assertEqual(self.scan().returncode, 0)

    def test_binary_skip_is_reported(self):
        self.stage("binary.dat", "\0data")
        result = self.scan()
        self.assertEqual(result.returncode, 0)
        self.assertIn("1 binary files", result.stdout)
        self.assertIn("binary.dat", result.stdout)

    def test_output_survives_a_stdout_that_is_not_utf8(self):
        env = dict(os.environ, PYTHONIOENCODING="cp1252")
        self.stage("safe.txt", "nothing here\n")
        result = self.scan(env=env)
        self.assertEqual(result.returncode, 0)
        self.assertIn("scan clean", result.stdout)
        self.stage("bad.txt", SYNTHETIC_TOKEN + "\n")
        result = self.scan(env=env)
        self.assertEqual(result.returncode, 1)
        self.assertIn("bad.txt:1:", result.stdout)

    def hook(self, *interpreters):
        """Run the pre-commit hook with only git and the named commands on PATH."""
        shutil.copytree(HOOKS, self.root / ".githooks")
        bin_dir = self.root / "bin"
        bin_dir.mkdir()
        os.symlink(shutil.which("git"), bin_dir / "git")
        for name in interpreters:
            os.symlink(sys.executable, bin_dir / name)
        return subprocess.run(
            [shutil.which("sh"), ".githooks/pre-commit"], cwd=self.root,
            capture_output=True, text=True, env=dict(os.environ, PATH=str(bin_dir)),
        )

    def test_hook_falls_back_to_a_command_named_python(self):
        self.stage("bad.txt", SYNTHETIC_TOKEN + "\n")
        result = self.hook("python")
        self.assertEqual(result.returncode, 1)
        self.assertIn("bad.txt:1:", result.stdout)

    def test_hook_says_so_when_there_is_no_python(self):
        self.stage("safe.txt", "nothing here\n")
        result = self.hook()
        self.assertEqual(result.returncode, 1)
        self.assertIn("Python 3", result.stderr)
        self.assertNotIn("not found", result.stderr)


if __name__ == "__main__":
    unittest.main()
