# AlgoMentor Practice hub: design spec

Date: 2026-10-22
Status: approved in conversation (§1–§4); written spec for review
Covers sub-projects 1–4 of the expansion. The Learning hub (OOP, Networks, DBMS, Git practice, resume projects) gets its own spec.

## 1. Intent

**What the user asked for:**
- A Settings button fixed in the top-right corner, where users give their LeetCode, HackerRank and GeeksforGeeks profile URLs so the app can read their data.
- A progressive DSA roadmap, with company and role targets, built so concepts are never forgotten.
- A daily checklist.
- Revision based on the user's level.
- A Generate test button: 10 mixed questions, both solved and unsolved.
- A level system showing readiness for a target company and role.
- The GeeksforGeeks DSA plan integrated alongside the others.
- Use Firecrawl to study Striver's A2Z and RisingBrain.

**Decisions made in conversation:**
- **Sheets:** study the sheets' structure and build AlgoMentor's own roadmap, linking back with credit. Their lists, explanations and videos are never copied.
- **Storage:** progress lives in this browser (localStorage) until accounts exist.
- **Themes:** light and dark only. This is already shipped.

**Research findings (Firecrawl and live probes, 2026-10-21):**
- **RisingBrain:** pattern-first, 496 problems, 17 topics (Arrays → Bit Manipulation), each split into named patterns, for example Arrays → Two-Pointer, Sliding Window, Prefix Sum, Kadane.
- **Striver A2Z:** 18 steps, 495 problems. The page renders in the browser and needs sign-in, so the step order comes from its well-known structure: Basics, Sorting, Arrays, Binary Search, Strings, Linked List, Recursion, Bit Manipulation, Stack & Queue, Sliding Window & Two Pointer, Heaps, Greedy, Binary Trees, BST, Graphs, DP, Tries, Strings (advanced).
- **GeeksforGeeks:** a step-by-step tutorial (Fundamentals → Maths/Recursion → … → DP) and **GfG 160**, a 160-day daily programme.
- **Public profile data:**
  - **LeetCode**, from public GraphQL `matchedUser`: solved counts per difficulty, `tagProblemCounts` (solved per topic), ranking, and `recentAcSubmissionList`. That list is the **most recent ~20 accepted problems only**; the full solved list needs the user's session, which we never ask for.
  - **HackerRank:** `/rest/hackers/{u}/badges` returns JSON.
  - **GeeksforGeeks:** the profile page (`/profile/{u}`) embeds `total_problems_solved`, `score`, `institute_rank` and streak fields.

**Done when:**
- Settings connects all three profiles and shows their stats.
- `/roadmap` shows the 18-stage roadmap with progress, locks, company/role weighting and cross-references.
- `/today` builds a daily checklist with reviews and a streak.
- Generate test makes a 10-problem test that runs in the workspace and produces a report.
- The level and readiness % with its top 3 gaps appear for the chosen target.
- Everything works in both themes, at 360–1920px, keyboard-only, with axe clean.
- Profile sites failing or blocking degrades gracefully.

## 2. Site structure

- **App navbar** (all app pages): Logo · Practice (`/app`) · Roadmap (`/roadmap`) · Today (`/today`) · Learn (placeholder, links to the Learning hub when it ships) · and on the right, Jump (Ctrl K) and Theme.
- **Settings button:**
  - a gear icon button, `aria-label="Settings"`
  - **fixed** at the top-right of every page, landing included (`position: fixed; top: 12px; right: 16px; z-index: 50`)
  - it is a single global button, rendered once in `App`, not part of any navbar; every navbar reserves 56px on its right edge so the gear never overlaps it, and on the landing page and app pages it lines up with the nav row
  - it opens a right-hand shadcn `Sheet`
- **New routes** (React Router, forwarded by `SpaController`):
  - `/roadmap`, `/roadmap/:stageId`
  - `/today`
  - `/test/:testId` (the test runner)
  - `/level`

## 3. Settings and profile connections

**Fields:**

| Field | Validation | Stored as |
|---|---|---|
| LeetCode URL | `leetcode.com/u/<user>` or `leetcode.com/<user>` | username |
| HackerRank URL | `hackerrank.com/profile/<user>` or `hackerrank.com/<user>` | username |
| GeeksforGeeks URL | `geeksforgeeks.org/user/<user>` or `/profile/<user>` | username |
| Target company group | FAANG / product · Startup · Service company | id |
| Target role | Intern · SDE-1 · SDE-2 | id |
| Daily goal | 2 · 3 · 5 new problems | number |

The URLs are parsed on the client. An invalid URL shows an inline error naming the expected format.

**Backend `ProfileController`** (new `profiles` package):
- `GET /profiles/leetcode/{user}` returns `{ username, ranking, solved: {easy, medium, hard, total}, topics: [{tag, solved}], recent: [{slug, title, solvedAt}] }`, from LeetCode GraphQL.
- `GET /profiles/hackerrank/{user}` returns `{ username, badges: [{name, stars, level}] }`.
- `GET /profiles/gfg/{user}` returns `{ username, solved, score, instituteRank?, streak? }`, parsed from the embedded JSON in the profile HTML.

**Shared rules for all three:**
- Usernames are validated against `^[A-Za-z0-9_.-]{1,40}$`.
- Results are cached in Caffeine for **6 hours**, keyed per site and user.
- They share the `/problem` rate-limit group.
- **Errors:**
  - 404 means "No public profile found for <user> on <site>."
  - 502 means "Couldn't read <site> right now."
  - A site that changes its format gives 502. It never crashes, and it is never shown as partial data.

**Client:**
- Profiles are stored under `algomentor.profile.v1` as `{ leetcode?, hackerrank?, gfg?, target: {company, role}, dailyGoal }`.
- Stats are cached under `algomentor.stats.v1` as `{ site: {data, fetchedAt} }`.
- Settings shows one card per site with its stats, "Refresh" (re-fetches past the cache) and "Disconnect".

## 4. Roadmap

**Content.** AlgoMentor's own curated data lives in `frontend/src/content/roadmap.ts`, typed:

```ts
type Difficulty = 'Easy' | 'Medium' | 'Hard'
type RoadmapProblem = { id: string; title: string; difficulty: Difficulty; source: 'leetcode' | 'gfg'; slug?: string; url: string }
type Pattern = { id: string; title: string; idea: string; problems: RoadmapProblem[]; seeAlso: { striver?: string; risingbrain?: string; gfg160?: string } }
type Stage = { id: string; order: number; title: string; summary: string; concepts: string[]; patterns: Pattern[]; leetcodeTags: string[] }
```

- **18 stages**, in the order approved in §2:
  1. Complexity & maths basics
  2. Arrays
  3. Hashing
  4. Strings
  5. Sorting & binary search
  6. Recursion & backtracking basics
  7. Linked lists
  8. Stacks & queues
  9. Sliding window
  10. Trees
  11. BST
  12. Heaps
  13. Greedy & intervals
  14. Graphs
  15. Dynamic programming (1D → 2D → strings → knapsack → intervals)
  16. Tries
  17. Bit manipulation
  18. Mixed interview sets
- **Patterns:** 3–8 per stage, with 3–6 problems each, **about 300 problems in total**, ordered Easy → Medium → Hard within a pattern.
- **Problems:** mostly LeetCode, plus a few GeeksforGeeks ones where GfG's version teaches the idea better.
- **Original wording:** the `idea` text (one or two sentences per pattern) and stage summaries are written by us.
- **Cross-references:** `seeAlso` holds labels only, for example `"Step 3.2"`, `"Sliding Window"` or `"Week 2"`. Each is shown as a link to that sheet's public home page.
- **Validation:** a build-time check confirms every LeetCode slug resolves, via a script run manually against LeetCode with its results committed. A unit test enforces the structure: unique IDs, counts within range, and a Hard problem never placed before an Easy one within a pattern.

**Progress.** Stored under `algomentor.progress.v1`: `{ [problemId]: { status: 'solved' | 'attempted', firstSolvedAt, lastReviewedAt, reviewStep: 0..5, nextReviewAt } }`.
- A problem counts as solved when:
  - "I solved it" is clicked in the workspace for a roadmap problem (the workspace knows the problem's roadmap ID when it was opened from the roadmap), or
  - it's ticked in the roadmap, or
  - its slug appears in the connected LeetCode account's recent accepted problems. This sync runs on each refresh.
- **Stage completion:** `solved in stage / problems in stage`.
- **Stage unlock:** a stage unlocks when the previous stage reaches 70% or more. "Unlock anyway" is always available and records `unlockedManually`.
- **Prior-knowledge assist:** when a stage's LeetCode tags already show ≥ 15 solved problems in total, its card offers "Mark this stage as known". This sets problems to `solved` with no review schedule, until a test proves otherwise.

**Company and role weighting.** Each `target` maps to per-stage weights from 0 to 3, in `frontend/src/content/targets.ts`. Weights:
- reorder the "Up next" suggestions,
- feed the readiness score (§7), and
- show a "Key for <target>" label as plain text, not a badge.

| Stage group | FAANG / product | Startup | Service company |
|---|---|---|---|
| Fundamentals (1–5) | 2 | 3 | 3 |
| Lists, stacks, sliding window (7–9) | 3 | 3 | 2 |
| Trees, BST, heaps (10–12) | 3 | 2 | 1 |
| Graphs, DP (14–15) | 3 | 2 | 1 |
| Tries, bits (16–17) | 2 | 1 | 1 |

Role multipliers: Intern 0.8, SDE-1 1.0, SDE-2 1.2. The multiplier sets the Hard-problem expectation in §7.

**UI:**
- `/roadmap` is a vertical progression of 18 stage cards, each showing title, summary, progress bar, lock state and target label, connected by a thin line, with the current stage highlighted in sage.
- `/roadmap/:stageId` lists concepts, then patterns, each with its idea, problems as rows (title · difficulty · status · "Solve" opening `/app?q=<slug>&from=<problemId>`), and the "Also in" cross-references.
- GfG problems open GfG in a new tab, plus "Paste statement in AlgoMentor".

## 5. Spaced repetition

- **Schedule:** after the first solve, reviews fall due after **1, 3, 7, 21 and 60 days**, the intervals for `reviewStep` 0 to 4. After step 4 the problem is "mastered".
- **Review outcomes:**
  - "Solved again without hints" advances one step.
  - "Needed hints / couldn't" resets to step 0 (due tomorrow).
- **Where outcomes come from:** the review flow in the workspace, using hints used since opening it as the signal, or a manual choice on the Today page.

## 6. Today and Generate test

**Today** (`/today`) is generated once per local date and stored under `algomentor.daily.v1` as `{ [YYYY-MM-DD]: { items, completedIds } }`. Items, in order:
1. **New:** `dailyGoal` problems. These are the next unsolved problems of the current stage, with ties broken by target weight. "Current stage" means the first unlocked stage below 100%.
2. **Reviews due** (`nextReviewAt ≤ end of today`), capped at 5, oldest first. Anything beyond the cap rolls over.
3. **Concept refresher:** one concept from a completed stage, shown as a short card with its pattern idea and "Open a problem".

The page also shows:
- a **streak**, counted on days where every New item was ticked
- a **calendar strip** of the last 14 days
- a "Generate test" button

Items tick automatically from roadmap progress events, or by hand.

**Generate test** creates `{ id, createdAt, problems: 10 × {problemId, kind: 'revision' | 'new'}, durationMin: 60 }`, stored under `algomentor.tests.v1`.
- **Mix:** 3 revision problems (solved before, preferring the lowest review step) and 7 new ones (unsolved, from unlocked stages).
- **Difficulty for the level** (§7):
  - L1–3: 6 Easy / 4 Medium
  - L4–6: 3 / 6 / 1 (Easy / Medium / Hard)
  - L7–10: 1 / 6 / 3
- **No more than 3 problems from any one stage.**
- **Shuffling:** uses a seeded RNG (the seed is stored), so a test is reproducible.
- **Short pools:** if a pool is short, the other pool fills the gap. With fewer than 10 problems available in total, the button explains why it can't build a test.

**Test runner** `/test/:id`:
- **Layout:** a left rail with the 10 problems and their states; the workspace panes for the selected problem; a countdown timer.
- **Per problem:** "Mark solved" and "Skip". Hints remain available, and each hint used is recorded.
- **Finish:** a report with score (solved without hints = 1, with hints = 0.5), time, per-stage results and weak stages. Missed revision problems reset their review step, and weak stages get one extra review each in the next 3 days.

## 7. Level and readiness

**Level (1–10)** comes from a 0–100 score:

| Component | Weight | Measure |
|---|---|---|
| Coverage | 35 | Target-weighted % of roadmap solved |
| Difficulty | 20 | Medium and Hard share of solved problems, against the target's expectation (Hard ≥ 10% × role multiplier) |
| Retention | 15 | Share of due reviews passed in the last 30 days |
| Tests | 15 | Mean of the last 3 test scores |
| Consistency | 10 | Active days in the last 14 |
| External | 5 | Connected LeetCode solved total, capped at 400 |

**Score to level:**

| Score | Level |
|---|---|
| < 8 | 1 |
| 8–14 | 2 |
| 15–23 | 3 |
| 24–33 | 4 |
| 34–43 | 5 |
| 44–53 | 6 |
| 54–63 | 7 |
| 64–74 | 8 |
| 75–86 | 9 |
| ≥ 87 | 10 |

**Readiness for a target** = score ÷ the target's bar, capped at 100%. The bars:

| Target | Bar |
|---|---|
| FAANG / product, SDE-1 | 80 |
| FAANG / product, Intern | 65 |
| FAANG / product, SDE-2 | 90 |
| Startup | 65 / 55 / 75 (SDE-1 / Intern / SDE-2) |
| Service company | 50 / 40 / 60 (SDE-1 / Intern / SDE-2) |

**Top 3 gaps:** the components with the largest weighted shortfall, each turned into a concrete action ("Graphs: solve 6 more Medium", "Pass 4 more reviews this week", "Take a test"). `/level` shows the level, a readiness meter, the gaps and a component breakdown. A level-up shows one short, calm message.

## 8. Errors, accessibility, testing

**Errors:**
- Profile fetch errors appear inline on that card and never block the roadmap.
- Corrupted storage under any `.v1` key is ignored and treated as empty, using the same pattern as `history.ts` (strict field checks).
- An error boundary already covers crashes.

**Accessibility:**
- The roadmap is a list of links with progress given as text ("6 of 18 solved").
- Locks are announced.
- The timer has an `aria-live` update every minute only.
- axe runs on every new route in both themes.

**Testing:**
- **Unit (Vitest):**
  - URL parsing per site
  - spaced-repetition scheduling
  - daily plan generation (fixed clock)
  - test generation (fixed seed: mix, difficulty, ≤ 3 per stage, short-pool fallback)
  - level and readiness maths (table-driven)
  - storage validation
  - the roadmap content structure test
- **Backend (JUnit):**
  - each profile client against `MockRestServiceServer`, with a fixture of each site's real response shape
  - controller validation and caching
- **e2e (Playwright,** `e2e` profile with stub profile clients**):**
  - connect a LeetCode URL in Settings and see its stats
  - roadmap → stage → Solve → "I solved it" → progress updates
  - Today ticks and the streak
  - Generate test → finish → report
  - the level page shows gaps
  - axe on all new routes

## 9. Out of scope

- Accounts and cross-device sync.
- Reading private LeetCode data, such as the full solved list or submissions.
- Company-specific question banks.
- Notifications and reminders.
- The Learning hub (separate spec).
