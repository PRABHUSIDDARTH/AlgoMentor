import { m } from 'motion/react'
import { useOnScreen, usePrefersReducedMotion } from '@/hooks/useMotionPrefs'

/** Spec section 5: a swaying pseudo-3D stage with four data structures on their own depth layers. */
const CYCLE = 8.4
const NODE_STAGGER = 0.9
const SWAY = 14
const STATIC_STEP = 2 // reduced motion: BFS frozen at step 3 (third node current)

const NODES = [
  { x: 165, y: 22, v: 8 },
  { x: 85, y: 100, v: 3 },
  { x: 245, y: 100, v: 10 },
  { x: 40, y: 180, v: 1 },
  { x: 125, y: 180, v: 6 },
  { x: 205, y: 180, v: 14 },
  { x: 290, y: 180, v: 17 },
]
const EDGES: [number, number][] = [[0, 1], [0, 2], [1, 3], [1, 4], [2, 5], [2, 6]]
const ARRAY = [2, 7, 11, 15, 19, 24]
const STACK = [4, 8, 3]
const LIST = [4, 9, 12]

const loop = { duration: CYCLE, repeat: Infinity, ease: 'linear' as const }

function TreeNode({ i, animate }: { i: number; animate: boolean }) {
  const n = NODES[i]
  const d = (i * NODE_STAGGER) / CYCLE
  const base = 'absolute inset-0 grid place-items-center rounded-full font-mono text-[13px] font-medium'
  const staticVisited = i < STATIC_STEP
  const staticCurrent = i === STATIC_STEP
  return (
    <div className="absolute size-10 -translate-x-1/2 -translate-y-1/2" style={{ left: n.x, top: n.y }}>
      <div className={`${base} bg-ink text-cream shadow-[0_10px_24px_-10px_rgb(0_0_0/0.55)]`}>{n.v}</div>
      <m.div
        className={`${base} bg-ink-muted text-cream`}
        data-animating={animate || undefined}
        animate={animate ? { opacity: [0, 0, 1, 1, 0, 0] } : { opacity: staticVisited ? 1 : 0 }}
        transition={animate ? { ...loop, times: [0, d + 0.08, d + 0.1, 0.92, 0.96, 1] } : { duration: 0 }}
      >
        {n.v}
      </m.div>
      <m.div
        className={`${base} bg-sage text-on-sage`}
        data-animating={animate || undefined}
        animate={animate ? { opacity: [0, 0, 1, 1, 0, 0], scale: [1, 1, 1.14, 1.14, 1, 1] } : { opacity: staticCurrent ? 1 : 0, scale: staticCurrent ? 1.14 : 1 }}
        transition={animate ? { ...loop, times: [0, d, d + 0.02, d + 0.08, d + 0.1, 1] } : { duration: 0 }}
      >
        {n.v}
      </m.div>
    </div>
  )
}

export function DataStructureScene() {
  const reduce = usePrefersReducedMotion()
  const [ref, onScreen] = useOnScreen<HTMLDivElement>()
  const animate = !reduce && onScreen

  return (
    <div className="relative">
      <p className="sr-only">
        Illustration: a binary tree visited in breadth-first order, two pointers moving through a sorted array, a value
        pushed onto a stack, and a linked list.
      </p>
      <div ref={ref} data-testid="ds-scene" aria-hidden="true" className="relative h-[330px] origin-top scale-[0.82] [perspective:1100px] sm:h-[380px] sm:scale-100">
        <m.div
          className="absolute inset-0 [transform-style:preserve-3d]"
          data-animating={animate || undefined}
          animate={animate ? { rotateX: [14, 8], rotateY: [-22, 22] } : { rotateX: 11, rotateY: 0 }}
          transition={animate ? { duration: SWAY, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' } : { duration: 0 }}
        >
          {/* sorted array with two pointers, far back */}
          <div className="absolute -left-[16%] -top-6 hidden origin-top-left [transform:translateZ(-160px)_rotateY(18deg)_scale(0.85)] sm:block">
            <div className="flex">
              {ARRAY.map((v) => (
                <div key={v} className="-ml-px grid size-[30px] place-items-center border border-ink/60 bg-grey font-mono text-[12px] first:ml-0">{v}</div>
              ))}
            </div>
            <m.span
              className="absolute top-9 left-1.5 font-mono text-[11px]"
              data-animating={animate || undefined}
              animate={animate ? { x: [0, 60, 0] } : { x: 30 }}
              transition={animate ? { ...loop, ease: 'easeInOut' } : { duration: 0 }}
            >▲ l</m.span>
            <m.span
              className="absolute top-9 left-[156px] font-mono text-[11px]"
              data-animating={animate || undefined}
              animate={animate ? { x: [0, -60, 0] } : { x: -30 }}
              transition={animate ? { ...loop, ease: 'easeInOut' } : { duration: 0 }}
            >▲ r</m.span>
          </div>

          {/* stack, right */}
          <div className="absolute right-0 top-0 w-[70px] [transform:translateZ(-110px)_rotateY(-16deg)]">
            <m.div
              className="grid h-6 place-items-center border border-b-0 border-ink/60 bg-grey font-mono text-[11px]"
              data-animating={animate || undefined}
              animate={animate ? { opacity: [0, 0, 1, 1, 0], y: [-14, -14, 0, 0, 0] } : { opacity: 1, y: 0 }}
              transition={animate ? { ...loop, times: [0, 0.3, 0.38, 0.92, 1] } : { duration: 0 }}
            >push 9</m.div>
            {STACK.map((v, i) => (
              <div key={v} className={`grid h-6 place-items-center border border-ink/60 bg-grey font-mono text-[11px] ${i === STACK.length - 1 ? 'border-b-2 border-b-ink' : 'border-b-0'}`}>{v}</div>
            ))}
          </div>

          {/* binary tree, front */}
          <div className="absolute left-1/2 top-11 h-[210px] w-[330px] -ml-[165px] [transform:translateZ(40px)]">
            <svg viewBox="0 0 330 210" className="absolute inset-0 overflow-visible">
              {EDGES.map(([a, b]) => (
                <line key={`${a}-${b}`} x1={NODES[a].x} y1={NODES[a].y} x2={NODES[b].x} y2={NODES[b].y} stroke="var(--ink)" strokeWidth="1.5" opacity="0.45" />
              ))}
            </svg>
            {NODES.map((_, i) => <TreeNode key={i} i={i} animate={animate} />)}
          </div>

          {/* linked list, below */}
          <div className="absolute left-1/2 top-[268px] -ml-[190px] flex items-center [transform:translateZ(-60px)_rotateX(8deg)]">
            <m.div
              className="flex h-[34px] w-[54px] rounded-[5px] border-[1.5px] border-ink bg-grey font-mono text-[12px]"
              data-animating={animate || undefined}
              animate={animate ? { boxShadow: ['0 0 0 0px var(--sage)', '0 0 0 0px var(--sage)', '0 0 0 3px var(--sage)', '0 0 0 3px var(--sage)', '0 0 0 0px var(--sage)'] } : { boxShadow: '0 0 0 0px var(--sage)' }}
              transition={animate ? { ...loop, times: [0, 0.6, 0.7, 0.9, 1] } : { duration: 0 }}
            >
              <b className="grid flex-1 place-items-center font-medium">head</b><i className="w-3.5 border-l-[1.5px] border-ink bg-sand" />
            </m.div>
            {LIST.map((v) => (
              <div key={v} className="flex items-center">
                <span className="relative h-[1.5px] w-[22px] bg-ink after:absolute after:-right-px after:-top-[3.5px] after:border-y-4 after:border-l-[6px] after:border-y-transparent after:border-l-ink" />
                <div className="flex h-[34px] w-[54px] rounded-[5px] border-[1.5px] border-ink bg-grey font-mono text-[12px]">
                  <b className="grid flex-1 place-items-center font-medium">{v}</b><i className="w-3.5 border-l-[1.5px] border-ink bg-sand" />
                </div>
              </div>
            ))}
            <span className="relative h-[1.5px] w-[22px] bg-ink" />
            <div className="grid h-[34px] w-[54px] place-items-center rounded-[5px] border-[1.5px] border-dashed border-ink font-mono text-[12px]">null</div>
          </div>
        </m.div>
      </div>
      <p aria-hidden="true" className="mt-1 text-center font-mono text-[11px] text-ink-muted">
        breadth-first traversal · two pointers · stack push · linked list
      </p>
    </div>
  )
}
