// Writes each OOP module's Java, Python and C++ samples to <out>/<module-id>/ so they can be compiled.
// Needs Node 23.6+ (runs the TypeScript content files with type stripping).
import { mkdirSync, readdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'

const out = process.argv[2]
const dir = new URL('../frontend/src/content/learn/oop/', import.meta.url)
const files = readdirSync(dir).filter((f) => /^\d\d-.+\.ts$/.test(f)).sort()
if (!files.length) throw new Error('no OOP module files found')
for (const f of files) {
  const lesson = (await import(pathToFileURL(join(dir.pathname, f)).href)).default
  if (!lesson?.code) throw new Error(`${f} has no code samples`)
  const d = join(out, lesson.id)
  mkdirSync(d, { recursive: true })
  const javaName = lesson.code.java.match(/^public\s+(?:(?:abstract|final|sealed)\s+)*(?:class|interface|enum|record)\s+(\w+)/m)?.[1] ?? 'Snippet'
  writeFileSync(join(d, `${javaName}.java`), lesson.code.java)
  writeFileSync(join(d, 'snippet.py'), lesson.code.python)
  writeFileSync(join(d, 'snippet.cpp'), lesson.code.cpp)
  console.log(`${lesson.id}: ${javaName}.java, snippet.py, snippet.cpp`)
}
