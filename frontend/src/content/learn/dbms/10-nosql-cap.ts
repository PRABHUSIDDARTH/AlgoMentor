import type { Lesson } from '../types'

const lesson: Lesson = {
  id: 'nosql-cap',
  title: 'NoSQL & CAP',
  minutes: 11,
  diagram: 'cap-triangle',
  body: `## Why NoSQL appeared

Relational databases are excellent general-purpose tools, but a single server eventually hits limits: more writes than one machine can absorb, data spread across continents, or data shapes that fit tables awkwardly. **NoSQL** databases trade some relational features (joins, multi-row transactions, a fixed schema) for horizontal scale, flexible data models or very low latency. "NoSQL" is a family, not one design.

## The four main families

- **Key-value stores** (Redis, DynamoDB in its simplest use): get and put by key, extremely fast. Caches, sessions, counters, rate limiters.
- **Document stores** (MongoDB, Couchbase): JSON-like documents with nested fields, queried by field. Good when an entity is read and written as a whole, such as a product with its variants or a user profile.
- **Wide-column stores** (Cassandra, HBase, Bigtable): rows partitioned by key with many columns, built for huge write volumes and time-series-like data. You design tables around your queries, not around entities.
- **Graph databases** (Neo4j): nodes and edges as first-class citizens, for queries such as "friends of friends who like this" that would need many recursive joins in SQL.

## Scaling out: replication and sharding

Two techniques underlie distributed databases, relational or not:

- **Replication** copies data to several nodes for availability and read scaling. With a single leader, writes go to the leader and replicas follow, possibly a little behind (**replication lag**). Multi-leader and leaderless designs accept writes in several places and must resolve conflicts.
- **Sharding** (partitioning) splits data across nodes by key, so each node holds part of the data. Choosing the shard key is the crucial decision: a bad key (such as a timestamp) creates **hot spots** where one shard takes all the traffic. **Consistent hashing** spreads keys evenly and limits how much data moves when nodes join or leave.

## The CAP theorem

In a distributed system, a **network partition** (P) means some nodes can't talk to others. CAP says that during a partition you must choose:

- **Consistency (C)**: every read sees the latest write, as if there were one copy of the data. Some requests must then be refused.
- **Availability (A)**: every request to a working node gets a response, which may be stale.

Partitions are not optional in real networks, so the real choice is **CP or AP during a partition**. A banking ledger chooses CP: better to reject a transfer than to allow a double spend. A shopping cart or a social feed chooses AP: better to show a slightly stale cart than an error page.

**PACELC** adds the everyday case: *else*, when there is no partition, you still trade **latency** against **consistency**, because waiting for replicas to confirm takes time.

## Consistency models

Between "always the latest" and "anything goes":

- **Strong (linearisable)**: reads reflect all completed writes.
- **Eventual**: if writes stop, replicas converge. Reads may be stale meanwhile.
- **Read-your-writes**: you always see your own updates, even if others don't yet. Often all a user-facing feature needs.

Leaderless stores such as Cassandra let you tune this per query with quorums: with N replicas, writing to W and reading from R where **R + W > N** guarantees the read overlaps the latest write.

## Choosing

Start with a relational database unless you have a concrete reason not to: it gives transactions, constraints, joins and decades of tooling, and modern ones scale further than most products ever need. Choose NoSQL for a specific access pattern or scale requirement, and be explicit about the consistency your feature needs. Many real systems use both: PostgreSQL for orders and money, Redis for sessions and caching, a search engine for text search.`,
  quiz: [
    { id: 'nc-1', prompt: 'During a network partition, CAP forces a choice between:', options: ['Consistency and availability', 'Speed and storage', 'SQL and NoSQL', 'Replication and sharding'], answer: 0, why: 'Partitions happen, so a system must either refuse some requests (CP) or serve possibly stale data (AP).' },
    { id: 'nc-2', prompt: 'Which store fits "friends of friends who like this band"?', options: ['Key-value store', 'Graph database', 'Wide-column store', 'A CSV file'], answer: 1, why: 'Graph databases traverse relationships natively instead of through many joins.' },
    { id: 'nc-3', prompt: 'With N = 3 replicas, which quorum guarantees reads see the latest write?', options: ['W = 1, R = 1', 'W = 1, R = 2', 'W = 2, R = 2', 'W = 0, R = 3'], answer: 2, why: 'R + W > N (2 + 2 > 3) means every read set overlaps the latest write set.' },
    { id: 'nc-4', prompt: 'Sharding by created_at timestamp often causes:', options: ['Perfectly even load', 'Stronger consistency', 'Data loss', 'A hot spot: all new writes hit the same shard'], answer: 3, why: 'Monotonic keys send current traffic to one partition; hash or compound keys spread it.' },
    { id: 'nc-5', prompt: 'A payment ledger should usually prefer:', options: ['CP: refuse operations rather than risk inconsistency', 'AP: always answer, reconcile later', 'No replication at all', 'Eventual consistency for balances'], answer: 0, why: 'Double spends are worse than temporary unavailability for money.' },
  ],
  interview: [
    { q: 'Explain the CAP theorem with examples.', a: 'When a network partition separates nodes, a distributed store must choose consistency (refuse requests that can\'t see the latest data, e.g. a bank ledger) or availability (answer with possibly stale data, e.g. a shopping cart or feed). PACELC adds the latency vs consistency trade-off when there is no partition.' },
    { q: 'SQL or NoSQL for a new product?', a: 'Default to a relational database for transactions, constraints and flexible querying. Choose NoSQL for a specific need: very high write volume, simple key access at massive scale, flexible documents read as a unit, or graph traversals, and be explicit about consistency.' },
    { q: 'What is the difference between replication and sharding?', a: 'Replication copies the same data to several nodes for availability and read scaling. Sharding splits different data across nodes for write and storage scaling. Large systems use both: each shard is replicated.' },
  ],
}

export default lesson
