import type { Lesson } from '../types'
import { makeQuiz } from './quiz'

const lesson: Lesson = {
  id: 'cpu-scheduling',
  title: 'CPU scheduling',
  minutes: 12,
  diagram: 'gantt-schedule',
  body: `## Choosing who runs next

There are usually far more ready processes than CPU cores. The **scheduler** decides which one runs, and for how long. A good policy keeps the CPU busy and makes the machine feel responsive.

Two kinds of scheduler behaviour exist:

- **Non-preemptive**: once a process gets the CPU it keeps it until it finishes or blocks.
- **Preemptive**: the OS can take the CPU away, for example when a time slice ends or a more urgent process arrives.

## Metrics

For each process we measure, in the same time unit:

- **Arrival time**: when it became ready.
- **Burst time**: CPU time it needs.
- **Completion time**: when it finished.
- **Turnaround time** = completion − arrival.
- **Waiting time** = turnaround − burst, the time spent ready but not running.
- **Response time**: first time on the CPU − arrival.

Schedulers also care about **throughput** (jobs finished per second) and **CPU utilisation**.

## The classic algorithms

**First-Come, First-Served (FCFS)** runs processes in arrival order. It is simple and fair in a narrow sense, but suffers the **convoy effect**: one long job at the front makes every short job behind it wait.

**Shortest Job First (SJF)** runs the process with the smallest burst next. It gives the minimum average waiting time of all non-preemptive algorithms, but it needs to know burst times in advance (they are only predicted in practice) and it can **starve** long jobs if short ones keep arriving. The preemptive version is **Shortest Remaining Time First**.

**Round Robin (RR)** gives each ready process a fixed **time quantum**, then moves it to the back of the queue. It is preemptive and good for interactive systems, since everyone gets a turn quickly. The quantum matters: too large and RR degrades into FCFS; too small and context-switch overhead dominates.

**Priority scheduling** runs the highest-priority process first. Low-priority processes can starve, which is fixed by **aging**: gradually raising the priority of a process the longer it waits.

**Multilevel feedback queue (MLFQ)** is what real systems approximate. There are several queues of different priority. New processes start in the top queue with a short quantum; a process that uses its whole quantum is demoted, while one that blocks for I/O stays high. This favours interactive jobs without knowing burst times in advance, and aging prevents starvation.

## A worked example

Three processes arrive at time 0 with bursts P1 = 6, P2 = 2, P3 = 4.

- **FCFS** order P1, P2, P3: completion times 6, 8, 12. Waiting times 0, 6, 8, average **4.67**.
- **SJF** order P2, P3, P1: completion times 2, 6, 12. Waiting times P1 = 6, P2 = 0, P3 = 2, average **2.67**.
- **RR with quantum 2**: the timeline is P1(0–2), P2(2–4), P3(4–6), P1(6–8), P3(8–10), P1(10–12). Completion: P2 at 4, P3 at 10, P1 at 12. Waiting times are P1 = 6, P2 = 2, P3 = 6, average **4.67**.

Drawing the Gantt chart first, then reading the completion times off it, is the reliable way to answer these questions in an exam.

## Which one to pick?

There is no best algorithm; it is a trade-off. Batch systems favour throughput and low average turnaround (SJF-like). Interactive systems favour low response time (RR, MLFQ). Real-time systems must meet deadlines, using policies such as earliest-deadline-first. Linux's default scheduler aims for fairness by tracking how much CPU time each task has received and always running the one that has had the least.`,
  quiz: makeQuiz('os4', 3, [
    ['Which non-preemptive algorithm gives the minimum average waiting time?', 'Shortest Job First', ['First-Come, First-Served', 'Round Robin', 'Priority without aging'], 'Running short jobs first reduces the total time other jobs spend waiting.'],
    ['What is the convoy effect?', 'Short jobs queue behind one long job under FCFS', ['A process starving forever', 'Two processes deadlocking', 'Too many context switches'], 'One long CPU-bound job at the front delays everything behind it.'],
    ['Three jobs arrive at time 0 with bursts 6, 2 and 4 and run FCFS in that order. What is the average waiting time?', '4.67', ['2.67', '6', '8.67'], 'Waits are 0, 6 and 8, which sum to 14; 14 / 3 = 4.67.'],
    ['What happens to Round Robin as the time quantum grows very large?', 'It behaves like FCFS', ['It behaves like SJF', 'It becomes priority scheduling', 'It stops being fair'], 'No process is preempted before it finishes, so the order is arrival order.'],
    ['How does aging prevent starvation?', 'It raises a waiting process\'s priority over time', ['It lowers the priority of short jobs', 'It makes the quantum shorter', 'It kills long jobs'], 'Eventually a waiting process is the highest priority and gets the CPU.'],
  ]),
  interview: [
    { q: 'Compare FCFS, SJF and Round Robin.', a: 'FCFS is simple but suffers the convoy effect. SJF minimises average waiting time but needs burst estimates and can starve long jobs. Round Robin gives good response time through preemption, with a quantum that must balance fairness against context-switch cost.' },
    { q: 'What is starvation and how is it solved?', a: 'A process is starved when it is ready but never gets the CPU, as can happen under SJF or priority scheduling. Aging, which increases priority with waiting time, ensures it eventually runs.' },
    { q: 'How does a multilevel feedback queue work without knowing burst times?', a: 'It learns from behaviour: a process that uses its full quantum is treated as CPU-bound and demoted; one that blocks early stays at high priority. Interactive jobs therefore get fast service automatically.' },
    { q: 'Define turnaround, waiting and response time.', a: 'Turnaround is completion minus arrival; waiting is turnaround minus burst; response is the time from arrival to first running.' },
  ],
}

export default lesson
