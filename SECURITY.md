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

- Secret scanning on every push to any branch, pull request, manual run, and weekly schedule. After the event-specific scan, an explicit Gitleaks command scans all fetched reachable history, including merge changes (`.github/workflows/security.yml`).
- A local pre-commit hook that blocks common credential patterns and secret-bearing files (`.githooks/`). `npm install` switches it on and prints one line saying whether it is active. See "The local hook" below for when it is not.
- Dependabot for npm and GitHub Actions. Its version updates open against `dev`; security updates open against the default branch. CI fails on high-severity advisories.
- Strict Content-Security-Policy (same-origin scripts and styles only, no inline code) and hardening headers served by Vercel (`vercel.json`).
- AGPL-3.0-licensed, no third-party runtime services.

## Scanner guarantees and limitations

The local hook scans staged content, including files whose type changed; `npm run scan:secrets` scans tracked working-tree files. Both reject Git/read errors, inspect text regardless of filename or size, and redact matched values in output. UTF-16 and UTF-32 text is decoded before it is searched. A file that looks binary is searched as raw bytes with NUL bytes removed, and the scanner prints its name so you can look at it yourself; compressed or encoded content inside it is not seen.

Besides known vendor key formats, a generic rule flags a value assigned to a name that contains `secret`, `token`, `password` or a key word such as `api_key`, with or without a prefix and with or without quotes. To keep ordinary code from blocking commits, it skips obvious placeholders (`changeme`, `example`, `your_...`), references such as `process.env.NAME`, and unquoted values that have no digit unless the line is an upper-case `NAME=value` entry. A real secret that looks like a placeholder or a plain word can pass. Neither scanner proves that all possible secrets are absent; exposed credentials still need revocation and rotation.

## The local hook

The hook is a convenience, not a guarantee. It is not active when:

- you installed with `--ignore-scripts`, downloaded a ZIP, or have no git: run `npm run hooks:check` to see, and `npm run prepare` to switch it on. `npm test` runs the check first;
- the clone already runs hooks from somewhere else (`core.hooksPath` set by another tool, or files in `.git/hooks`): the installer leaves those alone and prints a warning with the command to switch;
- the project folder sits inside another repository without a `.git` of its own: the installer does not touch the outer repository;
- a commit is made with `--no-verify`.

Once the hook is on, `git commit` runs whatever `.githooks/` contains on the branch you have checked out. Read the changes to `.githooks/` before committing on someone else's branch or pull request.

The hook needs Python 3.8 or newer under the name `python3`, `python` or `py`. Without it the commit is blocked with a message that says so.

CI actions are pinned to verified commit SHAs and checkout does not persist Git credentials. Dependabot can propose updates to those pins. Run the planner and scanner tests with `npm test`.

Repository administrators should protect `main` against direct/force pushes and deletion, require pull requests and the `Secret scan (full history)` and `Lint, audit, build` checks, and review Vercel's production deployment gating. A workflow file alone does not enforce merge or deployment gates.
