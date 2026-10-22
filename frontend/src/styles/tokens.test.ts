/// <reference types="node" />
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

// WCAG 1.4.11: component boundaries (inputs, outline buttons, step markers) need >= 3:1.
const css = readFileSync(resolve(process.cwd(), 'src/styles/globals.css'), 'utf8')


function block(selector: string): string {
  const start = css.indexOf(selector + ' {')
  return css.slice(start, css.indexOf('}', start))
}
function token(scope: string, name: string): string {
  const m = block(scope).match(new RegExp(`--${name}:\\s*([^;]+);`))
  if (!m) throw new Error(`--${name} missing in ${scope}`)
  return m[1].trim()
}
function rgb(value: string): [number[], number] {
  const hex = value.match(/^#([0-9a-f]{6})$/i)
  if (hex) return [[0, 2, 4].map((i) => parseInt(hex[1].slice(i, i + 2), 16)), 1]
  const m = value.match(/rgb\((\d+) (\d+) (\d+) \/ ([\d.]+)\)/)!
  return [[+m[1], +m[2], +m[3]], +m[4]]
}
function luminance(c: number[]): number {
  const [r, g, b] = c.map((v) => v / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}
function contrastOn(fgValue: string, bgHex: string): number {
  const [fg, alpha] = rgb(fgValue)
  const [bg] = rgb(bgHex)
  const mixed = fg.map((v, i) => alpha * v + (1 - alpha) * bg[i])
  const [a, b] = [luminance(mixed), luminance(bg)].sort((x, y) => y - x)
  return (a + 0.05) / (b + 0.05)
}

describe('design tokens', () => {
  for (const scope of [':root', '.dark']) {
    it(`line-strong is a visible boundary on every surface (${scope})`, () => {
      for (const surface of ['cream', 'sand', 'grey']) {
        expect(contrastOn(token(scope, 'line-strong'), token(scope, surface))).toBeGreaterThanOrEqual(3)
      }
    })

    it(`body and muted text meet 4.5:1 (${scope})`, () => {
      for (const surface of ['cream', 'sand', 'grey']) {
        expect(contrastOn(token(scope, 'ink'), token(scope, surface))).toBeGreaterThanOrEqual(4.5)
        expect(contrastOn(token(scope, 'ink-muted'), token(scope, surface))).toBeGreaterThanOrEqual(4.5)
      }
    })
  }
})
