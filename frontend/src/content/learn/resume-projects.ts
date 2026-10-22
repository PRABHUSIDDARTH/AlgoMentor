import type { Tier, Role } from '@/practice/store'

export type ResumeProject = {
  id: string
  title: string
  targets: Tier[]
  roles: Role[]
  /** What building it shows a recruiter or interviewer. */
  proves: string
  core: string[]
  stretch: string[]
  stack: string
  /** A fill-in-the-blanks resume line, and an example with plausible numbers. Learners must use their own measured numbers. */
  bullet: { template: string; example: string }
}

export const RESUME_PROJECTS: ResumeProject[] = [
  {
    id: 'collab-editor',
    title: 'Real-time collaborative editor',
    targets: ['maang', 'startup'],
    roles: ['sde1', 'sde2'],
    proves: 'You can reason about concurrent edits and convergence: the hard problem behind shared documents, whiteboards and design tools.',
    core: [
      'A shared text document that several browser tabs can edit at once over WebSockets',
      'A conflict-free approach, such as a sequence CRDT or operational transformation, so every client ends with the same text',
      'Cursor and presence indicators for each collaborator',
      'Offline edits that merge cleanly when the client reconnects',
      'A test that applies the same edits in many random orders and asserts every replica converges',
    ],
    stretch: ['Rich text formatting', 'Document history with undo per user', 'A compact binary sync protocol, with the size savings measured'],
    stack: 'TypeScript with WebSockets and a small Node server, or Go or Rust for the server. Studying Yjs or Automerge is fine, but write the core yourself.',
    bullet: {
      template: 'Built a real-time collaborative <document type> using <CRDT or OT> over <transport>, so <N> users can edit offline and converge on the same <result>; verified with <testing method>.',
      example: 'Built a real-time collaborative text editor using a sequence CRDT over WebSockets, so 20 users can edit offline and converge on identical text; verified with 10,000 randomised concurrent-edit property tests.',
    },
  },
  {
    id: 'url-shortener',
    title: 'URL shortener with analytics',
    targets: ['startup', 'service', 'maang'],
    roles: ['intern', 'sde1'],
    proves: 'You can build a complete, small web service end to end: API, data model, caching, a redirect that must be fast, and numbers about how it is used.',
    core: [
      'An API to create a short link for a long URL, with unique codes and validation of the URL',
      'A redirect endpoint that returns the right 301 or 302 and is covered by a cache',
      'Click analytics: count, time, referrer and country, stored without slowing the redirect',
      'A dashboard page or API showing clicks per link per day',
      'Rate limiting on link creation and a tested way to avoid code collisions',
    ],
    stretch: ['Custom aliases and link expiry', 'Batch analytics writes through a queue and measure the throughput gain', 'A load test that reports redirects per second and the 99th percentile latency'],
    stack: 'Any web framework with a relational database and Redis or an in-process cache. A load-testing tool such as k6, wrk or Locust.',
    bullet: {
      template: 'Designed and built a URL shortener with <features> using <stack>; served <N> redirects per second at p99 <latency> with <caching approach>, and tracked <analytics> without slowing redirects.',
      example: 'Designed and built a URL shortener with click analytics using FastAPI, PostgreSQL and Redis; served 4,200 redirects per second at p99 18 ms with a read-through cache, and recorded clicks asynchronously through a queue.',
    },
  },
  {
    id: 'rate-limiter',
    title: 'Distributed rate limiter',
    targets: ['maang', 'startup'],
    roles: ['sde1', 'sde2'],
    proves: 'You understand algorithms for limiting traffic, and what changes when the limiter itself runs on many servers.',
    core: [
      'Token bucket and sliding-window limiters behind one interface, with unit tests using a fake clock',
      'A shared store, such as Redis with an atomic script, so several app instances enforce one limit',
      'Per-user, per-IP and per-endpoint rules loaded from configuration',
      'Standard response headers and a 429 with a Retry-After value',
      'A test with many concurrent clients that proves the limit holds, not just in single-threaded runs',
    ],
    stretch: ['A fail-open versus fail-closed policy when the store is down, with a test for each', 'Local pre-checks that cut calls to the shared store', 'A comparison of the two algorithms\' burst behaviour in your README'],
    stack: 'Go, Java or Python with Redis. A middleware for a web framework makes a good demo.',
    bullet: {
      template: 'Implemented a distributed <algorithm> rate limiter in <language> backed by <store>, enforcing limits across <N> instances with <precision>; load-tested at <rate> requests per second.',
      example: 'Implemented a distributed sliding-window rate limiter in Go backed by Redis, enforcing limits across 6 instances with under 1% over-admission; load-tested at 25,000 requests per second.',
    },
  },
  {
    id: 'job-queue',
    title: 'Job queue with retries',
    targets: ['startup', 'service', 'maang'],
    roles: ['intern', 'sde1', 'sde2'],
    proves: 'You know how background work is done reliably: acknowledgements, retries with backoff, idempotency and what happens when workers crash.',
    core: [
      'Producers enqueue jobs with a payload and a priority; workers pull and run them',
      'At-least-once delivery: a job is only removed after the worker acknowledges success',
      'Retries with exponential backoff and jitter, and a dead-letter queue after the last attempt',
      'A visibility timeout so a crashed worker\'s job goes back to the queue',
      'Idempotency keys, so running a job twice has the same effect as once, shown with a test',
    ],
    stretch: ['Delayed and scheduled jobs', 'A small web UI listing queued, running and failed jobs', 'Metrics for queue depth and processing time'],
    stack: 'Any language with PostgreSQL (using SELECT ... FOR UPDATE SKIP LOCKED) or Redis as the store.',
    bullet: {
      template: 'Built a <delivery guarantee> job queue in <language> with <features>, processing <N> jobs per <time unit> across <M> workers and recovering from worker crashes in <time>.',
      example: 'Built an at-least-once job queue in Python on PostgreSQL with exponential-backoff retries and a dead-letter queue, processing 1,500 jobs per second across 8 workers and recovering crashed jobs within 30 seconds.',
    },
  },
  {
    id: 'search-engine',
    title: 'Search engine over a dataset',
    targets: ['maang'],
    roles: ['sde1', 'sde2'],
    proves: 'You can build the core of information retrieval: indexing, ranking and query processing, and you can measure whether the results are any good.',
    core: [
      'An ingestion step that tokenises, normalises and indexes at least 100,000 documents',
      'An inverted index with posting lists stored on disk, not just in memory',
      'Ranking with TF-IDF or BM25, with the formula explained in the README',
      'Phrase and boolean queries, and prefix search for autocomplete',
      'An evaluation: a set of queries with known good results, and a report of precision at 10',
    ],
    stretch: ['Index compression such as variable-byte encoding, with the size reduction measured', 'Sharded indexing across several processes', 'Typo-tolerant search using edit distance or n-grams'],
    stack: 'Any systems-friendly language: Rust, Go, Java or C++. Public datasets such as Wikipedia abstracts work well.',
    bullet: {
      template: 'Built a search engine in <language> indexing <N> documents with <ranking function>, answering queries in <latency> and achieving <metric> on <evaluation set>.',
      example: 'Built a search engine in Rust indexing 250,000 Wikipedia articles with BM25 ranking, answering queries in under 12 ms at p95 and reaching 0.71 precision at 10 on a 50-query evaluation set.',
    },
  },
  {
    id: 'payments-ledger',
    title: 'Payments ledger with idempotency',
    targets: ['startup', 'service'],
    roles: ['sde1', 'sde2'],
    proves: 'You take correctness seriously: money moves exactly once, books always balance, and retries are safe.',
    core: [
      'Double-entry accounting: every transfer writes balanced debit and credit entries in one database transaction',
      'Amounts stored as integer minor units, never floating point',
      'Idempotency keys on the transfer API, so a retried request returns the original result instead of paying twice',
      'Balances derived from immutable entries, with a reconciliation check that totals always sum to zero',
      'Concurrency tests that run many simultaneous transfers and assert no balance goes negative and the books balance',
    ],
    stretch: ['Multi-currency accounts with an exchange-rate table', 'An audit log and a statement export', 'Holds and captures, as card payments use'],
    stack: 'Any backend language with PostgreSQL. Use serialisable transactions or explicit row locks, and say which in your README.',
    bullet: {
      template: 'Built a double-entry payments ledger with <guarantees> using <stack>; handled <N> concurrent transfers with zero balance errors in <test>, with idempotent retries on <API>.',
      example: 'Built a double-entry payments ledger with idempotent transfer APIs using Java and PostgreSQL; ran 100,000 concurrent transfers in a stress test with zero imbalance and no duplicate payments from 5,000 deliberate retries.',
    },
  },
  {
    id: 'mini-git',
    title: 'Mini Git',
    targets: ['maang'],
    roles: ['sde1', 'sde2'],
    proves: 'You understand how a tool you use every day works inside: content-addressed storage, a commit graph, and diffs.',
    core: [
      'init, add, commit and log commands, storing objects by the hash of their content',
      'Blob, tree and commit objects with the same structure as Git\'s, and a refs directory for branches',
      'Branches, checkout and a fast-forward merge',
      'A three-way merge that detects conflicts, with a line-based diff algorithm you wrote',
      'Tests that compare your results with real Git on the same sequence of commands',
    ],
    stretch: ['Packfiles with delta compression', 'A simple network protocol to push and fetch between two repositories', 'Interactive rebase for a simple case'],
    stack: 'Rust, Go, C or Python. Read the "Git Internals" chapter of Pro Git first.',
    bullet: {
      template: 'Implemented a Git-compatible version control system in <language> with <features>, using <storage design>; verified against real Git on <N> scenarios.',
      example: 'Implemented a Git-compatible version control system in Go with commits, branches and three-way merge, using content-addressed object storage; verified against real Git on 40 scripted scenarios.',
    },
  },
  {
    id: 'code-runner',
    title: 'Sandboxed code runner',
    targets: ['maang'],
    roles: ['sde1', 'sde2'],
    proves: 'You know how untrusted code is run safely: process isolation, resource limits and timeouts, the same ideas as online judges.',
    core: [
      'An API that accepts source code and input, and returns output, exit status and run time',
      'Execution in an isolated process with CPU time, memory and process-count limits',
      'No network access and a read-only file system for the submitted code',
      'A wall-clock timeout that kills runaway programs and their children',
      'Tests with hostile programs: an infinite loop, a fork bomb, huge memory allocation and a file-system write',
    ],
    stretch: ['Support several languages with a compile step', 'A worker pool with a queue, so many submissions run in parallel', 'Per-test-case judging with a verdict such as Accepted or Time Limit Exceeded'],
    stack: 'Linux features such as namespaces, cgroups and seccomp through Docker or a small runtime. Python, Go or Rust for the service.',
    bullet: {
      template: 'Built a sandboxed code execution service in <language> using <isolation technology>, enforcing <limits>; safely ran <N> submissions including <adversarial cases>.',
      example: 'Built a sandboxed code execution service in Go using Linux namespaces and cgroups, enforcing 2-second CPU and 128 MB limits; safely ran 5,000 submissions including fork bombs and memory exhaustion attempts.',
    },
  },
  {
    id: 'realtime-chat',
    title: 'Real-time chat with presence and history',
    targets: ['startup', 'service'],
    roles: ['intern', 'sde1'],
    proves: 'You can build the kind of stateful, real-time feature most products need: connections, rooms, message history and who is online.',
    core: [
      'WebSocket chat with rooms, nicknames and messages delivered to everyone in the room',
      'Messages stored in a database, with paginated history that loads as you scroll up',
      'Presence: who is online, with typing indicators',
      'Authentication with sessions or tokens, and authorisation so only members read a private room',
      'Reconnection that resumes from the last message the client saw, without duplicates',
    ],
    stretch: ['Scale to two server instances using a message broker so rooms span servers', 'Read receipts', 'File or image sharing with size limits'],
    stack: 'Node, Python or Go with WebSockets, PostgreSQL, and Redis pub/sub for the stretch goal. Any frontend framework.',
    bullet: {
      template: 'Developed a real-time chat application with <features> using <stack>, supporting <N> concurrent connections with <latency> message delivery and <reliability feature>.',
      example: 'Developed a real-time chat application with rooms, presence and paginated history using Node, WebSockets and PostgreSQL, supporting 3,000 concurrent connections with median delivery under 40 ms and gap-free reconnection.',
    },
  },
  {
    id: 'feature-flags',
    title: 'Feature-flag service with gradual rollout',
    targets: ['startup', 'service'],
    roles: ['intern', 'sde1'],
    proves: 'You can design a small platform service with a clean API, a client library and careful behaviour under failure.',
    core: [
      'An admin API and a simple UI to create flags, turn them on and off, and set a rollout percentage',
      'Stable bucketing: the same user always lands in the same bucket, so a 10% rollout is a fixed 10% of users',
      'Targeting rules, such as by country or user attribute',
      'A client library that caches flags locally and still works when the service is down',
      'An audit log of who changed which flag and when',
    ],
    stretch: ['Percentage rollouts that ramp up on a schedule', 'Live updates pushed to clients with server-sent events', 'A report of how many evaluations each flag gets'],
    stack: 'Any backend and database, plus a small client library in a second language to prove the API is clean.',
    bullet: {
      template: 'Built a feature-flag service with <features> and a <language> client SDK; supports <N> flag evaluations per second with <cache approach> and keeps working during <failure>.',
      example: 'Built a feature-flag service with percentage rollouts and targeting rules plus a TypeScript client SDK; supports 50,000 evaluations per second from a local cache and keeps working through service outages.',
    },
  },
  {
    id: 'metrics-pipeline',
    title: 'Metrics and log pipeline with a dashboard',
    targets: ['maang', 'service'],
    roles: ['sde1', 'sde2'],
    proves: 'You can move and summarise a large stream of data: ingestion, aggregation, storage and a way for people to see it.',
    core: [
      'An ingest endpoint that accepts metric points and log lines in batches, with backpressure when overloaded',
      'Aggregation into time buckets (counts, sums and percentiles) as data arrives',
      'Storage with a retention policy that rolls old data up into coarser buckets',
      'A query API and a dashboard with charts and a time range picker',
      'A load generator and a report of sustained ingest rate and query latency',
    ],
    stretch: ['Alert rules that fire when a metric crosses a threshold', 'Approximate percentiles with a sketch such as t-digest, with the error measured', 'Multi-tenant isolation'],
    stack: 'Go, Java or Python for ingest; SQLite, PostgreSQL or a time-series store; a charting library for the dashboard.',
    bullet: {
      template: 'Built a metrics pipeline in <language> ingesting <N> events per second with <aggregation>, <retention design> and a <dashboard tech> dashboard; queries return in <latency>.',
      example: 'Built a metrics pipeline in Go ingesting 80,000 events per second with per-minute rollups and tiered retention, plus a React dashboard; queries over 24 hours return in under 150 ms.',
    },
  },
  {
    id: 'mini-redis',
    title: 'Mini Redis: an in-memory data store',
    targets: ['maang', 'startup'],
    roles: ['sde1', 'sde2'],
    proves: 'You can build a networked server with a real protocol, rich data structures, expiry and eviction, and you can reason about its performance.',
    core: [
      'A TCP server that speaks the RESP protocol, so the real redis-cli can talk to it',
      'Strings, lists, hashes and sorted sets, with the commands that make them useful',
      'Key expiry with both lazy deletion on access and active background expiry',
      'A memory limit with LRU eviction, tested against a known access pattern',
      'Many concurrent clients served by an event loop or a thread pool, with a benchmark against real Redis',
    ],
    stretch: ['Append-only-file persistence with replay on start-up', 'Pub/sub channels', 'Transactions with MULTI and EXEC'],
    stack: 'Rust, Go, C++ or Java. redis-benchmark and redis-cli are handy for testing.',
    bullet: {
      template: 'Built a Redis-compatible in-memory store in <language> supporting <data types> with <expiry and eviction>; handles <N> operations per second on <hardware>, within <X>% of Redis.',
      example: 'Built a Redis-compatible in-memory store in Rust supporting strings, lists, hashes and sorted sets with TTL expiry and LRU eviction; handles 180,000 operations per second on a laptop, within 25% of Redis.',
    },
  },
]

export type CompanyFilter = Tier | 'all'
export type RoleFilter = Role | 'all'

export function matchesFilter(p: ResumeProject, company: CompanyFilter, role: RoleFilter): boolean {
  return (company === 'all' || p.targets.includes(company)) && (role === 'all' || p.roles.includes(role))
}
