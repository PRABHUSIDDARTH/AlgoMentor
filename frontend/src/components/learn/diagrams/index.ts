import type { ComponentType } from 'react'
import { ClassObject } from './ClassObject'

/** Inline SVG diagrams by id. Each draws with palette tokens and carries its own role="img" and aria-label. */
export const DIAGRAMS: Record<string, ComponentType> = {
  'class-object': ClassObject,
}
