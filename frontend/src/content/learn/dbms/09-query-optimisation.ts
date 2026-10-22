import type { Lesson } from '../types'

const lesson: Lesson = {
  id: 'query-optimisation',
  title: 'Query processing & optimisation',
  minutes: 10,
  body: `## From SQL text to results

When you send a query, the database goes through four stages:

1. **Parse**: check the syntax and build a tree.
2. **Analyse**: resolve table and column names, check types and permissions.
3. **Optimise**: consider many equivalent ways to compute the result and pick the cheapest.
4. **Execute**: run the chosen **plan**, a tree of operators such as scans, joins, sorts and aggregates.

The optimiser is why SQL can stay declarative. You say what you want; it decides how.

## Plans are trees of operators

Common operators you will see:

- **Sequential scan**: read the whole table.
- **Index scan**: walk an index and fetch matching rows; **index-only scan** when the index covers the query.
- **Bitmap scan**: collect matching row locations from one or more indexes, then read the pages in order.
- **Nested loop**, **hash join** and **merge join** for joins.
- **Sort**, **hash aggregate** and **limit**.

## Cost-based optimisation

The optimiser estimates the **cost** of each candidate plan from **statistics**: row counts, value distributions (histograms), the number of distinct values and the fraction of nulls per column. From these it estimates how many rows each step produces (**cardinality estimation**) and picks the plan with the lowest estimated cost in disk reads and CPU.

The search space grows fast: the number of possible join orders explodes with the number of tables, so optimisers use dynamic programming for small queries and heuristics for large ones. They also apply rewrites: pushing filters down so rows are discarded early, turning subqueries into joins, and removing unnecessary joins.

Bad estimates cause most bad plans. If statistics say a filter matches 10 rows but it really matches 2 million, the optimiser might choose a nested loop that runs for an hour. Keeping statistics fresh (\`ANALYZE\` in PostgreSQL, automatic in most systems) fixes a surprising number of slow queries.

## Reading EXPLAIN

\`EXPLAIN\` shows the chosen plan; \`EXPLAIN ANALYZE\` actually runs the query and adds real row counts and timings. When reading one:

- Start from the innermost (most indented) nodes; they run first.
- Compare **estimated rows** with **actual rows**. A large mismatch points at stale statistics or correlated columns the optimiser doesn't understand.
- Look for sequential scans on big tables inside loops, sorts that spill to disk, and nested loops over large inputs.

## A practical tuning checklist

1. Find the slow queries first, from slow-query logs or monitoring. Don't guess.
2. Run \`EXPLAIN ANALYZE\` and find the step where time actually goes.
3. Add or adjust an index that matches the filter and sort (leftmost prefix, equality columns first).
4. Rewrite non-sargable conditions: avoid functions on indexed columns and leading wildcards.
5. Select only the columns you need; \`SELECT *\` defeats covering indexes and moves more data.
6. Fix the **N+1 query problem** in application code: one query for a list, then one query per item. Load the related rows in a single join or an \`IN\` query instead. ORMs make this mistake easy and common.
7. Paginate with **keyset pagination** (\`WHERE id > last_seen ORDER BY id LIMIT 20\`) rather than large \`OFFSET\`s, which still read and discard every skipped row.

## Caching and materialised views

Some results are expensive and rarely change: dashboards and leaderboards, for example. A **materialised view** stores a query's result as a table that you refresh periodically. An application cache (such as Redis) can hold hot results for seconds or minutes. Both trade freshness for speed, so decide explicitly how stale the data may be.`,
  quiz: [
    { id: 'qo-1', prompt: 'What does the optimiser use to estimate how many rows each step returns?', options: ['The SQL formatting', 'The client\'s network speed', 'The order of columns in SELECT', 'Table and column statistics such as histograms and distinct counts'], answer: 3, why: 'Cardinality estimates come from statistics; stale statistics lead to bad plans.' },
    { id: 'qo-2', prompt: 'EXPLAIN ANALYZE shows 10 estimated rows but 2,000,000 actual rows at one step. What is a likely fix?', options: ['Add more CPU', 'Rewrite the query in uppercase', 'Refresh statistics (ANALYZE) or help the optimiser with better indexes', 'Disable the optimiser'], answer: 2, why: 'A large estimate error points to stale or insufficient statistics.' },
    { id: 'qo-3', prompt: 'An ORM loads 100 posts, then runs one query per post for its author. This is:', options: ['A covering index', 'The N+1 query problem', 'Keyset pagination', 'A deadlock'], answer: 1, why: 'Load authors in one join or IN query instead of one query per post.' },
    { id: 'qo-4', prompt: 'Why is OFFSET 100000 LIMIT 20 slow?', options: ['The database still reads and discards the 100,000 skipped rows', 'LIMIT is ignored', 'OFFSET disables indexes entirely', 'It returns the wrong rows'], answer: 0, why: 'Keyset pagination (WHERE id > last_seen) seeks directly to the next page.' },
    { id: 'qo-5', prompt: 'Which rewrite is called "pushing filters down"?', options: ['Converting joins to cross joins', 'Moving ORDER BY to the start', 'Removing indexes', 'Applying WHERE conditions as early as possible, before joins and aggregates'], answer: 3, why: 'Discarding rows early reduces the work of every later operator.' },
  ],
  interview: [
    { q: 'How do you approach a slow query?', a: 'Confirm it is the bottleneck (slow log, monitoring), run EXPLAIN ANALYZE, find the expensive step, compare estimated and actual rows, then fix: an index matching filter and sort, a sargable rewrite, fewer columns, fresh statistics, or removing N+1 patterns.' },
    { q: 'What is a cost-based optimiser?', a: 'It enumerates equivalent plans (join orders, access paths, join algorithms), estimates each plan\'s cost from statistics and cardinality estimates, and picks the cheapest. Its quality depends on the accuracy of those estimates.' },
  ],
}

export default lesson
