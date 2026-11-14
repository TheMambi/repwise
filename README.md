# Repwise

[![Security & Build](https://github.com/TheMambi/repwise/actions/workflows/security.yml/badge.svg?branch=dev)](https://github.com/TheMambi/repwise/actions/workflows/security.yml)
[![License: AGPL-3.0](https://img.shields.io/badge/license-AGPL--3.0-8b5cf6.svg)](LICENSE)

A weekly home workout planner. Tell it what gear you own, your level, how long you can train and which areas you want to work, and it lays out a full week of sessions with sets, reps and rest for each movement.

**[Open the app](https://repwiseapp.vercel.app)**

[![The Repwise setup screen: session length, goal, days per week, equipment, focus areas and level above a Launch Program button, on a dark animated background](docs/screenshots/configure.png)](https://repwiseapp.vercel.app)

It mixes calisthenics and weight work, keeps each session inside your time budget, and spreads training days so rest falls between them. Every day shows how long it should take, and a day that comes out shorter than you asked for says so. Tap any exercise for form notes.

Everything runs in your browser. There is no backend, no account, no analytics, and nothing you pick is stored or sent anywhere.

A generated week has its own link. The settings and a random seed sit after the `#` in the address, a part browsers never send to a server, so a reload, a bookmark or a link sent to a training partner opens the same week. Back returns to the form with your settings still selected.

## What it does

| Setting | Choices |
| --- | --- |
| **Session length** | 15, 30, 45 or 60 minutes |
| **Goal** | Growth (3 sets of 8 to 12 reps, 90 seconds rest) or definition (4 sets of 15 to 20 reps, 45 seconds rest). Holds such as the plank are timed instead: 20 to 30 seconds for growth, 30 to 45 for definition |
| **Level** | Beginner, intermediate or advanced. A plan only uses movements at or below your level |
| **Days per week** | 2 to 6, spaced so rest days land between sessions where the week allows |
| **Equipment** | Dumbbells, pull-up bar, resistance band, TRX, bench. Bodyweight movements are always included |
| **Focus areas** | Push, pull, legs, core |

The result is a day-by-day plan drawn from a catalog of 36 movements. Each exercise opens a detail card with how to do it, the volume, the rest, the target muscle and the level.

| A generated week | Exercise detail |
| :---: | :---: |
| <img src="docs/screenshots/plan.png" alt="A four-day plan with Monday push day and Tuesday pull day. Each day shows its estimated length and each exercise its level, sets, reps and rest" width="520"> | <img src="docs/screenshots/exercise.png" alt="Dumbbell Bench Press detail card with form notes, volume, rest, target muscle and level" width="340"> |

## How it works

The planner lives in [`src/lib/planner.ts`](src/lib/planner.ts) as one pure function, so the tests can run it with a fixed random source. They build a plan for every combination of settings the form can send, 57,600 in all, and check each one against the rules below.

- **Equipment filter.** Each focus area gets a pool of the movements your gear allows. A movement that needs two things, such as a band and a pull-up bar, is only offered when you own both. Bodyweight work is always in the pool, so every area has something to do even with no equipment.
- **Spreading the week.** Focus areas rotate across the training days. Every area you chose gets at least one day; if there are more days than areas, the rotation repeats.
- **Level filter.** Each pool keeps only the movements at or below the level you chose. If an area has nothing that easy for your gear, its easiest movements stand in so the day is never empty, and every exercise shows its level.
- **Fitting the time.** An exercise is timed from its own prescription: every set at the top of its range, 3 seconds a rep, plus the rest after each set. That comes to about 6 minutes for growth and 7 for definition, so a 30 minute session holds 4 exercises and a 60 minute one about 9 or 8. The exercises are dealt out one at a time between the areas trained that day, so an area that runs out of movements leaves its share to the others.
- **Short days.** A small pool can run out before the session is full. The planner then adds sets, up to 5 per exercise, for as long as a whole extra round fits. If there is still room for another exercise after that, the day is marked as shorter than the length you picked. The lasting fix for a short day is more movements in the catalog.
- **Links.** Launch Program draws a seed, shuffles with a generator that repeats for that seed, and writes the settings and the seed to the address ([`src/lib/plan-link.ts`](src/lib/plan-link.ts)). Opening the address rebuilds the week from them. A link that cannot be read opens the form. The link holds settings, not exercises, so a link made before a change to the catalog or the planner can open a different week afterwards.
- **Variety.** Each pool is shuffled once per plan and read in order, so an area that comes back later in the week gets fresh movements before any repeat.

## Accessibility

The exercise card is a native modal dialog with a labelled title. Focus moves into it, Tab cannot reach the page behind it, the page behind does not scroll, Escape closes it and focus returns to the exercise you opened. On a small phone, or one held sideways, the card scrolls. When the plan replaces the form, focus moves to the plan's heading, and Reconfigure puts it back on the first setting. Option buttons announce their selected state, every control shows a ring when reached from the keyboard, and text meets WCAG AA contrast against the dark background.

The animated background has a pause button. It also rests while the tab is hidden or the exercise card is open, and it stays still when the system asks for reduced motion, including when that setting changes while the page is open.

## Tech

React 19, TypeScript, Vite 6, Tailwind CSS 3 and lucide-react. The background is a canvas flow field written for this app. Tests use Node's built-in test runner. Deployed as a static site on Vercel.

Design file: [Figma](https://www.figma.com/design/jAm3pPTMjnJMJoY95sDB3I)

## Run it locally

```bash
git clone https://github.com/TheMambi/repwise.git
cd repwise
npm install            # also switches on the pre-commit secret scanner and says so
npm run dev            # http://localhost:5173
npm test               # planner and secret-scanner tests
npm run lint
npm run build && npm run preview
npm run scan:secrets   # scan every tracked file for credential patterns
```

Node 22 or newer.

Before changing the catalog or the planner, read the [known pitfalls](docs/PITFALLS.md).

## Project layout

```
src/
  App.tsx                 planner UI
  lib/planner.ts          plan-building logic (pure, unit-tested)
  lib/plan-text.ts        wording for sets, holds and session length
  lib/plan-link.ts        the plan link in the address: write, read, rebuild
  data/exercises.ts       exercise catalog (36 movements)
  data/options.ts         the choices the form offers, shared by the form, catalog, planner and tests
  components/ui/          glass cards, buttons, flow-field background
tests/                    planner and secret-scanner tests
docs/                     README screenshots, the GitHub social preview and the known-pitfalls log
.githooks/                pre-commit secret scanner (switched on by npm install)
scripts/                  hook installer and the Python launcher the npm scripts use
.github/                  CI workflow and Dependabot config
vercel.json               security headers
```

## Security

The site sends a strict Content-Security-Policy with no inline scripts or styles, refuses to be framed and forces HTTPS. CI scans the full Git history for secrets on every push to any branch, runs `npm audit`, lint, tests and a production build on pushes to `main` and `dev` and on pull requests, and actions are pinned to commit hashes. See [SECURITY.md](SECURITY.md) for the details and for how to report a problem privately.

## License

Copyright (C) 2026 The Mambí. This program is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version. See `LICENSE` for the full text.
