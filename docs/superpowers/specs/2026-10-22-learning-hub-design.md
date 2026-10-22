# AlgoMentor Learning hub: design spec

Date: 2026-10-22
Status: written spec for review
Covers sub-projects 5–7 of the expansion: core CS learning (OOP, Computer Networks, DBMS), section projects, real-repo Git practice, and resume projects. It builds on the Practice hub spec (`2026-10-22-practice-hub-design.md`) for navigation, Settings, storage conventions and the Level page.

## 1. Intent

**What the user asked for:**
- Pages to learn OOP, networks and DBMS, with projects to complete for each section "so that he can make his git into an glory".
- Git learning where users **make their own commits in the OOP-based projects, without any intervention of AI models, resolving their own Git issues and fixing their own repo**. This is explicitly not a simulated lab.
- Resume projects that get candidates shortlisted.
- Everything in one place, so learners never go hunting for tools.

**Decisions made in conversation:**
- **Content:** written once by us as structured files in the repo and reviewed like code. Nothing is generated at runtime. Quizzes are graded without AI.
- **GitHub checks:** a **server-side read-only token** (`GITHUB_TOKEN`, fine-grained, public-repo read only) gives 5,000 calls per hour. Users never sign in to GitHub for this.
- **Storage:** this browser (localStorage), as in the Practice hub.

**Done when:**
- `/learn` offers OOP, Networks and DBMS tracks (about 10 modules each) with lessons, diagrams, code and auto-graded quizzes.
- Each track has 3 projects with specs and Git milestones.
- There are 10 Git challenges, verified against the user's public repo, with no AI anywhere on Git pages.
- There's a resume projects catalogue with a "make your GitHub shine" checklist verified by the same checks.
- The Level page shows Core CS readiness.
- Everything meets the same accessibility, theme and responsive bar as the Practice hub.

## 2. Structure

**Routes:**
- `/learn`: the three track cards, with progress and "continue".
- `/learn/:track`: the module list and the track's projects.
- `/learn/:track/:module`: the lesson page.
- `/projects/:projectId`: the project spec, milestones and linked repo.
- `/git`: the Git challenges.
- `/git/:challengeId`: one challenge.
- `/resume`: resume projects.
- The **Learn** item in the app navbar opens `/learn`, with a sub-nav of OOP · Networks · DBMS · Git · Resume projects.

**Content files** live in `frontend/src/content/learn/` as typed TypeScript modules:
- one file per track
- `projects.ts`
- `git-challenges.ts`
- `resume-projects.ts`

**Content types:**

```ts
type Lesson = { id: string; title: string; minutes: number; body: string /* Markdown */; diagram?: string /* inline SVG component id */;
  code?: { java: string; python: string; cpp: string }; quiz: QuizQuestion[]; interview: { q: string; a: string }[] }
type QuizQuestion = { id: string; prompt: string; options: string[]; answer: number; why: string }
type Track = { id: 'oop' | 'cn' | 'dbms'; title: string; summary: string; modules: Lesson[]; projects: string[] /* project ids */ }
```

A content test enforces the structure:
- unique IDs
- 5 quiz questions per module
- `answer` within range
- every module has at least 2 interview questions
- OOP code is present in all three languages

## 3. Tracks and modules (original content)

**OOP** (10 modules):
1. Classes & objects
2. Encapsulation
3. Inheritance
4. Polymorphism (overloading and overriding)
5. Abstraction & interfaces
6. SOLID
7. Composition over inheritance
8. Core design patterns: Singleton, Factory, Strategy, Observer, Decorator
9. UML class diagrams
10. OOP in interviews: designing a parking lot or library, step by step

**Computer Networks** (10 modules):
1. Models (OSI and TCP/IP)
2. Physical & data link basics
3. IP addressing & subnetting
4. Routing basics
5. TCP vs UDP (handshake, flow and congestion control)
6. DNS
7. HTTP/HTTPS & TLS
8. Sockets
9. CDNs, load balancers & NAT
10. "What happens when you type a URL"

**DBMS** (10 modules):
1. Data models & ER diagrams
2. Relational model & keys
3. SQL fundamentals
4. Joins & subqueries
5. Normalisation (1NF–BCNF)
6. Transactions & ACID
7. Concurrency control & isolation levels
8. Indexing (B+ trees, hashing)
9. Query processing & optimisation
10. NoSQL & CAP

**Lesson page:**
- reading time
- the lesson in Markdown, through the existing safe renderer
- a diagram (inline SVG using palette tokens, aria-labelled)
- code tabs (Java/Python/C++, reusing `CodeBlock`)
- **Check yourself:** 5 MCQs, instant feedback with the "why", score saved
- **Interview questions:** an accordion
- "Mark complete" and next/previous module
- No AI on lesson pages, so the mentor panel is absent there.

**Progress:** stored under `algomentor.learn.v1` as `{ [moduleId]: { completedAt?, bestQuiz: 0..5, reviewStep, nextReviewAt } }`.
- A module completes at quiz ≥ 4/5 plus "Mark complete".
- **Integration with Today:** the Practice hub's "Concept refresher" also draws from completed modules due for review. Their review is a 3-question re-quiz.

## 4. Projects for each section

**Three per track:**

| Track | Beginner | Intermediate | Advanced |
|---|---|---|---|
| OOP | Library manager (classes, encapsulation, collections) | Parking lot system (inheritance, Strategy/Factory, tests) | Expense splitter (SOLID, Observer, persistence) |
| Networks | TCP chat server and client (sockets, threads) | HTTP/1.1 server from scratch (parsing, static files, keep-alive) | DNS resolver (UDP, recursive resolution, caching) |
| DBMS | E-commerce schema plus 15 SQL challenges (ER → tables → queries) | Mini key-value store with a write-ahead log and crash recovery | B+ tree index with a query-plan comparison report |

**Each project has:**
- goal
- what it proves
- requirements (must have)
- stretch goals
- suggested stack (any language)
- acceptance checklist
- **Git milestones:** the challenges from §5 that fit naturally into this project. For example, the Library manager needs challenges 1–3, and the Parking lot adds 4–6.

**Linking:** the user links a public repo (`github.com/<owner>/<repo>`) on the project page. The project page shows each milestone's live check status.

## 5. Git practice: real repos, no AI

**Rules:**
- Git pages (`/git`, `/git/:id`, and the Git section of project pages) **never call Gemini and never show the mentor panel**.
- Help is limited to:
  - the challenge brief
  - a static cheat sheet of the commands relevant to that challenge
  - links to the official Git documentation (git-scm.com)
- Verification checks repository state only. It never inspects or suggests code.

**The 10 challenges, with the check for each:**

| # | Challenge | Passes when (GitHub API) |
|---|---|---|
| 1 | First commit and push | The repo exists, has ≥ 1 commit by the repo owner and a README |
| 2 | Meaningful commits | At least 5 commits whose subjects are 10–72 characters, imperative, and not "update"/"fix"/"wip" alone |
| 3 | Feature branch + PR | At least one merged pull request from a non-default branch |
| 4 | Resolve a merge conflict | Setup script `conflict.sh`: the default branch has a merge commit (2 parents) touching the scripted file, with no conflict markers left in it |
| 5 | Squash with interactive rebase | Setup script `squash.sh`: the `feature/squash` branch, as pushed, has exactly 1 commit on top of the scripted base, with message `Add squash feature` |
| 6 | Revert a bad commit | Setup script `bad-commit.sh`: the default branch contains a commit whose message starts with `Revert "` and refers to the scripted commit's SHA |
| 7 | Recover a deleted branch | Setup script `lost-branch.sh` deletes `feature/rescue` locally: the branch exists on GitHub and contains the scripted commit |
| 8 | Cherry-pick a hotfix | Setup script `hotfix.sh`: the scripted commit's change exists on the default branch as a cherry-picked commit (same patch, different SHA) |
| 9 | Tag a release | An annotated tag `v1.0.0` (or later semver) exists, plus a GitHub Release |
| 10 | Remove a committed secret | Setup script `secret.sh` commits a fake key file: no commit reachable from any branch contains that file (history rewritten), and `.gitignore` covers it |

**Setup scripts:**
- Served as static files under `/git-challenges/<name>.sh` (bash; PowerShell versions `.ps1` for Windows).
- Each **works only inside the user's own repo clone**. It refuses to run outside a Git work tree or on a dirty tree.
- Each writes a small marker file (`.algomentor/<challenge>.json`) with the base SHA, so the check knows the starting point.
- Each prints what it changed.
- Scripts never touch remotes or credentials, and never push.

**Verification backend:**
- `GET /git/check/{owner}/{repo}/{challengeId}` returns `{ passed, details: [{ok, text}] }`. It uses GitHub REST with `GITHUB_TOKEN`, and results are cached for 2 minutes per repo and challenge.
- `owner` and `repo` are validated against `^[A-Za-z0-9-_.]{1,100}$`. Private or missing repos return "Make the repository public to verify it."
- Without `GITHUB_TOKEN` the API still works, at the 60 calls/hour limit. An exceeded limit returns 503 with "GitHub checks are busy, try again in a few minutes."

## 6. Resume projects

`/resume` is a catalogue of about 12 projects, filterable by target (FAANG/product, startup, service) and role. Examples:
- a real-time collaborative editor (CRDTs)
- a URL shortener with analytics at scale
- a distributed rate limiter
- a job queue with retries
- a search engine over a dataset
- a payments ledger with double-entry and idempotency
- a mini Git (object store, commits, branches)
- a container-less sandboxed code runner

**Each entry has:**
- what it proves
- core features
- stretch goals
- tech choices
- **how to write the resume bullet,** with a template and an example using numbers
- a **"Make your GitHub shine" checklist,** verified via the same backend (`GET /git/repo-health/{owner}/{repo}`):
  - README with sections
  - at least one image or GIF in the README
  - tests directory
  - CI workflow
  - license
  - topics set
  - homepage/demo link
  - ≥ 20 meaningful commits
  - a release tag

## 7. Core CS readiness

`/level` gains a **Core CS readiness** meter next to DSA readiness.

| Component | Weight |
|---|---|
| Modules completed (weighted by target: service companies weigh DBMS and CN higher) | 40 |
| Mean best quiz score | 30 |
| Projects with all milestones verified | 20 |
| Git challenges passed | 10 |

Each target has a bar: FAANG / product 70, startup 60, service 75. The page shows the top 3 gaps, as in the Practice hub. The overall readiness shown on the Today page is the lower of DSA and Core CS readiness, because interviews test both.

## 8. Errors, accessibility, testing

**Errors:**
- GitHub failures show on the check card and never block lessons.
- Corrupt `algomentor.learn.v1` / `algomentor.git.v1` storage is ignored (strict validation).

**Accessibility:**
- Quizzes are radio groups with labelled feedback.
- Diagrams have text alternatives.
- Code tabs reuse the accessible `CodeBlock`.

**Testing:**
- **Unit:**
  - content structure tests
  - quiz grading
  - module progress and review scheduling
  - readiness maths
  - the commit-message rule for challenge 2
- **Backend:** each challenge check against `MockRestServiceServer` fixtures (passing and failing repos), the token/no-token paths, validation and caching.
- **Scripts:** a CI job runs each setup script in a temporary repo and asserts the broken state it creates, plus refusal outside a repo and on a dirty tree.
- **e2e:**
  - open a lesson, pass its quiz, see it complete
  - link a repo and see a stubbed check pass and fail (`e2e` profile with a stub GitHub client)
  - Git pages make no `/ask` calls (network assertion)
  - axe on all new routes

## 9. Out of scope

- Operating systems and other subjects (OS can follow as a fourth track).
- Private repos.
- Code review of project code.
- AI help on Git pages (excluded by requirement).
- Plagiarism checks.
