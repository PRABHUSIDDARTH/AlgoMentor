<div align="center">

<img src="AlgoMentor-logo.jpeg" alt="AlgoMentor" width="160" />

# AlgoMentor

**An AI mentor for data structures and algorithms, plus a practice, learning and career-readiness hub.**

[![CI](https://github.com/PRABHUSIDDARTH/AlgoMentor/actions/workflows/ci.yml/badge.svg)](https://github.com/PRABHUSIDDARTH/AlgoMentor/actions/workflows/ci.yml)
[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](LICENSE)
![Java 21](https://img.shields.io/badge/Java-21-007396?logo=openjdk&logoColor=white)
![Spring Boot 4](https://img.shields.io/badge/Spring%20Boot-4-6DB33F?logo=springboot&logoColor=white)
![React 19](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)
![Google Cloud Run](https://img.shields.io/badge/Deployed%20on-Cloud%20Run-4285F4?logo=googlecloud&logoColor=white)

[**Live demo**](https://algomentor-14455603516.asia-south1.run.app) · [Features](#features) · [API](#api) · [Getting started](#getting-started) · [Configuration](#configuration)

</div>

---

## Overview

AlgoMentor explains DSA problems, gives graded hints that never spoil the answer, and shows optimal solutions with complexity analysis, powered by Google Gemini. Around that core sits a practice hub (roadmap, spaced-repetition reviews, timed tests), a learning hub (core CS tracks, projects, Git challenges) and a career section (company hiring guides, resume projects, readiness scoring against a dream company).

## Table of contents

- [Features](#features)
- [Tech stack](#tech-stack)
- [API](#api)
- [Getting started](#getting-started)
- [Testing](#testing)
- [Configuration](#configuration)
- [Review queue](#review-queue)
- [Deployment](#deployment)
- [License](#license)
- [Author](#author)

## Features

### AI workspace

- **Explain, hint, solve.** Get the intuition for a problem, then reveal help one step at a time: Nudge, Direction, Approach, Technique, Solution. Revealing early asks you to confirm.
- **Fetch by reference.** Enter a LeetCode number (`1`, `LC 146`) or paste a link and the statement is fetched automatically.
- **Streaming answers.** Responses appear as they are generated.
- **Follow-up questions** about the current problem, without giving the solution away.
- **Solutions in Python, Java or C++**, with a time and space complexity panel.
- **Quality of life.** Recent problems saved in your browser, `Ctrl K` to jump to any problem, light and dark themes that follow your system.

### Practice hub

| Feature | What it does |
| --- | --- |
| **Roadmap** | An original 18-stage, 329-problem progressive DSA roadmap with patterns, explanations, company and role weighting, and links to Striver A2Z, RisingBrain and GfG. |
| **Never forget** | Solved problems return for review after 1, 3, 7, 21 and 60 days. |
| **Today** | A daily checklist of new problems, due reviews and a concept refresher, with a streak. |
| **Generate test** | Ten mixed problems (revision and new), timed, matched to your level, with a report. |
| **Level and readiness** | Levels 1-10 and a readiness percentage for your target, with the three next things to do. |
| **Settings** | Connect LeetCode, HackerRank and GeeksforGeeks profile URLs (public data only, no passwords), choose a target company and role, set a daily goal. |

### Learning hub

- **Learn.** Four tracks of original lessons (OOP, Computer Networks, DBMS, Operating Systems), ten modules each, with diagrams, Java/Python/C++ samples (OOP), a five-question quiz per module and interview questions. A module completes at 4 of 5, then returns on Today as a three-question re-quiz after 1, 3, 7, 21 and 60 days.
- **Projects.** Twelve specs (three per track, beginner to advanced) with requirements, stretch goals and an acceptance checklist. Link a public GitHub repo and AlgoMentor checks each project's Git milestones.
- **Git challenges.** Ten real situations in your own repository: first commit, meaningful commits, feature PR, merge conflict, squash, revert, recover a deleted branch, cherry-pick, release, remove a committed secret. Setup scripts (bash and PowerShell) put your clone into the situation, you fix it with Git, and the check reads your repo on GitHub. There is no AI on the Git pages.
- **Core CS readiness.** Modules, quizzes, projects and Git challenges score out of 100 against your target's bar (MAANG 70, big tech and product 65, startup 60, service 75). Your focus (backend, frontend, full stack, mobile, data, DevOps, test) changes which tracks weigh more. Today shows the lower of your DSA and Core CS readiness.

> Git checks read public GitHub data only (commits, branches, tags, releases), never your code, so the repository must be public.

### Career

- **Companies.** How 14 real companies hire (Google, Meta, Amazon, Apple, Netflix, Microsoft, Adobe, Atlassian, Razorpay, TCS, Infosys, Cognizant, Accenture, Capgemini), round by round, taken from their careers pages with the date each was read. Apple has no official guide and is marked as candidate-reported. Setting one as your target adjusts the roadmap weights.
- **Resume projects.** 55 projects (21 intern, 44 SDE-1, 37 SDE-2, 21 senior; at least 10 each for backend, frontend, full stack, mobile, data, DevOps and test engineers), filterable by tier, any of 221 companies, level and focus. Each has a resume-bullet template, a "build it like production" section (architecture, build order, ship checklist) and a "make your GitHub shine" checklist checked against your repo. Ideas drawn from public repositories and roadmaps are credited on the card.
- **Dream ID.** Pick a dream company from 221 across 26 countries and the About page hangs a badge-style card on the [React Bits Lanyard](https://reactbits.dev/components/lanyard): the company's own logo (never an icon pack or an invented mark; companies without one show their name in plain type), its brand colour, your photo (resized and kept in your browser), your name and the role. It is a goal card, not an employee badge: it says so, carries no employee number or barcode, and is not linked to the company.
- **Readiness for that company.** The lower of DSA and Core CS readiness against the company's tier, your level and focus, with the next steps that would move it.
- **Live profiles.** LeetCode, HackerRank, GeeksforGeeks and GitHub are read when About opens, every ten minutes while it is open, and when you return to the tab. LinkedIn cannot be read by other sites, so it is a link only. Name, email and LinkedIn stay in your browser.
- **Share on LinkedIn.** Downloads the card as a PNG and opens LinkedIn's composer with a post written for you (a goal, never a job claim). LinkedIn does not allow attaching images by link, so you attach the file.
- **Shared projects.** People who were placed can submit the project that helped. Entries wait in a [review queue](#review-queue); only approved ones appear on the Resume projects page, as plain text labelled as user-shared and unverified.

### Navigation

One persistent navbar ([React Bits GooeyNav](https://reactbits.dev)) on every page, with the section's pages underneath:

| Section | Pages |
| --- | --- |
| **Practice** | Workspace, Roadmap, Today, Tests |
| **Learn** | Overview, one tab per track, Projects |
| **Git** | Challenges, Repo health |
| **Progress** | DSA level, Core CS level, Companies, Resume projects |
| **About** | Profile, Settings |

> Progress is saved in your browser for now. LeetCode only shares your roughly 20 most recent accepted problems publicly, so older solves count through topic totals.

## Tech stack

| Layer | Technology |
| --- | --- |
| Backend | Java 21, Spring Boot 4, Google Gemini API (`gemini-2.5-flash`) |
| Frontend | React 19, TypeScript, Vite, Tailwind CSS v4, shadcn/ui, React Bits, Motion |
| Testing | JUnit 5, Vitest and Testing Library, Playwright and axe |
| Delivery | Docker, Google Cloud Run (the React build is bundled into the Spring Boot jar) |

## API

| Endpoint | Description |
| --- | --- |
| `POST /ask` | `{"problem", "mode": "explain\|hint\|solution\|followup", "previousHints": [...], "language": "python\|java\|cpp", "conversation": [...], "question", "solutionRevealed"}` returns `{"result"}` |
| `POST /ask/stream` | Same body. Server-Sent Events: `chunk` `{"text"}` repeated, then `done`, or `error` `{"error"}` |
| `GET /problem?ref=1` | Fetches a LeetCode problem by number or URL and returns `{number, title, difficulty, tags, url, statement}` |
| `GET /profiles/{leetcode,hackerrank,gfg}/{user}` | Public profile stats (cached 6 hours) |
| `GET /git/check/{owner}/{repo}/{challenge}` | Checks one Git challenge against a public repo and returns `{passed, details: [{ok, text}]}` (cached 2 minutes) |
| `GET /git/repo-health/{owner}/{repo}` | The "make your GitHub shine" checklist for a public repo, same shape |

Errors are always `{"error": "..."}`. LeetCode lookups use LeetCode's public but unofficial endpoints, so Premium problems cannot be fetched.

## Getting started

**Prerequisites:** Java 21 and a [Gemini API key](https://aistudio.google.com/apikey). Maven runs through the wrapper and downloads its own Node for the frontend build.

```bash
git clone https://github.com/PRABHUSIDDARTH/AlgoMentor.git
cd AlgoMentor
export GEMINI_API_KEY=your_key_here      # Windows: set GEMINI_API_KEY=your_key_here
./mvnw spring-boot:run                   # builds the frontend too; open http://localhost:8080
```

### Frontend development

Needs Node 26. Run the backend as above, then in another terminal:

```bash
cd frontend
npm install
npm run dev                              # http://localhost:5173, API calls proxied to :8080
```

### Docker

```bash
docker build -t algomentor .
docker run -p 8080:8080 -e GEMINI_API_KEY=your_key_here algomentor
```

## Testing

No API key is needed: Gemini is mocked or stubbed.

```bash
./mvnw verify                            # backend tests + frontend unit tests
./mvnw package -DskipTests && cd frontend && npx playwright install chromium && npm run e2e
bash scripts/test-git-challenges.sh      # runs every Git challenge setup script (bash, and PowerShell if pwsh is installed) in a throwaway repo
bash scripts/check-oop-snippets.sh       # compiles every OOP lesson sample: javac, python, g++ (needs Node 23.6+)
```

The end-to-end tests start the jar with the `e2e` profile, which swaps Gemini, LeetCode, profile sites and GitHub for deterministic stubs. In that profile the repository `demo/library` has passed the first three Git challenges and nothing else.

## Configuration

| Variable | Default | Purpose |
| --- | --- | --- |
| `GEMINI_API_KEY` | none (required) | Google Gemini API key |
| `GEMINI_MODEL` | `gemini-3.8-flash` | Gemini model to use |
| `PORT` | `8080` | HTTP port |
| `GITHUB_TOKEN` | none (recommended) | Raises the GitHub API limit for Git checks |
| `ADMIN_TOKEN` | empty | Enables the review page and API; leave empty to turn review off |
| `CONTRIBUTIONS_FILE` | see `application.properties` | Where shared projects are stored |

**On `GITHUB_TOKEN`:** without one, GitHub allows 60 API calls an hour for the whole server, and one Git check uses 3 to 24 of them. A **fine-grained token with read-only access to public repositories** (no other scopes) raises the limit to 5,000 an hour. Create one at [github.com/settings/personal-access-tokens](https://github.com/settings/personal-access-tokens) and never give it write access.

Rate limits and size caps live in `src/main/resources/application.properties`. A health check is served at `/actuator/health`.

## Review queue

Shared projects are stored in a JSON file and reviewed at `/admin/review`. Set `ADMIN_TOKEN` to enable it, and point `CONTRIBUTIONS_FILE` at a persistent disk. It supports a single instance only.

## Deployment

Deployed on Google Cloud Run via Docker. The image bundles the React build into the Spring Boot jar, so a single container serves both the UI and the API. CI runs on every push to `main` (see [`.github/workflows/ci.yml`](.github/workflows/ci.yml)).

## License

Licensed under the [Apache License, Version 2.0](LICENSE).

## Author

Built by [PrabhuSiddarth](https://github.com/PRABHUSIDDARTH).
