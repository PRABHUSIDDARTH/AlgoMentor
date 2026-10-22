import { lazy } from 'react'
import { Navigate, Route, Routes } from 'react-router'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { MotionProvider } from '@/components/MotionProvider'
import { RootLayout } from '@/components/nav/RootLayout'
import { Toaster } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import Landing from '@/pages/Landing'

// The workspace is split out so the landing page stays small.
const Workspace = lazy(() => import('@/pages/Workspace'))
const Roadmap = lazy(() => import('@/pages/Roadmap'))
const RoadmapStage = lazy(() => import('@/pages/RoadmapStage'))
const Today = lazy(() => import('@/pages/Today'))
const TestRunner = lazy(() => import('@/pages/TestRunner'))
const Level = lazy(() => import('@/pages/Level'))
const Learn = lazy(() => import('@/pages/Learn'))
const LearnTrack = lazy(() => import('@/pages/LearnTrack'))
const Lesson = lazy(() => import('@/pages/Lesson'))
const Project = lazy(() => import('@/pages/Project'))
const GitHub = lazy(() => import('@/pages/GitHub'))
const GitChallenge = lazy(() => import('@/pages/GitChallenge'))
const Resume = lazy(() => import('@/pages/Resume'))
const Tests = lazy(() => import('@/pages/Tests'))
const Projects = lazy(() => import('@/pages/Projects'))
const GitHealth = lazy(() => import('@/pages/GitHealth'))
const LevelCore = lazy(() => import('@/pages/LevelCore'))

export default function App() {
  return (
    <ErrorBoundary>
    <MotionProvider>
    <TooltipProvider delayDuration={300}>
      <Routes>
        <Route element={<RootLayout />}>
          <Route path="/" element={<Landing />} />
          <Route path="/app/*" element={<Workspace />} />
          <Route path="/roadmap" element={<Roadmap />} />
          <Route path="/roadmap/:stageId" element={<RoadmapStage />} />
          <Route path="/today" element={<Today />} />
          <Route path="/test/:testId" element={<TestRunner />} />
          <Route path="/tests" element={<Tests />} />
          <Route path="/level" element={<Level />} />
          <Route path="/level/core" element={<LevelCore />} />
          <Route path="/learn" element={<Learn />} />
          <Route path="/learn/:trackId" element={<LearnTrack />} />
          <Route path="/learn/:trackId/:moduleId" element={<Lesson />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/projects/:projectId" element={<Project />} />
          <Route path="/git" element={<GitHub />} />
          <Route path="/git/health" element={<GitHealth />} />
          <Route path="/git/:challengeId" element={<GitChallenge />} />
          <Route path="/resume" element={<Resume />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
      <Toaster position="bottom-right" />
    </TooltipProvider>
    </MotionProvider>
    </ErrorBoundary>
  )
}
