# Design pass: navbar, Landing, Learn, Today

Branch `design-pass` (from `main`). Pages not listed here keep their layout until a second pass.

## Rules (from the owner's earlier feedback)
No pills or badges that are not buttons, no emoji, no glows, no gradient text, no generic three-icon feature grids. Palette v4 (sage `#8B9A6E`, cream `#F7F2EB`, sand `#EAE2D6`, dark page `#0E100B`), light and dark only, full-width layouts. Every block shows something real from the app (real titles, counts, components with sample data). Motion explains; it never decorates and respects reduced motion.

## Sources of components
shadcn (primitives already in `components/ui`: add `progress`, `card`, `separator` as needed), React Bits (`GooeyNav` present; add `CountUp` from reactbits.dev/r/CountUp-TS-TW), 21st.dev (layout ideas, rewritten to the palette rather than pasted). Each adopted component's source is recorded in its file header.

## 1. Navbar
- Both rows use React Bits GooeyNav in its full form: row 1 sections (`frame`, `size="md"`, `particleCount` 15), row 2 page tabs (`size="sm"`). No plain link rows remain.
- Tabs keep `aria-label="<Section> pages"`, real hrefs and router navigation through `onItemClick`; `aria-current` marks the active tab.
- Phone: unchanged sheet menu. Reduced motion: the flat active state, no particles.

## 2. Landing (below the hero)
Replace the generic sections with:
- **Walkthrough** (`#how`): a live demo using the real `HintStepper` and `HintCard` with a worked Two Sum; the visitor steps through hints 1 to 4 and the solution stays locked until the last step.
- **Roadmap** : the 18 real stage names as a strip (one line per stage with its problem count), with the 329 total counted up by React Bits CountUp.
- **Learn**: four columns from `TRACKS`, each with one of its real diagrams, lesson count, project count and the first lesson title.
- **Git**: the real `ScriptBox` for a challenge and a `CheckResultView` with sample output, with one sentence that there is no AI on these pages.
- **Connections** (`#integrations`): the profiles Settings actually supports (LeetCode, HackerRank, GeeksforGeeks) described honestly. The old copy about GitHub sign-in and "Coming soon" labels goes.
- FAQ (shadcn Accordion, existing) with two added questions about Learn and Git; final call to action unchanged.
The nav links stay Overview, How it works, Integrations, FAQ.

## 3. Learn
- Hub: each track card gains a progress ring (SVG, `role="img"` with label), its first diagram as a thumbnail and the next lesson; a "due for review" strip when modules are due.
- Track page: modules as a vertical timeline (numbered nodes on a rule, completed ones filled).
- Lesson page: sticky table of contents built from the `##` headings, a reading-progress line under the navbar, and on wide screens the quiz beside the text.

## 4. Today
Two columns: tasks on the left as a timeline (new problems, due reviews, concept refresher, module re-quiz); right a readiness card, a 14-day activity strip (squares, one per day, labelled) and the revision queue. Built from shadcn Card, Tabs and Progress.

## Testing
Existing page tests updated as markup changes; new unit tests for the TOC extractor, the progress ring and the activity strip; Playwright and axe (both themes) stay green on every route; 390px has no sideways scroll on `/`, `/learn`, a lesson, `/today`.

## Out of scope
Workspace panes, Roadmap, Git, Resume, Level pages, routes and content.
