import type { Lesson } from '../types'

const lesson: Lesson = {
  id: 'http-tls',
  title: 'HTTP/HTTPS & TLS',
  minutes: 11,
  diagram: 'tls-handshake',
  hook: 'A payment request times out, the app retries, and the customer is charged twice. The network did nothing wrong; the team simply did not know which HTTP methods are safe to repeat. A few rules about methods, status codes and TLS decide whether a retry is harmless.',
  keyPoints: [
    'HTTP is stateless: a request is a method, path, headers and optional body, and state travels in cookies or headers.',
    'GET, PUT and DELETE are idempotent while POST is not, so retrying a POST needs an idempotency key.',
    'Status families: 2xx success, 3xx redirect, 4xx client error, 5xx server error; 401 and 403 mean different things.',
    'TLS 1.3 agrees keys with Diffie-Hellman in one round trip, then encrypts data with a fast symmetric cipher.',
  ],
  body: `## HTTP: requests and responses

**HTTP** is the application protocol of the web. A client sends a **request**: a method, a path, headers and an optional body. The server returns a **response**: a status code, headers and an optional body. HTTP is **stateless**: each request stands alone, and anything like a login session is carried explicitly, usually in a cookie or an \`Authorization\` header.

## Methods and their meaning

- **GET** reads a resource. It must not change anything.
- **POST** creates something or triggers an action.
- **PUT** replaces a resource; **PATCH** changes part of it.
- **DELETE** removes it.

Two properties matter in API design. A **safe** method doesn't change state (GET, HEAD). An **idempotent** method has the same effect whether you send it once or five times (GET, PUT, DELETE). POST is neither, which is why retrying a failed "pay" POST can charge twice unless the API accepts an idempotency key.

> [!TRY] Delete it twice
> A client sends DELETE /orders/42 twice in a row. The first call returns 204. What can the second return, and is DELETE still idempotent?
>
> ---
>
> Usually 404, because the order is already gone. DELETE is still idempotent: the term is about the server's state after the calls (order 42 does not exist), not about getting identical responses.

## Status codes by family

- **2xx success**: 200 OK, 201 Created, 204 No Content.
- **3xx redirection**: 301 moved permanently, 302/307 temporarily, 304 not modified (use your cache).
- **4xx client error**: 400 bad request, 401 not authenticated, 403 authenticated but not allowed, 404 not found, 429 too many requests.
- **5xx server error**: 500 internal error, 502 bad gateway, 503 unavailable, 504 gateway timeout.

Knowing 401 vs 403 and 502 vs 504 precisely is a common interview check.

> [!GOTCHA] 401 and 403 are not interchangeable
> Answering 403 for a missing login leaves clients unable to tell whether to ask the user to sign in. Use 401 when credentials are missing or invalid, and 403 when the caller is known but not allowed. Likewise 502 means a bad answer from upstream, 504 means upstream timed out.

## Versions

**HTTP/1.1** sends one request at a time per connection; browsers open several connections to fetch pages faster. **HTTP/2** multiplexes many requests over one TCP connection with binary framing and header compression, but a lost TCP segment still stalls every stream. **HTTP/3** runs over QUIC on UDP, so streams are independent and connections set up faster.

## HTTPS: HTTP inside TLS

Plain HTTP travels as readable text: anyone on the path can read or alter it. **HTTPS** is HTTP sent through **TLS**, which provides three guarantees:

- **Confidentiality**: the content is encrypted.
- **Integrity**: tampering is detected.
- **Authentication**: you are really talking to the server named in the URL.

## The TLS 1.3 handshake

1. The client sends **ClientHello**: supported cipher suites and a key share for key exchange.
2. The server replies with **ServerHello** and its own key share. Both sides now compute the same session keys using (elliptic-curve) Diffie-Hellman, without ever sending the key itself.
3. The server sends its **certificate** and proves it holds the matching private key by signing the handshake.
4. Both send **Finished** messages and switch to fast symmetric encryption (such as AES-GCM) for the data.

TLS 1.3 completes this in one round trip, and resumed sessions can even send data immediately. Asymmetric cryptography is only used to agree keys and authenticate; bulk data uses symmetric ciphers because they are much faster.

> [!KEY] Asymmetric to agree, symmetric to talk
> Public-key maths is used once, to agree on keys and prove the server's identity. After the handshake the data is encrypted with a symmetric cipher such as AES-GCM, because it is far faster.

## Certificates and trust

A certificate binds a domain name to a public key and is signed by a **certificate authority** (CA). Your browser trusts a set of root CAs and checks the chain from the site's certificate up to one of them, plus the name, expiry date and revocation status. An expired certificate is one of the most common causes of production outages, which is why automated issuers like Let's Encrypt renew certificates every few weeks.

> [!INTERVIEW] Walk through HTTPS in order
> Give the sequence: hellos and key shares, certificate checked against a CA chain, shared session keys, symmetric encryption. Saying what the certificate proves (that the key belongs to that domain) and that public-key crypto is only for setup separates good answers from recited ones.

## Cookies, caching and headers worth knowing

\`Set-Cookie\` with \`HttpOnly\`, \`Secure\` and \`SameSite\` flags keeps session cookies away from scripts, plain HTTP and cross-site requests. \`Cache-Control\` tells browsers and CDNs how long a response may be reused. \`ETag\` lets clients ask "has this changed?" and get a cheap 304 when it hasn't.`,
  quiz: [
    { id: 'ht-1', prompt: 'Which HTTP method is idempotent but not safe?', options: ['GET', 'POST', 'HEAD', 'PUT'], answer: 3, why: 'PUT changes state (not safe) but repeating it leaves the same result (idempotent).' },
    { id: 'ht-2', prompt: 'A logged-in user requests an admin page they are not allowed to see. The right status is:', options: ['401 Unauthorized', '404 Not Found', '403 Forbidden', '500 Internal Server Error'], answer: 2, why: '401 means not authenticated; 403 means authenticated but not permitted.' },
    { id: 'ht-3', prompt: 'In TLS, how do client and server agree on session keys without sending them?', options: ['The server emails the key', 'Diffie-Hellman key exchange using key shares in the hello messages', 'They use the certificate as the key', 'The key is hard-coded in the browser'], answer: 1, why: 'Each side combines its private value with the other\'s key share to compute the same secret.' },
    { id: 'ht-4', prompt: 'What does the server certificate prove?', options: ['That the public key belongs to the domain, vouched for by a trusted CA', 'That the server is fast', 'That the connection uses HTTP/2', 'That cookies are secure'], answer: 0, why: 'The CA signature binds the domain name to the key; the server then proves it holds the private key.' },
    { id: 'ht-5', prompt: 'What is the main advantage of HTTP/3 over HTTP/2?', options: ['It uses XML', 'It allows only one request per connection', 'It removes encryption', 'It runs over QUIC, so one lost packet doesn\'t stall every stream'], answer: 3, why: 'HTTP/2 over TCP has head-of-line blocking across streams; QUIC streams are independent.' },
  ],
  interview: [
    { q: 'What happens in a TLS 1.3 handshake?', a: 'ClientHello with cipher suites and a key share; ServerHello with its key share; both derive session keys via ECDHE; the server sends its certificate and a signature proving key ownership; both send Finished; data then flows with symmetric encryption. One round trip.' },
    { q: 'What makes an API call idempotent, and why does it matter?', a: 'Repeating it has the same effect as doing it once (GET, PUT, DELETE). It makes retries after timeouts safe. For non-idempotent operations like payments, APIs accept an idempotency key so duplicates are detected.' },
    { q: 'Why does TLS use both asymmetric and symmetric cryptography?', a: 'Asymmetric crypto solves key agreement and authentication between strangers but is slow; symmetric ciphers are fast for bulk data. TLS uses the first to set up keys for the second.' },
  ],
}

export default lesson
