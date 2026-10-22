import type { Lesson } from '../types'

const lesson: Lesson = {
  id: 'physical-data-link',
  title: 'Physical & data link basics',
  minutes: 8,
  body: `## The bottom of the stack

Every network message eventually becomes something physical: voltage changes on copper, pulses of light in fibre, or radio waves. The **physical layer** is about encoding bits into those signals and getting them across a medium. The **data link layer** sits just above it and turns a stream of bits into **frames** delivered between devices on the same local network.

You rarely program these layers directly, but they explain real behaviour: why Wi-Fi gets slow when everyone is online, why a switch is better than a hub, and what happens before the first IP packet is ever sent.

## Bandwidth, latency and throughput

Three numbers describe a link:

- **Bandwidth**: the maximum rate the link can carry, such as 1 Gbps.
- **Latency**: how long one bit takes to travel from end to end, set by distance and the speed of light in the medium plus processing delays. Light in fibre crosses an ocean in tens of milliseconds, whatever the bandwidth.
- **Throughput**: what you actually get, after overhead, congestion and retransmissions.

A useful habit: a high-bandwidth, high-latency link (a satellite) is great for streaming and terrible for chatty protocols that wait for a reply after every message.

## MAC addresses and frames

Every network interface has a **MAC address**: 48 bits, usually written as six hex pairs like \`3c:22:fb:9a:10:4e\`. A frame carries a source MAC, a destination MAC, the payload (often an IP packet) and a checksum that lets the receiver detect corruption. A corrupted frame is simply dropped; recovering from that is left to higher layers such as TCP.

MAC addresses only matter on the local network. When a packet crosses a router, the IP addresses stay the same but the MAC addresses are rewritten for each hop.

## Hubs, switches and collisions

An old **hub** repeated every frame to every port, so all devices shared one channel and their transmissions could collide. A **switch** learns which MAC address lives on which port (it keeps a MAC table) and forwards each frame only where it needs to go. Every port gets its own collision-free link, which is why switched Ethernet scales well.

Wi-Fi is still a shared medium: all devices on a channel take turns talking. It avoids collisions by listening before sending and backing off randomly, which is why a crowded network feels slow even when the internet connection behind it is fast.

## ARP: from IP address to MAC address

To send an IP packet to a machine on the same network, a host needs that machine's MAC address. **ARP** (Address Resolution Protocol) asks the whole local network "who has 192.168.1.20?" and the owner replies with its MAC. The answer is cached for a while. For destinations outside the network, the host ARPs for its **default gateway** (the router) instead and hands the packet to it.

ARP has no authentication, so a malicious machine can answer for someone else's IP and intercept traffic (ARP spoofing). Switch features and encryption at higher layers are the defences.

## VLANs and MTU

Two more terms come up often. A **VLAN** splits one physical switch into several isolated logical networks, for example separating guest Wi-Fi from office machines. The **MTU** (maximum transmission unit) is the largest payload a frame can carry, 1500 bytes on standard Ethernet; bigger IP packets must be fragmented or avoided, which is a classic source of mysterious "small requests work, large ones hang" bugs.`,
  quiz: [
    { id: 'pd-1', prompt: 'What does a network switch use to decide where to send a frame?', options: ['The destination IP address', 'The TCP port number', 'The URL', 'A table of MAC addresses learned per port'], answer: 3, why: 'Switches operate at the data link layer and forward by destination MAC using their MAC table.' },
    { id: 'pd-2', prompt: 'A link has huge bandwidth but 600 ms latency. Which workload suffers most?', options: ['Downloading one large file', 'Streaming a video', 'A protocol that waits for a reply after every small message', 'Backing up overnight'], answer: 2, why: 'Latency dominates request-response chatter; bandwidth dominates bulk transfer.' },
    { id: 'pd-3', prompt: 'What is ARP used for?', options: ['Finding the IP address for a domain name', 'Finding the MAC address for an IP address on the local network', 'Assigning IP addresses', 'Encrypting frames'], answer: 1, why: 'ARP maps a local IP to the MAC address needed to build the frame.' },
    { id: 'pd-4', prompt: 'When a packet passes through a router, what changes?', options: ['The MAC addresses in the frame', 'The source and destination IP addresses', 'The TCP port numbers', 'Nothing'], answer: 0, why: 'Each hop gets a new link-layer frame; IP addresses stay end to end (NAT aside).' },
    { id: 'pd-5', prompt: 'What is the standard Ethernet MTU?', options: ['512 bytes', '64 KB', '9000 bytes', '1500 bytes'], answer: 3, why: 'Standard Ethernet frames carry up to 1500 bytes of payload; jumbo frames are an optional extension.' },
  ],
  interview: [
    { q: 'What is the difference between a hub, a switch and a router?', a: 'A hub repeats every frame to all ports (one shared collision domain). A switch forwards frames by MAC address to the right port. A router forwards packets between different networks by IP address.' },
    { q: 'Explain latency vs bandwidth.', a: 'Bandwidth is how much data per second a link can carry; latency is how long a single bit takes to arrive. A wide pipe can still be slow to respond if it is long.' },
  ],
}

export default lesson
