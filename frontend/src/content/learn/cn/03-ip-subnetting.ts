import type { Lesson } from '../types'

const lesson: Lesson = {
  id: 'ip-subnetting',
  title: 'IP addressing & subnetting',
  minutes: 10,
  diagram: 'subnet-split',
  hook: 'A cloud engineer splits a /24 into four subnets, gives one to the database tier, and finds only 62 usable addresses where she expected 64. Two addresses in every block are spoken for. The same arithmetic also decides whether two machines can talk directly or must go through a router.',
  keyPoints: [
    'CIDR writes a network as address/prefix; a /N block holds 2 to the power (32 minus N) addresses.',
    'The first address of a block is the network address and the last is broadcast, so usable hosts are two fewer.',
    'A host ANDs addresses with the mask to choose between direct delivery (ARP) and the default gateway.',
    'Private ranges are 10/8, 172.16/12 and 192.168/16; a 169.254.x.x address usually means DHCP failed.',
  ],
  body: `## What an IP address is

An **IPv4 address** is 32 bits, written as four decimal numbers from 0 to 255: \`192.168.10.37\`. Every address has two parts: a **network** part shared by all hosts on the same network, and a **host** part that identifies one machine on it. Where the split falls is given by the subnet mask or, more commonly today, the prefix length.

## CIDR notation

**CIDR** writes the network as an address plus the number of network bits: \`192.168.10.0/24\` means the first 24 bits are the network and the last 8 identify hosts. The equivalent subnet mask is \`255.255.255.0\`.

To count addresses in a block: there are 32 minus the prefix host bits, and 2 to that power addresses. A \`/24\` has 8 host bits, so 256 addresses. Two of them are reserved: the first is the **network address** (\`192.168.10.0\`) and the last is the **broadcast address** (\`192.168.10.255\`). That leaves 254 usable hosts. A \`/26\` has 6 host bits: 64 addresses, 62 usable.

> [!KEY] Count the host bits
> Prefix length N leaves 32 minus N host bits, so the block holds 2 to that power addresses. Nearly every subnetting question is that one sum, plus the two reserved addresses.

## Subnetting a block

**Subnetting** splits one block into smaller ones by borrowing host bits for the network part. Take \`10.0.0.0/24\` and split it into four equal subnets: you need 2 extra bits (2 squared is 4), so each subnet is a \`/26\` of 64 addresses:

- \`10.0.0.0/26\`: hosts .1 to .62, broadcast .63
- \`10.0.0.64/26\`: hosts .65 to .126, broadcast .127
- \`10.0.0.128/26\`: hosts .129 to .190, broadcast .191
- \`10.0.0.192/26\`: hosts .193 to .254, broadcast .255

The trick for exams: the block size is 256 minus the last non-255 octet of the mask. A \`/26\` mask is \`255.255.255.192\`, so subnets start every 64.

> [!TRY] Size up a /20
> For the host 172.16.5.200/20, what are the network address, the broadcast address and the number of usable hosts?
>
> ---
>
> The mask is 255.255.240.0, so the third octet moves in steps of 16. Network 172.16.0.0, broadcast 172.16.15.255. There are 12 host bits: 4096 addresses, 4094 usable (172.16.0.1 to 172.16.15.254).

## Is this address on my network?

A host decides whether to deliver a packet directly or send it to its gateway by ANDing addresses with the mask. If \`destination AND mask\` equals \`my address AND mask\`, the destination is local and the host uses ARP to find it. Otherwise the packet goes to the default gateway. This one bitwise operation is behind every "can these two machines talk directly?" question.

> [!INTERVIEW] Do the AND out loud
> "Can these two hosts talk directly?" Write both addresses against the mask, AND them and compare. Then say what follows: equal networks mean ARP and a direct frame, different ones mean the default gateway. Interviewers want the mechanism, not only the answer.

## Private and special addresses

Some ranges are reserved for private networks and never routed on the public internet:

- \`10.0.0.0/8\`
- \`172.16.0.0/12\`
- \`192.168.0.0/16\`

Your laptop at home almost certainly has a \`192.168.x.x\` address, and a router translates it to a public one (NAT, covered later). Other special ranges: \`127.0.0.0/8\` is loopback (\`127.0.0.1\` is "this machine"), and \`169.254.0.0/16\` is what a machine gives itself when DHCP fails, a quick clue when debugging.

> [!GOTCHA] Not all of 172.x is private
> The private block is 172.16.0.0 to 172.31.255.255. A firewall rule that treats every 172.x.x.x address as internal will trust public addresses such as 172.32.0.1.

## How hosts get addresses: DHCP

Most devices don't have addresses configured by hand. **DHCP** hands out an address, mask, gateway and DNS servers when a device joins the network, for a limited lease. The four messages are Discover, Offer, Request, Acknowledge.

## IPv6 in brief

IPv4's 4.3 billion addresses ran out long ago. **IPv6** uses 128-bit addresses written in hex groups, \`2001:db8:85a3::8a2e:370:7334\`, where \`::\` stands for a run of zero groups. Networks are typically \`/64\`, so address exhaustion is not a concern, and devices can configure their own addresses. The ideas of prefix, network and host are the same; only the sizes change.`,
  quiz: [
    { id: 'ip-1', prompt: 'How many usable host addresses are in a /24 network?', options: ['256', '255', '254', '128'], answer: 2, why: '256 addresses minus the network and broadcast addresses leaves 254.' },
    { id: 'ip-2', prompt: 'Splitting 10.0.0.0/24 into four equal subnets gives subnets of which size?', options: ['/25', '/28', '/27', '/26'], answer: 3, why: 'Four subnets need 2 extra network bits: 24 + 2 = 26, each with 64 addresses.' },
    { id: 'ip-3', prompt: 'Which address is a private (non-routable) IPv4 address?', options: ['172.20.4.9', '8.8.8.8', '142.250.70.14', '1.1.1.1'], answer: 0, why: '172.16.0.0/12 covers 172.16.x.x to 172.31.x.x, all private.' },
    { id: 'ip-4', prompt: 'A machine has the address 169.254.12.7. What does this most likely mean?', options: ['It is a public server', 'It failed to get an address from DHCP and assigned itself one', 'It is using IPv6', 'It is a loopback address'], answer: 1, why: '169.254.0.0/16 is link-local self-assignment, typically after DHCP fails.' },
    { id: 'ip-5', prompt: 'What is the broadcast address of 192.168.1.64/26?', options: ['192.168.1.64', '192.168.1.255', '192.168.1.127', '192.168.1.128'], answer: 2, why: 'A /26 block is 64 addresses: .64 to .127, so .127 is the broadcast.' },
  ],
  interview: [
    { q: 'How does a host decide whether to send a packet directly or to the gateway?', a: 'It ANDs its own address and the destination with the subnet mask. If the network parts match, the destination is local (find its MAC with ARP); otherwise it sends the packet to the default gateway.' },
    { q: 'What is CIDR and why replaced classful addressing?', a: 'CIDR expresses networks as address/prefix length with any boundary, instead of fixed class A/B/C sizes. It wastes far fewer addresses and allows route aggregation.' },
    { q: 'Why do we need private address ranges?', a: 'They let many organisations reuse the same internal addresses without global coordination, with NAT translating to scarce public IPv4 addresses at the edge.' },
  ],
}

export default lesson
