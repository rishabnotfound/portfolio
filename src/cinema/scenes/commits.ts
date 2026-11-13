import * as THREE from "three";
import { getLive, subscribe, type Day } from "../feed";
import { disposeScene, type Chapter, type Ctx } from "./types";

const vert = `
attribute float aH;
attribute float aLvl;
attribute float aCol;
uniform float uGrow;
varying vec2 vUv; varying vec3 vN; varying vec3 vW; varying float vLvl; varying float vTop;
void main(){
  float g = clamp(uGrow * 1.8 - aCol / 53.0 * 0.8, 0.0, 1.0);
  g = g * g * (3.0 - 2.0 * g);
  vec3 p = position;
  p.y *= mix(0.04, aH, g);
  vTop = step(0.99, position.y);
  vec4 w = modelMatrix * instanceMatrix * vec4(p, 1.0);
  vW = w.xyz; vUv = uv; vLvl = aLvl;
  vN = normalize(mat3(modelMatrix * instanceMatrix) * normal);
  gl_Position = projectionMatrix * viewMatrix * w;
}`;

const frag = `
varying vec2 vUv; varying vec3 vN; varying vec3 vW; varying float vLvl; varying float vTop;
uniform vec3 uCam; uniform float uTime;
vec3 lvl(float l){
  if (l < 0.5) return vec3(0.012, 0.03, 0.02);
  if (l < 1.5) return vec3(0.0, 0.09, 0.03);
  if (l < 2.5) return vec3(0.0, 0.2, 0.06);
  if (l < 3.5) return vec3(0.03, 0.42, 0.1);
  return vec3(0.08, 0.85, 0.2);
}
void main(){
  vec3 base = lvl(vLvl);
  float diff = 0.45 + 0.55 * max(0.0, dot(normalize(vN), normalize(vec3(0.4, 1.0, 0.6))));
  vec3 c = base * diff;
  vec2 e = min(vUv, 1.0 - vUv);
  float edge = 1.0 - smoothstep(0.0, 0.06, min(e.x, e.y));
  c += (base * 2.2 + vec3(0.02, 0.06, 0.03)) * edge * (vLvl > 0.5 ? 1.0 : 0.35);
  c += base * vTop * 0.8;
  float d = length(vW - uCam);
  vec3 fog = vec3(0.0, 0.012, 0.006);
  gl_FragColor = vec4(mix(c, fog, smoothstep(10.0, 46.0, d)), 1.0);
}`;

const groundFrag = `
varying vec3 vW; uniform vec3 uCam;
void main(){
  vec2 g = abs(fract(vW.xz) - 0.5);
  float line = smoothstep(0.47, 0.5, max(g.x, g.y));
  vec3 c = vec3(0.0, 0.01, 0.005) + vec3(0.0, 0.12, 0.05) * line;
  float d = length(vW - uCam);
  gl_FragColor = vec4(mix(c, vec3(0.0, 0.012, 0.006), smoothstep(8.0, 40.0, d)), 1.0);
}`;

export const WEEKS = 53;

export function weekSummary(days: Day[], col: number) {
  const lastDow = new Date(days[days.length - 1].date + "T00:00:00Z").getUTCDay();
  const start = days.length - 1 - lastDow - (WEEKS - 1 - col) * 7;
  const week = days.slice(Math.max(0, start), start + 7);
  if (!week.length) return null;
  const label = new Date(week[0].date + "T00:00:00Z").toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" }).toUpperCase();
  return { label, count: week.reduce((a, d) => a + d.count, 0) };
}

export function weekAt(lp: number) {
  return Math.min(WEEKS - 1, Math.max(0, Math.round(camX(lp))));
}
function camX(lp: number) {
  return -3 + Math.min(1, Math.max(0, (lp - 0.1) / 0.85)) * (WEEKS + 1);
}

export function createCommits(ctx: Ctx): Chapter {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color("#000301");
  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 120);

  const geo = new THREE.BoxGeometry(0.78, 1, 0.78);
  geo.translate(0, 0.5, 0);
  const N = WEEKS * 7;
  const aH = new Float32Array(N), aLvl = new Float32Array(N), aCol = new Float32Array(N);
  geo.setAttribute("aH", new THREE.InstancedBufferAttribute(aH, 1));
  geo.setAttribute("aLvl", new THREE.InstancedBufferAttribute(aLvl, 1));
  geo.setAttribute("aCol", new THREE.InstancedBufferAttribute(aCol, 1));
  const uniforms = { uGrow: { value: 0 }, uCam: { value: new THREE.Vector3() }, uTime: { value: 0 } };
  const bars = new THREE.InstancedMesh(geo, new THREE.ShaderMaterial({ vertexShader: vert, fragmentShader: frag, uniforms }), N);
  const m = new THREE.Matrix4();
  for (let i = 0; i < N; i++) {
    const col = Math.floor(i / 7), row = i % 7;
    bars.setMatrixAt(i, m.makeTranslation(col, 0, row));
    aCol[i] = col;
    aH[i] = 0.1 + Math.random() * 0.3;
  }
  scene.add(bars);

  const groundU = { uCam: uniforms.uCam };
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), new THREE.ShaderMaterial({
    uniforms: groundU, fragmentShader: groundFrag,
    vertexShader: "varying vec3 vW; void main(){ vec4 w = modelMatrix * vec4(position,1.); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }",
  }));
  ground.rotation.x = -Math.PI / 2;
  ground.position.set(WEEKS / 2, -0.001, 3);
  scene.add(ground);

  function apply(days: Day[]) {
    const lastDow = new Date(days[days.length - 1].date + "T00:00:00Z").getUTCDay();
    const offset = N - 1 - (6 - lastDow);
    for (let i = 0; i < N; i++) { aH[i] = 0.06; aLvl[i] = 0; }
    days.forEach((d, k) => {
      const slot = offset - (days.length - 1 - k);
      if (slot < 0 || slot >= N) return;
      aH[slot] = 0.12 + Math.log2(1 + d.count) * 0.75;
      aLvl[slot] = d.level;
    });
    (geo.attributes.aH as THREE.BufferAttribute).needsUpdate = true;
    (geo.attributes.aLvl as THREE.BufferAttribute).needsUpdate = true;
    grow = 0;
  }
  let applied: Day[] | undefined;
  const sync = () => {
    const d = getLive().days;
    if (d && d !== applied) { applied = d; apply(d); }
  };
  sync();
  const unsub = subscribe(sync);

  let grow = 0;
  const look = new THREE.Vector3();
  return {
    scene, camera,
    update(lp, time, dt, mouse) {
      grow = Math.min(1, grow + dt * (lp > 0 ? 0.6 : 0));
      if (ctx.reduced) grow = 1;
      uniforms.uGrow.value = grow;
      const x = camX(lp);
      const descend = Math.min(1, lp / 0.15);
      const portrait = camera.aspect < 1 ? 1.6 : 1;
      camera.position.set(x - 4 + mouse.x * 0.6, (16 - descend * 10.5) * portrait + mouse.y * 0.4, 13 * portrait);
      look.set(x + 3, 0.5, 3);
      camera.lookAt(look);
      uniforms.uCam.value.copy(camera.position);
      uniforms.uTime.value = time;
    },
    dispose: () => { unsub(); disposeScene(scene); },
  };
}
