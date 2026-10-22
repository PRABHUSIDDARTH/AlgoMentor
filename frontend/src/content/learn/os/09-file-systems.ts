import type { Lesson } from '../types'
import { makeQuiz } from './quiz'

const lesson: Lesson = {
  id: 'file-systems',
  title: 'File systems',
  minutes: 11,
  diagram: 'inode-layout',
  body: `## What a file system provides

A disk is just a huge array of numbered blocks. The **file system** turns it into named **files** organised in **directories**, hides where the blocks are, and enforces who may read and write what. It must stay consistent even if the power fails halfway through an update.

A file has **data** (a sequence of bytes) and **metadata**: its size, owner, permissions and timestamps.

## Operations and descriptors

Programs use a small set of calls: \`open\`, \`read\`, \`write\`, \`seek\`, \`close\`, \`unlink\` (delete). \`open\` returns a **file descriptor**, a small integer indexing the process's table of open files. The kernel keeps the current **offset** for each open file so successive reads continue where the last stopped.

Since reading a disk is slow, the kernel keeps recently used blocks in memory, the **page cache** (or buffer cache). Reads often hit it and writes are batched, which is also why abruptly removing a USB drive can lose data that was written but not yet flushed.

## Directories and paths

A directory is a file that maps names to files. Directories nest to form a tree, and a **path** such as \`/home/ana/notes.txt\` walks it from the root. **Hard links** give one file several names; **symbolic links** are small files that hold another path and can dangle if the target is removed.

## Allocating blocks to a file

How does the file system remember which blocks a file occupies?

- **Contiguous allocation** keeps a file in consecutive blocks. Reads are fast, but files cannot grow easily and external fragmentation appears.
- **Linked allocation** chains blocks together, each holding a pointer to the next. It has no external fragmentation but random access is slow, since you must follow the chain. FAT keeps these links in a table.
- **Indexed allocation** stores a file's block numbers in an index block. It supports random access and growth.

Unix file systems use a refined indexed scheme built on the **inode**.

## Inodes

An **inode** is a fixed-size record, one per file, holding all of the file's metadata (owner, permissions, size, timestamps, link count) and the locations of its data blocks. It does **not** store the file's name. The name lives in a directory entry that maps the name to an inode number.

An inode holds a number of **direct pointers** to data blocks, which are enough for small files, then a **single indirect** pointer to a block full of pointers, then **double** and **triple indirect** pointers for very large files. With 4 KiB blocks and 4-byte block numbers, one indirect block holds 1024 pointers, so single indirection adds 4 MiB.

Because names and inodes are separate, a **hard link** is just another directory entry for the same inode, and a file is deleted only when its link count drops to zero and nobody has it open.

## Consistency and journaling

Creating a file touches several structures: the inode, the directory entry, the free-block map. A crash between those writes leaves the file system inconsistent. Old systems repaired this with a slow scan (\`fsck\`) after a crash. A **journaling** file system (ext4, NTFS) first writes a description of the planned change to a **journal**, then makes the change. After a crash it replays or discards the journal, so recovery takes seconds instead of a full scan.

## Disks

On a hard disk, the time to read a block is the **seek time** (moving the head), plus **rotational latency**, plus transfer time. Seeking dominates, so file systems try to keep related blocks close together. SSDs have no moving parts, so random reads are fast, but they wear out with writes and erase in large blocks, which is why they need smarter controllers.`,
  quiz: makeQuiz('os9', 8, [
    ['Where does a Unix file system store a file\'s name?', 'In a directory entry that maps the name to an inode number', ['In the inode', 'In the first data block', 'In the superblock'], 'The inode holds metadata and block locations; names live in directories.'],
    ['What is the advantage of indexed allocation over linked allocation?', 'Fast random access to any block', ['No need to store pointers', 'Files can never be fragmented', 'It needs no metadata'], 'The index gives the block number directly, while a linked chain must be followed block by block.'],
    ['With 4 KiB blocks and 4-byte block pointers, how much data can a single indirect block address?', '4 MiB', ['4 KiB', '1 MiB', '4 GiB'], '4096 / 4 = 1024 pointers, each addressing a 4 KiB block.'],
    ['What does journaling protect against?', 'An inconsistent file system after a crash in the middle of an update', ['Disk head wear', 'Users deleting files by mistake', 'Slow seek times'], 'The intended change is logged first, so recovery can replay or discard it.'],
    ['When is a file\'s data actually freed on a Unix system?', 'When its link count reaches zero and no process has it open', ['As soon as one name is removed', 'When the directory is renamed', 'At the next reboot only'], 'Hard links share an inode, and the file lives until the last reference goes away.'],
  ]),
  interview: [
    { q: 'What is an inode?', a: 'A per-file record holding metadata (owner, permissions, size, timestamps, link count) and the pointers to its data blocks. It does not hold the name, which lives in the directory entry.' },
    { q: 'Hard link versus symbolic link?', a: 'A hard link is another name for the same inode, so it survives deletion of the original name and cannot cross file systems. A symbolic link is a small file containing a path and breaks if the target moves.' },
    { q: 'What is journaling?', a: 'Writing planned changes to a log before applying them, so after a crash the system can finish or discard them and avoid a full consistency scan.' },
    { q: 'Compare contiguous, linked and indexed allocation.', a: 'Contiguous is fastest but fragments and cannot grow. Linked has no external fragmentation but poor random access. Indexed gives random access and flexible growth at the cost of index storage.' },
  ],
}

export default lesson
