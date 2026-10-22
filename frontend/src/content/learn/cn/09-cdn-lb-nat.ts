import type { Lesson } from '../types'

const lesson: Lesson = {
  id: 'cdn-lb-nat',
  title: 'CDNs, load balancers & NAT',
  minutes: 10,
  diagram: 'edge-path',
  hook: 'Two laptops on the same home network both open a connection from source port 50000 to the same server. The server sees both, yet each reply finds its way back to the right laptop. The trick is a table in the router. It is one of three pieces of machinery every request to a big site passes through.',
  keyPoints: [
    'A CDN caches content at edges near users; invalidation is the hard part, solved by hashed file names cached for long.',
    'Layer 4 balancers route by IP and port; layer 7 balancers read HTTP, so they can route by path and terminate TLS.',
    'Stateless servers with shared session storage beat sticky sessions, which only work around in-memory state.',
    'NAT (PAT) maps a private address and port to a public one, which is why unsolicited inbound connections fail.',
  ],
  body: `## The machinery between you and the server

A request to a large website rarely goes straight to "the server". It passes through a **CDN** close to you, a **load balancer** in front of many servers, and on your side, a router doing **NAT**. These three show up constantly in system design interviews.

## CDNs: bring content closer

A **content delivery network** runs servers (points of presence, or *edges*) in hundreds of cities. When you request an image, DNS or anycast routing sends you to a nearby edge. If the edge has a cached copy, it answers in a few milliseconds; if not, it fetches from the **origin** server once and caches the result for everyone nearby.

CDNs cut latency (the speed of light is the limit; being closer is the only fix), reduce load on the origin, and absorb traffic spikes and attacks. They are ideal for static assets: images, scripts, video segments. Dynamic pages can still benefit from short caching or from the CDN keeping fast, warm connections back to the origin.

The hard part is **invalidation**: when content changes, cached copies must be purged or must expire. The common pattern is to put a content hash in file names (\`app.3f9a1c.js\`), cache them "forever", and change the name when the content changes. HTML that references them gets a short cache time.

> [!KEY] Hash the name, cache it long
> Put a content hash in the file name, cache the file for a year, and change the name when the content changes. Static assets then never need purging. Only the HTML that points to them needs a short cache time.

## Load balancers: spread the work

A **load balancer** receives requests and distributes them across a pool of servers, so you can add capacity by adding machines and survive one of them failing.

- **Layer 4** balancers route by IP and port without reading the payload: very fast, protocol-agnostic.
- **Layer 7** balancers read HTTP: they can route \`/api\` to one pool and \`/images\` to another, terminate TLS, add headers and retry failed requests.

Common algorithms: **round robin**, **least connections** (send to the least busy server) and **consistent hashing** (the same user or key goes to the same server, useful for caches). **Health checks** remove failing servers automatically.

**Sticky sessions** pin a user to one server, which is a workaround for servers that keep session state in memory. The better design is **stateless** servers with sessions in a shared store such as Redis, so any server can handle any request.

> [!GOTCHA] Sticky sessions hide state in one box
> When the pinned server dies or is scaled in, every user stuck to it loses their session, and load drifts out of balance in the meantime. Keep session data in a shared store and let any server answer.

The load balancer itself must not be a single point of failure, so they are run in pairs or as managed, distributed services.

## NAT: many devices, one public address

IPv4 addresses are scarce, so your home network uses private addresses (\`192.168.x.x\`) behind one public address. Your router performs **network address translation**: when your laptop opens a connection, the router rewrites the source address and port to its public address and a chosen port, records the mapping in a table, and translates replies back. This is more precisely called PAT (port address translation), because ports distinguish the many inside connections.

> [!TRY] Same port, two laptops
> Laptops 192.168.1.10 and 192.168.1.11 both connect from source port 50000 to 198.51.100.7:443. The router's public address is 203.0.113.5. What source address and ports does the server see?
>
> ---
>
> Both connections arrive from 203.0.113.5. The ports must differ: the router can keep 50000 for one and rewrite the other to an unused port, say 50001. Its translation table remembers which is which and sends replies to the right laptop.

Side effects worth knowing:

- Devices behind NAT can make outbound connections easily, but **unsolicited inbound connections fail**: there is no table entry for them. That is why peer-to-peer apps and video calls need tricks like STUN and relays (TURN) to connect two people behind NAT.
- NAT is not a firewall, but it blocks inbound traffic as a side effect.
- Mobile carriers often use **carrier-grade NAT**, putting thousands of customers behind one address, which is one reason rate limiting by IP alone is unreliable.

## Putting them together

A typical path: your laptop goes through NAT; DNS points you to the nearest CDN edge; static files come from the edge cache; API calls go through to a layer 7 load balancer that terminates TLS and spreads requests across stateless application servers. Being able to sketch and explain that path is half of many system design answers.

> [!INTERVIEW] Draw the path, label each box
> Sketch client, NAT, DNS, CDN edge, layer 7 load balancer, stateless servers, cache and database. For each box say what it saves the origin: latency, load or a single point of failure. Say where TLS terminates, because interviewers will ask.`,
  quiz: [
    { id: 'cd-1', prompt: 'What is the main way a CDN reduces latency?', options: ['Serving cached content from an edge server close to the user', 'Compressing images more', 'Using UDP for everything', 'Removing TLS'], answer: 0, why: 'Distance sets a floor on latency; edges near users cut the round trip.' },
    { id: 'cd-2', prompt: 'Which load balancer can route /api and /images to different server pools?', options: ['Layer 4', 'Layer 7', 'A network switch', 'DNS round robin'], answer: 1, why: 'Routing by path requires reading HTTP, which is application layer (7).' },
    { id: 'cd-3', prompt: 'Why are stateless application servers preferred behind a load balancer?', options: ['They use less CPU', 'They don\'t need health checks', 'Any server can handle any request, so no sticky sessions are needed and failures are painless', 'They encrypt sessions'], answer: 2, why: 'Session state lives in a shared store, so servers are interchangeable.' },
    { id: 'cd-4', prompt: 'Why can\'t another computer on the internet directly connect to your laptop at home?', options: ['Laptops cannot accept connections', 'TCP forbids it', 'DNS blocks it', 'The NAT router has no mapping for unsolicited inbound traffic'], answer: 3, why: 'NAT creates mappings only for outbound connections; inbound packets have nowhere to go.' },
    { id: 'cd-5', prompt: 'How do sites update cached static files without waiting for CDN expiry?', options: ['Put a content hash in the file name, so new content gets a new URL', 'Ask users to clear their cache', 'Disable the CDN', 'Use POST requests'], answer: 0, why: 'A new name is a cache miss everywhere; old names can be cached forever safely.' },
  ],
  interview: [
    { q: 'Layer 4 vs layer 7 load balancing?', a: 'Layer 4 routes by IP and port without reading payloads: fast and protocol-agnostic. Layer 7 understands HTTP: path- and header-based routing, TLS termination, retries and richer health checks, at more cost per request.' },
    { q: 'How does NAT work?', a: 'The router rewrites outbound packets\' private source IP and port to its public IP and a chosen port, stores the mapping, and rewrites replies back. Inbound connections without a mapping are dropped.' },
    { q: 'What problems does a CDN solve and what does it complicate?', a: 'It reduces latency and origin load and absorbs spikes and attacks. It complicates invalidation (stale content), debugging (which edge served this?) and personalised or private content, which must not be cached publicly.' },
  ],
}

export default lesson
