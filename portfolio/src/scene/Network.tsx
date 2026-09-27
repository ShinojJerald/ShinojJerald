import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { world } from '../lib/world';

/** Deterministic PRNG so the constellation is the same on every visit. */
function mulberry32(a: number) {
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Props = {
  position: [number, number, number];
  nodes: number;
  radius?: number;
  seed?: number;
  /** When set, nodes form this many clusters around a hub (one per skill group). */
  groups?: number;
  /** Which shared focus value lights up a cluster. */
  focus?: 'skill';
};

const BASE = new THREE.Color('#4aa8ff');
const HOT = new THREE.Color('#b8f1ff');

/**
 * A slowly turning constellation of data points joined by fine lines.
 * In grouped mode each cluster maps to a skill group in the DOM: exploring a
 * group brightens its cluster and the lines that feed the hub.
 */
export function Network({ position, nodes, radius = 5, seed = 7, groups = 0, focus }: Props) {
  const group = useRef<THREE.Group>(null);
  const pts = useRef<THREE.Points>(null);
  const glow = useRef<number[]>([]);

  const { pointGeo, lineGeo, nodeGroup, segGroup } = useMemo(() => {
    const rnd = mulberry32(seed);
    const p: THREE.Vector3[] = [];
    const g: number[] = [];
    if (groups > 0) {
      // Hub at the centre, clusters on a tilted ring around it.
      const centres = Array.from({ length: groups }, (_, k) => {
        const a = (k / groups) * Math.PI * 2;
        return new THREE.Vector3(Math.cos(a) * radius * 0.95, Math.sin(a * 2) * radius * 0.12, Math.sin(a) * radius * 0.6);
      });
      p.push(new THREE.Vector3());
      g.push(-1);
      for (let i = 1; i < nodes; i++) {
        const k = i % groups;
        const c = centres[k];
        const r = radius * 0.32 * Math.cbrt(rnd());
        const u = rnd() * Math.PI * 2;
        const v = Math.acos(2 * rnd() - 1);
        p.push(new THREE.Vector3(c.x + Math.sin(v) * Math.cos(u) * r, c.y + Math.cos(v) * r * 0.6, c.z + Math.sin(v) * Math.sin(u) * r));
        g.push(k);
      }
    } else {
      for (let i = 0; i < nodes; i++) {
        const u = rnd() * Math.PI * 2;
        const v = Math.acos(2 * rnd() - 1);
        const r = radius * Math.cbrt(rnd());
        p.push(new THREE.Vector3(Math.sin(v) * Math.cos(u) * r * 1.35, Math.cos(v) * r * 0.55, Math.sin(v) * Math.sin(u) * r));
        g.push(-1);
      }
    }

    const pos = new Float32Array(p.length * 3);
    const col = new Float32Array(p.length * 3);
    p.forEach((v, i) => {
      v.toArray(pos, i * 3);
      BASE.toArray(col, i * 3);
    });
    const pg = new THREE.BufferGeometry();
    pg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    pg.setAttribute('color', new THREE.BufferAttribute(col, 3));

    const seg: number[] = [];
    const sg: number[] = [];
    const maxD = groups > 0 ? radius * 0.3 : radius * 0.42;
    for (let i = 0; i < p.length; i++) {
      let links = 0;
      for (let j = i + 1; j < p.length && links < 3; j++) {
        if (groups > 0 && g[i] !== g[j]) continue;
        if (p[i].distanceTo(p[j]) < maxD) {
          seg.push(...p[i].toArray(), ...p[j].toArray());
          sg.push(g[i]);
          links++;
        }
      }
    }
    if (groups > 0) {
      // Each cluster's closest node feeds the hub.
      for (let k = 0; k < groups; k++) {
        let best = -1;
        let bd = Infinity;
        p.forEach((v, i) => {
          if (g[i] === k && v.length() < bd) {
            bd = v.length();
            best = i;
          }
        });
        if (best >= 0) {
          seg.push(0, 0, 0, ...p[best].toArray());
          sg.push(k);
        }
      }
    }
    const lg = new THREE.BufferGeometry();
    lg.setAttribute('position', new THREE.BufferAttribute(new Float32Array(seg), 3));
    const lc = new Float32Array((seg.length / 3) * 3);
    for (let i = 0; i < seg.length / 3; i++) BASE.clone().multiplyScalar(0.55).toArray(lc, i * 3);
    lg.setAttribute('color', new THREE.BufferAttribute(lc, 3));
    return { pointGeo: pg, lineGeo: lg, nodeGroup: g, segGroup: sg };
  }, [nodes, radius, seed, groups]);

  const tmp = useMemo(() => new THREE.Color(), []);

  useFrame((state, dt) => {
    const gr = group.current;
    if (!gr) return;
    const k = world.reducedMotion ? 0.15 : 1;
    gr.rotation.y += dt * (0.025 + world.velocity * 0.15) * k;
    gr.rotation.x = THREE.MathUtils.damp(gr.rotation.x, 0.12 + world.pointerY * 0.08, 1.5, dt);
    if (pts.current) {
      (pts.current.material as THREE.PointsMaterial).size = 0.07 + Math.sin(state.clock.elapsedTime * 1.4 * k) * 0.012;
    }

    if (!groups || focus !== 'skill') return;
    // Ease each cluster's glow toward the focused state, then recolour.
    const target = world.skillFocus;
    let changed = false;
    for (let c = 0; c < groups; c++) {
      const prev = glow.current[c] ?? 0;
      const next = THREE.MathUtils.damp(prev, c === target ? 1 : target >= 0 ? -0.5 : 0, 5, dt);
      if (Math.abs(next - prev) > 0.002) changed = true;
      glow.current[c] = next;
    }
    if (!changed) return;
    const colors = pointGeo.attributes.color as THREE.BufferAttribute;
    for (let i = 0; i < nodeGroup.length; i++) {
      const gl = nodeGroup[i] < 0 ? (target >= 0 ? 0.6 : 0) : glow.current[nodeGroup[i]];
      tmp.copy(BASE).lerp(HOT, Math.max(0, gl)).multiplyScalar(1 + Math.min(0, gl) * 0.9);
      colors.setXYZ(i, tmp.r, tmp.g, tmp.b);
    }
    colors.needsUpdate = true;
    const lcol = lineGeo.attributes.color as THREE.BufferAttribute;
    for (let s = 0; s < segGroup.length; s++) {
      const gl = glow.current[segGroup[s]] ?? 0;
      tmp.copy(BASE).lerp(HOT, Math.max(0, gl)).multiplyScalar(0.55 + Math.max(0, gl) * 0.9 + Math.min(0, gl) * 0.45);
      lcol.setXYZ(s * 2, tmp.r, tmp.g, tmp.b);
      lcol.setXYZ(s * 2 + 1, tmp.r, tmp.g, tmp.b);
    }
    lcol.needsUpdate = true;
  });

  return (
    <group ref={group} position={position}>
      <lineSegments geometry={lineGeo}>
        <lineBasicMaterial vertexColors transparent opacity={0.4} blending={THREE.AdditiveBlending} depthWrite={false} />
      </lineSegments>
      <points ref={pts} geometry={pointGeo}>
        <pointsMaterial vertexColors size={0.07} sizeAttenuation transparent opacity={0.95} depthWrite={false} blending={THREE.AdditiveBlending} />
      </points>
    </group>
  );
}
