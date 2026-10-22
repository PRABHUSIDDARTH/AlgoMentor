# Navbar restructure implementation plan

> Execute with superpowers:executing-plans (native, TDD). Spec: docs/superpowers/specs/2026-10-22-nav-restructure-design.md

**Goal:** one GooeyNav-based `SiteNav` on every page, four sections with tabs, new pages `/tests`, `/projects`, `/git/health`, `/level/core`.
**Stack:** React 19, react-router 7, Vitest, Playwright. Node: `source ~/.nvm/nvm.sh`.

## Tasks
1. **Route map** — `frontend/src/nav/sections.ts`: `SECTIONS`, `sectionFor(path)`, `tabFor(path)`, `sectionTabs(id)` (Learn tabs generated from `TRACKS`). Test `sections.test.ts` covers every route and unknown paths. Commit.
2. **SiteNav** — add `onItemClick` to GooeyNav; create `components/nav/{SiteNav,SectionTabs,MobileMenu}.tsx`; `AppShell`, `Workspace` and `Landing` render `SiteNav`; delete `landing/Nav`, `workspace/AppNav`, `learn/LearnNav`; update their tests. Test: active section/tab per route, mobile sheet lists all routes, Settings last in tab order. Commit.
3. **PageHeader** — `components/PageHeader.tsx` with breadcrumbs; adopt in all pages, remove "Back to" links. Update page tests. Commit.
4. **New pages** — `Tests`, `Projects`, `GitHealth`, `LevelCore` (split from `Level`); routes in `App.tsx`; `SpaController` forwards `/tests`, `/projects`, `/git/health`, `/level/core`. Page tests first. Commit.
5. **e2e, a11y, docs** — `e2e/nav.spec.ts` (every route has SiteNav, correct active section, tab links reach pages, 390px menu), extend `a11y.spec.ts` routes, README. Commit.
6. **Final review** — fresh opus review, one fix pass.

## Review focus
- Keyboard order ends with Settings; modifier-click on nav links still opens a new tab.
- Unknown route redirect and old URLs still resolve; reload on each new route works through the backend.
- Narrow screens: tabs row scrolls inside itself, no page overflow.
