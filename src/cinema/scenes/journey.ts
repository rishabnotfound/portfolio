import * as THREE from "three";
import { disposeScene, type Chapter, type Ctx } from "./types";

const vert = `
varying vec3 vW; varying vec3 vN; varying vec3 vSeed;
void main(){
  vec4 w = modelMatrix * instanceMatrix * vec4(position, 1.0);
  vW = w.xyz;
  vN = normalize(mat3(modelMatrix * instanceMatrix) * normal);
  vSeed = instanceMatrix[3].xyz;
  gl_Position = projectionMatrix * viewMatrix * w;
}`;

const frag = `
varying vec3 vW; varying vec3 vN; varying vec3 vSeed;
uniform vec3 uCam; uniform vec3 uFog; uniform vec3 uSky; uniform float uTime;
float hash(vec3 p){ return fract(sin(dot(p, vec3(12.9898, 78.233, 37.719))) * 43758.5453); }
void main(){
  vec3 n = normalize(vN);
  vec3 base = vec3(0.035, 0.07, 0.13) * (0.7 + 0.6 * hash(floor(vSeed * 3.0)));
  float diff = 0.25 + 1.1 * max(0.0, dot(n, normalize(vec3(-sign(vW.x) * 0.6, 1.0, 0.3)))) - 0.2 * max(0.0, -n.y);
  vec3 c = base * diff;
  float facing = abs(n.x);
  vec2 wp = vec2(vW.z, vW.y) * vec2(4.5, 3.4);
  vec2 f = fract(wp);
  float frame = step(0.18, f.x) * step(f.x, 0.82) * step(0.22, f.y) * step(f.y, 0.78);
  float lit = step(0.9, hash(vec3(floor(wp), floor(vSeed.x * 7.0))));
  float flick = 0.85 + 0.15 * sin(uTime * 3.0 + hash(vec3(floor(wp), 1.0)) * 30.0);
  c = mix(c, vec3(0.03, 0.05, 0.09), frame * facing * 0.7);
  c += vec3(0.85, 0.92, 1.0) * frame * lit * facing * flick;
  float d = length(vW - uCam);
  float fogAmt = smoothstep(4.0, 45.0, d);
  float toSky = smoothstep(0.0, 40.0, vW.y - uCam.y) * (1.0 - smoothstep(1.5, 7.0, abs(vW.x)));
  vec3 fogCol = mix(uFog, uSky, toSky * 0.9);
  gl_FragColor = vec4(mix(c, fogCol, fogAmt), 1.0);
}`;

export function createJourney(ctx: Ctx): Chapter {
  const scene = new THREE.Scene();
  const FOG = new THREE.Color("#0b1d33");
  const SKY = new THREE.Color("#b9dcf2");
  scene.background = FOG;
  const camera = new THREE.PerspectiveCamera(62, 1, 0.1, 120);

  const uniforms = {
    uCam: { value: new THREE.Vector3() }, uFog: { value: FOG }, uSky: { value: SKY }, uTime: { value: 0 },
  };
  const mat = new THREE.ShaderMaterial({ vertexShader: vert, fragmentShader: frag, uniforms });
  const geo = new THREE.BoxGeometry(1, 1, 1);
  const COUNT = ctx.mobile ? 1400 : 2600;
  const blocks = new THREE.InstancedMesh(geo, mat, COUNT);
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), p = new THREE.Vector3(), s = new THREE.Vector3();
  for (let i = 0; i < COUNT; i++) {
    const side = i % 2 ? 1 : -1;
    const y = -30 + Math.random() * 90;
    const z = -34 + Math.random() * 48;
    const depth = 1.5 + Math.random() * 4;
    const setback = Math.pow(Math.random(), 2.2) * 2.4;
    const gap = 1.6 + 0.6 * Math.sin(y * 0.11) + 0.4 * Math.sin(z * 0.3);
    p.set(side * (gap + setback + depth / 2), y, z);
    s.set(depth, 0.6 + Math.random() * 3.2, 0.8 + Math.random() * 3.5);
    blocks.setMatrixAt(i, m.compose(p, q, s));
  }
  scene.add(blocks);
  for (const side of [-1, 1]) {
    const wall = new THREE.InstancedMesh(geo, mat, 1);
    wall.setMatrixAt(0, m.compose(p.set(side * 7.5, 15, -10), q, s.set(4, 120, 60)));
    scene.add(wall);
  }

  const sky = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), new THREE.MeshBasicMaterial({ color: SKY, fog: false }));
  sky.rotation.x = Math.PI / 2;
  sky.position.y = 62;
  scene.add(sky);

  const look = new THREE.Vector3();
  return {
    scene, camera,
    update(lp, time, _dt, mouse) {
      const y = -22 + lp * 48;
      camera.position.set(mouse.x * 0.3, y, mouse.y * 0.3);
      const tip = Math.min(1, Math.max(0, (lp - 0.55) / 0.45));
      look.set(Math.sin(tip * 1.2) * 4, y + 10 * (1 - tip) + 1.5, -10 * tip - 0.01);
      camera.up.set(Math.sin(-0.35 - lp * 1.4), 0, Math.cos(-0.35 - lp * 1.4)).normalize();
      camera.lookAt(look);
      uniforms.uCam.value.copy(camera.position);
      uniforms.uTime.value = time;
    },
    dispose: () => disposeScene(scene),
  };
}
