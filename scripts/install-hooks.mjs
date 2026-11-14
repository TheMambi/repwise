// Switches on the pre-commit secret scan for this clone and says what it did.
// With --check it only reports. It never touches a repository that this folder
// merely sits inside, another tool's hooks setting, or hooks already in .git/hooks.
import { execFileSync } from 'node:child_process'
import { existsSync, readdirSync, realpathSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const HOOKS = '.githooks'
const SWITCH_ON = `git config core.hooksPath ${HOOKS}`
const here = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const checkOnly = process.argv.includes('--check')

function git(...args) {
  try {
    return execFileSync('git', args, { cwd: here, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim()
  } catch {
    return null
  }
}

function report() {
  const top = git('rev-parse', '--show-toplevel')
  if (top === null) return 'this folder is not a git checkout, or git is not installed.'
  if (realpathSync(top) !== realpathSync(here)) {
    return `this folder sits inside another repository (${top}), which was left unchanged.`
  }

  const current = git('config', '--get', 'core.hooksPath') ?? ''
  if (current && resolve(here, current) === resolve(here, HOOKS)) return null
  if (current) {
    return `git runs hooks from "${current}" here, and that setting was left unchanged. To use this repo's hook instead: ${SWITCH_ON}`
  }

  const ownHooksDir = resolve(here, git('rev-parse', '--git-path', 'hooks') ?? '.git/hooks')
  const ownHooks = existsSync(ownHooksDir) ? readdirSync(ownHooksDir).filter((name) => !name.endsWith('.sample')) : []
  if (ownHooks.length > 0) {
    return `this clone has its own hooks in .git/hooks (${ownHooks.join(', ')}) and switching would stop them. Move them into ${HOOKS}, then run: ${SWITCH_ON}`
  }

  if (checkOnly) return 'run `npm run prepare` to switch it on.'
  if (git('config', '--local', 'core.hooksPath', HOOKS) === null) return `git refused the setting. Try: ${SWITCH_ON}`
  return null
}

const problem = report()
if (problem === null) {
  console.log(`Pre-commit secret scan is active (git runs ${HOOKS}/pre-commit before each commit).`)
} else {
  console.warn(`WARNING: the pre-commit secret scan is NOT active: ${problem}`)
}
