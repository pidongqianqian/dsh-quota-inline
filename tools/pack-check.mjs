/**
 * Check the publishable tarball shape: every runtime file present, no tests,
 * tools, or node_modules inside. Run with `npm run pack:check`.
 */
import { execFileSync } from 'node:child_process'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

const raw = execFileSync('npm', ['pack', '--dry-run', '--json'], {
  cwd: root,
  encoding: 'utf8',
  stdio: ['ignore', 'pipe', 'ignore'],
})
const [tarball] = JSON.parse(raw)
const files = tarball.files.map((entry) => entry.path).sort()

const required = [
  'CHANGELOG.md',
  'LICENSE',
  'README.md',
  'client.js',
  'cordis.patch.yml',
  'icon.svg',
  'index.js',
  'locale/en.json',
  'locale/zh.json',
  'package.json',
]
const missing = required.filter((path) => !files.includes(path))
if (missing.length > 0) {
  console.error(`pack:check missing files: ${missing.join(', ')}`)
  process.exit(1)
}

const ignored = files.filter((path) => /^(test|tools|node_modules|\.github)\//.test(path))
if (ignored.length > 0) {
  console.error(`pack:check unexpected files: ${ignored.join(', ')}`)
  process.exit(1)
}

console.log(`pack:check ok — ${files.length} files, ${(tarball.size / 1024).toFixed(1)} kB tarball`)
