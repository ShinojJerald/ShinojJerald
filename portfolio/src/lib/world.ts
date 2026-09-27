/**
 * A tiny, allocation-free shared state bridge between the DOM and the 3D scene.
 * DOM listeners write into it; the render loop reads it every frame.
 * Nothing here triggers React re-renders — that keeps scrolling at 60fps.
 */
export const SECTION_IDS = [
  'home',
  'about',
  'experience',
  'skills',
  'projects',
  'tunekadal',
  'certifications',
  'github',
  'contact',
] as const;
export type SectionId = (typeof SECTION_IDS)[number];

export const world = {
  /** 0 → 1 across the whole document */
  progress: 0,
  /** Section index as a float: 2.5 = halfway between section 2 and 3 */
  section: 0,
  /** Smoothed absolute scroll speed, roughly 0 (still) → 1 (fast) */
  velocity: 0,
  /** Pointer in normalised device coords (-1 → 1) */
  pointerX: 0,
  pointerY: 0,
  /** Raised while the pointer hovers something interactive */
  hoverBoost: 0,
  /** 0 → 1: raised while the "light the lamp" control is hovered/active */
  lighthouse: 0,
  /** Index of the skill cluster being explored (-1 = none) */
  skillFocus: -1,
  /** Index of the credential being hovered (-1 = none) */
  credFocus: -1,
  /** 1 while a project node is hovered */
  projectFocus: 0,
  reducedMotion: false,
};

/** 1 when the camera is within `inner` units (vertically) of y, fading to 0 at `outer`. */
export function proximity(cameraY: number, y: number, inner: number, outer: number): number {
  const d = Math.abs(cameraY - y);
  if (d <= inner) return 1;
  if (d >= outer) return 0;
  const t = (d - inner) / (outer - inner);
  return 1 - t * t * (3 - 2 * t);
}

/* ── Lighthouse beam: one clock shared by the 3D beam and the DOM reveal ────── */
export const BEAM_PERIOD = 11; // seconds per sweep
/** Horizontal direction from the lighthouse toward the viewer (x, z), normalised. */
const TO_VIEWER = { x: -0.357, z: 0.934 };

export function beamAngle(nowSec = performance.now() / 1000): number {
  if (world.reducedMotion) return Math.atan2(-TO_VIEWER.z, TO_VIEWER.x) + 0.5; // parked, angled toward the viewer
  return (nowSec / BEAM_PERIOD) * Math.PI * 2;
}

/** 0 → 1: how directly the beam is pointing at the viewer right now. */
export function beamFacing(nowSec = performance.now() / 1000): number {
  const a = beamAngle(nowSec);
  // Rotating +X about Y by `a` gives (cos a, 0, -sin a).
  // The lantern throws two opposed beams, so either end can face the viewer.
  const d = Math.cos(a) * TO_VIEWER.x - Math.sin(a) * TO_VIEWER.z;
  return Math.abs(d);
}

// Exposed read-only for debugging in the browser console.
if (typeof window !== 'undefined') (window as unknown as { __world: typeof world }).__world = world;

let lastY = 0;
let lastT = 0;
let offsets: number[] = [];

function measure() {
  offsets = SECTION_IDS.map((id) => {
    const el = document.getElementById(id);
    return el ? el.getBoundingClientRect().top + window.scrollY : 0;
  });
}

function update() {
  const y = window.scrollY;
  const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
  world.progress = Math.min(1, Math.max(0, y / max));

  // Probe line sits 45% down the viewport so a section "arrives" as it fills the screen.
  const probe = y + window.innerHeight * 0.45;
  let s = 0;
  for (let i = 0; i < offsets.length; i++) {
    const start = offsets[i];
    const end = i + 1 < offsets.length ? offsets[i + 1] : document.documentElement.scrollHeight;
    if (probe >= start) s = i + Math.min(1, (probe - start) / Math.max(1, end - start));
  }
  world.section = s;

  const now = performance.now();
  const dt = Math.max(16, now - lastT);
  const instant = Math.min(1, Math.abs(y - lastY) / dt / 3); // ~3px/ms == fast fling
  world.velocity = Math.max(world.velocity * 0.9, instant);
  lastY = y;
  lastT = now;
}

export function startWorldTracking(): () => void {
  measure();
  update();
  const onScroll = () => update();
  const onResize = () => {
    measure();
    update();
  };
  const onPointer = (e: PointerEvent) => {
    world.pointerX = (e.clientX / window.innerWidth) * 2 - 1;
    world.pointerY = -((e.clientY / window.innerHeight) * 2 - 1);
  };
  // Decay velocity even when scrolling stops.
  let raf = 0;
  let prev = performance.now();
  const decay = (now: number) => {
    const dt = Math.min(0.1, (now - prev) / 1000);
    prev = now;
    world.velocity *= Math.pow(0.04, dt); // frame-rate independent ease-out
    raf = requestAnimationFrame(decay);
  };
  raf = requestAnimationFrame(decay);

  const ro = new ResizeObserver(onResize);
  ro.observe(document.body);
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onResize);
  window.addEventListener('pointermove', onPointer, { passive: true });
  return () => {
    cancelAnimationFrame(raf);
    ro.disconnect();
    window.removeEventListener('scroll', onScroll);
    window.removeEventListener('resize', onResize);
    window.removeEventListener('pointermove', onPointer);
  };
}
