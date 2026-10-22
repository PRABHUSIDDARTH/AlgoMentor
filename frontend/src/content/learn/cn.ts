import type { Track } from './types'

export const CN: Track = {
  id: 'cn',
  title: 'Computer networks',
  short: 'Networks',
  summary: 'How data gets from one machine to another: layers, addresses, TCP and UDP, DNS and HTTP.',
  projects: [],
  modules: [
    {
      id: 'network-models',
      title: 'Models: OSI and TCP/IP',
      minutes: 8,
      body: `## Why layers

Networking is split into **layers** so each one solves one problem and relies on the one below. Your browser speaks HTTP and never thinks about radio signals.

## The TCP/IP model

Four layers are what the internet actually runs: **link**, **internet** (IP), **transport** (TCP, UDP) and **application** (HTTP, DNS). The seven-layer OSI model is a teaching model that splits these further.`,
      quiz: [
        { id: 'nm-1', prompt: 'Which layer does TCP belong to?', options: ['Application', 'Transport', 'Internet', 'Link'], answer: 1, why: 'TCP and UDP are transport protocols: they move data between processes on two hosts.' },
        { id: 'nm-2', prompt: 'Which protocol works at the internet (network) layer?', options: ['HTTP', 'IP', 'TCP', 'Ethernet'], answer: 1, why: 'IP addresses and routes packets between networks.' },
        { id: 'nm-3', prompt: 'How many layers does the OSI model have?', options: ['4', '5', '7', '9'], answer: 2, why: 'Physical, data link, network, transport, session, presentation, application.' },
        { id: 'nm-4', prompt: 'Why are networks designed in layers?', options: ['To make packets larger', 'So each layer solves one problem and can change independently', 'Because hardware requires seven chips', 'To avoid using addresses'], answer: 1, why: 'Layering separates concerns: HTTP works the same over Wi-Fi or Ethernet.' },
        { id: 'nm-5', prompt: 'HTTP and DNS belong to which layer?', options: ['Application', 'Transport', 'Internet', 'Physical'], answer: 0, why: 'They define what applications say to each other.' },
      ],
      interview: [
        { q: 'Name the TCP/IP layers and a protocol at each.', a: 'Link (Ethernet, Wi-Fi), internet (IP), transport (TCP, UDP), application (HTTP, DNS).' },
        { q: 'Why does the OSI model still matter if the internet uses TCP/IP?', a: 'It gives shared vocabulary ("a layer 4 load balancer", "layer 7 routing") and a way to reason about where a problem lives.' },
      ],
    },
  ],
}
