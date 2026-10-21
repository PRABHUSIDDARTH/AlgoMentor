# AlgoMentor Frontend Redesign (Phase 1) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the single hand-written page with a React landing page (`/`) and workspace (`/app`) in the approved palette, in light and dark themes, with step-by-step hints, solutions in a chosen language, follow-up questions and history stored in the browser.

**Architecture:** A Vite + React + TypeScript app in `frontend/`, built by `frontend-maven-plugin` into `target/classes/static`, so the Spring Boot jar still serves everything. The backend gains a `language` field, a `followup` mode, SPA route forwarding, and an `e2e` profile with stub model and LeetCode clients for browser tests. The existing API shapes are unchanged.

**Tech Stack:**
- Frontend: React 19, TypeScript, Vite, Tailwind CSS v4, shadcn/ui (Radix), React Bits (SplitText, AnimatedContent; they depend on `gsap` and `@gsap/react`), Motion, React Router, lucide-react, marked, DOMPurify, highlight.js, `@fontsource` (Fraunces, Inter, JetBrains Mono)
- Tests: Vitest + Testing Library + jsdom, Playwright + `@axe-core/playwright`
- Backend: Spring Boot 4.1, JUnit 5

**Spec:** `docs/superpowers/specs/2026-10-21-frontend-redesign-design.md`

## Global Constraints

- Node **v26.12.1** for the Maven build. Locally, run `source ~/.nvm/nvm.sh` before any npm command.
- Pin every npm dependency to an exact version (no `^` or `~`): the latest stable at install time. Pin `frontend-maven-plugin` to its latest release, as `<frontend-maven-plugin.version>` in `pom.xml`.
- **Colour tokens. Components never use raw hex, only these CSS variables:**

  | Token | Light | Dark |
  |---|---|---|
  | `--cream` | `#F7F2EB` | `#0E100B` |
  | `--sand` | `#EAE2D6` | `#181C13` |
  | `--grey` | `#EEEEEE` | `#22271B` |
  | `--ink` | `#262C1E` | `#F7F2EB` |
  | `--ink-muted` | `#56613F` | `#C9C0B1` |
  | `--sage` | `#8B9A6E` | `#8B9A6E` |
  | `--sage-soft` | none | `#A8B68A` (hover, links) |
  | `--line` | ink at 12% | cream at 12% |
  | `--code-bg` | `#1E2318` | `#080906` |
  | `--band` (app navbar, integrations, footer) | `#262C1E` | `#000000` |

  Code colours: keyword `#B9C49F`, string `#D9CDB8`, comment cream at 50%.
- **In light mode, sage is never text on cream, sand or grey.** Button labels on sage use ink.
- **Fonts:** Fraunces 500/600 for display headings (tracking -0.02em, or -0.03em at 40px and above). Inter 400/500/600 for body text, at 15px on the landing page and 13px in the app. JetBrains Mono 400/500 for code, eyebrows (11px uppercase, 0.12em tracking) and numeric labels.
- **Shape:** radius 6px for controls and 8px for cards. No fully rounded pills except the circular hint markers. Spacing uses a 4px scale.
- **Anti-slop rules:**
  - no emoji in the UI
  - no gradient text, glows, glassmorphism or aurora backgrounds
  - no badge or pill that isn't a button
  - metadata is plain text joined with " · "
  - at most one sage (primary) button per view
  - icons only for copy, external link, search, theme and menu
- **Limits:**
  - 4 hints
  - follow-ups: 10 turns (20 conversation entries), at most 1,000 characters per question, at most 6,000 characters per conversation entry
  - history: 30 entries, under localStorage key `algomentor.recent.v1`
  - theme key: `algomentor.theme`
- **Hint step labels:** Nudge, Direction, Approach, Technique, Solution.
- **Bundle and Lighthouse:** landing page initial JS at most 180 KB gzipped, with `/app` lazy-loaded. highlight.js registers only python, java and cpp. Lighthouse on `/`: Performance ≥ 90, Accessibility ≥ 95, Best Practices ≥ 95.
- **Commits:** every commit message ends with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Review Focus

1. **Opening another problem while an answer streams.** The old stream is aborted and none of its text appears in the new problem (Task 7 test `abortsStreamWhenProblemChanges`).
2. **Double-clicking Next hint.** Exactly one request is sent, and exactly one hint is added (Task 7 test `ignoresNextHintWhileStreaming`).
3. **Corrupted or full localStorage.** Garbage JSON under `algomentor.recent.v1`, or `setItem` throwing a quota error, means history acts as empty or unchanged and the app never crashes (Task 6 tests `treatsCorruptJsonAsEmpty` and `survivesQuotaError`).
4. **Model output containing HTML or scripts.** `<script>`, `onerror=` and `javascript:` links in Markdown are removed before rendering (Task 5 test `stripsDangerousHtml`).
5. **An unsupported `language` from a client** (e.g. `"rust"`) gets a 400 with `{error}`, never a silent fallback (Task 1 test `rejectsUnsupportedLanguage`).

---

### Task 1: Backend: `language` field and the complexity block

**Files:**
- Create: `src/main/java/com/pstech/algomentor/web/Language.java`
- Create: `src/main/java/com/pstech/algomentor/web/PromptInput.java`
- Modify: `src/main/java/com/pstech/algomentor/web/Mode.java`
- Modify: `src/main/java/com/pstech/algomentor/web/AskController.java` (`AskRequest`, `buildPrompt`)
- Test: `src/test/java/com/pstech/algomentor/web/AskControllerTests.java`

**Interfaces:**
- Produces:
  - `enum Language { PYTHON("Python"), JAVA("Java"), CPP("C++"); String displayName(); static Language parse(String value) }`. A null or blank value gives `PYTHON`. An unknown value throws `ApiException(400, "Unsupported language. Use python, java or cpp.")`.
  - `record PromptInput(String problem, List<String> previousHints, int maxHints, Language language, List<Turn> conversation, String question, boolean solutionRevealed)`, plus `record Turn(String role, String text)`, nested in `PromptInput`.
  - `Mode.prompt(PromptInput in)` replaces the three-argument overload.
  - `AskRequest(String problem, String mode, List<String> previousHints, String language, List<PromptInput.Turn> conversation, String question, Boolean solutionRevealed)`

- [ ] **Step 1: Write failing tests** in `AskControllerTests`:
  - `solutionPromptUsesRequestedLanguage`: POST `{"problem":"Two Sum","mode":"solution","language":"java"}`. Verify the prompt contains `"code in Java"` and contains `"```complexity"`.
  - `solutionDefaultsToPython`: no `language`, so the prompt contains `"code in Python"`.
  - `rejectsUnsupportedLanguage`: `"language":"rust"` gives 400, and `$.error` contains `"Unsupported language"`.
- [ ] **Step 2: Run** `./mvnw -B -q test -Dtest=AskControllerTests`. Expected: the 3 new tests FAIL.
- [ ] **Step 3: Implement** `Language` and `PromptInput`, then switch `Mode.prompt` to `PromptInput`. The SOLUTION prompt becomes this exact copy:
  ```
  Give the optimal solution with code in <Language.displayName()> and explain the approach for:

  <problem>

  End your answer with this fenced block, filled in:
  ```complexity
  time: O(...) | <short reason>
  space: O(...) | <short reason>
  ```
  ```
  `buildPrompt` constructs the `PromptInput`. `language` is parsed for every mode, so a bad value is rejected everywhere.
- [ ] **Step 4: Run** `./mvnw -B -q test`. Expected: all backend tests PASS.
- [ ] **Step 5: Commit** `feat(api): language option and complexity block for solutions`.

### Task 2: Backend: `followup` mode

**Files:**
- Modify: `Mode.java` (add `FOLLOWUP`), `AskController.java` (validation)
- Test: `AskControllerTests.java`

**Interfaces:**
- Consumes: `PromptInput`, `Language` (Task 1)
- Produces: mode string `"followup"`. Request fields: `question`, `conversation`, `solutionRevealed`, `previousHints`.

- [ ] **Step 1: Write failing tests:**
  - `followupIncludesContextAndQuestion`: body `{"problem":"Two Sum","mode":"followup","previousHints":["Use a map"],"conversation":[{"role":"user","text":"why?"},{"role":"mentor","text":"because"}],"question":"why not an array?","solutionRevealed":false}`. Verify the prompt contains `"Two Sum"`, `"Use a map"`, `"why not an array?"` and `"Do not give full code or the complete solution"`.
  - `followupAfterRevealAllowsCode`: `solutionRevealed:true`, so the prompt does NOT contain `"Do not give full code"`.
  - `followupRejectsBlankQuestion`: 400.
  - `followupRejectsLongQuestion`: 1,001 characters gives 400.
  - `followupRejectsTooManyTurns`: 21 entries gives 400.
  - `followupRejectsLongEntry`: an entry of 6,001 characters gives 400.
  - `followupRejectsUnknownRole`: role `"system"` gives 400.
- [ ] **Step 2: Run** `./mvnw -B -q test -Dtest=AskControllerTests`. Expected: the new tests FAIL.
- [ ] **Step 3: Implement** the validation in `buildPrompt` (400 messages are plain sentences), and `Mode.FOLLOWUP`'s prompt. It must:
  - say it is a DSA tutor answering a follow-up about this problem only
  - list the hints given and the conversation, labelled `Student:` / `Mentor:`
  - put the question last
  - when `solutionRevealed` is false, include the sentence `Do not give full code or the complete solution; keep guiding with reasoning.`
- [ ] **Step 4: Run** `./mvnw -B -q test`. Expected: all PASS.
- [ ] **Step 5: Commit** `feat(api): followup mode with context and limits`.

### Task 3: Backend: SPA forwarding and `e2e` profile stubs

**Files:**
- Create: `src/main/java/com/pstech/algomentor/web/SpaController.java`
- Create: `src/main/java/com/pstech/algomentor/e2e/StubAnswerGenerator.java`
- Create: `src/main/java/com/pstech/algomentor/e2e/StubLeetCodeConfig.java`
- Create: `src/main/resources/application-e2e.properties`
- Modify: `GeminiAnswerGenerator.java` (add `@Profile("!e2e")`), `LeetCodeConfig.java` (add `@Profile("!e2e")`)
- Test: `src/test/java/com/pstech/algomentor/web/SpaControllerTests.java`, `src/test/java/com/pstech/algomentor/e2e/StubAnswerGeneratorTests.java`

**Interfaces:**
- Produces:
  - `GET /app` and `GET /app/**` forward to `/index.html`
  - under profile `e2e`:
    - `StubAnswerGenerator implements AnswerGenerator` streams canned text in 5 chunks, 40ms apart
    - a `LeetCodeClient` subclass whose `fetch(ProblemRef)` returns fixed `Problem`s for 1 (`two-sum`, Easy, tags Array · Hash Table) and 146 (`lru-cache`, Medium), and throws `ApiException(404)` otherwise
  - `application-e2e.properties` sets `algomentor.rate-limit.per-minute=1000`, `per-day=100000`, and the same for `problem-rate-limit`

- [ ] **Step 1: Write failing tests:**
  - `SpaControllerTests.forwardsAppRoutes`: `GET /app` and `GET /app/anything` give `forwardedUrl("/index.html")`.
  - `SpaControllerTests.leavesApiAlone`: `GET /problem` without `ref` still gives 400 JSON.
  - `StubAnswerGeneratorTests` (plain unit test):
    - a hint prompt containing `Give ONLY hint 2` streams text starting with `**Hint 2:**`
    - a solution prompt containing `code in Java` streams text with a fence opening `` ```java `` and a `` ```complexity `` block
    - a follow-up prompt streams text containing `Follow-up:`
    - each streams more than one chunk
- [ ] **Step 2: Run** `./mvnw -B -q test -Dtest='SpaControllerTests,StubAnswerGeneratorTests'`. Expected: FAIL.
- [ ] **Step 3: Implement.**
  - The stub picks its canned text from prompt markers: `Explain this`, `Give ONLY hint (\d)`, `code in (Python|Java|C\+\+)`, `follow-up`.
  - `generate()` returns the joined chunks.
  - The stub `LeetCodeClient` passes `RestClient.create()` and `"https://leetcode.com"` to the super constructor, and never calls it.
- [ ] **Step 4: Run** `./mvnw -B -q test`. Expected: all PASS. The existing tests use the default profile.
- [ ] **Step 5: Commit** `feat: SPA route forwarding and e2e stub profile`.

### Task 4: Frontend scaffold, theme and Maven build

**Files:**
- Create:
  - `frontend/` (package.json, tsconfig, `vite.config.ts`, `index.html`, `components.json`)
  - `frontend/src/main.tsx`, `App.tsx`
  - `frontend/src/styles/globals.css`
  - `frontend/src/lib/theme.ts`
  - `frontend/src/components/ThemeToggle.tsx`
  - `frontend/src/pages/Landing.tsx`, `Workspace.tsx` (placeholders)
- Create: `frontend/src/lib/theme.test.ts`, `frontend/vitest.setup.ts`
- Modify: `pom.xml`, `Dockerfile`, `.gitignore`, `.dockerignore`, `.github/workflows/ci.yml` (cache npm), `AskControllerTests.servesIndexPage`
- Delete: `src/main/resources/static/index.html`

**Interfaces:**
- Produces:
  - `type ThemeChoice = 'light' | 'dark' | 'system'`
  - `getThemeChoice(): ThemeChoice`
  - `setThemeChoice(c: ThemeChoice): void`, which writes `algomentor.theme` in a try/catch and applies the class
  - `resolveTheme(c: ThemeChoice, prefersDark: boolean): 'light' | 'dark'`
  - `<ThemeToggle />`, with `aria-label="Theme"`, cycling through the three choices with lucide Sun / Moon / Monitor icons
  - tokens as Tailwind v4 theme variables (`bg-cream`, `bg-sand`, `bg-grey`, `text-ink`, `text-ink-muted`, `bg-sage`, `border-line`, `bg-band`, `bg-code`), with dark mode via `@custom-variant dark (&:where(.dark, .dark *))`
  - routes `/` → `Landing` and `/app` → lazy `Workspace`

- [ ] **Step 1: Scaffold** with Vite's `react-ts` template.
  - Add Tailwind v4 (`@tailwindcss/vite`), React Router, the `@fontsource` fonts, and Vitest, Testing Library and jsdom.
  - Run `npx shadcn@latest init`, then add: button, input, tabs, tooltip, command, dialog, sheet, accordion, sonner, scroll-area.
  - In `vite.config.ts`: set `build.outDir` to `'../target/classes/static'` and `emptyOutDir: true`, and proxy `/ask` and `/problem` to `http://localhost:8080`.
  - Write `globals.css` with the Global Constraints tokens for `:root` and `.dark`.
  - Import only the `latin` subsets of the `@fontsource` fonts, with `font-display: swap`.
- [ ] **Step 2: Write failing tests** in `theme.test.ts`:
  - `resolveTheme('system', true) === 'dark'`
  - `resolveTheme('light', true) === 'light'`
  - `setThemeChoice('dark')` adds the `dark` class to `<html>` and stores `"dark"`
  - when `localStorage.setItem` throws, `setThemeChoice` still applies the class
- [ ] **Step 3: Run** `cd frontend && npx vitest run src/lib/theme.test.ts`. Expected: FAIL.
- [ ] **Step 4: Implement `theme.ts`, `ThemeToggle`, and an inline blocking script in `index.html`.** The script reads `algomentor.theme` (in a try/catch) and `matchMedia('(prefers-color-scheme: dark)')`, and sets `class="dark"` on `<html>` before CSS loads. Set the `<title>` to `AlgoMentor`.
- [ ] **Step 5: Run** the same Vitest command. Expected: PASS.
- [ ] **Step 6: Wire the Maven build.**
  - `frontend-maven-plugin`, with `workingDirectory` `frontend` and `installDirectory` `target`. Executions:
    - `install-node-and-npm`: `nodeVersion` v26.12.1
    - `npm ci`
    - `npm run build` in `generate-resources`
    - `npm test` (`vitest run`) in `test`, with `<skip>${skipTests}</skip>`
  - Delete the old `static/index.html`.
  - Dockerfile build stage: `COPY frontend frontend` before `package`.
  - `.gitignore` and `.dockerignore`: `frontend/node_modules`, `frontend/dist`.
  - Change `servesIndexPage` to assert that the body contains `<title>AlgoMentor</title>`.
- [ ] **Step 7: Run** `./mvnw -B verify`, then `java -jar target/algomentor-0.0.1-SNAPSHOT.jar` and `curl -s localhost:8080/app | grep -c '<div id="root">'`. Expected: BUILD SUCCESS, and `1`.
- [ ] **Step 8: Commit** `feat(frontend): React scaffold, design tokens, theme, Maven build`.

### Task 5: API client, SSE reader, Markdown

**Files:**
- Create: `frontend/src/lib/sse.ts`, `api.ts`, `markdown.ts`, and their `*.test.ts`

**Interfaces:**
- Produces:
  - `readSse(body: ReadableStream<Uint8Array>): AsyncGenerator<{ event: string; data: string }>`
  - `type Mode = 'explain' | 'hint' | 'solution' | 'followup'`
  - `type Language = 'python' | 'java' | 'cpp'`
  - `type Turn = { role: 'user' | 'mentor'; text: string }`
  - `interface AskPayload { problem: string; mode: Mode; previousHints?: string[]; language?: Language; conversation?: Turn[]; question?: string; solutionRevealed?: boolean }`
  - `interface Problem { number: string; title: string; slug: string; difficulty: string; tags: string[]; url: string; statement: string }`
  - `class ApiError extends Error { status: number }`
  - `class StreamCutError extends Error { partial: string }`
  - `askStream(p: AskPayload, onChunk: (text: string) => void, signal?: AbortSignal): Promise<string>`. It resolves with the full text on `done`, rejects with `ApiError` on non-2xx (message taken from `{error}`) or on an `error` event, and rejects with `StreamCutError` when the stream ends without `done`.
  - `fetchProblem(ref: string, signal?: AbortSignal): Promise<Problem>`
  - `looksLikeProblemRef(input: string): boolean`, with the same patterns as the backend `ProblemRef`
  - `type Segment = { kind: 'html'; html: string } | { kind: 'code'; lang: string; code: string }`
  - `splitMarkdown(md: string): { segments: Segment[]; complexity?: { time: Cx; space: Cx } }`, where `Cx = { value: string; reason: string }`, and the `complexity` fence is removed from `segments`
  - `highlight(code: string, lang: string): string`

- [ ] **Step 1: Write failing tests:**
  - `sse`: `parsesChunksSplitAcrossReads`, `handlesCrlf`, `joinsMultiLineData`
  - `api`:
    - `resolvesFullTextOnDone`
    - `throwsApiErrorWithServerMessage` (a 429 body `{"error":"Too many requests..."}` gives `status` 429 and that message)
    - `throwsStreamCutWithPartial`
    - `rejectsOnErrorEvent`
    - `abortStopsReading`
    - `looksLikeProblemRef`, accepting `1`, `#1`, `LC 146` and `https://leetcode.com/problems/two-sum/`, and rejecting `two sum` and `Given an array of 1`
  - `markdown`:
    - `extractsComplexity`: ``` ```complexity\ntime: O(1) | per op\nspace: O(n) | map``` ``` gives `{ time: { value: 'O(1)', reason: 'per op' }, ... }`, with the fence gone from `segments`
    - `splitsCodeFences`
    - `stripsDangerousHtml`: `<img src=x onerror=alert(1)>`, `<script>` and `[x](javascript:alert(1))` produce no `onerror`, `<script` or `javascript:` in the html
- [ ] **Step 2: Run** `npx vitest run src/lib`. Expected: FAIL.
- [ ] **Step 3: Implement.**
  - `readSse` is a port of the event-splitting loop in the deleted `index.html` (split on a blank line, `event:` and `data:` lines).
  - `splitMarkdown` uses `marked.lexer` and renders each non-code token run through `marked.parser` and then `DOMPurify.sanitize`.
  - `highlight` registers python, java and cpp only, via `highlight.js/lib/core`.
- [ ] **Step 4: Run** the same command. Expected: PASS.
- [ ] **Step 5: Commit** `feat(frontend): streaming API client and safe markdown`.

### Task 6: Recent-problem history

**Files:**
- Create: `frontend/src/lib/history.ts`, `history.test.ts`

**Interfaces:**
- Produces:
  - `type HistoryStatus = 'started' | 'hints' | 'explained' | 'solution' | 'solved'`, ranked in that order. An entry's status never moves down the ranking.
  - `interface HistoryEntry { key: string; source: 'leetcode' | 'custom'; number?: string; slug?: string; title: string; difficulty?: string; statement?: string; status: HistoryStatus; hintsUsed: number; hints: string[]; updatedAt: number }`
  - `loadHistory(): HistoryEntry[] | null`, where `null` means storage is unavailable
  - `upsertHistory(e: HistoryEntry): HistoryEntry[]`, newest first, capped at 30, merging by `key`
  - `historyKey(p: { slug?: string; statement: string }): string`, which returns the slug, or `custom:` plus an FNV-1a hex hash of the statement
  - `statusLine(e: HistoryEntry): string`, one of: `Hint 2 of 4`, `Solution viewed`, `Explained`, `Solved`, `Started`, or `Pasted · 2 hints` (custom entries with hints)

- [ ] **Step 1: Write failing tests:**
  - `capsAt30NewestFirst`
  - `mergesByKeyAndKeepsHighestStatus`: `solved`, then an upsert with `hints`, stays `solved`
  - `treatsCorruptJsonAsEmpty`: `"{not json"` gives `[]`
  - `survivesQuotaError`: `setItem` throws, `upsertHistory` returns the merged list and does not throw
  - `returnsNullWhenStorageThrowsOnRead`
  - `statusLineFormats`, covering each of the six strings
- [ ] **Step 2: Run** `npx vitest run src/lib/history.test.ts`. Expected: FAIL.
- [ ] **Step 3: Implement** with every storage access in a try/catch.
- [ ] **Step 4: Run** the same command. Expected: PASS.
- [ ] **Step 5: Commit** `feat(frontend): recent problem history in localStorage`.

### Task 7: Mentor session state

**Files:**
- Create: `frontend/src/state/useMentorSession.ts`, `useMentorSession.test.tsx`

**Interfaces:**
- Consumes: `askStream`, `fetchProblem`, `looksLikeProblemRef`, `ApiError`, `StreamCutError` (Task 5); `upsertHistory`, `historyKey` (Task 6)
- Produces:
  - `type Tab = 'explain' | 'hints' | 'solution'`
  - `interface ProblemContext { key: string; source: 'leetcode' | 'custom'; title: string; statement: string; number?: string; slug?: string; difficulty?: string; tags: string[]; url?: string }`
  - `useMentorSession()` returns:
    - state: `{ problem, tab, hints: string[], streaming: { tab: Tab; text: string } | null, explain?: string, solution: Partial<Record<Language, string>>, language, followups: Turn[], solutionRevealed, solved, status: 'idle' | 'loadingProblem' | 'ready' | 'streaming' | 'error', error?: { tab: Tab | 'problem'; message: string; partial?: string }, cooldownUntil?: number }`
    - actions: `openProblem(input: string)`, `openEntry(e: HistoryEntry)`, `editStatement(text: string)`, `setTab(t)`, `explainProblem()`, `nextHint()`, `revealSolution()`, `setLanguage(l)`, `askFollowUp(q: string)`, `markSolved()`, `retry()`
    - `hintsRemaining: number`, equal to 4 minus `hints.length`
  - Custom problem title: `Custom: ` plus the first 40 characters of the statement.
  - A 429 sets `cooldownUntil` to now + 30s.

- [ ] **Step 1: Write failing tests** with `renderHook` and a mocked `api` module:
  - `opensLeetCodeRefAndRecordsHistory`
  - `pastedTextBecomesCustomProblem` (title `Custom: …`)
  - `nextHintSendsPreviousHints`: the second call's payload has `previousHints` of length 1
  - `ignoresNextHintWhileStreaming`: two calls in quick succession give 1 `askStream` call
  - `abortsStreamWhenProblemChanges`: the first call's `signal.aborted` is true, and no text from it lands in the new state
  - `solutionCachedPerLanguage`: switching python → java → python gives 2 calls
  - `followUpCarriesConversationAndRevealFlag`
  - `streamCutKeepsPartial`: `error.partial` is set, and `retry()` re-issues the same payload
  - `rateLimitSetsCooldown`
  - `editStatementResetsSession`
  - `markSolvedUpdatesHistory`
- [ ] **Step 2: Run** `npx vitest run src/state`. Expected: FAIL.
- [ ] **Step 3: Implement** with `useReducer`, one `AbortController` ref, and a `lastRequest` ref for `retry`. History is updated on every finished request.
- [ ] **Step 4: Run** the same command. Expected: PASS.
- [ ] **Step 5: Commit** `feat(frontend): mentor session state machine`.

### Task 8: Landing page

**Files:**
- Create: `frontend/src/components/landing/{Nav,Hero,DataStructureScene,HowItWorks,WorkspaceFeatures,Integrations,Faq,FinalCta,Footer}.tsx`, `frontend/src/components/bits/{SplitText,AnimatedContent}.tsx` (from React Bits, TS + Tailwind variant), `frontend/src/components/ProblemStartForm.tsx`
- Modify: `frontend/src/pages/Landing.tsx`
- Test: `frontend/src/pages/Landing.test.tsx`

**Interfaces:**
- Consumes: `ThemeToggle` (Task 4)
- Produces: `<ProblemStartForm buttonLabel="Start solving" />`, which navigates to `/app?q=<encoded input>` and is reused by the empty state in Task 9.

**Copy (exact):**
- **Eyebrow:** "AI mentor for data structures & algorithms"
- **H1:** "Understand the problem before you see the answer.", with "before" sage-highlighted
- **Lead:** "AlgoMentor gives you one hint at a time, explains the intuition, and only then walks through the optimal solution and its complexity. Bring any LeetCode problem by number."
- **Input placeholder:** "Problem number or statement, e.g. 146"
- **Try links:** 1. Two Sum, 146. LRU Cache, 200. Number of Islands
- **How it works:**
  - title "Think first. Reveal later."
  - "Bring a problem": "Type a LeetCode number or paste any statement. We fetch the full problem for you."
  - "Work through hints": "Up to four hints, each more specific than the last. Stop as soon as it clicks."
  - "Study the solution": "The optimal approach, code in your language, and time and space complexity explained."
- **Workspace band:** title "Built for learning, not copying."
- **Integrations:** title "Connect the accounts you already practise on.", with each card captioned "Coming soon"
- **Final CTA:** "Your next problem is one number away."
- **Footer:** AlgoMentor, GitHub, Privacy, "Built by psTech"
- **FAQ answers:**
  - *Is it free?* "Yes. AlgoMentor is free to use."
  - *Will it just give me the answer?* "Only when you ask. Hints come first, and revealing the solution early always asks you to confirm."
  - *Which languages?* "Solutions are available in Python, Java and C++."
  - *Premium problems?* "No. Premium statements are not public, so paste the problem text instead."

- [ ] **Step 1: Write failing tests:**
  - `startFormNavigatesToApp`: typing `146` and submitting lands on `/app?q=146`
  - `tryLinkNavigates`
  - `navHasNoSignInInPhase1`: no element with the name `Sign in`
  - `sceneIsHiddenFromAssistiveTech`: the scene root has `aria-hidden="true"` and a sibling with class `sr-only`
  - `reducedMotionRendersStaticScene`: with matchMedia mocked to reduce, no element carries the `data-animating` attribute
  - `noEmojiInRenderedText`: the document text does not match `/\p{Extended_Pictographic}/u`
- [ ] **Step 2: Run** `npx vitest run src/pages/Landing.test.tsx`. Expected: FAIL.
- [ ] **Step 3: Implement** the sections in the order and layout of spec section 5.
  - `DataStructureScene`: sway `rotateX(14deg) rotateY(-22deg)` ↔ `rotateX(8deg) rotateY(22deg)`, 14s, alternating. BFS node highlights stagger 0.9s on an 8.4s loop.
  - The scene pauses off-screen via IntersectionObserver.
  - With reduced motion it is a static frame with BFS at step 3.
  - `SplitText` word stagger is 40ms. `AnimatedContent` uses a 12px rise, 400ms, threshold 0.15, once.
- [ ] **Step 4: Run** the same command. Expected: PASS. Then start `npm run dev` and check `/` at 360, 768 and 1280px widths in both themes, comparing against `.superpowers/brainstorm/*/content/palette-v4.html`.
- [ ] **Step 5: Commit** `feat(frontend): landing page with data-structure hero`.

### Task 9: Workspace shell: nav, sidebar, problem pane, empty state, jump palette

**Files:**
- Create: `frontend/src/components/workspace/{AppNav,RecentSidebar,ProblemPane,EmptyState,JumpToProblem}.tsx`
- Modify: `frontend/src/pages/Workspace.tsx`
- Test: `frontend/src/pages/Workspace.test.tsx`

**Interfaces:**
- Consumes: `useMentorSession` (Task 7), `loadHistory`, `statusLine` (Task 6), `ProblemStartForm` (Task 8)
- Produces: `Workspace` reads `?q=` on mount and calls `openProblem(q)`. It renders the `MentorPanel` slot that Task 10 fills.

- [ ] **Step 1: Write failing tests:**
  - `emptyStateShowsStarterGroups`: headings "Arrays and hashing", "Linked lists and design" and "Graphs", and rows 1, 49, 206, 146, 200, 207
  - `queryParamOpensProblem`
  - `sidebarListsHistoryWithStatusLine`
  - `historyOffMessageWhenStorageUnavailable`: shows "History is off in this browser"
  - `ctrlKOpensJumpPalette`: and typing `146` shows "Open LeetCode #146"
  - `editStatementSwapsToTextarea`
  - `problemMetaUsesPlainSeparators`: the meta line text includes ` · ` and has no elements with the `badge` role or class
  - `appNavHidesPhase2Links`: no "Progress", "Connections" or "Sign in" links, and a button named "Theme" is present
  - `lookupErrorKeepsInput`: a `fetchProblem` 404 shows its message under the input, and the input keeps `99999`
- [ ] **Step 2: Run** `npx vitest run src/pages/Workspace.test.tsx`. Expected: FAIL.
- [ ] **Step 3: Implement** the layout from spec section 6:
  - three panes at 1200px and wider
  - from 768 to 1199px the sidebar moves into a Sheet, opened by a menu button with `aria-label="Recent problems"`
  - below 768px the panes stack, with the problem pane collapsible
  - also a skip link and `header` / `nav` / `main` / `aside` landmarks
- [ ] **Step 4: Run** the same command. Expected: PASS.
- [ ] **Step 5: Commit** `feat(frontend): workspace shell, history sidebar and jump palette`.

### Task 10: Mentor panel

**Files:**
- Create: `frontend/src/components/workspace/{MentorPanel,ModeTabs,HintStepper,HintCard,AnswerView,CodeBlock,ComplexityPanel,FollowUp,RevealDialog,InlineError}.tsx`
- Test: `frontend/src/components/workspace/MentorPanel.test.tsx`

**Interfaces:**
- Consumes: `useMentorSession` (Task 7), `splitMarkdown`, `highlight` (Task 5)
- Produces:
  - `<HintStepper seen={n} current={n | null} revealed={boolean} onSelect={(i) => void} />`
  - `<CodeBlock code lang languages={['python','java','cpp']} onLanguage />`
  - `<InlineError message onRetry cooldownUntil? />`

- [ ] **Step 1: Write failing tests:**
  - `tabsShowHintCounter`: "Hints" plus "2 / 4"
  - `stepperLabels`: Nudge, Direction, Approach, Technique, Solution
  - `pastHintsDimmedCurrentWriting`: headers "read" and "writing…"
  - `revealAsksConfirmWhenHintsRemain`: the dialog text includes "skip 2 hints"
  - `revealSkipsConfirmWhenNoHintsLeft`
  - `codeBlockCopyShowsToast`: `navigator.clipboard.writeText` is called with the code
  - `wrapToggleSetsAriaPressed`
  - `complexityPanelHiddenWithoutBlock`
  - `followUpRejectsOver1000Chars`: the Ask button is disabled and a counter shows "1001 / 1000"
  - `followUpDisabledAfter10Turns`
  - `inlineErrorRetry`
  - `cooldownDisablesActionsWithCountdown`: shows "Try again in 30s"
  - `longPastedProblemShowsServerError`: an `ApiError` 400 "Problem is too long (max 12000 characters)." renders inline, and the statement is kept
  - `iSolvedItMarksSolved`: clicking "I solved it" calls `markSolved`
  - `networkFailureShowsToast`: a `TypeError` from fetch shows an inline error and a Sonner toast
  - `ariaLiveAnnouncesOnlyStartAndFinish`: the live region text is "Hint 2 ready" after done, and empty during chunks
- [ ] **Step 2: Run** `npx vitest run src/components/workspace`. Expected: FAIL.
- [ ] **Step 3: Implement** per spec section 6.
  - "Reveal solution" is the quiet text button. The dialog copy is "Reveal now and skip N hints? You can still come back to them."
  - Hint cards fade in over 150ms; the stepper fill animates over 200ms; tabs cross-fade over 120ms. All of these are disabled under reduced motion, where the caret is solid.
- [ ] **Step 4: Run** `npx vitest run`. Expected: all frontend tests PASS.
- [ ] **Step 5: Commit** `feat(frontend): mentor panel with hints, solution, follow-ups`.

### Task 11: End-to-end tests and CI

**Files:**
- Create: `frontend/playwright.config.ts`, `frontend/e2e/{landing,workspace,theme,a11y}.spec.ts`
- Modify: `.github/workflows/ci.yml` (new `e2e` job), `frontend/package.json` (`"e2e": "playwright test"`)

**Interfaces:**
- Consumes:
  - the built jar
  - the `e2e` profile (Task 3): problems 1 and 146; stub text `**Hint N:**`, `Follow-up:`, and the `complexity` block
- Playwright `webServer` command: `java -jar ../target/algomentor-0.0.1-SNAPSHOT.jar --spring.profiles.active=e2e --server.port=8091`, `baseURL` `http://localhost:8091`

- [ ] **Step 1: Write the specs**, one test per spec section 11 scenario:
  1. landing `1` → `/app?q=1` shows "Two Sum"
  2. hint 1 → hint 2, and the stepper is at 2
  3. reveal → confirm → the code block and the Time/Space panel
  4. switching to Java shows `java` in the code header
  5. a follow-up answer contains "Follow-up:"
  6. after a reload, Recent still lists "1. Two Sum"
  7. Ctrl K, then `146`, opens "LRU Cache"
  8. at 360px, the mentor panel's top is below the problem pane's top
  9. the theme toggle → dark persists across a reload, and the `dark` class is present on `domcontentloaded` (no flash)
  10. axe on `/` and `/app`, in light and dark: no `serious` or `critical` violations
- [ ] **Step 2: Run** `./mvnw -B -q package -DskipTests && cd frontend && npx playwright install chromium && npm run e2e`. Expected: 10 passed. Fix the product code, not the tests, for any failure that reflects a spec requirement.
- [ ] **Step 3: Add the CI `e2e` job:** setup-java 21, setup-node v26.12.1, `./mvnw -B package -DskipTests`, `npx playwright install --with-deps chromium`, `npm run e2e`. Upload the report as an artifact on failure.
- [ ] **Step 4: Commit** `test: Playwright end-to-end and axe checks in CI`.

### Task 12: Design review, budgets and docs

**Files:**
- Modify: whatever the review finds; `README.md` (Tech Stack, Run Locally with `npm run dev`, the theme note)

- [ ] **Step 1: Check the bundle budget.** Run `npm run build`, then sum the gzipped sizes of the JS files the landing page loads. Expected: ≤ 180 KB. If it's over, lazy-load the code responsible.
- [ ] **Step 2: Run Lighthouse** against the running jar: `npx lighthouse http://localhost:8080/ --only-categories=performance,accessibility,best-practices --chrome-flags=--headless`. Expected: ≥ 90 / 95 / 95.
- [ ] **Step 3: Run the `design:design-critique` and `design:accessibility-review` skills** on screenshots of `/` and `/app` in both themes, plus the anti-slop rules from Global Constraints. Fix every finding of medium severity or higher.
- [ ] **Step 4: Run** `./mvnw -B verify` and `npm run e2e`. Expected: all green.
- [ ] **Step 5: Commit** `chore: design review fixes, budgets verified, README`.
