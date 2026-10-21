import { useEffect, useRef, useState, type RefObject } from 'react'

const QUERY = '(prefers-reduced-motion: reduce)'

/** Live "reduce motion" setting from the OS. */
export function usePrefersReducedMotion(): boolean {
  const [reduce, setReduce] = useState(() => typeof matchMedia === 'function' && matchMedia(QUERY).matches)
  useEffect(() => {
    if (typeof matchMedia !== 'function') return
    const query = matchMedia(QUERY)
    const onChange = () => setReduce(query.matches)
    query.addEventListener?.('change', onChange)
    return () => query.removeEventListener?.('change', onChange)
  }, [])
  return reduce
}

/** Whether the element is on screen; assumes visible until the observer reports otherwise. */
export function useOnScreen<T extends Element>(): [RefObject<T | null>, boolean] {
  const ref = useRef<T>(null)
  const [visible, setVisible] = useState(true)
  useEffect(() => {
    const el = ref.current
    if (!el || typeof IntersectionObserver === 'undefined') return
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { threshold: 0 })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])
  return [ref, visible]
}
