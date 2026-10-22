import type { Lesson } from '../types'
import { makeQuiz } from './quiz'

const lesson: Lesson = {
  id: 'threads',
  title: 'Threads and concurrency',
  minutes: 10,
  body: `## Why threads exist

A process gives you isolation, but sometimes you want several activities inside one program that share data: a web server handling many clients, an editor that saves while you type, a game that renders and plays sound. Starting a whole process for each is heavy, and sharing data between processes needs special machinery.

A **thread** is a flow of execution inside a process. The threads of one process share the same address space, so they see the same code, heap, global variables and open files, but each thread has its own:

- program counter and registers,
- **stack** (its local variables and call chain),
- thread-local storage and scheduling state.

## Threads versus processes

| | Process | Thread |
| --- | --- | --- |
| Memory | Own address space | Shared with its siblings |
| Creation cost | Higher | Lower |
| Context switch | Slower (switches address space) | Faster (same address space) |
| Communication | Needs IPC | Read and write shared variables |
| If one crashes | The others are unaffected | The whole process usually dies |

The sharing is both the benefit and the danger. Two threads can exchange data instantly, but a bug in one can corrupt the data of all of them.

## Concurrency and parallelism

These are different ideas that are often confused. **Concurrency** means several tasks are in progress during the same period, possibly interleaved on one CPU core. **Parallelism** means tasks literally run at the same instant on different cores. A single-core machine can be concurrent but not parallel.

## User-level and kernel-level threads

- **Kernel threads** are known to the OS, which schedules each one. A blocking system call in one thread blocks only that thread, and threads can run on different cores.
- **User-level threads** are managed by a library without the kernel's knowledge. They are very cheap to switch, but a blocking system call can stall the whole process, and they cannot use several cores on their own.

Mapping models connect the two: **one-to-one** (each user thread has a kernel thread; Linux and Windows do this), **many-to-one**, and **many-to-many**. Newer runtimes such as Go's goroutines and Java's virtual threads multiplex many cheap user-level tasks onto a few kernel threads.

## Creating threads

\`\`\`python
import threading

results = []

def work(n):
    results.append(n * n)   # list.append is safe in CPython; most shared updates are not

threads = [threading.Thread(target=work, args=(i,)) for i in range(4)]
for t in threads:
    t.start()
for t in threads:
    t.join()               # wait for each thread to finish
print(sorted(results))     # [0, 1, 4, 9]
\`\`\`

\`start\` begins running the thread and \`join\` waits for it. The order in which the threads run is decided by the scheduler, so a program must never depend on it.

## Thread pools

Creating a thread per task is wasteful and, if tasks arrive faster than they finish, can exhaust memory. A **thread pool** creates a fixed number of worker threads up front; tasks go into a queue and each idle worker takes the next one. This bounds resource use and removes the cost of creating threads repeatedly. A good size depends on the work: close to the number of cores for CPU-bound tasks, larger for tasks that mostly wait on I/O.

## The cost of sharing

Because threads share memory, two of them updating the same variable can lose updates or see half-finished changes. That problem, the **race condition**, and the tools that solve it, locks and semaphores, are the subject of the synchronisation module. For now, remember the rule: shared data that is written by any thread must be protected.`,
  quiz: makeQuiz('os3', 2, [
    ['What do the threads of one process share?', 'The address space: code, heap, globals and open files', ['Their stacks', 'Their CPU registers', 'Their program counters'], 'Each thread keeps its own stack, registers and program counter; everything else is shared.'],
    ['Why is switching between threads usually cheaper than switching between processes?', 'No change of address space is needed', ['Threads never use the CPU', 'Threads have no registers to save', 'Threads run only in kernel mode'], 'The memory mapping stays the same, so less state is switched and caches stay warmer.'],
    ['A single-core machine runs two tasks by switching rapidly between them. This is', 'Concurrency without parallelism', ['Parallelism without concurrency', 'Neither concurrency nor parallelism', 'Multiprocessing'], 'Tasks overlap in time but never execute at the same instant.'],
    ['Why use a thread pool instead of a new thread per request?', 'It bounds resource use and avoids repeated creation cost', ['Threads in a pool never need synchronisation', 'It makes every thread run in parallel on one core', 'Pooled threads cannot crash'], 'A fixed set of workers takes tasks from a queue, so load cannot create unlimited threads.'],
    ['In many designs, an unhandled crash in one thread', 'Typically terminates the whole process', ['Only stops that thread', 'Is automatically retried by the kernel', 'Has no effect'], 'Threads share memory and fate, so a fatal fault usually takes the process down.'],
  ]),
  interview: [
    { q: 'What is the difference between a process and a thread?', a: 'A process owns an address space and resources. Threads are execution flows inside a process that share its memory but each have their own stack and registers. Threads are cheaper and communicate easily, but have no isolation from each other.' },
    { q: 'Concurrency versus parallelism?', a: 'Concurrency is about dealing with many things at once, by interleaving. Parallelism is doing many things at the same instant, which needs multiple cores. You can have either without the other.' },
    { q: 'Why not create a thread for every incoming request?', a: 'Creation has a cost and each thread consumes stack memory, so a burst of requests can exhaust the machine. A pool limits concurrency and reuses threads.' },
  ],
}

export default lesson
