/**
 * Device-aware rendering tiers.
 *  - "none": no WebGL (or user opted out) → CSS/SVG fallback world
 *  - "low":  phones / weak GPUs → fewer particles, no rays, DPR 1
 *  - "mid":  tablets & small laptops
 *  - "high": desktop with headroom → full scene
 */
export type Tier = 'none' | 'low' | 'mid' | 'high';

export function hasWebGL(): boolean {
  if (typeof window === 'undefined') return false;
  if (new URLSearchParams(window.location.search).has('nogl')) return false; // manual test switch
  try {
    const c = document.createElement('canvas');
    const gl = (c.getContext('webgl2') || c.getContext('webgl')) as WebGLRenderingContext | null;
    if (!gl) return false;
    const lose = gl.getExtension('WEBGL_lose_context');
    lose?.loseContext();
    return true;
  } catch {
    return false;
  }
}

export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  if (new URLSearchParams(window.location.search).has('calm')) return true; // manual test switch
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function detectTier(): Tier {
  if (!hasWebGL()) return 'none';
  const forced = new URLSearchParams(window.location.search).get('tier'); // manual test switch
  if (forced === 'low' || forced === 'mid' || forced === 'high') return forced;
  const w = window.innerWidth;
  const coarse = window.matchMedia('(pointer: coarse)').matches;
  const nav = navigator as Navigator & { deviceMemory?: number };
  const mem = nav.deviceMemory ?? 8;
  const cores = navigator.hardwareConcurrency ?? 8;
  if (w < 700 || (coarse && w < 1000) || mem <= 2 || cores <= 2) return 'low';
  if (w < 1200 || coarse || mem <= 4 || cores <= 4) return 'mid';
  return 'high';
}

export const tierSettings = {
  low: { particles: 900, dpr: [1, 1.25] as [number, number], rays: false, network: 34, cameraSway: 0.35 },
  mid: { particles: 2200, dpr: [1, 1.5] as [number, number], rays: true, network: 60, cameraSway: 0.7 },
  high: { particles: 4200, dpr: [1, 1.75] as [number, number], rays: true, network: 90, cameraSway: 1 },
};
