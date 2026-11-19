import * as THREE from "three";
import { getLive, subscribe } from "../feed";
import { LANG_COLORS } from "../../lib/github";
import { disposeScene, type Chapter, type Ctx } from "./types";

const ON_BLACK: Record<string, string> = { Lua: "#5b7bff", C: "#a8b9cc", Kotlin: "#a97bff", PHP: "#7b8cde", Dockerfile: "#4fa3c7", Shell: "#89e051" };
export const langColor = (name: string) => ON_BLACK[name] ?? LANG_COLORS[name] ?? "#c9c9d1";
const ease = (x: number) => x * x * (3 - 2 * x);
const clamp01 = (x: number) => Math.min(1, Math.max(0, x));

export const isMobile = () => matchMedia("(max-width: 760px), (pointer: coarse)").matches;
export function shownLangs<T extends { bytes: number }>(langs: T[]) {
  const total = langs.reduce((a, l) => a + l.bytes, 0) || 1;
  return langs.filter((l) => l.bytes > 0).map((l) => ({ ...l, share: l.bytes / total }));
}

export function stackFocus(lp: number, n: number) {
  if (n === 0 || lp < 0.1) return -1;
  return Math.min(n - 1, Math.floor(((lp - 0.1) / 0.78) * n));
}

const NOISE = `
vec3 hash3(vec3 p){ p = vec3(dot(p, vec3(127.1, 311.7, 74.7)), dot(p, vec3(269.5, 183.3, 246.1)), dot(p, vec3(113.5, 271.9, 124.6))); return -1.0 + 2.0 * fract(sin(p) * 43758.5453123); }
float noise(vec3 p){
  vec3 i = floor(p), f = fract(p), u = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(dot(hash3(i), f), dot(hash3(i + vec3(1,0,0)), f - vec3(1,0,0)), u.x),
                 mix(dot(hash3(i + vec3(0,1,0)), f - vec3(0,1,0)), dot(hash3(i + vec3(1,1,0)), f - vec3(1,1,0)), u.x), u.y),
             mix(mix(dot(hash3(i + vec3(0,0,1)), f - vec3(0,0,1)), dot(hash3(i + vec3(1,0,1)), f - vec3(1,0,1)), u.x),
                 mix(dot(hash3(i + vec3(0,1,1)), f - vec3(0,1,1)), dot(hash3(i + vec3(1,1,1)), f - vec3(1,1,1)), u.x), u.y), u.z);
}
float fbm(vec3 p){ float a = 0.5, s = 0.0; for (int i = 0; i < 5; i++) { s += a * noise(p); p *= 2.03; a *= 0.5; } return s; }
`;

const SPHERE_VERT = `
varying vec3 vN; varying vec3 vW; varying vec3 vP;
void main(){
  vP = position;
  vec4 w = modelMatrix * vec4(position, 1.0);
  vW = w.xyz;
  vN = normalize(mat3(modelMatrix) * normal);
  gl_Position = projectionMatrix * viewMatrix * w;
}`;

const SUN_FRAG = `
uniform float uTime;
varying vec3 vN; varying vec3 vW; varying vec3 vP;
${NOISE}
void main(){
  vec3 p = normalize(vP);
  float n = fbm(p * 3.2 + vec3(0.0, uTime * 0.12, uTime * 0.07));
  float cells = fbm(p * 9.0 - vec3(uTime * 0.2)) * 0.5;
  float h = clamp(0.55 + n * 0.9 + cells, 0.0, 1.0);
  vec3 col = mix(vec3(0.9, 0.25, 0.02), vec3(1.0, 0.72, 0.25), smoothstep(0.2, 0.6, h));
  col = mix(col, vec3(1.0, 0.97, 0.85), smoothstep(0.6, 0.95, h));
  float fres = dot(normalize(vN), normalize(cameraPosition - vW));
  col *= 0.55 + 0.6 * pow(max(fres, 0.0), 0.5);
  gl_FragColor = vec4(col * 1.35, 1.0);
}`;

const PLANET_FRAG = `
uniform vec3 uColor; uniform vec3 uSun; uniform float uTime; uniform float uGas; uniform float uSeed; uniform float uSel;
varying vec3 vN; varying vec3 vW; varying vec3 vP;
${NOISE}
void main(){
  vec3 n = normalize(vN);
  vec3 L = normalize(uSun - vW);
  vec3 V = normalize(cameraPosition - vW);
  vec3 p = normalize(vP) + uSeed;
  vec3 dark = uColor * 0.32, light = mix(uColor, vec3(1.0), 0.35);
  vec3 surf;
  if (uGas > 0.5) {
    float warp = fbm(p * 2.2 + vec3(uTime * 0.03, 0.0, 0.0));
    float band = sin((normalize(vP).y + warp * 0.35) * 18.0 + uSeed * 6.0) * 0.5 + 0.5;
    float storm = smoothstep(0.62, 0.7, fbm(p * 5.0)) * 0.5;
    surf = mix(dark, light, band * 0.75 + 0.15) + storm * light * 0.4;
  } else {
    float h = fbm(p * 3.5);
    float craters = smoothstep(0.08, 0.0, abs(fbm(p * 9.0) - 0.05)) * 0.35;
    surf = mix(dark, uColor, smoothstep(-0.25, 0.35, h)) - craters * 0.25;
    surf = mix(surf, light, smoothstep(0.35, 0.6, h) * 0.5);
  }
  float diff = dot(n, L);
  float day = smoothstep(-0.15, 0.35, diff);
  vec3 col = surf * (0.1 + 1.0 * day);
  vec3 H = normalize(L + V);
  col += vec3(1.0) * pow(max(dot(n, H), 0.0), uGas > 0.5 ? 24.0 : 60.0) * (uGas > 0.5 ? 0.12 : 0.35) * day;
  float rim = pow(1.0 - max(dot(n, V), 0.0), 3.0);
  col += uColor * rim * (0.25 + 0.9 * smoothstep(-0.4, 0.6, diff)) * (0.7 + uSel * 0.8);
  gl_FragColor = vec4(col, 1.0);
}`;

const ATMO_FRAG = `
uniform vec3 uColor; uniform vec3 uSun; uniform float uSel;
varying vec3 vN; varying vec3 vW; varying vec3 vP;
void main(){
  vec3 n = normalize(vN);
  vec3 V = normalize(cameraPosition - vW);
  float lit = smoothstep(-0.5, 0.6, dot(n, normalize(uSun - vW)));
  float a = pow(1.0 - abs(dot(n, V)), 2.6) * lit * (0.55 + uSel * 0.9);
  gl_FragColor = vec4(uColor * a, a);
}`;

const TRAIL_VERT = `varying vec2 vL; void main(){ vL = position.xy; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
const TRAIL_FRAG = `
uniform vec3 uColor; uniform float uAngle; uniform float uSel;
varying vec2 vL;
void main(){
  float a = atan(vL.y, vL.x);
  float d = mod(a - uAngle, 6.2831853);
  float tail = exp(-d * 1.6);
  float alpha = 0.05 + tail * (0.55 + uSel * 0.45);
  gl_FragColor = vec4(uColor * (0.6 + tail), alpha);
}`;

const RING_FRAG = `
uniform vec3 uColor; uniform vec3 uSun; uniform float uIn; uniform float uOut;
varying vec2 vL; varying vec3 vW;
float h(float x){ return fract(sin(x * 91.7) * 43758.5); }
void main(){
  float r = (length(vL) - uIn) / (uOut - uIn);
  float bands = 0.55 + 0.45 * sin(r * 70.0) * sin(r * 23.0 + 1.3);
  float gaps = smoothstep(0.0, 0.03, abs(r - 0.62)) * smoothstep(0.0, 0.02, abs(r - 0.33));
  float edge = smoothstep(0.0, 0.06, r) * smoothstep(1.0, 0.9, r);
  float lit = 0.35 + 0.65 * smoothstep(-0.2, 0.5, dot(normalize(vec3(0.0, 1.0, 0.0)), normalize(uSun - vW)) + 0.5);
  float a = bands * gaps * edge * 0.75;
  gl_FragColor = vec4(mix(uColor, vec3(1.0, 0.95, 0.85), 0.4) * lit, a);
}`;
const RING_VERT = `varying vec2 vL; varying vec3 vW; void main(){ vL = position.xy; vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`;

const SKY_FRAG = `
uniform float uTime;
varying vec3 vN; varying vec3 vW; varying vec3 vP;
${NOISE}
void main(){
  vec3 d = normalize(vP);
  float n1 = fbm(d * 2.2 + vec3(0.0, 0.0, uTime * 0.004));
  float n2 = fbm(d * 4.5 + 7.0);
  vec3 col = vec3(0.004, 0.004, 0.012);
  col += vec3(0.18, 0.06, 0.32) * smoothstep(0.05, 0.6, n1) * 0.55;
  col += vec3(0.02, 0.16, 0.26) * smoothstep(0.1, 0.65, n2) * 0.45;
  col += vec3(0.35, 0.12, 0.08) * smoothstep(0.35, 0.8, n1 * n2 * 2.0) * 0.3;
  gl_FragColor = vec4(col, 1.0);
}`;

const STAR_VERT = `
attribute float aSize; attribute float aSeed; uniform float uTime; uniform float uPx; varying float vA;
void main(){
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vA = 0.55 + 0.45 * sin(uTime * (0.8 + aSeed * 2.5) + aSeed * 40.0);
  gl_PointSize = aSize * uPx * (60.0 / -mv.z);
  gl_Position = projectionMatrix * mv;
}`;
const STAR_FRAG = `varying float vA; void main(){ float d = length(gl_PointCoord - 0.5); float a = smoothstep(0.5, 0.0, d); gl_FragColor = vec4(vec3(0.85, 0.9, 1.0) * a * vA, a * vA); }`;

function radialTexture(stops: [number, string][], size = 256) {
  const cv = document.createElement("canvas");
  cv.width = cv.height = size;
  const g = cv.getContext("2d")!;
  const grad = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  stops.forEach(([o, c]) => grad.addColorStop(o, c));
  g.fillStyle = grad; g.fillRect(0, 0, size, size);
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function raysTexture(size = 512) {
  const cv = document.createElement("canvas");
  cv.width = cv.height = size;
  const g = cv.getContext("2d")!;
  g.translate(size / 2, size / 2);
  for (let i = 0; i < 28; i++) {
    g.rotate((Math.PI * 2) / 28 + Math.sin(i * 12.9) * 0.05);
    const len = size * (0.28 + ((Math.sin(i * 7.3) + 1) / 2) * 0.22);
    const grad = g.createLinearGradient(0, 0, len, 0);
    grad.addColorStop(0, "rgba(255,210,140,0.35)"); grad.addColorStop(1, "rgba(255,180,90,0)");
    g.fillStyle = grad;
    g.beginPath(); g.moveTo(0, -3); g.lineTo(len, 0); g.lineTo(0, 3); g.fill();
  }
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function label(text: string, color: string) {
  const cv = document.createElement("canvas");
  cv.width = 512; cv.height = 96;
  const g = cv.getContext("2d")!;
  g.font = "600 40px ui-monospace, Menlo, monospace";
  const w = g.measureText(text).width + 56;
  const x0 = 256 - w / 2;
  g.fillStyle = "rgba(4,4,10,0.72)";
  g.beginPath(); g.roundRect(x0, 18, w, 60, 30); g.fill();
  g.strokeStyle = color; g.globalAlpha = 0.55; g.lineWidth = 2; g.stroke(); g.globalAlpha = 1;
  g.fillStyle = color; g.beginPath(); g.arc(x0 + 28, 48, 7, 0, 7); g.fill();
  g.fillStyle = "#ffffff"; g.textBaseline = "middle"; g.fillText(text, x0 + 44, 50);
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, depthTest: false, sizeAttenuation: false }));
  sp.scale.set(0.2, 0.0375, 1);
  sp.renderOrder = 10;
  return sp;
}

type U = Record<string, THREE.IUniform>;
type Planet = {
  name: string; group: THREE.Group; ball: THREE.Mesh; tag: THREE.Sprite; r: number; speed: number; phase: number; size: number;
  pu: U; au: U; tu: U; sel: number;
};

export function createStack(ctx: Ctx): Chapter {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color("#010103");
  const camera = new THREE.PerspectiveCamera(44, 1, 0.1, 400);
  scene.add(new THREE.AmbientLight("#9aa3ff", 0.12));
  const sunLight = new THREE.PointLight("#ffd9a0", 80, 40, 1.2);
  scene.add(sunLight);
  const sunWorld = new THREE.Vector3();

  const skyU = { uTime: { value: 0 } };
  scene.add(new THREE.Mesh(new THREE.SphereGeometry(180, 48, 32), new THREE.ShaderMaterial({ uniforms: skyU, vertexShader: SPHERE_VERT, fragmentShader: SKY_FRAG, side: THREE.BackSide, depthWrite: false })));

  const N = ctx.mobile ? 1600 : 3600;
  const sp = new Float32Array(N * 3), sz = new Float32Array(N), sd = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    const u = Math.random() * 2 - 1, a = Math.random() * Math.PI * 2, r = 60 + Math.random() * 100, s = Math.sqrt(1 - u * u);
    sp.set([Math.cos(a) * s * r, u * r, Math.sin(a) * s * r], i * 3);
    sz[i] = Math.pow(Math.random(), 6) * 3.2 + 0.5;
    sd[i] = Math.random();
  }
  const starGeo = new THREE.BufferGeometry();
  starGeo.setAttribute("position", new THREE.BufferAttribute(sp, 3));
  starGeo.setAttribute("aSize", new THREE.BufferAttribute(sz, 1));
  starGeo.setAttribute("aSeed", new THREE.BufferAttribute(sd, 1));
  const starU = { uTime: { value: 0 }, uPx: { value: Math.min(devicePixelRatio, 2) } };
  scene.add(new THREE.Points(starGeo, new THREE.ShaderMaterial({ uniforms: starU, vertexShader: STAR_VERT, fragmentShader: STAR_FRAG, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })));

  const system = new THREE.Group();
  system.rotation.x = 0.12;
  scene.add(system);

  const sunU = { uTime: { value: 0 } };
  const sun = new THREE.Mesh(new THREE.SphereGeometry(0.75, 64, 48), new THREE.ShaderMaterial({ uniforms: sunU, vertexShader: SPHERE_VERT, fragmentShader: SUN_FRAG }));
  system.add(sun);
  const glow = (tex: THREE.Texture, s: number, o: number) => {
    const m = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, opacity: o, depthWrite: false, blending: THREE.AdditiveBlending }));
    m.scale.setScalar(s);
    system.add(m);
    return m;
  };
  const corona = glow(radialTexture([[0, "rgba(255,240,200,1)"], [0.18, "rgba(255,190,90,0.75)"], [0.4, "rgba(255,120,40,0.22)"], [1, "rgba(255,80,20,0)"]]), 4.2, 0.9);
  const halo = glow(radialTexture([[0, "rgba(255,170,90,0.35)"], [0.5, "rgba(140,70,255,0.08)"], [1, "rgba(0,0,0,0)"]]), 16, 0.8);
  const rays = glow(raysTexture(), 7.5, 0.55);

  let planets: Planet[] = [];
  let belt: THREE.InstancedMesh | null = null;

  const build = () => {
    const langs = getLive().stack;
    if (!langs || planets.length) return;
    const all = shownLangs(langs);
    const step = Math.max(0.55, Math.min(1.05, 9.5 / Math.max(1, all.length)));
    const ringFor = all.length > 1 ? 1 : 0;
    planets = all.map((l, i) => {
      const share = l.share, color = new THREE.Color(langColor(l.name));
      const r = 2.5 + i * step, size = 0.14 + Math.sqrt(share) * 0.85;
      const gas = size > 0.42 ? 1 : 0;

      const tu = { uColor: { value: color }, uAngle: { value: 0 }, uSel: { value: 0 } };
      const trail = new THREE.Mesh(new THREE.RingGeometry(r - 0.012, r + 0.012, 256, 1), new THREE.ShaderMaterial({
        uniforms: tu, vertexShader: TRAIL_VERT, fragmentShader: TRAIL_FRAG, transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending,
      }));
      trail.rotation.x = -Math.PI / 2;
      system.add(trail);

      const group = new THREE.Group();
      const pu = { uColor: { value: color }, uSun: { value: sunWorld }, uTime: { value: 0 }, uGas: { value: gas }, uSeed: { value: i * 3.17 + 0.5 }, uSel: { value: 0 } };
      const ball = new THREE.Mesh(new THREE.SphereGeometry(size, 64, 48), new THREE.ShaderMaterial({ uniforms: pu, vertexShader: SPHERE_VERT, fragmentShader: PLANET_FRAG }));
      ball.rotation.z = 0.2 + Math.sin(i * 4.1) * 0.25;
      const au = { uColor: { value: color.clone().lerp(new THREE.Color("#ffffff"), 0.25) }, uSun: { value: sunWorld }, uSel: { value: 0 } };
      const atmo = new THREE.Mesh(new THREE.SphereGeometry(size * 1.16, 48, 32), new THREE.ShaderMaterial({
        uniforms: au, vertexShader: SPHERE_VERT, fragmentShader: ATMO_FRAG, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.BackSide,
      }));
      ball.add(atmo);
      if (i === ringFor && gas) {
        const rin = size * 1.35, rout = size * 2.3;
        const ring = new THREE.Mesh(new THREE.RingGeometry(rin, rout, 128, 1), new THREE.ShaderMaterial({
          uniforms: { uColor: { value: color }, uSun: { value: sunWorld }, uIn: { value: rin }, uOut: { value: rout } },
          vertexShader: RING_VERT, fragmentShader: RING_FRAG, transparent: true, depthWrite: false, side: THREE.DoubleSide,
        }));
        ring.rotation.x = -Math.PI / 2 + 0.42;
        ball.add(ring);
      }
      const tag = label(`${l.name} ${(share * 100).toFixed(share < 0.01 ? 1 : 0)}%`, `#${color.getHexString()}`);
      tag.position.y = size + 0.42;
      group.add(ball, tag);
      system.add(group);
      return { name: l.name, group, ball, tag, r, size, speed: 0.5 / Math.sqrt(r), phase: i * 2.4 + 0.6, pu, au, tu, sel: 0 };
    });

    if (planets.length >= 4) {
      const inner = planets[2].r, outer = planets[3].r;
      const count = ctx.mobile ? 280 : 640;
      belt = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 0), new THREE.MeshStandardMaterial({ color: "#8a8a99", roughness: 1, flatShading: true }), count);
      const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), p = new THREE.Vector3(), s = new THREE.Vector3();
      for (let k = 0; k < count; k++) {
        const a = Math.random() * Math.PI * 2, rr = inner + 0.25 + Math.random() * (outer - inner - 0.5);
        p.set(Math.cos(a) * rr, (Math.random() - 0.5) * 0.12, Math.sin(a) * rr);
        q.setFromEuler(e.set(Math.random() * 3, Math.random() * 3, Math.random() * 3));
        s.setScalar(0.012 + Math.pow(Math.random(), 3) * 0.05);
        belt.setMatrixAt(k, m.compose(p, q, s));
      }
      system.add(belt);
    }
  };
  build();
  const unsub = subscribe(build);

  const look = new THREE.Vector3(), tmp = new THREE.Vector3();
  const camUp = new THREE.Vector3(0, 1, 0), invSys = new THREE.Quaternion();
  const focusPos = new THREE.Vector3(), base = new THREE.Vector3(), close = new THREE.Vector3(), centre = new THREE.Vector3();
  const camPos = new THREE.Vector3(), camTarget = new THREE.Vector3(), lookTarget = new THREE.Vector3(), par = new THREE.Vector2();
  let zoom = 0, outAngle = 0, hasFocus = false, camInit = false;
  return {
    scene, camera,
    update(lp, time, dt, mouse) {
      const active = stackFocus(lp, planets.length);
      const t = ctx.reduced ? 0 : time;
      camUp.set(0, 1, 0).applyQuaternion(camera.quaternion).applyQuaternion(invSys.copy(system.quaternion).invert());
      const k = 1 - Math.exp(-6 * dt);
      sun.getWorldPosition(sunWorld);
      sunLight.position.copy(sunWorld);
      sunU.uTime.value = t;
      skyU.uTime.value = t;
      starU.uTime.value = t;
      sun.rotation.y = t * 0.05;
      rays.material.rotation = t * 0.02;
      corona.scale.setScalar(4.2 + Math.sin(t * 1.7) * 0.12);
      halo.scale.setScalar(16 + Math.sin(t * 0.6) * 0.5);
      if (belt) belt.rotation.y = t * 0.012;

      planets.forEach((p, i) => {
        const a = p.phase + t * p.speed * 0.35;
        p.group.position.set(Math.cos(a) * p.r, 0, Math.sin(a) * p.r);
        p.ball.rotation.y = t * (0.25 + (i % 3) * 0.1);
        const on = i === active ? 1 : 0;
        p.sel += (on - p.sel) * k;
        const target = active < 0 ? 1 : on ? 1.4 : 0.88;
        p.ball.scale.setScalar(THREE.MathUtils.lerp(p.ball.scale.x || 1, target, k));
        p.tag.position.copy(camUp).multiplyScalar(p.size * p.ball.scale.x * 1.2 + 0.28);
        p.pu.uTime.value = t;
        p.pu.uSel.value = p.sel;
        p.au.uSel.value = p.sel;
        p.tu.uAngle.value = -a;
        p.tu.uSel.value = active < 0 ? 0.35 : p.sel;
        const tm = p.tag.material as THREE.SpriteMaterial;
        tm.opacity = THREE.MathUtils.lerp(tm.opacity, on ? 1 : active < 0 ? (i < 8 ? 0.95 : 0.35) : 0.16, k);
      });

      const want = active >= 0 && planets[active] ? planets[active].group.getWorldPosition(tmp) : null;
      const travel = want ? clamp01(focusPos.distanceTo(want) / 5) : 0;
      zoom += ((want ? 1 - travel * 0.45 : 0) - zoom) * (1 - Math.exp(-2.2 * dt));
      if (want) {
        if (!hasFocus) { focusPos.copy(want); hasFocus = true; }
        focusPos.lerp(want, 1 - Math.exp(-2.6 * dt));
      }
      const desired = Math.atan2(focusPos.z - sunWorld.z, focusPos.x - sunWorld.x) + Math.PI - 0.65;
      outAngle += Math.atan2(Math.sin(desired - outAngle), Math.cos(desired - outAngle)) * (1 - Math.exp(-2.4 * dt));

      const outer = (planets.at(-1)?.r ?? 8) + 1.5;
      const portrait = camera.aspect < 1;
      const wide = outer * (portrait ? 3.1 : 1.75);
      const intro = ease(clamp01(lp / 0.12));
      par.lerp(mouse, 1 - Math.exp(-2 * dt));
      const orbit = 0.4 + lp * 0.8 + par.x * 0.12;
      base.set(Math.sin(orbit) * wide, wide * THREE.MathUtils.lerp(0.95, 0.5, intro) + par.y * 0.4, Math.cos(orbit) * wide);
      close.set(Math.cos(outAngle) * 7.5, 3.4 + par.y * 0.3, Math.sin(outAngle) * 7.5).add(focusPos);
      const z = ease(zoom);
      camTarget.lerpVectors(base, close, z * 0.75);
      centre.set(portrait ? 0 : -outer * 0.25, 0, 0);
      lookTarget.lerpVectors(centre, focusPos, z * 0.8);
      if (!camInit) { camPos.copy(camTarget); look.copy(lookTarget); camInit = true; }
      camPos.lerp(camTarget, 1 - Math.exp(-3.2 * dt));
      look.lerp(lookTarget, 1 - Math.exp(-3.8 * dt));
      camera.position.copy(camPos);
      camera.lookAt(look);
    },
    dispose: () => { unsub(); disposeScene(scene); },
  };
}
