# Repwise

[![Security & Build](https://github.com/TheMambi/repwise/actions/workflows/security.yml/badge.svg?branch=dev)](https://github.com/TheMambi/repwise/actions/workflows/security.yml)
[![License: AGPL-3.0](https://img.shields.io/badge/license-AGPL--3.0-8b5cf6.svg)](LICENSE)

A weekly home workout planner. Tell it what gear you own, how long you can train and which areas you want to work, and it lays out a full week of sessions with sets, reps and rest for each movement.

**[Open the app](https://repwiseapp.vercel.app)**

[![The Repwise setup screen: session length, goal, days per week, equipment and focus areas above a Launch Program button, on a dark animated background](docs/screenshots/configure.png)](https://repwiseapp.vercel.app)

It mixes calisthenics and weight work, keeps each session inside your time budget, and spreads training days so rest falls between them. Tap any exercise for form notes.

Everything runs in your browser. There is no backend, no account, no analytics, and nothing you pick is stored or sent anywhere.

## What it does

| Setting | Choices |
| --- | --- |
| **Session length** | 15, 30, 45 or 60 minutes |
| **Goal** | Growth (3 sets of 8 to 12, 90 seconds rest) or definition (4 sets of 15 to 20, 45 seconds rest) |
| **Days per week** | 2 to 6, spaced so rest days land between sessions where the week allows |
| **Equipment** | Bodyweight, dumbbells, pull-up bar, resistance band, TRX, bench |
| **Focus areas** | Push, pull, legs, core |

The result is a day-by-day plan drawn from a catalog of 38 movements. Each exercise opens a detail card with how to do it, the volume, the rest and the target muscle.

| A generated week | Exercise detail |
| :---: | :---: |
| <img src="docs/screenshots/plan.png" alt="A four-day plan with Monday push day and Tuesday pull day, each listing exercises with sets, reps and rest" width="520"> | <img src="docs/screenshots/exercise.png" alt="Dumbbell Bench Press detail card with form notes, volume, rest and target muscle" width="340"> |

## How it works

The planner lives in [`src/lib/planner.ts`](src/lib/planner.ts) as one pure function, so the tests can run it with a fixed random source.

- **Equipment filter.** Each focus area gets a pool of the movements your gear allows. Bodyweight work is always in the pool, so every area has something to do even with no equipment.
- **Spreading the week.** Focus areas rotate across the training days. Every area you chose gets at least one day; if there are more days than areas, the rotation repeats.
- **Fitting the time.** A session holds about one exercise per 5 minutes (never fewer than 2), split evenly between the areas trained that day.
- **Variety.** Each pool is shuffled once per plan and read in order, so an area that comes back later in the week gets fresh movements before any repeat.

## Accessibility

The exercise card is a proper dialog with a labelled title: focus moves into it, Escape closes it and focus returns to the exercise you opened. Option buttons announce their selected state, everything works from the keyboard, and the animated background stops when the system asks for reduced motion.

## Tech

React 19, TypeScript, Vite 6, Tailwind CSS 3 and lucide-react. The background is a canvas flow field written for this app. Tests use Node's built-in test runner. Deployed as a static site on Vercel.

Design file: [Figma](https://www.figma.com/design/jAm3pPTMjnJMJoY95sDB3I)

## Run it locally

```bash
git clone https://github.com/TheMambi/repwise.git
cd repwise
npm install            # also installs the pre-commit secret scanner
npm run dev            # http://localhost:5173
npm test               # planner and secret-scanner tests
npm run lint
npm run build && npm run preview
npm run scan:secrets   # scan every tracked file for credential patterns
```

Node 22 or newer.

## Project layout

```
src/
  App.tsx                 planner UI
  lib/planner.ts          plan-building logic (pure, unit-tested)
  data/exercises.ts       exercise catalog (38 movements)
  components/ui/          glass cards, buttons, flow-field background
tests/                    planner and secret-scanner tests
docs/                     README screenshots and the GitHub social preview
legacy/                   original single-file prototype and planning notes
.githooks/                pre-commit secret scanner (installed by npm install)
.github/                  CI workflow and Dependabot config
vercel.json               security headers
```

## Security

The site sends a strict Content-Security-Policy with no inline scripts or styles, refuses to be framed and forces HTTPS. CI scans the full Git history for secrets, runs `npm audit`, lint, tests and a production build on every push, and actions are pinned to commit hashes. See [SECURITY.md](SECURITY.md) for the details and for how to report a problem privately.

## License

Copyright (C) 2026 The Mambí. This program is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version. See `LICENSE` for the full text.
