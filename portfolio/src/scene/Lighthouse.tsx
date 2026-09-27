import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { beamAngle, world } from '../lib/world';
import { palette } from './glsl';

const beamVert = /* glsl */ `
varying vec2 vUv;
varying vec3 vN;
varying vec3 vV;
void main(){
  vUv = uv;
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vN = normalize(normalMatrix * normal);
  vV = normalize(-mv.xyz);
  gl_Position = projectionMatrix * mv;
}`;
const beamFrag = /* glsl */ `
${palette}
uniform float uStrength;
varying vec2 vUv;
varying vec3 vN;
varying vec3 vV;
void main(){
  float along = pow(vUv.y, 1.8);                  // bright at the lamp, fading outward
  float soft  = pow(abs(dot(normalize(vN), vV)), 1.4); // soft volumetric edges
  float a = along * soft * uStrength;
  vec3 col = mix(vec3(1.0, 0.96, 0.86), CYAN, 1.0 - vUv.y);
  gl_FragColor = vec4(col * a, a);
}`;

const glowFrag = /* glsl */ `
uniform float uStrength;
varying vec2 vUv;
varying vec3 vN;
varying vec3 vV;
void main(){
  float d = length(vUv - 0.5) * 2.0;
  float a = pow(clamp(1.0 - d, 0.0, 1.0), 3.0) * uStrength;
  gl_FragColor = vec4(vec3(1.0, 0.95, 0.85) * a, a);
}`;

/**
 * TuneKadal's lighthouse, built entirely from primitives (no external models).
 * The beam sweeps on the shared BEAM_PERIOD clock so the DOM copy can reveal
 * itself exactly when the light passes over the viewer.
 */
export function Lighthouse({ position }: { position: [number, number, number] }) {
  const beam = useRef<THREE.Group>(null);
  const glow = useRef<THREE.Mesh>(null);
  const rings = useRef<THREE.Group>(null);
  const lamp = useRef<THREE.PointLight>(null);
  const lit = useRef(0);

  const beamGeo = useMemo(() => {
    const g = new THREE.ConeGeometry(2.3, 17, 40, 1, true);
    g.translate(0, -8.5, 0); // apex at origin
    g.rotateZ(Math.PI / 2); // point along +X
    return g;
  }, []);
  const beamMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: beamVert,
        fragmentShader: beamFrag,
        transparent: true,
        depthWrite: false,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
        uniforms: { uStrength: { value: 0.35 } },
      }),
    [],
  );
  const glowMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: beamVert,
        fragmentShader: glowFrag,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: { uStrength: { value: 0.9 } },
      }),
    [],
  );
  const ringMats = useMemo(
    () =>
      [0, 1, 2].map(
        () =>
          new THREE.MeshBasicMaterial({
            color: '#6fdcff',
            transparent: true,
            opacity: 0,
            side: THREE.DoubleSide,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
          }),
      ),
    [],
  );

  const towerH = 4.2;
  const segs = 4;
  const LAMP_Y = towerH + 0.35;

  useFrame((state, dt) => {
    lit.current = THREE.MathUtils.damp(lit.current, world.lighthouse, 4, dt);
    const L = lit.current;
    if (beam.current) {
      beam.current.rotation.y = beamAngle();
    }
    beamMat.uniforms.uStrength.value = 0.5 + L * 0.4;
    glowMat.uniforms.uStrength.value = 1.1 + L * 0.6 + Math.sin(state.clock.elapsedTime * 2) * 0.05;
    if (glow.current) glow.current.quaternion.copy(state.camera.quaternion);
    if (lamp.current) lamp.current.intensity = 6 + L * 8;

    // Radio waves: expanding rings from the lantern.
    const t = state.clock.elapsedTime * (world.reducedMotion ? 0.15 : 1);
    rings.current?.children.forEach((c, i) => {
      const p = (t * 0.22 + i / 3) % 1;
      const s = 0.6 + p * 7;
      c.scale.set(s, s, s);
      ringMats[i].opacity = (1 - p) * (0.22 + L * 0.3) * Math.min(1, p * 6);
    });
  });

  const stripe = ['#dbe7f1', '#1e5f8c'];

  return (
    <group position={position}>
      {/* rock */}
      <mesh position={[0, -0.35, 0]} scale={[1.6, 0.6, 1.3]}>
        <dodecahedronGeometry args={[1.6, 0]} />
        <meshStandardMaterial color="#173a5a" roughness={0.9} flatShading />
      </mesh>
      <mesh position={[1.9, -0.55, 0.6]} scale={[0.9, 0.45, 0.8]}>
        <dodecahedronGeometry args={[1.2, 0]} />
        <meshStandardMaterial color="#12314e" roughness={0.9} flatShading />
      </mesh>

      {/* tower in alternating bands */}
      {Array.from({ length: segs }).map((_, i) => {
        const h = towerH / segs;
        const r0 = THREE.MathUtils.lerp(0.72, 0.44, i / segs);
        const r1 = THREE.MathUtils.lerp(0.72, 0.44, (i + 1) / segs);
        return (
          <mesh key={i} position={[0, 0.3 + h * i + h / 2, 0]}>
            <cylinderGeometry args={[r1, r0, h, 24]} />
            <meshStandardMaterial color={stripe[i % 2]} emissive={i % 2 ? '#0a2640' : '#34465a'} roughness={0.6} metalness={0.05} />
          </mesh>
        );
      })}
      {/* gallery */}
      <mesh position={[0, towerH + 0.32, 0]}>
        <cylinderGeometry args={[0.66, 0.66, 0.08, 24]} />
        <meshStandardMaterial color="#0e2740" roughness={0.5} />
      </mesh>
      {/* lantern */}
      <mesh position={[0, LAMP_Y + 0.3, 0]}>
        <cylinderGeometry args={[0.34, 0.34, 0.55, 16]} />
        <meshBasicMaterial color="#fff4dc" />
      </mesh>
      <mesh position={[0, LAMP_Y + 0.8, 0]}>
        <coneGeometry args={[0.46, 0.5, 16]} />
        <meshStandardMaterial color="#0e2740" roughness={0.5} />
      </mesh>
      <pointLight ref={lamp} position={[0, LAMP_Y + 0.3, 0]} color="#ffeccc" intensity={6} distance={14} decay={1.6} />

      <group position={[0, LAMP_Y + 0.3, 0]}>
        <mesh ref={glow} material={glowMat}>
          <planeGeometry args={[6, 6]} />
        </mesh>
        <group ref={beam}>
          <mesh geometry={beamGeo} material={beamMat} rotation={[0, 0, -0.05]} />
          <mesh geometry={beamGeo} material={beamMat} rotation={[0, Math.PI, -0.05]} />
        </group>
        <group ref={rings}>
          {ringMats.map((m, i) => (
            <mesh key={i} material={m} rotation={[-Math.PI / 2, 0, 0]}>
              <ringGeometry args={[0.98, 1, 96]} />
            </mesh>
          ))}
        </group>
      </group>
    </group>
  );
}
