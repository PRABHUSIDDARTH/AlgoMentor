import classesObjects from './oop/01-classes-objects'
import encapsulation from './oop/02-encapsulation'
import inheritance from './oop/03-inheritance'
import polymorphism from './oop/04-polymorphism'
import abstraction from './oop/05-abstraction-interfaces'
import solid from './oop/06-solid'
import composition from './oop/07-composition'
import patterns from './oop/08-design-patterns'
import uml from './oop/09-uml'
import interviews from './oop/10-oop-interviews'
import type { Track } from './types'

export const OOP: Track = {
  id: 'oop',
  title: 'Object-oriented programming',
  short: 'OOP',
  summary: 'Model programs as objects that own their data and behaviour, then design them so they stay easy to change.',
  projects: [],
  modules: [classesObjects, encapsulation, inheritance, polymorphism, abstraction, solid, composition, patterns, uml, interviews],
}
