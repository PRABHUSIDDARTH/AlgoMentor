import type { Lesson } from '../types'

const lesson: Lesson = {
  id: 'sql-basics',
  title: 'SQL fundamentals',
  minutes: 10,
  hook: 'A report shows an average page count that looks too high compared with total pages divided by the number of books. Nothing is broken: the query is skipping the books whose page count is NULL. A few rules about NULL, grouping and evaluation order explain most of the surprises in everyday SQL.',
  keyPoints: [
    'SQL describes the result you want; the database decides how to compute it.',
    'Clauses run as FROM, WHERE, GROUP BY, HAVING, SELECT, ORDER BY, so WHERE cannot see aliases or aggregates.',
    'NULL means unknown: test it with IS NULL, and remember aggregates skip nulls while COUNT(*) does not.',
    'Run the matching SELECT before any UPDATE or DELETE, and do risky changes inside a transaction.',
  ],
  body: `## A declarative language

**SQL** is declarative: you describe the result you want and the database decides how to compute it. That is why the same query can run in milliseconds or minutes depending on indexes and data, and why reading the query plan (a later module) matters.

SQL commands fall into groups:

- **DDL** (definition): \`CREATE\`, \`ALTER\`, \`DROP\` tables and indexes.
- **DML** (manipulation): \`SELECT\`, \`INSERT\`, \`UPDATE\`, \`DELETE\`.
- **DCL** (control): \`GRANT\` and \`REVOKE\` permissions.
- **TCL** (transactions): \`BEGIN\`, \`COMMIT\`, \`ROLLBACK\`.

## Creating tables

\`\`\`sql
CREATE TABLE book (
  book_id    BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  isbn       VARCHAR(17) NOT NULL UNIQUE,
  title      TEXT NOT NULL,
  published  DATE,
  pages      INT CHECK (pages > 0)
);
\`\`\`

Choose types deliberately: integers for counts, \`NUMERIC\` (never floating point) for money, \`DATE\` or \`TIMESTAMP\` for time, and text with a sensible limit where one exists.

## Reading data

The shape of a query is:

\`\`\`sql
SELECT genre, COUNT(*) AS books, AVG(pages) AS avg_pages
FROM book
WHERE published >= DATE '2000-01-01'
GROUP BY genre
HAVING COUNT(*) >= 10
ORDER BY books DESC
LIMIT 5;
\`\`\`

Note that the database evaluates the clauses in a different order from how you write them: **FROM, WHERE, GROUP BY, HAVING, SELECT, ORDER BY, LIMIT**. That explains several rules beginners trip over. You can't use a \`SELECT\` alias in \`WHERE\` (it doesn't exist yet), but you can in \`ORDER BY\`. And **WHERE filters rows before grouping, while HAVING filters groups after aggregation**, so a condition on \`COUNT(*)\` must go in \`HAVING\`.

> [!KEY] WHERE before, HAVING after
> WHERE filters rows before they are grouped. HAVING filters groups after aggregation. A condition on \`COUNT(*)\` can only go in HAVING, because the count does not exist yet when WHERE runs.

## Aggregates and GROUP BY

\`COUNT\`, \`SUM\`, \`AVG\`, \`MIN\` and \`MAX\` collapse many rows into one value per group. Every column in the \`SELECT\` list must either be in \`GROUP BY\` or be inside an aggregate; otherwise the database wouldn't know which row's value to show. \`COUNT(*)\` counts rows; \`COUNT(column)\` counts non-null values in that column; \`COUNT(DISTINCT column)\` counts different values.

## NULL is not a value

\`NULL\` means "unknown" or "missing", and it behaves accordingly: \`NULL = NULL\` is not true, it is unknown. Comparisons with null filter rows out silently. Use \`IS NULL\` and \`IS NOT NULL\` to test for it, and \`COALESCE(col, default)\` to substitute a value. Aggregates skip nulls, so \`AVG(pages)\` averages only books with a page count.

> [!TRY] Count the nulls
> A \`book\` table holds three rows with \`pages\` of 100, NULL and 300. What does this return?
>
> \`\`\`sql
> SELECT COUNT(*), COUNT(pages), AVG(pages) FROM book;
> \`\`\`
>
> ---
>
> It returns 3, 2 and 200. \`COUNT(*)\` counts rows, \`COUNT(pages)\` counts only the non-null values, and \`AVG\` divides 400 by 2, not by 3.

## Changing data

\`\`\`sql
INSERT INTO book (isbn, title, pages) VALUES ('978-0441172719', 'Dune', 412);
UPDATE book SET pages = 896 WHERE isbn = '978-0441172719';
DELETE FROM book WHERE published IS NULL AND pages IS NULL;
\`\`\`

An \`UPDATE\` or \`DELETE\` without a \`WHERE\` clause changes **every row**. Run the matching \`SELECT\` first, and do risky changes inside a transaction so you can roll back.

> [!GOTCHA] The missing WHERE
> Many clients autocommit, so a \`DELETE\` or \`UPDATE\` with no \`WHERE\` is permanent the moment you press enter. Start with \`BEGIN\`, compare the row count the database reports with the count you expected, and only then \`COMMIT\`.

## Habits that prevent mistakes

Name your columns in \`INSERT\` and \`SELECT\` instead of relying on column order or \`SELECT *\`, because a later \`ALTER TABLE\` then can't silently change what your code reads. Qualify columns with a table alias once a query has more than one table. Use parameterised queries (\`WHERE isbn = ?\`) from application code instead of building SQL by string concatenation, which is how SQL injection happens. And test with realistic data volumes: a query that is instant on ten rows can be unusable on ten million.

## Window functions

Window functions compute across related rows without collapsing them: rankings, running totals, the previous row's value.

\`\`\`sql
SELECT title, genre, pages,
       RANK() OVER (PARTITION BY genre ORDER BY pages DESC) AS rank_in_genre
FROM book;
\`\`\`

"Top N per group" and "compare with the previous row" questions are common in interviews, and window functions (\`ROW_NUMBER\`, \`RANK\`, \`LAG\`, \`SUM() OVER\`) are the clean answer.

> [!INTERVIEW] Top N per group
> This is the favourite window-function question. Use \`ROW_NUMBER() OVER (PARTITION BY group ORDER BY metric DESC)\` in a subquery or CTE and filter on the number. Say why you chose \`ROW_NUMBER\` over \`RANK\`: ties get distinct numbers with one, and share a number with the other.`,
  quiz: [
    { id: 'sq-1', prompt: 'You need genres with at least 10 books. Where does COUNT(*) >= 10 go?', options: ['WHERE', 'FROM', 'ORDER BY', 'HAVING'], answer: 3, why: 'WHERE filters rows before grouping; HAVING filters groups after aggregation.' },
    { id: 'sq-2', prompt: 'What does WHERE pages = NULL return?', options: ['Rows where pages is null', 'All rows', 'No rows, because comparisons with NULL are unknown', 'An error in every database'], answer: 2, why: 'Use IS NULL; = NULL never evaluates to true.' },
    { id: 'sq-3', prompt: 'In which order are these clauses logically evaluated?', options: ['SELECT, FROM, WHERE, GROUP BY', 'FROM, WHERE, GROUP BY, HAVING, SELECT, ORDER BY', 'WHERE, FROM, SELECT, HAVING', 'ORDER BY, SELECT, FROM, WHERE'], answer: 1, why: 'This order explains why SELECT aliases work in ORDER BY but not in WHERE.' },
    { id: 'sq-4', prompt: 'Which type should store money amounts?', options: ['NUMERIC/DECIMAL', 'DOUBLE', 'FLOAT', 'TEXT'], answer: 0, why: 'Binary floating point can\'t represent most decimal fractions exactly.' },
    { id: 'sq-5', prompt: 'Which query finds the longest book in each genre without collapsing rows?', options: ['GROUP BY genre with MAX(pages) only', 'SELECT DISTINCT genre', 'ORDER BY pages LIMIT 1', 'A window function such as RANK() OVER (PARTITION BY genre ORDER BY pages DESC)'], answer: 3, why: 'Window functions rank within each partition while keeping every row available.' },
  ],
  interview: [
    { q: 'WHERE vs HAVING?', a: 'WHERE filters individual rows before grouping and can\'t use aggregates. HAVING filters groups after GROUP BY and is where conditions on COUNT, SUM and similar belong.' },
    { q: 'How does NULL behave in SQL?', a: 'It means unknown: comparisons with it yield unknown, so rows drop out of WHERE; use IS NULL / IS NOT NULL and COALESCE. Aggregates ignore nulls, and COUNT(column) skips them while COUNT(*) doesn\'t.' },
    { q: 'How would you get the top 3 books by pages in each genre?', a: 'Use ROW_NUMBER() OVER (PARTITION BY genre ORDER BY pages DESC) in a subquery or CTE and filter where the row number is at most 3 (RANK if ties should share a place).' },
  ],
}

export default lesson
