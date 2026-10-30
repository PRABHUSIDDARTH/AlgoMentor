import type { Lesson } from '../types'

const lesson: Lesson = {
  id: 'concurrency-isolation',
  title: 'Concurrency control & isolation levels',
  minutes: 11,
  hook: 'Two doctors are on call tonight, and both open the scheduling app to go off duty. Each sees that the other is still on call, so each is allowed to leave, and both changes commit. Nobody is on call. No row was updated twice and no lock was violated, which is why this bug survives so many code reviews.',
  keyPoints: [
    'Isolation levels trade anomalies (dirty read, non-repeatable read, phantom, lost update, write skew) for speed.',
    'MVCC lets readers and writers proceed without blocking by reading snapshots; 2PL uses locks and can deadlock.',
    'Fix lost updates with an atomic UPDATE, SELECT ... FOR UPDATE or a version column before reaching for serializable.',
    'Defaults differ between databases: PostgreSQL starts at read committed, MySQL InnoDB at repeatable read.',
  ],
  body: `## Many users, one database

A busy database runs hundreds of transactions at once. If each ran alone, one after another, everything would be correct but slow. Running them concurrently is fast but lets them interfere. **Isolation levels** let you choose how much interference you accept in exchange for performance.

## The anomalies

Each anomaly is a specific way concurrent transactions can produce a result no serial order would:

- **Dirty read**: T1 reads a change T2 hasn't committed. If T2 rolls back, T1 acted on data that never existed.
- **Non-repeatable read**: T1 reads a row twice and gets different values because T2 updated and committed it in between.
- **Phantom read**: T1 runs the same range query twice (\`WHERE genre = 'sci-fi'\`) and gets a different *set* of rows because T2 inserted or deleted matching rows.
- **Lost update**: T1 and T2 both read a stock count of 10, each subtracts 1 and writes 9. One sale disappears.
- **Write skew**: two transactions each check a condition, see it satisfied, and write different rows, together breaking the rule. Classic case: two on-call doctors each see "another doctor is on call" and both go off call.

> [!KEY] Name the anomaly first
> Pick the anomaly, then the cheapest fix. A lost update needs an atomic update or a lock. Write skew, where transactions write different rows, needs serializable or a lock on the rows that were read.

## The SQL standard levels

From weakest to strongest:

- **Read uncommitted**: dirty reads allowed. Rarely used.
- **Read committed**: you only see committed data, but each statement sees the latest commits, so non-repeatable reads and phantoms are possible. The default in PostgreSQL, Oracle and SQL Server.
- **Repeatable read**: rows you have read won't change under you. The standard still allows phantoms, though PostgreSQL's implementation (a snapshot) prevents them. The default in MySQL InnoDB.
- **Serializable**: the result equals *some* serial order of the transactions. No anomalies, at the cost of more blocking or aborted transactions that must be retried.

Defaults differ between databases, so check rather than assume.

> [!TRY] Do both doctors leave?
> In PostgreSQL at \`REPEATABLE READ\`, two transactions both run \`SELECT count(*) FROM doctor WHERE on_call\` and see 2. Each then sets its own doctor's \`on_call = false\` and commits. Does either commit fail, and how many are on call afterwards?
>
> ---
>
> Neither fails, and none are on call. The updates touch different rows, so there is no write conflict, and both read snapshots taken before either committed. At \`SERIALIZABLE\`, PostgreSQL detects the dangerous read-write pattern and aborts one transaction with a serialization failure (SQLSTATE 40001), which the application should retry.

## How databases implement isolation

**Two-phase locking (2PL)**: a transaction takes shared locks to read and exclusive locks to write, and releases nothing until it finishes. Correct, but readers and writers block each other, and **deadlocks** happen when two transactions each wait for a lock the other holds. The database detects the cycle and aborts one of them.

**Multiversion concurrency control (MVCC)**: writers create new row versions instead of overwriting; each transaction reads from a **snapshot** of committed data as of its start (or statement start, under read committed). Readers never block writers and writers never block readers. PostgreSQL, MySQL InnoDB and Oracle all use MVCC. Old versions are cleaned up later (PostgreSQL's \`VACUUM\`).

Plain snapshot isolation still allows write skew. PostgreSQL's serializable level adds detection of dangerous read-write patterns and aborts one transaction when it finds them.

## Preventing lost updates in practice

You don't always need serializable. Common, cheaper fixes:

- **Atomic updates**: \`UPDATE product SET stock = stock - 1 WHERE id = 7 AND stock > 0\`. The read and write happen in one statement.
- **Pessimistic locking**: \`SELECT ... FOR UPDATE\` locks the rows you intend to change until commit.
- **Optimistic locking**: keep a \`version\` column; update with \`WHERE id = 7 AND version = 3\` and set \`version = 4\`. If zero rows changed, someone else won: reload and retry. Ideal when conflicts are rare, and common in web apps and ORMs.

> [!GOTCHA] Read, change in code, write back
> Reading a stock count into application code, subtracting one and writing the result back. It passes every single-user test and fails only under load, as a count that is slightly off. Do it in one statement (\`stock = stock - 1\`) or lock the row with \`SELECT ... FOR UPDATE\`.

## Choosing a level

Use your database's default for most work, and fix specific hot spots with atomic updates or row locks. Reach for serializable when correctness depends on reading several rows and writing based on what you saw (bookings, balances, rules across rows), and make sure the application retries aborted transactions. In interviews, naming the anomaly a design is exposed to, and the exact fix, is worth far more than reciting the four levels.

> [!INTERVIEW] Race two requests
> A booking or inventory design is the common prompt. Walk two requests through the code, name the anomaly that occurs, then choose an atomic update, a row lock or a version column. If you pick serializable, say that the application must retry aborted transactions.`,
  quiz: [
    { id: 'ci-1', prompt: 'T1 reads a row, T2 updates and commits it, T1 reads it again and sees a new value. This is:', options: ['A dirty read', 'A deadlock', 'A phantom read', 'A non-repeatable read'], answer: 3, why: 'Same row, two reads, different committed values.' },
    { id: 'ci-2', prompt: 'Two sessions both read stock = 10 and both write 9. What is this anomaly and a simple fix?', options: ['Phantom read; add an index', 'Dirty read; use read uncommitted', 'Lost update; use UPDATE ... SET stock = stock - 1 (atomic) or SELECT ... FOR UPDATE', 'Write skew; drop the table'], answer: 2, why: 'Read-modify-write races lose one update; make it atomic or lock the row.' },
    { id: 'ci-3', prompt: 'What does MVCC let readers do?', options: ['Read uncommitted data', 'Read a consistent snapshot without blocking writers', 'Skip the write-ahead log', 'Avoid all retries'], answer: 1, why: 'Writers create new versions; readers see the snapshot that applies to them.' },
    { id: 'ci-4', prompt: 'Optimistic locking with a version column detects a conflict when:', options: ['The UPDATE ... WHERE version = n changes zero rows', 'The table is locked', 'A deadlock is reported', 'The transaction is read-only'], answer: 0, why: 'Zero affected rows means someone else changed the row first; reload and retry.' },
    { id: 'ci-5', prompt: 'What is the default isolation level in PostgreSQL?', options: ['Read uncommitted', 'Serializable', 'Repeatable read', 'Read committed'], answer: 3, why: 'PostgreSQL defaults to read committed; MySQL InnoDB defaults to repeatable read.' },
  ],
  interview: [
    { q: 'Describe the isolation levels and the anomalies each prevents.', a: 'Read uncommitted allows dirty reads. Read committed prevents dirty reads. Repeatable read also prevents non-repeatable reads (phantoms allowed by the standard, though snapshot implementations prevent them). Serializable prevents all anomalies, including write skew, by guaranteeing an equivalent serial order.' },
    { q: 'How would you prevent overselling the last ticket?', a: 'A conditional atomic update (UPDATE ... SET sold = sold + 1 WHERE id = ? AND sold < capacity) and check rows affected; or SELECT ... FOR UPDATE inside a short transaction; or optimistic locking with a version and retry.' },
    { q: 'What is MVCC and why do most databases use it?', a: 'Multiversion concurrency control keeps several versions of each row so every transaction reads a consistent snapshot. Readers and writers don\'t block each other, which gives high concurrency; old versions are garbage-collected later.' },
  ],
}

export default lesson
