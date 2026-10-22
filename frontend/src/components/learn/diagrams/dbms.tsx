import { ink, Markers, muted, Svg } from './shared'

const box = { fill: 'var(--sand)', stroke: 'var(--line-strong)', strokeWidth: 1.5 } as const

function Table({ x, y, w, title, cols }: { x: number; y: number; w: number; title: string; cols: string[] }) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={30 + cols.length * 20 + 6} rx={6} {...box} />
      <text x={x + w / 2} y={y + 20} textAnchor="middle" {...ink} fontWeight={700}>{title}</text>
      <line x1={x} y1={y + 30} x2={x + w} y2={y + 30} stroke="var(--line-strong)" />
      {cols.map((c, i) => <text key={c} x={x + 10} y={y + 50 + i * 20} {...ink} fontSize={12}>{c}</text>)}
    </g>
  )
}

export function ErLibrary() {
  return (
    <Svg viewBox="0 0 560 250" label="ER diagram in crow's foot notation: one Member has many Loans, one Book has many Copies, and each Copy appears in many Loans; Loan is the junction between members and copies and carries borrowed_at and due_at">
      <Markers id="er" />
      <Table x={10} y={20} w={140} title="Member" cols={['PK member_id', 'name', 'email']} />
      <Table x={210} y={20} w={150} title="Loan" cols={['PK loan_id', 'FK member_id', 'FK copy_id', 'borrowed_at', 'due_at']} />
      <Table x={420} y={20} w={130} title="Copy" cols={['PK copy_id', 'FK book_id']} />
      <Table x={420} y={140} w={130} title="Book" cols={['PK book_id', 'isbn', 'title']} />
      {[[150, 210, 'one', 'many'], [420, 360, 'one', 'many']].map(([a, b], i) => (
        <line key={i} x1={a as number} y1={70} x2={b as number} y2={70} stroke="var(--ink)" strokeWidth={1.3} />
      ))}
      <line x1={485} y1={96} x2={485} y2={140} stroke="var(--ink)" strokeWidth={1.3} />
      <text x={154} y={62} {...ink} fontSize={11}>1</text>
      <text x={196} y={62} {...ink} fontSize={11}>*</text>
      <text x={400} y={62} {...ink} fontSize={11}>1</text>
      <text x={364} y={62} {...ink} fontSize={11}>*</text>
      <text x={491} y={112} {...ink} fontSize={11}>*</text>
      <text x={491} y={134} {...ink} fontSize={11}>1</text>
      <text x={20} y={230} {...muted} fontSize={11}>1 = one · * = many · PK = primary key · FK = foreign key</text>
    </Svg>
  )
}

export function JoinKinds() {
  const kinds = [
    { t: 'INNER', l: false, r: false, c: true },
    { t: 'LEFT', l: true, r: false, c: true },
    { t: 'RIGHT', l: false, r: true, c: true },
    { t: 'FULL OUTER', l: true, r: true, c: true },
  ]
  return (
    <Svg viewBox="0 0 560 190" label="Four Venn diagrams of two overlapping sets, left table A and right table B: inner join keeps only the overlap; left join keeps all of A; right join keeps all of B; full outer join keeps everything">
      {kinds.map((k, i) => {
        const cx = 70 + i * 140
        return (
          <g key={k.t}>
            <defs>
              <clipPath id={`jl-${i}`}><circle cx={cx - 22} cy={80} r={42} /></clipPath>
              <clipPath id={`jr-${i}`}><circle cx={cx + 22} cy={80} r={42} /></clipPath>
            </defs>
            <circle cx={cx - 22} cy={80} r={42} fill={k.l ? 'var(--sage)' : 'none'} fillOpacity={0.35} />
            <circle cx={cx + 22} cy={80} r={42} fill={k.r ? 'var(--sage)' : 'none'} fillOpacity={0.35} />
            <circle cx={cx + 22} cy={80} r={42} fill="var(--sage)" fillOpacity={0.6} clipPath={`url(#jl-${i})`} />
            <circle cx={cx - 22} cy={80} r={42} fill="none" stroke="var(--ink)" strokeWidth={1.3} />
            <circle cx={cx + 22} cy={80} r={42} fill="none" stroke="var(--ink)" strokeWidth={1.3} />
            <text x={cx - 40} y={84} textAnchor="middle" {...ink} fontSize={12}>A</text>
            <text x={cx + 40} y={84} textAnchor="middle" {...ink} fontSize={12}>B</text>
            <text x={cx} y={152} textAnchor="middle" {...ink} fontSize={12} fontWeight={700}>{k.t}</text>
          </g>
        )
      })}
      <text x={280} y={180} textAnchor="middle" {...muted} fontSize={11}>shaded = rows kept · unmatched rows get NULLs on the missing side</text>
    </Svg>
  )
}

export function NormaliseSplit() {
  return (
    <Svg viewBox="0 0 560 262" label="Normalisation: one wide loans table that repeats member name and email and book title on every row is split into three tables, member, book and loan, linked by foreign keys, so each fact is stored once">
      <Markers id="nrm" />
      <Table x={10} y={30} w={170} title="loan_wide" cols={['loan_id', 'member_name', 'member_email', 'book_title', 'borrowed_at']} />
      <line x1={190} y1={95} x2={248} y2={95} stroke="var(--sage)" strokeWidth={2} markerEnd="url(#nrm-open)" />
      <text x={219} y={85} textAnchor="middle" {...muted} fontSize={11}>split</text>
      <Table x={260} y={10} w={130} title="member" cols={['PK member_id', 'name', 'email']} />
      <Table x={260} y={130} w={130} title="book" cols={['PK book_id', 'title']} />
      <Table x={410} y={50} w={140} title="loan" cols={['PK loan_id', 'FK member_id', 'FK book_id', 'borrowed_at']} />
      <line x1={390} y1={55} x2={410} y2={85} stroke="var(--ink)" strokeWidth={1.2} />
      <line x1={390} y1={160} x2={410} y2={120} stroke="var(--ink)" strokeWidth={1.2} />
      <text x={10} y={252} {...muted} fontSize={11}>An email change now touches one row, not every loan.</text>
    </Svg>
  )
}

export function BPlusTree() {
  const leaf = (x: number, keys: string) => (
    <g key={x}>
      <rect x={x} y={150} width={110} height={34} rx={5} fill="var(--cream)" stroke="var(--sage)" strokeWidth={1.5} />
      <text x={x + 55} y={172} textAnchor="middle" {...ink} fontSize={12}>{keys}</text>
    </g>
  )
  const leaves = [[10, '2 · 5 · 7'], [140, '11 · 13 · 17'], [270, '19 · 23 · 29'], [400, '31 · 37 · 41']] as const
  return (
    <Svg viewBox="0 0 560 215" label="A B+ tree: a root node with separator keys 19 and 31 and three children leading to linked leaf nodes holding the sorted keys; leaves are chained left to right so a range scan follows the links">
      <Markers id="bpt" />
      <rect x={205} y={14} width={150} height={34} rx={5} {...box} />
      <text x={280} y={36} textAnchor="middle" {...ink}>19 · 31</text>
      <rect x={30} y={82} width={120} height={34} rx={5} {...box} />
      <text x={90} y={104} textAnchor="middle" {...ink} fontSize={12}>11 · 17</text>
      <rect x={220} y={82} width={120} height={34} rx={5} {...box} />
      <text x={280} y={104} textAnchor="middle" {...ink} fontSize={12}>23 · 29</text>
      <rect x={410} y={82} width={120} height={34} rx={5} {...box} />
      <text x={470} y={104} textAnchor="middle" {...ink} fontSize={12}>37</text>
      {[90, 280, 470].map((x) => <line key={x} x1={280} y1={48} x2={x} y2={82} stroke="var(--ink)" strokeWidth={1.2} />)}
      {leaves.map(([x, k]) => leaf(x, k))}
      {[65, 195].map((x) => <line key={x} x1={90} y1={116} x2={x} y2={150} stroke="var(--ink)" strokeWidth={1} />)}
      <line x1={280} y1={116} x2={325} y2={150} stroke="var(--ink)" strokeWidth={1} />
      <line x1={470} y1={116} x2={455} y2={150} stroke="var(--ink)" strokeWidth={1} />
      {[120, 250, 380].map((x) => <line key={x} x1={x} y1={167} x2={x + 20} y2={167} stroke="var(--sage)" strokeWidth={2} markerEnd="url(#bpt-open)" />)}
      <text x={280} y={206} textAnchor="middle" {...muted} fontSize={11}>values live in the leaves · linked leaves make range scans a walk</text>
    </Svg>
  )
}

export function CapTriangle() {
  return (
    <Svg viewBox="0 0 560 230" label="The CAP triangle with Consistency, Availability and Partition tolerance at its corners; because partitions happen, a system chooses between CP, which refuses some requests, and AP, which may return stale data">
      <polygon points="280,24 90,190 470,190" fill="var(--sand)" stroke="var(--line-strong)" strokeWidth={1.5} />
      <text x={280} y={16} textAnchor="middle" {...ink} fontWeight={700}>Consistency</text>
      <text x={60} y={212} textAnchor="middle" {...ink} fontWeight={700}>Availability</text>
      <text x={550} y={212} textAnchor="end" {...ink} fontWeight={700}>Partition tolerance</text>
      <line x1={280} y1={24} x2={470} y2={190} stroke="var(--sage)" strokeWidth={3} />
      <line x1={90} y1={190} x2={470} y2={190} stroke="var(--sage)" strokeWidth={3} />
      <text x={398} y={96} {...ink} fontSize={13} fontWeight={700}>CP</text>
      <text x={398} y={112} {...muted} fontSize={11}>refuse some requests</text>
      <text x={270} y={178} {...ink} fontSize={13} fontWeight={700}>AP</text>
      <text x={190} y={160} {...muted} fontSize={11}>may serve stale data</text>
      <text x={280} y={110} textAnchor="middle" {...muted} fontSize={11}>partitions happen,</text>
      <text x={280} y={126} textAnchor="middle" {...muted} fontSize={11}>so P is not optional</text>
    </Svg>
  )
}
