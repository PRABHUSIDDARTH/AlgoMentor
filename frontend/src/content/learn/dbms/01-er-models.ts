import type { Lesson } from '../types'

const lesson: Lesson = {
  id: 'er-models',
  title: 'Data models & ER diagrams',
  minutes: 9,
  diagram: 'er-library',
  hook: 'A clinic\'s booking app stores every appointment as one row, with the patient\'s name, phone and doctor typed in again each time. Six months later a patient changes their number and half the old rows disagree with the rest. Drawing the entities and how they relate before any table exists is the cheap way to avoid that.',
  keyPoints: [
    'An ER model lists the things you store (entities), facts about them (attributes) and how they connect (relationships).',
    'Cardinality and participation decide where foreign keys, junction tables and NOT NULL constraints go.',
    'A weak entity has no key of its own; its key includes its owner\'s key.',
    'Mapping an ER model to tables is mechanical, so settle the model before writing CREATE TABLE.',
  ],
  body: `## Start from the things, not the tables

Before choosing tables and columns, decide what the system needs to remember and how those things relate. A **data model** is that description. Getting it right early is cheap; fixing it after a year of production data means migrations, backfills and broken reports.

The **entity-relationship (ER) model** is the standard way to sketch it. It has three building blocks:

- **Entities**: the things you store data about, such as \`Member\`, \`Book\` and \`Loan\`. Each entity has a **key** that identifies one instance.
- **Attributes**: facts about an entity: a member's name, a book's ISBN.
- **Relationships**: how entities connect: a member *borrows* a book, a book is *written by* authors.

## Kinds of attributes

ER diagrams distinguish attributes that will matter when you design tables:

- **Simple** (a single value, like \`isbn\`) vs **composite** (made of parts, like \`address\` with street, city and postcode).
- **Single-valued** vs **multi-valued** (a member with several phone numbers). Multi-valued attributes usually become their own table.
- **Derived** attributes can be computed from others (\`age\` from \`date_of_birth\`), so they are often not stored at all.

> [!GOTCHA]
> Storing a multi-valued attribute as a comma-separated string, such as \`phones = '555-1234, 555-9876'\`, looks fine until you need to find who owns one number or remove just one. Every query then needs string parsing, and nothing can enforce uniqueness. Give each value its own row in a child table.

## Cardinality and participation

Each relationship has a **cardinality**:

- **One-to-one**: a person has one passport; a passport belongs to one person.
- **One-to-many**: a library branch has many shelves; each shelf is in one branch.
- **Many-to-many**: a member borrows many books over time, and each book is borrowed by many members.

**Participation** says whether every instance must take part. Every \`Loan\` must have a member (total participation), but a member need not have any loans (partial). These rules become \`NOT NULL\` constraints and foreign keys later, so ask about them when gathering requirements.

> [!KEY] Cardinality decides the tables
> Ask "one or many?" in both directions for every relationship. One-to-many puts a foreign key on the many side. Many-to-many needs a junction table. Most schema mistakes start with a cardinality nobody asked about.

## Weak entities

Some entities can't be identified on their own. A \`Copy\` of a book might be identified as "copy 3 of ISBN 978-0441", so it depends on its \`Book\`. That is a **weak entity**: its key includes its owner's key.

## Reading the diagram

In Chen notation, entities are rectangles, attributes are ovals and relationships are diamonds. Most teams today use **crow's foot** notation instead: entities are boxes listing their attributes, and the line ends show cardinality, with a single bar for "one" and a three-pronged crow's foot for "many". A circle means "optional" (zero allowed).

## From ER model to tables

The mapping is mechanical, which is the point of the exercise:

- Each strong entity becomes a table with its key as the primary key.
- A one-to-many relationship becomes a foreign key on the "many" side (\`shelf.branch_id\`).
- A many-to-many relationship becomes a **junction table** holding both keys (\`loan(member_id, copy_id, borrowed_at, due_at)\`). Attributes of the relationship itself, like the due date, live there too.
- A one-to-one relationship becomes a foreign key with a unique constraint on either side.

Notice that \`Loan\` started as a relationship and turned into an entity once it gained its own attributes and lifecycle. That happens often, and it is a good sign your model is capturing something real.

> [!TRY] Where does the due date live?
> Members borrow books, and each loan has a due date. Which table holds \`due_at\`: member, book or loan?
>
> ---
>
> The loan table. A due date describes one pairing of a member and a copy, not the member alone or the book alone, so it sits next to both keys in the junction table.

## In interviews

Database design questions start exactly here: list the entities, mark keys, draw relationships with cardinalities, and only then write \`CREATE TABLE\`. Saying the cardinalities out loud ("one member, many loans") shows you are designing from the domain, not guessing at columns.

> [!INTERVIEW] Say each cardinality aloud
> State each relationship as a sentence ("one member, many loans") and ask about participation before you draw anything. The interviewer is listening for questions about requirements, and for you noticing when a relationship with its own attributes becomes a table.`,
  quiz: [
    { id: 'er-1', prompt: 'In an ER model, what is an entity?', options: ['A thing the system stores data about, such as Member or Book', 'A SQL query', 'An index on a column', 'A transaction log'], answer: 0, why: 'Entities are the nouns of the domain; attributes describe them and relationships connect them.' },
    { id: 'er-2', prompt: 'Members borrow many books and each book is borrowed by many members over time. How is this stored in tables?', options: ['A foreign key on books', 'A junction table holding both keys', 'A foreign key on members', 'A comma-separated list column'], answer: 1, why: 'Many-to-many relationships need a junction (associative) table with one row per pairing.' },
    { id: 'er-3', prompt: 'A member can have several phone numbers. This is a:', options: ['Derived attribute', 'Weak entity', 'Multi-valued attribute, usually stored in its own table', 'Primary key'], answer: 2, why: 'Multi-valued attributes break the one-value-per-cell rule, so they get their own table.' },
    { id: 'er-4', prompt: 'A one-to-many relationship between Branch and Shelf becomes:', options: ['A unique index on both', 'A shelf_id foreign key on Branch', 'A junction table', 'A branch_id foreign key on Shelf'], answer: 3, why: 'The foreign key goes on the "many" side, pointing at its one parent.' },
    { id: 'er-5', prompt: 'Which attribute is usually not stored because it can be computed?', options: ['Age', 'Date of birth', 'ISBN', 'Member ID'], answer: 0, why: 'Age is derived from date of birth and changes over time; storing it invites inconsistency.' },
  ],
  interview: [
    { q: 'How do you turn a many-to-many relationship into tables?', a: 'With a junction table holding the two foreign keys, often as a composite primary key, plus any attributes that belong to the relationship itself, such as a loan\'s due date.' },
    { q: 'What is a weak entity?', a: 'An entity that cannot be identified by its own attributes alone and depends on an owner entity, so its key includes the owner\'s key: copy 3 of a given book, line 2 of a given order.' },
    { q: 'Where do you start when designing a schema in an interview?', a: 'Clarify requirements, list entities and their keys, draw relationships with cardinality and participation, then map to tables, foreign keys and constraints, and finally consider queries and indexes.' },
  ],
}

export default lesson
