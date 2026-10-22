import { ink, Markers, muted, Svg } from './shared'

const box = { fill: 'var(--sand)', stroke: 'var(--line-strong)', strokeWidth: 1.5 } as const
const arrow = (id: string) => ({ stroke: 'var(--ink)', strokeWidth: 1.4, fill: 'none', markerEnd: `url(#${id}-open)` }) as const

export function ProcessStates() {
  const id = 'ps'
  const state = (x: number, y: number, w: number, t: string, hot = false) => (
    <g key={t}>
      <rect x={x} y={y} width={w} height={40} rx={6} {...box} fill={hot ? 'var(--cream)' : 'var(--sand)'} stroke={hot ? 'var(--sage)' : 'var(--line-strong)'} />
      <text x={x + w / 2} y={y + 25} textAnchor="middle" {...ink} fontWeight={700}>{t}</text>
    </g>
  )
  return (
    <Svg viewBox="0 0 560 230" label="Process states: New moves to Ready on admit; Ready moves to Running on dispatch; Running returns to Ready on timeout, moves to Waiting on an I/O request, and to Terminated on exit; Waiting moves back to Ready when the I/O completes">
      <Markers id={id} />
      {state(10, 60, 80, 'New')}
      {state(150, 60, 90, 'Ready')}
      {state(320, 60, 100, 'Running', true)}
      {state(450, 60, 100, 'Terminated')}
      {state(235, 160, 100, 'Waiting')}
      <line x1={90} y1={80} x2={149} y2={80} {...arrow(id)} />
      <text x={120} y={72} textAnchor="middle" {...muted} fontSize={11}>admit</text>
      <line x1={240} y1={72} x2={319} y2={72} {...arrow(id)} />
      <text x={280} y={64} textAnchor="middle" {...muted} fontSize={11}>dispatch</text>
      <line x1={320} y1={90} x2={241} y2={90} {...arrow(id)} />
      <text x={280} y={106} textAnchor="middle" {...muted} fontSize={11}>timeout</text>
      <line x1={420} y1={80} x2={449} y2={80} {...arrow(id)} />
      <text x={436} y={72} textAnchor="middle" {...muted} fontSize={11}>exit</text>
      <line x1={365} y1={100} x2={320} y2={159} {...arrow(id)} />
      <text x={372} y={140} {...muted} fontSize={11}>I/O request</text>
      <line x1={255} y1={160} x2={215} y2={101} {...arrow(id)} />
      <text x={150} y={140} {...muted} fontSize={11}>I/O done</text>
      <text x={280} y={218} textAnchor="middle" {...muted} fontSize={11}>only the scheduler moves a process from Ready to Running</text>
    </Svg>
  )
}

export function GanttSchedule() {
  const x0 = 40
  const unit = 40
  const slices = [
    { p: 'P1', from: 0, to: 2 },
    { p: 'P2', from: 2, to: 4 },
    { p: 'P3', from: 4, to: 6 },
    { p: 'P1', from: 6, to: 8 },
    { p: 'P3', from: 8, to: 10 },
    { p: 'P1', from: 10, to: 12 },
  ]
  const fill: Record<string, string> = { P1: 'var(--sage)', P2: 'var(--cream)', P3: 'var(--sand)' }
  return (
    <Svg viewBox="0 0 560 150" label="Gantt chart for Round Robin with a quantum of 2 and bursts P1 = 6, P2 = 2, P3 = 4: P1 runs 0 to 2, P2 2 to 4, P3 4 to 6, P1 6 to 8, P3 8 to 10 and P1 10 to 12; P2 finishes at 4, P3 at 10 and P1 at 12">
      <text x={x0} y={22} {...muted}>Round Robin, quantum 2 · bursts P1 = 6, P2 = 2, P3 = 4</text>
      {slices.map((s) => (
        <g key={`${s.p}${s.from}`}>
          <rect x={x0 + s.from * unit} y={40} width={(s.to - s.from) * unit} height={44} {...box} fill={fill[s.p]} stroke="var(--ink)" strokeWidth={1.2} />
          <text x={x0 + ((s.from + s.to) / 2) * unit} y={67} textAnchor="middle" {...ink} fontWeight={700}>{s.p}</text>
        </g>
      ))}
      {[0, 2, 4, 6, 8, 10, 12].map((t) => (
        <g key={t}>
          <line x1={x0 + t * unit} y1={84} x2={x0 + t * unit} y2={92} stroke="var(--ink)" />
          <text x={x0 + t * unit} y={108} textAnchor="middle" {...muted}>{t}</text>
        </g>
      ))}
      <text x={x0} y={136} {...muted} fontSize={11}>completion: P2 = 4, P3 = 10, P1 = 12 · average waiting time 4.67</text>
    </Svg>
  )
}

export function DeadlockCycle() {
  const id = 'dl'
  const solid = arrow(id)
  const dashed = { ...arrow(id), strokeDasharray: '5 4' } as const
  return (
    <Svg viewBox="0 0 560 210" label="A resource allocation graph with a cycle: resource R1 is held by process P1, P1 requests R2, R2 is held by process P2, and P2 requests R1, so neither process can ever continue">
      <Markers id={id} />
      <rect x={260} y={12} width={40} height={40} rx={4} {...box} />
      <text x={280} y={38} textAnchor="middle" {...ink} fontWeight={700}>R1</text>
      <rect x={260} y={158} width={40} height={40} rx={4} {...box} />
      <text x={280} y={184} textAnchor="middle" {...ink} fontWeight={700}>R2</text>
      {[{ x: 90, t: 'P1' }, { x: 470, t: 'P2' }].map((p) => (
        <g key={p.t}>
          <circle cx={p.x} cy={105} r={26} fill="var(--cream)" stroke="var(--sage)" strokeWidth={2} />
          <text x={p.x} y={110} textAnchor="middle" {...ink} fontWeight={700}>{p.t}</text>
        </g>
      ))}
      <path d="M260 34 L112 92" {...solid} />
      <text x={160} y={52} {...muted} fontSize={11}>R1 held by P1</text>
      <path d="M112 118 L260 176" {...dashed} />
      <text x={110} y={172} {...muted} fontSize={11}>P1 requests R2</text>
      <path d="M300 176 L448 118" {...solid} />
      <text x={372} y={186} {...muted} fontSize={11}>R2 held by P2</text>
      <path d="M448 92 L300 34" {...dashed} />
      <text x={352} y={52} {...muted} fontSize={11}>P2 requests R1</text>
      <text x={280} y={108} textAnchor="middle" {...muted} fontSize={11}>solid: holds · dashed: waits for</text>
    </Svg>
  )
}

export function Paging() {
  const id = 'pg'
  const map = [4, 1, 6, 3]
  const rowY = (i: number) => 52 + i * 40
  const frameY = (f: number) => 30 + f * 26
  return (
    <Svg viewBox="0 0 560 260" label="Paging: logical pages 0 to 3 are looked up in a page table that maps page 0 to frame 4, page 1 to frame 1, page 2 to frame 6 and page 3 to frame 3 of eight physical frames, so the pages need not be contiguous in memory">
      <Markers id={id} />
      <text x={20} y={20} {...muted}>Logical memory</text>
      <text x={200} y={20} {...muted}>Page table</text>
      <text x={400} y={20} {...muted}>Physical memory</text>
      {map.map((f, i) => (
        <g key={i}>
          <rect x={20} y={rowY(i)} width={90} height={36} rx={4} {...box} fill="var(--cream)" stroke="var(--sage)" />
          <text x={65} y={rowY(i) + 23} textAnchor="middle" {...ink}>page {i}</text>
          <line x1={110} y1={rowY(i) + 18} x2={199} y2={rowY(i) + 18} {...arrow(id)} />
          <rect x={200} y={rowY(i)} width={120} height={36} {...box} />
          <text x={260} y={rowY(i) + 23} textAnchor="middle" {...ink}>{i} → frame {f}</text>
          <path d={`M320 ${rowY(i) + 18} L${400} ${frameY(f) + 13}`} {...arrow(id)} />
        </g>
      ))}
      {Array.from({ length: 8 }, (_, f) => (
        <g key={f}>
          <rect x={400} y={frameY(f)} width={140} height={26} {...box} fill={map.includes(f) ? 'var(--cream)' : 'var(--sand)'} stroke={map.includes(f) ? 'var(--sage)' : 'var(--line-strong)'} />
          <text x={410} y={frameY(f) + 17} {...ink} fontSize={12}>frame {f}</text>
          {map.includes(f) && <text x={530} y={frameY(f) + 17} textAnchor="end" {...muted} fontSize={11}>page {map.indexOf(f)}</text>}
        </g>
      ))}
    </Svg>
  )
}

export function InodeLayout() {
  const id = 'in'
  return (
    <Svg viewBox="0 0 560 250" label="An inode holds metadata (mode and owner, size, timestamps, link count) and block pointers: direct pointers lead straight to data blocks, and a single indirect pointer leads to a block of further pointers that lead to more data blocks; the file name is not in the inode">
      <Markers id={id} />
      <rect x={20} y={14} width={170} height={222} rx={6} {...box} />
      <text x={105} y={36} textAnchor="middle" {...ink} fontWeight={700}>inode 1042</text>
      {['mode, owner', 'size', 'timestamps', 'link count'].map((t, i) => (
        <text key={t} x={32} y={62 + i * 20} {...ink} fontSize={12}>{t}</text>
      ))}
      <line x1={20} y1={146} x2={190} y2={146} stroke="var(--line-strong)" />
      {['direct 0', 'direct 1', 'direct 2'].map((t, i) => (
        <g key={t}>
          <text x={32} y={166 + i * 20} {...ink} fontSize={12}>{t}</text>
          <line x1={110} y1={162 + i * 20} x2={279} y2={40 + i * 36} {...arrow(id)} />
          <rect x={280} y={24 + i * 36} width={90} height={30} rx={4} {...box} fill="var(--cream)" stroke="var(--sage)" />
          <text x={325} y={44 + i * 36} textAnchor="middle" {...ink} fontSize={12}>data block</text>
        </g>
      ))}
      <text x={32} y={226} {...ink} fontSize={12}>single indirect</text>
      <line x1={130} y1={222} x2={279} y2={196} {...arrow(id)} />
      <rect x={280} y={170} width={100} height={52} rx={4} {...box} />
      <text x={330} y={192} textAnchor="middle" {...ink} fontSize={12}>pointer block</text>
      <text x={330} y={209} textAnchor="middle" {...muted} fontSize={11}>1024 pointers</text>
      {[0, 1].map((i) => (
        <g key={i}>
          <line x1={380} y1={186 + i * 18} x2={439} y2={186 + i * 18} {...arrow(id)} />
          <rect x={440} y={172 + i * 34} width={90} height={28} rx={4} {...box} fill="var(--cream)" stroke="var(--sage)" />
          <text x={485} y={190 + i * 34} textAnchor="middle" {...ink} fontSize={12}>data block</text>
        </g>
      ))}
      <text x={400} y={86} {...muted} fontSize={11}>the name lives in a</text>
      <text x={400} y={102} {...muted} fontSize={11}>directory entry, not</text>
      <text x={400} y={118} {...muted} fontSize={11}>in the inode</text>
    </Svg>
  )
}
