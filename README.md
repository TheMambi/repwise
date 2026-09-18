# Repwise

Repwise builds a weekly home workout plan around what you actually have: your equipment, the minutes you can spare, the muscles you want to focus on, and whether you're training for growth or definition. It mixes calisthenics and weight work, sizes sets and reps to your time and goal, and lets you tap any exercise for form notes.

**Live:** https://home-gym-plan.vercel.app

Everything runs in your browser. There is no backend, no account, no analytics, and nothing is stored or sent anywhere.

## Features

- Pick equipment (bodyweight only, dumbbells, pull-up bar, resistance band, TRX, bench), session length, focus areas, and goal.
- Get a full week split with daily focus, exercise order, sets, reps, and rest.
- Falls back to bodyweight variants when your equipment can't cover a muscle group.
- Exercise detail cards with execution notes.
- Dark glass UI with an animated flow-field background.

## Stack

React 19, TypeScript, Vite 6, Tailwind CSS 3, lucide-react. Deployed as a static site on Vercel.

## Run it locally

```bash
git clone https://github.com/TheMambi/repwise.git
cd repwise
npm install        # also installs the pre-commit secret scanner
npm run dev        # http://localhost:5173
```

Other scripts:

```bash
npm run build          # type-check and produce dist/
npm run preview        # serve the production build
npm run lint           # eslint
npm run scan:secrets   # scan every tracked file for credential patterns
```

## Project layout

```
src/
  App.tsx                 # planner UI and matching logic
  data/exercises.ts       # exercise catalog (30 movements)
  components/ui/          # glass cards, buttons, flow-field background
legacy/                   # original single-file prototype and planning notes
.githooks/                # pre-commit secret scanner (auto-installed)
.github/                  # CI: secret scan, audit, lint, build; Dependabot
vercel.json               # security headers (CSP, HSTS, frame denial)
```

## Security

See [SECURITY.md](SECURITY.md) for the reporting process and the controls in place.

## License

[MIT](LICENSE)
