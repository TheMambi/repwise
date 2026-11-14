// Runs scripts/install-hooks.mjs in throwaway folders, never in this clone.
import assert from 'node:assert/strict'
import { execFileSync, spawnSync } from 'node:child_process'
import { copyFileSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'

const SCRIPT = fileURLToPath(new URL('../scripts/install-hooks.mjs', import.meta.url))
const env = { ...process.env, GIT_CONFIG_GLOBAL: '/dev/null', GIT_CONFIG_NOSYSTEM: '1' }

function git(cwd, ...args) {
  const run = spawnSync('git', args, { cwd, env, encoding: 'utf8' })
  return run.stdout.trim()
}

// A copy of the package folder at `path`, with or without a repository of its own.
function packageAt(t, path, { repo = true } = {}) {
  const base = mkdtempSync(join(tmpdir(), 'hooks-'))
  t.after(() => rmSync(base, { recursive: true, force: true }))
  const dir = join(base, path)
  mkdirSync(join(dir, 'scripts'), { recursive: true })
  copyFileSync(SCRIPT, join(dir, 'scripts', 'install-hooks.mjs'))
  if (repo) execFileSync('git', ['init', '-q'], { cwd: dir, env })
  return { base, dir }
}

function run(dir, ...args) {
  const result = spawnSync(process.execPath, [join(dir, 'scripts', 'install-hooks.mjs'), ...args], {
    cwd: dir, env: { ...env, GIT_CEILING_DIRECTORIES: tmpdir() }, encoding: 'utf8',
  })
  return { status: result.status, output: result.stdout + result.stderr }
}

test('a fresh clone gets the hook and is told so', (t) => {
  const { dir } = packageAt(t, 'repwise')
  const first = run(dir)
  assert.equal(first.status, 0)
  assert.match(first.output, /secret scan is active/)
  assert.equal(git(dir, 'config', '--get', 'core.hooksPath'), '.githooks')
  assert.match(run(dir, '--check').output, /secret scan is active/)
})

test('the check reports a missing hook and changes nothing', (t) => {
  const { dir } = packageAt(t, 'repwise')
  const result = run(dir, '--check')
  assert.equal(result.status, 0)
  assert.match(result.output, /NOT active/)
  assert.equal(git(dir, 'config', '--get', 'core.hooksPath'), '')
})

test('a folder that is not a git checkout is told the hook is off', (t) => {
  const { dir } = packageAt(t, 'zip-download', { repo: false })
  const result = run(dir)
  assert.equal(result.status, 0)
  assert.match(result.output, /NOT active.*not a git checkout/)
})

test('an outer repository is left unchanged', (t) => {
  const { base, dir } = packageAt(t, 'outer/vendor/repwise', { repo: false })
  const outer = join(base, 'outer')
  execFileSync('git', ['init', '-q'], { cwd: outer, env })
  const result = run(dir)
  assert.equal(result.status, 0)
  assert.match(result.output, /NOT active.*inside another repository/)
  assert.equal(git(outer, 'config', '--get', 'core.hooksPath'), '')
})

test('a hooks setting from another tool is left unchanged', (t) => {
  const { dir } = packageAt(t, 'repwise')
  git(dir, 'config', 'core.hooksPath', '.husky/_')
  const result = run(dir)
  assert.equal(result.status, 0)
  assert.match(result.output, /NOT active.*\.husky\/_/)
  assert.equal(git(dir, 'config', '--get', 'core.hooksPath'), '.husky/_')
})

test('hooks already in .git/hooks are not switched off', (t) => {
  const { dir } = packageAt(t, 'repwise')
  writeFileSync(join(dir, '.git', 'hooks', 'pre-commit'), '#!/bin/sh\nexit 1\n', { mode: 0o755 })
  const result = run(dir)
  assert.equal(result.status, 0)
  assert.match(result.output, /NOT active.*pre-commit/)
  assert.equal(git(dir, 'config', '--get', 'core.hooksPath'), '')
})
