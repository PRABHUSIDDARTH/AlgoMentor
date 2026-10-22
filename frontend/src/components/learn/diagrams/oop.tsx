import { ClassBox, ink, Markers, muted, Svg } from './shared'

export function InheritanceTree() {
  return (
    <Svg viewBox="0 0 560 250" label="Inheritance: LibraryItem is the parent class with title and describe(); Book, EBook and DVD each extend it, and EBook overrides describe() to add the download size">
      <Markers id="inh" />
      <ClassBox x={190} y={10} w={180} title="LibraryItem" rows={['- title: String', '+ describe()']} />
      {[{ x: 2, t: 'Book', r: ['- pages: int'] }, { x: 192, t: 'EBook', r: ['- sizeMb: double', '+ describe() override'] }, { x: 382, t: 'DVD', r: ['- minutes: int'] }].map((c) => (
        <g key={c.t}>
          <ClassBox x={c.x} y={160} w={176} title={c.t} rows={c.r} />
          <path d={`M${c.x + 88} 160 L${c.x + 88} 135 L280 135 L280 102`} stroke="var(--ink)" strokeWidth={1.3} fill="none" markerEnd="url(#inh-tri)" />
        </g>
      ))}
      <text x={470} y={40} {...muted}>"is a"</text>
    </Svg>
  )
}

export function InterfaceImpl() {
  return (
    <Svg viewBox="0 0 560 240" label="Abstraction: OrderService depends only on the Notifier interface; EmailNotifier, SmsNotifier and a FakeNotifier for tests each implement it">
      <Markers id="ifc" />
      <ClassBox x={10} y={20} w={170} title="OrderService" rows={['- notifier: Notifier', '+ place(order)']} />
      <ClassBox x={250} y={20} w={190} title="Notifier" stereotype="interface" rows={['+ send(to, message)']} />
      <line x1={180} y1={55} x2={248} y2={55} stroke="var(--ink)" strokeWidth={1.3} strokeDasharray="5 4" markerEnd="url(#ifc-open)" />
      <text x={186} y={46} {...muted} fontSize={11}>uses</text>
      {[{ x: 90, t: 'EmailNotifier' }, { x: 250, t: 'SmsNotifier' }, { x: 410, t: 'FakeNotifier' }].map((c) => (
        <g key={c.t}>
          <ClassBox x={c.x} y={170} w={140} title={c.t} />
          <path d={`M${c.x + 70} 170 L${c.x + 70} 140 L345 140 L345 106`} stroke="var(--ink)" strokeWidth={1.3} fill="none" strokeDasharray="5 4" markerEnd="url(#ifc-tri)" />
        </g>
      ))}
      <text x={410} y={228} {...muted} fontSize={11}>used in tests</text>
    </Svg>
  )
}

export function Composition() {
  return (
    <Svg viewBox="0 0 560 220" label="Composition: a Notifier has a Channel and a Priority; email, SMS and push channels plug in, so 3 channels times 2 priorities need 5 small classes instead of 6 subclasses">
      <Markers id="cmp" />
      <ClassBox x={200} y={10} w={160} title="Notifier" rows={['- channel: Channel', '- priority: Priority']} />
      <ClassBox x={30} y={130} w={150} title="Channel" stereotype="interface" />
      <ClassBox x={380} y={130} w={150} title="Priority" stereotype="enum" rows={['NORMAL, URGENT']} />
      <line x1={232} y1={90} x2={110} y2={128} stroke="var(--ink)" strokeWidth={1.3} markerStart="url(#cmp-dia)" />
      <line x1={328} y1={90} x2={455} y2={128} stroke="var(--ink)" strokeWidth={1.3} markerStart="url(#cmp-dia)" />
      <text x={30} y={205} {...ink} fontSize={12}>Email · Sms · Push</text>
      <text x={200} y={120} {...muted} fontSize={11}>has a</text>
      <text x={330} y={120} {...muted} fontSize={11}>has a</text>
    </Svg>
  )
}

export function UmlNotation() {
  const rows = [
    { y: 30, label: 'Inheritance', marker: 'tri', dash: false, start: false },
    { y: 70, label: 'Realisation (implements)', marker: 'tri', dash: true, start: false },
    { y: 110, label: 'Association', marker: 'open', dash: false, start: false },
    { y: 150, label: 'Dependency (uses)', marker: 'open', dash: true, start: false },
    { y: 190, label: 'Aggregation (shared part)', marker: 'hdia', dash: false, start: true },
    { y: 230, label: 'Composition (owned part)', marker: 'dia', dash: false, start: true },
  ]
  return (
    <Svg viewBox="0 0 560 260" label="UML relationship notation: inheritance is a solid line with a hollow triangle; realisation is dashed with a hollow triangle; association is a solid line; dependency is a dashed arrow; aggregation has a hollow diamond at the whole; composition has a filled diamond at the whole">
      <Markers id="uml" />
      {rows.map((r) => (
        <g key={r.label}>
          <text x={10} y={r.y + 4} {...ink} fontSize={12.5}>{r.label}</text>
          <line
            x1={300}
            y1={r.y}
            x2={530}
            y2={r.y}
            stroke="var(--ink)"
            strokeWidth={1.3}
            strokeDasharray={r.dash ? '6 4' : undefined}
            markerEnd={r.start ? undefined : `url(#uml-${r.marker})`}
            markerStart={r.start ? `url(#uml-${r.marker})` : undefined}
          />
        </g>
      ))}
    </Svg>
  )
}
