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

- Secret scanning on every push and weekly over the full git history (`.github/workflows/security.yml`).
- A local pre-commit hook that blocks common credential patterns and secret-bearing files (`.githooks/`), installed automatically by `npm install`.
- Dependabot for npm and GitHub Actions; CI fails on high-severity advisories.
- Strict Content-Security-Policy and hardening headers served by Vercel (`vercel.json`).
- MIT-licensed, no third-party runtime services.
