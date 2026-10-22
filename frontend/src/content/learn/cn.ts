import models from './cn/01-network-models'
import physical from './cn/02-physical-data-link'
import ip from './cn/03-ip-subnetting'
import routing from './cn/04-routing'
import tcpUdp from './cn/05-tcp-udp'
import dns from './cn/06-dns'
import http from './cn/07-http-tls'
import sockets from './cn/08-sockets'
import edge from './cn/09-cdn-lb-nat'
import url from './cn/10-type-a-url'
import type { Track } from './types'

export const CN: Track = {
  id: 'cn',
  title: 'Computer networks',
  short: 'Networks',
  summary: 'How data gets from one machine to another: layers, addresses, routing, TCP and UDP, DNS, HTTP and TLS.',
  projects: ['tcp-chat', 'http-server', 'dns-resolver'],
  modules: [models, physical, ip, routing, tcpUdp, dns, http, sockets, edge, url],
}
