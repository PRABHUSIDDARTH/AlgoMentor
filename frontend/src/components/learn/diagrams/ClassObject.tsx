/** One class, two objects made from it: each object has its own field values but shares the methods. */
export function ClassObject() {
  const box = { fill: 'var(--sand)', stroke: 'var(--line-strong)', strokeWidth: 1.5 }
  const text = { fill: 'var(--ink)', fontSize: 13, fontFamily: 'var(--font-mono)' }
  return (
    <svg viewBox="0 0 560 220" role="img" aria-label="A Book class with fields title and isbn and a method borrow, and two objects made from it, each with its own title and isbn" className="h-auto w-full">
      <rect x="20" y="40" width="180" height="140" rx="8" {...box} />
      <text x="110" y="64" textAnchor="middle" {...text} fontWeight="700">class Book</text>
      <line x1="20" y1="76" x2="200" y2="76" stroke="var(--line-strong)" />
      <text x="36" y="100" {...text}>title: String</text>
      <text x="36" y="122" {...text}>isbn: String</text>
      <line x1="20" y1="136" x2="200" y2="136" stroke="var(--line-strong)" />
      <text x="36" y="160" {...text}>borrow()</text>
      {[{ y: 20, t: '"Dune"', i: '978-0441' }, { y: 120, t: '"Emma"', i: '978-0141' }].map((o, k) => (
        <g key={k}>
          <rect x="340" y={o.y} width="200" height="80" rx="8" fill="var(--cream)" stroke="var(--sage)" strokeWidth="1.5" />
          <text x="356" y={o.y + 26} {...text} fontWeight="700">book{k + 1}: Book</text>
          <text x="356" y={o.y + 48} {...text}>title = {o.t}</text>
          <text x="356" y={o.y + 68} {...text}>isbn = {o.i}</text>
          <line x1="200" y1="110" x2="338" y2={o.y + 40} stroke="var(--sage)" strokeWidth="1.5" strokeDasharray="5 4" />
        </g>
      ))}
      <text x="270" y="210" textAnchor="middle" fill="var(--ink-muted)" fontSize="12" fontFamily="var(--font-sans)">new Book(...) makes an object</text>
    </svg>
  )
}
