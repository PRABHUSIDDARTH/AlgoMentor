import type { Track } from './types'

export const DBMS: Track = {
  id: 'dbms',
  title: 'Database management systems',
  short: 'DBMS',
  summary: 'Design schemas, write SQL, and understand transactions, indexes and how a database runs your query.',
  projects: [],
  modules: [
    {
      id: 'er-models',
      title: 'Data models & ER diagrams',
      minutes: 8,
      body: `## Start from the things, not the tables

An **entity-relationship (ER) model** describes the things a system stores (*entities*, such as Member and Book), their *attributes*, and how they relate (*relationships*, such as a Member borrows a Book).

## Cardinality

Each relationship has a **cardinality**: one-to-one, one-to-many or many-to-many. A member can borrow many books, and a book is borrowed by many members over time, so *borrows* is many-to-many.`,
      quiz: [
        { id: 'er-1', prompt: 'In an ER model, what is an entity?', options: ['A SQL query', 'A thing the system stores data about', 'An index', 'A transaction'], answer: 1, why: 'Entities are the nouns: Member, Book, Loan.' },
        { id: 'er-2', prompt: 'A member borrows many books, and each book is borrowed by many members over time. The cardinality is:', options: ['One-to-one', 'One-to-many', 'Many-to-many', 'Zero-to-one'], answer: 2, why: 'Many on both sides.' },
        { id: 'er-3', prompt: 'What is an attribute?', options: ['A property of an entity, such as a book\'s title', 'A relationship between two tables', 'A type of join', 'A database user'], answer: 0, why: 'Attributes describe entities.' },
        { id: 'er-4', prompt: 'Each person has exactly one passport, and each passport belongs to one person. This is:', options: ['One-to-one', 'One-to-many', 'Many-to-many', 'Recursive'], answer: 0, why: 'One on each side.' },
        { id: 'er-5', prompt: 'Why design an ER model before writing tables?', options: ['SQL requires it', 'It settles what the data means before choosing how to store it', 'It makes queries faster automatically', 'It removes the need for keys'], answer: 1, why: 'Modelling first avoids baking misunderstandings into the schema.' },
      ],
      interview: [
        { q: 'How do you turn a many-to-many relationship into tables?', a: 'With a junction table holding the two foreign keys (and any attributes of the relationship, such as loan date).' },
        { q: 'What is the difference between an entity and an attribute?', a: 'An entity is a thing with its own identity (a Book); an attribute is a fact about it (its title).' },
      ],
    },
  ],
}
