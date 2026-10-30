import type { Tier } from '@/practice/store'

export type Weight = 0 | 1 | 2 | 3

export const STAGE_GROUP_IDS = ['foundations', 'recursion', 'linear', 'trees', 'greedy', 'graphs-dp', 'tries-bits', 'mixed'] as const
export type StageGroupId = (typeof STAGE_GROUP_IDS)[number]

/** Spec §4: how much each tier cares about each group of roadmap stages. */
export const STAGE_GROUPS: { id: StageGroupId; stages: string[]; weight: Record<Tier, Weight> }[] = [
  { id: 'foundations', stages: ['basics', 'arrays', 'hashing', 'strings', 'search-sort'], weight: { maang: 2, product: 3, startup: 3, service: 3 } },
  { id: 'recursion', stages: ['recursion'], weight: { maang: 2, product: 2, startup: 2, service: 2 } },
  { id: 'linear', stages: ['linked-lists', 'stacks-queues', 'sliding-window'], weight: { maang: 3, product: 3, startup: 3, service: 2 } },
  { id: 'trees', stages: ['trees', 'bst', 'heaps'], weight: { maang: 3, product: 3, startup: 2, service: 1 } },
  { id: 'greedy', stages: ['greedy'], weight: { maang: 2, product: 2, startup: 2, service: 1 } },
  { id: 'graphs-dp', stages: ['graphs', 'dp'], weight: { maang: 3, product: 2, startup: 2, service: 1 } },
  { id: 'tries-bits', stages: ['tries', 'bits'], weight: { maang: 2, product: 1, startup: 1, service: 1 } },
  { id: 'mixed', stages: ['mixed'], weight: { maang: 3, product: 2, startup: 2, service: 1 } },
]
