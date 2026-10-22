# AlgoMentor Practice Hub Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add profile connections (LeetCode, HackerRank, GeeksforGeeks), an 18-stage progressive DSA roadmap with company/role weighting, spaced-repetition reviews, a daily checklist, generated 10-problem tests and a level/readiness page.

**Architecture:**
- **Backend:** a new `profiles` package that reads public profile data server-side and caches it.
- **Frontend:** everything else, with progress in localStorage.
- **Pure logic in `src/practice/`**, unit-tested, with no React: scheduling, daily plan, test generation, scoring.
- **Content:** the roadmap and targets are static typed data in `src/content/`.
- **Pages:** new routes `/roadmap`, `/roadmap/:stageId`, `/today`, `/test/:testId` and `/level`, plus one global fixed Settings button.

**Tech Stack:** Spring Boot 4 (RestClient, Caffeine, jsoup), React 19 + TypeScript, React Router, shadcn/ui, Motion, Vitest, Playwright + axe. These are the existing libraries; no new runtime dependencies.

**Spec:** `docs/superpowers/specs/2026-10-22-practice-hub-design.md`

## Global Constraints

- **Storage keys,** each strictly validated on read, with invalid data treated as empty:
  - `algomentor.profile.v1`
  - `algomentor.stats.v1`
  - `algomentor.progress.v1`
  - `algomentor.daily.v1`
  - `algomentor.tests.v1`
- **Usernames** match `^[A-Za-z0-9_.-]{1,40}$`. Profile cache: 6 hours. Profile endpoints share the `/problem` rate-limit group.
- **Review intervals:** 1, 3, 7, 21, 60 days, for `reviewStep` 0 to 4. After step 4 the problem is mastered (`nextReviewAt` null).
- **Unlock:** a stage unlocks when the previous stage is ≥ 70% solved, or by manual unlock. Prior-knowledge assist appears at ≥ 15 solved across the stage's LeetCode tags.
- **Daily plan:**
  - `dailyGoal` ∈ {2, 3, 5} new problems
  - reviews due capped at 5, oldest first
  - 1 concept refresher
  - keyed by **local** `YYYY-MM-DD`
- **Test:**
  - 10 problems: 3 revision and 7 new, with the other pool filling a short one
  - at most 3 per stage
  - difficulty mix by level: L1–3 6E/4M; L4–6 3E/6M/1H; L7–10 1E/6M/3H
  - seeded RNG, 60 minutes
  - score: 1 if solved without hints, 0.5 with hints
- **Level score weights:** Coverage 35, Difficulty 20, Retention 15, Tests 15, Consistency 10, External 5 (LeetCode solved capped at 400).
- **Level thresholds:** <8 → L1, 8 → L2, 15 → L3, 24 → L4, 34 → L5, 44 → L6, 54 → L7, 64 → L8, 75 → L9, 87 → L10.
- **Readiness bars:**

  | Company group | SDE-1 | Intern | SDE-2 |
  |---|---|---|---|
  | FAANG/product | 80 | 65 | 90 |
  | Startup | 65 | 55 | 75 |
  | Service | 50 | 40 | 60 |

  Role multipliers for the Hard expectation: Intern 0.8, SDE-1 1.0, SDE-2 1.2.
- **Target stage weights (0–3):** the table in spec §4.
- **UI rules from Phase 1:** palette tokens only, no emoji, no pills or badges except buttons, metadata joined with " · ", one sage primary button per view, both themes, 360–1920px, axe clean.
- **Commits** end with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Review Focus

1. **The local date rolls over while the Today page is open** (23:59 → 00:01), or DST shifts the clock. Tomorrow's plan is built on the next render or refresh, and yesterday's ticks stay in yesterday's record (Task 6 test `buildsANewPlanAfterMidnight`).
2. **Roadmap content changes after users have progress** (a problem ID removed or renamed). Unknown IDs in `algomentor.progress.v1` are ignored, with no crash and no NaN percentages (Task 4 test `ignoresUnknownProblemIds`).
3. **Messy profile URLs:** trailing slashes, `?tab=…`, `www.`, uppercase or `/u/` variants. They parse to the same username, and anything else gets a clear format error (Task 2 test `parsesProfileUrlVariants`).
4. **A brand-new user presses Generate test** with nothing solved and only stage 1 unlocked. The button explains the minimum instead of building a broken or empty test (Task 7 test `explainsWhenTooFewProblems`).
5. **A profile site returns a bot-check HTML page or changes its JSON.** The endpoint returns 502 with a message, never a partial object or a 500 (Task 1 tests `htmlChallengeIsBadGateway`, `unexpectedShapeIsBadGateway`).

---

### Task 1: Backend profile clients and endpoints

**Files:**
- Create in `src/main/java/com/pstech/algomentor/profiles/`:
  - `ProfileClient.java` (interface)
  - `LeetCodeProfileClient.java`
  - `HackerRankProfileClient.java`
  - `GfgProfileClient.java`
  - `ProfileController.java`
  - `ProfilesConfig.java`
  - `Profiles.java` (records)
- Create: `src/main/java/com/pstech/algomentor/e2e/StubProfilesConfig.java`
- Modify: `WebConfig.java` (add `/profiles/**` to `problemGuard`), `HtmlNoCacheFilter` (unchanged)
- Test:
  - `src/test/java/com/pstech/algomentor/profiles/{LeetCodeProfileClientTests,HackerRankProfileClientTests,GfgProfileClientTests,ProfileControllerTests}.java`
  - fixtures in `src/test/resources/profiles/{leetcode.json,hackerrank.json,gfg.html}`

**Interfaces:**
- Produces:
  - `record LeetCodeProfile(String username, Integer ranking, Solved solved, List<TopicCount> topics, List<RecentSolve> recent)`, with `record Solved(int easy, int medium, int hard, int total)`, `record TopicCount(String tag, int solved)`, `record RecentSolve(String slug, String title, long solvedAt)`
  - `record HackerRankProfile(String username, List<Badge> badges)`, with `record Badge(String name, int stars, String level)`
  - `record GfgProfile(String username, int solved, int score, Integer instituteRank, Integer streak)`
  - `GET /profiles/leetcode/{user}`, `/profiles/hackerrank/{user}`, `/profiles/gfg/{user}` return those records as JSON
  - **Errors** (`{error}`): 400 for an invalid username; 404 "No public profile found for <user> on <Site>."; 502 "Couldn't read <Site> right now."
  - Profile clients are `@Profile("!e2e")`. `StubProfilesConfig` (`@Profile("e2e")`) returns a fixed profile for username `demo` and 404 otherwise.

- [ ] **Step 1: Capture real response shapes as fixtures.**
  - `leetcode.json`: a trimmed real GraphQL response for `matchedUser` plus `recentAcSubmissionList`. The query is exactly the one probed on 2026-10-21, which includes `tagProblemCounts` fundamental, intermediate and advanced.
  - `hackerrank.json`: a badges response with 2 badges.
  - `gfg.html`: a trimmed profile page keeping the embedded JSON that contains `total_problems_solved`, `score`, `institute_rank` and `pod_solved_longest_streak`.
- [ ] **Step 2: Write failing tests:**
  - `LeetCodeProfileClientTests`:
    - `mapsProfile`: solved easy/medium/hard/total; topics merged across the three tiers, sorted by solved descending; recent with slug and epoch seconds
    - `nullMatchedUserIsNotFound`
    - `htmlChallengeIsBadGateway` (body `<html>…`, content type text/html)
    - `unexpectedShapeIsBadGateway` (`{"data":{"matchedUser":{"submitStatsGlobal":null}}}`)
  - `HackerRankProfileClientTests`: `mapsBadges`, `statusFalseIsNotFound`, `htmlChallengeIsBadGateway`
  - `GfgProfileClientTests`:
    - `parsesEmbeddedJson`
    - `missingFieldsIsBadGateway`
    - `notFoundPageIsNotFound` (HTTP 404, or a page without the user data)
  - `ProfileControllerTests` (MockMvc, clients mocked):
    - `rejectsInvalidUsername` (`a b`, 41 characters) gives 400
    - `cachesForSixHours` (two calls give one client call)
    - `sharesProblemRateLimit` (the 21st call in a minute gives 429)
- [ ] **Step 3: Run** `env -u GEMINI_API_KEY ./mvnw -B -q test -Dtest='*Profile*Tests' -Dskip.npm`. Expected: FAIL (classes missing).
- [ ] **Step 4: Implement.**
  - **Shared client setup:** each client builds its `RestClient` like `LeetCodeConfig` (JDK client, 5s connect, 20s read, browser-like User-Agent) and reads bodies as `String`, parsed with `JsonMapper.shared()`, because sites mislabel content types.
  - **LeetCode:** GraphQL POST to `https://leetcode.com/graphql` with a `Referer`.
  - **HackerRank:** GET `https://www.hackerrank.com/rest/hackers/{u}/badges`. `status:false` or an empty user means not found.
  - **GfG:** GET `https://www.geeksforgeeks.org/user/{u}/`, following the redirect to `/profile/{u}`. Find the embedded JSON with jsoup by searching `script` text for `"total_problems_solved"`, then extract fields with a regex over the escaped JSON (`\\"total_problems_solved\\":(\d+)`).
  - **Caching:** Caffeine `expireAfterWrite(6h)`, keyed `site:user.toLowerCase()`.
- [ ] **Step 5: Run** `.superpowers/sdd/2026-10-22-practice-hub/be-test.sh` (recreate the Phase 1 helper in this plan's workspace). Expected: all backend tests pass.
- [ ] **Step 6: Commit** `feat(api): read public LeetCode, HackerRank and GfG profiles`.

### Task 2: Settings, profile storage and the global Settings button

**Files:**
- Create: `frontend/src/practice/profileUrls.ts`, `frontend/src/practice/store.ts`, `frontend/src/components/settings/{SettingsButton,SettingsSheet,ProfileCard}.tsx`
- Modify:
  - `frontend/src/lib/api.ts` (add `fetchProfile`)
  - `frontend/src/App.tsx` (render `<SettingsButton/>` once; add routes)
  - `frontend/src/components/workspace/AppNav.tsx` (links Practice, Roadmap, Today, Learn; reserve `pr-14`)
  - `frontend/src/components/landing/Nav.tsx` (reserve `pr-14`)
  - `src/main/java/com/pstech/algomentor/web/SpaController.java` and its test (forward `/roadmap/**`, `/today`, `/test/**`, `/level`, `/learn/**`)
- Test:
  - `frontend/src/practice/profileUrls.test.ts`
  - `frontend/src/practice/store.test.ts`
  - `frontend/src/components/settings/SettingsSheet.test.tsx`
  - `SpaControllerTests.forwardsPracticeRoutes`

**Interfaces:**
- Produces:
  - `type Site = 'leetcode' | 'hackerrank' | 'gfg'`
  - `parseProfileUrl(site: Site, input: string): { username: string } | { error: string }`. The error text names the expected format, e.g. "Use a link like leetcode.com/u/yourname".
  - `type Target = { company: 'faang' | 'startup' | 'service'; role: 'intern' | 'sde1' | 'sde2' }`
  - `type ProfileSettings = { leetcode?: string; hackerrank?: string; gfg?: string; target: Target; dailyGoal: 2 | 3 | 5 }`; the default is `{ target: { company: 'faang', role: 'sde1' }, dailyGoal: 3 }`
  - `loadSettings(): ProfileSettings`, `saveSettings(s: ProfileSettings): void`
  - `loadStats(): Partial<Record<Site, { data: unknown; fetchedAt: number }>>`, `saveStats(site, data): void`
  - `fetchProfile(site: Site, user: string, signal?): Promise<LeetCodeProfile | HackerRankProfile | GfgProfile>` (TS mirrors of the Task 1 records)
  - `useSettings()`: a hook returning `[settings, update]`, subscribed to a window `algomentor:settings` event so every page sees changes
  - `<SettingsButton />`: fixed `top-3 right-4 z-50`, `aria-label="Settings"`, a gear icon; opens `<SettingsSheet/>`

- [ ] **Step 1: Write failing tests:**
  - `parsesProfileUrlVariants`:
    - LeetCode: `https://leetcode.com/u/Lee215/`, `leetcode.com/lee215?tab=x` and `www.leetcode.com/u/lee215` all give `lee215`, case preserved but trimmed
    - HackerRank: `hackerrank.com/profile/abc` and `www.hackerrank.com/abc`
    - GfG: `geeksforgeeks.org/user/x/` and `geeksforgeeks.org/profile/x`
    - `https://evil.com/u/x` and a bare `not a url` both give `{error}`
  - `store`:
    - `defaultsWhenEmpty`
    - `rejectsInvalidStoredSettings` (a `dailyGoal: 7` or unknown company falls back to the default)
    - `saveEmitsSettingsEvent`
  - `SettingsSheet`:
    - `opensFromFixedGear` (the button is in the document with class `fixed`, and clicking it opens a dialog named "Settings")
    - `invalidUrlShowsFormat`
    - `connectShowsStats` (mocked `fetchProfile` shows "312 solved · 140 Easy · 150 Medium · 22 Hard")
    - `profileErrorShowsOnCard` (404 message)
    - `targetAndGoalPersist`
    - `refreshBypassesCachedStats`
  - `SpaControllerTests.forwardsPracticeRoutes`: `/roadmap`, `/roadmap/arrays`, `/today`, `/test/abc`, `/level` and `/learn/oop` forward to `/index.html`
- [ ] **Step 2: Run** `cd frontend && npx vitest run src/practice src/components/settings`, plus `-Dtest=SpaControllerTests`. Expected: FAIL.
- [ ] **Step 3: Implement.**
  - The Sheet has sections:
    - **Profiles:** three URL fields, each with a Connect button and a stats card
    - **Target:** company and role, as shadcn `Tabs`-style segmented buttons
    - **Daily goal**
  - Stats come from the cache when fresh (< 6h); "Refresh" always fetches.
  - Add `/roadmap`, `/today`, `/test/:testId` and `/level` routes, rendering placeholder pages until their tasks land. Lazy-load them.
- [ ] **Step 4: Run** the full suite helpers (`be-test.sh`, `fe-test.sh`). Expected: all pass.
- [ ] **Step 5: Commit** `feat(frontend): settings with profile connections and target`.

### Task 3: Roadmap content and targets

**Files:**
- Create:
  - `frontend/src/content/roadmap.ts`
  - `frontend/src/content/targets.ts`
  - `frontend/scripts/validate-roadmap.mjs`
  - `frontend/src/content/roadmap-validation.json` (the script's committed output)
- Test: `frontend/src/content/roadmap.test.ts`

**Interfaces:**
- Produces:
  - the types in spec §4: `Difficulty`, `RoadmapProblem`, `Pattern`, `Stage`
  - `export const STAGES: Stage[]` (18, ordered)
  - `export const PROBLEMS: Map<string, { problem: RoadmapProblem; stageId: string; patternId: string }>`
  - `export const TARGET_WEIGHTS: Record<Target['company'], Record<string /* stageId */, 0 | 1 | 2 | 3>>`
  - `export const ROLE_MULTIPLIER: Record<Target['role'], number>`
  - `export const READINESS_BAR: Record<Target['company'], Record<Target['role'], number>>`

- [ ] **Step 1: Write failing tests** in `roadmap.test.ts`:
  - `has18OrderedStages`
  - `uniqueIds` (stage, pattern and problem IDs)
  - `patternSizes` (3–8 patterns per stage, 3–6 problems per pattern)
  - `totalAbout300` (between 270 and 330)
  - `easyBeforeHardWithinPattern` (no Hard appears before any Easy in a pattern)
  - `leetcodeProblemsHaveSlugAndUrl` (`url` is `https://leetcode.com/problems/<slug>/`)
  - `everyPatternHasOriginalIdea` (10–220 characters, and not equal to any title)
  - `weightsCoverEveryStage`
  - `validationFileCoversEverySlugAndAllResolved` (every LeetCode slug appears in `roadmap-validation.json` with `ok: true`)
- [ ] **Step 2: Run** `npx vitest run src/content`. Expected: FAIL.
- [ ] **Step 3: Write the content.**
  - Follow the stage order and titles in spec §4, and the stage→pattern breakdown informed by the research (RisingBrain patterns, Striver steps, GfG steps).
  - Choose well-known LeetCode problems per pattern. Write every `idea` and `summary` yourself.
  - `seeAlso` holds labels only.
  - `targets.ts` encodes the spec §4 table (each stage group's weight applied to each stage in the group), with Stage 6 Recursion at weight 2 in all groups and Stage 13 Greedy at 2 / 2 / 1, plus the role multipliers and the readiness bars from Global Constraints.
- [ ] **Step 4: Write `validate-roadmap.mjs`.**
  - For each LeetCode slug, POST to LeetCode GraphQL `question(titleSlug)` with a 300ms delay between calls.
  - Write `{ checkedAt, results: { [slug]: { ok, title } } }` to `roadmap-validation.json`.
  - Run it: `node scripts/validate-roadmap.mjs`.
  - Fix any slug that fails, or whose title differs from ours in more than case or punctuation, then re-run until everything is `ok`.
- [ ] **Step 5: Run** `npx vitest run src/content`. Expected: PASS.
- [ ] **Step 6: Commit** `feat(content): 18-stage DSA roadmap and target weights`.

### Task 4: Progress, spaced repetition and LeetCode sync

**Files:**
- Create: `frontend/src/practice/progress.ts`, `frontend/src/practice/schedule.ts`
- Modify:
  - `frontend/src/state/useMentorSession.ts`: accept an optional `roadmapProblemId`, and on `markSolved` call `recordSolve(id, { hintsUsed })`
  - `frontend/src/pages/Workspace.tsx`: read `?from=` and pass it
- Test: `frontend/src/practice/{progress,schedule}.test.ts`, plus one test added to `useMentorSession.test.tsx`

**Interfaces:**
- Consumes: `PROBLEMS`, `STAGES` (Task 3); `loadStats` (Task 2)
- Produces:
  - `type ProblemProgress = { status: 'solved' | 'attempted'; firstSolvedAt?: number; lastReviewedAt?: number; reviewStep: 0..5; nextReviewAt: number | null; known?: boolean }`
  - `loadProgress(): Record<string, ProblemProgress>`, which drops unknown IDs and invalid records
  - `recordSolve(id, { hintsUsed: number, now?: number }): void`
    - first solve: step 0, next review = now + 1 day
    - review passed with no hints: step + 1, with the interval for the new step
    - review failed or hints used: step 0, next review = tomorrow
  - `markStageKnown(stageId)`
  - `unlockStage(stageId)`
  - `syncFromLeetCode(recent: RecentSolve[]): number` (count newly solved)
  - `REVIEW_DAYS = [1, 3, 7, 21, 60]`
  - `nextReviewAt(step, from): number | null`
  - `stageCompletion(stageId, progress): { solved: number; total: number; ratio: number }`
  - `isUnlocked(stageId, progress, manual): boolean`
  - `progressEvents`, a window `algomentor:progress` event emitted on every change

- [ ] **Step 1: Write failing tests:**
  - `schedule`:
    - `firstSolveDueTomorrow`
    - `intervalsFollow1_3_7_21_60`
    - `masteredAfterStep4` (`nextReviewAt` null)
    - `hintsResetToStep0`
  - `progress`:
    - `ignoresUnknownProblemIds` (stored `{ "gone-id": … }` gives no entry, and `stageCompletion` ratio is never NaN)
    - `stage1AlwaysUnlocked`
    - `unlocksAt70Percent` (69% locked, 70% unlocked)
    - `manualUnlockRecorded`
    - `markStageKnownHasNoReviews`
    - `syncFromLeetCodeMarksMatchingSlugs` (unknown slugs ignored, returns the count)
    - `emitsProgressEvent`
  - `useMentorSession`: `markSolvedRecordsRoadmapProgress` (opened with `roadmapProblemId: 'two-sum'` and 1 hint, so progress has status `solved`, step 0)
- [ ] **Step 2: Run** `npx vitest run src/practice src/state`. Expected: FAIL.
- [ ] **Step 3: Implement** with strict validation, like `history.ts`. Days are local calendar days: due "by end of the local day".
- [ ] **Step 4: Run** `fe-test.sh`. Expected: PASS.
- [ ] **Step 5: Commit** `feat(practice): progress store, spaced repetition, LeetCode sync`.

### Task 5: Roadmap pages

**Files:**
- Create:
  - `frontend/src/pages/Roadmap.tsx`
  - `frontend/src/pages/RoadmapStage.tsx`
  - `frontend/src/components/practice/{StageCard,PatternBlock,ProblemRow,ProgressBar}.tsx`
- Test: `frontend/src/pages/Roadmap.test.tsx`

**Interfaces:**
- Consumes: Task 3 content; Task 4 `loadProgress`, `stageCompletion`, `isUnlocked`, `unlockStage`, `markStageKnown`, `progressEvents`; Task 2 `useSettings`, `loadStats`
- Produces:
  - `useProgress()`: a hook returning live progress, subscribed to `progressEvents`. It's reused by Tasks 6–8.
  - Problem row "Solve" links to `/app?q=<slug>&from=<problemId>`.

- [ ] **Step 1: Write failing tests:**
  - `listsAll18StagesWithProgressText` ("0 of 17 solved" style text)
  - `lockedStageShowsUnlockAnyway`
  - `currentStageHighlighted` (`aria-current="step"`)
  - `targetLabelForKeyStages` (for FAANG, Graphs shows "Key for FAANG / product")
  - `stagePageListsPatternsAndProblems`
  - `solveLinkCarriesFrom`
  - `tickingAProblemUpdatesProgress`
  - `gfgProblemOpensExternally` (`target="_blank" rel="noopener noreferrer"`)
  - `seeAlsoShowsCrossReferences`
  - `priorKnowledgeOfferedAt15TagSolves`
- [ ] **Step 2: Run** `npx vitest run src/pages/Roadmap.test.tsx`. Expected: FAIL.
- [ ] **Step 3: Implement per spec §4 UI.**
  - **Layout:** the app shell is shared with `/app`, using the same `AppNav` and full-height layout.
  - **Roadmap list:** a vertical line connects the stage cards, with `AnimatedContent` reveals.
  - **Stage page:** problem rows are plain-text metadata with a 1–3 segment difficulty marker, reusing `DifficultyMarker`.
- [ ] **Step 4: Run** `fe-test.sh`. Expected: PASS. Then take screenshots at 1440 (light) and 390 (dark) with `shot.mjs` against `vite preview`, and fix layout issues.
- [ ] **Step 5: Commit** `feat(frontend): roadmap and stage pages`.

### Task 6: Today: daily plan, reviews, streak

**Files:**
- Create: `frontend/src/practice/daily.ts`, `frontend/src/pages/Today.tsx`, `frontend/src/components/practice/{ChecklistItem,StreakStrip}.tsx`
- Test: `frontend/src/practice/daily.test.ts`, `frontend/src/pages/Today.test.tsx`

**Interfaces:**
- Consumes: Tasks 2–5 (`useSettings`, content, `loadProgress`, `isUnlocked`, `useProgress`)
- Produces:
  - `type DailyItem = { id: string; kind: 'new' | 'review' | 'refresher'; problemId?: string; stageId?: string; patternId?: string }`
  - `localDateKey(now: Date): string` (`YYYY-MM-DD`, local time)
  - `buildPlan(dateKey, settings, progress, now): DailyItem[]`, deterministic for the same inputs
  - `loadDay(dateKey)` / `saveDay(dateKey, { items, completedIds })`; a day's items are generated once and then kept
  - `streak(daily, todayKey): number`, counting days where every `new` item was completed and walking back from yesterday if today isn't complete yet
  - `last14(daily, todayKey): { dateKey, state: 'complete' | 'partial' | 'none' }[]`

- [ ] **Step 1: Write failing tests** (fixed clock):
  - `newItemsMatchDailyGoal`
  - `newItemsComeFromCurrentStageByTargetWeight`
  - `reviewsDueCappedAt5OldestFirst`
  - `oneRefresherFromCompletedStage` (none if no stage is complete)
  - `planIsStableWithinADay`
  - `buildsANewPlanAfterMidnight` (23:59 → 00:01 gives a new key, with yesterday's `completedIds` untouched)
  - `streakCountsCompleteDays`
  - `streakSurvivesUnfinishedToday`
  - `todayPageAutoTicksOnProgressEvent`
  - `manualTickPersists`
  - `generateTestButtonPresent`
- [ ] **Step 2: Run** `npx vitest run src/practice/daily.test.ts src/pages/Today.test.tsx`. Expected: FAIL.
- [ ] **Step 3: Implement.**
  - **Auto-tick:** an item auto-ticks when `progressEvents` reports a solve or review for its `problemId`.
  - **Refresher card:** shows the pattern `idea` and an "Open a problem" link.
  - **StreakStrip:** 14 small squares with text alternatives, e.g. "Oct 20: complete".
- [ ] **Step 4: Run** `fe-test.sh`. Expected: PASS. Take screenshots as in Task 5.
- [ ] **Step 5: Commit** `feat(frontend): today page with daily checklist and streak`.

### Task 7: Generate test and the test runner

**Files:**
- Create:
  - `frontend/src/practice/rng.ts`
  - `frontend/src/practice/tests.ts`
  - `frontend/src/pages/TestRunner.tsx`
  - `frontend/src/components/practice/{TestRail,TestReport,Countdown}.tsx`
- Modify: `frontend/src/state/useMentorSession.ts` (expose `hintsUsedSinceOpen`)
- Test: `frontend/src/practice/tests.test.ts`, `frontend/src/pages/TestRunner.test.tsx`

**Interfaces:**
- Consumes: Tasks 3, 4 and 6. `generateTest` takes `level` as a parameter, and `/today` passes `1` until Task 8 wires in the real level.
- Produces:
  - `mulberry32(seed: number): () => number`
  - `type PracticeTest = { id: string; seed: number; createdAt: number; durationMin: 60; problems: { problemId: string; kind: 'revision' | 'new'; result?: 'solved' | 'hinted' | 'skipped' }[]; finishedAt?: number }`
  - `generateTest(level: number, progress, unlockedStageIds, seed): PracticeTest | { error: string }`
  - `scoreTest(t): { score: number; max: 10; byStage: Record<string, { got: number; of: number }>; weakStageIds: string[] }`
  - `finishTest(t, now)`: resets the review step of missed revision problems and schedules one extra review per weak stage within 3 days
  - `loadTests()` / `saveTest()`

- [ ] **Step 1: Write failing tests:**
  - `mixIs3RevisionAnd7New`
  - `fillsFromOtherPoolWhenShort`
  - `explainsWhenTooFewProblems` (a new user with stage 1 only and fewer than 10 problems gives `{error}` mentioning "at least 10")
  - `maxThreePerStage`
  - `difficultyMixFollowsLevel` (L2 gives 6E/4M; L5 gives 3/6/1; L8 gives 1/6/3, with a fallback to the nearest difficulty when a bucket is short)
  - `sameSeedSameTest`
  - `scoreCountsHintsAsHalf`
  - `finishResetsMissedRevisionsAndSchedulesWeakStages`
  - `runnerShowsTenProblemsAndTimer`
  - `timerAnnouncesOncePerMinute` (`aria-live` text changes only at minute boundaries)
  - `finishShowsReport`
- [ ] **Step 2: Run** `npx vitest run src/practice/tests.test.ts src/pages/TestRunner.test.tsx`. Expected: FAIL.
- [ ] **Step 3: Implement.**
  - **Runner layout:** a left rail (the 10 problems with result marks) and the workspace's `ProblemPane` + `MentorPanel` for the selected problem. The session hook is keyed per problem; reuse the Workspace components.
  - **Problem controls:** "Mark solved" (hints from the session give `hinted`) and "Skip".
  - **Finish:** the report shows score, time, per-stage results, weak stages and "Practise weak stages" (links to their stage pages).
  - **Entry point:** `/today` "Generate test" creates the test and navigates to `/test/:id`.
- [ ] **Step 4: Run** `fe-test.sh`. Expected: PASS.
- [ ] **Step 5: Commit** `feat(frontend): generated mixed tests with runner and report`.

### Task 8: Level and readiness

**Files:**
- Create: `frontend/src/practice/level.ts`, `frontend/src/pages/Level.tsx`, `frontend/src/components/practice/{ReadinessMeter,GapList}.tsx`
- Modify: `frontend/src/pages/Today.tsx` (level and readiness summary at the top; Generate test now passes `levelFor(levelScore(...).total)` instead of `1`)
- Test: `frontend/src/practice/level.test.ts`, `frontend/src/pages/Level.test.tsx`

**Interfaces:**
- Consumes: Tasks 2–7
- Produces:
  - `type ScoreParts = { coverage: number; difficulty: number; retention: number; tests: number; consistency: number; external: number }`, each already weighted, summing to 0–100
  - `levelScore(input): { total: number; parts: ScoreParts }`
  - `levelFor(total): 1..10`
  - `readiness(total, target): number` (0–100)
  - `topGaps(parts, input, target): { component: keyof ScoreParts; action: string }[]` (length ≤ 3), with concrete copy such as "Graphs: solve 6 more Medium", "Pass 4 more reviews this week", "Take a test", "Connect LeetCode in Settings"

- [ ] **Step 1: Write failing tests** (table-driven):
  - `levelThresholds` (7 gives L1, 8 L2, 14 L2, 15 L3, 86 L9, 87 L10)
  - `coverageUsesTargetWeights`
  - `difficultyExpectationScalesWithRole`
  - `externalCapsAt400`
  - `readinessUsesBar` (FAANG SDE-1, score 60, gives 75%)
  - `readinessCapsAt100`
  - `topGapsPickLargestWeightedShortfalls`
  - `gapCopyIsConcrete`
  - `levelPageShowsLevelMeterGapsAndBreakdown`
  - `levelUpMessageShownOnce` (stored last level; shows once on increase)
- [ ] **Step 2: Run** `npx vitest run src/practice/level.test.ts src/pages/Level.test.tsx`. Expected: FAIL.
- [ ] **Step 3: Implement per spec §7.**
  - The meter is a plain progress element (`role="meter"`, with `aria-valuenow`/`min`/`max`) in sage on sand.
  - The level-up message is a Sonner toast.
- [ ] **Step 4: Run** `fe-test.sh`. Expected: PASS.
- [ ] **Step 5: Commit** `feat(frontend): level and placement readiness`.

### Task 9: End-to-end, accessibility and visual review

**Files:**
- Create: `frontend/e2e/practice.spec.ts`
- Modify: `frontend/e2e/a11y.spec.ts` (add `/roadmap`, `/roadmap/arrays`, `/today`, `/level`), `README.md`

- [ ] **Step 1: Write the e2e specs** (`e2e` profile, where the stub profile user is `demo`):
  1. Settings → paste `https://leetcode.com/u/demo/` → Connect shows the stub stats
  2. roadmap → stage 1 → Solve → `/app?q=…&from=…` → I solved it → back on the roadmap the stage shows "1 of N solved"
  3. Today shows 3 new items; solving one ticks it
  4. Generate test → runner shows 10 problems → mark 2 solved, skip the rest → Finish → report score
  5. `/level` shows a level, a meter and 3 gaps
  6. the Settings gear is visible and clickable on `/`, `/app`, `/roadmap` and `/today` without overlapping nav controls (bounding boxes don't intersect)
- [ ] **Step 2: Run** `./mvnw -B -q package -DskipTests && cd frontend && npx playwright test`. Expected: all pass, including axe in both themes on the new routes.
- [ ] **Step 3: Run the `design:design-critique` and `design:accessibility-review` skills** on screenshots of the new pages (1440 light, 390 dark). Fix medium-or-higher findings with failing-first tests where testable.
- [ ] **Step 4: Update README** (Practice hub features, profile notes: public data only, LeetCode's recent-20 limit). Run `all-test.sh`. Expected: green.
- [ ] **Step 5: Commit** `test: practice hub e2e and review fixes`.
