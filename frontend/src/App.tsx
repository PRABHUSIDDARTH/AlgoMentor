import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { MotionProvider } from '@/components/MotionProvider'
import { SettingsButton } from '@/components/settings/SettingsButton'
import { Toaster } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import Landing from '@/pages/Landing'

// The workspace is split out so the landing page stays small.
const Workspace = lazy(() => import('@/pages/Workspace'))
const ComingSoon = lazy(() => import('@/pages/ComingSoon'))
const Roadmap = lazy(() => import('@/pages/Roadmap'))
const RoadmapStage = lazy(() => import('@/pages/RoadmapStage'))
const Today = lazy(() => import('@/pages/Today'))
const TestRunner = lazy(() => import('@/pages/TestRunner'))
const Level = lazy(() => import('@/pages/Level'))

export default function App() {
  return (
    <ErrorBoundary>
    <MotionProvider>
    <TooltipProvider delayDuration={300}>
      <Suspense fallback={null}>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/app/*" element={<Workspace />} />
          <Route path="/roadmap" element={<Roadmap />} />
          <Route path="/roadmap/:stageId" element={<RoadmapStage />} />
          <Route path="/today" element={<Today />} />
          <Route path="/test/:testId" element={<TestRunner />} />
          <Route path="/level" element={<Level />} />
          <Route path="/learn/*" element={<ComingSoon title="Learn" />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
      <SettingsButton />
      <Toaster position="bottom-right" />
    </TooltipProvider>
    </MotionProvider>
    </ErrorBoundary>
  )
}
