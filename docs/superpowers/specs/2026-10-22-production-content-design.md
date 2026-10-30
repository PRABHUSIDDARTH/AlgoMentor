# Production content: companies, roles, lessons, resume projects

Branch `design-pass`. Follows the design pass; the persistent-navbar fix is already committed.

## What the user asked for
1. Lesson pages do not use the full page and read as a wall of text then a quiz. Make them engaging.
2. The company targets (FAANG / product, Startup, Service) and the three roles are too thin for a production app. Use real companies, scraped from several sites. "FAANG is dead, it is MAANG."
3. Resume projects (and problems) should come from real Git repositories.
4. The gooey navbar particles must work from `/app` to the rest of the project. (Done: the navbar used to be re-created by every page; `RootLayout` now owns it.)

## Decisions and what is left out (read these)
- **Real data only, with sources.** Every company carries the official page it was taken from and the date it was checked. Companies with no official page that I could read are left out rather than guessed: Wipro, HCLTech, Uber, Flipkart, Zoho and the other startups. Apple has no official process page, so its entry is marked as candidate-reported.
- **No LeetCode premium company tags.** The public repos that list "problems asked by company" are copies of a paid LeetCode feature, are dated (the MIT one is May 2022) and are candidate-reported, so they are neither licensed to redistribute nor reliably current. Instead each company gets a topic emphasis taken from its own published guide (Meta: "algorithms, data structures, recursion and binary trees"; Amazon: scalable, well-tested code plus Leadership Principles; Atlassian: data structures plus code design), mapped onto the roadmap stages the app already has.
- **Resume projects** are inspired by `codecrafters-io/build-your-own-x` and roadmap.sh backend project ideas. Each new project names what inspired it and links to it. Nothing is copied.
- `Company` (the stored category) is renamed to a tier. Stored `faang` is migrated to `maang`.

## Model
- `Tier = 'maang' | 'product' | 'startup' | 'service'`. Labels: "MAANG", "Big tech and product", "Startups", "Service and IT consulting". MAANG is Meta, Amazon, Apple, Netflix, Google.
- `Level = 'intern' | 'sde1' | 'sde2'` stays (multiplier and readiness bar). `sde3` is added (Senior) with multiplier 1.35 and bars 95/85/70/65.
- `Focus = 'general' | 'backend' | 'frontend' | 'fullstack' | 'mobile' | 'data' | 'devops' | 'sdet'`. Focus changes the Core CS weights (OOP, Networks, DBMS, OS) and which resume projects are suggested.
- `Target = { company: Tier; role: Level; employer?: string; focus?: Focus }`. `employer` is a company id from the dataset.
- Settings validate and migrate old values: `faang` becomes `maang`, missing `focus` becomes `general`, an unknown `employer` is dropped.

## Companies dataset (`content/companies.ts`)
`CompanyProfile = { id, name, tier, rounds: { name, detail }[], process: string (one sentence), emphasis: Partial<Record<StageGroup, 0|1|2|3>> | undefined (falls back to tier), notes?: string, sources: { label, url }[], checked: 'YYYY-MM-DD', reported?: true }`.
- `employerWeights(profile)` overrides the tier's stage weights where `emphasis` is set.
- Pages: `/companies` (all companies by tier, each card with its rounds and a "Set as my target" button) and `/companies/:id`. Nav: Progress gets a "Companies" tab.
- Settings sheet: tier, level, focus, and an optional employer (filtered by tier).

## Lesson pages
- Layout: a full-width intro band (title, reading time, a "Why this matters" hook, a key-points list) then a two-column body: prose on the left, a sticky side column on the right with the diagram, key terms and the on-this-page list. Code and the quiz span the full body width. The old fixed `72ch` page is removed.
- Content blocks: GitHub-style alert blockquotes in the lesson markdown (`> [!KEY]`, `> [!GOTCHA]`, `> [!INTERVIEW]`, `> [!TRY]`, `> [!STORY]`) render as styled callouts. A new optional `Lesson.hook` (a short real story or concrete scenario) and `Lesson.keyPoints` (3 to 4 bullets) render in the intro band. `> [!TRY]` renders a "Predict, then reveal" block where the answer is hidden until the learner clicks.
- Authoring: all 40 lessons get a hook, key points, and at least two callouts (one Gotcha or Story, one Interview). Facts in stories must be real and checkable; where unsure the story is a concrete scenario, not a claim about a named company.
- No AI on lesson pages (unchanged).

## Resume projects
- Existing 9 stay. Add 9 more covering the new focuses (mobile, data, devops, sdet, frontend) and the service and startup tiers, each with `inspiredBy: { label, url }`.
- `ResumeProject.targets` uses `Tier`. `ResumeProject.focus?: Focus[]` filters suggestions on the Resume page.

## Testing
- Unit: settings migration; weights per tier and employer; Core CS focus weights; every company has at least one `https` source, a valid date, at least two rounds; every lesson has a hook, key points and two callouts; the callout renderer; the predict-then-reveal block; the companies pages; Settings.
- e2e: `/companies` and `/companies/:id` in the route table; set a target from a company page and see it on Today; a lesson shows the intro band and a callout; axe on the new pages in both themes; no horizontal scroll at 390px.
- All existing suites stay green.

## Out of scope
Scraped salary data; LeetCode company tags; Wipro, HCLTech, Uber, Flipkart and Zoho entries until an official page can be read; changing the roadmap's stages.
