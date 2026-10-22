# About page, dream ID card, company directory, projects and contributions

Branch `design-pass`. Asked for: settings as a page under a new About nav section; a React Bits Lanyard with an
inspirational ID card for the user's dream company (companies worldwide); "you are X% ready" for that company; profile
handles tracked live; share on LinkedIn; a company filter on projects with at least 20 production-grade projects per
role; and a way for placed users to contribute the project that helped them, reviewed before it is published.

## Decisions
- **The card is a goal card, not an employee ID.** It reads "Dream ID", "Aspiring <level> at <Company>", shows the
  readiness percentage and AlgoMentor branding, and has no employee number, barcode or "employee" wording, so it cannot
  pass as a real company badge. A line on the page says AlgoMentor is not affiliated with the companies shown.
- **Logos** come from Simple Icons (CC0 SVG data; trademarks stay with their owners). Many big brands (Amazon,
  Microsoft, LinkedIn, Salesforce and others) asked Simple Icons to remove theirs, so those companies get a monogram.
- **Company directory**: about 200 employers across India, the US, the UK, Europe, Israel, East and South-East Asia,
  Australia, Canada and Latin America, with name, country, tier and sector. Seeded from Wikipedia's largest technology
  companies and unicorn lists, Failory and Tracxn's Indian unicorn lists, and the NIFTY IT index. Hiring processes stay
  limited to the 14 verified companies; other companies say the process is not yet verified and use their tier's weights.
- **LinkedIn**: LinkedIn has no API for posting from a third-party page without OAuth app review, and its profile data
  cannot be read. "Share on LinkedIn" downloads the card as a PNG and opens LinkedIn's post composer with the text filled
  in; the user attaches the image. The LinkedIn username is used for the card and the profile link only.
- **Live tracking**: LeetCode, HackerRank, GeeksforGeeks and (new) GitHub refresh when the About page opens, every 10
  minutes while it is visible, when the window regains focus, and on demand. Email is stored in the browser only and is
  sent nowhere unless the user adds it to a contribution.
- **Readiness for the dream company**: the lower of DSA readiness and Core CS readiness against that company's target
  (tier, level, focus and, for verified companies, their emphasis), the same number Today shows, with both parts listed.

## Navigation
- New section **About** (`/about`): tabs Profile (`/about`) and Settings (`/about/settings`). The fixed gear button on
  every page is removed; the About page header has a settings gear that opens `/about/settings`.
- `/about/settings` is the full settings form as a page: profiles (LeetCode, HackerRank, GeeksforGeeks, GitHub, LinkedIn,
  email), target (dream company search, tier, level, focus) and daily goal.

## Projects
- At least 20 projects per level (Intern, SDE-1, SDE-2, Senior SDE). Each gains production detail: architecture,
  milestones, and a "ship it" checklist (tests, CI, deploy, observability, docs).
- Filters: Company (every company in the directory, searchable; a company matches projects for its tier), Level, Focus.

## Contributions
- "Share the project that got you in": company, role, level, project title, what it is, why it mattered in the
  interview, repository URL, stack, optional name and LinkedIn. Submitted to `POST /api/contributions`.
- Stored by the server in a JSON file (`algomentor.contributions.file`), status pending. Rate-limited per IP, size-limited,
  validated. Approved entries are served by `GET /api/contributions` and shown on the Resume page as "From people who got
  in" (plain text only, labelled as shared by users and not verified by AlgoMentor).
- Review: `/admin/review` (not in the navbar) lists pending entries and approves or rejects them with the `ADMIN_TOKEN`
  set on the server. Without `ADMIN_TOKEN` the review API is disabled.

## Testing
Unit tests for the directory, card renderer inputs, readiness, settings page, About page, share text, project counts
and filters, contribution form; Spring tests for the contribution API (validation, rate limit, admin token, approval);
e2e for the About page, settings page, the card's 2D fallback, the company filter and a contribution through review.
