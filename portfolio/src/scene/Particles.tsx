import { useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { world } from '../lib/world';
import { palette } from './glsl';

const Y_TOP = 9;
const Y_BOTTOM = -46;

const vert = /* glsl */ `
uniform float uTime;
uniform float uVel;
uniform float uPix;
uniform vec2  uPointer;
attribute float aSeed;
varying float vSeed;
varying float vFade;
void main(){
  vec3 p = position;
  float range = ${(Y_TOP - Y_BOTTOM).toFixed(1)};
  // Slow upward drift, like fine particulate in a deep current.
  p.y = ${Y_BOTTOM.toFixed(1)} + mod(position.y - ${Y_BOTTOM.toFixed(1)} + uTime * (0.05 + aSeed * 0.12), range);
  p.x += sin(uTime * 0.21 + aSeed * 6.2831) * 0.35;
  p.z += cos(uTime * 0.17 + aSeed * 12.566) * 0.25;
  // Scrolling adds a little turbulence.
  p.x += sin(uTime * 2.7 + aSeed * 40.0) * uVel * 0.18;
  p.y += cos(uTime * 2.3 + aSeed * 31.0) * uVel * 0.22;
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  // Cursor parts nearby particles very slightly.
  vec4 clip = projectionMatrix * mv;
  vec2 ndc = clip.xy / clip.w;
  vec2 away = ndc - uPointer;
  float push = smoothstep(0.25, 0.0, length(away)) * 0.35;
  mv.xy += normalize(away + 1e-4) * push;
  gl_Position = projectionMatrix * mv;
  float size = (0.6 + aSeed * 1.6) * (1.0 + uVel * 0.5);
  gl_PointSize = size * uPix * 18.0 / -mv.z;
  vSeed = aSeed;
  vFade = smoothstep(46.0, 6.0, -mv.z) * smoothstep(0.4, 2.5, -mv.z);
}`;

const frag = /* glsl */ `
${palette}
varying float vSeed;
varying float vFade;
void main(){
  vec2 c = gl_PointCoord - 0.5;
  float d = length(c);
  float a = smoothstep(0.5, 0.0, d);
  a *= a;
  vec3 col = mix(CYAN, vec3(0.85, 0.95, 1.0), step(0.82, vSeed));
  col = mix(col, VIOLET, step(0.975, vSeed));
  float alpha = a * vFade * (0.25 + vSeed * 0.5);
  gl_FragColor = vec4(col * alpha, alpha);
}`;

export function Particles({ count }: { count: number }) {
  const gl = useThree((s) => s.gl);
  const { geo, mat } = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const seed = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 30;
      pos[i * 3 + 1] = Y_BOTTOM + Math.random() * (Y_TOP - Y_BOTTOM);
      pos[i * 3 + 2] = -24 + Math.random() * 30;
      seed[i] = Math.random();
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1));
    // Particles wrap vertically in the shader, so never frustum-cull them.
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, -18, -8), 1000);
    const m = new THREE.ShaderMaterial({
      vertexShader: vert,
      fragmentShader: frag,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uTime: { value: 0 },
        uVel: { value: 0 },
        uPix: { value: 1 },
        uPointer: { value: new THREE.Vector2(9, 9) },
      },
    });
    return { geo: g, mat: m };
  }, [count]);

  useFrame((state) => {
    const rm = world.reducedMotion;
    mat.uniforms.uTime.value = state.clock.elapsedTime * (rm ? 0.25 : 1);
    mat.uniforms.uVel.value = rm ? 0 : world.velocity;
    mat.uniforms.uPix.value = gl.getPixelRatio() * (state.size.height / 900);
    (mat.uniforms.uPointer.value as THREE.Vector2).set(world.pointerX, world.pointerY);
  });

  return <points geometry={geo} material={mat} frustumCulled={false} />;
}
