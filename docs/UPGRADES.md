# Major upgrades waiting

Dependabot is told to skip major version bumps (`.github/dependabot.yml`), so nothing announces them. This table is the list. Look at it once a quarter, and whenever `npm audit` names a fix that only exists in a newer major. Update it with `npm outdated` after each upgrade.

Last checked: 13 November 2026.

| Order | Package | Installed | Latest | What it needs | Checks after upgrading |
| --- | --- | --- | --- | --- | --- |
| Done | eslint, @eslint/js, globals | 10, 10, 17 | 10, 10, 17 | Nothing. The plugins already accepted ESLint 10 and the config loaded unchanged. | |
| 1 | vite with @vitejs/plugin-react | 6, 4 | 8, 6 | Upgrade both in one change: plugin 4 stops at Vite 7 and plugin 6 needs Vite 8. Vite 8 builds with rolldown and lightningcss instead of rollup and esbuild. | The `@` alias and `__dirname` in `vite.config.ts`; `%VITE_SITE_URL%` filled in `dist/index.html`; the footer link; the script size against 261 kB; the licence comments in the built script (see `THIRD_PARTY.md`). |
| 2 | lucide-react | 0.577 | 1.x | Check that the twelve icons imported in `src/App.tsx` and `src/components/ui/premium-ui.tsx` still exist under the same names. | Each icon on the form, the plan and the detail card. |
| 3 | tailwindcss | 3 | 4 | Optional. Version 4 replaces `tailwind.config.js` and the PostCSS setup, so it is a migration, not a bump. | The `fade-in` animation, the values in square brackets, the opacity suffixes such as `text-white/60`, the focus ring in `src/index.css`, and the `open:` and `backdrop:` variants on the dialog. |
| 4 | typescript | 5.9 | 7 | Blocked: typescript-eslint 8 accepts TypeScript below 6.1 only. Wait for a typescript-eslint release that lists 7. | `tsc -b` over the three tsconfig files and the `erasableSyntaxOnly` setting. |
| With Node | @types/node | 24 | 26 | Keep it at or below the Node version CI runs (22 today). Raise it when the Node floor in `package.json` rises. | `tsc -b`. |

After each step run the full check (`npm run lint && npx tsc -b && npm test && npm run build`) and click through the form, a plan and a detail card on a preview deployment.

One override is also waiting to be removed: see the minimatch row in [PITFALLS.md](PITFALLS.md).
