import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { useActiveSection } from './useActiveSection'

function section(id: string, top: number) {
  const el = document.createElement('section')
  el.id = id
  el.getBoundingClientRect = () => ({ top, bottom: top + 400, left: 0, right: 0, width: 0, height: 400, x: 0, y: top, toJSON() {} })
  document.body.appendChild(el)
}

function scrollTo(y: number, pageHeight: number) {
  Object.defineProperty(window, 'scrollY', { value: y, configurable: true })
  Object.defineProperty(window, 'innerHeight', { value: 800, configurable: true })
  Object.defineProperty(document.documentElement, 'scrollHeight', { value: pageHeight, configurable: true })
  window.dispatchEvent(new Event('scroll'))
}

afterEach(() => (document.body.innerHTML = ''))

describe('useActiveSection', () => {
  it('picks the last section whose top has passed the offset', () => {
    section('a', -500); section('b', 60); section('c', 900)
    const { result } = renderHook(() => useActiveSection(['a', 'b', 'c']))
    act(() => scrollTo(1000, 4000))
    expect(result.current).toBe(1)
  })

  it('activates the last section at the bottom of the page even if its top never reaches the offset', () => {
    // FAQ is short: at the very bottom its top is still far below the nav.
    section('a', -2000); section('b', -900); section('c', 420)
    const { result } = renderHook(() => useActiveSection(['a', 'b', 'c']))
    act(() => scrollTo(3200, 4000))
    expect(result.current).toBe(2)
  })
})
