# AlgoMentor Learning Hub Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add core CS learning (OOP, Computer Networks, DBMS), projects for each track, real-repo Git challenges verified through the GitHub API with no AI anywhere on Git pages, a resume-projects catalogue, and Core CS readiness.

**Architecture:**
- **Content:** static, typed and original, in `frontend/src/content/learn/`.
- **Pages:** new routes `/learn`, `/learn/:track`, `/learn/:track/:module`, `/projects/:projectId`, `/git`, `/git/:challengeId` and `/resume`, reusing `AppShell`, `CodeBlock` and the safe Markdown renderer.
- **Backend:** a `github` package checks public repository state with a server-side read-only `GITHUB_TOKEN`. Challenge setup scripts are static files.
- **Storage:** progress in localStorage, as in the Practice hub.

**Tech Stack:** Spring Boot 4 (RestClient, Caffeine), React 19 + TypeScript, Vitest, Playwright + axe, bash/PowerShell setup scripts.

**Spec:** `docs/superpowers/specs/2026-10-22-learning-hub-design.md` (and the Practice hub spec for shared conventions).

## Global Constraints

- **Storage keys:** `algomentor.learn.v1` (module progress) and `algomentor.git.v1` (linked repos and passed challenges per project or challenge). Both are strictly validated on read.
- **Module completion:** quiz ≥ 4/5 **and** "Mark complete". Completed modules join spaced review (1, 3, 7, 21, 60 days) as a 3-question re-quiz on Today.
- **Content rules:**
  - every lesson is original, with exactly 5 quiz questions and ≥ 2 interview Q&As
  - OOP modules carry code in Java, Python and C++
  - diagrams are inline SVG using palette tokens, with `aria-label`
- **No AI on Git pages:** `/git`, `/git/:id` and the project page's Git section never call `/ask` and never render the mentor panel. The e2e suite asserts no `/ask` request.
- **GitHub:**
  - `GITHUB_TOKEN` comes from the environment (optional; without it, the 60 calls/hour public limit applies)
  - owner/repo match `^[A-Za-z0-9-_.]{1,100}$`
  - checks are cached for 2 minutes per repo + challenge
  - errors: 404 "Make the repository public to verify it.", 503 "GitHub checks are busy, try again in a few minutes.", 502 for anything unexpected
- **Setup scripts:**
  - served at `/git-challenges/<name>.sh` and `.ps1`
  - refuse to run outside a Git work tree or on a dirty tree
  - write `.algomentor/<challenge>.json` with the base SHA
  - never push and never touch remotes or credentials
- **Core CS readiness weights:** modules 40 (target-weighted: service weighs DBMS and CN ×1.5), quiz 30, projects 20, Git 10. Bars: FAANG/product 70, startup 60, service 75. Today shows `min(DSA readiness, Core CS readiness)`.
- **UI rules:** the Phase 1 and Practice hub UI rules apply unchanged.
- **Commits** end with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Review Focus

1. **A linked repo is renamed, deleted or made private after a challenge passed.** The page keeps the earlier "passed" record (with the date), shows the current check as failing with the 404 message, and never crashes (Task 6 test `privateAfterPassKeepsRecord`).
2. **A setup script run twice, or after the learner already fixed the repo.** The script refuses on a dirty tree, and on a second run detects its marker file and says so instead of corrupting history (Task 2 script test `refusesSecondRun`).
3. **Default branch named `master` or `develop`, not `main`.** Checks use the repo's real default branch from the API (Task 1 test `usesDefaultBranchFromApi`).
4. **A learner pastes `https://github.com/owner/repo.git`, `git@github.com:owner/repo.git` or a URL with `/tree/main`.** All parse to owner/repo, and anything else gets a format error (Task 6 test `parsesRepoUrlVariants`).
5. **A quiz answered by keyboard only, and screen-reader feedback.** Radio groups are labelled, feedback is announced, and "Check answers" stays disabled until all 5 are answered (Task 3 test `quizKeyboardAndFeedback`).

---

### Task 1: Backend GitHub checks

**Files:**
- Create in `src/main/java/com/pstech/algomentor/github/`:
  - `GitHubClient.java`
  - `GitChecks.java` (one method per challenge)
  - `RepoHealth.java`
  - `GitController.java`
  - `GitHubConfig.java`
- Create: `src/main/java/com/pstech/algomentor/e2e/StubGitHubConfig.java`
- Modify: `WebConfig.java` (add `/git/**` to `problemGuard`), `application.properties` (`algomentor.github.token=${GITHUB_TOKEN:}`)
- Test: `src/test/java/com/pstech/algomentor/github/{GitChecksTests,RepoHealthTests,GitControllerTests}.java` with JSON fixtures under `src/test/resources/github/`

**Interfaces:**
- Produces:
  - `record CheckResult(boolean passed, List<Detail> details)`, with `record Detail(boolean ok, String text)`
  - `GET /git/check/{owner}/{repo}/{challengeId}` returns `CheckResult`, where `challengeId` ∈ `first-commit, meaningful-commits, feature-pr, merge-conflict, squash, revert, rescue-branch, cherry-pick, release, remove-secret`
  - `GET /git/repo-health/{owner}/{repo}` returns `CheckResult` (README sections, an image in the README, tests dir, CI workflow, license, topics, homepage, ≥ 20 meaningful commits, a release tag)
  - `GitHubClient`: `repo(owner, repo)`, `commits(owner, repo, branch, perPage≤100)`, `pulls(owner, repo, state=closed)`, `tags`, `releases`, `contents(path, ref)`, `tree(ref, recursive)`, `compare(base, head)`, all reading the default branch from `repo()`
  - Marker-based checks (4–8, 10) read `.algomentor/<challenge>.json` from the default branch for the base SHA

- [ ] **Step 1: Write fixtures** (trimmed GitHub REST shapes for repo, commits, pulls, tags, releases, contents, tree, compare), then failing tests:
  - `firstCommitPassesWithReadmeAndOwnerCommit`
  - `meaningfulCommitsRule` (subject 10–72 chars, not just "update"/"fix"/"wip", case-insensitive, ≥ 5)
  - `featurePrNeedsMergedPrFromNonDefaultBranch`
  - `mergeConflictNeedsTwoParentMergeTouchingFileWithoutMarkers`
  - `squashNeedsExactlyOneCommitOnBase`
  - `revertNeedsRevertOfScriptedSha`
  - `rescueBranchExistsWithScriptedCommit`
  - `cherryPickSamePatchDifferentSha`
  - `releaseNeedsAnnotatedSemverTagAndRelease`
  - `removeSecretNoReachableCommitContainsFileAndGitignoreCovers`
  - `usesDefaultBranchFromApi`
  - `privateRepoIsNotFoundMessage`
  - `rateLimitedIs503`
  - `tokenSentWhenConfigured`
  - `rejectsInvalidOwnerRepo`
  - `cachesTwoMinutes`
  - `repoHealthItems`
- [ ] **Step 2: Run** `env -u GEMINI_API_KEY ./mvnw -B -q test -Dfrontend.skip=true -Dtest='Git*Tests,RepoHealthTests'`. Expected: FAIL.
- [ ] **Step 3: Implement.**
  - The client uses `Authorization: Bearer` when the token is set, and `X-GitHub-Api-Version: 2022-11-28`.
  - 403 or 429 with `x-ratelimit-remaining: 0` gives 503.
  - The meaningful-commit rule lives in one static method shared with repo health.
- [ ] **Step 4: Run** the backend suite. Expected: PASS.
- [ ] **Step 5: Commit** `feat(api): GitHub repo checks for Git challenges and repo health`.

### Task 2: Git challenge setup scripts

**Files:**
- Create: `frontend/public/git-challenges/{conflict,squash,bad-commit,lost-branch,hotfix,secret}.{sh,ps1}`
- Create: `scripts/test-git-challenges.sh`
- Modify: `.github/workflows/ci.yml` (job `git-scripts` runs the test script on ubuntu)

**Interfaces:**
- Produces:
  - Each script prints what it changed and writes `.algomentor/<challenge>.json` = `{ "challenge": "<id>", "baseSha": "<sha>", "createdAt": "<iso>" }`, committed on the default branch first so the backend can read it.
  - Scenario per challenge, matching `GitChecks`:
    - **conflict:** two branches editing the same lines of `conflict.txt`
    - **squash:** `feature/squash` with 4 WIP commits
    - **bad-commit:** a commit that breaks `app.txt`
    - **lost-branch:** creates then deletes `feature/rescue` locally
    - **hotfix:** a fix commit on `hotfix/fix-typo`
    - **secret:** commits `config/secret.key`

- [ ] **Step 1: Write `scripts/test-git-challenges.sh`.** For each script, in a fresh temp repo with one commit, run it and assert the broken state:
  - merge conflict on `git merge`
  - 4 commits on `feature/squash`
  - the bad commit exists
  - `feature/rescue` is absent but its commit is reachable in the reflog
  - the hotfix commit is not on main
  - the secret file is in history
  - the marker JSON is valid

  Also assert `refusesOutsideRepo`, `refusesDirtyTree` and `refusesSecondRun` (exit code ≠ 0 with a clear message).
- [ ] **Step 2: Run** `bash scripts/test-git-challenges.sh`. Expected: FAIL (scripts missing).
- [ ] **Step 3: Implement** the bash scripts (`set -euo pipefail`, guard checks first), and the PowerShell equivalents with the same steps.
- [ ] **Step 4: Run** `bash scripts/test-git-challenges.sh`. Expected: PASS. Then run the full end-to-end check of challenges 4–8 and 10: script → fix by hand → the Task 1 rule passes against a `git log` dump. This is a local smoke test; record the outcome in the ledger.
- [ ] **Step 5: Commit** `feat: Git challenge setup scripts with tests`.

### Task 3: Learn framework: routes, lesson page, quiz, progress

**Files:**
- Create:
  - `frontend/src/content/learn/types.ts`
  - `frontend/src/learn/{progress,quiz}.ts`
  - `frontend/src/pages/{Learn,LearnTrack,Lesson}.tsx`
  - `frontend/src/components/learn/{TrackCard,ModuleList,Quiz,InterviewQuestions,LearnNav}.tsx`
- Modify:
  - `App.tsx` (routes)
  - `AppNav.tsx` (Learn link)
  - `SpaController` (`/projects/**`, `/git`, `/git/**`, `/resume`)
  - `frontend/src/practice/daily.ts` (refresher may be a due module re-quiz)
- Test:
  - `frontend/src/learn/{progress,quiz}.test.ts`
  - `frontend/src/pages/Lesson.test.tsx`
  - `SpaControllerTests.forwardsLearnRoutes`

**Interfaces:**
- Produces:
  - Types from spec §2: `Lesson`, `QuizQuestion`, `Track` (`id: 'oop' | 'cn' | 'dbms'`)
  - `TRACKS: Track[]` (assembled from Tasks 4–6 files; Task 3 ships one sample module per track, which later tasks replace)
  - `gradeQuiz(questions, answers: number[]): { score: number; results: boolean[] }`
  - `ModuleProgress = { completedAt?: number; bestQuiz: number; reviewStep: number; nextReviewAt: number | null }`
  - `loadLearn()`, `recordQuiz(moduleId, score, now)`, `markModuleComplete(moduleId, now)` (allowed only at bestQuiz ≥ 4)
  - `dueModules(now)`
  - event `algomentor:learn`
- Today's refresher, when a module is due, is `{ kind: 'refresher', moduleId }`, rendered as a 3-question re-quiz.

- [ ] **Step 1: Write failing tests:**
  - `gradeQuiz`
  - `completeNeedsFourOfFive`
  - `completedModuleSchedulesReview`
  - `ignoresUnknownModules`
  - `quizKeyboardAndFeedback` (radios are reachable by keyboard; Check is disabled until all are answered; results announced in `aria-live`, e.g. "4 of 5 correct")
  - `lessonRendersMarkdownDiagramCodeTabsAndInterview`
  - `noMentorPanelOnLessons`
  - `nextPreviousNavigation`
  - `learnHubShowsThreeTracksWithProgress`
  - `todayRefresherCanBeADueModule`
- [ ] **Step 2: Run** `npx vitest run src/learn src/pages/Lesson.test.tsx`. Expected: FAIL.
- [ ] **Step 3: Implement.**
  - The lesson layout gives the reading column a max width of 72ch on the left, and on xl a sticky right rail with the module list and quiz score.
  - Code tabs reuse `CodeBlock`, with languages Java, Python and C++.
- [ ] **Step 4: Run** `fe-test.sh`. Expected: PASS. Take screenshots at 1440 light and 390 dark.
- [ ] **Step 5: Commit** `feat(frontend): learn hub, lesson pages and quizzes`.

### Tasks 4–6: Track content (OOP, Computer Networks, DBMS)

One task per track, same steps. Files: `frontend/src/content/learn/{oop,cn,dbms}.ts`, plus diagrams in `frontend/src/components/learn/diagrams/{track}/*.tsx`.

**Interfaces:** each exports `Track` with 10 modules, in the order given in spec §3. Each module has:
- body: Markdown, 400–900 words, original
- quiz: exactly 5 questions with a `why` each
- interview: 2–4 Q&As
- diagram: at least every other module
- code: OOP only, all 3 languages

- [ ] **Step 1: Extend the content test** (`frontend/src/content/learn/learn.test.ts`):
  - `tenModulesInSpecOrder`
  - `bodyLength400to900Words`
  - `fiveQuizQuestionsAnswerInRange`
  - `whyExplainsEveryAnswer`
  - `interviewTwoToFour`
  - `oopHasThreeLanguages`
  - `diagramsHaveAriaLabel`
  - `noDuplicateIds`
- [ ] **Step 2: Run** `npx vitest run src/content/learn`. Expected: FAIL for the new track.
- [ ] **Step 3: Write the track's content.**
  - OOP code samples must compile: run `javac`/`python -m py_compile`/`g++ -fsyntax-only` on extracted snippets with `scripts/check-oop-snippets.sh` (created in Task 4), which runs in CI.
- [ ] **Step 4: Run** the content tests and `fe-test.sh`. Expected: PASS.
- [ ] **Step 5: Commit** `feat(content): <track> lessons, quizzes and interview questions`.

### Task 7: Projects for each section

**Files:**
- Create:
  - `frontend/src/content/learn/projects.ts`
  - `frontend/src/learn/repos.ts`
  - `frontend/src/pages/Project.tsx`
  - `frontend/src/components/learn/{RepoLink,MilestoneList,CheckCard}.tsx`
- Modify: `frontend/src/lib/api.ts` (`checkGit(owner, repo, challengeId)`, `repoHealth(owner, repo)`)
- Test: `frontend/src/learn/repos.test.ts`, `frontend/src/pages/Project.test.tsx`

**Interfaces:**
- Produces:
  - `Project = { id, track, level: 'beginner' | 'intermediate' | 'advanced', title, goal, proves: string[], requirements: string[], stretch: string[], stack: string, acceptance: string[], gitMilestones: ChallengeId[] }`
  - 9 projects per spec §4
  - `parseRepoUrl(input): { owner; repo } | { error }`
  - `linkRepo(projectId, owner, repo)`
  - `recordCheck(key, result, now)`
  - `loadGit()`

- [ ] **Step 1: Write failing tests:**
  - `parseRepoUrlVariants` (https, `.git`, ssh, `/tree/main`, trailing slash; other hosts give an error)
  - `projectPageShowsSpecAndMilestones`
  - `linkRepoAndRunChecksShowsPerMilestoneStatus`
  - `privateAfterPassKeepsRecord`
  - `projectPageHasNoMentorPanel`
- [ ] **Step 2: Run** the tests. Expected: FAIL.
- [ ] **Step 3: Implement.**
  - Spec text is written by us.
  - The milestones list links each challenge to `/git/:id`.
- [ ] **Step 4: Run** `fe-test.sh`. Expected: PASS.
- [ ] **Step 5: Commit** `feat(frontend): track projects with linked-repo milestones`.

### Task 8: Git challenges pages (no AI)

**Files:**
- Create:
  - `frontend/src/content/learn/git-challenges.ts`
  - `frontend/src/pages/{GitHub,GitChallenge}.tsx`
  - `frontend/src/components/learn/{CheatSheet,ScriptBox}.tsx`
- Test: `frontend/src/pages/GitChallenge.test.tsx`

**Interfaces:**
- Produces:
  - `GitChallenge = { id: ChallengeId; order: number; title: string; brief: string; steps: string[]; script?: string; cheatSheet: { command: string; what: string }[]; docs: { label: string; url: string }[]; passesWhen: string }`
  - 10 challenges matching Task 1 and spec §5

- [ ] **Step 1: Write failing tests:**
  - `listsTenChallengesInOrder`
  - `challengePageShowsBriefScriptCheatSheetAndDocs` (docs links point to `git-scm.com`)
  - `checkUsesLinkedRepo`
  - `noAskCallsOnGitPages` (a fetch spy sees no `/ask`)
  - `noMentorPanel`
  - `scriptCommandCopyable` (the bash and PowerShell commands each have a Copy button)
- [ ] **Step 2: Run** the tests. Expected: FAIL.
- [ ] **Step 3: Implement.** The challenge page states the "no AI here" rule in one plain sentence near the top.
- [ ] **Step 4: Run** `fe-test.sh`. Expected: PASS.
- [ ] **Step 5: Commit** `feat(frontend): real-repo Git challenges`.

### Task 9: Resume projects

**Files:**
- Create: `frontend/src/content/learn/resume-projects.ts`, `frontend/src/pages/Resume.tsx`, `frontend/src/components/learn/ResumeCard.tsx`
- Test: `frontend/src/pages/Resume.test.tsx`

**Interfaces:** `ResumeProject = { id, title, targets: Company[], roles: Role[], proves, core: string[], stretch: string[], stack, bullet: { template: string; example: string } }`; there are 12 entries, per spec §6.

- [ ] **Step 1: Write failing tests:**
  - `filtersByTargetAndRole`
  - `cardShowsBulletTemplateAndExample`
  - `repoHealthChecklistUsesLinkedRepo` (mocked `repoHealth`)
  - `twelveProjects`
- [ ] **Step 2: Run** the tests. Expected: FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run** `fe-test.sh`. Expected: PASS.
- [ ] **Step 5: Commit** `feat(frontend): resume projects with GitHub checklist`.

### Task 10: Core CS readiness

**Files:**
- Create: `frontend/src/learn/coreReadiness.ts`
- Modify: `frontend/src/pages/Level.tsx` (second meter, gaps and breakdown), `frontend/src/pages/Today.tsx` (overall = min of the two)
- Test: `frontend/src/learn/coreReadiness.test.ts`, plus updates to `Level.test.tsx` and `Today.test.tsx`

**Interfaces:** `coreScore(input): { total; parts: { modules; quiz; projects; git } }`, `coreReadiness(total, target)`, `coreGaps(...)`, using the weights and bars from Global Constraints.

- [ ] **Step 1: Write failing tests:**
  - `weightsAndBars`
  - `serviceWeighsDbmsAndCnHigher`
  - `gapsAreConcrete` ("DBMS: finish 3 more modules", "Verify the Library manager project", "Pass the merge-conflict challenge")
  - `levelShowsBothMeters`
  - `todayShowsLowerReadiness`
- [ ] **Step 2: Run** the tests. Expected: FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run** `fe-test.sh`. Expected: PASS.
- [ ] **Step 5: Commit** `feat(frontend): core CS readiness`.

### Task 11: End-to-end, accessibility, review, docs

- [ ] **Step 1: e2e** (`frontend/e2e/learn.spec.ts`, with stub GitHub under the `e2e` profile where repo `demo/library` passes checks 1–3 and fails 4):
  1. lesson → pass quiz → complete → the track shows 1/10
  2. project → link `https://github.com/demo/library` → milestones show 3 passed, 1 failing
  3. Git challenge page → Check, with no `/ask` request observed
  4. resume filter
  5. the Level page shows both meters
  6. axe on all new routes, in both themes
- [ ] **Step 2: Run** `./mvnw -B -q package -DskipTests && cd frontend && npx playwright test`. Expected: all pass.
- [ ] **Step 3: Visual and accessibility pass** on lesson, project, Git and resume pages (screenshots at 1440 light and 390 dark, plus a keyboard walk). Fix any findings with failing-first tests.
- [ ] **Step 4: Update the README** (Learning hub, `GITHUB_TOKEN` setup). Run `all-test.sh`. Expected: green.
- [ ] **Step 5: Commit** `test: learning hub e2e, accessibility and docs`.
