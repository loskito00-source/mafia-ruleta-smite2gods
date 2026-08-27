import { lazy, Suspense } from 'react'
import { Route, Routes } from 'react-router-dom'
import { MotionConfig } from 'framer-motion'
import Background from './components/Background'
import Home from './pages/Home'

const RoulettePage = lazy(() => import('./pages/RoulettePage'))
const BuildsPage = lazy(() => import('./pages/BuildsPage'))

function RouteFallback() {
  return (
    <div className="grid min-h-screen place-items-center">
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-amber-400/30 border-t-amber-400" />
    </div>
  )
}

export default function App() {
  return (
    <MotionConfig reducedMotion="user">
      <div className="relative min-h-screen">
        <Background />
        <Suspense fallback={<RouteFallback />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/ruleta" element={<RoulettePage />} />
            <Route path="/builds" element={<BuildsPage />} />
            <Route path="*" element={<Home />} />
          </Routes>
        </Suspense>
      </div>
    </MotionConfig>
  )
}
