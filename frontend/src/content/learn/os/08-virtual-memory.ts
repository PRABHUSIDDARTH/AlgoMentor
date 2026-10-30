import type { Lesson } from '../types'
import { makeQuiz } from './quiz'

const lesson: Lesson = {
  id: 'virtual-memory',
  title: 'Virtual memory',
  minutes: 12,
  hook: 'A machine with 8 GB of RAM can run programs whose memory adds up to far more than that, as long as each one uses only a small part at a time. When a program does need a page that is not in RAM, it stops for a disk read that costs millions of cycles on a hard disk. Virtual memory works because of locality and fails sharply when locality runs out.',
  keyPoints: [
    'Virtual memory keeps only a process\'s working set in RAM; the rest waits on disk until a page fault brings it in.',
    'A page fault costs milliseconds, so even a tiny fault rate dominates the average memory access time.',
    'LRU approximates the optimal replacement policy, while FIFO can show Belady\'s anomaly, where more frames cause more faults.',
    'Thrashing happens when processes lack frames for their working sets and spend their time swapping pages.',
  ],
  body: `## Running programs bigger than memory

**Virtual memory** lets a process use more memory than is physically installed by keeping only part of its address space in RAM, and the rest on disk. It works because programs do not use all their memory at once: they spend long periods in a small **working set** of code and data, a property called **locality**.

Virtual memory also gives every process its own private, uniform address space, makes it possible to start programs without loading them completely, and allows processes to share pages.

> [!KEY] Locality is why it works
> Virtual memory is only usable because programs touch a small working set at a time. Without locality, nearly every access would fault and the machine would crawl at disk speed. Whenever you reason about paging, ask what the working set is.

## Demand paging

Pages are loaded only when first needed. Each page-table entry has a **valid bit** saying whether the page is in RAM. When a process touches a page that is not, the hardware raises a **page fault**:

1. The MMU traps to the kernel.
2. The kernel checks the address is legal; if not, the process is terminated (a segmentation fault).
3. It finds a free frame; if none exists, it picks a **victim** page to evict (writing it to disk first if it was modified, which a **dirty bit** records).
4. It reads the needed page from disk into the frame.
5. It updates the page table and restarts the instruction that faulted.

A page fault costs milliseconds, because it involves a disk read, whereas a memory access costs nanoseconds. Even a tiny fault rate therefore dominates performance:

\`\`\`
EAT = (1 - p) * memory_time + p * fault_time
with memory 100 ns, fault 8 ms, p = 1 in 1000: EAT = 0.999 * 100 + 0.001 * 8,000,000 = about 8,100 ns
\`\`\`

A one-in-a-thousand fault rate slows memory down by a factor of 80.

> [!GOTCHA] A page fault is not always an error
> Treating every page fault as a bug is wrong. A fault on a valid page that simply is not in RAM is normal and handled invisibly. Only an access to an illegal address ends in a segmentation fault. Mixing the two leads people to misread fault counts in profilers.

## Page replacement algorithms

When memory is full, which page should be evicted? The goal is to minimise page faults. Consider the reference string 7, 0, 1, 2, 0, 3, 0, 4 with three frames.

- **FIFO** evicts the oldest page. It is simple but can evict a heavily used page, and it suffers **Belady's anomaly**: giving it more frames can sometimes increase faults.
- **Optimal** evicts the page that will not be used for the longest time. It gives the fewest possible faults but needs the future, so it is only a benchmark.
- **LRU** (least recently used) evicts the page unused for the longest time, using the past to predict the future. It is a good approximation of optimal and does not suffer Belady's anomaly, but exact LRU needs bookkeeping on every access.
- **Clock** (second chance) approximates LRU cheaply. Frames sit in a circle, each with a **reference bit** that hardware sets on access. The hand sweeps, clearing set bits and evicting the first frame whose bit is already clear.

For the string above with three frames, FIFO gives 7 faults and LRU gives 6, and the optimal algorithm gives 6 as well. Counting faults by hand, one reference at a time while tracking the frames, is a common exam question.

> [!TRY] Belady's anomaly by hand
> Reference string 1, 2, 3, 4, 1, 2, 5, 1, 2, 3, 4, 5 with FIFO replacement. How many page faults with 3 frames, and how many with 4?
>
> ---
>
> 3 frames: 9 faults. 4 frames: 10 faults. Adding a frame made FIFO worse, which is Belady's anomaly. LRU cannot do this, because the pages it keeps with n frames are always a subset of those it keeps with n + 1.

## Thrashing

If a process has too few frames to hold its working set, it faults constantly, spending nearly all its time swapping pages and almost none computing. Worse, a low CPU use can lead the scheduler to start more processes, which take frames and make it worse. This collapse is **thrashing**.

Remedies: give each process enough frames for its **working set** (the pages used in a recent window of time), use page-fault frequency to adjust allocation, or reduce the number of running processes by suspending some.

> [!INTERVIEW] Describe the feedback loop
> When asked about thrashing, give the loop: CPU use drops because processes wait on faults, the scheduler starts more processes, each gets fewer frames, and there are still more faults. Then give the remedy: allocate frames by working set size, or suspend processes.

## Related ideas

- **Copy-on-write** shares pages between parent and child after \`fork\` and copies one only when written.
- **Memory-mapped files** map a file into the address space, so reading memory reads the file.
- **Swap space** is the disk area that holds evicted pages.
- **Out-of-memory killer**: when RAM and swap run out, Linux terminates a process to recover.`,
  quiz: makeQuiz('os8', 7, [
    ['What triggers a page fault?', 'Accessing a page that is not currently in a physical frame', ['Writing to any variable', 'Calling a function', 'A context switch'], 'The valid bit in the page table is clear, so the MMU traps to the OS.'],
    ['Which page replacement algorithm is optimal but impossible to implement exactly?', 'Evict the page not needed for the longest time in the future', ['FIFO', 'LRU', 'Clock'], 'It requires knowledge of future references, so it serves only as a benchmark.'],
    ['What is Belady\'s anomaly?', 'More frames can cause more page faults under FIFO', ['More frames always reduce faults', 'LRU faults more than FIFO', 'Pages migrate between frames'], 'FIFO is not a stack algorithm, so adding frames can make it worse.'],
    ['What is thrashing?', 'A process spending most of its time swapping pages instead of computing', ['A process repeatedly forking', 'Two threads spinning on a lock', 'The disk running out of space'], 'Too few frames for the working set cause a constant stream of faults.'],
    ['With the dirty bit clear, what does evicting a page require?', 'No write to disk, since its copy on disk is still valid', ['Writing the page back to disk', 'Restarting the process', 'Flushing the TLB only'], 'A clean page matches the copy on disk and can simply be discarded.'],
  ]),
  interview: [
    { q: 'What is virtual memory and why is it useful?', a: 'It gives each process a large private address space backed by RAM and disk. It allows programs bigger than memory, isolates processes, speeds up starting programs through demand paging, and lets pages be shared.' },
    { q: 'Walk through a page fault.', a: 'The access traps to the kernel, which validates the address, finds or frees a frame (writing a dirty victim to disk), reads the page from disk, updates the page table and restarts the instruction.' },
    { q: 'Compare FIFO, LRU and optimal replacement.', a: 'FIFO evicts the oldest page and can show Belady\'s anomaly. LRU evicts the least recently used and approximates optimal well. Optimal evicts the page used furthest in the future, giving the minimum faults but needing the future.' },
    { q: 'What is thrashing and how do you stop it?', a: 'Constant page faulting because processes lack enough frames for their working sets. Fix it by allocating frames according to working set size or by reducing the degree of multiprogramming.' },
  ],
}

export default lesson
