import * as THREE from "three";
import { crtMaterial } from "../crt";
import { CW, CH, discordCard, leetcodeCard, githubCard, linkedinCard } from "../cards";
import { disposeScene, type Chapter, type Ctx } from "./types";
import { config } from "../../config";

const ALL_CARDS = {
  discord: { paint: discordCard, glow: "#da0149" },
  leetcode: { paint: leetcodeCard, glow: "#ffa116" },
  github: { paint: githubCard, glow: "#39d353" },
  linkedin: { paint: linkedinCard, glow: "#0a66c2" },
};
export const SIGNAL_CARDS = config.signal.cards.map((key) => ({ key, ...ALL_CARDS[key] }));

const W = 1.5, H = 2.0;
const OVERVIEW = 0.14, TOUR_END = 0.76;
const ease = (x: number) => x * x * (3 - 2 * x);

export function signalFocus(lp: number) {
  if (lp < OVERVIEW) return -1;
  const n = SIGNAL_CARDS.length;
  const raw = Math.min(0.999, (lp - OVERVIEW) / (TOUR_END - OVERVIEW)) * n - 0.5;
  const base = Math.max(0, Math.floor(raw));
  return Math.min(n - 1, base + ease(Math.min(1, Math.max(0, (raw - base - 0.55) / 0.45))));
}

const glowFrag = `
varying vec2 vUv; uniform vec3 uColor; uniform float uAmt;
void main(){ float d = length(vUv - 0.5) * 2.0; gl_FragColor = vec4(uColor * pow(max(0.0, 1.0 - d), 2.2) * uAmt, 1.0); }`;

export function createSignal(ctx: Ctx): Chapter {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color("#030303");
  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 60);
  const tanHalf = Math.tan(THREE.MathUtils.degToRad(21));

  const plane = new THREE.PlaneGeometry(W, H);
  const glowGeo = new THREE.PlaneGeometry(W * 2.6, H * 2.2);
  const cards = SIGNAL_CARDS.map((c, i) => {
    const cv = document.createElement("canvas");
    cv.width = CW; cv.height = CH;
    const g = cv.getContext("2d")!;
    const tex = new THREE.CanvasTexture(cv);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 8;
    const { material, uniforms } = crtMaterial(tex, CW / CH);
    const group = new THREE.Group();
    const glowU = { uColor: { value: new THREE.Color(c.glow) }, uAmt: { value: 0.3 } };
    const glow = new THREE.Mesh(glowGeo, new THREE.ShaderMaterial({
      uniforms: glowU, fragmentShader: glowFrag, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      vertexShader: "varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }",
    }));
    glow.position.z = -0.3;
    group.add(glow, new THREE.Mesh(plane, material));
    scene.add(group);
    const paint = (now: number) => { g.save(); c.paint(g, now); g.restore(); tex.needsUpdate = true; };
    paint(Date.now());
    return { group, uniforms, glowU, paint, phase: i * 1.7 };
  });

  const floor = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), new THREE.MeshStandardMaterial({ color: "#060606", roughness: 0.2, metalness: 0.7 }));
  floor.rotation.x = -Math.PI / 2;
  scene.add(floor, new THREE.AmbientLight("#ffffff", 0.15));

  function layout(portrait: boolean, time: number) {
    cards.forEach((c, i) => {
      const bob = ctx.reduced ? 0 : Math.sin(time * 0.8 + c.phase) * 0.03;
      if (portrait) {
        c.group.position.set(((i % 2) - 0.5) * (W + 0.2), (0.5 - Math.floor(i / 2)) * (H + 0.25) + bob, 0);
        c.group.rotation.set(0, 0, 0);
      } else {
        const o = i - (cards.length - 1) / 2;
        c.group.position.set(o * (W + 0.35), bob, -Math.abs(o) * 0.25);
        c.group.rotation.set(0, -o * 0.12, 0);
      }
    });
    floor.position.y = portrait ? -H * 1.45 : -H * 0.68;
  }

  const target = new THREE.Vector3(), a = new THREE.Vector3(), b = new THREE.Vector3();
  let f = -1, lastPaint = 0, lastActive = 0;
  return {
    scene, camera,
    update(lp, time, dt, mouse) {
      const portrait = camera.aspect < 1;
      layout(portrait, time);
      f += (signalFocus(lp) - f) * (1 - Math.exp(-5 * dt));

      const halfW = portrait ? W + 0.3 : (cards.length * (W + 0.35)) / 2 + 0.2;
      const halfH = portrait ? H + 0.4 : H / 2 + 0.35;
      const wideZ = Math.max(halfH / tanHalf, halfW / (tanHalf * camera.aspect));
      const closeZ = Math.max(1.18 / tanHalf, (W / 2 / 0.88) / (tanHalf * camera.aspect));

      const zoom = ease(Math.min(1, Math.max(0, f + 1)));
      const k = Math.max(0, f);
      const i0 = Math.floor(k), i1 = Math.min(cards.length - 1, i0 + 1);
      cards[i0].group.getWorldPosition(a);
      cards[i1].group.getWorldPosition(b);
      target.lerpVectors(a, b, ease(k - i0)).multiplyScalar(zoom);
      camera.position.set(target.x + mouse.x * 0.1, target.y + mouse.y * 0.08, THREE.MathUtils.lerp(wideZ, target.z + closeZ, zoom));
      camera.lookAt(target);

      const active = Math.round(k);
      cards.forEach((c, i) => {
        const focus = zoom < 0.5 ? 1 : Math.max(0, 1 - Math.abs(i - k) * 1.5);
        c.uniforms.uFocus.value = 0.35 + 0.65 * focus;
        c.uniforms.uTime.value = time;
        c.uniforms.uGlitch.value = zoom > 0.5 ? Math.min(1, Math.abs(k - Math.round(k)) * 3) : 0;
        c.glowU.uAmt.value = 0.12 + 0.35 * focus;
      });
      if (time - lastPaint > 0.25 || active !== lastActive) {
        const everyone = Math.floor(time) !== Math.floor(lastPaint) || zoom < 0.5;
        lastPaint = time; lastActive = active;
        const now = Date.now();
        cards.forEach((c, i) => (everyone || i === active) && c.paint(now));
      }
    },
    dispose: () => disposeScene(scene),
  };
}
