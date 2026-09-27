import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { world } from '../lib/world';
import { palette } from './glsl';

const vert = /* glsl */ `
varying vec2 vUv;
void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;

const frag = /* glsl */ `
${palette}
uniform float uHot;
uniform float uTime;
uniform float uSeed;
varying vec2 vUv;
void main(){
  vec2 d = min(vUv, 1.0 - vUv);
  float edge = 1.0 - smoothstep(0.0, 0.035, min(d.x, d.y * 0.72));
  float fill = 0.05 + uHot * 0.08;
  // A faint "seal" ring and two text-like rules, suggesting a credential.
  float ring = smoothstep(0.012, 0.0, abs(length((vUv - vec2(0.24, 0.62)) * vec2(1.0, 0.72)) - 0.11));
  float rule1 = step(0.44, vUv.x) * step(vUv.x, 0.86) * smoothstep(0.012, 0.0, abs(vUv.y - 0.66));
  float rule2 = step(0.44, vUv.x) * step(vUv.x, 0.72) * smoothstep(0.012, 0.0, abs(vUv.y - 0.54));
  float scan = smoothstep(0.03, 0.0, abs(fract(vUv.y - uTime * 0.05 + uSeed) - 0.5)) * 0.25;
  float a = fill + edge * (0.45 + uHot * 0.5) + (ring + rule1 + rule2) * (0.18 + uHot * 0.3) + scan * (0.3 + uHot);
  vec3 col = mix(ELEC, CYAN, 0.35 + uHot * 0.65);
  gl_FragColor = vec4(col * a, a * 0.9);
}`;

/**
 * One translucent credential panel per certification, floating in a shallow
 * arc behind the Certifications section. Hovering a card in the DOM lifts and
 * brightens its panel here.
 */
export function CredentialPanels({ position, count, spread = 1 }: { position: [number, number, number]; count: number; spread?: number }) {
  const group = useRef<THREE.Group>(null);
  const hot = useRef<number[]>([]);

  const panels = useMemo(() => {
    const geo = new THREE.PlaneGeometry(1.5, 1.05);
    const cols = Math.ceil(count / 2);
    return Array.from({ length: count }, (_, i) => {
      const row = i % 2;
      const col = Math.floor(i / 2);
      const t = cols > 1 ? col / (cols - 1) : 0.5;
      const a = (t - 0.5) * 1.9;
      const r = 9;
      const mat = new THREE.ShaderMaterial({
        vertexShader: vert,
        fragmentShader: frag,
        transparent: true,
        depthWrite: false,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
        uniforms: { uHot: { value: 0 }, uTime: { value: 0 }, uSeed: { value: i * 0.137 } },
      });
      return {
        geo,
        mat,
        base: new THREE.Vector3(Math.sin(a) * r, (row - 0.5) * 1.55 + (col % 2) * 0.25, -Math.cos(a) * r + r - 2.5),
        rotY: -a * 0.85,
        phase: i * 0.9,
      };
    });
  }, [count]);

  useFrame((state, dt) => {
    const t = state.clock.elapsedTime * (world.reducedMotion ? 0.15 : 1);
    const g = group.current;
    if (!g) return;
    g.scale.setScalar(spread);
    g.children.forEach((m, i) => {
      const p = panels[i];
      const h = THREE.MathUtils.damp(hot.current[i] ?? 0, world.credFocus === i ? 1 : 0, 6, dt);
      hot.current[i] = h;
      p.mat.uniforms.uHot.value = h;
      p.mat.uniforms.uTime.value = t;
      m.position.set(p.base.x, p.base.y + Math.sin(t * 0.5 + p.phase) * 0.08 + h * 0.25, p.base.z + h * 0.9);
      m.rotation.set(Math.sin(t * 0.3 + p.phase) * 0.04, p.rotY + world.pointerX * 0.06, 0);
    });
  });

  return (
    <group ref={group} position={position}>
      {panels.map((p, i) => (
        <mesh key={i} geometry={p.geo} material={p.mat} />
      ))}
    </group>
  );
}
