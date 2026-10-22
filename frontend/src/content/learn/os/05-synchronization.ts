import type { Lesson } from '../types'
import { makeQuiz } from './quiz'

const lesson: Lesson = {
  id: 'synchronization',
  title: 'Synchronisation',
  minutes: 13,
  body: `## The race condition

When threads or processes share data, the result can depend on the exact order their steps interleave. That is a **race condition**. The classic example is a shared counter:

\`\`\`python
counter = 0

def deposit():
    global counter
    for _ in range(100_000):
        counter += 1      # looks like one step; it is three
\`\`\`

\`counter += 1\` is really **read** the value, **add** one, **write** it back. If two threads read the same value before either writes, one update is lost. Run the code with two threads and the final value is often below 200,000, and different on each run. These bugs are hard to reproduce because they depend on timing.

## The critical section problem

The code that touches shared data is a **critical section**. A correct solution must provide:

1. **Mutual exclusion**: at most one thread is inside the critical section at a time.
2. **Progress**: if nobody is inside, a thread that wants in is not delayed forever by threads that do not.
3. **Bounded waiting**: a waiting thread is eventually let in (no starvation).

## Locks (mutexes)

A **mutex** is a lock with two operations: *acquire* (wait until it is free, then take it) and *release*.

\`\`\`python
import threading
lock = threading.Lock()

def deposit():
    global counter
    for _ in range(100_000):
        with lock:            # acquire ... release, even if an exception occurs
            counter += 1
\`\`\`

Keep critical sections short: while a thread holds the lock, everyone else waits. Locking too coarsely wastes parallelism, and locking too finely invites bugs.

Hardware helps. Instructions such as **test-and-set** and **compare-and-swap** are **atomic**: the CPU performs them as one indivisible step, and locks and lock-free structures are built on them. A **spinlock** busy-waits in a loop on such an instruction, which is efficient only when the wait is very short; otherwise the thread should sleep until woken.

## Semaphores

A **semaphore** is an integer with two atomic operations: **wait** (also P or down), which decrements it and blocks if it would go below zero, and **signal** (V or up), which increments it and wakes a waiter.

- A **binary semaphore** (0 or 1) works like a mutex.
- A **counting semaphore** limits access to a pool of N identical resources, such as database connections.

## Classic problems

**Producer–consumer (bounded buffer).** Producers add items to a buffer of fixed size and consumers remove them. Three things are needed: a mutex around the buffer, a semaphore counting empty slots (producers wait when it is zero), and a semaphore counting full slots (consumers wait when it is zero).

**Readers–writers.** Many readers may read together, but a writer needs exclusive access. The design question is who is favoured, since favouring readers can starve writers.

**Dining philosophers.** Five philosophers share five forks, and each needs two to eat. If everyone picks up their left fork at once, nobody can proceed. This is the classic picture of deadlock, which the next module covers. A fix is to make one philosopher pick up forks in the opposite order, or allow at most four to sit.

## Monitors and condition variables

A **monitor** bundles shared data with the methods that use it so that only one thread runs inside at a time. Inside it, a thread that cannot proceed waits on a **condition variable**, releasing the lock while it sleeps, and is woken when another thread signals. Java's \`synchronized\` with \`wait\` and \`notify\` and Python's \`threading.Condition\` work this way. Always re-check the condition in a loop after waking, because the wake-up can be spurious or another thread may have taken the item first.`,
  quiz: makeQuiz('os5', 4, [
    ['Two threads run counter += 1 100,000 times each without a lock. Why can the result be below 200,000?', 'The read, add and write steps can interleave and lose updates', ['Python limits counters to 100,000', 'The CPU rounds the result down', 'Threads cannot share variables'], 'Both threads can read the same old value, so one increment is overwritten.'],
    ['Which is NOT a requirement of a correct critical-section solution?', 'Threads must run in strict alternation', ['Mutual exclusion', 'Progress', 'Bounded waiting'], 'Alternation is not required; the three requirements are mutual exclusion, progress and bounded waiting.'],
    ['What does a counting semaphore initialised to 5 model?', 'A pool of five identical resources', ['Five locks that must all be held', 'A mutex that five threads own', 'A queue of five processes in the ready state'], 'Each wait takes a unit and the sixth caller blocks until a signal returns one.'],
    ['Why must a waiting thread re-check its condition in a loop after being woken?', 'The wake-up may be spurious, or another thread may have taken the item first', ['Wake-ups always corrupt the lock', 'The condition variable forgets the condition', 'Loops are faster than if statements'], 'Waking only means the condition may be true, not that it is.'],
    ['In producer-consumer with a bounded buffer, what do the two counting semaphores track?', 'Empty slots and full slots', ['Producers and consumers alive', 'Read and write permissions', 'CPU time and memory'], 'Producers wait on empty slots and consumers wait on full slots.'],
  ]),
  interview: [
    { q: 'What is a race condition and how do you prevent it?', a: 'Behaviour that depends on the unpredictable interleaving of threads touching shared data. You prevent it by making the critical section mutually exclusive with a lock, or by using atomic operations or by avoiding shared mutable state.' },
    { q: 'Mutex versus semaphore?', a: 'A mutex is a lock owned by the thread that acquired it and ensures mutual exclusion. A semaphore is a counter used for signalling or for limiting access to N resources, and any thread can signal it.' },
    { q: 'Explain the producer-consumer problem.', a: 'Producers add to a bounded buffer and consumers remove from it. A mutex protects the buffer, one semaphore counts empty slots so producers block when it is full, and another counts items so consumers block when it is empty.' },
    { q: 'When is a spinlock appropriate?', a: 'When the lock is held only very briefly and the waiter would otherwise pay for a sleep and wake-up, typically in kernels on multiprocessor machines. Spinning for long wastes CPU.' },
  ],
}

export default lesson
