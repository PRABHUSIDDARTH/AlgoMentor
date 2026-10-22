import type { Lesson } from '../types'

const lesson: Lesson = {
  id: 'normalisation',
  title: 'Normalisation: 1NF to BCNF',
  minutes: 11,
  diagram: 'normalise-split',
  body: `## The problem normalisation solves

Imagine one wide table of loans: \`loan_id, member_id, member_name, member_email, book_id, title, author, borrowed_at\`. It looks convenient until you use it:

- **Update anomaly**: a member changes email, and you must update every one of their loan rows. Miss one and the data disagrees with itself.
- **Insert anomaly**: you can't record a new member until they borrow something.
- **Delete anomaly**: delete a book's only loan and you lose the fact that the book exists.

All three come from storing the same fact in many places. **Normalisation** is a systematic way to split tables so each fact is stored once.

## Functional dependencies

The tool behind normalisation is the **functional dependency**: \`A -> B\` means "if two rows agree on A, they must agree on B". \`member_id -> member_email\`. \`book_id -> title\`. A table is well designed when every non-key fact depends on the key, the whole key, and nothing but the key.

## First normal form (1NF)

Every cell holds one atomic value, and there are no repeating groups. A \`phones\` column containing "555-1234, 555-9876", or columns \`phone1\`, \`phone2\`, \`phone3\`, break 1NF. Fix: one row per value in a separate table (\`member_phone(member_id, phone)\`).

## Second normal form (2NF)

1NF, plus no **partial dependency**: no non-key column depends on only part of a composite key. In \`enrolment(student_id, course_id, student_name, grade)\`, the key is \`(student_id, course_id)\`, but \`student_name\` depends on \`student_id\` alone. Move it to a \`student\` table. Tables with a single-column key are automatically in 2NF.

## Third normal form (3NF)

2NF, plus no **transitive dependency**: non-key columns must not depend on other non-key columns. In \`employee(emp_id, dept_id, dept_name)\`, \`dept_name\` depends on \`dept_id\`, which depends on \`emp_id\`. Move department facts to a \`department\` table.

## Boyce-Codd normal form (BCNF)

A stricter 3NF: for every functional dependency \`A -> B\`, A must be a superkey. The difference only shows up with overlapping candidate keys. Classic example: \`(student, subject, teacher)\` where each teacher teaches one subject. \`teacher -> subject\`, but \`teacher\` isn't a key, so the table is in 3NF but not BCNF. Splitting into \`(teacher, subject)\` and \`(student, teacher)\` fixes it.

Every decomposition should be **lossless** (joining the pieces gives back exactly the original rows) and, ideally, **dependency-preserving** (each rule can still be checked within one table). BCNF can occasionally force you to give up dependency preservation, which is why many designs stop at 3NF.

## A quick test

Ask for each column: does it describe the key (1NF, one value), the whole key (2NF), and nothing but the key (3NF)? The old mnemonic "the key, the whole key, and nothing but the key" covers most interview questions.

## When to denormalise

Normalised schemas are correct and easy to update, but answering a question may need several joins. Read-heavy systems sometimes **denormalise on purpose**: storing an order's total, keeping a \`comment_count\` on a post, or building reporting tables. The rule is to denormalise deliberately, with a mechanism that keeps the copies in sync (a trigger, a transaction that updates both, or a rebuilt materialised view), and only after measuring a real need. Start normalised; it is far easier to add a careful copy later than to clean up inconsistent data.`,
  quiz: [
    { id: 'nf-1', prompt: 'A member\'s email is stored on every loan row. Changing it in one row but not others is an example of:', options: ['An insert anomaly', 'A deadlock', 'A delete anomaly', 'An update anomaly'], answer: 3, why: 'Storing one fact in many rows means updates can leave copies inconsistent.' },
    { id: 'nf-2', prompt: 'A column holding "555-1234, 555-9876" violates:', options: ['3NF', '2NF', '1NF', 'BCNF only'], answer: 2, why: '1NF requires atomic values: one value per cell.' },
    { id: 'nf-3', prompt: 'In enrolment(student_id, course_id, student_name, grade) with key (student_id, course_id), what is wrong?', options: ['grade depends on part of the key', 'student_name depends on only part of the key (partial dependency)', 'Nothing', 'There is a transitive dependency on grade'], answer: 1, why: 'student_name depends on student_id alone, violating 2NF.' },
    { id: 'nf-4', prompt: 'employee(emp_id, dept_id, dept_name) violates 3NF because:', options: ['dept_name depends on dept_id, a non-key column (transitive dependency)', 'emp_id is not unique', 'It has too many columns', 'It lacks a foreign key'], answer: 0, why: 'Non-key facts must depend only on the key; move department data to its own table.' },
    { id: 'nf-5', prompt: 'When is deliberate denormalisation reasonable?', options: ['Always, joins are slow', 'Only for primary keys', 'Never', 'In read-heavy paths, after measuring, with a mechanism that keeps the copies in sync'], answer: 3, why: 'Copies speed up reads but must be kept consistent deliberately.' },
  ],
  interview: [
    { q: 'Explain 1NF, 2NF and 3NF.', a: '1NF: atomic values, no repeating groups. 2NF: 1NF and no non-key column depends on part of a composite key. 3NF: 2NF and no non-key column depends on another non-key column. "The key, the whole key, and nothing but the key."' },
    { q: 'What is the difference between 3NF and BCNF?', a: 'BCNF requires the left side of every functional dependency to be a superkey. 3NF allows a dependency onto a prime (key) attribute; the difference appears with overlapping candidate keys, e.g. teacher -> subject in (student, subject, teacher).' },
    { q: 'When would you denormalise?', a: 'For read-heavy queries where joins or aggregates are measurably too slow: cached totals, counters, reporting tables. Keep copies consistent with transactions, triggers or materialised views, and start normalised.' },
  ],
}

export default lesson
