import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { FORGE, FORGE_PERIOD, forgeTime, kickForge, proximity, world } from '../lib/world';
import { palette } from './glsl';

/* ───────────────────────────────────────────────────────────────────────────
 *  THE FOLDEX FORGE
 *  A luminous PDF page hangs in the water. File-format tiles orbit it on a
 *  tilted ring and stream into it (and back out, converted). On the shared
 *  FORGE clock the page's heading is selected and retyped in place and a
 *  signature is drawn — the same edit the DOM copy performs on its tagline.
 *  Everything is built from primitives and canvas textures (no models).
 * ─────────────────────────────────────────────────────────────────────────── */

type Vec3 = [number, number, number];
type Detail = 'low' | 'mid' | 'high';

const PAGE_W = 2.5;
const PAGE_H = PAGE_W * (1000 / 768);
const CANVAS_W = 768;
const CANVAS_H = 1000;
const OLD_HEAD = 'Draft Agreement';
const NEW_HEAD = 'Service Agreement';

/** Format tiles — every label appears in Foldex's engine documentation. */
const TILES: { label: string; color: string }[] = [
  { label: 'PDF', color: '#ef4444' },
  { label: 'DOCX', color: '#2563eb' },
  { label: 'HEIC', color: '#0ea5e9' },
  { label: 'MP4', color: '#8b5cf6' },
  { label: 'XLSX', color: '#16a34a' },
  { label: 'EPUB', color: '#0d9488' },
  { label: 'PPTX', color: '#ea580c' },
  { label: 'SVG', color: '#06b6d4' },
  { label: 'MP3', color: '#db2777' },
  { label: 'ZIP', color: '#d97706' },
  { label: 'WEBP', color: '#3b82f6' },
  { label: 'TTF', color: '#64748b' },
  { label: 'DWG', color: '#0891b2' },
  { label: 'PNG', color: '#14b8a6' },
  { label: 'STL', color: '#7c3aed' },
  { label: 'JPG', color: '#0284c7' },
];

const FONT = "'Inter Variable', 'Segoe UI', system-ui, sans-serif";
const MONO = "'JetBrains Mono', Consolas, monospace";

/* ── Canvas helpers ────────────────────────────────────────────────────────── */

function roundRect(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  c.beginPath();
  c.moveTo(x + r, y);
  c.arcTo(x + w, y, x + w, y + h, r);
  c.arcTo(x + w, y + h, x, y + h, r);
  c.arcTo(x, y + h, x, y, r);
  c.arcTo(x, y, x + w, y, r);
  c.closePath();
}

/** A signature, sampled once into points so it can be drawn progressively. */
const SIGNATURE: [number, number][] = (() => {
  const pts: [number, number][] = [];
  const P = (t: number): [number, number] => {
    // Hand-tuned loops: a capital, a few cursive humps and a trailing flourish.
    const x = 70 + t * 330;
    const y =
      880 -
      Math.sin(t * Math.PI * 7.2) * (26 - t * 12) -
      Math.exp(-Math.pow((t - 0.06) / 0.05, 2)) * 46 +
      Math.exp(-Math.pow((t - 0.95) / 0.06, 2)) * 10;
    return [x + Math.sin(t * 40) * 3, y];
  };
  for (let i = 0; i <= 140; i++) pts.push(P(i / 140));
  return pts;
})();

type PageState = { stage: 0 | 1 | 2 | 3; typed: number; caret: boolean; sig: number };

function drawPage(c: CanvasRenderingContext2D, s: PageState) {
  c.clearRect(0, 0, CANVAS_W, CANVAS_H);
  // paper
  roundRect(c, 0, 0, CANVAS_W, CANVAS_H, 26);
  c.fillStyle = '#f7f8fd';
  c.fill();
  const strip = c.createLinearGradient(0, 0, CANVAS_W, 0);
  strip.addColorStop(0, '#22d3ee');
  strip.addColorStop(1, '#a855f7');
  c.save();
  roundRect(c, 0, 0, CANVAS_W, CANVAS_H, 26);
  c.clip();
  c.fillStyle = strip;
  c.fillRect(0, 0, CANVAS_W, 14);
  c.restore();

  c.fillStyle = '#8a93ad';
  c.font = `500 20px ${MONO}`;
  c.fillText('AGREEMENT NO. FX-2026-01', 70, 92);

  // heading
  c.font = `700 58px ${FONT}`;
  const head = s.stage <= 1 ? OLD_HEAD : NEW_HEAD.slice(0, s.typed);
  const headW = c.measureText(s.stage <= 1 ? OLD_HEAD : NEW_HEAD).width;
  if (s.stage === 1) {
    roundRect(c, 56, 116, headW + 30, 82, 12);
    c.fillStyle = 'rgba(34, 211, 238, 0.16)';
    c.fill();
    c.lineWidth = 4;
    c.strokeStyle = '#22d3ee';
    c.stroke();
  }
  c.fillStyle = '#1e3a8a';
  c.fillText(head, 70, 178);
  if (s.caret && s.stage <= 2) {
    const x = 70 + c.measureText(head).width + 6;
    c.fillStyle = '#7c3aed';
    c.fillRect(x, 126, 5, 64);
  }

  // body copy as soft rules
  const bar = (x: number, y: number, w: number, h = 13, col = '#cfd5e6') => {
    roundRect(c, x, y, w, h, h / 2);
    c.fillStyle = col;
    c.fill();
  };
  bar(70, 236, 610);
  bar(70, 266, 560);
  bar(70, 296, 590);
  bar(70, 350, 220, 16, '#9fb0d8');
  bar(70, 384, 620);
  bar(70, 414, 500);
  bar(70, 444, 580);

  // a small table
  c.strokeStyle = '#c3cbe2';
  c.lineWidth = 2;
  for (let r = 0; r < 4; r++) {
    roundRect(c, 70, 494 + r * 48, 420, 48, 0);
    c.stroke();
    c.beginPath();
    c.moveTo(330, 494 + r * 48);
    c.lineTo(330, 542 + r * 48);
    c.stroke();
    bar(88, 512 + r * 48, r === 3 ? 90 : 180, 12, r === 3 ? '#7d8cb6' : '#d3d9ea');
    bar(350, 512 + r * 48, r === 3 ? 110 : 90, 12, r === 3 ? '#7d8cb6' : '#d3d9ea');
  }

  // a filled form field
  roundRect(c, 70, 710, 300, 56, 10);
  c.fillStyle = '#eef1fb';
  c.fill();
  c.strokeStyle = '#b9c3e6';
  c.stroke();
  c.strokeStyle = '#16a34a';
  c.lineWidth = 6;
  c.lineCap = 'round';
  c.lineJoin = 'round';
  c.beginPath();
  c.moveTo(90, 738);
  c.lineTo(104, 752);
  c.lineTo(128, 724);
  c.stroke();
  bar(150, 731, 190, 14, '#b9c3e6');

  // signature line + signature
  c.strokeStyle = '#9aa3bd';
  c.lineWidth = 2;
  c.beginPath();
  c.moveTo(60, 900);
  c.lineTo(450, 900);
  c.stroke();
  c.fillStyle = '#8a93ad';
  c.font = `500 18px ${MONO}`;
  c.fillText('SIGNATURE', 62, 930);
  const n = Math.floor(s.sig * (SIGNATURE.length - 1));
  if (n > 1) {
    c.strokeStyle = '#1d3fbf';
    c.lineWidth = 5;
    c.beginPath();
    c.moveTo(SIGNATURE[0][0], SIGNATURE[0][1]);
    for (let i = 1; i <= n; i++) c.lineTo(SIGNATURE[i][0], SIGNATURE[i][1]);
    c.stroke();
  }
  // date stamp, right
  bar(520, 878, 170, 14, '#cfd5e6');
  c.fillStyle = '#8a93ad';
  c.fillText('DATE', 522, 930);
}

function pageState(t: number, now: number): PageState {
  const blink = Math.floor(now * 2.2) % 2 === 0;
  if (t < FORGE.select) return { stage: 0, typed: 0, caret: false, sig: 0 };
  if (t < FORGE.type) return { stage: 1, typed: 0, caret: blink, sig: 0 };
  if (t < FORGE.typed) {
    const typed = Math.max(1, Math.round(((t - FORGE.type) / (FORGE.typed - FORGE.type)) * NEW_HEAD.length));
    return { stage: 2, typed, caret: true, sig: 0 };
  }
  const sig = Math.min(1, (t - FORGE.typed) / (FORGE.signed - FORGE.typed));
  return { stage: 3, typed: NEW_HEAD.length, caret: false, sig: Math.round(sig * 48) / 48 };
}

function makeTileTexture(label: string, color: string): THREE.CanvasTexture {
  const S = 192;
  const cv = document.createElement('canvas');
  cv.width = S;
  cv.height = S;
  const c = cv.getContext('2d')!;
  const g = c.createLinearGradient(0, 0, S, S);
  g.addColorStop(0, color);
  g.addColorStop(1, '#0b1030');
  roundRect(c, 10, 10, S - 20, S - 20, 34);
  c.fillStyle = g;
  c.fill();
  c.lineWidth = 3;
  c.strokeStyle = 'rgba(255,255,255,0.45)';
  c.stroke();
  // folded corner
  c.beginPath();
  c.moveTo(S - 62, 10);
  c.lineTo(S - 10, 62);
  c.lineTo(S - 62, 62);
  c.closePath();
  c.fillStyle = 'rgba(255,255,255,0.28)';
  c.fill();
  c.fillStyle = '#ffffff';
  c.font = `800 ${label.length > 3 ? 44 : 54}px ${FONT}`;
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.fillText(label, S / 2, S / 2 + 18);
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

/* ── Shaders ───────────────────────────────────────────────────────────────── */

const quadVert = /* glsl */ `
varying vec2 vUv;
void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;

/** A soft rounded-rect halo around the page, cyan → violet, pulsing on edits. */
const haloFrag = /* glsl */ `
${palette}
uniform float uStrength;
uniform float uTime;
varying vec2 vUv;
float sdRound(vec2 p, vec2 b, float r){ vec2 q = abs(p) - b + r; return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r; }
void main(){
  vec2 p = (vUv - 0.5) * vec2(1.0, 1.25);
  float d = sdRound(p, vec2(0.42, 0.53), 0.04);
  float rim = exp(-abs(d) * 34.0);
  float bloom = exp(-max(d, 0.0) * 9.0) * 0.35;
  float sweep = 0.6 + 0.4 * sin(atan(p.y, p.x) * 2.0 - uTime * 1.4);
  vec3 col = mix(CYAN, VIOLET, smoothstep(-0.5, 0.5, p.x + p.y * 0.4));
  float a = (rim * sweep + bloom) * uStrength;
  gl_FragColor = vec4(col * a, a);
}`;

/** The scan bar that passes down the page when the cycle starts. */
const scanFrag = /* glsl */ `
${palette}
uniform float uStrength;
varying vec2 vUv;
void main(){
  float y = exp(-pow((vUv.y - 0.5) * 7.0, 2.0));
  float x = smoothstep(0.0, 0.08, vUv.x) * smoothstep(1.0, 0.92, vUv.x);
  float a = y * x * uStrength;
  gl_FragColor = vec4(mix(CYAN, VIOLET, vUv.x) * a, a);
}`;

const streamVert = /* glsl */ `
uniform vec3 uTiles[16];
uniform float uTime;
uniform float uBoost;
uniform float uPix;
attribute float aTile;
attribute float aPhase;
attribute float aDir;
attribute float aSeed;
varying float vT;
varying float vSeed;
void main(){
  float speed = 0.16 + aSeed * 0.12;
  float t = fract(aPhase + uTime * speed * (1.0 + uBoost * 1.8));
  vec3 tile = uTiles[int(aTile)];
  vec3 core = vec3((aSeed - 0.5) * 0.6, (fract(aSeed * 7.3) - 0.5) * 0.9, 0.08);
  vec3 a = aDir < 0.5 ? tile : core;
  vec3 b = aDir < 0.5 ? core : tile;
  vec3 ctrl = mix(a, b, 0.5) + vec3((fract(aSeed * 3.1) - 0.5) * 1.4, (fract(aSeed * 5.7) - 0.5) * 1.2, 1.1);
  float u = t;
  vec3 p = mix(mix(a, ctrl, u), mix(ctrl, b, u), u);
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;
  float head = 0.8 + 1.6 * sin(t * 3.14159);
  gl_PointSize = (1.6 + aSeed * 2.2) * head * uPix * (1.0 + uBoost * 0.6) * 10.0 / -mv.z;
  vT = aDir < 0.5 ? t : 1.0 - t;
  vSeed = aSeed;
}`;
const streamFrag = /* glsl */ `
${palette}
uniform float uFade;
uniform float uBoost;
varying float vT;
varying float vSeed;
void main(){
  float d = length(gl_PointCoord - 0.5);
  float a = smoothstep(0.5, 0.0, d);
  a *= smoothstep(0.0, 0.12, vT) * smoothstep(1.0, 0.82, vT);
  vec3 col = mix(CYAN, VIOLET, vT);
  col = mix(col, vec3(1.0), smoothstep(0.75, 1.0, vT) * 0.6);
  a *= (0.55 + uBoost * 0.45) * uFade * (0.6 + vSeed * 0.4);
  gl_FragColor = vec4(col * a, a);
}`;

/* ── Component ─────────────────────────────────────────────────────────────── */

export function FoldexForge({ position, detail }: { position: Vec3; detail: Detail }) {
  const root = useRef<THREE.Group>(null);
  const forge = useRef<THREE.Group>(null);
  const tilesRef = useRef<THREE.Group>(null);
  const ringA = useRef<THREE.Mesh>(null);
  const ringB = useRef<THREE.Mesh>(null);
  const scan = useRef<THREE.Mesh>(null);
  const arrive = useRef(0);
  const boost = useRef(0);
  const kicked = useRef(false);
  const lastKey = useRef('');
  const gl = useThree((s) => s.gl);

  const tileCount = detail === 'low' ? 10 : detail === 'mid' ? 14 : 16;
  const streamCount = detail === 'low' ? 320 : detail === 'mid' ? 620 : 960;

  const page = useMemo(() => {
    const cv = document.createElement('canvas');
    cv.width = CANVAS_W;
    cv.height = CANVAS_H;
    const ctx = cv.getContext('2d')!;
    drawPage(ctx, { stage: 0, typed: 0, caret: false, sig: 0 });
    const tex = new THREE.CanvasTexture(cv);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 8;
    const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, toneMapped: false, fog: false, side: THREE.DoubleSide });
    return { ctx, tex, mat };
  }, []);

  const halo = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: quadVert,
        fragmentShader: haloFrag,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: { uStrength: { value: 0 }, uTime: { value: 0 } },
      }),
    [],
  );
  const scanMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: quadVert,
        fragmentShader: scanFrag,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: { uStrength: { value: 0 } },
      }),
    [],
  );

  const tiles = useMemo(
    () =>
      TILES.slice(0, tileCount).map((t, i) => ({
        ...t,
        mat: new THREE.MeshBasicMaterial({ map: makeTileTexture(t.label, t.color), transparent: true, toneMapped: false, fog: false, depthWrite: false }),
        phase: (i / tileCount) * Math.PI * 2,
        lift: ((i * 37) % 7) / 7 - 0.5,
      })),
    [tileCount],
  );
  const tileGeo = useMemo(() => new THREE.PlaneGeometry(0.58, 0.58), []);

  const stream = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const n = streamCount;
    const pos = new Float32Array(n * 3); // positions come from the shader
    const aTile = new Float32Array(n);
    const aPhase = new Float32Array(n);
    const aDir = new Float32Array(n);
    const aSeed = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      aTile[i] = i % tileCount;
      aPhase[i] = (i * 0.618034) % 1;
      aDir[i] = i % 3 === 0 ? 1 : 0; // a third flow back out, "converted"
      aSeed[i] = ((i * 7919) % 1000) / 1000;
    }
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('aTile', new THREE.BufferAttribute(aTile, 1));
    g.setAttribute('aPhase', new THREE.BufferAttribute(aPhase, 1));
    g.setAttribute('aDir', new THREE.BufferAttribute(aDir, 1));
    g.setAttribute('aSeed', new THREE.BufferAttribute(aSeed, 1));
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 8);
    const tilesU = Array.from({ length: 16 }, () => new THREE.Vector3());
    const mat = new THREE.ShaderMaterial({
      vertexShader: streamVert,
      fragmentShader: streamFrag,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: { uTiles: { value: tilesU }, uTime: { value: 0 }, uBoost: { value: 0 }, uFade: { value: 0 }, uPix: { value: 1 } },
    });
    return { g, mat, tilesU };
  }, [streamCount, tileCount]);

  const ringMatA = useMemo(
    () => new THREE.MeshBasicMaterial({ color: '#22d3ee', transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }),
    [],
  );
  const ringMatB = useMemo(
    () => new THREE.MeshBasicMaterial({ color: '#a855f7', transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }),
    [],
  );

  useEffect(
    () => () => {
      page.tex.dispose();
      page.mat.dispose();
      tiles.forEach((t) => {
        t.mat.map?.dispose();
        t.mat.dispose();
      });
      stream.g.dispose();
      stream.mat.dispose();
    },
    [page, tiles, stream],
  );

  useFrame((state, dt) => {
    const camY = state.camera.position.y;
    const target = proximity(camY, position[1], 2.2, 6.5);
    arrive.current = THREE.MathUtils.damp(arrive.current, target, 3, dt);
    const A = arrive.current;
    const g = root.current;
    if (g) {
      g.visible = A > 0.01;
      g.position.y = position[1] - (1 - A) * 1.8;
    }
    if (A <= 0.01) {
      kicked.current = false;
      return;
    }
    // The edit cycle restarts as the visitor arrives, so they always see it from the top.
    if (!kicked.current && A > 0.5) {
      kicked.current = true;
      kickForge();
    }

    const now = performance.now() / 1000;
    const rm = world.reducedMotion;
    const time = state.clock.elapsedTime * (rm ? 0.12 : 1);
    boost.current = THREE.MathUtils.damp(boost.current, world.forge, 4, dt);
    const B = boost.current;
    const ft = forgeTime(now);

    // Page texture: redrawn only when what it shows changes.
    const ps = pageState(ft, now);
    const key = `${ps.stage}|${ps.typed}|${ps.caret}|${ps.sig}`;
    if (key !== lastKey.current) {
      lastKey.current = key;
      drawPage(page.ctx, ps);
      page.tex.needsUpdate = true;
    }
    // A brief refresh dip before the cycle repeats.
    const dip = ft > FORGE.reset ? Math.sin(((ft - FORGE.reset) / (FORGE_PERIOD - FORGE.reset)) * Math.PI) : 0;
    page.mat.opacity = A * (1 - dip * 0.65);

    // Halo pulses as the heading is retyped and while boosted.
    const editing = ft > FORGE.select && ft < FORGE.signed ? 1 : 0;
    halo.uniforms.uStrength.value = A * (0.55 + editing * 0.25 + B * 0.6);
    halo.uniforms.uTime.value = time;

    // Scan bar: sweeps down the page at the start of each cycle (and when boosted).
    if (scan.current) {
      const sp = Math.min(1, ft / FORGE.select);
      scan.current.position.y = PAGE_H / 2 - sp * PAGE_H;
      scanMat.uniforms.uStrength.value = A * (sp < 1 ? Math.sin(sp * Math.PI) : 0) * (0.9 + B);
    }

    // Float + face the camera a little, with cursor parallax.
    const f = forge.current;
    if (f) {
      f.rotation.y = 0.5 + (rm ? 0 : Math.sin(time * 0.25) * 0.05 + world.pointerX * 0.12);
      f.rotation.x = rm ? 0 : Math.sin(time * 0.31) * 0.03 - world.pointerY * 0.05;
      f.position.y = rm ? 0 : Math.sin(time * 0.6) * 0.08;
    }

    // Orbiting format tiles on a tilted ring.
    const spin = time * (0.12 + B * 0.35);
    const R = 2.5;
    const pulseIdx = Math.floor(time / 1.1) % tiles.length;
    tilesRef.current?.children.forEach((m, i) => {
      const t = tiles[i];
      const a = t.phase + spin;
      const x = Math.cos(a) * R;
      const z = Math.sin(a) * R * 0.55;
      // Front of the ring dips below the page, back rises behind it — the heading stays readable.
      const y = -Math.sin(a) * 1.3 + t.lift * 0.35 - 0.1;
      m.position.set(x, y, z);
      m.quaternion.copy(state.camera.quaternion);
      const pulse = i === pulseIdx ? Math.sin(((time % 1.1) / 1.1) * Math.PI) : 0;
      m.scale.setScalar(1 + pulse * 0.28 + B * 0.1);
      const depth = THREE.MathUtils.smoothstep(z, -R * 0.55, R * 0.55); // behind the page → dimmer
      t.mat.opacity = A * (0.35 + depth * 0.65);
      stream.tilesU[i].set(x, y, z);
    });

    stream.mat.uniforms.uTime.value = time;
    stream.mat.uniforms.uBoost.value = B;
    stream.mat.uniforms.uFade.value = A;
    stream.mat.uniforms.uPix.value = gl.getPixelRatio() * (state.size.height / 900);

    if (ringA.current) {
      ringA.current.rotation.set(1.2 + Math.sin(time * 0.2) * 0.08, time * 0.18, -0.25);
      ringMatA.opacity = A * (0.28 + B * 0.4);
    }
    if (ringB.current) {
      ringB.current.rotation.set(1.05, -time * 0.13, -0.35 + Math.cos(time * 0.17) * 0.06);
      ringMatB.opacity = A * (0.22 + B * 0.4);
    }
  });

  return (
    <group ref={root} position={position} visible={false}>
      <group ref={forge}>
        <mesh ref={ringA} material={ringMatA}>
          <torusGeometry args={[2.05, 0.012, 8, 180]} />
        </mesh>
        <mesh ref={ringB} material={ringMatB}>
          <torusGeometry args={[2.45, 0.009, 8, 180]} />
        </mesh>
        <mesh material={halo} position={[0, 0, -0.04]}>
          <planeGeometry args={[PAGE_W * 1.6, PAGE_H * 1.28]} />
        </mesh>
        <mesh material={page.mat}>
          <planeGeometry args={[PAGE_W, PAGE_H]} />
        </mesh>
        <mesh ref={scan} material={scanMat} position={[0, 0, 0.02]}>
          <planeGeometry args={[PAGE_W * 1.08, 0.5]} />
        </mesh>
        <points geometry={stream.g} material={stream.mat} frustumCulled={false} />
        <group ref={tilesRef}>
          {tiles.map((t) => (
            <mesh key={t.label} geometry={tileGeo} material={t.mat} />
          ))}
        </group>
      </group>
    </group>
  );
}

/**
 * A smaller, quieter Foldex page that rises beside TuneKadal's lighthouse at the
 * end of Projects — a preview of both flagships — and sinks away before the
 * TuneKadal section settles. The full forge takes over further down.
 */
export function FoldexTeaser({ position }: { position: Vec3 }) {
  const root = useRef<THREE.Group>(null);
  const body = useRef<THREE.Group>(null);
  const tilesRef = useRef<THREE.Group>(null);
  const ring = useRef<THREE.Mesh>(null);
  const arrive = useRef(0);

  const { pageMat, haloMat, ringMat, tiles, tileGeo } = useMemo(() => {
    const cv = document.createElement('canvas');
    cv.width = CANVAS_W;
    cv.height = CANVAS_H;
    drawPage(cv.getContext('2d')!, { stage: 3, typed: NEW_HEAD.length, caret: false, sig: 1 });
    const tex = new THREE.CanvasTexture(cv);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    const pageMat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, toneMapped: false, fog: false, opacity: 0 });
    const haloMat = new THREE.ShaderMaterial({
      vertexShader: quadVert,
      fragmentShader: haloFrag,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: { uStrength: { value: 0 }, uTime: { value: 0 } },
    });
    const ringMat = new THREE.MeshBasicMaterial({ color: '#a855f7', transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false });
    const tiles = [0, 1, 2, 3, 4, 7].map((k, i) => ({
      mat: new THREE.MeshBasicMaterial({ map: makeTileTexture(TILES[k].label, TILES[k].color), transparent: true, toneMapped: false, fog: false, depthWrite: false, opacity: 0 }),
      phase: (i / 6) * Math.PI * 2,
    }));
    return { pageMat, haloMat, ringMat, tiles, tileGeo: new THREE.PlaneGeometry(0.42, 0.42) };
  }, []);

  useEffect(
    () => () => {
      pageMat.map?.dispose();
      pageMat.dispose();
      haloMat.dispose();
      ringMat.dispose();
      tiles.forEach((t) => {
        t.mat.map?.dispose();
        t.mat.dispose();
      });
      tileGeo.dispose();
    },
    [pageMat, haloMat, ringMat, tiles, tileGeo],
  );

  useFrame((state, dt) => {
    const camY = -state.camera.position.y;
    // Rises with the lighthouse at the end of Projects, gone before TuneKadal holds.
    const target = THREE.MathUtils.smoothstep(camY, 20.2, 22.4) * (1 - THREE.MathUtils.smoothstep(camY, 22.6, 23.4));
    arrive.current = THREE.MathUtils.damp(arrive.current, target, 3, dt);
    const A = arrive.current;
    const g = root.current;
    if (g) {
      g.visible = A > 0.01;
      g.position.y = position[1] - (1 - A) * 1.6;
    }
    if (A <= 0.01) return;
    const time = state.clock.elapsedTime * (world.reducedMotion ? 0.12 : 1);
    pageMat.opacity = A;
    haloMat.uniforms.uStrength.value = A * 0.7;
    haloMat.uniforms.uTime.value = time;
    ringMat.opacity = A * 0.3;
    if (body.current) {
      body.current.rotation.y = -0.35 + Math.sin(time * 0.3) * 0.06 + world.pointerX * 0.1;
      body.current.position.y = Math.sin(time * 0.7) * 0.07;
    }
    if (ring.current) ring.current.rotation.set(1.2, time * 0.2, 0.2);
    tilesRef.current?.children.forEach((m, i) => {
      const t = tiles[i];
      const a = t.phase + time * 0.18;
      const z = Math.sin(a) * 0.95;
      m.position.set(Math.cos(a) * 1.75, -Math.sin(a) * 0.85, z);
      m.quaternion.copy(state.camera.quaternion);
      t.mat.opacity = A * (0.4 + THREE.MathUtils.smoothstep(z, -0.95, 0.95) * 0.6);
    });
  });

  return (
    <group ref={root} position={position} visible={false} scale={1.5}>
      <group ref={body}>
        <mesh ref={ring} material={ringMat}>
          <torusGeometry args={[1.5, 0.01, 8, 140]} />
        </mesh>
        <mesh material={haloMat} position={[0, 0, -0.03]}>
          <planeGeometry args={[1.6 * 1.6, 1.6 * (1000 / 768) * 1.28]} />
        </mesh>
        <mesh material={pageMat}>
          <planeGeometry args={[1.6, 1.6 * (1000 / 768)]} />
        </mesh>
        <group ref={tilesRef}>
          {tiles.map((t, i) => (
            <mesh key={i} geometry={tileGeo} material={t.mat} />
          ))}
        </group>
      </group>
    </group>
  );
}
