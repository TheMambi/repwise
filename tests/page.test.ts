import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { exercisesData } from '../src/data/exercises.ts';
import { volumeLabel } from '../src/lib/plan-text.ts';

const read = (path: string) => readFileSync(new URL(path, import.meta.url), 'utf8');

test('exercise descriptions are free of the known typo and of gym shorthand', () => {
  for (const ex of exercisesData) {
    assert.doesNotMatch(ex.description, /diet position|expander/i, ex.name);
  }
});

test('exercise names share one spelling for push-up, pull-up, chin-up and biceps', () => {
  for (const { name } of exercisesData) {
    assert.doesNotMatch(name, /-Ups?\b|-ups\b/, `${name}: write it as "-up"`);
    assert.doesNotMatch(name, /\bBicep\b/, `${name}: the muscle is the biceps`);
  }
});

test('the detail card names what its sets are made of', () => {
  const byUnit = (unit: string) => {
    const ex = exercisesData.find(item => item.unit === unit);
    assert.ok(ex, `the catalog has no exercise counted in ${unit}`);
    return { ...ex, sets: 3, perSet: [1, 2] as [number, number], rest: 60 };
  };
  assert.equal(volumeLabel(byUnit('reps')), 'Sets and reps');
  assert.equal(volumeLabel(byUnit('seconds')), 'Sets and holds');
});

test('the form and plan carry no gym shorthand', () => {
  const app = read('../src/App.tsx');
  for (const shorthand of ['>Def<', 'Time & Volume', '{m}m', 'Days / Week', '>Volume<']) {
    assert.ok(!app.includes(shorthand), `src/App.tsx still shows ${shorthand}`);
  }
});

test('the page has a full title, link preview tags, a touch icon and a note for visitors without JavaScript', () => {
  const html = read('../index.html');
  assert.match(html, /<title>Repwise: [^<]+<\/title>/);
  for (const property of ['og:title', 'og:description', 'og:image', 'og:url', 'og:type']) {
    assert.ok(html.includes(`property="${property}"`), property);
  }
  assert.ok(html.includes('name="twitter:card"'), 'twitter:card');
  assert.match(html, /<link rel="apple-touch-icon" href="\/apple-touch-icon\.png"/);
  assert.match(html, /<noscript>[\s\S]*JavaScript[\s\S]*<\/noscript>/);

  // Each file the page points at has to be in public/, the only folder that is deployed as it is.
  for (const file of ['social-preview.png', 'apple-touch-icon.png', 'favicon.svg']) {
    assert.ok(html.includes(`/${file}"`), `index.html does not use ${file}`);
    assert.ok(readFileSync(new URL(`../public/${file}`, import.meta.url)).length > 0, file);
  }
});

test('the page takes its address from package.json instead of repeating it', () => {
  const html = read('../index.html');
  const { homepage } = JSON.parse(read('../package.json')) as { homepage: string };
  assert.ok(!html.includes(homepage), 'index.html spells out the site address');
  assert.ok(html.includes('%VITE_SITE_URL%'));
});

test('the app links to its source and licence, and every link that leaves the site is opened safely', () => {
  const app = read('../src/App.tsx');
  const links = app.match(/<a\s[^>]*>/g) ?? [];
  assert.ok(links.length >= 2, 'expected a source link and a licence link');
  for (const link of links) {
    assert.ok(link.includes('target="_blank"') && link.includes('rel="noopener noreferrer"'), link);
  }
  assert.ok(app.includes('import.meta.env.VITE_SOURCE_URL'), 'the source link is not built from package.json');

  // The repository address is written once, in package.json.
  for (const file of ['../src/App.tsx', '../index.html', '../vite.config.ts']) {
    assert.doesNotMatch(read(file), /github\.com/, `${file} spells out the repository address`);
  }
});

test('THIRD_PARTY.md says where every data and component file came from and names every bundled package', () => {
  const notes = read('../THIRD_PARTY.md');
  for (const folder of ['src/data', 'src/components/ui']) {
    for (const file of readdirSync(new URL(`../${folder}`, import.meta.url))) {
      assert.ok(notes.includes(`${folder}/${file}`), `${folder}/${file} has no provenance line`);
    }
  }
  const { dependencies } = JSON.parse(read('../package.json')) as { dependencies: Record<string, string> };
  for (const name of Object.keys(dependencies)) {
    assert.ok(notes.includes(`| ${name} |`), `${name} is bundled but not listed`);
  }
});

test('the README says where the MIT releases end and the AGPL ones begin', () => {
  const licence = read('../README.md').split('## License')[1] ?? '';
  assert.match(licence, /MIT/);
  assert.match(licence, /c749d2c/);
  assert.match(licence, /f3b1d5c/);
});
