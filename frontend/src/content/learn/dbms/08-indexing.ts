import type { Lesson } from '../types'

const lesson: Lesson = {
  id: 'indexing',
  title: 'Indexing: B+ trees and hashing',
  minutes: 11,
  diagram: 'bplus-tree',
  hook: 'A query that was instant in development crawls in production, and the only difference is that the `loan` table now holds ten million rows. The database reads every one of them to find a single member\'s loans. One index turns that full scan into a handful of page reads.',
  keyPoints: [
    'An index maps column values to row locations, so the database avoids reading the whole table.',
    'B+ trees keep keys sorted in linked leaves, so they serve equality, ranges, prefixes and ORDER BY in O(log n) page reads.',
    'A composite index follows the leftmost-prefix rule: put equality columns first and range columns last.',
    'Every index slows writes and uses space, so add them for real queries and drop unused ones.',
  ],
  body: `## Why indexes matter

Without an index, finding the loans of one member means reading every row of the \`loan\` table: a **full table scan**. With ten million rows, that is slow every single time. An **index** is a separate data structure, kept in sync with the table, that maps column values to row locations so the database can jump straight to the rows it needs.

Indexes are the single biggest lever on query performance, and the most common topic in database interview questions.

## B+ trees

Almost every relational index is a **B+ tree**:

- It is a balanced tree with a very high **fan-out**: each node is a disk page (often 8 or 16 KB) holding hundreds of keys and child pointers. A tree of height 3 or 4 can index billions of rows, so a lookup reads only a handful of pages.
- **All values live in the leaves**; internal nodes hold only separator keys that guide the search.
- **Leaves are linked** in key order, so after finding the start of a range the database just walks along the leaves. That makes B+ trees excellent for range queries (\`BETWEEN\`, \`<\`, \`>\`), prefix matches (\`LIKE 'abc%'\`) and \`ORDER BY\` on the indexed columns.
- Inserts and deletes keep the tree balanced by splitting and merging nodes, so every lookup costs O(log n) page reads.

> [!KEY] Sorted leaves are the point
> A B+ tree keeps keys in order and links its leaves. One key costs a few page reads, and a range costs that plus a walk along the leaves. A hash index gives up the order, so it cannot serve ranges or sorting.

## Hash indexes

A **hash index** hashes the key to find a bucket: O(1) on average for exact-match lookups (\`WHERE id = 42\`). It can't help with ranges or sorting, because hashing destroys order. In-memory stores and some engines use hash indexes; for general SQL work, B+ trees win because they handle both equality and ranges.

## Clustered and secondary indexes

A **clustered index** stores the table rows themselves in index order; there can be only one. In MySQL InnoDB the primary key is the clustered index. A **secondary index** stores the indexed columns plus a pointer back to the row (in InnoDB, the primary key), so using it may need a second lookup.

A **covering index** includes every column a query needs, so the database answers from the index alone without touching the table: \`CREATE INDEX ON loan (member_id, due_at) INCLUDE (book_id)\`.

## Composite indexes and the leftmost-prefix rule

An index on \`(member_id, due_at)\` is sorted by \`member_id\`, then by \`due_at\` within each member. It helps queries that filter on \`member_id\`, or on \`member_id\` and \`due_at\`. It does **not** help a query filtering only on \`due_at\`, just as a phone book sorted by surname then first name doesn't help you find everyone called "Priya". Put equality columns first and range columns last.

> [!TRY] Which queries use the index?
> There is one index on \`(member_id, due_at)\`. Which of these can seek into it?
>
> \`\`\`sql
> -- A
> WHERE member_id = 5
> -- B
> WHERE due_at < '2026-01-01'
> -- C
> WHERE member_id = 5 AND due_at < '2026-01-01'
> \`\`\`
>
> ---
>
> A and C can seek, because they start with the leading column. B cannot, so it scans (SQLite's plan shows \`SCAN\` for it). Some engines have a limited skip scan, but do not count on it; index \`due_at\` separately if you need it.

## When an index won't be used

- A function or cast on the column: \`WHERE LOWER(email) = ...\` can't use an index on \`email\` (create an expression index on \`LOWER(email)\` instead).
- A leading wildcard: \`LIKE '%son'\`.
- **Low selectivity**: if a condition matches a large share of the table, a sequential scan is cheaper than thousands of random lookups, and the optimiser will rightly choose it.

> [!GOTCHA] Hiding the column in a function
> Writing \`WHERE CAST(created_at AS DATE) = '2026-03-01'\` against an index on \`created_at\`. The index is ignored and the table is scanned, which looks fine on small data. Rewrite it as a range (\`created_at >= '2026-03-01' AND created_at < '2026-03-02'\`) or create an expression index.

## The costs

Indexes aren't free. Every insert, update and delete must also update each index, so a table with ten indexes writes much more slowly. Indexes take disk and memory. Add them for real query patterns (foreign keys, frequent filters and sorts), check with \`EXPLAIN\` that they are used, and drop the ones that never are.

> [!INTERVIEW] Say what it costs
> "How would you speed this up?" is usually followed by "why not index every column?" Answer with the cost side: slower writes, extra space, and an optimiser that ignores low-selectivity indexes. Then say you would confirm with \`EXPLAIN\`.`,
  quiz: [
    { id: 'ix-1', prompt: 'Why are B+ trees good for range queries?', options: ['They hash every key', 'They store everything in the root', 'Values are in sorted, linked leaves, so a range is a walk along the leaves', 'They avoid disk entirely'], answer: 2, why: 'Find the start of the range, then follow leaf links in key order.' },
    { id: 'ix-2', prompt: 'A composite index on (member_id, due_at) helps which query?', options: ['WHERE due_at < now() only', 'WHERE LOWER(title) = \'dune\'', 'WHERE book_id = 3', 'WHERE member_id = 7 AND due_at < now()'], answer: 3, why: 'Leftmost-prefix rule: the index is sorted by member_id first.' },
    { id: 'ix-3', prompt: 'Which query cannot use a normal index on email?', options: ['WHERE LOWER(email) = \'a@b.com\'', 'WHERE email = \'a@b.com\'', 'WHERE email LIKE \'ana%\'', 'ORDER BY email'], answer: 0, why: 'A function on the column hides it from the index; use an expression index.' },
    { id: 'ix-4', prompt: 'Hash indexes are a poor fit for:', options: ['WHERE id = 42', 'WHERE created_at BETWEEN two dates', 'Exact key lookups in memory', 'Equality joins'], answer: 1, why: 'Hashing destroys ordering, so ranges and sorting can\'t use it.' },
    { id: 'ix-5', prompt: 'What is the main cost of adding many indexes to a table?', options: ['Slower SELECTs', 'Data loss', 'Slower writes and more storage, since each index must be maintained', 'Fewer columns allowed'], answer: 2, why: 'Every insert, update and delete updates each index too.' },
  ],
  interview: [
    { q: 'How does a B+ tree index work and why do databases use it?', a: 'A balanced, high-fan-out tree of disk pages; internal nodes hold separator keys, leaves hold the entries and are linked in order. Lookups read O(log n) pages (3–4 for huge tables) and ranges are leaf walks, so it serves equality, ranges and sorting.' },
    { q: 'What is a covering index?', a: 'An index containing every column a query needs, so the database can answer from the index alone without visiting the table rows (an index-only scan).' },
    { q: 'Why might the optimiser ignore an index?', a: 'The condition matches a large fraction of rows (low selectivity), the column is wrapped in a function or cast, a leading wildcard is used, the query doesn\'t use the leftmost index columns, or statistics are stale.' },
  ],
}

export default lesson
