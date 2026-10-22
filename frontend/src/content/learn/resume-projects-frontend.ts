import type { ResumeProject } from './resume-projects'

const ROADMAP_FRONTEND_PROJECTS = { label: 'roadmap.sh: frontend projects', url: 'https://roadmap.sh/frontend/projects' }
const ROADMAP_FRONTEND = { label: 'roadmap.sh: frontend roadmap', url: 'https://roadmap.sh/frontend' }
const ROADMAP_DESIGN_SYSTEM = { label: 'roadmap.sh: design system roadmap', url: 'https://roadmap.sh/design-system' }
const ROADMAP_FULLSTACK = { label: 'roadmap.sh: full stack roadmap', url: 'https://roadmap.sh/full-stack' }

/**
 * Frontend-focused projects, from small intern scope up to senior architecture work. The ideas follow the
 * public roadmaps credited on each; the requirements, stretch goals and resume lines are our own.
 */
export const FRONTEND_PROJECTS: ResumeProject[] = [
  {
    id: 'typeahead-search-widget',
    title: 'Typeahead search widget',
    targets: ['startup', 'service', 'product'],
    roles: ['intern', 'sde1'],
    focus: ['frontend'],
    inspiredBy: ROADMAP_FRONTEND_PROJECTS,
    proves: 'You can build a small control that real users hit hundreds of times a day: debounced requests, cancelled stale responses, caching, error states and full keyboard support.',
    core: [
      'A search box that queries a public API (a movie, book or city search endpoint) as the user types',
      'Debouncing plus cancellation of in-flight requests with AbortController, so a slow old response can never overwrite a newer one',
      'An in-memory cache keyed by query, with a time limit, so repeating a query makes no network call',
      'Distinct loading, empty, error-with-retry and offline states',
      'The ARIA combobox pattern: arrow keys, Enter, Escape, and an announced result count for screen readers',
    ],
    stretch: ['Highlight the matched part of each result', 'Remember recent searches in localStorage with a clear button', 'Publish the widget as a package with no framework dependency'],
    stack: 'TypeScript with React or plain web components, Vitest and Testing Library for tests, Playwright for one keyboard-only end-to-end test, GitHub Actions for CI.',
    production: {
      architecture:
        'Keep the request logic in a framework-free module (debounce, cancel, cache) and the combobox in a thin view on top of it, so the hard part is unit-testable without a DOM. Decision worth defending: cancel on every keystroke and key the cache by normalised query, because racing responses are the classic bug in typeahead and the cache turns repeated typing into zero requests.',
      milestones: [
        'Plain search input rendering results from the API, with a loading and an error state',
        'Debounce and AbortController added, with a test that fires three queries and asserts only the last renders',
        'Query cache with expiry, with a test that proves a repeated query makes no network call',
        'Full combobox keyboard behaviour and ARIA roles, checked with axe and a keyboard-only end-to-end test',
        'Deployed demo with a short write-up that shows the request count before and after caching',
      ],
      shipIt: [
        'Unit tests for the debounce, cancellation and cache logic including the out-of-order response case',
        'An automated accessibility check (axe) runs in CI and passes on every widget state',
        'A Playwright test completes a search using only the keyboard',
        'The API failing, timing out and returning nothing each show a clear message and a working retry',
        'CI runs lint, types and tests on every pull request and blocks merge on failure',
        'The README documents props, keyboard shortcuts and the cache behaviour, and links the live demo',
      ],
    },
    bullet: {
      template: 'Built an accessible typeahead search widget in <language/framework> with <debounce, request cancellation and caching>; cut API calls by <X>% and met <accessibility standard> verified by <tests>.',
      example: 'Built an accessible typeahead search widget in React and TypeScript with debouncing, request cancellation and a query cache; cut API calls by 62% across a scripted typing session and passed axe plus 18 tests in CI.',
    },
  },
  {
    id: 'photo-gallery-web-vitals',
    title: 'Image gallery with a Core Web Vitals budget',
    targets: ['product', 'startup', 'service'],
    roles: ['intern', 'sde1'],
    focus: ['frontend'],
    inspiredBy: ROADMAP_FRONTEND_PROJECTS,
    proves: 'You can measure and defend page performance with numbers instead of guesses: responsive images, lazy loading, layout stability and a budget that fails the build when it is broken.',
    core: [
      'A gallery of at least 200 photos with a grid, a lightbox and URL-addressable photo pages',
      'Responsive images with srcset and sizes, modern formats (AVIF or WebP) with a fallback, and explicit width and height to prevent layout shift',
      'Lazy loading below the fold and a prioritised hero image, with the reasoning written down',
      'Lighthouse CI in the pipeline with a budget for LCP, CLS and total JavaScript size that fails the build when exceeded',
      'Real-user measurement of LCP, CLS and INP using the web-vitals library, sent to a simple endpoint and charted',
    ],
    stretch: ['A blur-up placeholder generated at build time', 'Prefetch the next photo on hover and measure whether INP improves', 'Compare a slow-3G profile against a fast connection and write up what changed'],
    stack: 'TypeScript with Vite or Next.js, sharp or an image CDN for resizing, Lighthouse CI, the web-vitals library, GitHub Actions, any static host.',
    production: {
      architecture:
        'Images are processed at build time into several widths and formats, and the page ships only markup plus a small script, so the browser decides which file to download. Decision worth defending: the performance budget lives in CI as a failing check, because a number that is only measured once on your laptop stops being true after the third pull request.',
      milestones: [
        'Naive gallery with full-size images and a recorded baseline Lighthouse report',
        'Build-time resizing and srcset markup, with the before and after LCP and page weight in a table',
        'Lazy loading, hero prioritisation and fixed image dimensions, with CLS measured below 0.1',
        'Lighthouse CI budget wired into pull requests so a deliberate regression turns the build red',
        'Field measurement with web-vitals reported to an endpoint and shown on a small chart',
      ],
      shipIt: [
        'A Lighthouse CI budget fails the build on a regression, shown by a pull request that breaks it on purpose',
        'Throttled mobile results are recorded in the README next to the unoptimised baseline',
        'Every image has alt text and the lightbox traps focus and closes with Escape',
        'A broken image URL shows a placeholder instead of an empty gap or a shifting layout',
        'Field data collection handles a failed beacon silently and never blocks rendering',
        'The README documents how to add photos and how to read the performance report',
      ],
    },
    bullet: {
      template: 'Built an image gallery in <framework> with <responsive images and lazy loading> and a CI-enforced budget; improved LCP from <before> to <after> and CLS to <value> on throttled mobile.',
      example: 'Built an image gallery in Next.js with AVIF and WebP responsive images, lazy loading and a Lighthouse CI budget; improved LCP from 4.8 s to 1.9 s and CLS to 0.02 on throttled mobile across 240 photos.',
    },
  },
  {
    id: 'multi-step-form-builder',
    title: 'Schema-driven multi-step form',
    targets: ['service', 'startup', 'product'],
    roles: ['intern', 'sde1'],
    focus: ['frontend', 'fullstack'],
    inspiredBy: ROADMAP_FRONTEND_PROJECTS,
    proves: 'You can handle the unglamorous part of most business apps: forms with validation, saved progress, accessible errors and a submission that can fail and be retried.',
    core: [
      'A four-step application form (account, details, uploads, review) described by one schema that drives both the fields and the validation',
      'Validation on blur and on submit with messages tied to inputs through aria-describedby, and focus moved to the first error',
      'Draft saving to localStorage so a refresh or accidental close loses nothing, with a clear way to discard it',
      'Back and forward navigation that keeps entered data, plus a review step that links back to any field',
      'Submission to a small API that can fail: pending state, duplicate-submit protection and a retry that does not lose data',
    ],
    stretch: ['Conditional steps that appear depending on earlier answers', 'Field-level async validation such as a username availability check', 'Translate the form into a second language without changing the schema'],
    stack: 'TypeScript, React with React Hook Form or a hand-built hook, Zod for schemas, Vitest and Testing Library, a tiny Express or Fastify endpoint for submission.',
    production: {
      architecture:
        'One Zod schema describes every field, and the same schema runs in the browser and on the server, so the two can never disagree about what is valid. Decision worth defending: the form state is separated from the step navigation state, which makes the draft easy to persist and the steps easy to reorder or skip.',
      milestones: [
        'Single-step form rendered from the schema with inline errors',
        'Four steps with navigation and a review page, with a test that walks the whole flow',
        'Draft persistence and restore, with a test that reloads the page mid-form',
        'Accessible error handling checked with a screen reader and axe',
        'Server submission with validation, idempotency key and a visible retry path',
      ],
      shipIt: [
        'Unit tests cover every validation rule, including the boundary values',
        'An end-to-end test completes the form and another submits with the server returning an error',
        'The whole form can be completed with the keyboard and every error is announced to a screen reader',
        'A double click on submit creates one record, proven by a test',
        'No personal data is written to logs and drafts exclude file contents',
        'CI runs lint, types and tests, and the README documents the schema format',
      ],
    },
    bullet: {
      template: 'Built a <N>-step form in <framework> driven by a shared <schema library> schema validated on client and server, with <draft saving and accessible errors>; verified by <tests>.',
      example: 'Built a 4-step application form in React driven by a shared Zod schema validated on client and server, with draft saving and screen-reader-tested errors; verified by 41 unit tests and 3 end-to-end flows.',
    },
  },
  {
    id: 'kanban-optimistic-board',
    title: 'Kanban board with optimistic updates and undo',
    targets: ['product', 'startup', 'maang'],
    roles: ['sde1', 'sde2'],
    focus: ['frontend', 'fullstack'],
    inspiredBy: ROADMAP_FRONTEND_PROJECTS,
    proves: 'You can manage client state that must feel instant and stay correct: optimistic writes, rollback on failure, undo and redo, and drag and drop that works without a mouse.',
    core: [
      'Boards with columns and cards that can be dragged between columns and reordered, with positions stored as fractional ranks so one move changes one row',
      'Optimistic updates through a server-state cache, with automatic rollback and a visible message when the server rejects a move',
      'Undo and redo of card moves and edits using a command history, including undo of a move the server already accepted',
      'Keyboard drag and drop with live-region announcements such as "Card moved to column 2, position 3"',
      'Conflict handling: if another tab changed the same card, show the difference instead of silently overwriting',
    ],
    stretch: ['Real-time updates from other users over WebSockets or server-sent events', 'Offline queue that replays moves when the connection returns', 'Virtualise very long columns and measure frame rate with 5,000 cards'],
    stack: 'TypeScript, React with TanStack Query, dnd-kit, a Node API with PostgreSQL, Vitest, Testing Library, Playwright, GitHub Actions.',
    production: {
      architecture:
        'The server cache is the source of truth, and each user action is a small command object that knows how to apply itself, send itself and reverse itself, so optimistic update, rollback and undo all use the same code path. Decision worth defending: ordering uses fractional ranks rather than integer positions, because a move then updates a single row and two users moving different cards never conflict.',
      milestones: [
        'Static board with drag and drop and a persisted order through a simple API',
        'Optimistic moves with rollback, tested by a mock server that fails every third request',
        'Command history with undo and redo, tested as sequences of random actions that must return to the start state',
        'Keyboard and screen reader drag and drop, verified with an end-to-end keyboard test',
        'Conflict detection using version numbers, shown with a two-tab demo recording',
      ],
      shipIt: [
        'A property-style test applies random moves and undos and asserts the board ends in a valid state',
        'Server failures, timeouts and stale versions each roll back cleanly with a visible message',
        'The board is fully operable by keyboard and passes automated accessibility checks',
        'Rank rebalancing is implemented and tested so repeated inserts never exhaust precision',
        'Errors and slow requests are reported to an error tracker with the failing command attached',
        'CI runs unit, integration and one Playwright flow, and the README includes a short architecture diagram',
      ],
    },
    bullet: {
      template: 'Built a Kanban board in <framework> with optimistic updates, rollback and <undo/redo> over <API>; kept moves under <N> ms perceived latency and verified correctness with <test approach>.',
      example: 'Built a Kanban board in React with optimistic updates, rollback and command-based undo over a Node and PostgreSQL API; moves feel instant (under 16 ms) and 2,000 randomised move-undo sequences all restored the original state.',
    },
  },
  {
    id: 'design-token-pipeline',
    title: 'Design-token pipeline',
    targets: ['product', 'maang', 'startup'],
    roles: ['sde1', 'sde2'],
    focus: ['frontend'],
    inspiredBy: ROADMAP_DESIGN_SYSTEM,
    proves: 'You understand how a design system stays consistent at scale: one source of truth for colour, spacing and type that compiles into every platform and fails the build when contrast or naming rules are broken.',
    core: [
      'Tokens defined in JSON in two layers: raw values (blue-500) and semantic aliases (color-action-primary) that components use',
      'A build step that generates CSS custom properties, a TypeScript type file and a second output such as Android XML or iOS Swift constants',
      'Light and dark themes produced from the same semantic names with no duplicated component code',
      'A validation script that checks naming rules, detects unused and missing tokens, and fails when a text and background pair drops below WCAG AA contrast',
      'A documentation page generated from the tokens that shows every value, its alias chain and where it is used',
    ],
    stretch: ['A Figma variables export that opens an automated pull request when designers change a token', 'Per-brand themes built from one token set', 'A codemod that replaces hard-coded hex colours in an existing codebase with tokens'],
    stack: 'TypeScript and Node, Style Dictionary or a hand-written transformer, CSS custom properties, Storybook or Astro for the docs page, Vitest, GitHub Actions, a package registry or GitHub Packages.',
    production: {
      architecture:
        'Tokens are data, and every output (CSS, types, native constants, docs) is generated from that data by pure functions, so adding a platform means adding one transformer rather than touching components. Decision worth defending: components may only reference semantic tokens, which lets a theme or rebrand change by editing aliases without touching a component.',
      milestones: [
        'Token schema and a build that emits CSS variables and a typed object',
        'Semantic layer and dark theme, shown by one component rendered in both themes from identical code',
        'Second platform output with a snapshot test that pins the generated file',
        'Validator for naming, aliases and contrast, with CI failing on a deliberately bad token',
        'Versioned package release and a generated docs site with a changelog of token changes',
      ],
      shipIt: [
        'Snapshot tests pin the output for every platform so unintended token changes show in review',
        'The contrast validator fails the build on a pair below 4.5:1 for body text',
        'Circular and missing aliases are detected with an error that names the token',
        'The package follows semantic versioning, and removing a token is treated as a breaking change',
        'A visual regression check renders the docs page in both themes on every pull request',
        'The README explains how a designer or engineer adds a token and how it reaches production',
      ],
    },
    bullet: {
      template: 'Built a design-token pipeline in <tool> that compiles <N> tokens into <outputs> with <light/dark themes> and CI-enforced <contrast and naming checks>; adopted by <component or app count>.',
      example: 'Built a design-token pipeline in TypeScript that compiles 180 tokens into CSS, TypeScript and Android outputs with light and dark themes and CI-enforced WCAG contrast checks; adopted by 24 components.',
    },
  },
  {
    id: 'accessible-chart-kit',
    title: 'Accessible charting library',
    targets: ['product', 'maang', 'startup'],
    roles: ['sde1', 'sde2'],
    focus: ['frontend'],
    inspiredBy: ROADMAP_FRONTEND,
    proves: 'You can draw data yourself and make it usable for everyone: scales, SVG rendering, responsive layout, keyboard exploration and a screen reader experience that is more than "image".',
    core: [
      'Line, bar and scatter charts rendered in SVG from a small declarative API, with linear, time and band scales written by hand',
      'Responsive sizing with a ResizeObserver, tick selection that avoids overlapping labels and number and date formatting by locale',
      'Keyboard exploration: arrow keys step through data points, a focus ring shows the current point and a live region reads its value',
      'A visually hidden data table or text summary for every chart, and colours that stay distinguishable without relying on hue alone',
      'Unit tests for scales and tick generation, and visual regression snapshots for each chart type',
    ],
    stretch: ['Brush to zoom a time range', 'Canvas rendering fallback for more than 10,000 points, with the crossover measured', 'Respect prefers-reduced-motion and prefers-contrast'],
    stack: 'TypeScript, React or web components, SVG, Vitest, Playwright screenshot tests, Storybook, axe-core. Using d3-scale for comparison is fine, but write your own first.',
    production: {
      architecture:
        'The library splits into a pure core (scales, ticks, layout, formatting) that returns plain numbers and a thin rendering layer that turns them into SVG, so the maths is tested without a browser and a second renderer can be added later. Decision worth defending: every chart ships its accessible description from the same data model as the pixels, so the two cannot drift apart.',
      milestones: [
        'Linear and band scales with tick generation, covered by tests including edge cases such as an empty or constant series',
        'Bar and line charts rendered in SVG with responsive resizing',
        'Keyboard navigation and live-region announcements, tested with Testing Library and a screen reader pass',
        'Data-table fallback and colour-blind-safe palettes, checked with a simulator',
        'Storybook, visual regression in CI and a published package with a size budget',
      ],
      shipIt: [
        'Scale and tick functions have unit tests for empty, single-value, negative and very large inputs',
        'axe passes on every story and a manual screen reader check is written up in the docs',
        'Visual regression snapshots catch an unintended rendering change in CI',
        'Bad input (NaN, missing values, unsorted dates) produces a clear error or a documented gap, not a broken chart',
        'The bundle size is measured on every pull request and a budget fails the build when exceeded',
        'Documentation shows props, keyboard behaviour and an accessibility checklist for chart authors',
      ],
    },
    bullet: {
      template: 'Built an accessible charting library in <language> with <chart types> in SVG, keyboard exploration and screen reader support; <N> KB gzipped, tested with <unit and visual tests>.',
      example: 'Built an accessible charting library in TypeScript with line, bar and scatter charts in SVG, keyboard exploration and screen reader support; 9 KB gzipped, covered by 70 unit tests and visual snapshots in CI.',
    },
  },
  {
    id: 'virtual-data-grid',
    title: 'Virtualised data grid',
    targets: ['maang', 'product', 'startup'],
    roles: ['sde2', 'sde3'],
    focus: ['frontend'],
    inspiredBy: ROADMAP_FRONTEND,
    proves: 'You can reason about rendering cost: a grid that scrolls a million rows at 60 frames per second, stays accessible and has a performance budget you can defend with profiler traces.',
    core: [
      'Row and column virtualisation that mounts only the visible cells plus a small overscan, with variable row heights measured and cached',
      'Sorting, multi-column filtering and column resize, reorder and pin, with the heavy work done in a Web Worker for large datasets',
      'Server-driven mode that fetches pages by scroll position with request cancellation, placeholder rows and a cache of fetched ranges',
      'The ARIA grid pattern: roving tabindex, arrow-key navigation, Home, End and page keys, with correct row and column counts exposed even though most rows are not in the DOM',
      'A benchmark harness that records scroll frame time, input latency and memory at 10,000 and 1,000,000 rows, with budgets checked in CI',
    ],
    stretch: ['Cell editing with validation and undo', 'Row grouping and tree expansion', 'Compare your implementation against AG Grid or TanStack Table and explain where it loses'],
    stack: 'TypeScript with React or no framework, Web Workers, ResizeObserver, Playwright with Chrome tracing, Vitest, axe-core, a Node API for the server mode.',
    production: {
      architecture:
        'Scroll position drives a pure layout function that maps a pixel offset to the visible row and column ranges, and only that range is rendered, so cost depends on the viewport and not the dataset. Decision worth defending: sorting and filtering run in a worker and return index arrays rather than copies of rows, which keeps the main thread free for input and avoids duplicating a million objects in memory.',
      milestones: [
        'Fixed-height virtual list with a benchmark baseline at 10,000 rows',
        'Variable heights and column virtualisation, with a layout function covered by unit tests',
        'Worker-based sort and filter, with main-thread blocking time measured before and after',
        'Server-driven paging with cancellation and range cache, tested against a slow mock API',
        'Keyboard model and ARIA grid semantics, verified with a screen reader and Playwright',
        'Performance budgets in CI with traces attached to failing runs',
      ],
      shipIt: [
        'Benchmarks assert scroll frames under 16 ms at the 95th percentile and fail CI on regression',
        'Layout maths has unit and property tests, including rapid scroll jumps and resize during scroll',
        'Memory is measured after repeated scroll and data replacement to prove no leak',
        'axe passes and a written screen reader test covers row counts, headers and navigation',
        'A failed page fetch shows an inline retry row and never leaves a permanent blank area',
        'Docs state the performance budgets, the browsers tested and the known limits of the approach',
      ],
    },
    bullet: {
      template: 'Built a virtualised data grid in <language> handling <N> rows with <sort/filter in a worker> and an accessible keyboard model; held <frame time> at p95 enforced by <benchmark in CI>.',
      example: 'Built a virtualised data grid in TypeScript handling 1M rows with worker-based sort and filter and an ARIA grid keyboard model; held scroll frames under 12 ms at p95, enforced by a benchmark gate in CI.',
    },
  },
  {
    id: 'micro-frontend-shell',
    title: 'Micro-frontend shell with independent deploys',
    targets: ['maang', 'product'],
    roles: ['sde3'],
    focus: ['frontend', 'fullstack'],
    inspiredBy: ROADMAP_FULLSTACK,
    proves: 'You can design frontend architecture for several teams: independently deployed apps composed at runtime, shared dependencies, a stable contract between them and a way to fail one without breaking the page.',
    core: [
      'A shell app that handles routing, authentication and layout, and loads at least three remote apps at runtime using Module Federation or import maps',
      'A typed contract between the shell and remotes (mount function, props, events) published as a package, with a contract test run by each remote in CI',
      'Shared dependencies such as React and the design system loaded once, with explicit version ranges and a documented upgrade path',
      'Each remote deploys on its own pipeline, and the shell reads a manifest so a new remote version goes live without rebuilding the shell',
      'Isolation: an error boundary per remote with a fallback UI, and a kill switch in the manifest that removes a bad remote without a deploy',
    ],
    stretch: ['Canary release of a remote for a percentage of users', 'Cross-remote state through a small event bus with typed events', 'A bundle-size report per remote that blocks a pull request exceeding its budget'],
    stack: 'TypeScript, Webpack or Vite with Module Federation, React, Playwright, GitHub Actions, any CDN or object storage for static hosting, a JSON manifest served with short cache lifetimes.',
    production: {
      architecture:
        'The shell owns only cross-cutting concerns and discovers remotes through a versioned manifest, so a team can release without coordinating with anyone else. Decision worth defending: the contract between shell and remote is small and tested from both sides, because a micro-frontend system fails at the seams (shared versions, styles, global state), not inside any one app.',
      milestones: [
        'Shell plus two remotes running locally with runtime loading and a shared React instance',
        'Typed contract package and a contract test that fails when a remote breaks the interface',
        'Independent pipelines that deploy each remote to static hosting and update the manifest',
        'Error boundaries and a manifest kill switch, demonstrated by breaking a remote on purpose',
        'Measured page-load cost of the composition against a single bundle, with a written recommendation on when the split pays off',
      ],
      shipIt: [
        'Each remote has its own CI, deploy and rollback, and a deploy of one never rebuilds another',
        'A contract test run in every remote pipeline fails on an incompatible shell interface',
        'A crashing remote shows a fallback, reports the error with the remote name and version, and leaves the rest of the page working',
        'Manifest and remote files use cache rules that allow an instant rollback to the previous version',
        'Duplicate dependency loading is detected in CI and total JavaScript per route stays inside a budget',
        'An architecture decision record explains when not to use micro-frontends and what this setup costs',
      ],
    },
    bullet: {
      template: 'Designed a micro-frontend platform with <shell and N remotes> using <technology>, with <contract tests, per-remote deploys and error isolation>; reduced <release metric> from <before> to <after>.',
      example: 'Designed a micro-frontend platform with a shell and 3 remotes using Module Federation, with contract tests, per-remote deploys and error isolation; cut release lead time from 5 days to 4 hours across 3 teams.',
    },
  },
]
