import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router'
import { describe, expect, it } from 'vitest'
import { TooltipProvider } from '@/components/ui/tooltip'
import { mockMatchMedia } from '../../vitest.setup'
import Landing from './Landing'

function AppProbe() {
  const location = useLocation()
  return <p data-testid="at">{location.pathname + location.search}</p>
}

function renderLanding() {
  return render(
    <TooltipProvider>
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/app" element={<AppProbe />} />
        </Routes>
      </MemoryRouter>
    </TooltipProvider>,
  )
}

describe('Landing', () => {
  it('startFormNavigatesToApp', async () => {
    renderLanding()
    const [input] = screen.getAllByRole('textbox', { name: 'Problem number or statement' })
    await userEvent.type(input, '146')
    await userEvent.click(screen.getAllByRole('button', { name: 'Start solving' })[0])
    expect(screen.getByTestId('at')).toHaveTextContent('/app?q=146')
  })

  it('tryLinkNavigates', async () => {
    renderLanding()
    await userEvent.click(screen.getByRole('link', { name: '146. LRU Cache' }))
    expect(screen.getByTestId('at')).toHaveTextContent('/app?q=146')
  })

  it('navHasNoSignInInPhase1', () => {
    renderLanding()
    expect(screen.queryByRole('link', { name: /sign in/i })).toBeNull()
    expect(screen.queryByRole('button', { name: /sign in/i })).toBeNull()
    expect(screen.getAllByRole('button', { name: 'Theme' }).length).toBeGreaterThan(0)
  })

  it('sceneIsHiddenFromAssistiveTech', () => {
    renderLanding()
    const scene = screen.getByTestId('ds-scene')
    expect(scene).toHaveAttribute('aria-hidden', 'true')
    expect(scene.parentElement?.querySelector('.sr-only')).not.toBeNull()
  })

  it('reducedMotionRendersStaticScene', () => {
    mockMatchMedia((q) => q.includes('prefers-reduced-motion'))
    renderLanding()
    expect(screen.getByTestId('ds-scene').querySelector('[data-animating]')).toBeNull()
  })

  it('animatesSceneWhenMotionAllowed', () => {
    renderLanding()
    expect(screen.getByTestId('ds-scene').querySelector('[data-animating]')).not.toBeNull()
  })

  it('noEmojiInRenderedText', () => {
    renderLanding()
    expect(document.body.textContent ?? '').not.toMatch(/\p{Extended_Pictographic}/u)
  })

  it('heroViewHasOnePrimaryAction', () => {
    renderLanding()
    // "Start solving" is the hero's primary action; the nav CTA must not compete with it.
    for (const cta of screen.getAllByRole('link', { name: 'Get started' })) {
      expect(cta.className).not.toMatch(/bg-sage/)
    }
    expect(screen.getAllByRole('button', { name: 'Start solving' })[0].className).toMatch(/bg-sage/)
  })

  it('tryLinksHaveComfortableHitAreas', () => {
    renderLanding()
    for (const name of ['1. Two Sum', '146. LRU Cache']) {
      expect(screen.getByRole('link', { name }).className).toMatch(/py-1/)
    }
  })

  it('navUsesGooeyNavForPageSections', () => {
    renderLanding()
    const header = screen.getByRole('banner')
    const sections = within(header).getByRole('navigation', { name: 'Page' })
    expect(within(sections).getByRole('link', { name: 'How it works' })).toHaveAttribute('href', '#how')
    expect(within(sections).getByRole('link', { name: 'Integrations' })).toHaveAttribute('href', '#integrations')
    expect(within(sections).getByRole('link', { name: 'FAQ' })).toHaveAttribute('href', '#faq')
    expect(within(header).getByRole('link', { name: 'Get started' })).toHaveAttribute('href', '/app')
  })

  it('logoIsTheTreeMarkWithWordmark', () => {
    renderLanding()
    const home = within(screen.getByRole('banner')).getByRole('link', { name: 'AlgoMentor home' })
    expect(home.querySelector('svg [data-part="leaf"]')).not.toBeNull()
    expect(home).toHaveTextContent('AlgoMentor')
  })

  it('beforeHasADrawnUnderlineNotAMarker', () => {
    renderLanding()
    const h1 = screen.getByRole('heading', { level: 1 })
    expect(h1.querySelector('[data-testid="before-underline"] path')).not.toBeNull()
    expect(h1.innerHTML).not.toContain('linear-gradient')
  })

  it('usesTheFullScreenWidth', () => {
    renderLanding()
    expect(document.body.innerHTML).not.toMatch(/max-w-\[1180px\]/)
  })

  it('thereIsNoFloatingSettingsButtonAnyMore', () => {
    renderLanding()
    expect(screen.queryByRole('button', { name: 'Settings' })).toBeNull()
  })

  it('headlineIsReadableAsOneSentence', () => {
    renderLanding()
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Understand the problem before you see the answer.')
  })
})
