import { lazy, Suspense, useEffect, useState } from 'react';
import { detectTier, prefersReducedMotion, type Tier } from './lib/device';
import { startWorldTracking, world } from './lib/world';
import { Nav } from './components/Nav';
import { Hud } from './components/Hud';
import { FallbackWorld } from './components/FallbackWorld';
import { Hero } from './sections/Hero';
import { About } from './sections/About';
import { ExperienceSection } from './sections/Experience';
import { Skills } from './sections/Skills';
import { Projects } from './sections/Projects';
import { TuneKadal } from './sections/TuneKadal';
import { Certifications } from './sections/Certifications';
import { GitHub } from './sections/GitHub';
import { Contact } from './sections/Contact';

// The 3D engine (~three.js + r3f) is split into its own chunk and only
// downloaded when the device can render it.
const Experience = lazy(() => import('./scene/Experience'));

export default function App() {
  const [tier] = useState<Tier>(() => detectTier());
  const [calm, setCalm] = useState<boolean>(() => prefersReducedMotion());
  const [sceneReady, setSceneReady] = useState(false);

  useEffect(() => startWorldTracking(), []);

  useEffect(() => {
    world.reducedMotion = calm;
    document.documentElement.classList.toggle('calm', calm);
  }, [calm]);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const on = () => setCalm(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.tier = tier;
  }, [tier]);

  const webgl = tier !== 'none';

  return (
    <>
      <a className="skip" href="#main">
        Skip to content
      </a>
      <div className={`stage ${sceneReady ? 'is-ready' : ''}`} aria-hidden="true">
        <FallbackWorld animated={!webgl} />
        {webgl && (
          <Suspense fallback={null}>
            <Experience tier={tier} onReady={() => setSceneReady(true)} />
          </Suspense>
        )}
        <div className="stage-vignette" />
        <div className="stage-grain" />
      </div>

      <Nav calm={calm} onToggleCalm={() => setCalm((c) => !c)} />
      <Hud />

      <main id="main" tabIndex={-1}>
        <Hero />
        <About />
        <ExperienceSection />
        <Skills />
        <Projects />
        <TuneKadal webgl={webgl} />
        <Certifications />
        <GitHub />
        <Contact />
      </main>
    </>
  );
}
