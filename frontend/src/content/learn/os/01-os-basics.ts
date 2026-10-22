import type { Lesson } from '../types'
import { makeQuiz } from './quiz'

const lesson: Lesson = {
  id: 'os-basics',
  title: 'What an operating system does',
  minutes: 9,
  hook: 'A program that writes its output one byte at a time can run far slower than the same program writing the whole thing at once, even though the file ends up identical. The cost sits in the doorway every program must use to reach the hardware. This lesson covers that doorway (system calls), the kernel behind it, and the interrupts that let the kernel stay in charge.',
  keyPoints: [
    'The kernel runs with full hardware privilege; everything else runs in user mode, where the CPU blocks privileged instructions.',
    'A system call is the controlled doorway from user code into the kernel, and it costs far more than a function call.',
    'Interrupts, above all the timer interrupt, are how the kernel takes control back from running programs.',
    'Monolithic kernels trade isolation for speed; microkernels trade speed for isolation.',
  ],
  body: `## The program between programs and hardware

An **operating system** (OS) is the software that manages the computer's hardware and gives every other program a safe, simple way to use it. Without one, each program would have to drive the disk, the network card and the display itself, and two programs running together would trample each other's memory.

It does four jobs:

- **Resource management**: it shares the CPU, memory, disks and devices between many programs.
- **Abstraction**: you open a *file*, not disk sectors; you use a *process*, not raw CPU registers.
- **Protection**: one program cannot read or corrupt another's memory, and ordinary programs cannot reprogram the hardware.
- **Convenience**: it starts programs, handles input and output, and reports errors.

## Kernel and user mode

The core of the OS is the **kernel**. It runs in a privileged **kernel mode** where it may execute every CPU instruction and touch any memory. Everything else, including your browser, your editor and the shell, runs in **user mode**, where privileged instructions are blocked by the hardware itself. If user code tries one, the CPU raises a trap and the kernel takes over, usually by terminating the program.

This two-mode split is the foundation of protection. It is why a bug in your program crashes your program rather than the whole machine.

> [!KEY] Protection comes from the hardware
> The OS does not check each instruction a program runs. The CPU itself refuses privileged instructions in user mode, and the only ways into kernel mode are a system call or an interrupt, which jump to entry points the kernel chose.

## System calls

A user program that needs something only the kernel can do (read a file, create a process, send a packet) makes a **system call**. The call is a controlled doorway into the kernel:

1. The program puts the call number and arguments in registers and executes a special trap instruction.
2. The CPU switches to kernel mode and jumps to a fixed kernel entry point.
3. The kernel checks the arguments, does the work, and places the result in a register.
4. The CPU switches back to user mode and the program continues.

Library functions hide this. In C, \`printf\` formats text and eventually calls the \`write\` system call; \`fopen\` ends up in \`open\`. Calls fall into groups: process control (\`fork\`, \`exec\`, \`exit\`), file management (\`open\`, \`read\`, \`write\`, \`close\`), device management, information (\`getpid\`, \`time\`) and communication (\`pipe\`, \`socket\`).

\`\`\`c
#include <unistd.h>
int main(void) {
    write(1, "hello\n", 6);   // file descriptor 1 is standard output
    return 0;
}
\`\`\`

A system call is far more expensive than an ordinary function call, because of the mode switch and the checks. That is one reason programs buffer their output instead of writing one byte at a time.

> [!TRY] One thousand putchar calls
> A C program calls \`putchar('x')\` 1000 times in a loop, then exits. Its standard output is redirected to a file. Roughly how many \`write\` system calls does it make?
>
> ---
>
> One. The C library collects the bytes in a buffer and, because stdout is a file and not a terminal, flushes it once at exit as a single \`write\` of 1000 bytes (checked with \`strace\` on Linux with glibc). Calling \`write\` directly for each byte would cost 1000 mode switches.

## Kernel designs

- A **monolithic kernel** (Linux, classic Unix) keeps the scheduler, memory manager, file systems and drivers all in kernel space. It is fast because components call each other directly, but a bug in a driver can bring everything down.
- A **microkernel** keeps only the essentials (scheduling, memory, messaging) in the kernel and runs drivers and file systems as user-mode servers. It is more robust and modular but pays for extra message passing.
- A **hybrid** design, as in Windows and macOS, mixes the two.

> [!GOTCHA] Monolithic does not mean frozen
> Linux is monolithic, yet it loads and unloads modules at run time. People take that to mean a loadable driver is somehow sandboxed. It is not: a module runs in kernel mode with full privilege, so a buggy driver can still crash the whole machine.

## Interrupts

Hardware does not wait politely. A keyboard press, a finished disk read or a timer tick raises an **interrupt**: the CPU stops what it is doing, saves its state, runs the kernel's handler for that event and then resumes. The **timer interrupt** matters most for the OS, because it is how the kernel regains control from a program that never gives up the CPU, which makes time-sharing possible.

> [!INTERVIEW] What happens on read()
> "What happens when you call \`read\`?" is a favourite. The interviewer is listening for the trap into kernel mode, the permission and descriptor check, the page cache lookup before any disk access, the copy into your buffer and the return to user mode. Saying that every read goes to the disk is the usual slip.

## Booting in one paragraph

When the machine powers on, firmware runs a self-test and loads a **bootloader** from disk. The bootloader loads the kernel into memory and jumps to it; the kernel initialises devices and memory management and starts the first user process, which then starts everything else.`,
  quiz: makeQuiz('os1', 0, [
    ["Why can a bug in a normal application not overwrite the kernel's memory?", 'User-mode code cannot execute privileged instructions or touch kernel memory; the hardware traps the attempt', ['Applications are compiled with a special safe compiler', 'The kernel reboots the machine after every program', 'Memory is read-only for every program'], 'Protection is enforced by CPU modes, not by trusting programs.'],
    ['What is a system call?', 'A controlled request from user code to the kernel, made through a trap instruction', ['A call between two functions of the same program', 'A phone call to the administrator', 'A message sent only over the network'], 'It is the doorway from user mode into kernel mode.'],
    ['Which kernel design keeps drivers and file systems in user-mode servers?', 'Microkernel', ['Monolithic kernel', 'A bootloader', 'A shell'], 'Microkernels keep only the essentials in kernel mode and pass messages to the servers.'],
    ['What lets the OS take the CPU back from a program that never yields?', 'A timer interrupt', ['The program asking politely', 'A larger cache', 'The bootloader'], 'The timer interrupt returns control to the kernel at regular intervals.'],
    ['Why do programs buffer output rather than call write for every byte?', 'Each system call costs a mode switch, so fewer, larger calls are cheaper', ['Because write can only send one kilobyte', 'Because buffering makes the data encrypted', 'Because the kernel refuses small writes'], 'Mode switches and argument checks make system calls much slower than function calls.'],
  ]),
  interview: [
    { q: 'What is the difference between kernel mode and user mode?', a: 'Kernel mode may execute every instruction and access all memory; user mode is restricted by hardware. Programs enter kernel mode only through system calls and interrupts, which is how the OS protects itself and other programs.' },
    { q: 'What happens when a program calls read() on a file?', a: 'It traps into the kernel, which checks the descriptor and permissions, fetches the data from the page cache or the disk, copies it into the program\'s buffer, and returns to user mode with the byte count.' },
    { q: 'Monolithic kernel or microkernel?', a: 'Monolithic kernels are faster because everything shares one address space but a faulty driver can crash the system; microkernels isolate services for robustness at the cost of message-passing overhead. Linux is monolithic with loadable modules.' },
  ],
}

export default lesson
