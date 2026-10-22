import type { Lesson } from '../types'

const lesson: Lesson = {
  id: 'transactions-acid',
  title: 'Transactions & ACID',
  minutes: 10,
  body: `## All or nothing

Transferring money means two updates: take 500 from Ana's account and add 500 to Ben's. If the system crashes between them, money vanishes. A **transaction** groups operations so they succeed or fail as one unit:

\`\`\`sql
BEGIN;
UPDATE account SET balance = balance - 500 WHERE id = 'ana';
UPDATE account SET balance = balance + 500 WHERE id = 'ben';
COMMIT;
\`\`\`

If anything goes wrong before \`COMMIT\`, a \`ROLLBACK\` (explicit, or automatic after a crash) undoes every change in the transaction.

## ACID

Transactions in relational databases promise four properties:

- **Atomicity**: all of the transaction's changes happen, or none do.
- **Consistency**: a transaction takes the database from one valid state to another; every constraint (keys, foreign keys, checks) holds when it commits. Note that the application still decides what "valid" means beyond the constraints.
- **Isolation**: concurrent transactions don't see each other's half-finished work. The degree of isolation is configurable and is the topic of the next module.
- **Durability**: once a commit is acknowledged, it survives crashes and power loss.

## How atomicity and durability are implemented

The key structure is the **write-ahead log** (WAL, or redo log). Before a change is applied to the data files, a record describing it is appended to the log and the log is flushed to disk. A commit is durable as soon as its log records are safely on disk, even if the data pages are written much later.

After a crash, the database **recovers** by replaying the log: redoing committed changes that hadn't reached the data files and undoing changes from transactions that never committed. Writing sequentially to one log is also much faster than updating pages scattered across the disk, which is why nearly every database, and many other systems such as Kafka and file systems, are built around a log.

\`fsync\` is the expensive part: forcing data to stable storage. Databases batch several commits into one flush (**group commit**) to keep throughput high. Settings that skip the flush trade durability for speed, and you should know when one is on.

## Savepoints

Long transactions can set **savepoints** and roll back to one without abandoning the whole transaction: \`SAVEPOINT before_fees; ... ROLLBACK TO before_fees;\`.

## Transactions in application code

Some rules make transactions work in practice:

- **Keep them short.** Open transactions hold locks and block other work. Never wait for user input or a slow external API inside one.
- **Retry on serialisation failures and deadlocks.** The database may abort a transaction to keep things correct; the application should retry it, which means the code inside must be safe to repeat.
- **Know your framework's defaults.** Many drivers run in autocommit mode, so each statement is its own transaction unless you open one explicitly. Spring's \`@Transactional\`, Django's \`atomic()\` and similar helpers start and end transactions for you.

## Beyond one database

ACID covers one database. When an operation spans services or databases (charge a card, then reserve stock), you can't wrap it in one local transaction. Options include **two-phase commit** (a coordinator asks every participant to prepare, then to commit; correct but blocking and fragile) and the **saga pattern** (a sequence of local transactions, each with a compensating action to undo it if a later step fails). Distributed systems usually choose sagas, idempotent operations and eventual consistency, which the NoSQL and CAP module explores.`,
  quiz: [
    { id: 'ta-1', prompt: 'A crash happens after debiting Ana but before crediting Ben, inside one transaction. What does atomicity guarantee?', options: ['Neither change survives: the transaction is rolled back', 'Ana is debited and Ben is not', 'Both changes survive', 'The database deletes both accounts'], answer: 0, why: 'Atomicity means all of a transaction\'s changes happen or none do.' },
    { id: 'ta-2', prompt: 'Which mechanism lets a database make commits durable and recover after a crash?', options: ['The query planner', 'The write-ahead log', 'Indexes', 'Views'], answer: 1, why: 'Changes are logged and flushed before data pages; recovery replays the log.' },
    { id: 'ta-3', prompt: 'Why should transactions be kept short?', options: ['Long ones are not allowed by SQL', 'Short transactions skip the log', 'Open transactions hold locks and resources that block other work', 'They use less disk space'], answer: 2, why: 'Waiting on users or slow APIs inside a transaction stalls everyone contending for the same rows.' },
    { id: 'ta-4', prompt: 'An order spans a payment service and an inventory service with separate databases. A common approach is:', options: ['One SQL transaction across both', 'Using a bigger server', 'Disabling isolation', 'A saga: local transactions with compensating actions'], answer: 3, why: 'Local ACID doesn\'t span services; sagas coordinate them with compensations.' },
    { id: 'ta-5', prompt: 'What does the C in ACID mean?', options: ['Committed transactions leave all constraints satisfied (valid state to valid state)', 'Concurrency', 'Caching', 'Compression'], answer: 0, why: 'Consistency: constraints hold before and after each transaction.' },
  ],
  interview: [
    { q: 'Explain ACID.', a: 'Atomicity: all or nothing. Consistency: constraints hold after each transaction. Isolation: concurrent transactions don\'t see each other\'s partial work (to a configurable degree). Durability: committed data survives crashes, via a write-ahead log flushed to disk.' },
    { q: 'How does a database recover after a crash?', a: 'It replays the write-ahead log from the last checkpoint: redo changes of committed transactions not yet in the data files, and undo changes of transactions that hadn\'t committed.' },
    { q: 'How do you keep data consistent across microservices without distributed transactions?', a: 'Sagas: a chain of local transactions, each publishing an event, with compensating transactions to undo earlier steps on failure. Combine with idempotent handlers and the outbox pattern so events and local writes commit together.' },
  ],
}

export default lesson
