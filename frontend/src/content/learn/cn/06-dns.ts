import type { Lesson } from '../types'

const lesson: Lesson = {
  id: 'dns',
  title: 'DNS',
  minutes: 9,
  body: `## The internet's phone book

Computers connect to IP addresses; people type names. The **Domain Name System** translates names like \`www.example.com\` into addresses like \`93.184.215.14\`. It is one of the largest distributed databases in the world, and nearly every connection on the internet starts with a DNS lookup.

## Names are a hierarchy

Read a domain name from right to left. \`www.example.com.\` (the trailing dot is usually hidden) has:

- the **root** (the final dot),
- a **top-level domain** (\`com\`),
- a **second-level domain** (\`example\`), owned by whoever registered it,
- a **subdomain** (\`www\`), managed by that owner.

Each level delegates authority for the level below. The root servers know who runs \`com\`; the \`com\` servers know which name servers are authoritative for \`example.com\`; those name servers hold the actual records.

## How a lookup works

When your browser needs \`www.example.com\`:

1. It checks its own cache, then asks the operating system, which checks its cache and the hosts file.
2. The OS asks a **recursive resolver**, usually run by your internet provider or a public service such as 1.1.1.1 or 8.8.8.8.
3. If the resolver hasn't cached the answer, it walks the hierarchy **iteratively**: it asks a root server (which refers it to the \`com\` servers), asks a \`com\` server (which refers it to example.com's name servers), and asks an authoritative server, which returns the record.
4. The resolver caches the answer and returns it to you.

The client makes one *recursive* request; the resolver does the *iterative* work. Interviewers like that distinction.

DNS queries normally travel over **UDP port 53**: a question and answer fit in single datagrams and a lost one is just retried. Large responses and transfers between servers use TCP. Encrypted variants (DNS over HTTPS and DNS over TLS) hide lookups from observers on the network.

## Record types you should know

- **A**: name to IPv4 address.
- **AAAA**: name to IPv6 address.
- **CNAME**: this name is an alias for another name (\`www\` to \`example.netlify.app\`).
- **MX**: the mail servers for a domain, with priorities.
- **NS**: the authoritative name servers for a zone.
- **TXT**: free text, used for domain ownership verification and email security (SPF, DKIM).

## Caching and TTL

Every record has a **TTL**: how many seconds resolvers may cache it. Long TTLs mean fewer lookups and faster responses; short TTLs mean changes spread quickly. Before migrating a site to a new server, teams lower the TTL days in advance so the switch takes effect within minutes. "It works for me but not for them" after a DNS change is almost always caching.

## DNS in system design

DNS is also a tool. It can return different addresses by region (**geo DNS**), rotate among several servers (**round-robin DNS**), or fail over to a backup when health checks fail. It is coarse, because clients cache answers and you can't control them, which is why it is usually combined with load balancers.

Failures matter too: if DNS is down, everything looks down, even when every server is healthy. Large outages have been caused by DNS providers or misconfigured records, so production systems use multiple name server providers and monitor resolution itself.`,
  quiz: [
    { id: 'dn-1', prompt: 'Which DNS record maps a name to an IPv6 address?', options: ['A', 'AAAA', 'CNAME', 'MX'], answer: 1, why: 'A is IPv4, AAAA ("quad A") is IPv6.' },
    { id: 'dn-2', prompt: 'Who performs the iterative walk from the root servers to the authoritative server?', options: ['The recursive resolver', 'The browser', 'The root server', 'The web server'], answer: 0, why: 'The client sends one recursive query; the resolver asks root, TLD and authoritative servers in turn.' },
    { id: 'dn-3', prompt: 'Which transport does a normal DNS query use?', options: ['TCP port 80', 'TCP port 22', 'UDP port 443', 'UDP port 53'], answer: 3, why: 'Small queries fit in one datagram over UDP 53; TCP 53 is used for large responses and zone transfers.' },
    { id: 'dn-4', prompt: 'Why lower a record\'s TTL before migrating a site to a new server?', options: ['To make DNS faster permanently', 'TTL controls the TCP timeout', 'So cached old answers expire quickly and the switch spreads fast', 'It encrypts the record'], answer: 2, why: 'Resolvers keep records for the TTL; short TTLs make changes visible sooner.' },
    { id: 'dn-5', prompt: 'www.example.com should point to example.netlify.app. Which record type fits?', options: ['MX', 'CNAME', 'NS', 'TXT'], answer: 1, why: 'A CNAME makes one name an alias of another.' },
  ],
  interview: [
    { q: 'Walk through what happens when you resolve www.example.com.', a: 'Browser and OS caches first; then the recursive resolver. On a cache miss the resolver asks a root server (referral to .com), a .com server (referral to example.com\'s name servers), then the authoritative server for the A/AAAA record. It caches the answer per TTL and returns it.' },
    { q: 'Recursive vs iterative DNS queries?', a: 'A recursive query asks the server to return the final answer (client to resolver). An iterative query accepts a referral to another server (resolver to root/TLD/authoritative).' },
    { q: 'How can DNS help with load balancing, and what are its limits?', a: 'Round-robin and geo DNS spread clients across servers or regions, and health-checked DNS can fail over. Limits: clients and resolvers cache answers per TTL (sometimes longer), so changes are slow and per-request balancing is impossible.' },
  ],
}

export default lesson
