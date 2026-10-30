import type { Lesson } from '../types'
import { makeQuiz } from './quiz'

const lesson: Lesson = {
  id: 'ipc-and-io',
  title: 'Inter-process communication and I/O',
  minutes: 11,
  hook: 'A shell runs `ls | grep txt` and the two programs share no memory, yet the text flows from one to the other. Behind it are a kernel buffer, a pair of file descriptors and a careful set of `close` calls. This lesson covers how processes talk to each other, how the CPU talks to devices, and the pipe mistake that makes a program hang forever.',
  keyPoints: [
    'Shared memory is the fastest IPC once set up but needs manual synchronisation; message passing is simpler but costs copies.',
    'A pipe reader sees end-of-file only after every write end is closed, so close the ends you do not use.',
    'Polling wastes the CPU, interrupts let it work meanwhile, and DMA moves bulk data without involving the CPU per byte.',
    'Blocking I/O sleeps the process until data arrives; non-blocking and readiness APIs let one thread serve many connections.',
  ],
  body: `## Talking between processes

Process isolation protects programs from each other, but real systems need them to cooperate: a shell connects commands, a browser talks to its renderer processes, a server hands work to workers. The OS provides **inter-process communication** (IPC) for this. There are two basic models.

- **Shared memory**: the OS maps the same physical pages into two processes. After setup it is the fastest option, since no kernel calls are needed to move data, but the processes must synchronise their access themselves.
- **Message passing**: processes send and receive messages through the kernel. It is simpler to reason about and works across machines, but each message costs a system call and a copy.

> [!KEY] Who does the work
> Every IPC choice decides who carries the data. With message passing the kernel copies and orders it for you. With shared memory the kernel steps aside after setup, which is faster, but ordering and locking become your job.

## Common mechanisms

- **Pipes** are one-way byte streams between related processes. The shell command \`ls | grep txt\` creates a pipe and connects \`ls\`'s output to \`grep\`'s input. **Named pipes** (FIFOs) have a name in the file system so unrelated processes can use them.
- **Message queues** hold discrete messages that processes post and read, possibly with priorities.
- **Shared memory segments** and memory-mapped files for large amounts of data.
- **Sockets** carry data between processes on the same machine or across a network, so they are the basis of client-server programs.
- **Signals** are small asynchronous notifications such as \`SIGINT\` (Ctrl-C) or \`SIGTERM\`. A process may handle most signals; \`SIGKILL\` cannot be caught.

\`\`\`c
int fd[2];
pipe(fd);                       // fd[0] read end, fd[1] write end
if (fork() == 0) {              // child writes
    close(fd[0]);
    write(fd[1], "hi", 2);
    _exit(0);
}
close(fd[1]);                   // parent reads
char buf[2];
read(fd[0], buf, 2);
\`\`\`

Closing the unused ends matters: a reader only sees end-of-file once every write end is closed.

> [!TRY] The forgotten close
> The child writes "hi" and exits. The parent forgets \`close(fd[1])\` and reads in a loop:
>
> \`\`\`c
> while ((n = read(fd[0], buf, 2)) > 0)
>     printf("got %d\\n", n);
> printf("eof\\n");
> \`\`\`
>
> What happens?
>
> ---
>
> It prints \`got 2\`, then hangs and never prints \`eof\`. The parent still holds its own copy of the write end, so the pipe never reports end-of-file and the second \`read\` blocks forever. This was run and confirmed on Linux.

## How the OS handles I/O devices

Devices are wildly different, from keyboards to network cards, so the OS puts them behind a uniform interface. A **device driver** is the kernel code that knows one device's details. Above it, devices appear as files: \`/dev/sda\`, \`/dev/tty\`.

There are three ways for the CPU to deal with a device:

1. **Polling (programmed I/O)**: the CPU repeatedly checks a status register until the device is ready. It is simple, and wasteful when the device is slow.
2. **Interrupt-driven I/O**: the CPU starts the operation and does other work. The device raises an interrupt when it is done and the handler finishes the job. This is efficient for slow or irregular devices.
3. **Direct memory access (DMA)**: for bulk transfers, a **DMA controller** moves data between the device and memory without involving the CPU for every byte, interrupting once when the whole block is done.

Interrupt handlers must be short. Real drivers split the work: a fast **top half** that acknowledges the device, and a **bottom half** that does the longer processing later.

> [!INTERVIEW] Pick the right device method
> Do not answer "interrupts are better". Polling can win for a very fast device that is almost always ready, because it avoids interrupt overhead. Interrupts suit slow or irregular events, and DMA suits bulk transfers. Interviewers listen for the condition that decides each choice.

## Blocking and buffering

A system call such as \`read\` is typically **blocking**: the process moves to the waiting state until data arrives. **Non-blocking** I/O returns immediately with "nothing yet", and **asynchronous** I/O lets the process continue and be notified on completion. Servers handling thousands of connections use \`epoll\`-style readiness notifications rather than one thread per connection.

> [!GOTCHA] Waiting before reading the pipe
> A parent starts a child with its output piped back, then waits for the child to exit before reading. If the child writes more than the pipe holds (64 KiB by default on Linux), it blocks on the full pipe and never exits. Both wait forever. Read the output while the child runs.

Buffering smooths out mismatches in speed. **Caching** keeps recent data in memory, and **spooling** queues output for a slow device such as a printer.

## Disk scheduling

Because a hard disk's cost is dominated by moving the head, the order in which requests are served matters. **FCFS** is fair but wanders. **SSTF** (shortest seek time first) serves the nearest request but can starve far ones. **SCAN**, the elevator algorithm, sweeps the head in one direction serving everything on the way, then reverses; **C-SCAN** returns to the start and sweeps again for more uniform waiting. On SSDs, which have no head, this scheduling matters little.`,
  quiz: makeQuiz('os10', 9, [
    ['Which IPC mechanism is fastest once set up, but needs the processes to synchronise themselves?', 'Shared memory', ['Pipes', 'Signals', 'Message queues'], 'No kernel call is needed per transfer, but nothing stops two writers colliding.'],
    ['Why must the parent close the write end of a pipe it only reads from?', 'The reader sees end-of-file only when all write ends are closed', ['Pipes allow only one open end per process', 'The kernel would run out of file descriptors', 'The child could not write otherwise'], 'An extra open write end keeps the reader waiting for data that never comes.'],
    ['What advantage does DMA have over interrupt-driven I/O for a large transfer?', 'The controller moves the data, so the CPU is not interrupted for every byte or word', ['It needs no device driver', 'It makes the device faster', 'It avoids using memory'], 'The CPU is interrupted once when the whole block is complete.'],
    ['Which signal cannot be caught or ignored?', 'SIGKILL', ['SIGINT', 'SIGTERM', 'SIGHUP'], 'The kernel guarantees SIGKILL can always stop a process.'],
    ['Which disk scheduling algorithm sweeps the head in one direction, serving requests on the way?', 'SCAN (the elevator algorithm)', ['FCFS', 'SSTF', 'Round Robin'], 'SCAN avoids starving far requests and reduces head movement.'],
  ]),
  interview: [
    { q: 'What ways can processes communicate?', a: 'Shared memory for speed with manual synchronisation; message passing through pipes, queues or sockets for simplicity and distribution; and signals for simple notifications. The right choice depends on volume, latency and whether the processes are on one machine.' },
    { q: 'Polling versus interrupts versus DMA?', a: 'Polling keeps the CPU checking and is only good for fast devices. Interrupts let the CPU work until the device signals. DMA offloads bulk transfers to a controller so the CPU is involved only at the start and end.' },
    { q: 'What does ls | grep txt do at the OS level?', a: 'The shell creates a pipe, forks two children, redirects the first\'s standard output to the pipe\'s write end and the second\'s standard input to its read end, then execs each program.' },
    { q: 'Blocking versus non-blocking I/O?', a: 'Blocking calls put the process to sleep until the operation completes. Non-blocking calls return immediately, so the program can check later, which is how event-driven servers handle many connections with few threads.' },
  ],
}

export default lesson
