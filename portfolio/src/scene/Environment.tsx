import { useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { world } from '../lib/world';
import { palette, simplex3 } from './glsl';

/* ─────────────────────────────  Ocean current (Experience)  ───────────────── */

const currentVert = /* glsl */ `
uniform float uTime;
uniform float uVel;
attribute float aT;
attribute float aSeed;
varying float vA;
void main(){
  float len = 9.0;
  float t = fract(aT + uTime * (0.025 + aSeed * 0.02) * (1.0 + uVel * 2.0));
  float y = t * len - len * 0.5;
  float ang = t * 12.566 + aSeed * 6.2831;
  float r = 0.35 + aSeed * 0.55 + sin(t * 9.0 + uTime * 0.4) * 0.12;
  vec3 p = vec3(cos(ang) * r, y, sin(ang) * r);
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = (1.2 + aSeed * 2.4) * 26.0 / -mv.z;
  vA = smoothstep(0.0, 0.15, t) * smoothstep(1.0, 0.8, t);
}`;
const currentFrag = /* glsl */ `
${palette}
varying float vA;
void main(){
  float a = smoothstep(0.5, 0.0, length(gl_PointCoord - 0.5)) * vA * 0.7;
  gl_FragColor = vec4(mix(ELEC, CYAN, 0.6) * a, a);
}`;

/** A rising spiral of light — the "data stream" behind the experience timeline. */
export function Current({ position, count }: { position: [number, number, number]; count: number }) {
  const { geo, mat } = useMemo(() => {
    const t = new Float32Array(count);
    const s = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      t[i] = Math.random();
      s[i] = Math.random();
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(count * 3), 3));
    g.setAttribute('aT', new THREE.BufferAttribute(t, 1));
    g.setAttribute('aSeed', new THREE.BufferAttribute(s, 1));
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 8);
    const m = new THREE.ShaderMaterial({
      vertexShader: currentVert,
      fragmentShader: currentFrag,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: { uTime: { value: 0 }, uVel: { value: 0 } },
    });
    return { geo: g, mat: m };
  }, [count]);
  useFrame((st) => {
    mat.uniforms.uTime.value = st.clock.elapsedTime * (world.reducedMotion ? 0.2 : 1);
    mat.uniforms.uVel.value = world.reducedMotion ? 0 : world.velocity;
  });
  return <points position={position} geometry={geo} material={mat} />;
}

/* ─────────────────────────────  Light rays from the surface  ──────────────── */

const rayVert = /* glsl */ `
varying vec2 vUv;
void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
const rayFrag = /* glsl */ `
${palette}
uniform float uTime;
uniform float uSeed;
uniform float uStrength;
varying vec2 vUv;
void main(){
  float edge = smoothstep(0.0, 0.5, vUv.x) * smoothstep(1.0, 0.5, vUv.x);
  float fall = pow(vUv.y, 1.6) * smoothstep(0.0, 0.25, vUv.y);
  float flick = 0.75 + 0.25 * sin(uTime * 0.45 + uSeed * 11.0) * sin(uTime * 0.31 + uSeed * 5.0);
  float a = edge * edge * fall * flick * uStrength;
  gl_FragColor = vec4(mix(CYAN, vec3(1.0), 0.25) * a, a);
}`;

export function LightRays() {
  const rays = useMemo(() => {
    const defs = [
      { x: -7, y: -4, z: -12, w: 3.2, r: 0.2, s: 0.07 },
      { x: -2, y: -6, z: -16, w: 4.5, r: 0.12, s: 0.06 },
      { x: 5, y: -8, z: -14, w: 2.6, r: 0.24, s: 0.07 },
      { x: 9, y: -14, z: -18, w: 3.8, r: 0.16, s: 0.05 },
      { x: -6, y: -20, z: -15, w: 3, r: 0.22, s: 0.055 },
      { x: 2, y: -26, z: -18, w: 5, r: 0.1, s: 0.05 },
      { x: -3, y: -32, z: -14, w: 3.6, r: 0.18, s: 0.06 },
      { x: 6, y: -34, z: -16, w: 4, r: 0.26, s: 0.05 },
    ];
    return defs.map((d, i) => ({
      ...d,
      mat: new THREE.ShaderMaterial({
        vertexShader: rayVert,
        fragmentShader: rayFrag,
        transparent: true,
        depthWrite: false,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
        uniforms: { uTime: { value: 0 }, uSeed: { value: i * 1.37 }, uStrength: { value: d.s } },
      }),
    }));
  }, []);
  useFrame((st) => {
    const t = st.clock.elapsedTime * (world.reducedMotion ? 0.2 : 1);
    rays.forEach((r) => (r.mat.uniforms.uTime.value = t));
  });
  return (
    <group>
      {rays.map((r, i) => (
        <mesh key={i} position={[r.x, r.y, r.z]} rotation={[0, 0, r.r]} material={r.mat}>
          <planeGeometry args={[r.w, 34]} />
        </mesh>
      ))}
    </group>
  );
}

/* ─────────────────────────────  Seafloor data terrain  ────────────────────── */

const floorVert = /* glsl */ `
${simplex3}
uniform float uTime;
attribute float aH;
varying float vH;
varying float vDist;
void main(){
  vec3 p = position;
  vec4 base = instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0);
  float swell = 0.75 + 0.25 * snoise(vec3(base.x * 0.15, base.z * 0.15, uTime * 0.08));
  float h = aH * swell;
  p.y = (p.y + 0.5) * h;
  vH = (p.y) / 3.0;
  vec4 wp = modelMatrix * instanceMatrix * vec4(p, 1.0);
  vec4 mv = viewMatrix * wp;
  vDist = -mv.z;
  gl_Position = projectionMatrix * mv;
}`;
const floorFrag = /* glsl */ `
${palette}
varying float vH;
varying float vDist;
void main(){
  vec3 col = mix(DEEP, OCEAN, clamp(vH, 0.0, 1.0));
  col += CYAN * smoothstep(0.55, 1.0, vH) * 0.6;
  float fog = smoothstep(26.0, 6.0, vDist);
  gl_FragColor = vec4(col * fog, 1.0);
}`;

/** An abstract terrain of slim columns on the seafloor — purely decorative, not data. */
export function Seafloor({ y, cols, rows }: { y: number; cols: number; rows: number }) {
  const { mesh, mat } = useMemo(() => {
    const count = cols * rows;
    const geo = new THREE.BoxGeometry(0.22, 1, 0.22);
    const m = new THREE.ShaderMaterial({ vertexShader: floorVert, fragmentShader: floorFrag, uniforms: { uTime: { value: 0 } } });
    const im = new THREE.InstancedMesh(geo, m, count);
    const h = new Float32Array(count);
    const tmp = new THREE.Object3D();
    let i = 0;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = (c - cols / 2) * 0.62;
        const z = -r * 0.62 + 2;
        tmp.position.set(x, 0, z);
        tmp.updateMatrix();
        im.setMatrixAt(i, tmp.matrix);
        const ridge = Math.sin(x * 0.35) * 0.6 + Math.cos(z * 0.5 + x * 0.1) * 0.5;
        h[i] = Math.max(0.08, 0.5 + ridge * 0.7 + Math.random() * 0.6) * (0.6 + Math.min(1, Math.abs(x) / 8));
        i++;
      }
    }
    geo.setAttribute('aH', new THREE.InstancedBufferAttribute(h, 1));
    im.frustumCulled = false;
    return { mesh: im, mat: m };
  }, [cols, rows]);
  useFrame((st) => {
    mat.uniforms.uTime.value = st.clock.elapsedTime * (world.reducedMotion ? 0.2 : 1);
  });
  return <primitive object={mesh} position={[0, y, 0]} />;
}
