import basics from './os/01-os-basics'
import processes from './os/02-processes'
import threads from './os/03-threads'
import scheduling from './os/04-cpu-scheduling'
import sync from './os/05-synchronization'
import deadlocks from './os/06-deadlocks'
import memory from './os/07-memory-management'
import virtual from './os/08-virtual-memory'
import files from './os/09-file-systems'
import io from './os/10-ipc-and-io'
import type { Track } from './types'

export const OS: Track = {
  id: 'os',
  title: 'Operating systems',
  short: 'OS',
  summary: 'What runs your programs: processes and threads, scheduling, synchronisation, deadlocks, memory, files and I/O.',
  projects: ['mini-shell', 'thread-pool', 'vm-simulator'],
  modules: [basics, processes, threads, scheduling, sync, deadlocks, memory, virtual, files, io],
}
