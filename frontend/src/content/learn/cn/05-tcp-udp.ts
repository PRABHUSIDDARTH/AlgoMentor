import type { Lesson } from '../types'

const lesson: Lesson = {
  id: 'tcp-udp',
  title: 'TCP vs UDP',
  minutes: 11,
  diagram: 'tcp-handshake',
  body: `## Two very different promises

IP delivers packets on a best-effort basis: they can be lost, duplicated or arrive out of order. The transport layer decides what to do about that.

- **TCP** promises a **reliable, ordered byte stream** between two programs. Whatever you write arrives, complete and in order, or the connection reports an error.
- **UDP** promises almost nothing: it sends independent **datagrams** with a checksum and port numbers. Some may be lost or reordered, and nobody retries.

Both use **ports** to identify which program on a host gets the data. A connection is identified by four values: source IP, source port, destination IP, destination port.

## The three-way handshake

TCP sets up a connection before any data flows:

1. Client sends **SYN** with its initial sequence number.
2. Server replies **SYN-ACK**: its own sequence number, and an acknowledgement of the client's.
3. Client sends **ACK**.

Now both sides agree on sequence numbers and the connection is open. This costs one round trip before the first byte of real data, which is why connection reuse matters so much for performance. Closing uses FIN and ACK from each side, and the side that closes first waits in **TIME_WAIT** for a while so stray late packets can't confuse a new connection on the same ports.

## How reliability works

Every byte has a **sequence number**. The receiver sends **acknowledgements** saying "I have everything up to byte N". If the sender doesn't see an acknowledgement within a timeout, or sees three duplicate ACKs for the same byte, it retransmits. The receiver reorders segments that arrive out of order and discards duplicates, so the application only ever sees a clean stream.

## Flow control: don't drown the receiver

The receiver advertises a **window**: how many more bytes it has buffer space for. The sender never has more unacknowledged data in flight than that window. A slow receiver shrinks the window; a window of zero pauses the sender. Flow control protects the *receiver*.

## Congestion control: don't drown the network

Congestion control protects the *network*. TCP doesn't know the capacity of the path, so it probes. It starts with a small **congestion window** and doubles it every round trip (**slow start**, which is not slow at all). After reaching a threshold it grows by one segment per round trip (**congestion avoidance**). When loss signals congestion, it cuts the window, often in half. This "additive increase, multiplicative decrease" pattern is why many TCP connections can share a link fairly. Modern algorithms such as CUBIC and BBR refine the curve, but the idea is the same.

## When to choose UDP

UDP has no handshake, no retransmission and no head-of-line blocking (with TCP, one lost segment holds up everything behind it). That makes it the right base when:

- **Late data is useless**: voice and video calls, live games. A retransmitted video frame from 300 ms ago is just noise.
- **Requests are tiny and independent**: DNS lookups fit in one datagram and simply retry on timeout.
- **You want your own reliability rules**: **QUIC**, the transport under HTTP/3, runs on UDP and implements reliable streams, encryption and smarter loss recovery in user space, without TCP's head-of-line blocking across streams.

## Comparing them in one line each

TCP: connection-oriented, reliable, ordered, flow and congestion controlled, heavier. UDP: connectionless, unreliable, unordered, lightweight, and the application takes responsibility. Neither is "better"; the question is always which guarantees the application actually needs.`,
  quiz: [
    { id: 'tu-1', prompt: 'What is the order of the TCP three-way handshake?', options: ['SYN, SYN-ACK, ACK', 'ACK, SYN, SYN-ACK', 'SYN, ACK, FIN', 'HELLO, OK, DATA'], answer: 0, why: 'Client SYN, server SYN-ACK, client ACK; then data can flow.' },
    { id: 'tu-2', prompt: 'Flow control in TCP protects:', options: ['The network from congestion', 'The receiver from being sent more than it can buffer', 'The sender from slow DNS', 'Packets from being encrypted twice'], answer: 1, why: 'The receive window limits unacknowledged data to what the receiver can hold.' },
    { id: 'tu-3', prompt: 'During slow start, the congestion window:', options: ['Grows by one segment per round trip', 'Stays constant', 'Roughly doubles every round trip', 'Shrinks until loss'], answer: 2, why: 'Slow start grows exponentially until a threshold or loss, then congestion avoidance grows linearly.' },
    { id: 'tu-4', prompt: 'Why do video calls usually run over UDP-based protocols?', options: ['UDP is encrypted by default', 'UDP guarantees ordering', 'TCP cannot carry video', 'Late data is useless, so waiting for retransmissions hurts more than losing a packet'], answer: 3, why: 'Retransmission and head-of-line blocking add delay; a missing frame is better than a late one.' },
    { id: 'tu-5', prompt: 'Which protocol runs on UDP and provides reliable, encrypted streams for HTTP/3?', options: ['QUIC', 'SCTP', 'ICMP', 'ARP'], answer: 0, why: 'QUIC implements reliability, congestion control and TLS 1.3 on top of UDP.' },
  ],
  interview: [
    { q: 'TCP vs UDP: when would you use each?', a: 'TCP when every byte must arrive in order (web pages, APIs, file transfer, databases). UDP when latency matters more than completeness or messages are small and independent (real-time media, games, DNS), or as a base for custom protocols like QUIC.' },
    { q: 'What is the difference between flow control and congestion control?', a: 'Flow control uses the receiver\'s advertised window so the sender doesn\'t overflow the receiver. Congestion control uses the sender\'s congestion window, adjusted by loss or delay signals, so senders don\'t overload the network path.' },
    { q: 'What is head-of-line blocking?', a: 'In TCP, a single lost segment stops delivery of all later data until it is retransmitted, even if that later data has arrived. HTTP/2 over TCP suffers from it across streams; QUIC avoids it with independent streams.' },
  ],
}

export default lesson
