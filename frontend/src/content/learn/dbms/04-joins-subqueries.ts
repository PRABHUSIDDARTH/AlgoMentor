import type { Lesson } from '../types'

const lesson: Lesson = {
  id: 'joins-subqueries',
  title: 'Joins & subqueries',
  minutes: 10,
  diagram: 'join-kinds',
  body: `## Why joins exist

A well-designed schema spreads data across tables: members in one, loans in another, books in a third. A **join** puts it back together for a query by matching rows on related columns, usually a foreign key and the key it references.

\`\`\`sql
SELECT m.name, b.title, l.due_at
FROM loan l
JOIN member m ON m.member_id = l.member_id
JOIN book   b ON b.book_id   = l.book_id
WHERE l.returned_at IS NULL;
\`\`\`

## The join types

- **INNER JOIN** keeps only rows that have a match on both sides. A member with no loans doesn't appear.
- **LEFT (OUTER) JOIN** keeps every row from the left table, filling the right side with nulls when there is no match. Use it for "all members, and their loans if any".
- **RIGHT JOIN** is the mirror image; most people rewrite it as a left join for readability.
- **FULL OUTER JOIN** keeps unmatched rows from both sides.
- **CROSS JOIN** pairs every row with every row: a Cartesian product. Occasionally useful (every date times every store), usually a mistake caused by a missing join condition.
- A **self join** joins a table to itself, for example employees to their managers in the same \`employee\` table.

## The left-join trap

A condition on the right table in \`WHERE\` silently turns a left join into an inner join, because rows with nulls on the right fail the condition:

\`\`\`sql
-- Loses members with no loans:
SELECT m.name, l.loan_id FROM member m LEFT JOIN loan l ON l.member_id = m.member_id
WHERE l.returned_at IS NULL AND l.due_at < CURRENT_DATE;
\`\`\`

Put conditions about the right-hand table in the \`ON\` clause when you want to keep unmatched left rows. This is one of the most common real-world SQL bugs.

## Finding rows without a match

"Members who have never borrowed anything" is an **anti-join**. Two standard ways:

\`\`\`sql
SELECT m.* FROM member m LEFT JOIN loan l ON l.member_id = m.member_id WHERE l.loan_id IS NULL;
SELECT m.* FROM member m WHERE NOT EXISTS (SELECT 1 FROM loan l WHERE l.member_id = m.member_id);
\`\`\`

Avoid \`NOT IN (subquery)\` here: if the subquery returns a single null, \`NOT IN\` returns no rows at all.

## Subqueries

A **subquery** is a query inside another query. It can appear in several places:

- In \`WHERE\`, with \`IN\`, \`EXISTS\` or a comparison: books borrowed more than average.
- In \`FROM\`, as a derived table you then query.
- In \`SELECT\`, as a scalar value per row.

A **correlated subquery** refers to the outer row (\`WHERE l.member_id = m.member_id\`), so conceptually it runs once per outer row. Modern optimisers often rewrite it into a join, but not always, so check the plan for large tables.

## Common table expressions

A **CTE** (\`WITH\`) names a subquery so a complex query reads top to bottom:

\`\`\`sql
WITH active AS (
  SELECT member_id, COUNT(*) AS open_loans FROM loan WHERE returned_at IS NULL GROUP BY member_id
)
SELECT m.name, a.open_loans FROM member m JOIN active a USING (member_id) WHERE a.open_loans >= 3;
\`\`\`

Recursive CTEs (\`WITH RECURSIVE\`) walk hierarchies such as category trees or reporting chains.

## Joins and performance

Databases join with three main algorithms: **nested loops** (good when one side is small and the other has an index on the join column), **hash join** (build a hash table on the smaller side, probe with the larger) and **merge join** (both sides sorted on the key). You choose the query; the optimiser chooses the algorithm. Your job is to make good plans possible: index foreign keys, join on matching types, and filter early.`,
  quiz: [
    { id: 'js-1', prompt: 'You need every member, with their loans if they have any. Which join?', options: ['LEFT JOIN from member to loan', 'INNER JOIN', 'CROSS JOIN', 'A join with no ON clause'], answer: 0, why: 'A left join keeps all left rows and fills unmatched right columns with nulls.' },
    { id: 'js-2', prompt: 'A LEFT JOIN query adds WHERE loan.due_at < CURRENT_DATE. What happens to members with no loans?', options: ['They still appear with nulls', 'They disappear, because the WHERE condition fails on nulls', 'The query errors', 'They appear twice'], answer: 1, why: 'Conditions on the right table in WHERE turn the left join into an inner join; move them to ON.' },
    { id: 'js-3', prompt: 'Why is NOT IN (subquery) risky for finding unmatched rows?', options: ['It is always slower', 'It doesn\'t work with integers', 'If the subquery returns any NULL, it returns no rows', 'It requires a CTE'], answer: 2, why: 'x NOT IN (..., NULL) is unknown for every x; use NOT EXISTS or a left anti-join.' },
    { id: 'js-4', prompt: 'What is a correlated subquery?', options: ['A subquery in the FROM clause', 'A recursive CTE', 'Any query using JOIN', 'A subquery that references columns of the outer query'], answer: 3, why: 'It depends on the current outer row, so conceptually runs per row.' },
    { id: 'js-5', prompt: 'Which join algorithm builds an in-memory table on the smaller input and probes it with the larger one?', options: ['Hash join', 'Merge join', 'Nested loop', 'Cross join'], answer: 0, why: 'Hash joins suit large unsorted inputs joined on equality.' },
  ],
  interview: [
    { q: 'Explain the difference between INNER, LEFT and FULL OUTER joins.', a: 'INNER keeps only matched rows. LEFT keeps all rows from the left table with nulls where the right has no match. FULL OUTER keeps unmatched rows from both sides.' },
    { q: 'How do you find customers who have never placed an order?', a: 'An anti-join: LEFT JOIN orders and keep rows where the order key IS NULL, or WHERE NOT EXISTS (SELECT 1 FROM orders WHERE customer_id = c.id). Avoid NOT IN because of nulls.' },
    { q: 'Subquery or join?', a: 'Use whichever states the intent most clearly; optimisers often turn one into the other. EXISTS is clear for existence checks, joins when you need columns from both tables. Check the plan for correlated subqueries on large tables.' },
  ],
}

export default lesson
