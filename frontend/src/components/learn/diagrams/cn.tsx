import { ink, Markers, muted, Svg } from './shared'

const box = { fill: 'var(--sand)', stroke: 'var(--line-strong)', strokeWidth: 1.5 } as const

export function LayerStack() {
  const layers = [
    { n: 'Application', p: 'HTTP · DNS · SSH', unit: 'message', osi: 'OSI 5–7' },
    { n: 'Transport', p: 'TCP · UDP', unit: 'segment / datagram', osi: 'OSI 4' },
    { n: 'Internet', p: 'IP · ICMP', unit: 'packet', osi: 'OSI 3' },
    { n: 'Link', p: 'Ethernet · Wi-Fi', unit: 'frame', osi: 'OSI 1–2' },
  ]
  return (
    <Svg viewBox="0 0 560 270" label="The four TCP/IP layers from top to bottom: application (HTTP, DNS; messages), transport (TCP, UDP; segments), internet (IP; packets) and link (Ethernet, Wi-Fi; frames), with the matching OSI layer numbers">
      {layers.map((l, i) => (
        <g key={l.n}>
          <rect x={20} y={15 + i * 56} width={360} height={46} rx={6} {...box} fill={i === 0 ? 'var(--cream)' : 'var(--sand)'} />
          <text x={36} y={43 + i * 56} {...ink} fontWeight={700}>{l.n}</text>
          <text x={170} y={43 + i * 56} {...ink} fontSize={12}>{l.p}</text>
          <text x={396} y={36 + i * 56} {...muted}>{l.unit}</text>
          <text x={396} y={53 + i * 56} {...muted} fontSize={11}>{l.osi}</text>
        </g>
      ))}
      <line x1={540} y1={20} x2={540} y2={230} stroke="var(--sage)" strokeWidth={2} />
      <path d="M534 222 L540 234 L546 222" fill="none" stroke="var(--sage)" strokeWidth={2} />
      <text x={540} y={258} {...muted} fontSize={11} textAnchor="end">each layer adds its header on the way down</text>
    </Svg>
  )
}

export function SubnetSplit() {
  const subnets = ['10.0.0.0/26', '10.0.0.64/26', '10.0.0.128/26', '10.0.0.192/26']
  return (
    <Svg viewBox="0 0 560 190" label="Subnetting 10.0.0.0/24 into four /26 subnets of 64 addresses each, starting at .0, .64, .128 and .192; each has 62 usable hosts after the network and broadcast addresses">
      <rect x={20} y={15} width={520} height={44} rx={6} {...box} />
      <text x={280} y={42} textAnchor="middle" {...ink} fontWeight={700}>10.0.0.0/24 · 256 addresses</text>
      {subnets.map((s, i) => (
        <g key={s}>
          <line x1={280} y1={59} x2={20 + i * 130 + 62} y2={95} stroke="var(--line-strong)" strokeWidth={1} />
          <rect x={20 + i * 130} y={95} width={124} height={70} rx={6} fill="var(--cream)" stroke="var(--sage)" strokeWidth={1.5} />
          <text x={82 + i * 130} y={120} textAnchor="middle" {...ink} fontSize={12} fontWeight={700}>{s}</text>
          <text x={82 + i * 130} y={140} textAnchor="middle" {...muted} fontSize={11}>.{i * 64}–.{i * 64 + 63}</text>
          <text x={82 + i * 130} y={156} textAnchor="middle" {...muted} fontSize={11}>62 usable hosts</text>
        </g>
      ))}
      <text x={280} y={184} textAnchor="middle" {...muted} fontSize={11}>2 borrowed bits → 4 subnets · mask 255.255.255.192</text>
    </Svg>
  )
}

/** A two-party sequence diagram with labelled arrows going left or right. */
function Sequence({ id, left, right, steps, label }: { id: string; left: string; right: string; steps: { text: string; dir: 'r' | 'l'; note?: string }[]; label: string }) {
  const h = 70 + steps.length * 52
  return (
    <Svg viewBox={`0 0 560 ${h}`} label={label}>
      <Markers id={id} />
      {[{ x: 110, t: left }, { x: 450, t: right }].map((p) => (
        <g key={p.t}>
          <rect x={p.x - 70} y={10} width={140} height={34} rx={6} {...box} />
          <text x={p.x} y={32} textAnchor="middle" {...ink} fontWeight={700}>{p.t}</text>
          <line x1={p.x} y1={44} x2={p.x} y2={h - 6} stroke="var(--line-strong)" strokeDasharray="4 4" />
        </g>
      ))}
      {steps.map((s, i) => {
        const y = 72 + i * 52
        return (
          <g key={i}>
            <line x1={s.dir === 'r' ? 112 : 448} y1={y} x2={s.dir === 'r' ? 446 : 114} y2={y + 10} stroke="var(--sage)" strokeWidth={1.6} markerEnd={`url(#${id}-open)`} />
            <text x={280} y={y - 4} textAnchor="middle" {...ink} fontSize={12}>{s.text}</text>
            {s.note && <text x={280} y={y + 28} textAnchor="middle" {...muted} fontSize={10.5}>{s.note}</text>}
          </g>
        )
      })}
    </Svg>
  )
}

export function TcpHandshake() {
  return (
    <Sequence
      id="tcp"
      left="Client"
      right="Server"
      label="TCP three-way handshake: the client sends SYN with its sequence number, the server replies SYN-ACK, the client sends ACK, and then data flows"
      steps={[
        { text: 'SYN  seq=x', dir: 'r' },
        { text: 'SYN-ACK  seq=y, ack=x+1', dir: 'l' },
        { text: 'ACK  ack=y+1', dir: 'r', note: 'connection open after one round trip' },
        { text: 'data', dir: 'r' },
      ]}
    />
  )
}

export function TlsHandshake() {
  return (
    <Sequence
      id="tls"
      left="Browser"
      right="Server"
      label="TLS 1.3 handshake: ClientHello with key share, ServerHello with key share plus certificate and signature, client Finished, then encrypted application data; one round trip"
      steps={[
        { text: 'ClientHello  ciphers + key share', dir: 'r' },
        { text: 'ServerHello + key share, certificate, Finished', dir: 'l', note: 'both derive session keys (ECDHE)' },
        { text: 'Finished', dir: 'r' },
        { text: 'encrypted HTTP request', dir: 'r' },
      ]}
    />
  )
}

export function EdgePath() {
  const nodes = [
    { x: 10, w: 90, t: 'Laptop', s: '192.168.1.20' },
    { x: 118, w: 90, t: 'Router', s: 'NAT' },
    { x: 226, w: 100, t: 'CDN edge', s: 'cached files' },
    { x: 344, w: 96, t: 'Load bal.', s: 'L7 · TLS' },
  ]
  return (
    <Svg viewBox="0 0 560 210" label="Request path: laptop with a private address, home router doing NAT, a nearby CDN edge serving cached files, a layer 7 load balancer, and three stateless application servers sharing a session store">
      <Markers id="edge" />
      {nodes.map((n, i) => (
        <g key={n.t}>
          <rect x={n.x} y={70} width={n.w} height={52} rx={6} {...box} />
          <text x={n.x + n.w / 2} y={92} textAnchor="middle" {...ink} fontSize={12} fontWeight={700}>{n.t}</text>
          <text x={n.x + n.w / 2} y={110} textAnchor="middle" {...muted} fontSize={10.5}>{n.s}</text>
          {i < nodes.length - 1 && <line x1={n.x + n.w} y1={96} x2={nodes[i + 1].x - 2} y2={96} stroke="var(--sage)" strokeWidth={1.5} markerEnd="url(#edge-open)" />}
        </g>
      ))}
      {[30, 85, 140].map((y, i) => (
        <g key={y}>
          <rect x={470} y={y - 8} width={80} height={36} rx={6} fill="var(--cream)" stroke="var(--sage)" strokeWidth={1.5} />
          <text x={510} y={y + 15} textAnchor="middle" {...ink} fontSize={11.5}>app {i + 1}</text>
          <line x1={440} y1={96} x2={468} y2={y + 10} stroke="var(--sage)" strokeWidth={1.2} markerEnd="url(#edge-open)" />
        </g>
      ))}
      <text x={510} y={198} textAnchor="middle" {...muted} fontSize={10.5}>stateless</text>
    </Svg>
  )
}
