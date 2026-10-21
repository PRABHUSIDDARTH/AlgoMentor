# AlgoMentor frontend redesign: design spec

Date: 2026-10-21
Status: draft for review
Scope of this spec: the overall phasing, and **Phase 1 (new frontend) in full detail**. Phases 2 and 3 get their own specs.

## 1. Intent

**What the user asked for.** A professional, learnable AlgoMentor website with a polished frontend, in the quality a senior UI/UX designer would deliver. It should use React Bits, shadcn/ui and MotionSites-style motion. Requirements:

- a navbar
- an animated, pseudo-3D data-structure hero (no three.js)
- the user's palette
- sign-in, and connections to LeetCode, HackerRank and GitHub accounts

The user explicitly rejected "AI slop" styling: no decorative pills or badges that aren't buttons, no emoji, no glows or gradient text.

**Decisions made during brainstorming.**
- Scope is a landing page plus the app.
- Visual direction is editorial and calm, typography-led, using palette v4 (section 4).
- Workspace extras: a recent-problems sidebar, starter problems, polished code blocks, a named hint stepper, and a follow-up question box.
- Sign-in is GitHub + Google OAuth only, with no email/password.
- Architecture is a React app built into the Spring Boot jar (approach A).

**Assumptions.**
- The existing API stays compatible; Phase 1 only adds to it.
- In Phase 1 there are no accounts, and history lives in localStorage.
- "Learnable" means: an obvious first action, hints that make you think before revealing, and visible progress.

**Phase 1 is done when:**
- `/` is the new landing page and `/app` is the new workspace.
- Everything the current page does still works: Explain, Hints, Solution, streaming, and LeetCode lookup by number or URL.
- The follow-up box and the four agreed extras work.
- Layouts work at 360 px, 768 px and 1280 px wide.
- No serious or critical axe violations, and all text pairs meet WCAG AA contrast.
- The app still ships as a single jar and Docker image to Cloud Run.

## 2. Phases

| Phase | Ships | Backend work |
|---|---|---|
| **1. New frontend** (this spec) | Landing `/`, workspace `/app`, follow-up questions, palette and motion | `followup` mode and `language` field on `/ask` and `/ask/stream`; SPA route forwarding; frontend build in Maven |
| 2. Sign-in | `/login` (GitHub, Google), signed-in navbar, history synced to the account | Spring Security OAuth2 client, sessions, a user and history store. The database choice (Cloud SQL Postgres vs Firestore) is decided in the Phase 2 spec. |
| 3. Connections | `/settings/connections`: GitHub (OAuth, optional save-to-repo), LeetCode (verified username, public stats), HackerRank (username, public badges) | GitHub API, LeetCode public GraphQL, HackerRank public profile |

**Phase 3 constraint, recorded now.** LeetCode and HackerRank have no third-party OAuth.
- "Connect" means linking a username. It never means logging in on the user's behalf.
- AlgoMentor never asks for LeetCode or HackerRank passwords or session cookies.
- LeetCode ownership is proven with a one-time code that the user puts in their public profile summary.

**Phase 1 placeholders for later phases.**
- The navbar has no "Sign in" link until Phase 2.
- The landing Integrations band is shown, but each card's caption reads "Coming soon" as plain text, not a badge.
- The `/login` and `/settings/connections` mockups are references for Phases 2 and 3 only.

## 3. Architecture (Phase 1)

```
frontend/                         React app (Vite + TypeScript)
  index.html
  src/
    main.tsx, App.tsx             router: "/" -> Landing, "/app" -> Workspace (lazy)
    styles/globals.css            Tailwind v4 + design tokens (section 4)
    pages/Landing.tsx
    pages/Workspace.tsx
    components/ui/                shadcn/ui (copied into repo): button, input, tabs, tooltip,
                                  command, dialog, sheet, accordion, sonner, scroll-area
    components/bits/              React Bits (copied in): SplitText, AnimatedContent
    components/landing/           Nav, Hero, DataStructureScene, HowItWorks, WorkspaceFeatures,
                                  Integrations, Faq, FinalCta, Footer
    components/workspace/         AppNav, RecentSidebar, ProblemPane, MentorPanel, ModeTabs,
                                  HintStepper, HintCard, AnswerView, CodeBlock, ComplexityPanel,
                                  FollowUp, EmptyState, JumpToProblem (Ctrl K)
    lib/api.ts                    the only module that talks to the backend
    lib/sse.ts                    POST + Server-Sent Events reader (port of the current logic)
    lib/history.ts                recent problems in localStorage (versioned, try/catch)
    lib/markdown.ts               marked + DOMPurify + highlight.js (python, java, cpp only)
    state/useMentorSession.ts     workspace state machine (section 6)
  e2e/                            Playwright tests
src/main/java/.../web/SpaController.java   forwards SPA routes to index.html
```

**Stack.** React 19, TypeScript, Vite, Tailwind CSS v4, shadcn/ui, React Bits, Motion (formerly Framer Motion), React Router, lucide-react (functional icons only, never decorative), marked, DOMPurify, highlight.js, and `@fontsource` for self-hosted Fraunces, Inter and JetBrains Mono. The three fonts are self-hosted, so there are no runtime calls to Google Fonts. Each npm package is pinned to its exact latest stable version at implementation time.

**Build.**
- `frontend-maven-plugin` installs **Node v26.12.1**, the same version installed locally with nvm. It runs `npm ci`, `npm run build` (in `generate-resources`) and `npm test` (Vitest, in `test`).
- Vite writes to `target/classes/static/`, so built files never live in `src/`.
- The hand-written `src/main/resources/static/index.html` is deleted.
- The Dockerfile copies `frontend/` into the build stage. `.dockerignore` and `.gitignore` exclude `frontend/node_modules` and `frontend/dist`.

**Routing.**
- React Router handles `/` and `/app` in the browser.
- `SpaController` forwards `/app` and `/app/**` to `index.html`, so deep links and reloads work.
- `/ask`, `/ask/stream`, `/problem` and `/actuator/**` are untouched.
- Phase 2 adds its own routes to `SpaController`.

**Development.**
- `npm run dev` in `frontend/` runs Vite on port 5173, proxying `/ask` and `/problem` to `localhost:8080`.
- `./mvnw spring-boot:run` runs the backend.

## 4. Visual system

**Palette (v4).** The user's four colours, plus one derived ink colour, because the palette has no dark tone.

| Token | Hex | Use |
|---|---|---|
| `--cream` | `#F7F2EB` | page background, problem pane, cards on sand |
| `--sand` | `#EAE2D6` | secondary surfaces: alternating section, sidebar, mentor panel, list rows |
| `--grey` | `#EEEEEE` | input fields, inline code, example blocks |
| `--sage` | `#8B9A6E` | accent: primary buttons, current hint step, visited nodes, headline highlighter |
| `--ink` | `#262C1E` (derived) | all body text, app navbar, dark band, footer, code block frame |
| `--ink-muted` | `#56613F` (derived) | secondary text, captions |
| `--line` | `#262C1E` at 12% alpha | hairlines and borders |
| `--code-bg` | `#1E2318` | code block body (keywords `#B9C49F`, strings `#D9CDB8`, comments cream at 50%) |

**Contrast (WCAG AA, verified).**

| Pair | Ratio |
|---|---|
| ink on cream | 12.90:1 |
| ink on sand | 11.19:1 |
| ink on grey | 12.38:1 |
| ink on sage (button labels) | 4.75:1 |
| muted on cream | 5.93:1 |
| muted on sand | 5.15:1 |
| cream on ink | 12.90:1 |
| light sage `#B9C49F` on ink | 7.84:1 |

Rule: **sage is never used as text on cream, sand or grey** (2.35 to 2.71:1).

**Typography.**
- Fraunces 500/600 for display headings. Letter spacing is -0.02em, or -0.03em at 40px and above.
- Inter 400/500/600 for UI and body text, at 15px for body copy and 13px in the app.
- JetBrains Mono 400/500 for code, eyebrows (11px uppercase, 0.12em tracking) and numeric labels.

**Shape and space.**
- Radius is 6px for controls and 8px for cards. There are no fully rounded "pills" except the circular hint-step markers.
- Spacing follows a 4px scale. Sections have 48px vertical padding on desktop and 32px on mobile.

**Anti-slop rules** (enforced in review):
- no emoji anywhere in the UI
- no gradient text, glows, glassmorphism or aurora backgrounds
- no badge or pill that isn't a button
- tags and metadata are plain text separated by " · "
- at most one primary (sage) button per view
- icons only where they carry meaning, such as copy, external link and search

**Theme.** A single light theme in Phase 1. A dark theme is out of scope.

## 5. Landing page `/`

Top to bottom, matching the approved mockup (palette v4):

1. **Nav** (sticky, cream, gains a hairline on scroll):
   - wordmark with a three-node mark
   - links: Workspace (`/app`), How it works, Integrations, FAQ (anchor links)
   - primary button **Get started** (`/app`)
   - on mobile, the links collapse into a Sheet
2. **Hero**, in two columns on desktop and stacked on mobile:
   - eyebrow "AI mentor for data structures & algorithms"
   - H1 "Understand the problem *before* you see the answer.", with a sage highlighter under "before". It is revealed with React Bits `SplitText`, words fading up with 40ms stagger, once.
   - lead paragraph
   - an input with a **Start solving** button: submitting goes to `/app?q=<input>`
   - "Try" links: 1. Two Sum, 146. LRU Cache, 200. Number of Islands
   - right column: `DataStructureScene`
3. **How it works** (`#how`): three numbered columns on a top rule: Bring a problem, Work through hints, Study the solution.
4. **The workspace** (sand band): three cards: progressive hints (with a mini stepper), explanations that stream, recent problems.
5. **Integrations** (`#integrations`, ink band): GitHub, LeetCode and HackerRank cards, each captioned "Coming soon" in light sage mono text.
6. **FAQ** (`#faq`, shadcn Accordion):
   - Is it free?
   - Will it just give me the answer?
   - Which languages are supported?
   - Can it fetch Premium problems?
7. **Final CTA**: "Your next problem is one number away." with the same Start solving input.
8. **Footer** (ink): wordmark, GitHub, Privacy, "Built by psTech".

**`DataStructureScene`.**
- **Projection.** Built with Motion and CSS 3D (`perspective: 1100px`, `transform-style: preserve-3d`). The stage sways between `rotateX(14deg) rotateY(-22deg)` and `rotateX(8deg) rotateY(22deg)` over 14s, alternating.
- **Layers, each at its own Z depth:**
  - a binary tree (7 nodes, SVG edges) whose nodes light up in breadth-first order, sage with ink label, on an 8.4s loop
  - a sorted array with two pointers converging
  - a stack with a push
  - a linked list with a head highlight
- **Caption:** "breadth-first traversal · two pointers · stack push · linked list" in mono.
- **Behaviour:** the scene pauses when off-screen (IntersectionObserver). With `prefers-reduced-motion: reduce` it renders a static frame with BFS frozen at step 3.
- **Accessibility:** the scene is `aria-hidden` and has a visually hidden text alternative.

## 6. Workspace `/app`

**Layout.** App navbar (ink), then three panes at 1200px and wider:
- Recent sidebar, 210px, sand
- Problem pane, cream
- Mentor panel, sand

From 768 to 1199px the sidebar moves into a Sheet, opened from the navbar. Below 768px the panes stack, with the problem collapsible above the mentor.

**App navbar.**
- wordmark (links to `/`)
- Workspace (active, with a sage underline)
- a Jump to problem field with a `Ctrl K` hint, which opens a shadcn `Command` dialog listing recent problems plus "Open LeetCode #n" for numeric input
- Progress and Connections links are not shown in Phase 1

**Empty state** (no `?q=` and no active problem):
- "What are we solving today?"
- an input (number, link or pasted text) with a primary **Start** button
- starter problems as clickable list rows grouped by pattern:
  - Arrays and hashing: 1, 49
  - Linked lists and design: 206, 146
  - Graphs: 200, 207

**Problem pane.**
- title in Fraunces
- a meta line: difficulty, topic tags joined by " · ", View on LeetCode, Edit statement
- the statement rendered as Markdown
- "Edit statement" turns the pane into a textarea, and saving resets the session for that problem
- pasted (custom) problems are titled "Custom: <first 40 characters>"

**Mentor panel.**
- **Tabs:** Explain, Hints (with an `n / 4` counter), Solution. Switching tabs keeps each tab's content for the current problem.
- **HintStepper:** five markers labelled **Nudge, Direction, Approach, Technique, Solution**.
  - Seen steps are filled with ink. The current step is sage with a ring. The Solution marker has a dashed outline until it is revealed.
  - Clicking a seen marker scrolls to that hint.
- **Hint cards:**
  - past hints are dimmed, and their header reads "read"
  - the current hint streams in with a blinking ink caret, and its header reads "writing…"
- **Actions:**
  - **Next hint** (primary)
  - **I solved it** (secondary): marks the problem solved in history
  - **Reveal solution** (quiet text button): if hints remain, a confirmation dialog says "Reveal now and skip N hints? You can still come back to them."
- **Solution tab:**
  - **AnswerView** renders the explanation.
  - **CodeBlock** has an ink header with the language name; Java / Python / C++ switches; Wrap and Copy buttons; and line numbers.
    - Switching language requests that language (see `language` in section 7). Results are cached per language for the session.
    - Copy uses `navigator.clipboard` and confirms with a toast.
  - **ComplexityPanel** shows Time and Space, parsed from a fenced `complexity` block the prompt asks the model to include. If that block is missing, the panel is hidden and the text still shows.
- **FollowUp:**
  - an input "Ask a follow-up, e.g. "why not an array?"" with an **Ask** button (ink)
  - the thread renders under the active tab's content
  - limits: 10 turns (a turn is one question and its answer, so 20 conversation entries), and 1,000 characters per question
- **Streaming status** is announced via an `aria-live="polite"` region only when an answer starts and finishes ("Hint 2 ready"), never per chunk.

**Session state** (`useMentorSession`, one per problem): `problem`, `tab`, `hints[]`, `explain`, `solution{lang -> text}`, `followups[]`, `status`, `error`. Status moves between these states:

```
idle -> loadingProblem -> ready -> streaming(tab) -> ready
                                 \-> error(tab)  (Retry re-issues the last request)
```

Only one stream runs at a time. Starting a new request aborts the previous one with an `AbortController`.

**History** (`lib/history.ts`).
- Stored in localStorage under the key `algomentor.recent.v1`, as an array of at most 30 entries, newest first:
  ```
  { key, source: "leetcode" | "custom", number?, slug?, title, difficulty?, statement (custom only),
    status: "started" | "hints" | "explained" | "solution" | "solved", hintsUsed, hints[], updatedAt }
  ```
- `key` is the LeetCode slug, or a hash of the custom statement.
- Every read and write is wrapped in try/catch. If storage is unavailable the sidebar shows "History is off in this browser", and the app keeps working.
- Sidebar rows show the title, a 1–3 segment difficulty marker, and a status line: "Hint 2 of 4", "Solution viewed", "Explained", "Solved", or "Pasted · 2 hints".

**Keyboard shortcuts.** `Ctrl/Cmd+Enter` submits the focused input. `Ctrl/Cmd+K` opens Jump to problem. Every control is reachable with Tab, with a visible 2px ink focus ring offset 2px.

## 7. Backend changes (Phase 1)

1. **`language` field.**
   - `/ask` and `/ask/stream` accept `"language": "python" | "java" | "cpp"`, which defaults to `python`.
   - It's used by `solution` mode: "Give the optimal solution with code in <Language> …".
   - The solution prompt also asks for a final fenced block:
     ```complexity
     time: O(...) | <short reason>
     space: O(...) | <short reason>
     ```
2. **`followup` mode.**
   - Request body: `{ problem, mode: "followup", previousHints, conversation: [{role: "user" | "mentor", text}], question, solutionRevealed }`.
   - Limits: `question` must be non-blank and at most 1,000 characters, `conversation` at most 20 entries, each entry at most 6,000 characters. Anything else is rejected with a 400 and a JSON `{error}`.
   - The prompt answers only in the context of the problem.
   - When `solutionRevealed` is false, the prompt tells the model not to give full code or the complete solution, and to keep guiding.
3. **`SpaController`.** Forwards `GET /app` and `/app/**` to `/index.html`.
4. **`e2e` Spring profile** (test use only):
   - a `StubAnswerGenerator` that streams deterministic canned text per mode, in several chunks; its `solution` text includes a code fence and the `complexity` block
   - a `StubLeetCodeClient` with fixed data for problems 1 and 146
   - never active by default

Existing request and response shapes are unchanged, so the current UI and API clients keep working.

## 8. Errors and edge cases

- Every API error renders inline in the pane that made the request, with the server's `{error}` text and a **Retry** button. Network failures also raise a Sonner toast.
- A stream that ends without `done` keeps the partial text, appends "The answer was cut off." and offers **Retry**.
- LeetCode lookup errors (not found, Premium, unreachable) show under the problem input. The input keeps its value.
- A rate limit (429) shows the server message and disables the action buttons for 30 seconds, with a countdown.
- Reveal solution while hints remain always goes through the confirmation dialog.
- `/app?q=` with an unparseable value is treated as a pasted problem.

## 9. Motion

- **Library:** Motion for all animation. React Bits `SplitText` for the hero headline and `AnimatedContent` for section reveals: fade plus 12px rise, 400ms, ease-out, once per section, triggered at 15% visibility.
- **App motion:** functional only. Hint cards enter with a 150ms fade; the stepper fill animates 200ms; tab content cross-fades in 120ms. Nothing loops in `/app` except the streaming caret.
- **Reduced motion:** `prefers-reduced-motion` disables every transform and loop. The caret is shown solid, not blinking.

## 10. Accessibility and performance

- WCAG 2.1 AA: the contrast table in section 4, semantic landmarks (`header`, `nav`, `main`, `aside`), and a skip link.
- Tabs, dialogs and the command palette come from shadcn (Radix), which provides focus management. Every icon-only button has an `aria-label`.
- The landing page's initial JS bundle is at most 180 KB gzipped. `/app` is lazy-loaded. highlight.js registers only python, java and cpp. Fonts are subset to Latin with `font-display: swap`.
- Lighthouse targets on `/`: Performance 90 or higher, Accessibility 95 or higher, Best Practices 95 or higher.

## 11. Testing

- **Vitest + Testing Library:**
  - `sse.ts`: chunk splitting, CRLF handling, the `error` event, a stream cut off without `done`
  - `api.ts`: maps HTTP errors to `{error}`, aborts
  - `history.ts`: the 30-entry cap, ordering, storage throwing
  - `useMentorSession`: hint sequencing, the reveal confirmation, language caching
  - `HintStepper` rendering per state
- **Playwright** (`e2e` profile, Chromium):
  1. landing input `1`, then `/app?q=1`, which shows Two Sum
  2. hint 1, Next hint, hint 2, the stepper at 2
  3. Reveal, confirm, the Solution tab with code and the complexity panel
  4. switch language to Java, which issues a new request
  5. a follow-up answer appears
  6. reload `/app`, and Recent still lists Two Sum
  7. Ctrl K opens the palette, and "146" opens LRU Cache
  8. at 360px width the panes stack
  9. `@axe-core/playwright` on `/` and `/app` finds no serious or critical violations
- **JUnit:** `language` prompt selection, `followup` validation and the solutionRevealed rule, and `SpaController` forwarding. Existing tests stay green.
- **CI:**
  - the existing job runs `./mvnw -B verify`, which now builds the frontend and runs Vitest
  - a new `e2e` job builds the jar, starts it with `--spring.profiles.active=e2e`, installs Playwright Chromium and runs the e2e suite
- **Design review before merge:** run the design-critique and accessibility-review skills against the built pages, and fix anything they find.

## 12. Out of scope for Phase 1

Accounts and sign-in, the `/login` page, the Connections page, the Progress page, server-side history, dark theme, internationalisation, any analytics or tracking, and changes to rate limits or the Gemini model configuration.

## 13. Reference mockups

The approved visual mockups are in `.superpowers/brainstorm/` (git-ignored). The final versions are `palette-v4.html` (landing, sign-in, connections, workspace) and `workspace.html` (layout reference). Wherever this spec and the mockups disagree, this spec wins.
