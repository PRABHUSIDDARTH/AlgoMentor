// Checks every LeetCode slug in the roadmap against LeetCode and records its real title,
// difficulty and Premium flag in src/content/roadmap-leetcode.json (committed).
// Run: node scripts/validate-roadmap.mjs   (needs network; ~2 minutes)
import { readFileSync, writeFileSync } from 'node:fs'

const source = JSON.parse(readFileSync(new URL('../src/content/roadmap.source.json', import.meta.url), 'utf8'))
const slugs = source.stages.flatMap((s) => s.patterns.flatMap((p) => p.slugs))
const QUERY = 'query q($s: String!) { question(titleSlug: $s) { title titleSlug difficulty isPaidOnly } }'
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function check(slug, attempt = 1) {
  try {
    const res = await fetch('https://leetcode.com/graphql', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Referer: `https://leetcode.com/problems/${slug}/`, 'User-Agent': 'Mozilla/5.0 (compatible; AlgoMentor roadmap check)' },
      body: JSON.stringify({ query: QUERY, variables: { s: slug } }),
    })
    const q = (await res.json())?.data?.question
    if (!q) return { ok: false, title: null, difficulty: null, paidOnly: false }
    return { ok: q.titleSlug === slug, title: q.title, difficulty: q.difficulty, paidOnly: q.isPaidOnly }
  } catch (e) {
    if (attempt < 3) { await sleep(1500 * attempt); return check(slug, attempt + 1) }
    throw e
  }
}

const problems = {}
for (const [i, slug] of slugs.entries()) {
  problems[slug] = await check(slug)
  if (!problems[slug].ok || problems[slug].paidOnly) console.log('PROBLEM', slug, JSON.stringify(problems[slug]))
  if (i % 50 === 0) console.log(`${i}/${slugs.length}`)
  await sleep(300)
}
const out = { checkedAt: new Date().toISOString(), problems }
writeFileSync(new URL('../src/content/roadmap-leetcode.json', import.meta.url), JSON.stringify(out, null, 1) + '\n')
const bad = Object.entries(problems).filter(([, v]) => !v.ok || v.paidOnly)
console.log(`checked ${slugs.length}, problems: ${bad.length}`)
process.exit(bad.length ? 1 : 0)
