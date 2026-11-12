# Security Policy

Repwise is a fully client-side web app. It has no backend, no database, no accounts, and it stores nothing about you. The only network requests it makes are for its own static assets.

## Reporting a vulnerability

Please use GitHub's private reporting: open the **Security** tab of this repository and choose **Report a vulnerability**. Do not open a public issue for security problems.

You can expect an acknowledgement within 7 days.

## What is in scope

- Anything that lets a third party run code in a visitor's browser via this site (XSS, dependency supply chain).
- Secrets, personal data, or credentials found anywhere in this repository's history.
- Misconfigured security headers on the deployed site.

## Controls in place

- Secret scanning on every push, pull request, manual run, and weekly schedule. After the event-specific scan, an explicit Gitleaks command scans all fetched reachable history, including merge changes (`.github/workflows/security.yml`).
- A local pre-commit hook that blocks common credential patterns and secret-bearing files (`.githooks/`), installed automatically by `npm install`.
- Dependabot for npm and GitHub Actions; CI fails on high-severity advisories.
- Strict Content-Security-Policy (same-origin scripts and styles only, no inline code) and hardening headers served by Vercel (`vercel.json`).
- AGPL-3.0-licensed, no third-party runtime services.

## Scanner guarantees and limitations

The local hook scans staged content; `npm run scan:secrets` scans tracked working-tree files. Both reject Git/read errors, inspect text regardless of filename or size, and redact matched values in output. Binary content is not inspected by this lightweight pattern scanner and its skipped-file count is reported. Neither scanner proves that all possible secrets are absent; exposed credentials still need revocation and rotation.

CI actions are pinned to verified commit SHAs and checkout does not persist Git credentials. Dependabot can propose updates to those pins. Run the planner and scanner tests with `npm test`.

Repository administrators should protect `main` against direct/force pushes and deletion, require pull requests and the `Secret scan (full history)` and `Lint, audit, build` checks, and review Vercel's production deployment gating. A workflow file alone does not enforce merge or deployment gates.
