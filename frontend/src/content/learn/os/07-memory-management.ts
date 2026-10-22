import type { Lesson } from '../types'
import { makeQuiz } from './quiz'

const lesson: Lesson = {
  id: 'memory-management',
  title: 'Memory management and paging',
  minutes: 12,
  diagram: 'paging',
  body: `## Why memory needs managing

Many processes share one physical memory. The OS must give each its own space, stop one from touching another's, and use memory efficiently as processes start and finish. Programs are written as if they owned a clean range of addresses starting at zero. These are **logical** (virtual) addresses. The hardware turns them into **physical** addresses in RAM, using a unit called the **memory management unit** (MMU) that the OS configures.

## Early approaches and their problems

With **contiguous allocation**, each process gets one unbroken block of memory. Two problems follow:

- **External fragmentation**: after many allocations and frees, free memory is split into small holes that are individually too small to use, even though their total is large enough.
- Choosing which hole to use has policies: **first fit** (the first hole big enough, fast), **best fit** (the smallest hole that fits, leaves tiny slivers) and **worst fit** (the largest hole). First fit and best fit usually beat worst fit.

Compaction (sliding everything together) fixes it but is expensive.

**Segmentation** divides a program into logical pieces such as code, heap and stack, each with a base and a limit. It matches how programmers think, but segments have varying sizes and so external fragmentation returns.

## Paging

**Paging** removes external fragmentation by cutting memory into fixed-size blocks:

- Logical memory is divided into **pages**, and physical memory into **frames** of the same size (commonly 4 KiB).
- Any page can go in any free frame, so a process's memory need not be contiguous.
- A per-process **page table** maps each page number to a frame number.

A logical address is split into a **page number** and an **offset** within the page. Translation looks up the frame for the page number and keeps the offset unchanged:

\`\`\`
page size 4096 (12 offset bits)
logical address 0x3A7C  ->  page 3, offset 0xA7C
page table: page 3 -> frame 9
physical address = 9 * 4096 + 0xA7C = 0x9A7C
\`\`\`

For a page size of 2^k bytes, the low k bits of an address are the offset and the remaining high bits are the page number.

Paging has **internal fragmentation**: the last page of a process is usually only partly used, so on average about half a page is wasted per process. Smaller pages waste less, but make page tables larger.

## Protection and sharing

Each page-table entry carries **valid**, **read/write/execute** and **user/kernel** bits. A reference to an invalid page, or a write to a read-only page, traps to the OS. Processes can share memory (for example a library's code) by mapping the same frames into several page tables.

## The cost of translation: the TLB

A page table lives in memory, so a naive translation would need an extra memory access for every access the program makes. To avoid that, the MMU keeps a small, fast cache of recent translations called the **translation lookaside buffer** (TLB). On a TLB **hit** the translation is immediate; on a **miss** the page table is walked and the result cached. Programs with good locality hit the TLB nearly every time.

The **effective access time** is the weighted average:

\`\`\`
EAT = hit_rate * (tlb + mem) + (1 - hit_rate) * (tlb + 2 * mem)
\`\`\`

With a 1 ns TLB, 100 ns memory and a 95% hit rate, EAT is 0.95 × 101 + 0.05 × 201 = 106 ns, so the TLB makes paging only slightly slower than raw memory access.

## Big address spaces

A 64-bit address space would need an enormous flat page table, so real systems use **multi-level page tables**, which only allocate the parts that are used, or **inverted page tables**, which have one entry per physical frame.`,
  quiz: makeQuiz('os7', 6, [
    ['What problem does paging eliminate that contiguous allocation has?', 'External fragmentation', ['Internal fragmentation', 'Address translation', 'Protection'], 'Fixed-size frames mean any free frame fits any page.'],
    ['With 4 KiB pages, how many bits of an address are the offset?', '12', ['4', '10', '16'], '4096 = 2^12, so the low 12 bits select the byte within a page.'],
    ['Page 3 maps to frame 9 and the page size is 4096. The logical address 3 * 4096 + 100 translates to', '9 * 4096 + 100', ['3 * 4096 + 9', '9 + 100', '3 * 9 * 4096'], 'The frame replaces the page number and the offset stays the same.'],
    ['What is the TLB?', 'A small fast cache of recent page-to-frame translations', ['A table of free disk blocks', 'A list of running processes', 'A buffer for network packets'], 'It avoids reading the page table from memory on every access.'],
    ['What kind of waste does paging still have?', 'Internal fragmentation in the last page of a process', ['External fragmentation between processes', 'Wasted disk blocks', 'Unused CPU cycles'], 'A process rarely fills its last page exactly.'],
  ]),
  interview: [
    { q: 'Explain paging and how an address is translated.', a: 'Memory is split into fixed-size pages and frames. The logical address is divided into a page number and an offset; the page table gives the frame for the page number, and the physical address is frame times page size plus offset.' },
    { q: 'Internal versus external fragmentation?', a: 'Internal fragmentation is unused space inside an allocated block, such as the end of a page. External fragmentation is free memory split into holes too small to use. Paging has only the former; contiguous allocation and segmentation suffer the latter.' },
    { q: 'Why do we need a TLB?', a: 'Without it every memory access needs a second access to read the page table. The TLB caches recent translations so most accesses are translated in about one cycle.' },
    { q: 'Segmentation versus paging?', a: 'Segments are variable-size logical units that match program structure but cause external fragmentation; pages are fixed-size physical units that avoid it but are invisible to the programmer.' },
  ],
}

export default lesson
