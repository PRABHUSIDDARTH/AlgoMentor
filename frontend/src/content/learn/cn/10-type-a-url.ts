import type { Lesson } from '../types'

const lesson: Lesson = {
  id: 'type-a-url',
  title: 'What happens when you type a URL',
  minutes: 11,
  hook: '"What happens when you type a URL and press Enter?" is asked in almost every interview, because one answer can touch DNS, ARP, NAT, routing, TCP, TLS, HTTP, caching and rendering. Candidates who recite the steps lose to those who can also say where each round trip goes and what breaks.',
  keyPoints: [
    'The path is: parse the URL, resolve DNS, route packets, open TCP, run TLS, send HTTP, render the page.',
    'A fresh HTTPS connection over TCP costs one round trip for TCP and one for TLS 1.3 before the request is sent.',
    'Caches, CDNs, keep-alive, TLS 1.3 and HTTP/3 all exist to remove round trips from this path.',
    'Give an outline first, then go deep where asked, and say what can fail at each step.',
  ],
  body: `## The classic question

"What happens when you type \`https://www.example.com/books\` into a browser and press Enter?" is asked everywhere because it touches every layer you have studied. There is no single right depth. A strong answer walks the whole path in order, then goes deeper wherever the interviewer shows interest. Here is the path.

## 1. The browser parses the input

The browser decides whether the text is a URL or a search, then splits it into **scheme** (\`https\`), **host** (\`www.example.com\`), port (443 by default for HTTPS) and **path** (\`/books\`). If the site is on the browser's HSTS list, it will insist on HTTPS even if you typed \`http\`. It also checks whether a service worker or its own cache can answer without the network at all.

## 2. DNS resolves the host

The browser needs an IP address. It checks its DNS cache, then the operating system's cache and hosts file, then asks the configured **recursive resolver**. On a miss, the resolver walks root, \`.com\` and the domain's authoritative servers, caches the answer for its TTL and returns, say, an A record for a nearby CDN edge.

## 3. Getting packets to the server

To send anything, the laptop decides whether the IP is local by comparing it with its subnet mask. It isn't, so packets go to the **default gateway**, whose MAC address it learns with **ARP**. The home router performs **NAT**, rewriting the private source address to its public one. From there, routers use **longest prefix match** hop by hop across the provider's network and, via **BGP** routes, to the network hosting the edge server.

> [!KEY] Local or gateway?
> The first network decision uses the subnet mask: is the destination on my network? If not, the frame is addressed to the gateway's MAC while the IP packet still carries the server's address. Everything after that is routers matching prefixes.

## 4. TCP connection

The browser opens a TCP connection to port 443: **SYN, SYN-ACK, ACK**. That costs one round trip. (With HTTP/3, the browser uses QUIC over UDP instead, combining transport and encryption setup.)

## 5. TLS handshake

Over that connection, TLS 1.3 runs: ClientHello with key shares and the server name (SNI), ServerHello, the **certificate** for \`www.example.com\`, which the browser checks against trusted CAs, then both sides derive session keys with Diffie-Hellman. One more round trip, and everything after this is encrypted.

> [!TRY] Count the round trips
> The browser already has the server's IP address and has no earlier connection. Using TCP and TLS 1.3 with no session resumption, how many round trips pass from the first SYN until the first byte of the HTTP response reaches the browser?
>
> ---
>
> Three: one for the TCP handshake, one for the TLS 1.3 handshake, and one for the request and its response (assuming the server answers at once). Connection reuse removes the first two; HTTP/3 merges them into one.

## 6. The HTTP request and the server side

The browser sends \`GET /books\` with headers: \`Host\`, cookies, \`Accept-Encoding\` and so on. On the server side the request typically meets a **CDN edge** (cached? answer immediately), then a **load balancer**, which picks a healthy application server. That server runs the application code: authenticating the session, querying a database or cache, and building a response. The response comes back with a status code (200), headers such as \`Content-Type\` and \`Cache-Control\`, and a compressed HTML body.

## 7. The browser renders the page

The browser parses HTML into the **DOM** and CSS into the **CSSOM**, combines them into a render tree, computes **layout** (sizes and positions) and **paints** pixels. Along the way it discovers more resources (stylesheets, scripts, images, fonts) and fetches them, mostly over the same connection with HTTP/2 or HTTP/3 multiplexing. Scripts can block parsing unless loaded with \`defer\` or \`async\`. JavaScript then runs, attaches event handlers and may fetch more data.

> [!GOTCHA] A blocking script blanks the page
> A plain \`<script src>\` in the head stops HTML parsing until it is downloaded and run, so one slow third-party script can leave the page empty. Load it with \`defer\` or \`async\` unless the page truly needs it first.

## 8. Connection reuse and closing

The connection stays open (keep-alive) for further requests, which avoids repeating the TCP and TLS setup. Eventually it is closed with FIN segments, or simply times out.

## How to answer well

Give the eight steps as a short outline first, then offer to go deep. Strong candidates add the performance angle: each round trip (DNS, TCP, TLS) costs latency, which is why caching, CDNs, connection reuse, TLS 1.3 and HTTP/3 exist. Mention what can fail at each step, too: a DNS outage, an expired certificate, a 502 from a load balancer with no healthy servers. That turns a memorised answer into an engineer's answer.

> [!INTERVIEW] Outline first, then depth
> Give the eight steps in about thirty seconds, then ask where to go deeper. Interviewers are listening for ordering, for the round trips you can count, and for what fails at each step. A DNS outage, an expired certificate and a 502 are good examples.`,
  quiz: [
    { id: 'ur-1', prompt: 'Which step happens first after the browser parses the URL (cache miss)?', options: ['DNS resolution of the host name', 'TLS handshake', 'TCP three-way handshake', 'Rendering'], answer: 0, why: 'The browser needs the server\'s IP address before it can open a connection.' },
    { id: 'ur-2', prompt: 'How does the laptop find where to send packets for a remote IP address?', options: ['It broadcasts to the internet', 'It sends them to the default gateway, learning its MAC address with ARP', 'It asks the DNS server', 'It uses the server\'s MAC address'], answer: 1, why: 'Non-local destinations go to the gateway; ARP maps the gateway\'s IP to its MAC.' },
    { id: 'ur-3', prompt: 'With HTTPS over TCP and TLS 1.3, how many round trips before the HTTP request (ignoring DNS)?', options: ['Zero', 'Three for TCP plus three for TLS', 'One for TCP plus one for TLS', 'Only one, total'], answer: 2, why: 'TCP needs one round trip; TLS 1.3 needs one more for a fresh handshake.' },
    { id: 'ur-4', prompt: 'What does the browser build from HTML before layout?', options: ['A routing table', 'An ARP cache', 'A TLS certificate', 'The DOM (and from CSS, the CSSOM), combined into a render tree'], answer: 3, why: 'Parsing produces DOM and CSSOM; the render tree feeds layout and paint.' },
    { id: 'ur-5', prompt: 'Why does keeping the connection alive speed up later requests?', options: ['It avoids repeating the TCP and TLS handshakes', 'It skips DNS forever', 'It disables encryption', 'It makes the server faster'], answer: 0, why: 'Connection reuse saves the round trips needed to set up a new connection.' },
  ],
  interview: [
    { q: 'What happens when you type a URL and press Enter?', a: 'Parse the URL (and HSTS, cache, service worker checks); DNS resolution through caches and the recursive resolver; routing to the gateway via ARP, NAT and hop-by-hop forwarding; TCP handshake; TLS handshake with certificate validation; HTTP request through CDN and load balancer to an app server; response; parse, layout, paint and fetch sub-resources; keep the connection alive.' },
    { q: 'Where does latency come from in that flow, and how is it reduced?', a: 'Round trips for DNS, TCP and TLS, distance to the server, and server processing. Reduced with DNS and HTTP caching, CDNs close to users, connection reuse, TLS 1.3 and session resumption, and HTTP/3 combining transport and crypto setup.' },
  ],
}

export default lesson
