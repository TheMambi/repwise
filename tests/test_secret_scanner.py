"""Exercise the hook against real, isolated Git indexes using synthetic values."""
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest


SCANNER = Path(__file__).resolve().parents[1] / ".githooks" / "scan-secrets.py"
# Assemble fixtures so this test file itself contains no credential-like value.
SYNTHETIC_TOKEN = "gh" + "p_" + "A" * 36


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

    def stage(self, name, text):
        file = self.root / name
        file.parent.mkdir(parents=True, exist_ok=True)
        file.write_text(text)
        self.git("add", "--", name)
        return file

    def scan(self, *args, cwd=None):
        return subprocess.run(
            [sys.executable, str(SCANNER), *args], cwd=cwd or self.root,
            capture_output=True, text=True,
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

    def test_forbidden_file_is_blocked_even_if_empty(self):
        self.stage(".env.production", "")
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
        self.git("-c", "user.name=Test", "-c", "user.email=test@example.invalid",
                 "-c", "core.hooksPath=/dev/null", "commit", "-qm", "fixture")
        self.git("rm", "removed.txt")
        self.assertEqual(self.scan().returncode, 0)

    def test_binary_skip_is_reported(self):
        self.stage("binary.dat", "\0data")
        result = self.scan()
        self.assertEqual(result.returncode, 0)
        self.assertIn("1 binary files not inspected", result.stdout)


if __name__ == "__main__":
    unittest.main()
