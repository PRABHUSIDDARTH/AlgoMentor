import type { Lesson } from '../types'
import { makeQuiz } from './quiz'

const lesson: Lesson = {
  id: 'deadlocks',
  title: 'Deadlocks',
  minutes: 11,
  diagram: 'deadlock-cycle',
  body: `## Stuck forever

A **deadlock** is a situation in which a set of processes are each waiting for a resource held by another process in the set, so none can ever proceed. A familiar picture: two cars meet on a one-lane bridge, and neither will back up.

In code, the textbook case is two locks taken in opposite orders:

\`\`\`python
# Thread 1                     # Thread 2
with lock_a:                   with lock_b:
    with lock_b:                   with lock_a:
        transfer()                     transfer()
\`\`\`

If thread 1 holds \`lock_a\` while thread 2 holds \`lock_b\`, each waits for the other's lock forever. A deadlock is not the same as starvation: in starvation a process waits because others keep winning, but could still proceed; in a deadlock no member can ever proceed.

## The four necessary conditions (Coffman)

A deadlock can occur only if **all four** hold at once:

1. **Mutual exclusion**: a resource can be held by only one process at a time.
2. **Hold and wait**: a process holding resources waits for more.
3. **No preemption**: resources cannot be forcibly taken away.
4. **Circular wait**: a cycle of processes each waits for a resource held by the next.

These conditions are the key to every strategy: break any one and deadlock is impossible.

## Resource allocation graphs

Draw processes as circles and resources as squares. An arrow from a resource to a process means the process holds it; an arrow from a process to a resource means it is requesting it. With one instance of each resource, a **cycle means deadlock**. With several instances per resource, a cycle is necessary but not sufficient.

## Strategy 1: prevention

Design the system so that one of the four conditions can never hold.

- Break **hold and wait**: require processes to request everything at once, or release all they hold before asking for more. This lowers utilisation and can cause starvation.
- Break **no preemption**: if a request cannot be granted, make the process release what it holds.
- Break **circular wait**: give all resources a global order and require processes to acquire them in increasing order. This is the most practical rule, and it is exactly how the two-lock example above is fixed: always take \`lock_a\` before \`lock_b\`.
- Mutual exclusion usually cannot be removed, since some resources are inherently non-shareable.

## Strategy 2: avoidance

Allow all conditions but never enter an **unsafe state**. A state is **safe** if there is some order in which every process can finish, even if each demands its maximum. The **banker's algorithm** checks this on each request: it grants the request only if the resulting state is still safe. It needs each process's maximum demand in advance, which is rarely known, so it is mostly a teaching tool.

## Strategy 3: detection and recovery

Let deadlocks happen, detect them by searching for a cycle in the wait-for graph, and recover by terminating one or more processes, or by taking resources from some of them. Databases do this: they detect deadlocked transactions and abort one as the victim.

## Strategy 4: ignore it

Most general-purpose operating systems take the **ostrich approach**: deadlocks are rare, and prevention would cost more than occasional restarts. It then falls to application programmers to follow lock-ordering rules.

## Practical advice

- Acquire locks in a consistent global order.
- Hold locks for as short a time as possible and never call unknown code while holding one.
- Use a timeout when acquiring (\`try_lock\`), and back off if it fails.
- Prefer designs that avoid sharing, such as message passing.`,
  quiz: makeQuiz('os6', 5, [
    ['Which is NOT one of the four necessary conditions for deadlock?', 'Starvation', ['Mutual exclusion', 'Hold and wait', 'Circular wait'], 'The four are mutual exclusion, hold and wait, no preemption and circular wait.'],
    ['What is the most practical way to prevent deadlock between locks?', 'Acquire locks in one global order', ['Use more threads', 'Make every lock a spinlock', 'Increase the time slice'], 'A fixed order makes a circular wait impossible.'],
    ['In a resource allocation graph with one instance of each resource, a cycle means', 'A deadlock', ['Only possible starvation', 'A safe state', 'Nothing yet'], 'With single instances each process in the cycle waits on the next forever.'],
    ['What does the banker\'s algorithm decide?', 'Whether granting a request keeps the system in a safe state', ['Which process has the highest priority', 'How large the page size should be', 'Which process to kill after a deadlock'], 'It only grants requests that leave some safe completion order.'],
    ['How do databases typically handle deadlock?', 'Detect it and abort one transaction as the victim', ['Prevent it by using a single thread', 'Ignore it completely', 'Restart the server'], 'A cycle in the wait-for graph is detected and a victim is rolled back.'],
  ]),
  interview: [
    { q: 'What is a deadlock and what are its four conditions?', a: 'Processes waiting on each other forever. It needs mutual exclusion, hold and wait, no preemption and circular wait all at once; removing any one prevents it.' },
    { q: 'How would you avoid deadlock in code that takes two locks?', a: 'Impose a global lock ordering, for example by lock id or address, and always acquire in that order. Alternatively use try-lock with a timeout and back off, or avoid holding both at once.' },
    { q: 'Deadlock versus starvation?', a: 'In deadlock a set of processes block each other permanently. In starvation a process could run but is repeatedly passed over, for example by priority scheduling; aging fixes it.' },
    { q: 'What is a safe state?', a: 'One from which the system can let every process finish in some order, even if each requests its maximum. An unsafe state may lead to deadlock but does not always.' },
  ],
}

export default lesson
