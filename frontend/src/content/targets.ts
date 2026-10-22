import type { Company, Role } from '@/practice/store'

type Weight = 0 | 1 | 2 | 3

// Spec §4: how much each target cares about each stage group.
const GROUPS: { stages: string[]; weight: Record<Company, Weight> }[] = [
  { stages: ['basics', 'arrays', 'hashing', 'strings', 'search-sort'], weight: { faang: 2, startup: 3, service: 3 } },
  { stages: ['recursion'], weight: { faang: 2, startup: 2, service: 2 } },
  { stages: ['linked-lists', 'stacks-queues', 'sliding-window'], weight: { faang: 3, startup: 3, service: 2 } },
  { stages: ['trees', 'bst', 'heaps'], weight: { faang: 3, startup: 2, service: 1 } },
  { stages: ['greedy'], weight: { faang: 2, startup: 2, service: 1 } },
  { stages: ['graphs', 'dp'], weight: { faang: 3, startup: 2, service: 1 } },
  { stages: ['tries', 'bits'], weight: { faang: 2, startup: 1, service: 1 } },
  { stages: ['mixed'], weight: { faang: 3, startup: 2, service: 1 } },
]

export const TARGET_WEIGHTS = Object.fromEntries(
  (['faang', 'startup', 'service'] as const).map((c) => [c, Object.fromEntries(GROUPS.flatMap((g) => g.stages.map((s) => [s, g.weight[c]])))]),
) as Record<Company, Record<string, Weight>>

export const ROLE_MULTIPLIER: Record<Role, number> = { intern: 0.8, sde1: 1, sde2: 1.2 }

export const READINESS_BAR: Record<Company, Record<Role, number>> = {
  faang: { sde1: 80, intern: 65, sde2: 90 },
  startup: { sde1: 65, intern: 55, sde2: 75 },
  service: { sde1: 50, intern: 40, sde2: 60 },
}

export const COMPANY_LABEL: Record<Company, string> = { faang: 'FAANG / product', startup: 'Startup', service: 'Service company' }
export const ROLE_LABEL: Record<Role, string> = { intern: 'Intern', sde1: 'SDE-1', sde2: 'SDE-2' }
