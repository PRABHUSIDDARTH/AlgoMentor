import type { Lesson } from '../types'

const lesson: Lesson = {
  id: 'sockets',
  title: 'Sockets',
  minutes: 9,
  body: `## The programmer's door into the network

A **socket** is the operating system's interface for network communication. Your program creates a socket, the kernel handles TCP or UDP underneath, and you read and write bytes much like a file. Every web server, database driver and chat app is built on sockets, even when a framework hides them.

A TCP connection is identified by a **4-tuple**: source IP, source port, destination IP, destination port. That is why one server port (say 443) can serve thousands of clients at once: each client connection has a different source address or port, so each is a different socket.

## The server side

A TCP server goes through a fixed sequence of system calls:

1. **socket()**: create a socket.
2. **bind()**: attach it to a local address and port, such as \`0.0.0.0:8080\`.
3. **listen()**: mark it as a listening socket, with a backlog queue for connections the kernel has completed but the program hasn't accepted yet.
4. **accept()**: take the next completed connection. It returns a **new** socket for talking to that client; the listening socket keeps waiting for others.
5. **recv()/send()** on the connected socket, then **close()**.

## The client side

A client needs only **socket()**, then **connect()** to the server's address and port (this is where the three-way handshake happens), then send and receive. The operating system picks an **ephemeral port** for the client side automatically.

## Streams have no message boundaries

TCP is a byte stream, not a sequence of messages. If a client sends "HELLO" and then "WORLD", the server may receive "HELLOWOR" in one read and "LD" in the next. Your protocol must define where messages end: a delimiter such as a newline (HTTP headers end with a blank line), or a **length prefix** before each message. Forgetting this is the most common socket bug, and it often only shows up under load or over real networks, not on localhost.

Similarly, one \`send()\` may not send everything you asked; production code loops until all bytes are written.

## Handling many clients

A server that handles one connection at a time makes every other client wait. There are three main approaches:

- **Thread (or process) per connection**: simple to write; each blocking read only blocks its own thread. Costly with tens of thousands of connections, although lightweight virtual threads (Java 21) and goroutines change that maths.
- **Non-blocking I/O with an event loop**: one thread asks the kernel which sockets are ready (\`select\`, \`poll\`, \`epoll\` on Linux, \`kqueue\` on macOS) and handles only those. This is how Node.js, Nginx and Netty serve huge numbers of connections.
- **Thread pools** behind an event loop for slow work, so the loop never blocks.

## UDP sockets

UDP sockets skip listen, accept and connect. A server binds and calls **recvfrom()**, which returns a datagram plus the sender's address; it replies with **sendto()**. Each datagram is a complete message (boundaries are preserved), but delivery and order are not guaranteed.

## Practical details

Timeouts are essential: a peer that disappears without closing will otherwise hang a blocking read forever. \`SO_REUSEADDR\` lets a restarted server bind its port while old connections sit in TIME_WAIT. And always close sockets: each one holds a file descriptor, and leaking them ends in "too many open files".`,
  quiz: [
    { id: 'sk-1', prompt: 'What does accept() return on a listening TCP socket?', options: ['The client\'s IP address only', 'A new socket connected to that client', 'The same listening socket', 'A UDP datagram'], answer: 1, why: 'The listening socket keeps accepting; each client gets its own connected socket.' },
    { id: 'sk-2', prompt: 'A client sends "HELLO" then "WORLD" over TCP. What can the server\'s reads return?', options: ['Any split of the bytes, such as "HELLOWOR" then "LD"', 'Always exactly "HELLO" then "WORLD"', 'Only the last message', 'An error, because two sends are not allowed'], answer: 0, why: 'TCP is a byte stream; message boundaries must come from your protocol (delimiter or length prefix).' },
    { id: 'sk-3', prompt: 'How can one server port serve thousands of TCP clients at once?', options: ['Each client must use a different server port', 'It can\'t; ports allow one client each', 'The kernel queues clients one at a time', 'Each connection has a unique 4-tuple of addresses and ports'], answer: 3, why: 'Source IP and port differ per client, so each connection is a distinct socket.' },
    { id: 'sk-4', prompt: 'Which Linux mechanism lets one thread efficiently wait on many sockets?', options: ['fork', 'chmod', 'epoll', 'cron'], answer: 2, why: 'epoll reports which sockets are ready, the basis of event-loop servers.' },
    { id: 'sk-5', prompt: 'Which calls does a UDP server use to receive and reply?', options: ['accept and send', 'recvfrom and sendto', 'listen and connect', 'read and fork'], answer: 1, why: 'UDP has no connections; each datagram carries its own source address.' },
  ],
  interview: [
    { q: 'List the system calls for a TCP server and client.', a: 'Server: socket, bind, listen, accept (returns a connected socket), recv/send, close. Client: socket, connect (performs the handshake), send/recv, close.' },
    { q: 'How do you frame messages over TCP?', a: 'Define boundaries in the protocol: a delimiter (newline, blank line) or a length prefix before each message. Read in a loop until a full message is buffered, and write in a loop until all bytes are sent.' },
    { q: 'Thread-per-connection vs event loop?', a: 'Thread-per-connection is simple but each thread costs memory and scheduling, limiting scale. An event loop with epoll handles many connections on few threads but must never block; slow work goes to a pool. Virtual threads narrow the gap.' },
  ],
}

export default lesson
