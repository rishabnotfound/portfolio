import * as THREE from "three";
import { getLive, subscribe, type Live } from "../feed";
import { config } from "../../config";
import { disposeScene, type Chapter, type Ctx } from "./types";

const R = 3.7;
const ease = (x: number) => x * x * (3 - 2 * x);
const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const angleOf = (h: number) => (h / 24) * Math.PI * 2;
const at = (h: number, r: number, y = 0) => new THREE.Vector3(Math.sin(angleOf(h)) * r, y, -Math.cos(angleOf(h)) * r);

export function hourColor(h: number) {
  const day = Math.max(0, Math.cos(((h - 13) / 24) * Math.PI * 2));
  return new THREE.Color().setHSL(0.72 - day * 0.62, 0.85, 0.55 + day * 0.08);
}

export function rhythmStats(r: NonNullable<Live["rhythm"]>) {
  const { hours, sample } = r;
  const peak = hours.indexOf(Math.max(...hours));
  const night = Math.round((hours.slice(0, 6).reduce((a, b) => a + b, 0) / sample) * 100);
  const morning = hours.slice(6, 12).reduce((a, b) => a + b, 0) / sample;
  const evening = hours.slice(18).reduce((a, b) => a + b, 0) / sample;
  let quietFrom = 0, quietLen = 0;
  for (let s0 = 0; s0 < 24; s0++) {
    let n = 0;
    while (n < 24 && hours[(s0 + n) % 24] <= Math.max(1, sample * 0.01)) n++;
    if (n > quietLen) { quietLen = n; quietFrom = s0; }
  }
  const verdict = night >= 25 ? "NIGHT OWL" : morning > 0.3 ? "EARLY BIRD" : evening > 0.4 ? "EVENING SHIFT" : "DAYTIME BUILDER";
  return { peak, night, verdict, quietFrom, quietLen };
}


const NOISE = `
float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }`;

const PILLAR_VERT = `
varying float vY; varying vec3 vN; varying vec3 vW;
void main(){
  vY = position.y;
  vec4 w = modelMatrix * vec4(position, 1.0);
  vW = w.xyz; vN = normalize(mat3(modelMatrix) * normal);
  gl_Position = projectionMatrix * viewMatrix * w;
}`;
const PILLAR_FRAG = `
uniform vec3 uColor; uniform float uOn; uniform float uSel; uniform float uDim; uniform float uTime; uniform float uMirror;
varying float vY; varying vec3 vN; varying vec3 vW;
void main(){
  vec3 V = normalize(cameraPosition - vW);
  float rim = pow(1.0 - abs(dot(normalize(vN), V)), 2.0);
  float grad = 0.18 + 0.82 * pow(vY, 1.6);
  float scan = 0.88 + 0.12 * sin(vW.y * 26.0 - uTime * 3.0);
  vec3 col = uColor * (grad * scan * (0.55 + 0.75 * uOn) + rim * 0.8) + vec3(1.0) * smoothstep(0.93, 1.0, vY) * 0.7;
  col += (uColor * 0.8 + vec3(0.25)) * uSel * (0.9 + 0.3 * sin(uTime * 6.0));
  col *= 1.0 - uDim * 0.75;
  float a = uMirror > 0.5 ? 0.28 * (1.0 - vY) : 1.0;
  gl_FragColor = vec4(col, a);
}`;

const FLOOR_FRAG = `
uniform float uTime; uniform float uArcFrom; uniform float uArcLen; uniform float uArcOn; uniform vec3 uArcColor;
varying vec2 vL;
${NOISE}
void main(){
  float r = length(vL);
  float a = atan(vL.x, vL.y);
  float h = mod(a / 6.2831853 * 24.0 + 24.0, 24.0);
  float dayAmt = max(0.0, cos((h - 13.0) / 24.0 * 6.2831853));
  vec3 base = mix(vec3(0.012, 0.01, 0.04), vec3(0.03, 0.02, 0.05), smoothstep(5.5, 0.0, r));
  float ring = smoothstep(0.05, 0.0, abs(r - 4.75)) * 0.55;
  vec3 dn = mix(vec3(0.22, 0.12, 0.6), vec3(1.0, 0.62, 0.22), dayAmt);
  vec3 col = base + dn * ring;
  float grid = smoothstep(0.012, 0.0, abs(fract(r * 1.0) - 0.5) - 0.48) * 0.05;
  float spokes = smoothstep(0.02, 0.0, abs(fract(h) - 0.5) - 0.48) * smoothstep(1.0, 1.3, r) * 0.04;
  col += vec3(0.5, 0.45, 1.0) * (grid + spokes);
  float d = mod(h - uArcFrom + 24.0, 24.0);
  float inArc = step(d, uArcLen) * smoothstep(1.0, 1.6, r) * smoothstep(5.2, 4.6, r);
  col += uArcColor * inArc * uArcOn * (0.5 + 0.12 * sin(uTime * 3.0 + r * 4.0));
  float fade = smoothstep(7.5, 4.8, r);
  gl_FragColor = vec4(col * fade, 0.72);
}`;

const SKY_FRAG = `
uniform vec3 uTop; uniform vec3 uHorizon; varying vec3 vP;
void main(){ float y = normalize(vP).y; gl_FragColor = vec4(mix(uHorizon, uTop, smoothstep(-0.1, 0.6, y)), 1.0); }`;

const SPARK_VERT = `
attribute float aHour; attribute float aSeed; uniform float uTime; uniform float uPx; uniform float uH[24]; uniform float uOn;
varying float vA; varying float vHour;
void main(){
  int hi = int(aHour);
  float hgt = 0.0;
  for (int i = 0; i < 24; i++) if (i == hi) hgt = uH[i];
  float life = fract(uTime * (0.12 + aSeed * 0.18) + aSeed * 7.0);
  float ang = (aHour + 0.5) / 24.0 * 6.2831853 + (aSeed - 0.5) * 0.18;
  float r = ${R.toFixed(2)} + (aSeed - 0.5) * 0.35;
  vec3 p = vec3(sin(ang) * r, hgt + life * (0.6 + hgt * 0.9), -cos(ang) * r);
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  vA = (1.0 - life) * smoothstep(0.0, 0.1, life) * step(0.06, hgt) * uOn;
  vHour = aHour;
  gl_PointSize = (1.4 + aSeed * 2.4) * uPx * (8.0 / -mv.z);
  gl_Position = projectionMatrix * mv;
}`;
const SPARK_FRAG = `
varying float vA; varying float vHour;
void main(){
  float d = length(gl_PointCoord - 0.5); if (d > 0.5) discard;
  float day = max(0.0, cos((vHour - 13.0) / 24.0 * 6.2831853));
  vec3 c = mix(vec3(0.7, 0.55, 1.0), vec3(1.0, 0.8, 0.45), day);
  gl_FragColor = vec4(c * vA, vA * smoothstep(0.5, 0.0, d));
}`;

function glowSprite(inner: string, outer: string, size: number, fixed = false) {
  const cv = document.createElement("canvas");
  cv.width = cv.height = 128;
  const g = cv.getContext("2d")!;
  const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  gr.addColorStop(0, "#ffffff"); gr.addColorStop(0.18, inner); gr.addColorStop(0.45, outer); gr.addColorStop(1, "rgba(0,0,0,0)");
  g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: !fixed }));
  sp.scale.setScalar(size);
  return sp;
}

function numeral(text: string, big: boolean) {
  const cv = document.createElement("canvas");
  cv.width = 128; cv.height = 64;
  const g = cv.getContext("2d")!;
  g.font = `${big ? 700 : 500} ${big ? 40 : 28}px ui-monospace, Menlo, monospace`;
  g.fillStyle = big ? "#ffffff" : "#9d93d6"; g.textAlign = "center"; g.textBaseline = "middle";
  g.fillText(text, 64, 32);
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true, depthWrite: false, opacity: big ? 0.95 : 0.6 }));
  sp.scale.set(big ? 0.72 : 0.5, big ? 0.36 : 0.25, 1);
  return sp;
}

export function createHours(ctx: Ctx): Chapter {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 120);
  scene.add(new THREE.AmbientLight("#8b7cff", 0.35));

  const skyU = { uTop: { value: new THREE.Color("#05041a") }, uHorizon: { value: new THREE.Color("#140b33") } };
  scene.add(new THREE.Mesh(new THREE.SphereGeometry(60, 32, 16), new THREE.ShaderMaterial({
    uniforms: skyU, side: THREE.BackSide, depthWrite: false, fragmentShader: SKY_FRAG,
    vertexShader: "varying vec3 vP; void main(){ vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }",
  })));

  const starGeo = new THREE.BufferGeometry();
  const sp = new Float32Array(1200 * 3);
  for (let i = 0; i < 1200; i++) {
    const a = Math.random() * Math.PI * 2, u = Math.random() * 0.9 + 0.05, r = 40 + Math.random() * 15;
    sp.set([Math.cos(a) * Math.sqrt(1 - u * u) * r, u * r, Math.sin(a) * Math.sqrt(1 - u * u) * r], i * 3);
  }
  starGeo.setAttribute("position", new THREE.BufferAttribute(sp, 3));
  const stars = new THREE.Points(starGeo, new THREE.PointsMaterial({ color: "#d9d4ff", size: 0.12, transparent: true, opacity: 0.8, depthWrite: false }));
  scene.add(stars);

  const dial = new THREE.Group();
  scene.add(dial);
  const mirror = new THREE.Group();
  mirror.scale.y = -1;
  scene.add(mirror);

  const floorU = {
    uTime: { value: 0 }, uArcFrom: { value: 0 }, uArcLen: { value: 6 }, uArcOn: { value: 0 }, uArcColor: { value: new THREE.Color("#8b7cff") },
  };
  const floor = new THREE.Mesh(new THREE.CircleGeometry(8, 128), new THREE.ShaderMaterial({
    uniforms: floorU, fragmentShader: FLOOR_FRAG, transparent: true, depthWrite: false,
    vertexShader: "varying vec2 vL; void main(){ vL = position.xy; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }",
  }));
  floor.rotation.x = -Math.PI / 2;
  floor.renderOrder = 1;
  dial.add(floor);

  for (let h = 0; h < 24; h++) {
    const n = numeral(h % 6 === 0 ? String(h).padStart(2, "0") : String(h), h % 6 === 0);
    n.position.copy(at(h, 5.35, 0.18));
    dial.add(n);
  }

  const pillarGeo = new THREE.BoxGeometry(0.46, 1, 0.46, 1, 12, 1);
  pillarGeo.translate(0, 0.5, 0);
  const pillars = Array.from({ length: 24 }, (_, h) => {
    const color = hourColor(h);
    const u = { uColor: { value: color }, uOn: { value: 0 }, uSel: { value: 0 }, uDim: { value: 0 }, uTime: { value: 0 }, uMirror: { value: 0 } };
    const mat = new THREE.ShaderMaterial({ uniforms: u, vertexShader: PILLAR_VERT, fragmentShader: PILLAR_FRAG });
    const m = new THREE.Mesh(pillarGeo, mat);
    m.position.copy(at(h + 0.5, R));
    m.rotation.y = -angleOf(h + 0.5);
    dial.add(m);
    const mu = { ...u, uMirror: { value: 1 } };
    const mm = new THREE.Mesh(pillarGeo, new THREE.ShaderMaterial({ uniforms: mu, vertexShader: PILLAR_VERT, fragmentShader: PILLAR_FRAG, transparent: true, depthWrite: false, side: THREE.DoubleSide }));
    mm.position.copy(m.position);
    mm.rotation.copy(m.rotation);
    mirror.add(mm);
    const cap = glowSprite(`#${color.getHexString()}`, `#${color.clone().multiplyScalar(0.4).getHexString()}`, 0.9);
    dial.add(cap);
    return { m, mm, u, cap, target: 0.03, h: 0.001 };
  });

  const tileGeo = new THREE.BoxGeometry(1, 1, 1);
  tileGeo.translate(0, 0.5, 0);
  const tiles = new THREE.InstancedMesh(tileGeo, new THREE.MeshStandardMaterial({ roughness: 0.4, metalness: 0.15, emissive: "#ffffff", emissiveIntensity: 0.0 }), 7 * 24);
  const tileColors = new Float32Array(7 * 24 * 3);
  for (let k = 0; k < 7 * 24; k++) new THREE.Color("#1a1733").toArray(tileColors, k * 3);
  tiles.instanceColor = new THREE.InstancedBufferAttribute(tileColors, 3);
  dial.add(tiles);
  const tileH = Array(7 * 24).fill(0.02);
  const ringR = (d: number) => 1.35 + d * 0.27;

  const N = ctx.mobile ? 360 : 800;
  const sh = new Float32Array(N), ss = new Float32Array(N);
  for (let i = 0; i < N; i++) { sh[i] = i % 24; ss[i] = Math.random(); }
  const sparkGeo = new THREE.BufferGeometry();
  sparkGeo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(N * 3), 3));
  sparkGeo.setAttribute("aHour", new THREE.BufferAttribute(sh, 1));
  sparkGeo.setAttribute("aSeed", new THREE.BufferAttribute(ss, 1));
  const sparkU = { uTime: { value: 0 }, uPx: { value: Math.min(devicePixelRatio, 2) }, uH: { value: Array(24).fill(0) }, uOn: { value: 0 } };
  const sparks = new THREE.Points(sparkGeo, new THREE.ShaderMaterial({ uniforms: sparkU, vertexShader: SPARK_VERT, fragmentShader: SPARK_FRAG, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
  sparks.frustumCulled = false;
  dial.add(sparks);

  const hub = new THREE.Mesh(new THREE.CylinderGeometry(1.05, 1.15, 0.12, 64), new THREE.MeshStandardMaterial({ color: "#0d0b1f", metalness: 0.1, roughness: 0.85 }));
  hub.position.y = 0.06;
  dial.add(hub);
  const hubRim = new THREE.Mesh(new THREE.TorusGeometry(1.1, 0.018, 8, 96), new THREE.MeshBasicMaterial({ color: "#8b7cff" }));
  hubRim.rotation.x = Math.PI / 2;
  hubRim.position.y = 0.125;
  dial.add(hubRim);
  const hand = new THREE.Group();
  const beam = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.03, 4.6), new THREE.MeshBasicMaterial({ color: "#22ff00" }));
  beam.position.set(0, 0.16, -2.3);
  const tip = glowSprite("#22ff00", "#0a4d00", 0.7);
  tip.position.set(0, 0.16, -4.6);
  hand.add(beam, tip);
  dial.add(hand);

  const sun = glowSprite("#ffe2a8", "#ff8a2a", 0.11, true);
  const moon = glowSprite("#e4e0ff", "#5a4dff", 0.075, true);
  scene.add(sun, moon);
  const keyLight = new THREE.PointLight("#ffffff", 18, 18, 1.4);
  scene.add(keyLight);

  let stats: ReturnType<typeof rhythmStats> | null = null;
  const apply = () => {
    const r = getLive().rhythm;
    if (!r) return;
    stats = rhythmStats(r);
    const max = Math.max(1, ...r.hours);
    r.hours.forEach((n, h) => (pillars[h].target = 0.03 + (n / max) * 2.9));
    const gmax = Math.max(1, ...r.grid.flat());
    r.grid.forEach((row, d) => row.forEach((n, h) => {
      const k = d * 24 + h;
      tileH[k] = 0.02 + (n / gmax) * 0.9;
      const c = n ? hourColor(h).multiplyScalar(0.35 + 0.65 * (n / gmax)) : new THREE.Color("#1a1733");
      c.toArray(tileColors, k * 3);
    }));
    tiles.instanceColor!.needsUpdate = true;
  };
  apply();
  const unsub = subscribe(apply);

  floorU.uArcFrom.value = 0;
  floorU.uArcLen.value = 6;
  const fmt = new Intl.DateTimeFormat("en-GB", { timeZone: config.person.timezone, hour: "numeric", minute: "numeric", hourCycle: "h23" });
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), pv = new THREE.Vector3(), sv = new THREE.Vector3();
  const camPos = new THREE.Vector3(), camTarget = new THREE.Vector3(), look = new THREE.Vector3(), lookTarget = new THREE.Vector3(), par = new THREE.Vector2();
  const right = new THREE.Vector3();
  let grow = 0, init = false, lastClock = -1, nowH = 0;
  const night = new THREE.Color("#05041a"), nightH = new THREE.Color("#140b33"), dayTop = new THREE.Color("#1c3a7a"), dayH = new THREE.Color("#c8763a");

  return {
    scene, camera,
    update(lp, time, dt, mouse) {
      const t = ctx.reduced ? 0 : time;
      grow = ctx.reduced ? 1 : lp <= 0 ? 0 : Math.min(1, grow + dt * 0.45);

      if (time - lastClock > 1 || lastClock < 0) {
        lastClock = time;
        const [hh, mm] = fmt.format(new Date()).split(":").map(Number);
        nowH = hh + mm / 60;
        const dayAmt = Math.max(0, Math.cos(((nowH - 13) / 24) * Math.PI * 2));
        skyU.uTop.value.copy(night).lerp(dayTop, dayAmt);
        skyU.uHorizon.value.copy(nightH).lerp(dayH, dayAmt * 0.8);
        (stars.material as THREE.PointsMaterial).opacity = 0.85 * (1 - dayAmt);
      }
      hand.rotation.y = -angleOf(nowH);
      sun.position.copy(at(nowH, 7.6, 4.2));
      moon.position.copy(at(nowH + 12, 7.6, 3.8));
      keyLight.position.copy(sun.position).setY(4);

      pillars.forEach((p, h) => {
        const k = ease(clamp01(grow * 26 - h));
        p.h = Math.max(0.001, p.target * k);
        p.m.scale.y = p.h;
        p.mm.scale.y = p.h;
        p.cap.position.copy(at(h + 0.5, R, p.h + 0.05));
        (p.cap.material as THREE.SpriteMaterial).opacity = 0.25 + 0.6 * clamp01(p.h / 2.5);
        p.u.uOn.value = 1;
        p.u.uSel.value = THREE.MathUtils.lerp(p.u.uSel.value, stats?.peak === h ? 0.45 : 0, 1 - Math.exp(-3 * dt));
        p.u.uTime.value = t;
        sparkU.uH.value[h] = p.h;
      });
      sparkU.uTime.value = t;
      sparkU.uOn.value = clamp01(grow * 2);

      for (let d = 0; d < 7; d++) for (let h = 0; h < 24; h++) {
        const k = d * 24 + h;
        const g = ease(clamp01(grow * 26 - h - d * 0.4));
        const r = ringR(d), w = (Math.PI * 2 * r) / 24 * 0.82;
        pv.copy(at(h + 0.5, r));
        q.setFromEuler(e.set(0, -angleOf(h + 0.5), 0));
        sv.set(w, Math.max(0.001, tileH[k] * g), 0.22);
        tiles.setMatrixAt(k, m4.compose(pv, q, sv));
      }
      tiles.instanceMatrix.needsUpdate = true;

      floorU.uTime.value = t;
      floorU.uArcOn.value = clamp01(grow * 1.5) * 0.7;

      par.lerp(mouse, 1 - Math.exp(-2 * dt));
      const portrait = camera.aspect < 1;
      const tilt = ease(clamp01(lp / 0.55));
      const dist = portrait ? 23 : 12;
      const orbit = -0.6 + lp * 1.6;
      const elev = THREE.MathUtils.lerp(1.4, 0.55, tilt) + par.y * 0.05;
      camTarget.set(Math.sin(orbit) * Math.cos(elev) * dist, Math.sin(elev) * dist, -Math.cos(orbit) * Math.cos(elev) * dist);
      camTarget.applyAxisAngle(new THREE.Vector3(0, 1, 0), par.x * 0.12);
      lookTarget.set(0, 0.4, 0);
      if (portrait) lookTarget.addScaledVector(right.set(0, 1, 0).applyQuaternion(camera.quaternion), -4.6);
      else lookTarget.addScaledVector(right.set(1, 0, 0).applyQuaternion(camera.quaternion).setY(0).normalize(), -1.4);
      if (!init) { camPos.copy(camTarget); look.copy(lookTarget); init = true; }
      camPos.lerp(camTarget, 1 - Math.exp(-2.4 * dt));
      look.lerp(lookTarget, 1 - Math.exp(-2.8 * dt));
      camera.position.copy(camPos);
      camera.lookAt(look);
    },
    dispose: () => { unsub(); disposeScene(scene); },
  };
}
