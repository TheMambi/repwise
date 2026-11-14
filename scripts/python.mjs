// Runs Python under whichever name this machine has. A python.org install on
// Windows provides `python` and `py`, not `python3`.
import { spawnSync } from 'node:child_process'

const probe = ['-c', 'import sys; sys.exit(sys.version_info < (3, 8))']
for (const [command, ...first] of [['python3'], ['python'], ['py', '-3']]) {
  if (spawnSync(command, [...first, ...probe], { stdio: 'ignore' }).status === 0) {
    const run = spawnSync(command, [...first, ...process.argv.slice(2)], { stdio: 'inherit' })
    process.exit(run.status ?? 1)
  }
}
console.error('Python 3.8 or newer is needed and none was found (tried python3, python and py -3).')
process.exit(1)
