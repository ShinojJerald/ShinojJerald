import { useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { world } from '../lib/world';
import { tierSettings, type Tier } from '../lib/device';
import { DataCore } from './DataCore';
import { Particles } from './Particles';
import { Network } from './Network';
import { Current, LightRays, Seafloor } from './Environment';
import { Lighthouse } from './Lighthouse';
import { CredentialPanels } from './CredentialPanels';
import { certifications } from '../content';

type Vec3 = [number, number, number];
type Key = { pos: Vec3; look: Vec3; bg: string; fog: number };

/**
 * One camera keyframe per page section. The scroll position (as a fractional
 * section index) is eased between neighbouring keys, so scrolling reads as a
 * slow descent through a single world rather than a series of slides.
 */
const KEYS: Key[] = [
  { pos: [0, 0.3, 9.5], look: [0, 0, 0], bg: '#030a16', fog: 0.045 }, //              home
  { pos: [-2.6, -2.2, 11.5], look: [1.2, -1.7, 0], bg: '#030b19', fog: 0.042 }, //   about — pull back, core rides high
  { pos: [0, -6.6, 9], look: [0, -7, 0], bg: '#030c1b', fog: 0.05 }, //              journey
  { pos: [1, -12.6, 10], look: [0.5, -13.4, -4], bg: '#030b1c', fog: 0.05 }, //      skills
  { pos: [0, -19, 9], look: [0, -19.6, 0], bg: '#030b1a', fog: 0.055 }, //           projects
  { pos: [-1, -23.6, 8], look: [0, -23.3, -6], bg: '#021622', fog: 0.03 }, //        tunekadal — deeper, greener, clearer water
  { pos: [1, -30.6, 8], look: [-4, -31.2, -4], bg: '#030d1c', fog: 0.062 }, //          certifications — credential panels
  { pos: [0, -33.4, 9], look: [0, -38, -3], bg: '#020d17', fog: 0.05 }, //           github
  { pos: [-1, -37, 9], look: [-2.5, -35.2, -8], bg: '#030b16', fog: 0.05 }, //       contact
];

const ease = (x: number) => x * x * (3 - 2 * x);
/** Hold on a section's key while it fills the screen, then glide to the next. */
const HOLD = 0.45;
const travel = (frac: number) => ease(Math.min(1, Math.max(0, (frac - HOLD) / (1 - HOLD))));

function CameraRig({ sway, narrow }: { sway: number; narrow: number }) {
  const { camera, scene } = useThree();
  const pos = useMemo(() => new THREE.Vector3(...KEYS[0].pos), []);
  const look = useMemo(() => new THREE.Vector3(...KEYS[0].look), []);
  const tp = useMemo(() => new THREE.Vector3(), []);
  const tl = useMemo(() => new THREE.Vector3(), []);
  const ca = useMemo(() => new THREE.Color(), []);
  const cb = useMemo(() => new THREE.Color(), []);
  const bg = useMemo(() => new THREE.Color(KEYS[0].bg), []);

  useEffect(() => {
    scene.background = bg;
    scene.fog = new THREE.FogExp2(bg.getHex(), 0.052);
  }, [scene, bg]);

  useFrame((state, dt) => {
    const s = Math.min(KEYS.length - 1, Math.max(0, world.section));
    const i = Math.min(KEYS.length - 2, Math.floor(s));
    const f = travel(s - i);
    const a = KEYS[i];
    const b = KEYS[i + 1];
    tp.set(
      THREE.MathUtils.lerp(a.pos[0], b.pos[0], f) * narrow,
      THREE.MathUtils.lerp(a.pos[1], b.pos[1], f),
      THREE.MathUtils.lerp(a.pos[2], b.pos[2], f) + (narrow < 1 ? 2.5 : 0),
    );
    tl.set(
      THREE.MathUtils.lerp(a.look[0], b.look[0], f) * narrow,
      THREE.MathUtils.lerp(a.look[1], b.look[1], f),
      THREE.MathUtils.lerp(a.look[2], b.look[2], f),
    );

    // Barely-there drift + cursor parallax. Never a continuous spin.
    if (!world.reducedMotion) {
      const t = state.clock.elapsedTime;
      tp.x += (Math.sin(t * 0.13) * 0.12 + world.pointerX * 0.35) * sway;
      tp.y += (Math.cos(t * 0.11) * 0.08 + world.pointerY * 0.2) * sway;
    }

    const lambda = world.reducedMotion ? 6 : 2.4;
    pos.x = THREE.MathUtils.damp(pos.x, tp.x, lambda, dt);
    pos.y = THREE.MathUtils.damp(pos.y, tp.y, lambda, dt);
    pos.z = THREE.MathUtils.damp(pos.z, tp.z, lambda, dt);
    look.x = THREE.MathUtils.damp(look.x, tl.x, lambda, dt);
    look.y = THREE.MathUtils.damp(look.y, tl.y, lambda, dt);
    look.z = THREE.MathUtils.damp(look.z, tl.z, lambda, dt);
    camera.position.copy(pos);
    camera.lookAt(look);

    ca.set(a.bg);
    cb.set(b.bg);
    bg.copy(ca).lerp(cb, f);
    const fog = scene.fog as THREE.FogExp2 | null;
    if (fog) {
      fog.color.copy(bg);
      fog.density = THREE.MathUtils.lerp(a.fog, b.fog, f);
    }
  });
  return null;
}

/** Lowers the pixel ratio if the device is struggling; never raises above the tier cap. */
function AdaptiveResolution({ min, max }: { min: number; max: number }) {
  const setDpr = useThree((s) => s.setDpr);
  const acc = useRef({ t: 0, n: 0, dpr: Math.min(max, window.devicePixelRatio || 1) });
  useFrame((_, dt) => {
    const a = acc.current;
    a.t += dt;
    a.n++;
    if (a.t >= 2) {
      const fps = a.n / a.t;
      if (fps < 42 && a.dpr > min) {
        a.dpr = Math.max(min, a.dpr - 0.25);
        setDpr(a.dpr);
      }
      a.t = 0;
      a.n = 0;
    }
  });
  return null;
}

function World({ tier }: { tier: Exclude<Tier, 'none'> }) {
  const cfg = tierSettings[tier];
  const size = useThree((s) => s.size);
  const aspect = size.width / Math.max(1, size.height);
  // On narrow screens pull everything toward the centre line so it frames behind the copy.
  const narrow = aspect < 0.8 ? 0.3 : aspect < 1.25 ? 0.65 : 1;
  const x = (v: number) => v * narrow;

  return (
    <>
      <CameraRig sway={cfg.cameraSway} narrow={narrow} />
      <AdaptiveResolution min={1} max={cfg.dpr[1]} />
      <hemisphereLight args={['#6cc4ff', '#0a1a30', 0.9]} />
      <directionalLight position={[4, 10, 6]} intensity={0.6} color="#a8dcff" />

      <DataCore position={narrow < 1 ? [narrow < 0.5 ? 1.3 : 2, 2.1, -4.5] : [2.5, 0, 0]} detail={tier === 'low' ? 2 : 3} />
      <Particles count={cfg.particles} />
      <Current position={[x(4), -7, -1.5]} count={tier === 'low' ? 260 : 620} />
      <Network position={[x(3.2), -13.2, -9]} nodes={cfg.network} radius={6} groups={6} focus="skill" />
      <Network position={[x(-4), -19.8, -9]} nodes={Math.round(cfg.network * 0.45)} radius={3.6} seed={21} />
      {cfg.rays && <LightRays />}
      <Lighthouse position={[x(5.5), -26.6, -9]} />
      <CredentialPanels position={[x(-4.5), -31.3, -6]} count={certifications.length} spread={narrow < 1 ? 0.6 : 1} />
      <Seafloor y={-42} cols={tier === 'low' ? 26 : 44} rows={tier === 'low' ? 14 : 22} />
    </>
  );
}

export default function Experience({ tier, onReady }: { tier: Exclude<Tier, 'none'>; onReady: () => void }) {
  const cfg = tierSettings[tier];
  return (
    <Canvas
      className="scene-canvas"
      dpr={cfg.dpr}
      gl={{ antialias: tier !== 'low', powerPreference: 'high-performance', alpha: false, stencil: false }}
      camera={{ fov: 42, near: 0.1, far: 80, position: [0, 0.3, 9.5] }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.05;
        gl.outputColorSpace = THREE.SRGBColorSpace;
        requestAnimationFrame(onReady);
      }}
      aria-hidden="true"
      tabIndex={-1}
    >
      <World tier={tier} />
    </Canvas>
  );
}
