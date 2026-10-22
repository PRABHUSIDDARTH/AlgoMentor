import type { Focus, Role, Tier } from '@/practice/store'
import { employerById } from '../companies'
import { DATA_PROJECTS } from './resume-projects-data'
import { FRONTEND_PROJECTS } from './resume-projects-frontend'
import { MOBILE_PROJECTS } from './resume-projects-mobile'
import { SDET_PROJECTS } from './resume-projects-sdet'
import { SOURCED_PROJECTS } from './resume-projects-sourced'

export type ResumeProject = {
  id: string
  title: string
  targets: Tier[]
  roles: Role[]
  /** The kinds of engineer this project suits. Never 'general'. */
  focus: Exclude<Focus, 'general'>[]
  /** Where the idea comes from, for projects drawn from a public repository or roadmap. The write-up is our own. */
  inspiredBy?: { label: string; url: string }
  /** What building it shows a recruiter or interviewer. */
  proves: string
  core: string[]
  stretch: string[]
  stack: string
  /** What separates a demo from something that looks like it runs in production. */
  production: {
    /** How the pieces fit together and the one decision worth defending, in two or three sentences. */
    architecture: string
    /** Four to six steps in build order, each ending in something you can show. */
    milestones: string[]
    /** Five to seven checks before you call it done: tests, CI, deploy, observability, docs, failure handling. */
    shipIt: string[]
  }
  /** A fill-in-the-blanks resume line, and an example with plausible numbers. Learners must use their own measured numbers. */
  bullet: { template: string; example: string }
}

const ORIGINAL_PROJECTS: ResumeProject[] = [
  {
    id: 'collab-editor',
    title: 'Real-time collaborative editor',
    targets: ['maang', 'product', 'startup'],
    roles: ['sde1', 'sde2', 'sde3'],
    focus: ['fullstack', 'backend'],
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
    production: {
      architecture:
        'The server is a dumb relay and sequencer: clients apply edits locally to a sequence CRDT and broadcast operations, and the server only persists and fans them out. The decision to defend is CRDT over operational transformation: CRDT characters carry unique ids so operations commute and offline merges need no central transform step, at the cost of per-character metadata that grows and needs garbage collection.',
      milestones: [
        'A single-replica text type with insert and delete by unique character id, plus unit tests, that shows two replicas converging after exchanging operations in swapped order',
        'A randomised test that shuffles and duplicates operations across three replicas and asserts identical text, run for thousands of seeds',
        'A WebSocket relay server and a browser page where two tabs edit one document live',
        'Cursor and presence messages shown as coloured carets, with positions that survive remote inserts before them',
        'An offline mode that queues operations and a recorded demo of two clients editing while disconnected, then converging on reconnect',
        'A measurement of memory per character and a tombstone cleanup that reduces it',
      ],
      shipIt: [
        'The convergence property test runs in CI on every pull request with a fixed seed list plus a few random seeds, and prints the failing seed',
        'Operations are idempotent and deduplicated by id, so a replayed or duplicated WebSocket message cannot change the text',
        'The server validates message size and shape, caps document size and rate-limits each connection so one client cannot flood the room',
        'Documents are persisted as an operation log or snapshot, and a restart test proves a document reloads identically',
        'Reconnects use exponential backoff and resume from the last seen version; a test drops the socket mid-edit and checks no operation is lost',
        'Logs and a metric for connected clients, operation rate and document size make a slow or oversized document visible',
        'The README has a diagram of replica, relay and storage, and a short GIF of two tabs converging after an offline edit',
      ],
    },
    bullet: {
      template: 'Built a real-time collaborative <document type> using <CRDT or OT> over <transport>, so <N> users can edit offline and converge on the same <result>; verified with <testing method>.',
      example: 'Built a real-time collaborative text editor using a sequence CRDT over WebSockets, so 20 users can edit offline and converge on identical text; verified with 10,000 randomised concurrent-edit property tests.',
    },
  },
  {
    id: 'url-shortener',
    title: 'URL shortener with analytics',
    targets: ['startup', 'service', 'product', 'maang'],
    roles: ['intern', 'sde1'],
    focus: ['backend', 'fullstack'],
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
    production: {
      architecture:
        'A stateless API in front of PostgreSQL holds the link table, Redis serves redirects read-through, and click events are pushed to a queue and written in batches by a separate consumer. The decision to defend is recording clicks asynchronously: the redirect path stays a single cache lookup with a stable p99, at the cost of analytics lagging by seconds and possibly losing events if the queue is not durable.',
      milestones: [
        'A create-link endpoint with URL validation and collision-safe code generation (a counter encoded in base62 or a random code with a unique constraint and retry), shown with curl',
        'A redirect endpoint returning 301 or 302 with a documented choice, plus a test that a missing code returns 404',
        'A Redis read-through cache with a TTL, showing hit and miss counts in a log or metrics endpoint',
        'An asynchronous click pipeline whose consumer writes batches, and a script that fires 10,000 clicks and shows matching totals',
        'A per-day clicks dashboard or API response for one link',
        'A k6 or wrk run reporting redirects per second and p99 with and without the cache',
      ],
      shipIt: [
        'Tests cover code collisions by forcing two creates to the same code, and prove exactly one wins while the other retries',
        'CI runs the unit and integration tests against real PostgreSQL and Redis containers on every pull request',
        'Creation is rate limited per IP and per API key, and target URLs are validated for scheme so javascript: and internal addresses are rejected',
        'docker compose up starts the API, database, Redis and consumer with one command, and a health endpoint checks all three',
        'Redirect latency, cache hit ratio and queue lag are exported as metrics, and request logs include the short code',
        'A test with Redis stopped shows redirects fall back to the database and still return correctly, and with the queue down the redirect still succeeds',
        'The README has the architecture diagram and the load-test table, with hardware stated',
      ],
    },
    bullet: {
      template: 'Designed and built a URL shortener with <features> using <stack>; served <N> redirects per second at p99 <latency> with <caching approach>, and tracked <analytics> without slowing redirects.',
      example: 'Designed and built a URL shortener with click analytics using FastAPI, PostgreSQL and Redis; served 4,200 redirects per second at p99 18 ms with a read-through cache, and recorded clicks asynchronously through a queue.',
    },
  },
  {
    id: 'rate-limiter',
    title: 'Distributed rate limiter',
    targets: ['maang', 'product', 'startup'],
    roles: ['sde1', 'sde2', 'sde3'],
    focus: ['backend', 'devops'],
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
    production: {
      architecture:
        'Each app instance runs the limiter as middleware and calls Redis, where a Lua script reads, updates and returns the decision atomically so concurrent instances cannot over-admit. The decision to defend is the shared atomic store versus local counters: one source of truth gives exact limits, at the cost of a network hop per request and a dependency whose failure you must handle with an explicit fail-open or fail-closed policy.',
      milestones: [
        'A token bucket and a sliding-window limiter behind one interface, with unit tests driven by a fake clock that show burst and refill behaviour',
        'A middleware for one web framework returning 429 with Retry-After and rate-limit headers, demonstrated with curl',
        'A Redis Lua script implementing the check atomically, and a test with 50 concurrent clients showing the limit is never exceeded',
        'Rules per user, IP and endpoint loaded from a config file and reloaded without restart',
        'A load run against three instances showing measured over-admission as a percentage',
        'A policy switch for Redis outages and a test for each mode',
      ],
      shipIt: [
        'A concurrency test across several processes asserts total admitted requests never exceeds the configured limit plus the documented tolerance',
        'Time is injected, so tests never sleep, and CI runs them on every pull request with the Redis integration tests in a container',
        'Redis timeouts are short and bounded so a slow store cannot stall every request; a test with Redis killed proves the chosen fail-open or fail-closed behaviour',
        'Metrics count allowed, rejected and store-error decisions per rule, and logs omit raw API keys',
        'Rule config is validated on load and a bad file keeps the previous rules rather than disabling limiting',
        'Keys carry a TTL so idle clients do not grow Redis memory, shown by a memory check after a long run',
        'The README compares burst behaviour of the two algorithms with a chart and states the measured requests per second and Redis round-trip cost',
      ],
    },
    bullet: {
      template: 'Implemented a distributed <algorithm> rate limiter in <language> backed by <store>, enforcing limits across <N> instances with <precision>; load-tested at <rate> requests per second.',
      example: 'Implemented a distributed sliding-window rate limiter in Go backed by Redis, enforcing limits across 6 instances with under 1% over-admission; load-tested at 25,000 requests per second.',
    },
  },
  {
    id: 'job-queue',
    title: 'Job queue with retries',
    targets: ['startup', 'service', 'maang', 'product'],
    roles: ['intern', 'sde1', 'sde2', 'sde3'],
    focus: ['backend', 'devops'],
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
    production: {
      architecture:
        'Producers insert rows into a jobs table and workers claim them with SELECT ... FOR UPDATE SKIP LOCKED, setting a lease deadline; a reaper returns expired leases to the queue and failed jobs move to a dead-letter table after the last attempt. The decision to defend is at-least-once delivery with idempotent handlers over trying for exactly-once: crashes between doing the work and acknowledging it cannot be eliminated, so the handler, not the queue, must make duplicates harmless.',
      milestones: [
        'A jobs table and an enqueue function, with a worker that claims one job at a time and marks it done, shown processing 1,000 jobs',
        'A lease timeout and reaper, with a script that kills a worker with kill -9 mid-job and shows the job finishing on another worker',
        'Retries with exponential backoff and jitter, and a dead-letter table, demonstrated with a handler that always fails',
        'Idempotency keys on the job\'s side effect, with a test that delivers the same job twice and shows one effect',
        'Priorities and an admin command or page listing queued, running and dead jobs',
        'A benchmark of jobs per second across 1, 4 and 8 workers',
      ],
      shipIt: [
        'A test runs many workers against one queue and asserts no job is processed concurrently by two workers while its lease is valid',
        'A crash test kills workers at random and asserts every job completes at least once and its side effect occurs exactly once',
        'CI runs these tests against real PostgreSQL in a container on every pull request',
        'Graceful shutdown finishes or releases the current job on SIGTERM, so a deploy does not wait for a lease to expire',
        'Metrics for queue depth, oldest job age, attempts and dead-letter count, with an alert on oldest job age',
        'Payloads are size-limited, and dead-lettered jobs keep the last error and can be replayed with one command',
        'docker compose up starts database, workers and the UI, and the README shows the state diagram of a job and the benchmark',
      ],
    },
    bullet: {
      template: 'Built a <delivery guarantee> job queue in <language> with <features>, processing <N> jobs per <time unit> across <M> workers and recovering from worker crashes in <time>.',
      example: 'Built an at-least-once job queue in Python on PostgreSQL with exponential-backoff retries and a dead-letter queue, processing 1,500 jobs per second across 8 workers and recovering crashed jobs within 30 seconds.',
    },
  },
  {
    id: 'search-engine',
    title: 'Search engine over a dataset',
    targets: ['maang', 'product'],
    roles: ['sde1', 'sde2', 'sde3'],
    focus: ['backend', 'data'],
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
    production: {
      architecture:
        'An offline indexer tokenises documents and writes an on-disk inverted index (term dictionary plus posting lists); a query service memory-maps the files, intersects or unions posting lists, and scores with BM25. The decision to defend is building the index in immutable segments written offline and merged, rather than updating one file in place: it keeps reads lock-free and writes sequential, at the cost of delayed visibility of new documents and merge work.',
      milestones: [
        'A tokenizer and normaliser with tests, then an in-memory inverted index that answers single-term queries over 1,000 documents',
        'A disk format for the dictionary and postings, with an index of 100,000 documents that reloads after a restart',
        'BM25 ranking with a worked example in the README, shown by a command line that prints the top ten results with scores',
        'Phrase, boolean and prefix queries exposed over an HTTP endpoint',
        'An evaluation script that reads queries with judged results and prints precision at 10 and latency percentiles',
        'A segment merge or compression pass with before and after index sizes',
      ],
      shipIt: [
        'Unit tests check ranking on a tiny hand-computed corpus so a wrong BM25 formula fails the build, and run in CI on every pull request',
        'Round-trip tests write an index, reload it and assert identical query results, and a truncated or corrupt file is rejected with a clear error',
        'The evaluation script runs in CI and fails if precision at 10 drops below the recorded baseline',
        'Query length, result count and execution time are bounded, so a query of thousands of terms cannot exhaust memory',
        'Latency and queries per second are logged, with a benchmark run on a stated dataset and machine',
        'One command builds the index and one command starts the server, both documented, with the dataset download scripted',
        'The README has a diagram of indexer, segments and query service, plus a precision and latency table',
      ],
    },
    bullet: {
      template: 'Built a search engine in <language> indexing <N> documents with <ranking function>, answering queries in <latency> and achieving <metric> on <evaluation set>.',
      example: 'Built a search engine in Rust indexing 250,000 Wikipedia articles with BM25 ranking, answering queries in under 12 ms at p95 and reaching 0.71 precision at 10 on a 50-query evaluation set.',
    },
  },
  {
    id: 'payments-ledger',
    title: 'Payments ledger with idempotency',
    targets: ['startup', 'service', 'product'],
    roles: ['sde1', 'sde2', 'sde3'],
    focus: ['backend', 'data'],
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
    production: {
      architecture:
        'A transfer API writes one transaction containing a request record keyed by the idempotency key plus balanced debit and credit rows in an append-only entries table; balances are computed from entries or from a derived column updated in the same transaction. The decision to defend is immutable entries with a database-enforced idempotency key over mutating balances: you can audit and reconcile any state, at the cost of heavier reads that you cache or project.',
      milestones: [
        'A schema with accounts and an append-only entries table, and a transfer function that writes balanced entries atomically, shown by a test that sums all entries to zero',
        'Integer minor units throughout, with a test that rejects non-integer or negative amounts',
        'An HTTP transfer endpoint with an Idempotency-Key header backed by a unique constraint, shown returning the same response on a replay',
        'Concurrency control with row locks or serialisable transactions, and a test where 200 threads transfer between few accounts without overdrafts',
        'A reconciliation command that recomputes balances from entries and prints any mismatch',
        'A statement export per account for a date range',
      ],
      shipIt: [
        'The concurrency test runs in CI against real PostgreSQL and asserts the global sum is zero and no balance goes negative',
        'A retry test sends the same Idempotency-Key concurrently and after a client timeout, and asserts one transfer and identical responses',
        'A request with the same key but a different body is rejected with a conflict, not silently accepted',
        'Serialisation failures and deadlocks are retried a bounded number of times, with a metric counting them',
        'Entries cannot be updated or deleted: the database role used by the app lacks those privileges, and a test confirms it',
        'Every transfer logs a correlation id with account ids and amount, and no card or credential data is logged',
        'The README documents the isolation level chosen, the failure cases covered, and a diagram of a transfer transaction',
      ],
    },
    bullet: {
      template: 'Built a double-entry payments ledger with <guarantees> using <stack>; handled <N> concurrent transfers with zero balance errors in <test>, with idempotent retries on <API>.',
      example: 'Built a double-entry payments ledger with idempotent transfer APIs using Java and PostgreSQL; ran 100,000 concurrent transfers in a stress test with zero imbalance and no duplicate payments from 5,000 deliberate retries.',
    },
  },
  {
    id: 'mini-git',
    title: 'Mini Git',
    targets: ['maang', 'product'],
    roles: ['sde1', 'sde2'],
    focus: ['backend'],
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
    production: {
      architecture:
        'Objects are stored under .git/objects keyed by the SHA of their content: blobs for files, trees for directories, commits pointing to a tree and parents; refs are small files naming a commit. The decision to defend is content addressing with immutable objects: identical content is deduplicated and history cannot be silently altered, at the cost of storing whole snapshots until packfiles and deltas are added.',
      milestones: [
        'init, hash-object and cat-file working on blobs, with output matching real git hash-object for the same files',
        'Tree and commit writing from add and commit, with git log from the real git reading your repository without errors',
        'Branches, checkout and fast-forward merge, with a script that creates a branch, commits and switches back',
        'A line diff (for example Myers) and a three-way merge that writes conflict markers, with tests on known cases',
        'A differential test runner that executes the same command sequence in your tool and in real git and compares trees and logs',
        'Packfile reading or a simple compression of objects with measured size reduction',
      ],
      shipIt: [
        'Differential tests against the installed git run in CI over a library of scripted scenarios, including merge conflicts',
        'Object writes are atomic (write to a temp file and rename), and a test interrupts a commit and shows the repository is still valid',
        'Paths from tree objects are validated so a crafted object cannot write outside the working directory',
        'Reading an object verifies its hash and reports corruption instead of using it',
        'Error messages for common mistakes such as nothing to commit or unknown ref are tested',
        'One command builds a single binary, and the README has a diagram of the object graph for a small example',
        'A benchmark of commit and checkout time on a repository with thousands of files, compared with real git',
      ],
    },
    bullet: {
      template: 'Implemented a Git-compatible version control system in <language> with <features>, using <storage design>; verified against real Git on <N> scenarios.',
      example: 'Implemented a Git-compatible version control system in Go with commits, branches and three-way merge, using content-addressed object storage; verified against real Git on 40 scripted scenarios.',
    },
  },
  {
    id: 'code-runner',
    title: 'Sandboxed code runner',
    targets: ['maang', 'product'],
    roles: ['sde1', 'sde2', 'sde3'],
    focus: ['backend', 'devops'],
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
    production: {
      architecture:
        'An API enqueues submissions; workers run each one in a fresh sandbox (namespaces, cgroup limits, seccomp, no network, read-only root with a small writable tmpfs) and return output plus verdict. The decision to defend is a container or namespace sandbox per run on top of a pool of workers rather than a long-lived interpreter: strong isolation and clean teardown, at the cost of start-up latency, which you reduce with pre-created sandbox templates.',
      milestones: [
        'A runner that executes a fixed program in a child process with a wall-clock timeout and captured output, shown on a hello-world and an infinite loop',
        'CPU, memory and process-count limits via cgroups or rlimits, demonstrated by a memory hog killed with a clear verdict',
        'Namespace isolation with no network and a read-only filesystem, shown by tests that fail to reach the internet or write to /',
        'An HTTP API that accepts code and input and returns output, exit status and time',
        'A hostile test suite: fork bomb, memory allocation, disk fill, output flood and network call, all contained',
        'A worker pool with a queue and a load test of submissions per second',
      ],
      shipIt: [
        'The hostile-program suite runs in CI on every pull request and fails if any program escapes limits or leaves processes or mounts behind',
        'After every run the sandbox is destroyed and a leak check counts remaining processes, cgroups and mount points',
        'Output is capped, so a program printing gigabytes cannot exhaust the host or the response',
        'The sandbox runs as an unprivileged user with capabilities dropped and a seccomp allowlist, documented in the README with the threat model',
        'The API requires authentication, limits submission size and rate per user, and rejects requests when the queue is full with 429',
        'Metrics for queue wait, run time, and verdict counts, plus structured logs per submission id',
        'docker compose up runs the API and workers, and the README shows the sandbox layers diagram and a run of the escape tests',
      ],
    },
    bullet: {
      template: 'Built a sandboxed code execution service in <language> using <isolation technology>, enforcing <limits>; safely ran <N> submissions including <adversarial cases>.',
      example: 'Built a sandboxed code execution service in Go using Linux namespaces and cgroups, enforcing 2-second CPU and 128 MB limits; safely ran 5,000 submissions including fork bombs and memory exhaustion attempts.',
    },
  },
  {
    id: 'realtime-chat',
    title: 'Real-time chat with presence and history',
    targets: ['startup', 'service', 'product'],
    roles: ['intern', 'sde1'],
    focus: ['fullstack', 'frontend'],
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
    production: {
      architecture:
        'Clients keep a WebSocket to a stateless gateway that authenticates the token, checks room membership and writes each message to PostgreSQL with a per-room sequence number before broadcasting it. The decision to defend is persisting before broadcast and numbering messages per room: reconnecting clients ask for everything after their last sequence number with no gaps or duplicates, at the cost of a database write on the delivery path.',
      milestones: [
        'Two browser tabs exchanging messages in a room over WebSocket, with nicknames shown',
        'Messages stored with a per-room sequence number and a paginated history endpoint that loads older pages on scroll',
        'Token login and a membership check that blocks a non-member from joining or reading a private room',
        'Presence and typing indicators driven by heartbeats, with users removed after a timeout',
        'A reconnect that resumes from the last sequence number, demonstrated by dropping the network and showing no gap or duplicate',
        'A second server instance using Redis pub/sub, with a demo of two users on different servers chatting',
      ],
      shipIt: [
        'Tests cover authorisation: a non-member cannot join, read history, or receive broadcasts, and an expired token closes the socket',
        'A reconnect test kills the connection mid-conversation and asserts the received sequence is complete and ordered',
        'Messages are length-limited and rendered as text, never as HTML, with a test for an injected script tag',
        'Per-connection send rate is limited and slow consumers are disconnected rather than buffering unbounded memory',
        'Metrics for open connections, messages per second and delivery latency, and logs with room and message ids but not content',
        'CI runs unit, WebSocket integration and one browser test on every pull request, and one command starts the stack',
        'The README includes the sequence diagram of send, persist and broadcast, and a load-test result for concurrent connections',
      ],
    },
    bullet: {
      template: 'Developed a real-time chat application with <features> using <stack>, supporting <N> concurrent connections with <latency> message delivery and <reliability feature>.',
      example: 'Developed a real-time chat application with rooms, presence and paginated history using Node, WebSockets and PostgreSQL, supporting 3,000 concurrent connections with median delivery under 40 ms and gap-free reconnection.',
    },
  },
  {
    id: 'feature-flags',
    title: 'Feature-flag service with gradual rollout',
    targets: ['startup', 'service', 'product'],
    roles: ['intern', 'sde1', 'sde2'],
    focus: ['backend', 'fullstack', 'devops'],
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
    production: {
      architecture:
        'An admin API stores flags and rules in PostgreSQL and publishes versioned snapshots; the SDK downloads the snapshot, evaluates rules locally with a deterministic hash of flag key and user id, and polls or streams for changes. The decision to defend is local evaluation from a cached snapshot rather than a call per check: flag checks add no latency and survive outages, at the cost of changes taking seconds to propagate and a stale-cache policy to define.',
      milestones: [
        'A flag CRUD API and a basic UI to toggle a flag, with every change written to an audit table',
        'Deterministic bucketing using hash(flag key + user id) modulo 100, with a test showing 10% rollout selects about 10% of 100,000 ids and is stable between runs',
        'Targeting rules on user attributes evaluated in a pure function with table-driven tests',
        'A client SDK that fetches a snapshot, caches it on disk and evaluates locally, shown working with the server stopped',
        'Change propagation by polling with ETag or server-sent events, demonstrated by a flag flipping in a running demo app',
        'An evaluation counter report per flag',
      ],
      shipIt: [
        'Bucketing tests prove stability: raising a rollout from 10% to 20% keeps every user in the first 10% included',
        'A failure test stops the service and asserts the SDK keeps serving the last snapshot and falls back to the coded default for an unseen flag',
        'Admin endpoints require authentication and role checks, SDK keys are separate from admin credentials, and keys can be rotated',
        'Rule input is validated, and a malformed rule is rejected on save rather than breaking evaluation',
        'The audit log records actor, old value and new value, and a test confirms every write path creates an entry',
        'Metrics for evaluation count, snapshot age in the SDK and propagation delay, with a log when the snapshot is stale',
        'CI tests the server and the SDKs on each pull request, and the README includes a diagram of server, snapshot and SDK with a measured evaluations-per-second figure',
      ],
    },
    bullet: {
      template: 'Built a feature-flag service with <features> and a <language> client SDK; supports <N> flag evaluations per second with <cache approach> and keeps working during <failure>.',
      example: 'Built a feature-flag service with percentage rollouts and targeting rules plus a TypeScript client SDK; supports 50,000 evaluations per second from a local cache and keeps working through service outages.',
    },
  },
  {
    id: 'metrics-pipeline',
    title: 'Metrics and log pipeline with a dashboard',
    targets: ['maang', 'service', 'product'],
    roles: ['sde1', 'sde2', 'sde3'],
    focus: ['data', 'devops'],
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
    production: {
      architecture:
        'Agents post batches to an ingest service that validates, appends to a bounded buffer or log, and returns 429 when full; aggregators roll points into per-minute buckets stored in a time-partitioned table, and a rollup job coarsens old data. The decision to defend is aggregating at write time into buckets with bounded memory: queries are fast and storage is predictable, at the cost of losing raw points and limiting you to the aggregations you chose, such as sketches for percentiles.',
      milestones: [
        'An ingest endpoint that accepts batches and a generator that sends them, with a counter showing points received',
        'Per-minute bucket aggregation of count, sum, min, max and a percentile estimate, verified against a brute-force calculation on sample data',
        'Time-partitioned storage with a retention job that rolls hourly data into coarser buckets and deletes the rest',
        'A query API and dashboard with charts and a time range picker',
        'Backpressure: a load generator above capacity gets 429 responses while memory stays flat',
        'A report of sustained ingest rate and query latency for 1, 24 and 168 hour ranges',
      ],
      shipIt: [
        'Aggregation tests compare bucket results with a naive computation on random data, including late and out-of-order points',
        'An overload test pushes more than capacity and asserts bounded memory, 429 responses and no crash, with the dropped count visible in metrics',
        'Ingest validates timestamps, label counts and cardinality limits, so a client creating unbounded label values is rejected',
        'Ingest uses API keys per tenant, and keys never appear in logs',
        'The pipeline emits its own metrics: ingest rate, buffer depth, flush latency and query latency, shown on a self-monitoring dashboard',
        'A restart test shows buffered data is flushed on SIGTERM and recovered from the log after a crash with a stated maximum loss',
        'CI runs the tests on every pull request, docker compose up starts the full stack, and the README shows the architecture and benchmark',
      ],
    },
    bullet: {
      template: 'Built a metrics pipeline in <language> ingesting <N> events per second with <aggregation>, <retention design> and a <dashboard tech> dashboard; queries return in <latency>.',
      example: 'Built a metrics pipeline in Go ingesting 80,000 events per second with per-minute rollups and tiered retention, plus a React dashboard; queries over 24 hours return in under 150 ms.',
    },
  },
  {
    id: 'mini-redis',
    title: 'Mini Redis: an in-memory data store',
    targets: ['maang', 'startup', 'product'],
    roles: ['sde1', 'sde2', 'sde3'],
    focus: ['backend'],
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
    production: {
      architecture:
        'A single-threaded event loop (epoll or an async runtime) parses RESP frames, executes commands against in-memory dictionaries and sorted structures, and writes replies, while a timer handles active expiry sampling. The decision to defend is one thread owning all data: commands are atomic with no locks and behaviour is easy to reason about, at the cost of one slow command blocking everyone and one core limiting throughput.',
      milestones: [
        'A RESP parser and TCP server answering PING, SET and GET, verified with the real redis-cli',
        'Lists, hashes and sorted sets with their common commands and a command-by-command test table',
        'Expiry with lazy deletion on access and an active sampler, shown by keys disappearing on time without being read',
        'A memory limit with approximate or exact LRU eviction, tested with a known access pattern',
        'A redis-benchmark run with many concurrent clients compared against real Redis',
        'Append-only-file persistence that replays on restart',
      ],
      shipIt: [
        'Protocol tests feed fragmented, pipelined and malformed RESP input and assert correct replies without a crash or hang',
        'A differential test runs the same command script against real Redis and your server and compares replies',
        'Limits on bulk string size, argument count and client output buffer protect memory from a hostile client',
        'An idle-client timeout and a connection cap stop file descriptor exhaustion, with a test opening thousands of connections',
        'Eviction and expiry tests use an injected clock, and a persistence test kills the server and checks recovery after restart',
        'INFO-style output reports memory, clients, hits, misses and evictions, and slow commands are logged',
        'CI runs the tests and a short benchmark on every pull request, and the README has the benchmark table and event-loop diagram',
      ],
    },
    bullet: {
      template: 'Built a Redis-compatible in-memory store in <language> supporting <data types> with <expiry and eviction>; handles <N> operations per second on <hardware>, within <X>% of Redis.',
      example: 'Built a Redis-compatible in-memory store in Rust supporting strings, lists, hashes and sorted sets with TTL expiry and LRU eviction; handles 180,000 operations per second on a laptop, within 25% of Redis.',
    },
  },
]

export const RESUME_PROJECTS: ResumeProject[] = [...ORIGINAL_PROJECTS, ...SOURCED_PROJECTS, ...FRONTEND_PROJECTS, ...MOBILE_PROJECTS, ...SDET_PROJECTS, ...DATA_PROJECTS]

export type CompanyFilter = Tier | 'all'
export type RoleFilter = Role | 'all'
export type FocusFilter = Exclude<Focus, 'general'> | 'all'

/**
 * Tier, level, focus and, optionally, one company from the directory. A company matches the projects written for its tier,
 * and only when the tier filter (if any) is that same tier.
 */
export function matchesFilter(p: ResumeProject, tier: CompanyFilter, role: RoleFilter, focus: FocusFilter = 'all', companyId = 'all'): boolean {
  if (companyId !== 'all') {
    const employer = employerById(companyId)
    if (!employer || !p.targets.includes(employer.tier) || (tier !== 'all' && tier !== employer.tier)) return false
  }
  return (tier === 'all' || p.targets.includes(tier)) && (role === 'all' || p.roles.includes(role)) && (focus === 'all' || p.focus.includes(focus))
}
