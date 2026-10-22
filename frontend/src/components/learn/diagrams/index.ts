import type { ComponentType } from 'react'
import { ClassObject } from './ClassObject'
import { BPlusTree, CapTriangle, ErLibrary, JoinKinds, NormaliseSplit } from './dbms'
import { EdgePath, LayerStack, SubnetSplit, TcpHandshake, TlsHandshake } from './cn'
import { DeadlockCycle, GanttSchedule, InodeLayout, Paging, ProcessStates } from './os'
import { Composition, InheritanceTree, InterfaceImpl, UmlNotation } from './oop'

/** Inline SVG diagrams by id. Each draws with palette tokens and carries its own role="img" and aria-label. */
export const DIAGRAMS: Record<string, ComponentType> = {
  'class-object': ClassObject,
  'inheritance-tree': InheritanceTree,
  'interface-impl': InterfaceImpl,
  composition: Composition,
  'uml-notation': UmlNotation,
  'layer-stack': LayerStack,
  'subnet-split': SubnetSplit,
  'tcp-handshake': TcpHandshake,
  'tls-handshake': TlsHandshake,
  'edge-path': EdgePath,
  'er-library': ErLibrary,
  'join-kinds': JoinKinds,
  'normalise-split': NormaliseSplit,
  'bplus-tree': BPlusTree,
  'cap-triangle': CapTriangle,
  'process-states': ProcessStates,
  'gantt-schedule': GanttSchedule,
  'deadlock-cycle': DeadlockCycle,
  paging: Paging,
  'inode-layout': InodeLayout,
}
