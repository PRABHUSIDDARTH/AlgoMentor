import type { Lesson } from '../types'

const lesson: Lesson = {
  id: 'routing',
  title: 'Routing basics',
  minutes: 9,
  hook: 'A packet for 10.1.2.9 matches three different entries in a router\'s table, and the router sends it down exactly one of them. Which one wins is the rule that keeps internet routing tables workable, and it is the answer to the most common routing interview question.',
  keyPoints: [
    'Each router forwards by destination IP using its routing table, one hop at a time; none knows the whole path.',
    'Longest prefix match: the most specific matching route wins, and 0.0.0.0/0 is the default route of last resort.',
    'TTL drops by one per hop; at zero the packet is dropped and ICMP time exceeded comes back, which traceroute uses.',
    'OSPF (link-state, Dijkstra) runs inside a network; BGP (path-vector) exchanges routes between autonomous systems.',
  ],
  body: `## Getting a packet across many networks

Your packet to a server on another continent passes through a dozen or more **routers**. None of them knows the whole path. Each router looks at the destination IP address, consults its **routing table**, and forwards the packet one hop closer. Routing is that decision, repeated at every hop.

> [!KEY] One hop at a time
> A router never plans the whole route. It matches the destination against its table and hands the packet to the next hop. Everything else in routing is about how those tables get filled in and kept correct.

## The routing table

A routing table is a list of entries: a destination prefix, the next hop (or the interface to send it out of), and a cost. A home router's table is tiny:

- \`192.168.1.0/24\`: deliver directly on the local network
- \`0.0.0.0/0\`: everything else goes to the internet provider (the **default route**)

Core internet routers carry hundreds of thousands of prefixes.

## Longest prefix match

When several entries match a destination, the router picks the **most specific** one: the entry with the longest prefix. If the table has \`10.0.0.0/8\` via router A and \`10.1.2.0/24\` via router B, a packet for \`10.1.2.9\` goes to B because /24 is more specific than /8. The default route \`0.0.0.0/0\` matches everything but is the least specific, so it only applies when nothing else does. Longest prefix match is the single most important rule in routing, and a favourite interview question.

> [!TRY] Which route wins?
> A router has: 10.0.0.0/8 via A, 10.1.0.0/16 via B, 10.1.2.0/25 via C, 0.0.0.0/0 via D. Where do packets for 10.1.2.9 and for 10.1.2.200 go?
>
> ---
>
> 10.1.2.9 goes to C: it is inside 10.1.2.0/25 (addresses .0 to .127), the longest match. 10.1.2.200 goes to B: the /25 ends at .127, so only the /16 and /8 match, and the /16 is longer.

## Hop by hop, with a time limit

Each router decrements the packet's **TTL** (time to live). When it reaches zero, the router drops the packet and sends an ICMP "time exceeded" message back. This stops packets from looping forever when routes are misconfigured, and it is exactly what \`traceroute\` exploits: it sends packets with TTL 1, 2, 3 and so on, and each router that drops one reveals itself.

> [!GOTCHA] Stars do not mean a dead hop
> A row of * in traceroute only says that hop did not answer. Many routers rate-limit or ignore ICMP time exceeded while forwarding traffic perfectly. Judge the path by whether later hops respond, not by one silent line.

## Static and dynamic routing

Routes can be set two ways:

- **Static routes** are configured by hand. Simple and predictable, fine for a small network, but they don't react when a link fails.
- **Dynamic routing protocols** let routers share what they can reach and recompute paths when the network changes.

Inside one organisation's network, routers run an **interior gateway protocol**. **OSPF** is a *link-state* protocol: every router learns the full map of links and runs Dijkstra's shortest-path algorithm on it. **RIP** is an older *distance-vector* protocol: routers tell neighbours how far away each destination is, and paths are built from those reports (essentially distributed Bellman-Ford). Link-state converges faster and avoids the "count to infinity" problem distance-vector protocols suffer from.

> [!INTERVIEW] Compare what each router knows
> For link-state against distance-vector, give three contrasts: the router's knowledge (full map or neighbours' distances), the algorithm (Dijkstra or Bellman-Ford) and the failure mode (fast convergence or count to infinity). Naming the algorithm is what earns the credit.

## BGP: routing between organisations

The internet is made of tens of thousands of **autonomous systems** (AS), each an independently run network: an internet provider, a cloud, a university. **BGP** is the protocol they use to tell each other which prefixes they can reach. It is a *path-vector* protocol: announcements carry the list of autonomous systems a route passes through, which prevents loops and lets operators apply policy (prefer a cheaper provider, avoid a competitor).

BGP is built on trust between operators. A misconfigured or malicious announcement of someone else's prefix can pull traffic the wrong way, which is behind several well-known outages. Route validation systems such as RPKI are the slowly spreading fix.

## Connecting it to algorithms

Routing is graph theory in production. Networks are weighted graphs, OSPF is Dijkstra, distance-vector protocols are Bellman-Ford, and longest prefix match is usually implemented with a trie of address bits. If you have solved shortest-path problems on LeetCode, you already understand the core of how routers think.`,
  quiz: [
    { id: 'rt-1', prompt: 'A router has routes 10.0.0.0/8 via A, 10.1.0.0/16 via B and 0.0.0.0/0 via C. Where does it send a packet for 10.1.4.2?', options: ['A', 'B', 'C', 'It drops the packet'], answer: 1, why: 'Longest prefix match: /16 is the most specific route that matches.' },
    { id: 'rt-2', prompt: 'What is the default route?', options: ['0.0.0.0/0, used when no more specific route matches', '127.0.0.1/32', 'The route with the lowest cost', 'A route learned from BGP'], answer: 0, why: '0.0.0.0/0 matches everything, so it applies only when nothing more specific does.' },
    { id: 'rt-3', prompt: 'Why does an IP packet carry a TTL field?', options: ['To encrypt the packet', 'To order packets', 'To set the connection timeout', 'To stop packets looping forever when routes are wrong'], answer: 3, why: 'Each hop decrements TTL; at zero the packet is dropped and an ICMP message is returned.' },
    { id: 'rt-4', prompt: 'OSPF computes routes using:', options: ['Bellman-Ford over neighbours\' distance reports', 'Random walks', 'Dijkstra\'s algorithm over a full map of the network', 'Manual configuration only'], answer: 2, why: 'OSPF is link-state: every router has the topology and runs shortest-path first (Dijkstra).' },
    { id: 'rt-5', prompt: 'Which protocol exchanges routes between autonomous systems on the internet?', options: ['OSPF', 'BGP', 'RIP', 'ARP'], answer: 1, why: 'BGP is the inter-domain path-vector protocol of the internet.' },
  ],
  interview: [
    { q: 'What is longest prefix match?', a: 'When several routing entries match a destination, the router uses the one with the longest (most specific) prefix. A /24 beats a /16, which beats the /0 default route.' },
    { q: 'How does traceroute work?', a: 'It sends packets with TTL 1, 2, 3 and so on. Each router that decrements a TTL to zero drops it and replies with ICMP time exceeded, revealing each hop and its round-trip time.' },
    { q: 'Link-state vs distance-vector routing?', a: 'Link-state (OSPF): each router learns the full topology and runs Dijkstra; fast convergence. Distance-vector (RIP): routers share distance tables with neighbours (Bellman-Ford); simpler but slower and prone to count-to-infinity.' },
  ],
}

export default lesson
