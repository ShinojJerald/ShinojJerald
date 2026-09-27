import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { proximity, world } from '../lib/world';
import { palette, simplex3 } from './glsl';

const coreVert = /* glsl */ `
${simplex3}
uniform float uTime;
uniform float uAmp;
varying vec3 vViewPos;
varying float vDisp;
varying float vY;
void main(){
  vec3 dir = normalize(position);
  float n  = snoise(dir * 1.35 + vec3(0.0, uTime * 0.11, 0.0));
  float n2 = snoise(dir * 3.4  - vec3(uTime * 0.17)) * 0.35;
  float d  = (n + n2) * uAmp;
  vDisp = d;
  vec3 p = position + normal * d;
  vY = p.y;
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  vViewPos = mv.xyz;
  gl_Position = projectionMatrix * mv;
}`;

const coreFrag = /* glsl */ `
${palette}
uniform float uTime;
uniform float uHover;
varying vec3 vViewPos;
varying float vDisp;
varying float vY;
void main(){
  // Faceted normal from screen-space derivatives → crystalline look.
  vec3 N = normalize(cross(dFdx(vViewPos), dFdy(vViewPos)));
  vec3 V = normalize(-vViewPos);
  float fres = pow(1.0 - clamp(abs(dot(N, V)), 0.0, 1.0), 2.4);
  float key  = clamp(dot(N, normalize(vec3(0.25, 0.85, 0.45))), 0.0, 1.0);
  vec3 col = DEEP * 0.9 + OCEAN * key * 0.55 + CYAN * fres * (0.75 + uHover * 0.55);
  col += VIOLET * smoothstep(0.05, 0.2, vDisp) * 0.12;
  // Slow horizontal "scan" slices — data being read.
  float band = smoothstep(0.992, 1.0, sin(vY * 5.0 - uTime * 0.7) * 0.5 + 0.5);
  col += CYAN * band * (0.22 + uHover * 0.35);
  gl_FragColor = vec4(col, 0.94);
}`;

const glowVert = /* glsl */ `
varying vec2 vUv;
void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
const glowFrag = /* glsl */ `
${palette}
uniform float uStrength;
varying vec2 vUv;
void main(){
  float d = length(vUv - 0.5) * 2.0;
  float a = pow(clamp(1.0 - d, 0.0, 1.0), 2.6) * uStrength;
  gl_FragColor = vec4(mix(ELEC, CYAN, 1.0 - d) * a, a);
}`;

type Props = { position: [number, number, number]; detail: number };

/** Faceted, softly breathing crystal at the heart of the observatory. */
export function DataCore({ position, detail }: Props) {
  const group = useRef<THREE.Group>(null);
  const inner = useRef<THREE.Group>(null);
  const shell = useRef<THREE.LineSegments>(null);
  const rings = useRef<THREE.Group>(null);
  const wave = useRef<THREE.Line>(null);
  const hover = useRef(0);
  const spin = useRef(0);
  const projected = useMemo(() => new THREE.Vector3(), []);

  const coreMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: coreVert,
        fragmentShader: coreFrag,
        transparent: true,
        uniforms: { uTime: { value: 0 }, uAmp: { value: 0.1 }, uHover: { value: 0 } },
      }),
    [],
  );
  const glowMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: glowVert,
        fragmentShader: glowFrag,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: { uStrength: { value: 0.55 } },
      }),
    [],
  );

  const shellGeo = useMemo(() => new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(1.75, 1)), []);

  // Orbit rings: dotted ellipses with a few brighter travelling data points.
  const ringGeos = useMemo(() => {
    return [2.35, 2.8, 3.3].map((r, k) => {
      const n = 180 + k * 40;
      const arr = new Float32Array(n * 3);
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2;
        arr[i * 3] = Math.cos(a) * r;
        arr[i * 3 + 1] = 0;
        arr[i * 3 + 2] = Math.sin(a) * r * 0.92;
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(arr, 3));
      return g;
    });
  }, []);

  const WAVE_N = 256;
  const waveGeo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array((WAVE_N + 1) * 3), 3));
    return g;
  }, []);
  const waveLine = useMemo(
    () =>
      new THREE.Line(
        waveGeo,
        new THREE.LineBasicMaterial({ color: '#7fe3ff', transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false }),
      ),
    [waveGeo],
  );

  useFrame((state, dt) => {
    const t = state.clock.elapsedTime * (world.reducedMotion ? 0.2 : 1);
    const g = group.current;
    if (!g) return;
    const vis = proximity(state.camera.position.y, position[1], 6, 11) > 0;
    g.visible = vis;
    if (!vis) return;

    // Cursor proximity → "hover" energy, computed without raycasting.
    projected.set(position[0], position[1], position[2]).project(state.camera);
    const dx = projected.x - world.pointerX;
    const dy = projected.y - world.pointerY;
    const near = THREE.MathUtils.smoothstep(0.55 - Math.hypot(dx, dy), 0, 0.4);
    hover.current = THREE.MathUtils.damp(hover.current, Math.max(near, world.hoverBoost), 3, dt);

    const v = world.reducedMotion ? 0 : world.velocity;
    coreMat.uniforms.uTime.value = t;
    coreMat.uniforms.uHover.value = hover.current;
    coreMat.uniforms.uAmp.value = 0.09 + v * 0.14 + hover.current * 0.07;
    glowMat.uniforms.uStrength.value = 0.45 + hover.current * 0.3 + v * 0.2;

    // Gentle tilt toward the cursor; slow spin that scrolling nudges.
    spin.current += dt * (0.05 + v * 0.6) * (world.reducedMotion ? 0.2 : 1);
    if (inner.current) {
      inner.current.rotation.y = spin.current;
      inner.current.rotation.x = THREE.MathUtils.damp(inner.current.rotation.x, world.pointerY * 0.25, 2, dt);
      inner.current.rotation.z = THREE.MathUtils.damp(inner.current.rotation.z, -world.pointerX * 0.15, 2, dt);
    }
    if (shell.current) {
      shell.current.rotation.y = -spin.current * 0.6;
      shell.current.rotation.x = t * 0.02;
      (shell.current.material as THREE.LineBasicMaterial).opacity = 0.14 + hover.current * 0.2;
    }
    if (rings.current) {
      rings.current.children.forEach((c, i) => {
        c.rotation.y = t * (0.04 + i * 0.015) * (i % 2 ? -1 : 1);
      });
    }

    // Circular waveform "listening" to the scroll.
    const pos = waveGeo.attributes.position as THREE.BufferAttribute;
    const amp = 0.04 + v * 0.22 + hover.current * 0.06;
    for (let i = 0; i <= WAVE_N; i++) {
      const a = (i / WAVE_N) * Math.PI * 2;
      const r = 2.05 + Math.sin(a * 9 + t * 1.3) * amp + Math.sin(a * 23 - t * 2.1) * amp * 0.35;
      pos.setXYZ(i, Math.cos(a) * r, Math.sin(a * 3 + t * 0.5) * 0.04, Math.sin(a) * r);
    }
    pos.needsUpdate = true;
    if (wave.current) wave.current.rotation.x = 0.35 + world.pointerY * 0.05;

    // Subtle breathing float.
    g.position.y = position[1] + Math.sin(t * 0.6) * 0.08;
  });

  return (
    <group ref={group} position={position}>
      <mesh position={[0, 0, -0.6]} material={glowMat} renderOrder={-1}>
        <planeGeometry args={[9, 9]} />
      </mesh>
      <group ref={inner}>
        <mesh material={coreMat}>
          <icosahedronGeometry args={[1.25, detail]} />
        </mesh>
      </group>
      <lineSegments ref={shell} geometry={shellGeo}>
        <lineBasicMaterial color="#58c8ff" transparent opacity={0.16} blending={THREE.AdditiveBlending} depthWrite={false} />
      </lineSegments>
      <group ref={rings} rotation={[0.42, 0, -0.12]}>
        {ringGeos.map((geo, i) => (
          <points key={i} geometry={geo} rotation={[i * 0.22, 0, i * 0.14]}>
            <pointsMaterial
              color={i === 1 ? '#9aa8ff' : '#6fd8ff'}
              size={i === 2 ? 0.022 : 0.028}
              sizeAttenuation
              transparent
              opacity={0.55 - i * 0.12}
              depthWrite={false}
              blending={THREE.AdditiveBlending}
            />
          </points>
        ))}
      </group>
      <primitive ref={wave} object={waveLine} />
    </group>
  );
}
