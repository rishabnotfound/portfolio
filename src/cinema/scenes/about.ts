import * as THREE from "three";
import { disposeScene, type Chapter, type Ctx } from "./types";

const FOG = new THREE.Color("#030406");

const ledVert = `
attribute vec3 aColor;
attribute float aPhase;
varying vec3 vColor;
varying float vFog;
uniform float uTime;
void main(){
  float on = step(0.35, fract(uTime * (0.6 + aPhase * 2.5) + aPhase * 7.0));
  vColor = aColor * (0.25 + 1.6 * on);
  vec4 mv = modelViewMatrix * instanceMatrix * vec4(position, 1.0);
  vFog = smoothstep(2.0, 22.0, -mv.z);
  gl_Position = projectionMatrix * mv;
}`;
const ledFrag = `
varying vec3 vColor; varying float vFog; uniform vec3 uFog;
void main(){ gl_FragColor = vec4(mix(vColor, uFog, vFog), 1.0); }`;

const floorFrag = `
varying vec3 vW;
uniform float uTime; uniform vec3 uFog; uniform vec3 uCam;
float hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
void main(){
  vec2 p = vW.xz;
  vec2 tile = abs(fract(p * 1.6) - 0.5);
  vec3 c = vec3(0.035, 0.04, 0.05) * (0.8 + 0.4 * hash(floor(p * 1.6)));
  c *= 1.0 - smoothstep(0.46, 0.5, max(tile.x, tile.y)) * 0.6;
  float ax = abs(p.x);
  c = mix(c, vec3(0.55, 0.58, 0.62), (1.0 - smoothstep(0.012, 0.02, abs(ax - 0.42))));
  c = mix(c, vec3(0.08, 0.09, 0.1), step(ax, 0.36));
  vec2 q = vec2(abs(p.x) - 0.17, p.y + uTime * 2.2);
  vec2 cell = vec2(0.0, floor(q.y / 0.55));
  vec2 f = vec2(q.x, fract(q.y / 0.55) * 0.55 - 0.27);
  float alive = step(0.35, hash(cell + step(0.0, p.x)));
  float chip = (1.0 - step(0.075, abs(f.x))) * (1.0 - step(0.06, abs(f.y))) * alive;
  float core = (1.0 - step(0.035, abs(f.x))) * (1.0 - step(0.03, abs(f.y))) * alive;
  c = mix(c, vec3(0.75, 0.77, 0.8), chip);
  c = mix(c, vec3(0.15, 1.0, 0.35), core);
  float d = length(vW - uCam);
  gl_FragColor = vec4(mix(c, uFog, smoothstep(3.0, 24.0, d)), 1.0);
}`;

export function createAbout(ctx: Ctx): Chapter {
  const scene = new THREE.Scene();
  scene.background = FOG;
  scene.fog = new THREE.Fog(FOG, 3, 24);
  const camera = new THREE.PerspectiveCamera(58, 1, 0.05, 60);

  const Z0 = 8, Z1 = -46, STEP = 0.72;
  const racksPerSide = Math.floor((Z0 - Z1) / STEP);
  const X = 1.55;

  const rackGeo = new THREE.BoxGeometry(0.66, 2.3, 0.9);
  const rackMat = new THREE.MeshStandardMaterial({ color: "#0d0f12", roughness: 0.45, metalness: 0.75 });
  const racks = new THREE.InstancedMesh(rackGeo, rackMat, racksPerSide * 2);
  const UNITS = ctx.mobile ? 8 : 12;
  const unitGeo = new THREE.BoxGeometry(0.6, 0.12, 0.02);
  const unitMat = new THREE.MeshStandardMaterial({ color: "#2b3036", roughness: 0.35, metalness: 0.85 });
  const units = new THREE.InstancedMesh(unitGeo, unitMat, racksPerSide * 2 * UNITS);
  const LEDS_PER = 3;
  const ledGeo = new THREE.PlaneGeometry(0.022, 0.022);
  const ledCount = racksPerSide * 2 * UNITS * LEDS_PER;
  const leds = new THREE.InstancedMesh(ledGeo, new THREE.ShaderMaterial({
    vertexShader: ledVert, fragmentShader: ledFrag,
    uniforms: { uTime: { value: 0 }, uFog: { value: FOG } },
  }), ledCount);
  const aColor = new Float32Array(ledCount * 3);
  const aPhase = new Float32Array(ledCount);
  const palette = [[0.1, 1, 0.3], [0.1, 1, 0.3], [0.2, 0.6, 1], [1, 0.6, 0.1]];

  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(1, 1, 1), v = new THREE.Vector3();
  let r = 0, u = 0, l = 0;
  for (const side of [-1, 1]) {
    q.setFromEuler(new THREE.Euler(0, side < 0 ? Math.PI / 2 : -Math.PI / 2, 0));
    for (let k = 0; k < racksPerSide; k++) {
      const z = Z0 - k * STEP;
      v.set(side * (X + 0.45), 1.15, z);
      racks.setMatrixAt(r++, m.compose(v, q, s));
      for (let j = 0; j < UNITS; j++) {
        const y = 0.25 + j * (1.85 / UNITS);
        v.set(side * (X - 0.012), y, z);
        units.setMatrixAt(u++, m.compose(v, q, s));
        for (let n = 0; n < LEDS_PER; n++) {
          v.set(side * (X - 0.025), y + 0.02, z + side * (-0.24 + n * 0.035));
          leds.setMatrixAt(l, m.compose(v, q, s));
          const c = palette[Math.floor(Math.random() * palette.length)];
          aColor.set(c, l * 3);
          aPhase[l] = Math.random();
          l++;
        }
      }
    }
  }
  leds.geometry.setAttribute("aColor", new THREE.InstancedBufferAttribute(aColor, 3));
  leds.geometry.setAttribute("aPhase", new THREE.InstancedBufferAttribute(aPhase, 1));
  scene.add(racks, units, leds);

  const floorU = { uTime: { value: 0 }, uFog: { value: FOG }, uCam: { value: new THREE.Vector3() } };
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(3.4, Z0 - Z1, 1, 1), new THREE.ShaderMaterial({
    uniforms: floorU, fragmentShader: floorFrag,
    vertexShader: "varying vec3 vW; void main(){ vec4 w = modelMatrix * vec4(position,1.); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }",
  }));
  floor.rotation.x = -Math.PI / 2;
  floor.position.z = (Z0 + Z1) / 2;
  scene.add(floor);

  const cableColors = ["#e8301c", "#f5c518", "#1f6fff", "#ff7a1a", "#e8301c", "#1f6fff"];
  for (const side of [-1, 1]) {
    cableColors.forEach((c, i) => {
      const pts: THREE.Vector3[] = [];
      const x = side * (1.05 + i * 0.05);
      for (let z = Z0; z >= Z1; z -= 0.6) {
        const sag = Math.abs(Math.sin(((z - Z0) / 3.6) * Math.PI));
        pts.push(new THREE.Vector3(x, 2.35 - sag * (0.18 + i * 0.03), z));
      }
      const tube = new THREE.Mesh(
        new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), pts.length * 3, 0.018, 6),
        new THREE.MeshStandardMaterial({ color: c, roughness: 0.35, metalness: 0.1 }),
      );
      scene.add(tube);
    });
  }

  const strip = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.02, Z0 - Z1), new THREE.MeshBasicMaterial({ color: "#dfe8ff" }));
  strip.position.set(0, 2.9, (Z0 + Z1) / 2);
  scene.add(strip);

  scene.add(new THREE.HemisphereLight("#9fb4ff", "#050608", 0.5));
  const lamp = new THREE.PointLight("#e9f0ff", 22, 9, 1.6);
  scene.add(lamp);
  const lamp2 = new THREE.PointLight("#ffffff", 10, 7, 1.6);
  scene.add(lamp2);

  return {
    scene, camera,
    update(lp, time, _dt, mouse) {
      const z = 6 - lp * 30;
      camera.position.set(Math.sin(time * 0.4) * 0.06 + mouse.x * 0.15, 1.25 + mouse.y * 0.08, z);
      camera.lookAt(mouse.x * 0.3, 0.9, z - 6);
      camera.rotation.z += Math.sin(time * 0.3) * 0.01;
      lamp.position.set(0, 2.4, z - 3.5);
      lamp2.position.set(0, 2.2, z + 0.5);
      (leds.material as THREE.ShaderMaterial).uniforms.uTime.value = ctx.reduced ? 0 : time;
      floorU.uTime.value = ctx.reduced ? 0 : time;
      floorU.uCam.value.copy(camera.position);
    },
    dispose: () => disposeScene(scene),
  };
}
