import type { Lesson } from '../types'

const lesson: Lesson = {
  id: 'network-models',
  title: 'Models: OSI and TCP/IP',
  minutes: 9,
  diagram: 'layer-stack',
  hook: 'A user reports the app is down. One engineer reads server logs, another restarts the service, a third blames the Wi-Fi, and an hour goes by. Thinking in layers replaces that guessing with a short checklist: which layer is failing? It is also the vocabulary every networking interview assumes you already have.',
  keyPoints: [
    'Networking is split into layers; each offers a service to the layer above and can change without the others noticing.',
    'TCP/IP has four layers (link, internet, transport, application); OSI has seven and supplies the shared vocabulary.',
    'Encapsulation wraps data as an HTTP message in a TCP segment in an IP packet in an Ethernet frame.',
    'Debug from the bottom up: link, then IP and gateway, then port, then the application response.',
  ],
  body: `## Why networks are built in layers

Sending a web page across the world involves radio signals, cables, routers in a dozen countries, error recovery, encryption and a browser that understands HTML. No single piece of software could manage all of that. Networking splits the job into **layers**, each solving one problem and relying on the layer below it.

Your browser speaks HTTP and never thinks about Wi-Fi channels. The Wi-Fi driver moves frames and never thinks about web pages. Each layer offers a service to the one above and can change without the others noticing, which is why the same browser works over fibre, 5G or a hotel's flaky network.

> [!KEY] One layer, one job
> A layer uses the service of the layer below and offers one to the layer above. That is why the same HTTP code runs over fibre, 5G or hotel Wi-Fi: nothing above the link layer knows which one carried the bytes.

## The TCP/IP model: what the internet runs

The internet is organised in four layers:

1. **Link**: moves frames between machines on the same local network. Ethernet and Wi-Fi live here, using MAC addresses.
2. **Internet**: moves packets between networks, hop by hop, using IP addresses. This is IP itself (IPv4 and IPv6) plus helpers like ICMP, the protocol behind \`ping\`.
3. **Transport**: moves data between *processes* on two hosts, identified by port numbers. TCP gives a reliable ordered byte stream; UDP gives fast, best-effort datagrams.
4. **Application**: what programs actually say to each other: HTTP, DNS, SMTP, SSH, and your own protocols.

## The OSI model: the shared vocabulary

The **OSI model** has seven layers. It was designed as a standard that the internet never adopted, but its numbering stuck as the common language of networking:

1. Physical (signals, cables, radio)
2. Data link (frames, MAC addresses, switches)
3. Network (IP, routers)
4. Transport (TCP, UDP, ports)
5. Session (managing conversations)
6. Presentation (encoding, compression, encryption)
7. Application (HTTP, DNS)

Engineers say "a layer 4 load balancer" (it looks at IPs and ports) or "layer 7 routing" (it reads HTTP paths and headers). TCP/IP's application layer covers OSI's top three, and its link layer covers OSI's bottom two.

> [!GOTCHA] OSI is not what the internet runs
> Candidates recite seven layers when asked how the internet works. The internet runs TCP/IP's four. Real stacks have no separate session or presentation layer; that work happens inside applications and libraries such as TLS. Use OSI numbers as labels (layer 4, layer 7), not as a description of the stack.

## Encapsulation: envelopes inside envelopes

As data goes down the stack, each layer wraps it with its own header. An HTTP request becomes the payload of a TCP *segment*, which becomes the payload of an IP *packet*, which becomes the payload of an Ethernet *frame*. On the receiving side each layer removes its header and passes the payload up. Routers along the way only open the envelope as far as the IP header; they don't need to read your HTTP.

> [!TRY] One IP packet, how big?
> An application gives TCP 100 bytes of data. The TCP and IP headers are 20 bytes each (no options). How long is the IP packet, and how long is the Ethernet frame, counting its 14-byte header but not the 4-byte trailer?
>
> ---
>
> The IP packet is 140 bytes: 100 data + 20 TCP + 20 IP. The frame is 154 bytes: the 140-byte packet plus the 14-byte Ethernet header. Each layer adds only its own header.

The names matter in interviews: **frame** at the link layer, **packet** at the network layer, **segment** (TCP) or **datagram** (UDP) at the transport layer, **message** at the application layer.

## Using the model to debug

Layering is also a troubleshooting method. Work from the bottom up: is the cable or Wi-Fi connected (physical, link)? Do we have an IP address and can we \`ping\` the gateway (network)? Is the port open (transport)? Does the server return the right response (application)? Naming the failing layer turns "the internet is broken" into a specific, fixable problem.

> [!INTERVIEW] Name the failing layer
> "The site is down" is a prompt to watch how you narrow a problem. Go bottom up out loud: link up? IP address, can I ping the gateway? port open? correct HTTP response? Interviewers listen for a method, not a lucky guess.`,
  quiz: [
    { id: 'nm-1', prompt: 'Which layer does TCP belong to?', options: ['Application', 'Internet', 'Transport', 'Link'], answer: 2, why: 'TCP and UDP are transport protocols: they move data between processes on two hosts using ports.' },
    { id: 'nm-2', prompt: 'A router forwards traffic using which address?', options: ['MAC address', 'URL', 'Port number', 'IP address'], answer: 3, why: 'Routers work at the network (internet) layer and forward packets by destination IP.' },
    { id: 'nm-3', prompt: 'What is the correct order of encapsulation for an HTTP request on Ethernet, innermost first?', options: ['HTTP inside a TCP segment inside an IP packet inside an Ethernet frame', 'Frame, packet, segment, HTTP', 'IP packet inside HTTP inside TCP', 'Segment inside frame inside HTTP'], answer: 0, why: 'Each lower layer wraps the one above with its own header.' },
    { id: 'nm-4', prompt: 'A "layer 7 load balancer" can make decisions based on:', options: ['Only IP addresses', 'HTTP details such as path and headers', 'Only MAC addresses', 'Electrical signal strength'], answer: 1, why: 'Layer 7 is the application layer, so it can read HTTP; layer 4 sees only IPs and ports.' },
    { id: 'nm-5', prompt: 'How many layers does the OSI model have?', options: ['4', '5', '7', '9'], answer: 2, why: 'Physical, data link, network, transport, session, presentation, application.' },
  ],
  interview: [
    { q: 'Name the TCP/IP layers and a protocol at each.', a: 'Link (Ethernet, Wi-Fi), internet (IP, ICMP), transport (TCP, UDP), application (HTTP, DNS, SSH).' },
    { q: 'Why does the OSI model still matter if the internet uses TCP/IP?', a: 'It gives shared vocabulary ("layer 4" vs "layer 7" load balancing) and a structured way to locate a problem by layer.' },
    { q: 'What is encapsulation in networking?', a: 'Each layer adds its own header around the data from the layer above: HTTP message in a TCP segment in an IP packet in an Ethernet frame. The receiver strips headers layer by layer.' },
  ],
}

export default lesson
