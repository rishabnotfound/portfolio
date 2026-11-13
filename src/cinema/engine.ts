import * as THREE from "three";
import { createPost, type PortalPath } from "./post";
import { ORDER, type Located, type Timeline } from "./timeline";
import type { Project } from "./data";
import type { Chapter, Ctx } from "./scenes/types";
import { createHero } from "./scenes/hero";
import { createWork } from "./scenes/work";
import { createAbout } from "./scenes/about";
import { createJourney } from "./scenes/journey";
import { createContact } from "./scenes/contact";
import { createCommits } from "./scenes/commits";
import { createSignal } from "./scenes/signal";

const PORTALS: PortalPath[] = [
  { from: [0.26, -0.3], rot: 0.22, scale: 0.22 },
  { from: [0.18, -0.36], rot: -0.08, scale: 0.3 },
  { from: [0.0, -0.4], rot: 0.0, scale: 0.42 },
  { from: [-0.22, 0.24], rot: -0.3, scale: 0.24 },
  { from: [0.04, 0.02], rot: 0.55, scale: 0.12 },
  { from: [0.08, 0.02], rot: 0.0, scale: 0.26 },
];

export type Frame = Located & { p: number; velocity: number };

export async function startEngine(canvas: HTMLCanvasElement, projects: Project[], tl: Timeline, onFrame: (f: Frame) => void) {
  const mobile = matchMedia("(max-width: 760px), (pointer: coarse)").matches;
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const ctx: Ctx = { mobile, reduced };

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: "high-performance" });
  const dpr = Math.min(window.devicePixelRatio || 1, mobile ? 1.5 : 1.75);
  renderer.setPixelRatio(dpr);

  const hero = await createHero(ctx);
  const make = {
    hero: () => hero, work: () => createWork(ctx, projects), about: () => createAbout(ctx), commits: () => createCommits(ctx),
    journey: () => createJourney(ctx), signal: () => createSignal(ctx), contact: () => createContact(),
  };
  const chapters: Chapter[] = ORDER.map((k) => make[k]());

  const rtOpts = { type: THREE.HalfFloatType, depthBuffer: true, samples: mobile ? 0 : 4 };
  const rtA = new THREE.WebGLRenderTarget(1, 1, rtOpts);
  const rtB = new THREE.WebGLRenderTarget(1, 1, rtOpts);
  const post = createPost();
  post.mat.uniforms.tA.value = rtA.texture;
  post.mat.uniforms.tB.value = rtB.texture;

  let W = 1, H = 1;
  function resize() {
    W = window.innerWidth; H = window.innerHeight;
    renderer.setSize(W, H, false);
    rtA.setSize(W * dpr, H * dpr);
    rtB.setSize(W * dpr, H * dpr);
    chapters.forEach((c) => { c.camera.aspect = W / H; c.camera.updateProjectionMatrix(); });
    post.mat.uniforms.uAspect.value = W / H;
    post.mat.uniforms.uRes.value.set(W, H);
    post.mat.uniforms.uBarrel.value = mobile ? 0.1 : 0.18;
  }
  resize();
  window.addEventListener("resize", resize);

  const mouse = new THREE.Vector2();
  const onMove = (e: PointerEvent) => {
    if (e.pointerType === "touch") return;
    mouse.set((e.clientX / W) * 2 - 1, -((e.clientY / H) * 2 - 1));
  };
  const onTilt = (e: DeviceOrientationEvent) => {
    if (e.gamma == null || e.beta == null) return;
    mouse.set(THREE.MathUtils.clamp(e.gamma / 25, -1, 1), THREE.MathUtils.clamp((45 - e.beta) / 25, -1, 1));
  };
  window.addEventListener("pointermove", onMove, { passive: true });
  window.addEventListener("deviceorientation", onTilt, { passive: true });

  let p = window.scrollY / H, prevP = p, vel = 0, glitch = 0;
  let last = performance.now(), raf = 0, running = true;
  const t0 = last;

  function frame(now: number) {
    if (!running) return;
    raf = requestAnimationFrame(frame);
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    const time = (now - t0) / 1000;
    const target = window.scrollY / H;
    p += (target - p) * (1 - Math.exp(-7 * dt));
    vel += ((Math.abs(p - prevP) / Math.max(dt, 1e-3)) - vel) * 0.2;
    prevP = p;

    const loc = tl.locate(p);
    const cur = chapters[loc.i];
    cur.update(loc.lp, time, dt, mouse);
    renderer.setRenderTarget(rtA);
    renderer.render(cur.scene, cur.camera);
    if (loc.t > 0) {
      const next = chapters[loc.i + 1];
      next.update(0, time, dt, mouse);
      renderer.setRenderTarget(rtB);
      renderer.render(next.scene, next.camera);
      post.setPortal(loc.t, PORTALS[loc.i], W / H);
    } else {
      post.mat.uniforms.uT.value = 0;
    }

    const bump = loc.t > 0 ? Math.sin(loc.t * Math.PI) * 0.6 : 0;
    const goal = reduced ? 0 : Math.min(1, vel * 0.5 + bump);
    glitch += (goal - glitch) * (1 - Math.exp(-6 * dt));
    post.mat.uniforms.uGlitch.value = glitch;
    post.mat.uniforms.uTime.value = reduced ? 0 : time;
    renderer.setRenderTarget(null);
    renderer.render(post.scene, post.camera);

    onFrame({ ...loc, p, velocity: vel });
  }

  const onVis = () => {
    if (document.hidden) { running = false; cancelAnimationFrame(raf); }
    else if (!running) { running = true; last = performance.now(); raf = requestAnimationFrame(frame); }
  };
  document.addEventListener("visibilitychange", onVis);
  raf = requestAnimationFrame(frame);

  return () => {
    running = false;
    cancelAnimationFrame(raf);
    window.removeEventListener("resize", resize);
    window.removeEventListener("pointermove", onMove);
    window.removeEventListener("deviceorientation", onTilt);
    document.removeEventListener("visibilitychange", onVis);
    chapters.forEach((c) => c.dispose());
    rtA.dispose(); rtB.dispose(); post.dispose();
    renderer.dispose();
  };
}
