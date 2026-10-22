import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
  children: ReactNode
  /** Defaults to a full page reload, which also fetches fresh assets after a deploy. */
  onReload?: () => void
}

/** Last line of defence: an unexpected error (or a stale chunk after a deploy) shows a reload prompt, not a blank page. */
export class ErrorBoundary extends Component<Props, { failed: boolean }> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('AlgoMentor crashed', error, info.componentStack)
  }

  render() {
    if (!this.state.failed) return this.props.children
    return (
      <main className="grid min-h-screen place-items-center bg-cream px-6 text-ink">
        <div role="alert" className="grid max-w-md gap-3 text-center">
          <h1 className="display text-[26px]">Something went wrong</h1>
          <p className="text-[14px] leading-relaxed text-ink-muted">
            AlgoMentor hit an unexpected error. Reloading usually fixes it, especially right after an update.
          </p>
          <button
            type="button"
            onClick={() => (this.props.onReload ?? (() => window.location.reload()))()}
            className="justify-self-center rounded-md bg-ink px-4 py-2 text-[14px] font-semibold text-cream hover:bg-ink/90"
          >
            Reload
          </button>
        </div>
      </main>
    )
  }
}
