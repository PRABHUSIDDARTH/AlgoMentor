import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { MotionProvider } from '@/components/MotionProvider'
import { Toaster } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import Landing from '@/pages/Landing'

// The workspace is split out so the landing page stays small.
const Workspace = lazy(() => import('@/pages/Workspace'))

export default function App() {
  return (
    <ErrorBoundary>
    <MotionProvider>
    <TooltipProvider delayDuration={300}>
      <Suspense fallback={null}>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/app/*" element={<Workspace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
      <Toaster position="bottom-right" />
    </TooltipProvider>
    </MotionProvider>
    </ErrorBoundary>
  )
}
