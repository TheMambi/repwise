# Provenance and third-party notices

This file records where the parts of Repwise came from, as far as the repository can show, and lists the packages that ship in the built site. Where the origin of something is not recorded, it says so instead of guessing.

## Files in this repository

Every file was first published in commit `65ba66b` (17 September 2026), which imported an existing private project in one step. No earlier history is public, so the notes for that commit rest on what the project's own files said at the time.

| File | Where it came from |
| --- | --- |
| `src/data/exercises.ts` | 27 of the 36 entries (names, target muscles, levels and descriptions) come from the 29 in the first commit. The planning notes kept beside the prototype until commit `6edb4a4` say this data was extracted from a private research notebook. The documents loaded into that notebook are not named anywhere in the repository, so the wording of those descriptions has **no recorded source**. Nine entries were written for commit `ff17a57` (bodyweight pull and leg movements, Bench Dips and Bulgarian Split Squat). Two of the first 29 were removed in `0670dde`. The equipment lists and the reps or seconds unit were added in `0670dde` and `8badf77`, and four descriptions and five names were reworded in `9089f8c`. |
| `src/data/options.ts` | Written for this project in commit `0670dde`. |
| `src/components/ui/flow-field-background.tsx` | In the first commit as a component named `NeuralBackground` with general-purpose settings and comments. **Its origin is not recorded**: the repository does not say whether it was written for this project or adapted from a shared component collection. The pause setting, the fixed step rate, the settled resize and the reduced-motion behaviour were written for this project in `315cadb` and `4f31286`. |
| `src/components/ui/premium-ui.tsx` | In the first commit. **Its origin is not recorded.** The pressed states and button types were added in `315cadb` and the size setting in `9089f8c`. |
| `public/favicon.svg`, `public/apple-touch-icon.png` | Drawn for this project. The PNG is a render of the SVG. |

### Still to confirm

The project owner is the only person who can settle these. Until they are settled, the AGPL grant in `LICENSE` can only cover what the owner had the right to license.

1. Which documents were loaded into the research notebook, and whether the first 29 exercise descriptions follow any of them closely enough to need permission or credit. If they are the owner's own wording, say so in the table above.
2. Whether `flow-field-background.tsx` and `premium-ui.tsx` were adapted from a component collection. If so, add its name, address and licence here and keep any notice that licence asks for.

## Packages in the built site

`npm run build` bundles these packages into the files under `dist/assets`. The exact versions are in `package-lock.json`. The built script keeps the licence comments of React and lucide-react; the others do not carry one in the bundle, so their notices are given here.

| Package | Licence | Copyright |
| --- | --- | --- |
| react | MIT | Copyright (c) Meta Platforms, Inc. and affiliates. |
| react-dom | MIT | Copyright (c) Meta Platforms, Inc. and affiliates. |
| scheduler | MIT | Copyright (c) Meta Platforms, Inc. and affiliates. Installed with react-dom. |
| lucide-react | ISC | Copyright (c) for portions of Lucide are held by Cole Bemis 2013-2026 as part of Feather (MIT). All other copyright (c) for Lucide are held by Lucide Contributors 2026. |
| clsx | MIT | Copyright (c) Luke Edwards (lukeed.com) |
| tailwindcss | MIT | Copyright (c) Tailwind Labs, Inc. A build tool; its base styles are part of the built stylesheet. |

When a package is added to or removed from `dependencies` in `package.json`, update this table. A test fails if a bundled package is missing from it.

### MIT License

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

### ISC License

Permission to use, copy, modify, and/or distribute this software for any purpose with or without fee is hereby granted, provided that the above copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING FROM, OUT OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
