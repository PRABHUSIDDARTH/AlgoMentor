import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { TooltipProvider } from '@/components/ui/tooltip'
import type { Problem } from '@/lib/api'
import { HISTORY_KEY, type HistoryEntry } from '@/lib/history'
import Workspace from './Workspace'

const api = vi.hoisted(() => ({ askStream: vi.fn(), fetchProblem: vi.fn() }))
vi.mock('@/lib/api', async (importOriginal) => ({ ...(await importOriginal<typeof import('@/lib/api')>()), ...api }))
const { ApiError } = await import('@/lib/api')

const LRU: Problem = {
  number: '146', title: 'LRU Cache', slug: 'lru-cache', difficulty: 'Medium', tags: ['Hash Table', 'Linked List', 'Design'],
  url: 'https://leetcode.com/problems/lru-cache/', statement: 'Design a data structure that follows the constraints of an **LRU cache**.',
}

function renderAt(path: string) {
  return render(
    <TooltipProvider>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/app" element={<Workspace />} />
        </Routes>
      </MemoryRouter>
    </TooltipProvider>,
  )
}

function saved(entries: Partial<HistoryEntry>[]) {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(entries.map((e, i) => ({
    key: `k${i}`, source: 'leetcode', title: 'T', status: 'started', hintsUsed: 0, hints: [], updatedAt: 100 - i, ...e,
  }))))
}

beforeEach(() => {
  api.fetchProblem.mockResolvedValue(LRU)
  api.askStream.mockReturnValue(new Promise(() => {}))
})

afterEach(() => {
  vi.restoreAllMocks()
  localStorage.clear()
})

describe('Workspace', () => {
  it('emptyStateShowsStarterGroups', () => {
    renderAt('/app')
    expect(screen.getByRole('heading', { name: 'What are we solving today?' })).toBeInTheDocument()
    for (const group of ['Arrays and hashing', 'Linked lists and design', 'Graphs']) {
      expect(screen.getByRole('heading', { name: group })).toBeInTheDocument()
    }
    for (const n of ['1', '49', '206', '146', '200', '207']) {
      expect(screen.getByRole('button', { name: new RegExp(`^${n}\\. `) })).toBeInTheDocument()
    }
  })

  it('starterProblemOpensIt', async () => {
    renderAt('/app')
    await userEvent.click(screen.getByRole('button', { name: /^146\. LRU Cache/ }))
    expect(api.fetchProblem).toHaveBeenCalledWith('146', expect.any(AbortSignal))
    expect(await screen.findByRole('heading', { name: '146. LRU Cache', level: 1 })).toBeInTheDocument()
  })

  it('queryParamOpensProblem', async () => {
    renderAt('/app?q=146')
    expect(await screen.findByRole('heading', { name: '146. LRU Cache', level: 1 })).toBeInTheDocument()
    expect(api.fetchProblem).toHaveBeenCalledWith('146', expect.any(AbortSignal))
  })

  it('sidebarListsHistoryWithStatusLine', () => {
    saved([{ title: '146. LRU Cache', status: 'hints', hintsUsed: 2, difficulty: 'Medium' }, { title: '1. Two Sum', status: 'solved', difficulty: 'Easy' }])
    renderAt('/app')
    const recent = screen.getByRole('complementary', { name: 'Recent problems' })
    expect(within(recent).getByRole('button', { name: /146\. LRU Cache.*Hint 2 of 4/ })).toBeInTheDocument()
    expect(within(recent).getByRole('button', { name: /1\. Two Sum.*Solved/ })).toBeInTheDocument()
  })

  it('historyOffMessageWhenStorageUnavailable', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new DOMException('blocked', 'SecurityError')
    })
    renderAt('/app')
    expect(screen.getByText('History is off in this browser')).toBeInTheDocument()
  })

  it('ctrlKOpensJumpPalette', async () => {
    renderAt('/app')
    await userEvent.keyboard('{Control>}k{/Control}')
    const dialog = await screen.findByRole('dialog')
    await userEvent.type(within(dialog).getByRole('combobox'), '146')
    await userEvent.click(await within(dialog).findByText('Open LeetCode #146'))
    expect(await screen.findByRole('heading', { name: '146. LRU Cache', level: 1 })).toBeInTheDocument()
  })

  it('editStatementSwapsToTextarea', async () => {
    renderAt('/app?q=146')
    await screen.findByRole('heading', { name: '146. LRU Cache', level: 1 })
    await userEvent.click(screen.getByRole('button', { name: 'Edit statement' }))
    const box = screen.getByRole('textbox', { name: 'Problem statement' })
    await userEvent.clear(box)
    await userEvent.type(box, 'A smaller cache.')
    await userEvent.click(screen.getByRole('button', { name: 'Save statement' }))
    expect(screen.getByText('A smaller cache.')).toBeInTheDocument()
  })

  it('problemMetaUsesPlainSeparators', async () => {
    renderAt('/app?q=146')
    await screen.findByRole('heading', { name: '146. LRU Cache', level: 1 })
    const meta = screen.getByTestId('problem-meta')
    expect(meta).toHaveTextContent('Medium')
    expect(meta).toHaveTextContent('Hash Table · Linked List · Design')
    expect(meta.querySelector('[class*="badge"], [role="status"]')).toBeNull()
    expect(within(meta).getByRole('link', { name: /View on LeetCode/ })).toHaveAttribute('href', LRU.url)
  })

  it('appNavHidesPhase2Links', () => {
    renderAt('/app')
    for (const name of [/progress/i, /connections/i, /sign in/i]) {
      expect(screen.queryByRole('link', { name })).toBeNull()
    }
    expect(screen.getByRole('button', { name: 'Theme' })).toBeInTheDocument()
  })

  it('lookupErrorKeepsInput', async () => {
    api.fetchProblem.mockRejectedValue(new ApiError(404, 'Couldn’t find LeetCode problem #99999.'))
    renderAt('/app')
    const input = screen.getByRole('textbox', { name: 'Problem number or statement' })
    await userEvent.type(input, '99999')
    await userEvent.click(screen.getByRole('button', { name: 'Start' }))
    expect(await screen.findByText('Couldn’t find LeetCode problem #99999.')).toBeInTheDocument()
    expect(input).toHaveValue('99999')
  })

  it('fillsTheViewportWithIndependentlyScrollingPanes', async () => {
    renderAt('/app?q=146')
    await screen.findByRole('heading', { name: '146. LRU Cache', level: 1 })
    expect(screen.getByTestId('workspace-shell').className).toMatch(/md:h-dvh/)
    expect(screen.getByTestId('problem-scroll').className).toMatch(/overflow-y-auto/)
    expect(screen.getByTestId('mentor-scroll').className).toMatch(/overflow-y-auto/)
  })

  it('emptyStateUsesTheWidth', () => {
    renderAt('/app')
    expect(screen.getByTestId('starter-groups').className).toMatch(/lg:grid-cols-3/)
  })

  it('hasLandmarksAndSkipLink', () => {
    renderAt('/app')
    expect(screen.getByRole('main')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Skip to content' })).toHaveAttribute('href', '#main')
    expect(screen.getByRole('navigation', { name: 'App' })).toBeInTheDocument()
  })
})

void waitFor
