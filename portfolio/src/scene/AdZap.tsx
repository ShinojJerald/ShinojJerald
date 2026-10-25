import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { proximity, world } from '../lib/world';
import { adzap } from '../content';

/* ───────────────────────────────────────────────────────────────────────────
 *  THE ADZAP ZAP FIELD
 *  AdZap's bolt hangs in violet water inside two slow hexagonal rings. Six
 *  small browser windows drift around it, each with two red ad boxes. When a
 *  site is switched on (by the demo in the DOM copy, or by the visitor) the
 *  bolt strikes that window: a jagged arc, a burst of sparks, and its ad boxes
 *  are gone. Windows that are not zapped keep their ads — per-site opt-in.
 *  Built from primitives and canvas textures (no models).
 * ─────────────────────────────────────────────────────────────────────────── */

type Vec3 = [number, number, number];
type Detail = 'low' | 'mid' | 'high';

const WIN_W = 1.32;
const WIN_H = WIN_W * (340 / 512);
const CW = 512;
const CH = 340;
const STRIKE = 0.55; // seconds the arc is visible
const SPARKS = 22; // per window
const FONT = "'Inter Variable', 'Segoe UI', system-ui, sans-serif";
const MONO = "'JetBrains Mono', Consolas, monospace";

function roundRect(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  c.beginPath();
  c.moveTo(x + r, y);
  c.arcTo(x + w, y, x + w, y + h, r);
  c.arcTo(x + w, y + h, x, y + h, r);
  c.arcTo(x, y + h, x, y, r);
  c.arcTo(x, y, x + w, y, r);
  c.closePath();
}

/** A small browser window for `site`, with its ads (zapped = false) or without them. */
function windowTexture(site: string, zapped: boolean): THREE.CanvasTexture {
  const cv = document.createElement('canvas');
  cv.width = CW;
  cv.height = CH;
  const c = cv.getContext('2d')!;
  roundRect(c, 2, 2, CW - 4, CH - 4, 22);
  c.fillStyle = '#120d28';
  c.fill();
  c.lineWidth = zapped ? 5 : 3;
  c.strokeStyle = zapped ? '#34d399' : '#3a3168';
  c.stroke();
  // title bar
  c.save();
  roundRect(c, 2, 2, CW - 4, CH - 4, 22);
  c.clip();
  c.fillStyle = '#1d1640';
  c.fillRect(0, 0, CW, 58);
  c.restore();
  ['#4b4570', '#4b4570', '#4b4570'].forEach((col, i) => {
    c.beginPath();
    c.arc(30 + i * 22, 29, 7, 0, Math.PI * 2);
    c.fillStyle = col;
    c.fill();
  });
  roundRect(c, 104, 13, zapped ? 252 : 380, 32, 16);
  c.fillStyle = '#0d0a20';
  c.fill();
  c.fillStyle = '#b8b2dc';
  c.font = `500 19px ${MONO}`;
  c.fillText(site, 122, 36);
  if (zapped) {
    roundRect(c, 366, 13, 124, 32, 16);
    c.fillStyle = '#34d399';
    c.fill();
    c.fillStyle = '#06281c';
    c.font = `800 16px ${FONT}`;
    c.fillText('ZAPPED', 396, 35);
  }
  // page copy
  const bar = (x: number, y: number, w: number, h: number, col: string) => {
    roundRect(c, x, y, w, h, h / 2);
    c.fillStyle = col;
    c.fill();
  };
  bar(34, 88, 200, 18, '#3a3168');
  [128, 150, 172, 214, 236, 258, 280].forEach((y, i) => bar(34, y, [270, 246, 258, 270, 232, 262, 210][i], 10, '#2a2350'));
  if (!zapped) {
    c.setLineDash([10, 8]);
    c.lineWidth = 3;
    [
      [330, 84, 148, 104],
      [330, 202, 148, 104],
    ].forEach(([x, y, w, h]) => {
      roundRect(c, x, y, w, h, 12);
      c.fillStyle = '#2a1c48';
      c.fill();
      c.strokeStyle = '#f87171';
      c.stroke();
      c.fillStyle = '#f87171';
      c.font = `700 22px ${MONO}`;
      c.fillText('A D', x + 50, y + h / 2 + 8);
    });
    c.setLineDash([]);
  }
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

function glowTexture(): THREE.CanvasTexture {
  const cv = document.createElement('canvas');
  cv.width = cv.height = 256;
  const c = cv.getContext('2d')!;
  const g = c.createRadialGradient(128, 128, 0, 128, 128, 128);
  g.addColorStop(0, 'rgba(173,140,255,0.85)');
  g.addColorStop(0.35, 'rgba(124,92,255,0.35)');
  g.addColorStop(1, 'rgba(124,92,255,0)');
  c.fillStyle = g;
  c.fillRect(0, 0, 256, 256);
  return new THREE.CanvasTexture(cv);
}

/** The bolt from AdZap's icon (M13 2 4.5 13.5h5.2L8.6 22l9.9-12.2h-5.6z) extruded, centred on the origin. */
function boltGeometry(): THREE.ExtrudeGeometry {
  const pts: [number, number][] = [
    [13, 2],
    [4.5, 13.5],
    [9.7, 13.5],
    [8.6, 22],
    [18.5, 9.8],
    [12.9, 9.8],
    [13, 2],
  ];
  const s = new THREE.Shape();
  pts.forEach(([x, y], i) => (i ? s.lineTo((x - 11.5) / 10, -(y - 12) / 10) : s.moveTo((x - 11.5) / 10, -(y - 12) / 10)));
  const g = new THREE.ExtrudeGeometry(s, { depth: 0.22, bevelEnabled: true, bevelThickness: 0.05, bevelSize: 0.04, bevelSegments: 3 });
  g.center();
  return g;
}

function hexRing(r: number): THREE.BufferGeometry {
  const p: number[] = [];
  for (let i = 0; i <= 6; i++) {
    const a = (i / 6) * Math.PI * 2 + Math.PI / 6;
    p.push(Math.cos(a) * r, Math.sin(a) * r, 0);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3));
  return g;
}

/** Where window i sits on its slow orbit around the bolt (local space). */
function slot(i: number, t: number, out: THREE.Vector3) {
  const a = (i / 6) * Math.PI * 2 + t * 0.06 + 0.4;
  out.set(Math.cos(a) * 2.45, Math.sin(a) * 1.55 + Math.sin(t * 0.4 + i) * 0.06, Math.sin(a) * 0.9 - 0.2);
  return out;
}

export function AdZapField({ position, detail }: { position: Vec3; detail: Detail }) {
  const root = useRef<THREE.Group>(null);
  const bolt = useRef<THREE.Mesh>(null);
  const ringA = useRef<THREE.LineLoop>(null);
  const ringB = useRef<THREE.LineLoop>(null);
  const wins = useRef<(THREE.Mesh | null)[]>([]);
  const arrive = useRef(0);
  const mask = useRef(0);
  const strikes = useRef<number[]>(adzap.sites.map(() => -99));
  const zapAmt = useRef<number[]>(adzap.sites.map(() => 0));
  const tmp = useMemo(() => new THREE.Vector3(), []);

  const sparksOn = detail !== 'low';

  const textures = useMemo(
    () =>
      adzap.sites.map((s) => {
        const ads = windowTexture(s, false);
        const clean = windowTexture(s, true);
        const mat = new THREE.MeshBasicMaterial({ map: ads, transparent: true, toneMapped: false, fog: false, depthWrite: false });
        return { ads, clean, mat };
      }),
    [],
  );
  const winGeo = useMemo(() => new THREE.PlaneGeometry(WIN_W, WIN_H), []);
  const boltGeo = useMemo(() => boltGeometry(), []);
  const boltMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#b39bff', emissive: '#7c5cff', emissiveIntensity: 0.9, metalness: 0.2, roughness: 0.35, fog: false }),
    [],
  );
  const glow = useMemo(() => {
    const map = glowTexture();
    return new THREE.MeshBasicMaterial({ map, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false, opacity: 0 });
  }, []);
  const ringGeoA = useMemo(() => hexRing(1.25), []);
  const ringGeoB = useMemo(() => hexRing(1.6), []);
  const ringMatA = useMemo(() => new THREE.LineBasicMaterial({ color: '#9b6bff', transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }), []);
  const ringMatB = useMemo(() => new THREE.LineBasicMaterial({ color: '#34d399', transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }), []);

  // One jagged arc per window, rebuilt every frame while it strikes.
  const arcs = useMemo(
    () =>
      adzap.sites.map(() => {
        const g = new THREE.BufferGeometry();
        g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(14 * 3), 3));
        const core = new THREE.LineBasicMaterial({ color: '#f3edff', transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, fog: false });
        const line = new THREE.Line(g, core);
        line.frustumCulled = false;
        return { g, core, line };
      }),
    [],
  );

  const sparks = useMemo(() => {
    const n = adzap.sites.length * SPARKS;
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 3), 3));
    g.setAttribute('color', new THREE.BufferAttribute(new Float32Array(n * 3), 3));
    const dir = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const e = (Math.random() - 0.5) * 1.6;
      const sp = 0.6 + Math.random() * 1.4;
      dir[i * 3] = Math.cos(a) * Math.cos(e) * sp;
      dir[i * 3 + 1] = Math.sin(e) * sp;
      dir[i * 3 + 2] = Math.sin(a) * Math.cos(e) * sp * 0.5;
    }
    const mat = new THREE.PointsMaterial({ size: 0.07, vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false });
    const pts = new THREE.Points(g, mat);
    pts.frustumCulled = false;
    return { g, mat, dir, pts };
  }, []);

  useEffect(
    () => () => {
      textures.forEach((t) => {
        t.ads.dispose();
        t.clean.dispose();
        t.mat.dispose();
      });
      arcs.forEach((a) => {
        a.g.dispose();
        a.core.dispose();
      });
      sparks.g.dispose();
      sparks.mat.dispose();
      glow.map?.dispose();
      glow.dispose();
    },
    [textures, arcs, sparks, glow],
  );

  useFrame((state, dt) => {
    const camY = state.camera.position.y;
    arrive.current = THREE.MathUtils.damp(arrive.current, proximity(camY, position[1], 2.2, 6.5), 3, dt);
    const A = arrive.current;
    const g = root.current;
    if (g) {
      g.visible = A > 0.01;
      g.position.y = position[1] - (1 - A) * 1.8;
    }
    if (A <= 0.01) return;

    const rm = world.reducedMotion;
    const t = state.clock.elapsedTime;
    const tm = rm ? 0 : t;
    const now = t;

    // New switches: strike the windows that just turned on.
    const m = world.zapMask;
    if (m !== mask.current) {
      for (let i = 0; i < adzap.sites.length; i++) {
        const was = (mask.current >> i) & 1;
        const is = (m >> i) & 1;
        if (is && !was) strikes.current[i] = rm ? -99 : now;
        textures[i].mat.map = is ? textures[i].clean : textures[i].ads;
        textures[i].mat.needsUpdate = true;
      }
      mask.current = m;
    }

    if (bolt.current) {
      bolt.current.rotation.y = rm ? 0.35 : Math.sin(t * 0.5) * 0.45;
      bolt.current.rotation.x = rm ? 0 : Math.sin(t * 0.33) * 0.08;
      // Brighten on every strike.
      const recent = Math.max(0, ...strikes.current.map((s) => 1 - (now - s) / STRIKE));
      boltMat.emissiveIntensity = 0.8 + recent * 1.6;
    }
    glow.opacity = A * (0.55 + Math.sin(tm * 1.4) * 0.08);
    if (ringA.current) ringA.current.rotation.z = tm * 0.12;
    if (ringB.current) ringB.current.rotation.z = -tm * 0.08 + 0.3;
    ringMatA.opacity = A * 0.55;
    let zapped = 0;
    for (let i = 0; i < adzap.sites.length; i++) zapped += (m >> i) & 1;
    ringMatB.opacity = A * (0.12 + (zapped / adzap.sites.length) * 0.45);

    // Windows: orbit, face the camera, pop when struck, swell on hover.
    const pos = sparks.g.attributes.position as THREE.BufferAttribute;
    const col = sparks.g.attributes.color as THREE.BufferAttribute;
    for (let i = 0; i < adzap.sites.length; i++) {
      const w = wins.current[i];
      slot(i, tm, tmp);
      const age = now - strikes.current[i];
      const on = (m >> i) & 1;
      zapAmt.current[i] = THREE.MathUtils.damp(zapAmt.current[i], on, 6, dt);
      if (w) {
        w.position.copy(tmp);
        w.lookAt(state.camera.position);
        const pop = age >= 0 && age < 0.4 ? Math.sin((age / 0.4) * Math.PI) * 0.14 : 0;
        const hov = world.zapHover === i ? 0.1 : 0;
        w.scale.setScalar(1 + pop + hov);
        textures[i].mat.opacity = A * (0.78 + zapAmt.current[i] * 0.22);
      }

      // The arc: jagged path from the bolt to the window, flickering out.
      const arc = arcs[i];
      const live = age >= 0 && age < STRIKE;
      arc.core.opacity = live ? A * (1 - age / STRIKE) * (0.6 + Math.random() * 0.4) : 0;
      if (live) {
        const a = arc.g.attributes.position as THREE.BufferAttribute;
        const n = a.count;
        for (let k = 0; k < n; k++) {
          const f = k / (n - 1);
          const j = k === 0 || k === n - 1 ? 0 : 0.22 * Math.sin(f * Math.PI);
          a.setXYZ(k, tmp.x * f + (Math.random() - 0.5) * j, tmp.y * f + (Math.random() - 0.5) * j, tmp.z * f + (Math.random() - 0.5) * j * 0.5);
        }
        a.needsUpdate = true;
      }

      // Sparks burst from the window as its ads burn away.
      if (sparksOn) {
        const st = age >= 0 && age < 1.1 ? age : -1;
        for (let k = 0; k < SPARKS; k++) {
          const idx = i * SPARKS + k;
          if (st < 0) {
            pos.setXYZ(idx, 0, -999, 0);
            continue;
          }
          const d = sparks.dir;
          pos.setXYZ(idx, tmp.x + d[idx * 3] * st * 0.9, tmp.y + d[idx * 3 + 1] * st * 0.9 - st * st * 0.3, tmp.z + d[idx * 3 + 2] * st * 0.9);
          const fade = (1 - st / 1.1) * A;
          if (k % 3 === 0) col.setXYZ(idx, 0.2 * fade, 0.83 * fade, 0.6 * fade);
          else col.setXYZ(idx, 0.75 * fade, 0.62 * fade, 1 * fade);
        }
      }
    }
    if (sparksOn) {
      pos.needsUpdate = true;
      col.needsUpdate = true;
    }
  });

  return (
    <group ref={root} position={position} visible={false}>
      <mesh material={glow} position={[0, 0, -0.3]}>
        <planeGeometry args={[4.2, 4.2]} />
      </mesh>
      <lineLoop ref={ringA} geometry={ringGeoA} material={ringMatA} />
      <lineLoop ref={ringB} geometry={ringGeoB} material={ringMatB} />
      <mesh ref={bolt} geometry={boltGeo} material={boltMat} scale={1.35} />
      <pointLight color="#9b6bff" intensity={4} distance={7} decay={1.6} position={[0, 0, 1.2]} />
      {textures.map((tx, i) => (
        <mesh
          key={i}
          ref={(el) => {
            wins.current[i] = el;
          }}
          geometry={winGeo}
          material={tx.mat}
        />
      ))}
      {arcs.map((a, i) => (
        <primitive key={i} object={a.line} />
      ))}
      {sparksOn && <primitive object={sparks.pts} />}
    </group>
  );
}
