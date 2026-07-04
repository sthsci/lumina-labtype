import { Suspense, lazy, useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { Layout } from '@/app/Layout';
import { useReducedMotion } from '@/app/hooks/useReducedMotion';
import { Landing } from '@/pages/Landing';
import { Intro } from '@/pages/Intro';
import { Context } from '@/pages/Context';
import { QuestionFlow } from '@/pages/QuestionFlow';
import { Pipeline } from '@/pages/Pipeline';
import { Methodology } from '@/pages/Methodology';
import { Privacy } from '@/pages/Privacy';
import { Disclaimer } from '@/pages/Disclaimer';
import { About } from '@/pages/About';
import { Letterbox } from '@/pages/Letterbox';
import { NotFound } from '@/pages/NotFound';

// Heavy, visualisation-rich pages are code-split to keep the initial bundle small.
const Result = lazy(() => import('@/pages/Result').then((m) => ({ default: m.Result })));
const MLLab = lazy(() => import('@/pages/MLLab').then((m) => ({ default: m.MLLab })));
const Atlas = lazy(() => import('@/pages/Atlas').then((m) => ({ default: m.Atlas })));
const Cohort = lazy(() => import('@/pages/Cohort').then((m) => ({ default: m.Cohort })));

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => window.scrollTo(0, 0), [pathname]);
  return null;
}

function PageFallback() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center text-haze" role="status">
      <span className="animate-pulse">···</span>
    </div>
  );
}

export function App() {
  useReducedMotion(); // sync data attribute for global CSS

  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Landing />} />
          <Route path="intro" element={<Intro />} />
          <Route path="context" element={<Context />} />
          <Route path="test" element={<QuestionFlow />} />
          <Route path="pipeline" element={<Pipeline />} />
          <Route
            path="result"
            element={
              <Suspense fallback={<PageFallback />}>
                <Result />
              </Suspense>
            }
          />
          <Route
            path="ml-lab"
            element={
              <Suspense fallback={<PageFallback />}>
                <MLLab />
              </Suspense>
            }
          />
          <Route
            path="atlas"
            element={
              <Suspense fallback={<PageFallback />}>
                <Atlas />
              </Suspense>
            }
          />
          <Route
            path="cohort"
            element={
              <Suspense fallback={<PageFallback />}>
                <Cohort />
              </Suspense>
            }
          />
          <Route path="methodology" element={<Methodology />} />
          <Route path="privacy" element={<Privacy />} />
          <Route path="disclaimer" element={<Disclaimer />} />
          <Route path="about" element={<About />} />
          <Route path="letterbox" element={<Letterbox />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </>
  );
}
