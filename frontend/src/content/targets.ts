import type { Focus, Role, Target, Tier } from '@/practice/store'
import { employerFor } from './companies'
import { STAGE_GROUPS, type Weight } from './stageGroups'

export type { Weight }

const stageWeights = (tier: Tier): Record<string, Weight> => Object.fromEntries(STAGE_GROUPS.flatMap((g) => g.stages.map((s) => [s, g.weight[tier]])))

export const TARGET_WEIGHTS: Record<Tier, Record<string, Weight>> = {
  maang: stageWeights('maang'),
  product: stageWeights('product'),
  startup: stageWeights('startup'),
  service: stageWeights('service'),
}

/** Stage weights for a target: the tier's, with the chosen employer's own emphasis laid over them. */
export function weightsFor(target: Target): Record<string, Weight> {
  const base = TARGET_WEIGHTS[target.company]
  const emphasis = employerFor(target)?.emphasis
  if (!emphasis) return base
  const out = { ...base }
  for (const g of STAGE_GROUPS) {
    const w = emphasis[g.id]
    if (w !== undefined) for (const s of g.stages) out[s] = w
  }
  return out
}

export const ROLE_MULTIPLIER: Record<Role, number> = { intern: 0.8, sde1: 1, sde2: 1.2, sde3: 1.35 }

export const READINESS_BAR: Record<Tier, Record<Role, number>> = {
  maang: { intern: 65, sde1: 80, sde2: 90, sde3: 95 },
  product: { intern: 58, sde1: 72, sde2: 82, sde3: 90 },
  startup: { intern: 55, sde1: 65, sde2: 75, sde3: 85 },
  service: { intern: 40, sde1: 50, sde2: 60, sde3: 70 },
}

/** Spec §7 (Learning hub): the Core CS score that counts as fully ready, by tier. */
export const CORE_BAR: Record<Tier, number> = { maang: 70, product: 65, startup: 60, service: 75 }

export const TIER_LABEL: Record<Tier, string> = { maang: 'MAANG', product: 'Big tech and product', startup: 'Startups', service: 'Service and IT consulting' }
export const ROLE_LABEL: Record<Role, string> = { intern: 'Intern', sde1: 'SDE-1', sde2: 'SDE-2', sde3: 'Senior SDE' }

export const FOCUS_LABEL: Record<Focus, string> = {
  general: 'General', backend: 'Backend', frontend: 'Frontend', fullstack: 'Full stack', mobile: 'Mobile', data: 'Data', devops: 'DevOps and SRE', sdet: 'Test and QA',
}

/** The "no specific company" choice in the company list, worded for the tier. */
export const ANY_COMPANY_LABEL: Record<Tier, string> = {
  maang: 'Any MAANG company', product: 'Any big tech or product company', startup: 'Any startup', service: 'Any service company',
}

/** What to call the target: the employer when one is chosen for this tier, otherwise the tier. */
export function targetName(target: Target): string {
  return employerFor(target)?.name ?? TIER_LABEL[target.company]
}
