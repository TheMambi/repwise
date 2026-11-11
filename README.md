<div align="center">

# Repwise

**Tell it what gear you have and how long you've got. Get a full week of workouts.**

[**Open the app**](https://repwiseapp.vercel.app) &nbsp;·&nbsp; [Features](#features) &nbsp;·&nbsp; [Run it locally](#run-it-locally) &nbsp;·&nbsp; [Security](#security)

[![Live](https://img.shields.io/website?url=https%3A%2F%2Frepwiseapp.vercel.app&label=live&up_message=online&down_message=offline&color=8b5cf6)](https://repwiseapp.vercel.app)
[![License: MIT](https://img.shields.io/badge/license-MIT-8b5cf6.svg)](LICENSE)

<a href="https://repwiseapp.vercel.app">
  <img src="docs/screenshots/configure.png" alt="Repwise setup screen with session length, goal, days per week, equipment, and focus area options above a Launch Program button" width="860">
</a>

</div>

Repwise builds a weekly home workout plan around what you actually have: your equipment, the minutes you can spare, the muscles you want to focus on, and whether you're training for growth or definition. It mixes calisthenics and weight work, sizes sets and reps to your time and goal, and lets you tap any exercise for form notes.

Everything runs in your browser. There is no backend, no account, no analytics, and nothing is stored or sent anywhere.

## Features

- Pick equipment (bodyweight only, dumbbells, pull-up bar, resistance band, TRX, bench), session length, focus areas, and goal.
- Get a full week split with daily focus, exercise order, sets, reps, and rest.
- Falls back to bodyweight variants when your equipment can't cover a muscle group.
- Spreads training days across the week and keeps each session inside your time budget.
- Exercise detail cards with execution notes.
- Dark glass UI with an animated flow-field background.

## Screenshots

| A generated week | Exercise detail |
| :---: | :---: |
| <img src="docs/screenshots/plan.png" alt="A four-day plan with Monday push day and Tuesday pull day, each listing exercises with sets, reps, and rest"> | <img src="docs/screenshots/exercise.png" alt="Dumbbell Bench Press detail card with form notes, volume, rest, and target muscle"> |

## Figma

https://www.figma.com/design/jAm3pPTMjnJMJoY95sDB3I

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
npm test               # planner and secret-scanner tests
npm run scan:secrets   # scan every tracked file for credential patterns
```

## Project layout

```
src/
  App.tsx                 # planner UI
  lib/planner.ts          # plan-building logic (pure, unit-tested)
  data/exercises.ts       # exercise catalog (38 movements)
  components/ui/          # glass cards, buttons, flow-field background
docs/screenshots/         # images used in this README
legacy/                   # original single-file prototype and planning notes
.githooks/                # pre-commit secret scanner (auto-installed)
.github/                  # CI: secret scan, audit, lint, build; Dependabot
vercel.json               # security headers (CSP, HSTS, frame denial)
```

## Security

See [SECURITY.md](SECURITY.md) for the reporting process and the controls in place.

## License

[MIT](LICENSE)
