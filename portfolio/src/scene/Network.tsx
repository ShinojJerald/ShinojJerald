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

type Props = { position: [number, number, number]; nodes: number; radius?: number; seed?: number };

/** A slowly turning constellation of data points joined by fine lines. */
export function Network({ position, nodes, radius = 5, seed = 7 }: Props) {
  const group = useRef<THREE.Group>(null);
  const pts = useRef<THREE.Points>(null);

  const { pointGeo, lineGeo } = useMemo(() => {
    const rnd = mulberry32(seed);
    const p: THREE.Vector3[] = [];
    for (let i = 0; i < nodes; i++) {
      // Flattened ellipsoid distribution reads as a "map" rather than a ball.
      const u = rnd() * Math.PI * 2;
      const v = Math.acos(2 * rnd() - 1);
      const r = radius * Math.cbrt(rnd());
      p.push(new THREE.Vector3(Math.sin(v) * Math.cos(u) * r * 1.35, Math.cos(v) * r * 0.55, Math.sin(v) * Math.sin(u) * r));
    }
    const pos = new Float32Array(nodes * 3);
    p.forEach((v, i) => v.toArray(pos, i * 3));
    const pg = new THREE.BufferGeometry();
    pg.setAttribute('position', new THREE.BufferAttribute(pos, 3));

    const seg: number[] = [];
    const col: number[] = [];
    const maxD = radius * 0.42;
    for (let i = 0; i < nodes; i++) {
      let links = 0;
      for (let j = i + 1; j < nodes && links < 3; j++) {
        const d = p[i].distanceTo(p[j]);
        if (d < maxD) {
          const a = 1 - d / maxD;
          seg.push(...p[i].toArray(), ...p[j].toArray());
          col.push(0.3 * a, 0.75 * a, 1.0 * a, 0.3 * a, 0.75 * a, 1.0 * a);
          links++;
        }
      }
    }
    const lg = new THREE.BufferGeometry();
    lg.setAttribute('position', new THREE.BufferAttribute(new Float32Array(seg), 3));
    lg.setAttribute('color', new THREE.BufferAttribute(new Float32Array(col), 3));
    return { pointGeo: pg, lineGeo: lg };
  }, [nodes, radius, seed]);

  useFrame((state, dt) => {
    const g = group.current;
    if (!g) return;
    const k = world.reducedMotion ? 0.15 : 1;
    g.rotation.y += dt * (0.025 + world.velocity * 0.15) * k;
    g.rotation.x = THREE.MathUtils.damp(g.rotation.x, 0.12 + world.pointerY * 0.08, 1.5, dt);
    if (pts.current) {
      (pts.current.material as THREE.PointsMaterial).size = 0.07 + Math.sin(state.clock.elapsedTime * 1.4 * k) * 0.012;
    }
  });

  return (
    <group ref={group} position={position}>
      <lineSegments geometry={lineGeo}>
        <lineBasicMaterial vertexColors transparent opacity={0.3} blending={THREE.AdditiveBlending} depthWrite={false} />
      </lineSegments>
      <points ref={pts} geometry={pointGeo}>
        <pointsMaterial color="#a9ecff" size={0.07} sizeAttenuation transparent opacity={0.9} depthWrite={false} blending={THREE.AdditiveBlending} />
      </points>
    </group>
  );
}
