# Navbar and page structure redesign

Branch `nav-restructure` (from `frontend-redesign`, PR #3). The OS learning track is a separate follow-up on the same branch.

## Goal
One navbar, built on React Bits GooeyNav, on every page, with every page in exactly one place.

## Problems today
- Landing uses GooeyNav in a cream bar; every other page uses `AppNav`, a dark band with plain links.
- The top level has 4 links (Practice, Roadmap, Today, Learn). Git, Resume projects and Level are not in it; Git and Resume hang off `LearnNav`, Level is reachable only through in-page links.
- Four unrelated link styles (landing nav, app nav, `LearnNav`, hand-written "Back to ..." links).

## Information architecture
Four sections. The top row's GooeyNav shows the sections; a second row of plain tabs shows the current section's pages.

| Section | Tabs (route) |
| --- | --- |
| Practice | Workspace `/app`, Roadmap `/roadmap`, Today `/today`, Tests `/tests` |
| Learn | Overview `/learn`, one tab per learn track (`/learn/<track>`; OOP, Networks, DBMS now, OS later), Projects `/projects` |
| Git | Challenges `/git`, Repo health `/git/health` |
| Progress | DSA level `/level`, Core CS level `/level/core`, Resume projects `/resume` |

- The section is derived from the pathname (`sectionFor`), the tab likewise (`tabFor`). Deep routes map to their parent: `/roadmap/:stage` → Roadmap, `/test/:id` → Tests, `/learn/:track/:module` → that track, `/projects/:id` → Projects, `/git/:challenge` → Challenges.
- Learn track tabs are generated from `TRACKS`, so a new track appears without touching the nav.
- All existing URLs keep working. New routes: `/tests`, `/projects`, `/git/health`, `/level/core`. `SpaController` forwards the new ones.
- `/` has no section: the landing variant shows its in-page links (Overview, How it works, Integrations, FAQ) in the GooeyNav slot.

## `SiteNav`
- Replaces `landing/Nav` and `workspace/AppNav`. Rendered by `AppShell` (all pages), the Workspace (its own full-height layout) and Landing.
- Row 1: logo, GooeyNav (sections or landing links), flexible space, optional Jump-to-problem search (Workspace only), theme toggle, Get started (landing only), Settings. Surface is `bg-cream` with a bottom border in both themes; the dark band tokens stop being used by the nav.
- Row 2 (`SectionTabs`): `<nav aria-label="<Section>">` of `NavLink`s with the existing sage underline; hidden on the landing page. Horizontally scrollable on narrow screens without a page-level scrollbar.
- GooeyNav gets an optional `onItemClick(item, event)` so app links navigate through the router (modifier-clicks and middle-clicks keep native behaviour). Items keep real `href`s.
- Mobile (< md): GooeyNav and the tabs row are replaced by a menu button that opens a left `Sheet` listing every section with its tabs. The workspace's "Recent problems" button stays.
- Settings stays fixed top-right and last in keyboard order.

## Page structure
- `PageHeader({ eyebrow, title, summary, crumbs })` is the shared page head; pages drop their hand-rolled headers and "Back to ..." links in favour of breadcrumbs (`Learn / Networks / TCP and UDP`).
- `AppShell` keeps its scroll behaviour and renders `SiteNav`. The Workspace keeps its two-pane layout under `SiteNav`.

## New and split pages
- `/tests` (`Tests`): lists saved tests from `loadTests()` (date, score, finished or not, link) and a "Generate test" button using the current level. Empty state explains what a test is.
- `/projects` (`Projects`): the nine projects grouped by track, with level and Git-milestone progress.
- `/git/health` (`RepoHealth` page): the existing `RepoHealth` component with the practice repo scope, plus `RepoLink`.
- `/level` shows the DSA level only. `/level/core` shows the Core CS section that currently sits under it. Today's readiness links go to the matching page.
- `LearnNav` is deleted; `GitHub` page's list stays at `/git`.

## Testing
- Unit: `sectionFor` / `tabFor` for every route, including unknown paths; tab list includes every `TRACKS` entry.
- Component: `SiteNav` active section and tab per route; mobile sheet lists every route; page tests updated for moved links and headings.
- e2e: every route renders `SiteNav` with the expected active section; each tab link reaches its page; keyboard Tab order ends with Settings; 390px has no horizontal scroll and the sheet reaches all pages; axe (both themes) over all routes including the four new ones.
- Existing suites stay green (backend, frontend unit, e2e, git scripts).

## Out of scope
OS track content (next step), URL changes, new design tokens, changes to the Workspace's panes.
