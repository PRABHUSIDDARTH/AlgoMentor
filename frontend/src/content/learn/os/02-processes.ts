import type { Lesson } from '../types'
import { makeQuiz } from './quiz'

const lesson: Lesson = {
  id: 'processes',
  title: 'Processes',
  minutes: 11,
  diagram: 'process-states',
  body: `## A program in execution

A **program** is a file on disk: instructions and data. A **process** is a running instance of it, with its own state. Run the same program twice and you get two processes.

Each process has its own **address space**, laid out roughly like this from low to high addresses:

- **Text**: the machine code (read-only).
- **Data**: global and static variables.
- **Heap**: memory from \`malloc\` or \`new\`, growing upward.
- **Stack**: function frames, local variables and return addresses, growing downward.

Because each process has a private address space, one process cannot read another's memory by accident. That isolation is why processes are safe and also why communicating between them takes effort (a later module).

## The process control block

The kernel tracks every process in a **process control block** (PCB), a record holding:

- the process id (PID) and its parent's PID,
- the **state** (see below),
- saved CPU registers and the program counter,
- memory-management information (page tables),
- open files and other resources,
- scheduling information such as priority and CPU time used.

## Process states

A process moves between a few states:

- **New**: being created.
- **Ready**: able to run, waiting for a CPU.
- **Running**: executing on a CPU right now.
- **Waiting** (blocked): waiting for something, such as disk input or a lock, and not able to use a CPU yet.
- **Terminated**: finished, waiting for its exit status to be collected.

The scheduler moves a process from ready to running (dispatch). A running process goes back to ready if its time slice expires (preemption), to waiting if it asks for slow I/O, and to terminated when it exits. When the I/O completes, the process moves from waiting to ready, not straight to running.

## Context switching

When the CPU moves from one process to another, the kernel performs a **context switch**: it saves the running process's registers and program counter into its PCB, loads the next process's saved values, and switches address spaces. The switch is pure overhead, since no user work happens during it, and it also disturbs the CPU caches. That is why a scheduler should not switch too often.

## Creating processes: fork and exec

On Unix, a new process is created by copying an existing one:

\`\`\`c
pid_t pid = fork();          // returns twice
if (pid == 0) {
    execlp("ls", "ls", "-l", NULL);   // child: replace itself with a new program
    _exit(127);                      // only reached if exec failed
} else if (pid > 0) {
    int status;
    waitpid(pid, &status, 0);        // parent: wait for the child
}
\`\`\`

- \`fork\` creates a child that is a copy of the parent. It returns the child's PID in the parent, \`0\` in the child, and \`-1\` on failure.
- \`exec\` replaces the calling process's program with a new one. The PID stays the same.
- \`wait\` lets a parent collect a child's exit status.

Modern kernels use **copy-on-write**: parent and child share memory pages until one of them writes, so \`fork\` is cheap. Windows has a single call, \`CreateProcess\`, that does both steps.

## Zombies and orphans

When a child exits, the kernel keeps its PCB until the parent calls \`wait\`; in that interval the child is a **zombie**. It uses no CPU or memory, but it holds a process-table slot, so a parent that never waits leaks them. If a parent exits first, its children become **orphans** and are adopted by the init process, which reaps them.`,
  quiz: makeQuiz('os2', 1, [
    ['What does fork() return in the child process?', '0', ['The parent\'s PID', 'The child\'s PID', '-1'], 'The parent gets the child\'s PID; the child gets 0, which is how each tells which it is.'],
    ['A running process starts a slow disk read. Which state does it enter?', 'Waiting (blocked)', ['Ready', 'Terminated', 'New'], 'It cannot use the CPU until the I/O completes, so it blocks.'],
    ['What does the kernel save and restore in a context switch?', 'The process\'s CPU registers and program counter, and its address-space mapping', ['The whole contents of RAM', 'Only the hard-disk contents', 'The user\'s open web pages'], 'The PCB holds the state needed to resume the process exactly where it stopped.'],
    ['What is a zombie process?', 'A terminated child whose exit status has not yet been collected by its parent', ['A process stuck in an infinite loop', 'A process with no parent', 'A process using too much memory'], 'The PCB stays until the parent calls wait.'],
    ['Why is fork() cheap on modern systems even for large processes?', 'Copy-on-write: pages are shared until one process writes to them', ['It never copies anything and shares the stack forever', 'It only copies the heap', 'Because exec runs first'], 'Pages are duplicated lazily, on the first write.'],
  ]),
  interview: [
    { q: 'What is the difference between a process and a program?', a: 'A program is passive code and data on disk. A process is a running instance with its own address space, registers, open files and state. One program can have many processes.' },
    { q: 'What do fork and exec each do, and why are they separate?', a: 'fork duplicates the calling process; exec replaces its program image. Keeping them separate lets the child change its file descriptors or environment between the two calls, which is how shells set up redirection and pipes.' },
    { q: 'What is a context switch and why is it costly?', a: 'Saving one process\'s registers and mapping into its PCB and loading another\'s. No useful work happens during it, and the new process starts with cold caches and TLB entries.' },
    { q: 'How do zombies and orphans differ?', a: 'A zombie is a finished child waiting to be reaped by its parent. An orphan is a running child whose parent has exited; init adopts it.' },
  ],
}

export default lesson
